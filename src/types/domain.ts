import { CurrencyCode } from '../lib/money';

export type LanguageCode = 'en' | 'sw';

export type BusinessRole = 'owner' | 'admin' | 'accountant' | 'sales' | 'viewer';

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'voided';

export type ProformaStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'converted' | 'cancelled';

export type PaymentMethodType = 'mobile_money' | 'bank_transfer' | 'cash' | 'card' | 'cheque' | 'other';

export type PaymentVerificationStatus = 'recorded_manual' | 'provider_confirmed' | 'reversed' | 'refunded';

export type SubscriptionPlanId = 'free' | 'starter' | 'professional' | 'business';

export type SubscriptionStatusType = 'trialing' | 'active' | 'past_due' | 'grace_period' | 'cancelled' | 'expired';

export interface CountryProfile {
  code: 'TZ' | 'KE' | 'UG' | 'RW';
  nameEn: string;
  nameSw: string;
  defaultCurrency: CurrencyCode;
  defaultTimezone: string;
  defaultLocale: string;
  defaultTaxLabel: string;
  defaultTaxRate: string; // Configurable default; not permanently hardcoded
  primaryTaxIdLabel: string;
  secondaryTaxIdLabel: string;
  mobileMoneyNetworks: string[];
  fiscalAuthorityNoteEn: string;
  fiscalAuthorityNoteSw: string;
}

export const EAST_AFRICA_COUNTRIES: Record<'TZ' | 'KE' | 'UG' | 'RW', CountryProfile> = {
  TZ: {
    code: 'TZ',
    nameEn: 'Tanzania',
    nameSw: 'Tanzania',
    defaultCurrency: 'TZS',
    defaultTimezone: 'Africa/Dar_es_Salaam',
    defaultLocale: 'en-TZ',
    defaultTaxLabel: 'VAT',
    defaultTaxRate: '18.00',
    primaryTaxIdLabel: 'TIN (Taxpayer Identification Number)',
    secondaryTaxIdLabel: 'VRN (VAT Registration Number)',
    mobileMoneyNetworks: ['M-Pesa (Vodacom)', 'Mixx by Yas (Tigo Pesa)', 'Airtel Money', 'Halopesa'],
    fiscalAuthorityNoteEn:
      'Commercial invoice / receipt only. Not an automated TRA EFD/VFD fiscal receipt unless issued via an approved TRA VFD integration.',
    fiscalAuthorityNoteSw:
      'Ankara na risiti ya kibiashara pekee. Sio risiti ya kodi ya TRA EFD/VFD isipokuwa imetolewa kupitia mfumo ulioidhinishwa na TRA.',
  },
  KE: {
    code: 'KE',
    nameEn: 'Kenya',
    nameSw: 'Kenya',
    defaultCurrency: 'KES',
    defaultTimezone: 'Africa/Nairobi',
    defaultLocale: 'en-KE',
    defaultTaxLabel: 'VAT',
    defaultTaxRate: '16.00',
    primaryTaxIdLabel: 'KRA PIN',
    secondaryTaxIdLabel: 'VAT Number',
    mobileMoneyNetworks: ['M-Pesa (Safaricom)', 'Airtel Money'],
    fiscalAuthorityNoteEn: 'Commercial invoice only. Separate KRA eTIMS integration is required for fiscal invoices.',
    fiscalAuthorityNoteSw: 'Ankara ya kibiashara pekee. Uunganisho wa KRA eTIMS unahitajika kwa ankara za kodi.',
  },
  UG: {
    code: 'UG',
    nameEn: 'Uganda',
    nameSw: 'Uganda',
    defaultCurrency: 'UGX',
    defaultTimezone: 'Africa/Kampala',
    defaultLocale: 'en-UG',
    defaultTaxLabel: 'VAT',
    defaultTaxRate: '18.00',
    primaryTaxIdLabel: 'URA TIN',
    secondaryTaxIdLabel: 'VAT Reg No',
    mobileMoneyNetworks: ['MTN Mobile Money', 'Airtel Money'],
    fiscalAuthorityNoteEn: 'Commercial invoice only. Separate URA EFRIS integration is required for fiscal documents.',
    fiscalAuthorityNoteSw: 'Ankara ya kibiashara pekee. Uunganisho wa URA EFRIS unahitajika kwa nyaraka za kodi.',
  },
  RW: {
    code: 'RW',
    nameEn: 'Rwanda',
    nameSw: 'Rwanda',
    defaultCurrency: 'RWF',
    defaultTimezone: 'Africa/Kigali',
    defaultLocale: 'en-RW',
    defaultTaxLabel: 'VAT',
    defaultTaxRate: '18.00',
    primaryTaxIdLabel: 'RRA TIN',
    secondaryTaxIdLabel: 'VAT Reg No',
    mobileMoneyNetworks: ['MTN MoMo', 'Airtel Money'],
    fiscalAuthorityNoteEn: 'Commercial invoice only. Separate RRA EBM integration is required for fiscal receipts.',
    fiscalAuthorityNoteSw: 'Ankara ya kibiashara pekee. Uunganisho wa RRA EBM unahitajika kwa risiti za kodi.',
  },
};

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  preferredLanguage: LanguageCode;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  countryCode: 'TZ' | 'KE' | 'UG' | 'RW';
  defaultCurrency: CurrencyCode;
  timezone: string;
  locale: string;
  tinNumber: string;
  vrnNumber: string;
  registrationNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  region: string;
  logoDataUrl?: string;
  isSuspended: boolean;
  suspensionReason?: string;
  createdBy: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  quotationPrefix: string;
  nextQuotationNumber: number;
  proformaPrefix: string;
  nextProformaNumber: number;
  creditNotePrefix: string;
  nextCreditNoteNumber: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  numberPadding: number;
  defaultTaxLabel: string;
  defaultTaxRate: string;
  taxIdentificationLabel: string;
  secondaryTaxLabel: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  defaultDueDays: number;
  defaultPaymentInstructions: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  mobileMoneyNetwork: string;
  mobileMoneyNumber: string;
  mobileMoneyName: string;
  defaultInvoiceNotes: string;
  defaultTerms: string;
  enableProjectsModule: boolean;
  enableAiAssistant: boolean;
}

