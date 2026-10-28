import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FolderKanban,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { compareMoney, formatMoney } from '../../lib/money';
import { openPrintableDocumentWindow, renderReceiptHtml } from '../../services/documentExporter';
import { PaymentMethodType, PaymentVerificationStatus } from '../../types/domain';
import { AiAssistantSuggestion, runAiBillingAssistant } from '../../services/aiAssistant';

export const PaymentsView: React.FC = () => {
  const { currentUser, activeTenant, language, refreshWorkspace, t } = useApp();
  const [subTab, setSubTab] = useState<'payments' | 'followups'>('payments');
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('mobile_money');
  const [providerName, setProviderName] = useState('M-Pesa (Vodacom)');
  const [transactionReference, setTransactionReference] = useState('');
  const [verificationStatus, setVerificationStatus] =
    useState<PaymentVerificationStatus>('recorded_manual');
  const [idempotencyKey, setIdempotencyKey] = useState(() => `idem-${Date.now()}`);
  const [notes, setNotes] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, role, settings } = activeTenant;
  const canFinance = ['owner', 'admin', 'accountant'].includes(role);
  const canFollowUp = ['owner', 'admin', 'accountant', 'sales'].includes(role);

  const invoices = db.listInvoices(currentUser.id, business.id);
  const openInvoices = invoices.filter(
    (i) => i.status !== 'draft' && i.status !== 'voided' && compareMoney(i.balanceDue, '0.00') > 0
  );
  const payments = db.listPayments(currentUser.id, business.id);
  const receipts = db.listReceipts(currentUser.id, business.id);
  const clients = db.listClients(currentUser.id, business.id);
  const notificationJobs = db.listNotificationJobs(currentUser.id, business.id);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const targetInvId = selectedInvoiceId || openInvoices[0]?.id;
      if (!targetInvId) throw new Error('Select an open invoice to record payment.');
      const res = db.recordPayment(currentUser.id, business.id, {
        invoiceId: targetInvId,
        idempotencyKey,
        amount,
        paymentMethod,
        providerName,
        transactionReference,
        verificationStatus,
        notes,
      });
      setFeedback(
        res.idempotentReplay
          ? `Idempotent duplicate prevented: Returned existing Receipt ${res.receipt.receiptNumber}.`
          : `Recorded payment and generated Receipt ${res.receipt.receiptNumber}. Remaining invoice balance: ${res.updatedInvoice.currency} ${res.updatedInvoice.balanceDue}.`
      );
      setShowRecordModal(false);
      setIdempotencyKey(`idem-${Date.now()}`);
      setAmount('');
      setTransactionReference('');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    }
  };

  const handleReverse = (paymentId: string) => {
    setError(null);
    try {
      db.reversePayment(currentUser.id, business.id, paymentId, 'Reversed by finance team');
      setFeedback('Payment reversed, receipt marked void, and invoice balance restored.');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reversal failed.');
    }
  };

  const handleQueueReminder = (invoiceId: string, channel: 'email' | 'whatsapp_link') => {
    setError(null);
    try {
      const job = db.queueInvoiceReminder(currentUser.id, business.id, {
        invoiceId,
        channel,
        reminderStage: 'overdue_1',
      });
      setFeedback(`Queued ${channel} reminder for ${job.subject} (Deduplication key: ${job.dedupKey}).`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not queue reminder.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('payments')}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              subTab === 'payments'
                ? 'bg-slate-900 text-white dark:bg-teal-600'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Payments & Receipts ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('followups')}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${
              subTab === 'followups'
                ? 'bg-slate-900 text-white dark:bg-teal-600'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Payment Follow-Ups & Reminders ({openInvoices.length} Open)
          </button>
        </div>

        {canFinance && subTab === 'payments' && (
          <button
            type="button"
            onClick={() => {
              const first = openInvoices[0];
              if (first) {
                setSelectedInvoiceId(first.id);
                setAmount(first.balanceDue);
              }
              setShowRecordModal(!showRecordModal);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Wallet className="h-4 w-4" />
            {t('action.recordPayment')}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900">
          {feedback}
        </div>
      )}

      {showRecordModal && (
        <form
          onSubmit={handleRecordPayment}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-4 text-xs dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Record Partial or Final Client Payment</h2>
            <span className="text-[11px] text-slate-500">
              Security Note: Never enter or store raw payment card numbers or PINs.
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Open Invoice *</label>
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = openInvoices.find((i) => i.id === e.target.value);
                  if (inv) setAmount(inv.balanceDue);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {openInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — Bal: {inv.currency} {inv.balanceDue}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Payment Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="mobile_money">Mobile Money (M-Pesa / Mixx / Airtel)</option>
                <option value="bank_transfer">Bank Transfer (RTGS / EFT)</option>
                <option value="cash">Cash</option>
                <option value="card">External Card Terminal Reference</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Provider / Bank Name</label>
              <input
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Transaction Reference</label>
              <input
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. QJK8921LMP"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Settlement Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as PaymentVerificationStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="recorded_manual">Manually Recorded (Pending Bank/Mobile Check)</option>
                <option value="provider_confirmed">Provider Confirmed Settlement</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowRecordModal(false)} className="rounded-lg border px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-1.5 font-semibold text-white">
              Save Payment & Generate Receipt
            </button>
          </div>
        </form>
      )}

      {subTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client & Invoice</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {payments.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                const inv = invoices.find((i) => i.id === p.invoiceId);
                const rct = receipts.find((r) => r.paymentId === p.id);
                return (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4 font-bold">{p.receiptNumber || 'N/A'}</td>
                    <td className="py-3.5 px-4">{p.paymentDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{client?.name}</div>
                      <div className="text-slate-500">{inv?.invoiceNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{p.paymentMethod}</div>
                      <div className="font-mono text-[11px] text-slate-500">{p.transactionReference}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          p.verificationStatus === 'provider_confirmed'
                            ? 'bg-teal-100 text-teal-800'
                            : p.verificationStatus === 'reversed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.verificationStatus === 'provider_confirmed'
                          ? 'Provider Confirmed'
                          : p.verificationStatus === 'reversed'
                          ? 'Reversed'
                          : 'Manual Entry'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-teal-600">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        {rct && client && (
                          <button
                            type="button"
                            title="Print Payment Receipt"
                            onClick={() =>
                              openPrintableDocumentWindow(
                                renderReceiptHtml({
                                  receipt: rct,
                                  payment: p,
                                  business,
                                  settings,
                                  client,
                                  invoiceNumber: inv?.invoiceNumber,
                                  remainingBalance: inv?.balanceDue,
                                  language,
                                })
                              )
                            }
                            className="rounded-lg border border-slate-200 p-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canFinance && p.verificationStatus !== 'reversed' && (
                          <button
                            type="button"
                            title="Reverse Payment"
                            onClick={() => handleReverse(p.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'followups' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600" />
              Open & Overdue Invoices Follow-Up Queue
            </h2>
            <p className="text-xs text-slate-500">
              Reminders are deduplicated per day and automatically suppressed the moment an invoice balance reaches zero or is voided. WhatsApp links open pre-filled messages ready to send; automated WhatsApp Cloud API delivery is not claimed unless configured on the server.
            </p>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {openInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const cleanPhone = (client?.phone ?? '').replace(/[^0-9]/g, '');
                const waText = encodeURIComponent(
                  `Habari ${client?.name ?? ''}, polite reminder for Invoice ${inv.invoiceNumber} (${formatMoney(inv.balanceDue, inv.currency)}) due ${inv.dueDate}. — ${business.name}`
                );
                return (
                  <div key={inv.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold">
                        {inv.invoiceNumber} — {client?.name} ({inv.status.toUpperCase()})
                      </div>
                      <div className="text-slate-500">
                        Due: {inv.dueDate} • Balance: <strong>{formatMoney(inv.balanceDue, inv.currency)}</strong>
                        {inv.paymentPromiseDate ? ` • Promise Date: ${inv.paymentPromiseDate}` : ''}
                      </div>
                    </div>
                    {canFollowUp && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          aria-label="Payment Promise Date"
                          value={inv.paymentPromiseDate || ''}
                          onChange={(e) => {
                            db.updateInvoicePaymentPromiseDate(
                              currentUser.id,
                              business.id,
                              inv.id,
                              e.target.value
                            );
                            refreshWorkspace();
                          }}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleQueueReminder(inv.id, 'email')}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white dark:bg-teal-600"
                        >
                          Queue Email Reminder
                        </button>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-600 px-3 py-1.5 font-semibold text-teal-700 hover:bg-teal-50 dark:text-teal-300"
                          >
                            WhatsApp Link <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm">Reminder Queue & Suppression History ({notificationJobs.length})</h3>
            {notificationJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <div>
                  <div className="font-semibold">{job.subject} ({job.channel})</div>
                  <div className="text-slate-500">{job.bodyPreview}</div>
                  {job.lastError && <div className="text-amber-600">{job.lastError}</div>}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">
                  {job.status} (Retries: {job.retryCount}/{job.maxRetries})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ExpensesView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [categoryName, setCategoryName] = useState('Cloud & Software Subscriptions');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('mobile_money');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!currentUser || !activeTenant) return null;
  const { business, role } = activeTenant;
  const canFinance = ['owner', 'admin', 'accountant'].includes(role);
  const expenses = db.listExpenses(currentUser.id, business.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    db.createExpense(currentUser.id, business.id, {
      categoryName,
      vendorName,
      amount,
      taxAmount,
      paymentMethod,
      referenceNumber,
      notes,
    });
    setVendorName('');
    setAmount('');
    setShowCreate(false);
    refreshWorkspace();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold">{t('nav.expenses')}</h1>
          <p className="text-xs text-slate-500">
            Track business operating expenses distinctly from client invoice payments. Note: Expense summaries are operational management records and not audited accounting statements.
          </p>
        </div>
        {canFinance && (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Record Expense
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-4 text-xs dark:bg-slate-900"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category *</label>
              <input
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Vendor / Supplier *</label>
              <input
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Amount ({business.defaultCurrency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-1.5 font-semibold text-white">
              Save Expense
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td className="py-3.5 px-4">{exp.expenseDate}</td>
                <td className="py-3.5 px-4 font-semibold">{exp.categoryName}</td>
                <td className="py-3.5 px-4">{exp.vendorName}</td>
                <td className="py-3.5 px-4">{exp.paymentMethod}</td>
                <td className="py-3.5 px-4 text-right font-bold">
                  {formatMoney(exp.amount, exp.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ProjectsAndAiView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [hours, setHours] = useState('4.0');
  const [timeDesc, setTimeDesc] = useState('Backend API & integration sprint');

  // AI Assistant State
  const [aiTask, setAiTask] = useState<AiAssistantSuggestion['taskType']>('draft_quotation');
  const [aiPrompt, setAiPrompt] = useState(
    'Website redesign and mobile money billing integration for Arusha client'
  );
  const [aiResult, setAiResult] = useState<AiAssistantSuggestion | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business } = activeTenant;

  const projects = db.listProjects(currentUser.id, business.id);
  const timeEntries = db.listTimeEntries(currentUser.id, business.id);
  const clients = db.listClients(currentUser.id, business.id);

  const handleLogTime = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const targetProj = selectedProjectId || projects[0]?.id;
      if (!targetProj) throw new Error('No project available.');
      db.logTimeEntry(currentUser.id, business.id, {
        projectId: targetProj,
        description: timeDesc,
        hours,
      });
      setFeedback('Logged billable time entry (Status: Pending Approval).');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log time.');
    }
  };

  const handleBillProjectHours = (projectId: string) => {
    setError(null);
    try {
      const inv = db.convertApprovedTimeEntriesToInvoice(currentUser.id, business.id, projectId);
      setFeedback(`Converted approved project hours into Invoice ${inv.invoiceNumber} (${inv.currency} ${inv.grandTotal})!`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert project hours.');
    }
  };

  const handleRunAi = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const suggestion = runAiBillingAssistant({
        actorUserId: currentUser.id,
        businessId: business.id,
        taskType: aiTask,
        userPrompt: aiPrompt,
      });
      setAiResult(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request blocked or failed.');
    }
  };

  const handleConfirmAiQuotation = () => {
    if (!aiResult?.draftQuotationPayload || !clients[0]) return;
    setError(null);
    try {
      const q = db.createQuotation(currentUser.id, business.id, {
        clientId: clients[0].id,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'draft',
        items: aiResult.draftQuotationPayload.suggestedItems.map((it) => ({
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
        })),
      });
      setFeedback(`Confirmed and saved Draft Quotation ${q.quotationNumber} from AI suggestion.`);
      setAiResult(null);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create draft quotation.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900">
          {feedback}
        </div>
      )}

      {/* Projects & Billable Time Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-teal-600" />
              {t('nav.projects')}
            </h1>
            <p className="text-xs text-slate-500">
              Manage client contracts, milestones, billable time entries, approval workflows, and invoice conversion.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4 space-y-2 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="font-bold text-sm">{p.name} ({p.code})</span>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">
                  {p.status}
                </span>
              </div>
              <div className="text-slate-500">
                Budget: <strong>{formatMoney(p.budgetAmount, p.currency)}</strong> • Hourly Rate:{' '}
                <strong>{formatMoney(p.hourlyRate, p.currency)}/hr</strong>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleBillProjectHours(p.id)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800 dark:bg-teal-600"
                >
                  Convert Approved Hours to Invoice
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleLogTime} className="grid sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 text-xs dark:border-slate-800">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            required
            value={timeDesc}
            onChange={(e) => setTimeDesc(e.target.value)}
            placeholder="Work description"
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="number"
            step="0.25"
            min="0.25"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours"
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white">
            Log Billable Hours
          </button>
        </form>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          {timeEntries.map((te) => (
            <div key={te.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold">{te.entryDate}:</span> {te.description} ({te.hours} hrs @{' '}
                {formatMoney(te.hourlyRate, te.currency)})
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatMoney(te.totalAmount, te.currency)}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">
                  {te.approvalStatus}
                </span>
                {te.approvalStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      db.approveTimeEntry(currentUser.id, business.id, te.id);
                      refreshWorkspace();
                    }}
                    className="rounded bg-teal-600 px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe AI Billing Assistant Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              {t('nav.ai')}
            </h2>
            <p className="text-xs text-slate-500">
              Sanitizes untrusted input against prompt injection, computes totals deterministically, and requires explicit user confirmation before creating or sending anything.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunAi} className="grid sm:grid-cols-12 gap-3 text-xs">
          <select
            value={aiTask}
            onChange={(e) => setAiTask(e.target.value as AiAssistantSuggestion['taskType'])}
            className="sm:col-span-3 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="draft_quotation">Draft Quotation from Description</option>
            <option value="draft_reminder">Draft Polite Bilingual Reminder</option>
            <option value="followup_priorities">Suggest Follow-Up Priorities</option>
            <option value="explain_trends">Explain Authorized Dashboard Trends</option>
          </select>
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe work scope or question..."
            className="sm:col-span-7 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white dark:bg-teal-600"
          >
            Generate Draft
          </button>
        </form>

        {aiResult && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3 text-xs dark:border-teal-900 dark:bg-teal-950/20">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{aiResult.title}</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                Mandatory Human Confirmation Required
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">{aiResult.explanation}</p>

            {aiResult.draftQuotationPayload && (
              <div className="space-y-2">
                <div className="font-semibold">
                  Deterministic Grand Total: {business.defaultCurrency}{' '}
                  {aiResult.draftQuotationPayload.calculatedGrandTotal}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAiQuotation}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Create Draft Quotation
                </button>
              </div>
            )}

            {aiResult.draftReminderText && (
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded bg-white p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 whitespace-pre-line">
                  <strong>English Draft:</strong>
                  {'\n'}
                  {aiResult.draftReminderText.bodyEn}
                </div>
                <div className="rounded bg-white p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 whitespace-pre-line">
                  <strong>Kiswahili Draft:</strong>
                  {'\n'}
                  {aiResult.draftReminderText.bodySw}
                </div>
              </div>
            )}

            {aiResult.followUpPriorities && (
              <div className="space-y-1.5">
                {aiResult.followUpPriorities.map((fp) => (
                  <div key={fp.invoiceId} className="flex justify-between border-b border-slate-200 py-1">
                    <span>
                      <strong>{fp.invoiceNumber}</strong> — {fp.clientName} ({fp.priorityRule})
                    </span>
                    <span className="font-bold">
                      {fp.currency} {fp.balanceDue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

