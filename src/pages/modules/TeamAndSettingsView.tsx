import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, DEFAULT_SUBSCRIPTION_PLANS } from '../../services/database';
import { formatMoney } from '../../lib/money';
import { BusinessRole, EAST_AFRICA_COUNTRIES, SubscriptionPlanId } from '../../types/domain';

export const TeamView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<BusinessRole>('sales');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, role, plan } = activeTenant;
  const canManageTeam = role === 'owner' || role === 'admin';

  const { members, invitations } = db.getBusinessTeam(currentUser.id, business.id);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const inv = db.inviteTeamMember(currentUser.id, business.id, inviteEmail, inviteRole);
      setFeedback(`Invited ${inv.email} with role "${inv.role}" (Status: ${inv.status}).`);
      setInviteEmail('');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invitation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            {t('nav.team')}
          </h1>
          <p className="text-xs text-slate-500">
            Active seats: {members.filter((m) => m.isActive).length} / {plan.maxTeamMembers} ({plan.nameEn}). Authorization is enforced on the database and service layer.
          </p>
        </div>
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

      {canManageTeam && (
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-teal-600" />
            Invite Team Member
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.co.tz"
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as BusinessRole)}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="admin">Business Administrator</option>
              <option value="accountant">Accountant / Finance Staff</option>
              <option value="sales">Sales / Billing Staff</option>
              <option value="viewer">Read-Only Team Member</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
            >
              Send Role Invitation
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="py-3 px-4">Team Member</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-3.5 px-4 font-bold">{m.userFullName}</td>
                <td className="py-3.5 px-4">{m.userEmail}</td>
                <td className="py-3.5 px-4">
                  {canManageTeam && m.userId !== currentUser.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => {
                        db.updateMemberRole(
                          currentUser.id,
                          business.id,
                          m.id,
                          e.target.value as BusinessRole,
                          m.isActive
                        );
                        refreshWorkspace();
                      }}
                      className="rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="accountant">Accountant</option>
                      <option value="sales">Sales</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="uppercase font-semibold">{m.role}</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invitations.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 text-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold">Team Invitations</h3>
          {invitations.map((inv) => (
            <div key={inv.id} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span>{inv.email} — Role: <strong>{inv.role}</strong></span>
              <span className="uppercase font-semibold">{inv.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { currentUser, activeTenant, refreshWorkspace, t } = useApp();
  const [subTab, setSubTab] = useState<'profile' | 'subscription' | 'support'>('profile');

  const [name, setName] = useState(activeTenant?.business.name ?? '');
  const [tinNumber, setTinNumber] = useState(activeTenant?.business.tinNumber ?? '');
  const [vrnNumber, setVrnNumber] = useState(activeTenant?.business.vrnNumber ?? '');
  const [invoicePrefix, setInvoicePrefix] = useState(activeTenant?.settings.invoicePrefix ?? 'INV');
  const [defaultTaxLabel, setDefaultTaxLabel] = useState(activeTenant?.settings.defaultTaxLabel ?? 'VAT');
  const [defaultTaxRate, setDefaultTaxRate] = useState(activeTenant?.settings.defaultTaxRate ?? '18.00');
  const [mobileMoneyNetwork, setMobileMoneyNetwork] = useState(
    activeTenant?.settings.mobileMoneyNetwork ?? ''
  );
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(
    activeTenant?.settings.mobileMoneyNumber ?? ''
  );
  const [bankName, setBankName] = useState(activeTenant?.settings.bankName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    activeTenant?.settings.bankAccountNumber ?? ''
  );

  // Subscription state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    activeTenant?.subscription.planId ?? 'professional'
  );
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    activeTenant?.subscription.billingInterval ?? 'monthly'
  );
  const [manualPaymentRef, setManualPaymentRef] = useState('');

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser || !activeTenant) return null;
  const { business, subscription, plan } = activeTenant;
  const countryInfo = EAST_AFRICA_COUNTRIES[business.countryCode] ?? EAST_AFRICA_COUNTRIES.TZ;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      db.updateBusinessProfile(currentUser.id, business.id, {
        name,
        tinNumber,
        vrnNumber,
        invoicePrefix,
        defaultTaxLabel,
        defaultTaxRate,
        mobileMoneyNetwork,
        mobileMoneyNumber,
        bankName,
        bankAccountNumber,
      });
      setFeedback('Updated business profile, tax configuration, and payment instructions.');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handlePlanChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      db.changeSubscriptionPlan(
        currentUser.id,
        business.id,
        selectedPlan,
        billingInterval,
        manualPaymentRef
      );
      setFeedback(
        `Updated subscription to ${selectedPlan.toUpperCase()} (${billingInterval}) — Verification Mode: Explicitly Labeled Manual Verification.`
      );
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription change failed.');
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      db.createSupportTicket(currentUser.id, business.id, {
        subject: ticketSubject,
        category: 'billing',
        priority: 'normal',
        description: ticketDesc,
      });
      setFeedback('Support ticket submitted to platform administration.');
      setTicketSubject('');
      setTicketDesc('');
      refreshWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit ticket.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${subTab === 'profile' ? 'bg-slate-900 text-white dark:bg-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
              }`}
          >
            Business, Tax & Numbering
          </button>
          <button
            type="button"
            onClick={() => setSubTab('subscription')}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${subTab === 'subscription' ? 'bg-slate-900 text-white dark:bg-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
              }`}
          >
            SaaS Subscription & Limits ({plan.nameEn})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('support')}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${subTab === 'support' ? 'bg-slate-900 text-white dark:bg-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
              }`}
          >
            Support Tickets
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          {feedback}
        </div>
      )}

      {subTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Building2 className="h-4 w-4 text-teal-600" />
            {t('nav.settings')} — {business.name} ({business.countryCode})
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900">
            <strong>Regulatory & Fiscal Document Notice ({countryInfo.nameEn}):</strong> {countryInfo.fiscalAuthorityNoteEn}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Business Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{countryInfo.primaryTaxIdLabel}</label>
              <input
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{countryInfo.secondaryTaxIdLabel}</label>
              <input
                value={vrnNumber}
                onChange={(e) => setVrnNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Invoice Prefix</label>
              <input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Configurable Tax Label</label>
              <input
                value={defaultTaxLabel}
                onChange={(e) => setDefaultTaxLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Configurable Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Mobile Money Network</label>
              <input
                value={mobileMoneyNetwork}
                onChange={(e) => setMobileMoneyNetwork(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Lipa Namba / Merchant Number</label>
              <input
                value={mobileMoneyNumber}
                onChange={(e) => setMobileMoneyNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Bank & Account Number</label>
              <input
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700"
          >
            {t('action.save')}
          </button>
        </form>
      )}

      {subTab === 'subscription' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-600" />
                Subscription Plan & Feature Entitlements
              </h2>
              <p className="text-slate-500 mt-0.5">
                Current Tier: <strong>{plan.nameEn}</strong> • Status: <strong>{subscription.status}</strong> • Verification: <strong>{subscription.verificationMode}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handlePlanChange} className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-semibold mb-1">Select Plan Tier</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlanId)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {DEFAULT_SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameEn} — {formatMoney(p.monthlyPriceTzs, 'TZS', { hideDecimalsForWholeShillings: true })}/mo ({p.maxInvoicesPerMonth} inv/mo)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Billing Interval</label>
              <select
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as 'monthly' | 'annual')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="monthly">Monthly Billing</option>
                <option value="annual">Annual Billing</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Manual Verification Payment Reference</label>
              <input
                value={manualPaymentRef}
                onChange={(e) => setManualPaymentRef(e.target.value)}
                placeholder="e.g. SUB-MPESA-20261028"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Subscription billing is kept strictly separate from invoices you issue to your clients.
              </span>
              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700"
              >
                Update Plan (Manual Verification Workflow)
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === 'support' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-600" />
            Platform Support Tickets
          </h2>
          <form onSubmit={handleTicketSubmit} className="space-y-3">
            <input
              required
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Ticket Subject"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <textarea
              required
              rows={3}
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              placeholder="Describe your question or issue..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white">
              Submit Support Ticket
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

