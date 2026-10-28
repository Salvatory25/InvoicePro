-- ============================================================================
-- INVOICEPRO — PRODUCTION POSTGRESQL SCHEMA, ATOMIC RPCS & RLS MIGRATION
-- Target: Supabase PostgreSQL 15+
-- Financial precision: NUMERIC(18, 2) and integer minor units (cents/sene)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE business_role AS ENUM ('owner', 'admin', 'accountant', 'sales', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('mobile_money', 'bank_transfer', 'cash', 'card', 'cheque', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_verification_status AS ENUM ('recorded_manual', 'provider_confirmed', 'reversed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_type AS ENUM ('trialing', 'active', 'past_due', 'grace_period', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. PROFILES & PLATFORM ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. BUSINESSES, SETTINGS, MEMBERSHIPS & INVITATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'TZ',
  default_currency TEXT NOT NULL DEFAULT 'TZS',
  timezone TEXT NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  locale TEXT NOT NULL DEFAULT 'en-TZ',
  tin_number TEXT,
  vrn_number TEXT,
  registration_number TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT DEFAULT 'Dar es Salaam',
  region TEXT,
  postal_code TEXT,
  logo_storage_path TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  suspension_reason TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_settings (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  next_invoice_number INTEGER NOT NULL DEFAULT 1 CHECK (next_invoice_number >= 1),
  quotation_prefix TEXT NOT NULL DEFAULT 'QUO',
  next_quotation_number INTEGER NOT NULL DEFAULT 1 CHECK (next_quotation_number >= 1),
  proforma_prefix TEXT NOT NULL DEFAULT 'PRO',
  next_proforma_number INTEGER NOT NULL DEFAULT 1 CHECK (next_proforma_number >= 1),
  credit_note_prefix TEXT NOT NULL DEFAULT 'CN',
  next_credit_note_number INTEGER NOT NULL DEFAULT 1 CHECK (next_credit_note_number >= 1),
  receipt_prefix TEXT NOT NULL DEFAULT 'RCT',
  next_receipt_number INTEGER NOT NULL DEFAULT 1 CHECK (next_receipt_number >= 1),
  number_padding INTEGER NOT NULL DEFAULT 4 CHECK (number_padding BETWEEN 3 AND 8),
  default_tax_label TEXT NOT NULL DEFAULT 'VAT',
  default_tax_rate NUMERIC(6, 3) NOT NULL DEFAULT 18.000 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),
  tax_identification_label TEXT NOT NULL DEFAULT 'TIN',
  secondary_tax_label TEXT DEFAULT 'VRN',
  decimal_separator TEXT NOT NULL DEFAULT '.',
  thousands_separator TEXT NOT NULL DEFAULT ',',
  default_due_days INTEGER NOT NULL DEFAULT 14 CHECK (default_due_days >= 0),
  default_payment_instructions TEXT NOT NULL DEFAULT 'Lipa Namba / M-Pesa / Bank Transfer',
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  bank_swift TEXT,
  mobile_money_network TEXT DEFAULT 'M-Pesa / Mixx by Yas / Airtel Money',
  mobile_money_number TEXT,
  mobile_money_name TEXT,
  default_invoice_notes TEXT,
  default_terms TEXT,
  enable_projects_module BOOLEAN NOT NULL DEFAULT TRUE,
  enable_ai_assistant BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role business_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.business_memberships(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_memberships_business ON public.business_memberships(business_id) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role business_role NOT NULL DEFAULT 'sales',
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. CLIENTS & PRODUCTS / SERVICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL DEFAULT 'company' CHECK (client_type IN ('individual', 'company')),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  tin_number TEXT,
  vrn_number TEXT,
  billing_address TEXT,
  city TEXT,
  country_code TEXT NOT NULL DEFAULT 'TZ',
  preferred_currency TEXT NOT NULL DEFAULT 'TZS',
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'sw')),
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  reminder_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_business ON public.clients(business_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(business_id, lower(email));

CREATE TABLE IF NOT EXISTS public.products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'service' CHECK (item_type IN ('product', 'service')),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  tax_rate NUMERIC(6, 3) NOT NULL DEFAULT 18.000 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_label TEXT NOT NULL DEFAULT 'VAT',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products_services(business_id, is_archived);

-- ----------------------------------------------------------------------------
-- 5. PROJECTS, CONTRACTS & TIME ENTRIES (Defined prior to Quotations/Invoices for FK)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  currency TEXT NOT NULL DEFAULT 'TZS',
  budget_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (budget_amount >= 0),
  hourly_rate NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (hourly_rate >= 0),
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_business ON public.projects(business_id, status);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  contract_Value NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (contract_value >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
  signed_at TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. QUOTATIONS & ESTIMATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  status quotation_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS',
  exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 1.000000 CHECK (exchange_rate > 0),
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  terms TEXT,
  revision_number INTEGER NOT NULL DEFAULT 1,
  revision_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  accepted_at TIMESTAMPTZ,
  accepted_by_name TEXT,
  accepted_by_email TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_invoice_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, quotation_number)
);

CREATE INDEX IF NOT EXISTS idx_quotations_business_status ON public.quotations(business_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON public.quotations(client_id);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_service_id UUID REFERENCES public.products_services(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_label TEXT NOT NULL DEFAULT 'VAT',
  tax_rate NUMERIC(6, 3) NOT NULL DEFAULT 18.000 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  line_subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00
);

-- ----------------------------------------------------------------------------
-- 7. INVOICES, ITEMS & IMMUTABLE EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS',
  exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 1.000000 CHECK (exchange_rate > 0),
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  credit_notes_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  payment_instructions TEXT,
  notes TEXT,
  terms TEXT,
  payment_promise_date DATE,
  issued_snapshot JSONB, -- Immutable snapshot of issued state
  issued_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_business_status ON public.invoices(business_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(business_id, due_date) WHERE status IN ('issued', 'partially_paid', 'overdue');

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_service_id UUID REFERENCES public.products_services(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_label TEXT NOT NULL DEFAULT 'VAT',
  tax_rate NUMERIC(6, 3) NOT NULL DEFAULT 18.000 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  line_subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS public.invoice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice ON public.invoice_events(invoice_id, created_at DESC);

-- Prevent silent modification of issued financial amounts without credit notes/payments
CREATE OR REPLACE FUNCTION public.enforce_issued_invoice_immutability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'draft' AND (
    NEW.subtotal <> OLD.subtotal OR
    NEW.discount_total <> OLD.discount_total OR
    NEW.tax_total <> OLD.tax_total OR
    NEW.grand_total <> OLD.grand_total OR
    NEW.invoice_number <> OLD.invoice_number OR
    NEW.client_id <> OLD.client_id OR
    NEW.currency <> OLD.currency
  ) THEN
    RAISE EXCEPTION 'Issued invoices cannot have financial totals, numbering, or client silently modified. Issue a credit note or void and re-issue.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issued_invoice_immutability ON public.invoices;
CREATE TRIGGER trg_issued_invoice_immutability
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.enforce_issued_invoice_immutability();

-- ----------------------------------------------------------------------------
-- 8. PROFORMA INVOICES & CREDIT NOTES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  proforma_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'expired', 'converted', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TZS',
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  payment_instructions TEXT,
  converted_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, proforma_number)
);

CREATE TABLE IF NOT EXISTS public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  credit_note_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'voided')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT NOT NULL DEFAULT 'TZS',
  reason TEXT NOT NULL,
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount > 0),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, credit_note_number)
);

