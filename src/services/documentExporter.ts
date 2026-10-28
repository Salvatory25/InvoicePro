import { formatMoney } from '../lib/money';
import { translateKey } from '../i18n/translations';
import {
  Business,
  BusinessSettings,
  Client,
  Invoice,
  LanguageCode,
  Payment,
  ProformaInvoice,
  Quotation,
  Receipt,
} from '../types/domain';

export function escapeHtml(unsafe: string | undefined | null): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderInvoiceOrQuotationHtml(params: {
  docType: 'invoice' | 'quotation' | 'proforma';
  document: Invoice | Quotation | ProformaInvoice;
  business: Business;
  settings: BusinessSettings;
  client: Client;
  language: LanguageCode;
}): string {
  const { docType, document, business, settings, client, language } = params;
  const t = (key: string) => translateKey(language, key);

  const docTitle =
    docType === 'invoice'
      ? t('doc.invoice')
      : docType === 'quotation'
      ? t('doc.quotation')
      : t('doc.proforma');

  const docNumber =
    'invoiceNumber' in document
      ? document.invoiceNumber
      : 'quotationNumber' in document
      ? document.quotationNumber
      : document.proformaNumber;

  const secondaryDateLabel = docType === 'invoice' ? t('doc.dueDate') : t('doc.validUntil');
  const secondaryDateValue = 'dueDate' in document ? document.dueDate : document.validUntil;

  const sepOptions = {
    thousandsSeparator: settings.thousandsSeparator,
    decimalSeparator: settings.decimalSeparator,
  };

  const rowsHtml = document.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#475569;">${idx + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:500;color:#0f172a;">${escapeHtml(item.description)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatMoney(item.unitPrice, document.currency, sepOptions))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatMoney(item.discountAmount, document.currency, sepOptions))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(item.taxLabel)} (${escapeHtml(item.taxRate)}%)</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#0f172a;">${escapeHtml(formatMoney(item.lineTotal, document.currency, sepOptions))}</td>
      </tr>`
    )
    .join('');

  const invoicePaymentBlock =
    'balanceDue' in document
      ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#475569;">
        <span>${escapeHtml(t('doc.creditApplied'))}:</span>
        <span>-${escapeHtml(formatMoney(document.creditNotesTotal, document.currency, sepOptions))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#0f766e;font-weight:600;">
        <span>${escapeHtml(t('doc.amountPaid'))}:</span>
        <span>${escapeHtml(formatMoney(document.amountPaid, document.currency, sepOptions))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #0f172a;font-size:16px;font-weight:700;color:#0f172a;">
        <span>${escapeHtml(t('doc.balanceDue'))}:</span>
        <span>${escapeHtml(formatMoney(document.balanceDue, document.currency, sepOptions))}</span>
      </div>`
      : '';

  const disclaimer =
    docType === 'proforma' ? t('doc.proformaDisclaimer') : t('doc.nonFiscalDisclaimer');

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docNumber)} — ${escapeHtml(business.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #ffffff; font-size: 13px; line-height: 1.5; }
    @media print { body { padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div style="max-width:820px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:20px;margin-bottom:24px;">
      <div>
        ${
          business.logoDataUrl
            ? `<img src="${escapeHtml(business.logoDataUrl)}" alt="Logo" style="max-height:52px;margin-bottom:8px;" />`
            : `<div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${escapeHtml(business.name)}</div>`
        }
        <div style="color:#475569;font-size:12px;">
          <div>${escapeHtml(business.legalName)}</div>
          <div>${escapeHtml(business.addressLine1)}, ${escapeHtml(business.city)} (${escapeHtml(business.countryCode)})</div>
          ${business.tinNumber ? `<div><strong>${escapeHtml(settings.taxIdentificationLabel)}:</strong> ${escapeHtml(business.tinNumber)}</div>` : ''}
          ${business.vrnNumber ? `<div><strong>${escapeHtml(settings.secondaryTaxLabel)}:</strong> ${escapeHtml(business.vrnNumber)}</div>` : ''}
          <div>${escapeHtml(business.email)} • ${escapeHtml(business.phone)}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:20px;font-weight:800;color:#0d9488;text-transform:uppercase;">${escapeHtml(docTitle)}</div>
        <div style="font-size:16px;font-weight:700;margin-top:4px;">${escapeHtml(docNumber)}</div>
        <div style="margin-top:6px;display:inline-block;padding:3px 10px;border-radius:999px;background:#f1f5f9;font-weight:600;font-size:11px;text-transform:uppercase;">
          ${escapeHtml(t(`status.${document.status}`))}
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:24px;gap:24px;">
      <div style="flex:1;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px;">${escapeHtml(t('doc.billTo'))}</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(client.name)}</div>
        ${client.contactPerson ? `<div>Attn: ${escapeHtml(client.contactPerson)}</div>` : ''}
        <div>${escapeHtml(client.billingAddress)} ${escapeHtml(client.city)}</div>
        ${client.tinNumber ? `<div><strong>TIN:</strong> ${escapeHtml(client.tinNumber)}</div>` : ''}
        <div>${escapeHtml(client.email)} ${client.phone ? `• ${escapeHtml(client.phone)}` : ''}</div>
      </div>
      <div style="width:240px;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#64748b;">${escapeHtml(t('doc.issueDate'))}:</span>
          <strong>${escapeHtml(document.issueDate)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#64748b;">${escapeHtml(secondaryDateLabel)}:</span>
          <strong>${escapeHtml(secondaryDateValue)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#64748b;">Currency:</span>
          <strong>${escapeHtml(document.currency)}</strong>
        </div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#0f172a;color:#ffffff;text-align:left;font-size:11px;text-transform:uppercase;">
          <th style="padding:10px 8px;">#</th>
          <th style="padding:10px 8px;">${escapeHtml(t('doc.description'))}</th>
          <th style="padding:10px 8px;text-align:right;">${escapeHtml(t('doc.qty'))}</th>
          <th style="padding:10px 8px;text-align:right;">${escapeHtml(t('doc.unitPrice'))}</th>
          <th style="padding:10px 8px;text-align:right;">${escapeHtml(t('doc.discount'))}</th>
          <th style="padding:10px 8px;text-align:right;">${escapeHtml(t('doc.tax'))}</th>
          <th style="padding:10px 8px;text-align:right;">${escapeHtml(t('doc.lineTotal'))}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="display:flex;justify-content:space-between;gap:32px;align-items:flex-start;">
      <div style="flex:1;">
        <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:#334155;margin-bottom:4px;">${escapeHtml(t('doc.paymentInstructions'))}</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:12px;color:#334155;">
          <div>${escapeHtml('paymentInstructions' in document ? document.paymentInstructions : settings.defaultPaymentInstructions)}</div>
          ${settings.mobileMoneyNumber ? `<div style="margin-top:4px;"><strong>${escapeHtml(settings.mobileMoneyNetwork)}:</strong> ${escapeHtml(settings.mobileMoneyNumber)} (${escapeHtml(settings.mobileMoneyName)})</div>` : ''}
          ${settings.bankAccountNumber ? `<div style="margin-top:4px;"><strong>Bank:</strong> ${escapeHtml(settings.bankName)} — Acc: ${escapeHtml(settings.bankAccountNumber)} (${escapeHtml(settings.bankAccountName)})</div>` : ''}
        </div>
        ${document.notes ? `<div style="margin-top:12px;"><strong>${escapeHtml(t('doc.notes'))}:</strong> ${escapeHtml(document.notes)}</div>` : ''}
      </div>

      <div style="width:290px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>${escapeHtml(t('doc.subtotal'))}:</span>
          <span>${escapeHtml(formatMoney(document.subtotal, document.currency, sepOptions))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>${escapeHtml(t('doc.discountTotal'))}:</span>
          <span>-${escapeHtml(formatMoney(document.discountTotal, document.currency, sepOptions))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#475569;">
          <span>${escapeHtml(t('doc.taxTotal'))}:</span>
          <span>${escapeHtml(formatMoney(document.taxTotal, document.currency, sepOptions))}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #cbd5e1;font-weight:700;font-size:15px;">
          <span>${escapeHtml(t('doc.grandTotal'))}:</span>
          <span>${escapeHtml(formatMoney(document.grandTotal, document.currency, sepOptions))}</span>
        </div>
        ${invoicePaymentBlock}
      </div>
    </div>

    <div style="margin-top:28px;padding-top:12px;border-top:1px dashed #cbd5e1;font-size:11px;color:#64748b;text-align:center;">
      ${escapeHtml(disclaimer)}
    </div>
  </div>
</body>
</html>`;
}

export function renderReceiptHtml(params: {
  receipt: Receipt;
  payment: Payment;
  business: Business;
  settings: BusinessSettings;
  client: Client;
  invoiceNumber?: string;
  remainingBalance?: string;
  language: LanguageCode;
}): string {
  const { receipt, payment, business, settings, client, invoiceNumber, remainingBalance, language } = params;
  const t = (key: string) => translateKey(language, key);
  const sepOptions = {
    thousandsSeparator: settings.thousandsSeparator,
    decimalSeparator: settings.decimalSeparator,
  };

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(receipt.receiptNumber)} — ${escapeHtml(business.name)}</title>
</head>
<body style="font-family:sans-serif;padding:32px;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #cbd5e1;border-radius:12px;padding:28px;">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px;">
      <div>
        <div style="font-size:20px;font-weight:800;">${escapeHtml(business.name)}</div>
        <div style="font-size:12px;color:#475569;">${escapeHtml(business.addressLine1)}, ${escapeHtml(business.city)}</div>
        ${business.tinNumber ? `<div style="font-size:12px;">TIN: ${escapeHtml(business.tinNumber)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:18px;font-weight:800;color:#0d9488;">${escapeHtml(t('doc.receipt'))}</div>
        <div style="font-weight:700;">${escapeHtml(receipt.receiptNumber)}</div>
        <div style="font-size:11px;color:#64748b;">${escapeHtml(receipt.issuedAt.slice(0, 10))}</div>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div><strong>Received From:</strong> ${escapeHtml(client.name)}</div>
      <div><strong>Amount Received:</strong> ${escapeHtml(formatMoney(receipt.amount, receipt.currency, sepOptions))}</div>
      <div><strong>Payment Method:</strong> ${escapeHtml(receipt.paymentMethod)} ${payment.providerName ? `(${escapeHtml(payment.providerName)})` : ''}</div>
      <div><strong>Transaction Reference:</strong> ${escapeHtml(receipt.transactionReference || 'N/A')}</div>
      <div><strong>Verification Status:</strong> ${receipt.verificationStatus === 'provider_confirmed' ? 'Provider Confirmed Settlement' : 'Manually Recorded by Business'}</div>
      ${invoiceNumber ? `<div><strong>Applied to Invoice:</strong> ${escapeHtml(invoiceNumber)}</div>` : ''}
      ${remainingBalance !== undefined ? `<div><strong>Remaining Invoice Balance:</strong> ${escapeHtml(formatMoney(remainingBalance, receipt.currency, sepOptions))}</div>` : ''}
    </div>
    <div style="font-size:11px;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:10px;">
      ${escapeHtml(t('doc.nonFiscalDisclaimer'))}
    </div>
  </div>
</body>
</html>`;
}

export function openPrintableDocumentWindow(htmlContent: string): void {
  if (typeof window === 'undefined') return;
  const printWin = window.open('', '_blank', 'width=920,height=800,noopener,noreferrer');
  if (!printWin) return;
  printWin.document.open();
  printWin.document.write(htmlContent);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 250);
}

export function generateCsvContent(headers: string[], rows: Array<Array<string | number>>): string {
  const escapeCsvCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...bodyLines].join('\n');
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

