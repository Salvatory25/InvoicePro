import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Download,
  FileMinus,
  FilePlus2,
  History,
  Link2,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { calculateDocumentTotals, CurrencyCode, formatMoney } from '../../lib/money';
import { openPrintableDocumentWindow, renderInvoiceOrQuotationHtml } from '../../services/documentExporter';
import { Invoice, Quotation } from '../../types/domain';

export const InvoicesView: React.FC = () => {
  const { currentUser, activeTenant, language, refreshWorkspace, t } = useApp();
  const [subTab, setSubTab] = useState<'invoices' | 'proformas' | 'credit_notes'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForEvents, setSelectedInvoiceForEvents] = useState<Invoice | null>(null);
  const [selectedInvoiceForCreditNote, setSelectedInvoiceForCreditNote] = useState<Invoice | null>(null);

  // Create Form State
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    activeTenant?.business.defaultCurrency ?? 'TZS'
  );
  const [issueImmediately, setIssueImmediately] = useState(true);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([
    {
      description: '',
      unit: 'unit',
      quantity: '1',
      unitPrice: '0.00',
      discountAmount: '0.00',
      taxRate: activeTenant?.settings.defaultTaxRate ?? '18.00',
    },
  ]);

  // Credit Note Modal State
  const [cnAmount, setCnAmount] = useState('');
  const [cnReason, setCnReason] = useState('');

  const [portalLinkBanner, setPortalLinkBanner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, role, settings } = activeTenant;
  const canWrite = ['owner', 'admin', 'accountant', 'sales'].includes(role);
  const canFinance = ['owner', 'admin', 'accountant'].includes(role);

  const clients = db.listClients(currentUser.id, business.id);
  const catalog = db.listProductsServices(currentUser.id, business.id);
  const invoices = db.listInvoices(currentUser.id, business.id);
  const proformas = db.listProformaInvoices(currentUser.id, business.id);
  const creditNotes = db.listCreditNotes(currentUser.id, business.id);

  const filteredInvoices = invoices.filter((inv) => {
    const client = clients.find((c) => c.id === inv.clientId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  let liveTotals = { subtotal: '0.00', discountTotal: '0.00', taxTotal: '0.00', grandTotal: '0.00' };
  try {
    liveTotals = calculateDocumentTotals(
      lineItems.map((li) => ({
        quantity: li.quantity || '0',
        unitPrice: li.unitPrice || '0',
        discountAmount: li.discountAmount || '0',
        taxRatePercent: li.taxRate || '0',
      }))
    );
  } catch {
    // Ignore transient typing state
  }

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const targetClientId = clientId || clients[0]?.id;
      if (!targetClientId) {
        throw new Error('Please create or select a client first.');
      }

      if (subTab === 'proformas') {
        const pro = db.createProformaInvoice(currentUser.id, business.id, {
          clientId: targetClientId,
          validUntil: dueDate,
          currency,
          items: lineItems,
          notes,
        });
        setFeedback(`Created Proforma Invoice ${pro.proformaNumber} (Non-fiscal commercial estimate).`);
      } else {
        const inv = db.createInvoice(currentUser.id, business.id, {
          clientId: targetClientId,
          dueDate,
          currency,
          items: lineItems,
          notes,
          issueImmediately,
        });
        setFeedback(
          `Created ${inv.status === 'draft' ? 'draft' : 'issued'} invoice ${inv.invoiceNumber} (${inv.currency} ${inv.grandTotal}).`
        );
      }
      setShowCreateModal(false);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document.');
    }
  };

  const handleIssueDraft = (inv: Invoice) => {
    setError(null);
    try {
      db.issueInvoice(currentUser.id, business.id, inv.id);
      setFeedback(`Invoice ${inv.invoiceNumber} officially issued and locked for audit integrity.`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue invoice.');
    }
  };

  const handleDuplicate = (inv: Invoice) => {
    setError(null);
    try {
      const copy = db.duplicateInvoice(currentUser.id, business.id, inv.id);
      setFeedback(`Duplicated ${inv.invoiceNumber} into new draft ${copy.invoiceNumber}.`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not duplicate invoice.');
    }
  };

  const handleVoid = (inv: Invoice) => {
    setError(null);
    try {
      db.voidInvoice(currentUser.id, business.id, inv.id, 'Voided by authorized finance user');
      setFeedback(`Voided invoice ${inv.invoiceNumber} and suppressed any pending payment reminders.`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not void invoice.');
    }
  };

  const handleSharePortal = (docType: 'invoice' | 'proforma', docId: string, docNumber: string) => {
    setError(null);
    try {
      const tokenRec = db.createClientPortalToken(currentUser.id, business.id, docType, docId, 14);
      const url = `${window.location.origin}/portal/${tokenRec.token}`;
      setPortalLinkBanner(`Client Portal link for ${docNumber} (Expires in 14 days): ${url}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portal link.');
    }
  };

  const handleSubmitCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForCreditNote) return;
    setError(null);
    try {
      const { creditNote, updatedInvoice } = db.createCreditNote(currentUser.id, business.id, {
        invoiceId: selectedInvoiceForCreditNote.id,
        amount: cnAmount,
        reason: cnReason,
      });
      setFeedback(
        `Issued Credit Note ${creditNote.creditNoteNumber} (${creditNote.currency} ${creditNote.totalAmount}). Remaining balance on ${updatedInvoice.invoiceNumber}: ${updatedInvoice.currency} ${updatedInvoice.balanceDue}.`
      );
      setSelectedInvoiceForCreditNote(null);
      setCnAmount('');
      setCnReason('');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue credit note.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('invoices')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'invoices'
                ? 'bg-slate-900 text-white dark:bg-teal-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Commercial Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('proformas')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'proformas'
                ? 'bg-slate-900 text-white dark:bg-teal-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Proforma Invoices ({proformas.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('credit_notes')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              subTab === 'credit_notes'
                ? 'bg-slate-900 text-white dark:bg-teal-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Credit Notes ({creditNotes.length})
          </button>
        </div>

        {canWrite && subTab !== 'credit_notes' && (
          <button
            type="button"
            onClick={() => {
              setClientId(clients[0]?.id ?? '');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <FilePlus2 className="h-4 w-4" />
            {subTab === 'proformas' ? 'New Proforma Invoice' : t('action.createInvoice')}
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
      {portalLinkBanner && (
        <div className="rounded-xl border border-slate-300 bg-slate-900 text-teal-300 p-4 text-xs font-mono break-all">
          {portalLinkBanner}
        </div>
      )}

      {/* Search & Status Filter */}
      {subTab === 'invoices' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number or client name..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <select
            aria-label="Filter Invoices by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="voided">Voided</option>
          </select>
        </div>
      )}

      {/* Create Invoice / Proforma Modal */}
      {showCreateModal && (
        <form
          onSubmit={handleCreateDocument}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-5 shadow-md dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="text-base font-extrabold">
              {subTab === 'proformas' ? 'Create Proforma Invoice' : 'Create Commercial Invoice'}
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Close
            </button>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase text-slate-500 mb-1">Client *</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.preferredCurrency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-500 mb-1">
                {subTab === 'proformas' ? 'Valid Until' : 'Due Date'} *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-slate-500 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="TZS">TZS</option>
                <option value="KES">KES</option>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Line Items (Decimal-Safe)</span>
              <div className="flex gap-2">
                {catalog.length > 0 && (
                  <select
                    onChange={(e) => {
                      const prod = catalog.find((p) => p.id === e.target.value);
                      if (prod) {
                        setLineItems([
                          ...lineItems,
                          {
                            description: prod.name,
                            unit: prod.unit,
                            quantity: '1',
                            unitPrice: prod.unitPrice,
                            discountAmount: '0.00',
                            taxRate: prod.taxRate,
                          },
                        ]);
                      }
                      e.target.value = '';
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">+ Insert from Catalog...</option>
                    {catalog.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currency} {p.unitPrice})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setLineItems([
                      ...lineItems,
                      {
                        description: '',
                        unit: 'unit',
                        quantity: '1',
                        unitPrice: '0.00',
                        discountAmount: '0.00',
                        taxRate: settings.defaultTaxRate,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>
            </div>

            {lineItems.map((row, idx) => (
              <div key={idx} className="grid sm:grid-cols-12 gap-2 items-center text-xs">
                <input
                  required
                  placeholder="Item or service description"
                  value={row.description}
                  onChange={(e) => {
                    const copy = [...lineItems];
                    copy[idx].description = e.target.value;
                    setLineItems(copy);
                  }}
                  className="sm:col-span-4 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => {
                    const copy = [...lineItems];
                    copy[idx].quantity = e.target.value;
                    setLineItems(copy);
                  }}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Unit Price"
                  value={row.unitPrice}
                  onChange={(e) => {
                    const copy = [...lineItems];
                    copy[idx].unitPrice = e.target.value;
                    setLineItems(copy);
                  }}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Discount"
                  value={row.discountAmount}
                  onChange={(e) => {
                    const copy = [...lineItems];
                    copy[idx].discountAmount = e.target.value;
                    setLineItems(copy);
                  }}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="sm:col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={row.taxRate}
                    onChange={(e) => {
                      const copy = [...lineItems];
                      copy[idx].taxRate = e.target.value;
                      setLineItems(copy);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
            <label className="inline-flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={issueImmediately}
                onChange={(e) => setIssueImmediately(e.target.checked)}
              />
              Issue immediately (locks financial snapshot)
            </label>

            <div className="text-right space-y-1">
              <div>
                Subtotal: <strong>{formatMoney(liveTotals.subtotal, currency)}</strong> • Discount:{' '}
                <strong>-{formatMoney(liveTotals.discountTotal, currency)}</strong> • Tax:{' '}
                <strong>{formatMoney(liveTotals.taxTotal, currency)}</strong>
              </div>
              <div className="text-sm font-extrabold text-teal-600">
                Grand Total: {formatMoney(liveTotals.grandTotal, currency)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Save Document
            </button>
          </div>
        </form>
      )}

      {/* Credit Note Modal */}
      {selectedInvoiceForCreditNote && (
        <form
          onSubmit={handleSubmitCreditNote}
          className="rounded-2xl border-2 border-amber-500 bg-white p-5 space-y-4 text-xs dark:bg-slate-900"
        >
          <div className="font-bold text-sm">
            Issue Audited Credit Note for {selectedInvoiceForCreditNote.invoiceNumber} (Current Balance:{' '}
            {formatMoney(selectedInvoiceForCreditNote.balanceDue, selectedInvoiceForCreditNote.currency)})
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Credit Note Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={cnAmount}
                onChange={(e) => setCnAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Reason for Credit Note *</label>
              <input
                required
                value={cnReason}
                onChange={(e) => setCnReason(e.target.value)}
                placeholder="e.g. Agreed scope reduction / returned units"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedInvoiceForCreditNote(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-1.5 font-semibold text-white hover:bg-amber-700"
            >
              Confirm Credit Note
            </button>
          </div>
        </form>
      )}

      {/* Invoices List */}
      {subTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No invoices match your filter. Click "{t('action.createInvoice')}" to issue your first invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredInvoices.map((inv) => {
                    const client = clients.find((c) => c.id === inv.clientId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium">{client?.name ?? 'Client'}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div>Iss: {inv.issueDate}</div>
                          <div>Due: {inv.dueDate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              inv.status === 'paid'
                                ? 'bg-teal-100 text-teal-800'
                                : inv.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : inv.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold">
                          {formatMoney(inv.grandTotal, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-teal-600 font-medium">
                          {formatMoney(inv.amountPaid, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold">
                          {formatMoney(inv.balanceDue, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            {inv.status === 'draft' && canWrite && (
                              <button
                                type="button"
                                onClick={() => handleIssueDraft(inv)}
                                className="rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                Issue
                              </button>
                            )}
                            <button
                              type="button"
                              title="Print / Download PDF"
                              onClick={() => {
                                if (!client) return;
                                const html = renderInvoiceOrQuotationHtml({
                                  docType: 'invoice',
                                  document: inv,
                                  business,
                                  settings,
                                  client,
                                  language,
                                });
                                openPrintableDocumentWindow(html);
                              }}
                              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 dark:border-slate-700"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Share Client Portal Link"
                              onClick={() => handleSharePortal('invoice', inv.id, inv.invoiceNumber)}
                              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 dark:border-slate-700"
                            >
                              <Link2 className="h-3.5 w-3.5 text-teal-600" />
                            </button>
                            {canWrite && (
                              <button
                                type="button"
                                title="Duplicate Invoice"
                                onClick={() => handleDuplicate(inv)}
                                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 dark:border-slate-700"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canFinance && inv.status !== 'draft' && inv.status !== 'voided' && (
                              <button
                                type="button"
                                title="Issue Credit Note"
                                onClick={() => setSelectedInvoiceForCreditNote(inv)}
                                className="rounded-lg border border-amber-300 p-1.5 text-amber-700 hover:bg-amber-50"
                              >
                                <FileMinus className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canFinance && inv.status !== 'voided' && inv.amountPaid === '0.00' && (
                              <button
                                type="button"
                                title="Void Invoice"
                                onClick={() => handleVoid(inv)}
                                className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="View Audit & Activity Trail"
                              onClick={() => setSelectedInvoiceForEvents(inv)}
                              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 dark:border-slate-700"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Proforma Invoices List */}
      {subTab === 'proformas' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <strong>Non-Fiscal Notice:</strong> Proforma invoices use separate numbering ({settings.proformaPrefix}) and are preliminary bills of sale — never treated as proof of payment or fiscal tax receipts.
          </div>
          {proformas.length === 0 ? (
            <p className="text-xs text-slate-500">No proforma invoices created yet.</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {proformas.map((pro) => {
                const client = clients.find((c) => c.id === pro.clientId);
                return (
                  <div key={pro.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold">{pro.proformaNumber} — {client?.name}</div>
                      <div className="text-slate-500">Valid until {pro.validUntil}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatMoney(pro.grandTotal, pro.currency)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!client) return;
                          openPrintableDocumentWindow(
                            renderInvoiceOrQuotationHtml({
                              docType: 'proforma',
                              document: pro,
                              business,
                              settings,
                              client,
                              language,
                            })
                          );
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold"
                      >
                        PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Credit Notes List */}
      {subTab === 'credit_notes' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold">Issued Credit Notes (Linked to Commercial Invoices)</h2>
          {creditNotes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No credit notes issued yet. To adjust an issued invoice's balance, click the Credit Note icon next to the invoice.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {creditNotes.map((cn) => (
                <div key={cn.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{cn.creditNoteNumber}</div>
                    <div className="text-slate-500">{cn.issueDate} • Reason: {cn.reason}</div>
                  </div>
                  <div className="font-bold text-amber-700">
                    -{formatMoney(cn.totalAmount, cn.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoice Immutable Audit Events Drawer */}
      {selectedInvoiceForEvents && (
        <div className="rounded-2xl border border-slate-300 bg-white p-5 space-y-3 text-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">
              Immutable Activity History — {selectedInvoiceForEvents.invoiceNumber}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedInvoiceForEvents(null)}
              className="text-slate-500 hover:underline"
            >
              Close
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {db.getInvoiceEvents(currentUser.id, business.id, selectedInvoiceForEvents.id).map((ev) => (
              <div key={ev.id} className="py-2 flex justify-between gap-4">
                <div>
                  <span className="font-semibold">{ev.actorLabel}:</span> {ev.summary}
                </div>
                <span className="text-slate-400 shrink-0">{ev.createdAt.slice(0, 19).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const QuotationsView: React.FC = () => {
  const { currentUser, activeTenant, language, refreshWorkspace, t } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [clientId, setClientId] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('Consultancy & System Implementation');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('1800000.00');
  const [discount, setDiscount] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, role, settings } = activeTenant;
  const canWrite = ['owner', 'admin', 'accountant', 'sales'].includes(role);

  const clients = db.listClients(currentUser.id, business.id);
  const quotations = db.listQuotations(currentUser.id, business.id);

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const targetClient = clientId || clients[0]?.id;
      if (!targetClient) throw new Error('Select a client first.');
      const q = db.createQuotation(currentUser.id, business.id, {
        clientId: targetClient,
        validUntil,
        status: 'sent',
        items: [
          {
            description,
            unit: 'project',
            quantity: qty,
            unitPrice,
            discountAmount: discount,
            taxLabel: settings.defaultTaxLabel,
            taxRate: settings.defaultTaxRate,
          },
        ],
        notes,
      });
      setFeedback(`Created Quotation ${q.quotationNumber} (${q.currency} ${q.grandTotal}).`);
      setShowCreate(false);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quotation.');
    }
  };

  const handleConvert = (q: Quotation) => {
    setError(null);
    setFeedback(null);
    try {
      const inv = db.convertQuotationToInvoice(currentUser.id, business.id, q.id, {
        issueImmediately: true,
      });
      setFeedback(
        `Converted Quotation ${q.quotationNumber} into Issued Invoice ${inv.invoiceNumber} preserving all line items and prices!`
      );
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    }
  };

  const handleAccept = (q: Quotation) => {
    setError(null);
    try {
      db.updateQuotation(currentUser.id, business.id, q.id, { status: 'accepted' });
      setFeedback(`Marked ${q.quotationNumber} as Accepted.`);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quotation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold">{t('nav.quotations')}</h1>
          <p className="text-xs text-slate-500">
            Create estimates, track revisions, record acceptance, and convert to invoices without duplicate conversion.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => {
              setClientId(clients[0]?.id ?? '');
              setShowCreate(!showCreate);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            {t('action.createQuotation')}
          </button>
        )}
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

      {showCreate && (
        <form
          onSubmit={handleCreateQuotation}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-4 text-xs dark:bg-slate-900"
        >
          <h2 className="text-sm font-bold">New Quotation / Estimate</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Valid Until *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Service Description *</label>
              <input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Discount Amount</label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-1.5 font-semibold text-white">
              Save Quotation
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="py-3 px-4">Quotation #</th>
              <th className="py-3 px-4">Client</th>
              <th className="py-3 px-4">Valid Until</th>
              <th className="py-3 px-4">Rev #</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Grand Total</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {quotations.map((q) => {
              const client = clients.find((c) => c.id === q.clientId);
              return (
                <tr key={q.id}>
                  <td className="py-3.5 px-4 font-bold">{q.quotationNumber}</td>
                  <td className="py-3.5 px-4">{client?.name}</td>
                  <td className="py-3.5 px-4">{q.validUntil}</td>
                  <td className="py-3.5 px-4">v{q.revisionNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-800">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    {formatMoney(q.grandTotal, q.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {canWrite && q.status !== 'accepted' && q.status !== 'converted' && (
                        <button
                          type="button"
                          onClick={() => handleAccept(q)}
                          className="inline-flex items-center gap-1 rounded-lg border border-teal-300 px-2.5 py-1 text-[11px] font-semibold text-teal-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Accept
                        </button>
                      )}
                      {canWrite && q.status !== 'converted' && (
                        <button
                          type="button"
                          onClick={() => handleConvert(q)}
                          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Convert to Invoice
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!client) return;
                          openPrintableDocumentWindow(
                            renderInvoiceOrQuotationHtml({
                              docType: 'quotation',
                              document: q,
                              business,
                              settings,
                              client,
                              language,
                            })
                          );
                        }}
                        className="rounded-lg border border-slate-200 p-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