-- ----------------------------------------------------------------------------
-- 9. PAYMENTS, ALLOCATIONS & RECEIPTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  allocated_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (allocated_amount >= 0),
  unallocated_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (unallocated_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  payment_method payment_method_type NOT NULL DEFAULT 'mobile_money',
  provider_name TEXT,
  transaction_reference TEXT,
  verification_status payment_verification_status NOT NULL DEFAULT 'recorded_manual',
  notes TEXT,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  payment_method payment_method_type NOT NULL,
  transaction_reference TEXT,
  verification_status payment_verification_status NOT NULL DEFAULT 'recorded_manual',
  is_voided BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (business_id, receipt_number)
);

-- ----------------------------------------------------------------------------
-- 10. EXPENSES & CATEGORIES & BILLABLE TIME ENTRIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, name)
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  payment_method payment_method_type NOT NULL DEFAULT 'mobile_money',
  reference_number TEXT,
  notes TEXT,
  attachment_storage_path TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT FALSE,
  linked_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON public.expenses(business_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  hours NUMERIC(10, 2) NOT NULL CHECK (hours > 0),
  hourly_rate NUMERIC(18, 2) NOT NULL CHECK (hourly_rate >= 0),
  total_amount NUMERIC(18, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'invoiced')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  linked_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  linked_quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. CLIENT PORTAL ACCESS & PAYMENT FOLLOW-UPS / NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'quotation', 'proforma', 'statement')),
  document_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  submitted_payment_ref TEXT,
  submitted_payment_note TEXT,
  submitted_payment_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  enable_email_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  enable_whatsapp_links BOOLEAN NOT NULL DEFAULT TRUE,
  remind_days_before_due INTEGER NOT NULL DEFAULT 3,
  remind_on_due_date BOOLEAN NOT NULL DEFAULT TRUE,
  remind_days_after_due INTEGER[] NOT NULL DEFAULT '{3, 7, 14}',
  suppress_when_paid_or_void BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp_link')),
  reminder_stage TEXT NOT NULL CHECK (reminder_stage IN ('before_due', 'on_due', 'overdue_1', 'overdue_2', 'overdue_3', 'manual')),
  dedup_key TEXT NOT NULL UNIQUE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_preview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'suppressed', 'cancelled')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.notification_jobs(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  provider_status TEXT NOT NULL,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. SUBSCRIPTIONS, ENTITLEMENTS, AUDIT LOGS, SUPPORT & AI USAGE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'free', 'starter', 'professional', 'business'
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  monthly_price_tzs NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  annual_price_tzs NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
  max_invoices_per_month INTEGER NOT NULL,
  max_clients INTEGER NOT NULL,
  max_team_members INTEGER NOT NULL,
  allow_quotations BOOLEAN NOT NULL DEFAULT TRUE,
  allow_projects_time BOOLEAN NOT NULL DEFAULT FALSE,
  allow_ai_assistant BOOLEAN NOT NULL DEFAULT FALSE,
  allow_custom_branding BOOLEAN NOT NULL DEFAULT FALSE,
  allow_csv_exports BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
  status subscription_status_type NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  grace_period_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  verification_mode TEXT NOT NULL DEFAULT 'manual_verified' CHECK (verification_mode IN ('provider_verified', 'manual_verified', 'free_tier')),
  last_payment_reference TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_month TEXT NOT NULL, -- 'YYYY-MM'
  invoices_created INTEGER NOT NULL DEFAULT 0,
  quotations_created INTEGER NOT NULL DEFAULT 0,
  ai_requests_count INTEGER NOT NULL DEFAULT 0,
  emails_sent_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, period_month)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'billing' CHECK (category IN ('billing', 'technical', 'compliance', 'feature_request')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  description TEXT NOT NULL,
  resolution_notes TEXT,
  authorize_admin_diagnostics BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_settings (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  email_provider_configured BOOLEAN NOT NULL DEFAULT FALSE,
  email_sender_domain TEXT,
  whatsapp_cloud_configured BOOLEAN NOT NULL DEFAULT FALSE,
  payment_gateway_configured BOOLEAN NOT NULL DEFAULT FALSE,
  payment_gateway_name TEXT,
  tra_vfd_module_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Kept strictly separate & disabled until verified
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE TABLE IF NOT EXISTS public.ai_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  provider_status TEXT NOT NULL,
  requires_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. ATOMIC DATABASE FUNCTIONS (Document Numbering & Payment Allocation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_next_document_number(
  p_business_id UUID,
  p_doc_type TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_seq INTEGER;
  v_padding INTEGER;
  v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
BEGIN
  -- Verify caller belongs to this business with write role
  IF NOT EXISTS (
    SELECT 1 FROM public.business_memberships
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('owner', 'admin', 'accountant', 'sales')
  ) THEN
    RAISE EXCEPTION 'Unauthorized to generate document numbers for this business';
  END IF;

  -- Lock business_settings row for atomic sequential increment
  SELECT
    CASE p_doc_type
      WHEN 'invoice' THEN invoice_prefix
      WHEN 'quotation' THEN quotation_prefix
      WHEN 'proforma' THEN proforma_prefix
      WHEN 'credit_note' THEN credit_note_prefix
      WHEN 'receipt' THEN receipt_prefix
      ELSE 'DOC'
    END,
    CASE p_doc_type
      WHEN 'invoice' THEN next_invoice_number
      WHEN 'quotation' THEN next_quotation_number
      WHEN 'proforma' THEN next_proforma_number
      WHEN 'credit_note' THEN next_credit_note_number
      WHEN 'receipt' THEN next_receipt_number
      ELSE 1
    END,
    number_padding
  INTO v_prefix, v_seq, v_padding
  FROM public.business_settings
  WHERE business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business settings not found for business %', p_business_id;
  END IF;

  IF p_doc_type = 'invoice' THEN
    UPDATE public.business_settings SET next_invoice_number = next_invoice_number + 1, updated_at = NOW() WHERE business_id = p_business_id;
  ELSIF p_doc_type = 'quotation' THEN
    UPDATE public.business_settings SET next_quotation_number = next_quotation_number + 1, updated_at = NOW() WHERE business_id = p_business_id;
  ELSIF p_doc_type = 'proforma' THEN
    UPDATE public.business_settings SET next_proforma_number = next_proforma_number + 1, updated_at = NOW() WHERE business_id = p_business_id;
  ELSIF p_doc_type = 'credit_note' THEN
    UPDATE public.business_settings SET next_credit_note_number = next_credit_note_number + 1, updated_at = NOW() WHERE business_id = p_business_id;
  ELSIF p_doc_type = 'receipt' THEN
    UPDATE public.business_settings SET next_receipt_number = next_receipt_number + 1, updated_at = NOW() WHERE business_id = p_business_id;
  END IF;

  RETURN v_prefix || '-' || v_year || '-' || lpad(v_seq::TEXT, v_padding, '0');
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & POLICIES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_business_role(
  p_business_id UUID,
  p_allowed_roles business_role[]
) RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_memberships bm
    JOIN public.businesses b ON b.id = bm.business_id
    WHERE bm.business_id = p_business_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = TRUE
      AND b.is_suspended = FALSE
      AND bm.role = ANY(p_allowed_roles)
  );
$$;

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_records ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own profile; super-admins can view non-financial user metadata
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = TRUE));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND is_super_admin = (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()));

