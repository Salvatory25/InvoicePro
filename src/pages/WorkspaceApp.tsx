import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Building2,
  FileCheck2,
  FileText,
  FolderKanban,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  PlusCircle,
  Receipt,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DashboardView, ReportsView } from './modules/DashboardAndReportsView';
import { InvoicesView, QuotationsView } from './modules/InvoicesAndQuotationsView';
import { ClientsView, ProductsServicesView } from './modules/ClientsAndProductsView';
import {
  ExpensesView,
  PaymentsView,
  ProjectsAndAiView,
} from './modules/PaymentsExpensesProjectsView';
import { SettingsView, TeamView } from './modules/TeamAndSettingsView';
import { BusinessRole } from '../types/domain';

export type WorkspaceSection =
  | 'dashboard'
  | 'invoices'
  | 'quotations'
  | 'clients'
  | 'products'
  | 'payments'
  | 'expenses'
  | 'projects'
  | 'reports'
  | 'team'
  | 'settings';

export const WorkspaceApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    userBusinesses,
    activeTenant,
    language,
    setLanguage,
    theme,
    toggleTheme,
    selectBusiness,
    logout,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (!activeTenant || userBusinesses.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  const pathPart = location.pathname.replace(/^\/app\/?/, '') || 'dashboard';
  const activeSection: WorkspaceSection = (
    [
      'dashboard',
      'invoices',
      'quotations',
      'clients',
      'products',
      'payments',
      'expenses',
      'projects',
      'reports',
      'team',
      'settings',
    ].includes(pathPart)
      ? pathPart
      : 'dashboard'
  ) as WorkspaceSection;

  const { business, role, settings, plan } = activeTenant;

  // Role-based and feature-based navigation visibility (Section 14 requirement)
  const navItems: Array<{
    id: WorkspaceSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    allowedRoles: BusinessRole[];
    enabled?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'invoices',
      label: t('nav.invoices'),
      icon: FileText,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'quotations',
      label: t('nav.quotations'),
      icon: FileCheck2,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
      enabled: plan.allowQuotations,
    },
    {
      id: 'clients',
      label: t('nav.clients'),
      icon: Briefcase,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'products',
      label: t('nav.products'),
      icon: Package,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'payments',
      label: t('nav.payments'),
      icon: Wallet,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'expenses',
      label: t('nav.expenses'),
      icon: Receipt,
      allowedRoles: ['owner', 'admin', 'accountant', 'viewer'], // Sales staff do not see operating expenses
    },
    {
      id: 'projects',
      label: t('nav.projects'),
      icon: FolderKanban,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
      enabled: settings.enableProjectsModule && plan.allowProjectsTime,
    },
    {
      id: 'reports',
      label: t('nav.reports'),
      icon: BarChart3,
      allowedRoles: ['owner', 'admin', 'accountant', 'viewer'],
    },
    {
      id: 'team',
      label: t('nav.team'),
      icon: Users,
      allowedRoles: ['owner', 'admin', 'accountant', 'sales', 'viewer'],
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      allowedRoles: ['owner', 'admin'],
    },
  ];

  const permittedNavItems = navItems.filter(
    (item) => item.allowedRoles.includes(role) && item.enabled !== false
  );

  const handleNavigateSection = (sec: string) => {
    setMobileMenuOpen(false);
    navigate(sec === 'dashboard' ? '/app' : `/app/${sec}`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Workspace Sidebar Navigation"
        className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-base">
            <span className="h-8 w-8 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center text-xs">
              IP
            </span>
            <span>InvoicePro</span>
          </Link>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
            {role}
          </span>
        </div>

        {/* Multi-Business Tenant Selector */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <label htmlFor="tenant-select" className="block text-[10px] font-bold uppercase text-slate-400">
            Active Business Tenant
          </label>
          <select
            id="tenant-select"
            value={business.id}
            onChange={(e) => selectBusiness(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
          >
            {userBusinesses.map((ub) => (
              <option key={ub.business.id} value={ub.business.id}>
                {ub.business.name} ({ub.business.defaultCurrency})
              </option>
            ))}
          </select>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:underline"
          >
            <PlusCircle className="h-3 w-3" /> Add Another Business
          </Link>
        </div>

        {/* Permitted Modules Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {permittedNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateSection(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-teal-600'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Super-Admin & User Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          {currentUser.isSuperAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 font-bold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300"
            >
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              {t('nav.superadmin')}
            </Link>
          )}
          <div className="flex items-center justify-between pt-1">
            <div className="truncate pr-2">
              <div className="font-bold truncate">{currentUser.fullName}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              title={t('action.logout')}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg border border-slate-200 p-2 dark:border-slate-700"
              aria-label="Toggle Navigation Drawer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600 hidden sm:inline" />
              <span className="font-bold text-sm truncate">{business.name}</span>
              <span className="hidden md:inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                TIN: {business.tinNumber || 'Unset'} • {business.defaultCurrency}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700"
            >
              <Globe className="h-3.5 w-3.5 text-teal-600" />
              {language === 'en' ? 'SW' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100 dark:border-slate-700"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900">
            {permittedNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateSection(item.id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                  activeSection === item.id ? 'bg-teal-600 text-white' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Module Viewport — 100% Full Width with Fluid Spacing */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 xl:px-14 w-full animate-fade-up">
          {activeSection === 'dashboard' && <DashboardView onNavigate={handleNavigateSection} />}
          {activeSection === 'invoices' && <InvoicesView />}
          {activeSection === 'quotations' && <QuotationsView />}
          {activeSection === 'clients' && <ClientsView />}
          {activeSection === 'products' && <ProductsServicesView />}
          {activeSection === 'payments' && <PaymentsView />}
          {activeSection === 'expenses' && <ExpensesView />}
          {activeSection === 'projects' && <ProjectsAndAiView />}
          {activeSection === 'reports' && <ReportsView />}
          {activeSection === 'team' && <TeamView />}
          {activeSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

