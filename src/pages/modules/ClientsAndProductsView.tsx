import React, { useState } from 'react';
import { Archive, Building2, Package, Plus, Search, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { CurrencyCode, formatMoney } from '../../lib/money';
import { Client, LanguageCode } from '../../types/domain';

export const ClientsView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState<Client | null>(null);

  const [clientType, setClientType] = useState<'company' | 'individual'>('company');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+255 ');
  const [tinNumber, setTinNumber] = useState('');
  const [vrnNumber, setVrnNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('Dar es Salaam');
  const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>('TZS');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, role } = activeTenant;
  const canWrite = ['owner', 'admin', 'accountant', 'sales'].includes(role);

  const clients = db
    .listClients(currentUser.id, business.id, showArchived)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.tinNumber.toLowerCase().includes(search.toLowerCase())
    );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = db.createClient(currentUser.id, business.id, {
        clientType,
        name,
        contactPerson,
        email,
        phone,
        tinNumber,
        vrnNumber,
        billingAddress,
        city,
        preferredCurrency,
        preferredLanguage,
        confirmDuplicateOverride: confirmDuplicate,
      });
      setFeedback(`Added client "${created.name}".`);
      setShowModal(false);
      setName('');
      setEmail('');
      setTinNumber('');
      setConfirmDuplicate(false);
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold">{t('nav.clients')}</h1>
          <p className="text-xs text-slate-500">
            Manage individual and corporate clients, TIN/VRN tax IDs, duplicate detection, and transaction history.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowModal(!showModal)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Client
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, email, or TIN..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show Archived Clients
        </label>
      </div>

      {showModal && (
        <form
          onSubmit={handleCreateClient}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-4 text-xs dark:bg-slate-900"
        >
          <h2 className="text-sm font-bold">New Client Profile</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Client Type</label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value as 'company' | 'individual')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="company">Company / Organization</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Client / Company Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Contact Person</label>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">TIN Number</label>
              <input
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="e.g. 112-409-558"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">VRN Number</label>
              <input
                value={vrnNumber}
                onChange={(e) => setVrnNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Preferred Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="TZS">TZS</option>
                <option value="KES">KES</option>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Billing Address</label>
              <input
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Document Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-amber-700 font-semibold">
            <input
              type="checkbox"
              checked={confirmDuplicate}
              onChange={(e) => setConfirmDuplicate(e.target.checked)}
            />
            Confirm intentional creation if duplicate name/email/TIN exists
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-1.5 font-semibold text-white">
              Save Client
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center dark:bg-slate-800 dark:text-slate-200">
                  {client.clientType === 'company' ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">{client.name}</h3>
                  <div className="text-xs text-slate-500">
                    {client.city} • {client.preferredCurrency} ({client.preferredLanguage.toUpperCase()})
                  </div>
                </div>
              </div>
              {canWrite && (
                <button
                  type="button"
                  title="Archive / Unarchive Client"
                  onClick={() => {
                    db.updateClient(currentUser.id, business.id, client.id, { isArchived: !client.isArchived });
                    refreshWorkspace();
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              {client.tinNumber && <div><strong>TIN:</strong> {client.tinNumber}</div>}
              <div>{client.email} • {client.phone}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setSelectedClientHistory(client)}
                className="font-semibold text-teal-600 hover:underline"
              >
                View Transaction History
              </button>
              {client.isArchived && (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                  Archived
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedClientHistory && (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 space-y-4 text-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">
              Client Transaction History — {selectedClientHistory.name}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedClientHistory(null)}
              className="text-slate-500 hover:underline"
            >
              Close
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold uppercase text-slate-500 mb-2">Related Invoices</h3>
              {db
                .listInvoices(currentUser.id, business.id)
                .filter((i) => i.clientId === selectedClientHistory.id)
                .map((i) => (
                  <div key={i.id} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span>{i.invoiceNumber} ({i.status})</span>
                    <span className="font-semibold">Bal: {formatMoney(i.balanceDue, i.currency)}</span>
                  </div>
                ))}
            </div>
            <div>
              <h3 className="font-bold uppercase text-slate-500 mb-2">Related Payments</h3>
              {db
                .listPayments(currentUser.id, business.id)
                .filter((p) => p.clientId === selectedClientHistory.id)
                .map((p) => (
                  <div key={p.id} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span>{p.receiptNumber} ({p.paymentDate})</span>
                    <span className="font-semibold text-teal-600">{formatMoney(p.amount, p.currency)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductsServicesView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [itemType, setItemType] = useState<'service' | 'product'>('service');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('unit');
  const [unitPrice, setUnitPrice] = useState('250000.00');
  const [taxRate, setTaxRate] = useState(activeTenant?.settings.defaultTaxRate ?? '18.00');

  if (!currentUser || !activeTenant) return null;
  const { business, role } = activeTenant;
  const canWrite = ['owner', 'admin', 'accountant', 'sales'].includes(role);

  const items = db
    .listProductsServices(currentUser.id, business.id)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    db.createProductService(currentUser.id, business.id, {
      itemType,
      name,
      sku,
      unit,
      unitPrice,
      taxRate,
    });
    setName('');
    setSku('');
    setShowCreate(false);
    refreshWorkspace();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold">{t('nav.products')}</h1>
          <p className="text-xs text-slate-500">
            Reusable line items, service codes, default units, and tax rates for fast quotation and invoice creation.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            New Item
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reusable catalog items..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border-2 border-teal-600 bg-white p-6 space-y-4 text-xs dark:bg-slate-900"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as 'service' | 'product')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">SKU / Service Code</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit (e.g. project, hr, month)</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit Price ({business.defaultCurrency})</label>
              <input
                type="number"
                step="0.01"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-600 px-4 py-1.5 font-semibold text-white">
              Save Item
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-teal-600">
                <Package className="h-3.5 w-3.5" />
                {item.itemType}
              </span>
              {item.sku && <span className="text-xs font-mono text-slate-400">{item.sku}</span>}
            </div>
            <h3 className="text-sm font-bold">{item.name}</h3>
            <div className="text-xs text-slate-500">
              {formatMoney(item.unitPrice, item.currency)} / {item.unit} • {item.taxLabel} {item.taxRate}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

