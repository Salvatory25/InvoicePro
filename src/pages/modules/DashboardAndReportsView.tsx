import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import {
  addMoney,
  compareMoney,
  CurrencyCode,
  formatMoney,
  sumByCurrency,
} from '../../lib/money';
import { downloadCsvFile, generateCsvContent } from '../../services/documentExporter';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, activeTenant, t } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    activeTenant?.business.defaultCurrency ?? 'TZS'
  );
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');

  if (!currentUser || !activeTenant) return null;
  const { business, settings } = activeTenant;

  const allInvoices = db
    .listInvoices(currentUser.id, business.id)
    .filter((i) => i.currency === selectedCurrency && i.issueDate >= dateFrom && i.issueDate <= dateTo);
  const allQuotations = db
    .listQuotations(currentUser.id, business.id)
    .filter((q) => q.currency === selectedCurrency);
  const allPayments = db
    .listPayments(currentUser.id, business.id)
    .filter(
      (p) =>
        p.currency === selectedCurrency &&
        p.verificationStatus !== 'reversed' &&
        p.paymentDate >= dateFrom &&
        p.paymentDate <= dateTo
    );

  const issuedInvoices = allInvoices.filter((i) => i.status !== 'draft' && i.status !== 'voided');

  const totalInvoiced = issuedInvoices.reduce((acc, i) => addMoney(acc, i.grandTotal), '0.00');
  const paymentsReceived = allPayments.reduce((acc, p) => addMoney(acc, p.amount), '0.00');
  const outstandingReceivables = issuedInvoices.reduce((acc, i) => addMoney(acc, i.balanceDue), '0.00');
  const overdueReceivables = issuedInvoices
    .filter((i) => i.status === 'overdue')
    .reduce((acc, i) => addMoney(acc, i.balanceDue), '0.00');

  const draftQuotationsCount = allQuotations.filter((q) => q.status === 'draft').length;
  const pendingQuotationsCount = allQuotations.filter(
    (q) => q.status === 'sent' || q.status === 'viewed'
  ).length;

  // Receivables Aging Buckets (Current, 1-30, 31-60, 61-90, 90+ days)
  const todayMs = Date.now();
  const agingBuckets = {
    current: '0.00',
    days1_30: '0.00',
    days31_60: '0.00',
    days61_90: '0.00',
    days90Plus: '0.00',
  };

  for (const inv of issuedInvoices) {
    if (compareMoney(inv.balanceDue, '0.00') <= 0) continue;
    const daysPastDue = Math.floor((todayMs - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysPastDue <= 0) {
      agingBuckets.current = addMoney(agingBuckets.current, inv.balanceDue);
    } else if (daysPastDue <= 30) {
      agingBuckets.days1_30 = addMoney(agingBuckets.days1_30, inv.balanceDue);
    } else if (daysPastDue <= 60) {
      agingBuckets.days31_60 = addMoney(agingBuckets.days31_60, inv.balanceDue);
    } else if (daysPastDue <= 90) {
      agingBuckets.days61_90 = addMoney(agingBuckets.days61_90, inv.balanceDue);
    } else {
      agingBuckets.days90Plus = addMoney(agingBuckets.days90Plus, inv.balanceDue);
    }
  }

  const sepOptions = {
    thousandsSeparator: settings.thousandsSeparator,
    decimalSeparator: settings.decimalSeparator,
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar & Cash vs Invoiced Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('nav.dashboard')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t('dash.cashDistinctionNote')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700">
            <Calendar className="h-3.5 w-3.5 text-teal-600" />
            <input
              type="date"
              aria-label="Date From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent focus:outline-none"
            />
            <span>to</span>
            <input
              type="date"
              aria-label="Date To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent focus:outline-none"
            />
          </div>

          <select
            aria-label="Dashboard Currency Filter"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="TZS">TZS (TSh)</option>
            <option value="KES">KES (KSh)</option>
            <option value="UGX">UGX (USh)</option>
            <option value="USD">USD ($)</option>
          </select>

          <button
            type="button"
            onClick={() => onNavigate('invoices')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 font-semibold text-white hover:bg-teal-700"
          >
            {t('action.createInvoice')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
            <span>{t('dash.totalInvoiced')}</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatMoney(totalInvoiced, selectedCurrency, sepOptions)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {issuedInvoices.length} issued invoice(s) in {selectedCurrency}
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 dark:border-teal-900/60 dark:bg-teal-950/20">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-teal-700 dark:text-teal-300">
            <span>{t('dash.paymentsReceived')}</span>
            <Wallet className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-teal-700 dark:text-teal-400">
            {formatMoney(paymentsReceived, selectedCurrency, sepOptions)}
          </div>
          <div className="mt-1 text-xs text-teal-700/80 dark:text-teal-300/80">
            {allPayments.length} recorded cash collection(s)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500">
            <span>{t('dash.outstandingReceivables')}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatMoney(outstandingReceivables, selectedCurrency, sepOptions)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Draft Quotes: {draftQuotationsCount} • Pending Quotes: {pendingQuotationsCount}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-red-700 dark:text-red-300">
            <span>{t('dash.overdueReceivables')}</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-700 dark:text-red-400">
            {formatMoney(overdueReceivables, selectedCurrency, sepOptions)}
          </div>
          <div className="mt-1 text-xs text-red-600/80">
            Requires payment follow-up action
          </div>
        </div>
      </div>

      {/* Receivables by Age & Monthly Trends */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            {t('dash.agingTitle')} ({selectedCurrency})
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-xs">
            {[
              { label: 'Not Yet Due', amount: agingBuckets.current, tone: 'text-teal-600' },
              { label: '1 – 30 Days', amount: agingBuckets.days1_30, tone: 'text-amber-600' },
              { label: '31 – 60 Days', amount: agingBuckets.days31_60, tone: 'text-orange-600' },
              { label: '61 – 90 Days', amount: agingBuckets.days61_90, tone: 'text-red-600' },
              { label: '90+ Days', amount: agingBuckets.days90Plus, tone: 'text-red-700 font-extrabold' },
            ].map((bucket, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="text-slate-500 font-medium">{bucket.label}</div>
                <div className={`mt-1.5 text-sm font-bold ${bucket.tone}`}>
                  {formatMoney(bucket.amount, selectedCurrency, sepOptions)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            {t('dash.monthlyTrends')}
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">Billed (Issued Invoices)</span>
                <span className="font-bold">{formatMoney(totalInvoiced, selectedCurrency, sepOptions)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div className="h-full bg-slate-900 dark:bg-slate-400 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-teal-700 dark:text-teal-400">Cash Collected (Payments)</span>
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {formatMoney(paymentsReceived, selectedCurrency, sepOptions)}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div className="h-full bg-teal-600 w-3/5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Issued Invoices & Recent Payments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase text-slate-500">{t('dash.recentInvoices')}</h2>
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              View All
            </button>
          </div>
          {allInvoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No invoices in {selectedCurrency} yet. Click "New Invoice" to create your first invoice.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {allInvoices.slice(0, 5).map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</div>
                    <div className="text-slate-500">
                      Issued: {inv.issueDate} • Due: {inv.dueDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatMoney(inv.grandTotal, inv.currency, sepOptions)}</div>
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase dark:bg-slate-800">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase text-slate-500">{t('dash.recentPayments')}</h2>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              View All
            </button>
          </div>
          {allPayments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No payments recorded in {selectedCurrency} during this date range.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {allPayments.slice(0, 5).map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {pay.receiptNumber || pay.paymentMethod}
                    </div>
                    <div className="text-slate-500">
                      {pay.paymentDate} • Ref: {pay.transactionReference || 'Manual'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-600">
                      +{formatMoney(pay.amount, pay.currency, sepOptions)}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {pay.verificationStatus === 'provider_confirmed' ? 'Provider Confirmed' : 'Manual Entry'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReportsView: React.FC = () => {
  const { currentUser, activeTenant } = useApp();
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business } = activeTenant;

  const invoices = db.listInvoices(currentUser.id, business.id);
  const payments = db.listPayments(currentUser.id, business.id).filter((p) => p.verificationStatus !== 'reversed');
  const expenses = db.listExpenses(currentUser.id, business.id);
  const clients = db.listClients(currentUser.id, business.id);
  const projects = db.listProjects(currentUser.id, business.id);
  const timeEntries = db.listTimeEntries(currentUser.id, business.id);

  // Strictly group totals by currency — never mix currencies without explicit conversion rate
  const invoicedByCurrency = sumByCurrency(
    invoices.filter((i) => i.status !== 'draft' && i.status !== 'voided'),
    (i) => i.currency,
    (i) => i.grandTotal
  );
  const receivablesByCurrency = sumByCurrency(
    invoices.filter((i) => i.status !== 'draft' && i.status !== 'voided'),
    (i) => i.currency,
    (i) => i.balanceDue
  );
  const paymentsByCurrency = sumByCurrency(
    payments,
    (p) => p.currency,
    (p) => p.amount
  );
  const expensesByCurrency = sumByCurrency(
    expenses,
    (e) => e.currency,
    (e) => e.amount
  );

  const handleExportCsv = (reportType: 'invoices' | 'payments' | 'expenses' | 'client_balances') => {
    setExportError(null);
    setExportMessage(null);
    try {
      db.assertSubscriptionEntitlement(business.id, 'csv_export');

      if (reportType === 'invoices') {
        const csv = generateCsvContent(
          ['Invoice Number', 'Status', 'Issue Date', 'Due Date', 'Currency', 'Subtotal', 'Tax', 'Grand Total', 'Paid', 'Balance Due'],
          invoices.map((i) => [
            i.invoiceNumber,
            i.status,
            i.issueDate,
            i.dueDate,
            i.currency,
            i.subtotal,
            i.taxTotal,
            i.grandTotal,
            i.amountPaid,
            i.balanceDue,
          ])
        );
        downloadCsvFile(`${business.slug}-invoices-report.csv`, csv);
      } else if (reportType === 'payments') {
        const csv = generateCsvContent(
          ['Receipt Number', 'Payment Date', 'Method', 'Reference', 'Verification', 'Currency', 'Amount'],
          payments.map((p) => [
            p.receiptNumber || '',
            p.paymentDate,
            p.paymentMethod,
            p.transactionReference,
            p.verificationStatus,
            p.currency,
            p.amount,
          ])
        );
        downloadCsvFile(`${business.slug}-payments-report.csv`, csv);
      } else if (reportType === 'expenses') {
        const csv = generateCsvContent(
          ['Date', 'Category', 'Vendor', 'Reference', 'Currency', 'Amount', 'Tax Amount'],
          expenses.map((e) => [
            e.expenseDate,
            e.categoryName,
            e.vendorName,
            e.referenceNumber,
            e.currency,
            e.amount,
            e.taxAmount,
          ])
        );
        downloadCsvFile(`${business.slug}-expenses-report.csv`, csv);
      } else {
        const rows = clients.map((c) => {
          const clientInvs = invoices.filter(
            (i) => i.clientId === c.id && i.status !== 'draft' && i.status !== 'voided'
          );
          const totalBalance = clientInvs.reduce((acc, i) => addMoney(acc, i.balanceDue), '0.00');
          return [c.name, c.tinNumber || 'N/A', c.preferredCurrency, clientInvs.length, totalBalance];
        });
        const csv = generateCsvContent(
          ['Client Name', 'TIN', 'Currency', 'Issued Invoices', 'Outstanding Balance'],
          rows
        );
        downloadCsvFile(`${business.slug}-client-balances.csv`, csv);
      }
      setExportMessage(`Exported ${reportType} CSV report grouped by currency.`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'CSV export failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold">Financial Reports & Currency-Grouped Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Amounts in different currencies are strictly grouped by currency and never summed together without an explicit conversion rate and timestamp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExportCsv('invoices')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600"
          >
            <Download className="h-3.5 w-3.5" />
            Invoices CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv('payments')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600" />
            Payments CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv('client_balances')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600" />
            Client Balances CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv('expenses')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600" />
            Expenses CSV
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {exportError}
        </div>
      )}
      {exportMessage && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          {exportMessage}
        </div>
      )}

      {/* Currency-Grouped Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold uppercase text-slate-500 mb-3">Issued Invoices by Currency</h2>
          {Object.entries(invoicedByCurrency).map(([curr, total]) => (
            <div key={curr} className="flex justify-between py-1 font-semibold text-sm">
              <span>{curr}:</span>
              <span>{formatMoney(total, curr as CurrencyCode)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold uppercase text-teal-600 mb-3">Payments Collected by Currency</h2>
          {Object.entries(paymentsByCurrency).map(([curr, total]) => (
            <div key={curr} className="flex justify-between py-1 font-semibold text-sm text-teal-700 dark:text-teal-400">
              <span>{curr}:</span>
              <span>{formatMoney(total, curr as CurrencyCode)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold uppercase text-amber-600 mb-3">Outstanding Receivables</h2>
          {Object.entries(receivablesByCurrency).map(([curr, total]) => (
            <div key={curr} className="flex justify-between py-1 font-semibold text-sm">
              <span>{curr}:</span>
              <span>{formatMoney(total, curr as CurrencyCode)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold uppercase text-slate-500 mb-3">Operating Expenses (Unaudited)</h2>
          {Object.entries(expensesByCurrency).map(([curr, total]) => (
            <div key={curr} className="flex justify-between py-1 font-semibold text-sm">
              <span>{curr}:</span>
              <span>{formatMoney(total, curr as CurrencyCode)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Profitability Estimates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-4">Project Profitability & Billable Hours Estimate</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 uppercase text-slate-500 dark:border-slate-800">
                <th className="py-2.5">Project</th>
                <th className="py-2.5">Currency</th>
                <th className="py-2.5 text-right">Budget</th>
                <th className="py-2.5 text-right">Approved Billable Value</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {projects.map((p) => {
                const projHoursValue = timeEntries
                  .filter((t) => t.projectId === p.id)
                  .reduce((acc, t) => addMoney(acc, t.totalAmount), '0.00');
                return (
                  <tr key={p.id}>
                    <td className="py-3 font-semibold">{p.name} ({p.code})</td>
                    <td className="py-3">{p.currency}</td>
                    <td className="py-3 text-right">{formatMoney(p.budgetAmount, p.currency)}</td>
                    <td className="py-3 text-right font-semibold text-teal-600">
                      {formatMoney(projHoursValue, p.currency)}
                    </td>
                    <td className="py-3 text-right uppercase">{p.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

