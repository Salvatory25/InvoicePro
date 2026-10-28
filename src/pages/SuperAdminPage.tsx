import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../services/database';
import { getActiveBackendMode } from '../lib/supabase';

export const SuperAdminPage: React.FC = () => {
  const { currentUser, refreshWorkspace } = useApp();
  const [suspendReason, setSuspendReason] = useState('Terms of service / compliance review');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  if (!currentUser || !currentUser.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 dark:bg-slate-900">
          <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
          <h1 className="text-lg font-bold">Super-Administrator Access Required</h1>
          <p className="text-xs text-slate-500">
            This console is restricted to authorized InvoicePro platform super-administrators.
          </p>
          <Link to="/app" className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  const overview = db.getSuperAdminOverview(currentUser.id);

  const handleToggleSuspension = (businessId: string, suspend: boolean) => {
    setError(null);
    setFeedback(null);
    try {
      const updated = db.superAdminSetBusinessSuspension(
        currentUser.id,
        businessId,
        suspend,
        suspendReason
      );
      setFeedback(
        `${suspend ? 'Suspended' : 'Restored'} business "${updated.name}" and recorded action in immutable audit log.`
      );
      refreshWorkspace();
      setTick((x) => x + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-teal-600">
              <ShieldCheck className="h-4 w-4" />
              Platform Governance & Operations
            </div>
            <h1 className="text-2xl font-extrabold mt-0.5">InvoicePro Super-Admin Console</h1>
            <p className="text-xs text-slate-500 mt-1">
              Least-Privilege Privacy Safeguard: Super-administrators manage platform health, plans, and account status, and cannot view or silently alter customer financial records.
            </p>
          </div>

          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenant App
          </Link>
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

        {/* Operational KPIs & System Health */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between text-slate-500 font-semibold uppercase">
              <span>Registered Users</span>
              <Users className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold mt-2">{overview.totalUsers}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between text-slate-500 font-semibold uppercase">
              <span>Business Tenants</span>
              <Building2 className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold mt-2">{overview.totalBusinesses}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between text-slate-500 font-semibold uppercase">
              <span>Failed Notification Jobs</span>
              <AlertOctagon className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold mt-2">{overview.failedNotificationJobs.length}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between text-slate-500 font-semibold uppercase">
              <span>System Health & Mode</span>
              <Activity className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-sm font-bold mt-2 uppercase text-teal-600">
              Healthy ({getActiveBackendMode()})
            </div>
            <div className="text-[11px] text-slate-500 mt-1">RLS & Tenant Checks Active</div>
          </div>
        </div>

        {/* Tenant Suspension & Subscription Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600" />
              Tenant Metadata & Authorized Suspension Controls (Financial Documents Redacted)
            </h2>
            <input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Mandatory audit reason for suspension/restoration"
              className="rounded-lg border border-slate-300 px-3 py-1.5 w-72 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-2.5">Business Name</th>
                  <th className="py-2.5">Country</th>
                  <th className="py-2.5">Plan Tier</th>
                  <th className="py-2.5">Sub Status</th>
                  <th className="py-2.5">Account State</th>
                  <th className="py-2.5 text-right">Authorized Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {overview.businessesSummary.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 font-bold">{b.name}</td>
                    <td className="py-3">{b.countryCode}</td>
                    <td className="py-3 uppercase font-semibold">{b.planId}</td>
                    <td className="py-3 uppercase">{b.subscriptionStatus}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          b.isSuspended ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {b.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleSuspension(b.id, !b.isSuspended)}
                        className={`rounded-lg px-3 py-1 font-semibold text-white ${
                          b.isSuspended ? 'bg-teal-600' : 'bg-red-600'
                        }`}
                      >
                        {b.isSuspended ? 'Restore Tenant' : 'Suspend Tenant'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Support Tickets & Audit Trail */}
        <div className="grid lg:grid-cols-2 gap-6 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold">Support Tickets ({overview.supportTickets.length})</h2>
            {overview.supportTickets.length === 0 ? (
              <p className="text-slate-500">No open support tickets.</p>
            ) : (
              overview.supportTickets.map((tkt) => (
                <div key={tkt.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="font-bold">{tkt.subject} ({tkt.businessName})</div>
                  <div className="text-slate-500 mt-1">{tkt.description}</div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold">Platform Security & Administrative Audit Logs</h2>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {overview.recentAuditLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="py-2 flex justify-between gap-2">
                  <div>
                    <span className="font-bold text-teal-700 dark:text-teal-400">{log.action}</span> by{' '}
                    <span>{log.actorEmail}</span> ({log.actorRole})
                  </div>
                  <span className="text-slate-400 shrink-0">{log.createdAt.slice(0, 19).replace('T', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

