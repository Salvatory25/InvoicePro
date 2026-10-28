# InvoicePro — Deployment, Security, Operations & Handover Guide

## 1. Environment Separation (Development vs. Production)

1. Maintain separate Supabase projects for `development`/`staging` and `production`.
2. Never use production keys or customer data in development or staging environments.
3. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `AI_API_KEY`, or payment webhook secrets in `VITE_*` client variables. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`, and `VITE_DB_MODE` are read by the browser.

---

## 2. Supabase Database & Auth Configuration

### Applying Migrations
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
This applies `supabase/migrations/20261028000001_invoicepro_schema.sql`, creating all 29 tables, indexes, triggers, atomic numbering RPCs, and Row Level Security (RLS) policies.

### Secure Authentication Redirect Configuration
In your Supabase Dashboard (`Authentication -> URL Configuration`):
- **Site URL:** `https://invoicepro.co.tz` (or your production domain)
- **Redirect URLs:**
  - `https://invoicepro.co.tz/login`
  - `https://invoicepro.co.tz/reset-password`
  - `https://invoicepro.co.tz/onboarding`
- Disable wildcard open redirects (`*`).

### Storage Buckets
Create two private buckets in Supabase Storage:
1. `business-logos`: Max file size `512KB`, allowed MIME types `image/png, image/jpeg, image/webp, image/svg+xml`.
2. `authorized-documents`: Private bucket (`public = false`) for expense attachments and generated PDFs, scoped by `business_id` RLS policy.

---

## 3. Hosting, Domain & Edge Functions Setup

1. **Frontend Hosting (Cloudflare Pages / Vercel / Netlify):**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Configure SPA fallback (`/* -> /index.html 200`) so `/app/*`, `/portal/:token`, and `/admin` routes resolve cleanly.
2. **Deploying Supabase Edge Functions:**
   ```bash
   npx supabase functions deploy ai-assistant
   npx supabase functions deploy send-notification
   ```

---

## 4. Email Provider Setup Guide

InvoicePro dispatches transactional emails through `supabase/functions/send-notification`.
1. Verify your sending domain (SPF, DKIM, DMARC) with Resend or your transactional SMTP provider.
2. Set server secrets:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
   npx supabase secrets set EMAIL_FROM_ADDRESS="InvoicePro Billing <billing@invoicepro.co.tz>"
   ```
3. Until `RESEND_API_KEY` is configured, InvoicePro honestly marks email jobs as `failed` (`provider_not_configured`) and never claims an email was delivered.

---

## 5. Payment Provider Integration Checklist (Tanzania Mobile Money & Bank)

- [ ] Register merchant aggregator account (e.g., Selcom, AzamPay, DPO, or Flutterwave Tanzania for M-Pesa, Mixx by Yas, Airtel Money)
- [ ] Configure server-side webhook endpoint verifying HMAC signatures (`PAYMENT_WEBHOOK_SECRET`)
- [ ] Store incoming webhook payloads idempotently in `public.webhook_events` (`UNIQUE (provider, event_id)`)
- [ ] Only mark `payments.verification_status = 'provider_confirmed'` when a signed settlement webhook succeeds; all user-entered payments remain labeled `recorded_manual`.
- [ ] Never collect or store raw payment card numbers or mobile-money PINs in InvoicePro.

---

## 6. Scheduled Jobs (pg_cron / Edge Cron)

Configure a daily cron schedule (`0 6 * * *` Africa/Dar_es_Salaam) to:
1. Transition `issued` or `partially_paid` invoices past `due_date` into `overdue`.
2. Enqueue due/overdue reminders into `public.notification_jobs` using `dedup_key` to prevent duplicates.
3. Automatically suppress any `queued` job whose linked invoice is `paid` (`balance_due = 0`) or `voided`.

---

## 7. Backup and Restore Procedure

### Creating a Verified Logical Backup
```bash
pg_dump --format=custom --no-owner --no-acl \
  --dbname="$SUPABASE_DB_URL" \
  --file="backups/invoicepro_$(date +%Y%m%d_%H%M%S).dump"
```

### Restoring & Verifying a Backup in an Isolated Staging Database
```bash
pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname="$STAGING_DB_URL" \
  "backups/invoicepro_YYYYMMDD_HHMMSS.dump"
```
**Verification Checklist after Restore:**
1. Verify row counts on `businesses`, `invoices`, `payments`, and `audit_logs`.
2. Confirm `SUM(balance_due)` on `invoices` matches pre-backup checksums.
3. Never claim disaster recovery is tested until a restore has been verified against a staging instance.

---

## 8. Monitoring & Incident Response Notes

- **Audit Trail:** All sensitive actions (`invoice.voided`, `credit_note.issued`, `payment.reversed`, `superadmin.business_suspended`, `security.cross_tenant_access_denied`) are logged in `audit_logs`.
- **Incident Response:**
  1. If a compromised user account is suspected, suspend the user or tenant via the Super-Admin Console (`/admin`) with a mandatory audit reason.
  2. Revoke active guest Client Portal links (`client_portal_access.is_revoked = true`).
  3. Rotate Edge Function secrets via `npx supabase secrets set`.

---

## 9. Known Limitations & Externally Dependent Integrations

To maintain full transparency, the following items require live external credentials before operating in production:
1. **Live Email Delivery:** Requires setting `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` in Supabase Edge Function secrets.
2. **Automated WhatsApp Messaging:** InvoicePro generates verified click-to-chat WhatsApp links (`https://wa.me/...`). Automated background WhatsApp delivery requires an approved Meta WhatsApp Business Cloud API token (`WHATSAPP_CLOUD_API_TOKEN`).
3. **Live Payment Gateway Webhooks:** Payments recorded in the UI are explicitly labeled `Manual Entry` (`recorded_manual`) until a live payment aggregator webhook is connected.
4. **TRA EFD / VFD Fiscal Receipts:** Commercial invoices and receipts generated by InvoicePro are non-fiscal commercial documents. Statutory TRA VFD fiscalization requires a separate certified VFD integration module.