export interface BusinessMembership {
  id: string;
  businessId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  role: BusinessRole;
  isActive: boolean;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  businessId: string;
  email: string;
  role: BusinessRole;
  tokenHash: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  clientType: 'individual' | 'company';
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  tinNumber: string;
  vrnNumber: string;
  billingAddress: string;
  city: string;
  countryCode: string;
  preferredCurrency: CurrencyCode;
  preferredLanguage: LanguageCode;
  notes: string;
  tags: string[];
  reminderOptOut: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface ProductService {
  id: string;
  businessId: string;
  itemType: 'product' | 'service';
  name: string;
  sku: string;
  description: string;
  unit: string;
  unitPrice: string;
  currency: CurrencyCode;
  taxRate: string;
  taxLabel: string;
  isArchived: boolean;
  createdAt: string;
}

export interface DocumentLineItem {
  id: string;
  productServiceId?: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxLabel: string;
  taxRate: string;
  taxAmount: string;
  lineSubtotal: string;
  lineTotal: string;
}

export interface QuotationRevision {
  revisionNumber: number;
  updatedAt: string;
  updatedBy: string;
  grandTotal: string;
  summary: string;
}

export interface Quotation {
  id: string;
  businessId: string;
  clientId: string;
  projectId?: string;
  quotationNumber: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string;
  currency: CurrencyCode;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  items: DocumentLineItem[];
  notes: string;
  terms: string;
  revisionNumber: number;
  revisionHistory: QuotationRevision[];
  acceptedAt?: string;
  acceptedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceEvent {
  id: string;
  businessId: string;
  invoiceId: string;
  eventType: string;
  actorLabel: string;
  summary: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  quotationId?: string;
  projectId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  creditNotesTotal: string;
  amountPaid: string;
  balanceDue: string;
  items: DocumentLineItem[];
  paymentInstructions: string;
  notes: string;
  terms: string;
  paymentPromiseDate?: string;
  issuedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  issuedSnapshot?: {
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    grandTotal: string;
    issuedAt: string;
    itemsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProformaInvoice {
  id: string;
  businessId: string;
  clientId: string;
  proformaNumber: string;
  status: ProformaStatus;
  issueDate: string;
  validUntil: string;
  currency: CurrencyCode;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  items: DocumentLineItem[];
  notes: string;
  paymentInstructions: string;
  convertedInvoiceId?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  businessId: string;
  invoiceId: string;
  clientId: string;
  creditNoteNumber: string;
  status: 'issued' | 'voided';
  issueDate: string;
  currency: CurrencyCode;
  reason: string;
  subtotal: string;
  taxTotal: string;
  totalAmount: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  clientId: string;
  invoiceId?: string;
  idempotencyKey: string;
  paymentDate: string;
  amount: string;
  allocatedAmount: string;
  unallocatedAmount: string;
  currency: CurrencyCode;
  paymentMethod: PaymentMethodType;
  providerName: string;
  transactionReference: string;
  verificationStatus: PaymentVerificationStatus;
  notes: string;
  reversedAt?: string;
  reversalReason?: string;
  receiptId?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  businessId: string;
  paymentId: string;
  invoiceId?: string;
  clientId: string;
  receiptNumber: string;
  issuedAt: string;
  amount: string;
  currency: CurrencyCode;
  paymentMethod: PaymentMethodType;
  transactionReference: string;
  verificationStatus: PaymentVerificationStatus;
  isVoided: boolean;
}

export interface Expense {
  id: string;
  businessId: string;
  categoryName: string;
  projectId?: string;
  vendorName: string;
  expenseDate: string;
  amount: string;
  taxAmount: string;
  currency: CurrencyCode;
  paymentMethod: PaymentMethodType;
  referenceNumber: string;
  notes: string;
  attachmentName?: string;
  isBillable: boolean;
  linkedInvoiceId?: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'invoiced';
}

export interface Project {
  id: string;
  businessId: string;
  clientId: string;
  name: string;
  code: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  currency: CurrencyCode;
  budgetAmount: string;
  hourlyRate: string;
  startDate: string;
  dueDate: string;
  contractTitle: string;
  milestones: ProjectMilestone[];
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  businessId: string;
  projectId: string;
  clientId: string;
  userId: string;
  entryDate: string;
  description: string;
  hours: string;
  hourlyRate: string;
  totalAmount: string;
  currency: CurrencyCode;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'invoiced';
  linkedInvoiceId?: string;
  createdAt: string;
}

export interface ClientPortalAccessToken {
  id: string;
  businessId: string;
  clientId: string;
  documentType: 'invoice' | 'quotation' | 'proforma';
  documentId: string;
  token: string;
  expiresAt: string;
  isRevoked: boolean;
  accessCount: number;
  submittedPaymentRef?: string;
  submittedPaymentNote?: string;
  submittedPaymentAt?: string;
  createdAt: string;
}

export interface NotificationJob {
  id: string;
  businessId: string;
  invoiceId: string;
  clientId: string;
  channel: 'email' | 'whatsapp_link';
  reminderStage: 'before_due' | 'on_due' | 'overdue_1' | 'overdue_2' | 'overdue_3' | 'manual';
  dedupKey: string;
  recipient: string;
  subject: string;
  bodyPreview: string;
  status: 'queued' | 'sent' | 'failed' | 'suppressed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  scheduledFor: string;
  processedAt?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  nameEn: string;
  nameSw: string;
  monthlyPriceTzs: string;
  annualPriceTzs: string;
  maxInvoicesPerMonth: number;
  maxClients: number;
  maxTeamMembers: number;
  allowQuotations: boolean;
  allowProjectsTime: boolean;
  allowAiAssistant: boolean;
  allowCustomBranding: boolean;
  allowCsvExports: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: SubscriptionPlanId;
  billingInterval: 'monthly' | 'annual';
  status: SubscriptionStatusType;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  verificationMode: 'provider_verified' | 'manual_verified' | 'free_tier';
  lastPaymentReference?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  businessId?: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  businessId: string;
  businessName: string;
  createdBy: string;
  creatorEmail: string;
  subject: string;
  category: 'billing' | 'technical' | 'compliance' | 'feature_request';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  resolutionNotes?: string;
  authorizeAdminDiagnostics: boolean;
  createdAt: string;
}