-- Tenant Data Isolation: Only active members of a business can read its financial documents
-- Note: Super-admins do NOT get automatic SELECT access on invoices, quotations, payments, clients, or expenses!
CREATE POLICY tenant_read_clients ON public.clients
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales','viewer']::business_role[]));

CREATE POLICY tenant_write_clients ON public.clients
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]));

CREATE POLICY tenant_read_products ON public.products_services
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales','viewer']::business_role[]));

CREATE POLICY tenant_write_products ON public.products_services
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]));

CREATE POLICY tenant_read_quotations ON public.quotations
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales','viewer']::business_role[]));

CREATE POLICY tenant_write_quotations ON public.quotations
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]));

CREATE POLICY tenant_read_invoices ON public.invoices
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales','viewer']::business_role[]));

CREATE POLICY tenant_write_invoices ON public.invoices
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales']::business_role[]));

CREATE POLICY tenant_read_payments ON public.payments
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','sales','viewer']::business_role[]));

CREATE POLICY tenant_write_payments ON public.payments
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant']::business_role[]));

CREATE POLICY tenant_read_expenses ON public.expenses
  FOR SELECT USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant','viewer']::business_role[]));

CREATE POLICY tenant_write_expenses ON public.expenses
  FOR ALL USING (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant']::business_role[]))
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner','admin','accountant']::business_role[]));

CREATE POLICY subscription_plans_public_read ON public.subscription_plans
  FOR SELECT USING (TRUE);

