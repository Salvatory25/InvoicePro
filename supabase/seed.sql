-- ============================================================================
-- INVOICEPRO — DEVELOPMENT SEED & DEFAULT SUBSCRIPTION PLANS
-- NOTE: Only seeds platform subscription tiers for production; development
-- demo accounts should only be run in local/staging environments.
-- ============================================================================

INSERT INTO public.subscription_plans (
  id, name_en, name_sw, monthly_price_tzs, annual_price_tzs,
  max_invoices_per_month, max_clients, max_team_members,
  allow_quotations, allow_projects_time, allow_ai_assistant,
  allow_custom_branding, allow_csv_exports, is_active
) VALUES
  ('free', 'Free Plan', 'Mpango wa Bure', 0.00, 0.00, 5, 10, 1, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE),
  ('starter', 'Starter Plan', 'Mpango wa Kuanza', 10000.00, 100000.00, 30, 100, 2, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE),
  ('professional', 'Professional Plan', 'Mpango wa Kitaalamu', 25000.00, 250000.00, 250, 1000, 5, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
  ('business', 'Business Plan', 'Mpango wa Biashara', 50000.00, 500000.00, 10000, 10000, 25, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  monthly_price_tzs = EXCLUDED.monthly_price_tzs,
  annual_price_tzs = EXCLUDED.annual_price_tzs,
  max_invoices_per_month = EXCLUDED.max_invoices_per_month,
  max_clients = EXCLUDED.max_clients,
  max_team_members = EXCLUDED.max_team_members,
  updated_at = NOW();

