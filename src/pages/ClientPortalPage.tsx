import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, FileText, Globe, Lock, Send, ShieldAlert, XCircle } from 'lucide-react';
import { db } from '../services/database';
import { formatMoney } from '../lib/money';
import { openPrintableDocumentWindow, renderInvoiceOrQuotationHtml } from '../services/documentExporter';
import { useApp } from '../context/AppContext';

export const ClientPortalPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const { language, setLanguage, refreshWorkspace } = useApp();
  const [actorName, setActorName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  let resolved: ReturnType<typeof db.resolvePortalToken> | null = null;
  let loadError: string | null = null;
  try {
    resolved = db.resolvePortalToken(token);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unable to load portal document.';
  }

  if (loadError || !resolved) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 dark:bg-slate-900 dark:border-red-900">
          <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Portal Link Unavailable</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
          <Link to="/" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Return to InvoicePro Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { access, business, settings, client, invoice, quotation, proforma, clientInvoices, clientPayments } =
    resolved;

  const activeDoc = invoice ?? quotation ?? proforma;
  const docType = access.documentType;

  const handlePrintPdf = () => {
    if (!activeDoc) return;
    const html = renderInvoiceOrQuotationHtml({
      docType,
      document: activeDoc,
      business,
      settings,
      client,
      language,
    });
    openPrintableDocumentWindow(html);
  };

  const handleQuotationDecision = (decision: 'accepted' | 'rejected') => {
    setError(null);
    setFeedback(null);
    try {
      db.portalRespondToQuotation(token, decision, actorName || client.name, rejectionReason);
      setFeedback(
        decision === 'accepted'
          ? 'Quotation officially accepted! The business has been notified.'
          : 'Quotation marked as declined.'
      );
      refreshWorkspace();
      setTick((x) => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record response.');
    }
  };

  const handlePaymentNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      db.portalSubmitPaymentNotification(token, paymentRef, paymentNote);
      setFeedback(
        `Payment reference "${paymentRef}" submitted for verification by ${business.name}.`
      );
      setPaymentRef('');
      setPaymentNote('');
      refreshWorkspace();
      setTick((x) => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment reference.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Portal Security Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-teal-600">
                Secure Client Portal • {business.name}
              </div>
              <div className="text-sm font-bold">
                Authorized Guest View for {client.name} (Expires {access.expiresAt.slice(0, 10)})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700"
            >
              <Globe className="h-3.5 w-3.5 text-teal-600" />
              {language === 'en' ? 'Kiswahili' : 'English'}
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600"
            >
              <Download className="h-4 w-4" />
              Print / Download PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}
        {feedback && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900">
            {feedback}
          </div>
        )}

        {/* Active Document Card */}
        {activeDoc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  {docType.toUpperCase()}
                </span>
                <h1 className="text-2xl font-extrabold mt-0.5">
                  {'invoiceNumber' in activeDoc
                    ? activeDoc.invoiceNumber
                    : 'quotationNumber' in activeDoc
                    ? activeDoc.quotationNumber
                    : activeDoc.proformaNumber}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Issued by {business.legalName} • TIN: {business.tinNumber || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold uppercase text-teal-800">
                  {activeDoc.status}
                </span>
                <div className="text-xs text-slate-500 mt-2">
                  Issue Date: <strong>{activeDoc.issueDate}</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                    <th className="py-2.5 pr-4">Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 pl-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeDoc.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium">{item.description}</td>
                      <td className="py-3 px-3 text-right">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right">{formatMoney(item.unitPrice, activeDoc.currency)}</td>
                      <td className="py-3 px-3 text-right">
                        {item.taxLabel} ({item.taxRate}%)
                      </td>
                      <td className="py-3 pl-3 text-right font-semibold">
                        {formatMoney(item.lineTotal, activeDoc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Instructions */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-1.5 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <div className="font-bold uppercase text-slate-700 dark:text-slate-200">
                  Payment Instructions
                </div>
                <p>{settings.defaultPaymentInstructions}</p>
                {settings.mobileMoneyNumber && (
                  <p>
                    <strong>{settings.mobileMoneyNetwork}:</strong> {settings.mobileMoneyNumber} ({settings.mobileMoneyName})
                  </p>
                )}
                {settings.bankAccountNumber && (
                  <p>
                    <strong>Bank:</strong> {settings.bankName} • Acc: {settings.bankAccountNumber} ({settings.bankAccountName})
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>{formatMoney(activeDoc.subtotal, activeDoc.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount:</span>
                  <span>-{formatMoney(activeDoc.discountTotal, activeDoc.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax:</span>
                  <span>{formatMoney(activeDoc.taxTotal, activeDoc.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span>{formatMoney(activeDoc.grandTotal, activeDoc.currency)}</span>
                </div>
                {'balanceDue' in activeDoc && (
                  <>
                    <div className="flex justify-between text-teal-600 font-semibold">
                      <span>Amount Paid:</span>
                      <span>{formatMoney(activeDoc.amountPaid, activeDoc.currency)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-white border-t border-slate-300 pt-2">
                      <span>Balance Due:</span>
                      <span>{formatMoney(activeDoc.balanceDue, activeDoc.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quotation Acceptance / Rejection Controls */}
            {quotation && quotation.status !== 'converted' && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 space-y-4 dark:border-teal-900 dark:bg-teal-950/30">
                <h2 className="text-sm font-bold">Client Quotation Decision</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    placeholder={`Your Name (${client.name})`}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                  <input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional notes or reason if declining"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuotationDecision('accepted')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Accept Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuotationDecision('rejected')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline Quotation
                  </button>
                </div>
              </div>
            )}

            {/* Submit Payment Reference Notification */}
            {invoice && (
              <form
                onSubmit={handlePaymentNotification}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-teal-600" />
                  Submit Payment Reference / Notification
                </h2>
                <p className="text-xs text-slate-500">
                  Paid via M-Pesa, Mixx by Yas, Airtel Money, or Bank Transfer? Submit your transaction reference below so {business.name} can verify and issue your receipt.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. QJK8921LMP or CRDB-FT-9920"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700"
                  />
                  <input
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Optional note (e.g. 50% deposit)"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600"
                >
                  Notify Business of Payment
                </button>
              </form>
            )}
          </div>
        )}

        {/* Scoped Client Transaction History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Your Transaction History with {business.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-xs">
            <div>
              <h3 className="font-semibold uppercase text-slate-500 mb-2">Invoices ({clientInvoices.length})</h3>
              <div className="space-y-2">
                {clientInvoices.map((ci) => (
                  <div key={ci.id} className="flex justify-between rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                    <div>
                      <div className="font-bold">{ci.invoiceNumber}</div>
                      <div className="text-slate-500">Due: {ci.dueDate} • {ci.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatMoney(ci.grandTotal, ci.currency)}</div>
                      <div className="text-teal-600">Bal: {formatMoney(ci.balanceDue, ci.currency)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold uppercase text-slate-500 mb-2">Payments Recorded ({clientPayments.length})</h3>
              <div className="space-y-2">
                {clientPayments.map((cp) => (
                  <div key={cp.id} className="flex justify-between rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                    <div>
                      <div className="font-bold">{cp.receiptNumber || cp.paymentMethod}</div>
                      <div className="text-slate-500">{cp.paymentDate} • Ref: {cp.transactionReference || 'N/A'}</div>
                    </div>
                    <div className="text-right font-semibold text-teal-600">
                      {formatMoney(cp.amount, cp.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

