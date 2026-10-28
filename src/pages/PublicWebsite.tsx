import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SUBSCRIPTION_PLANS } from '../services/database';
import {
  calculateDocumentTotals,
  calculateInvoiceBalance,
  CurrencyCode,
  formatMoney,
} from '../lib/money';
import {
  AnimatedCounter,
  Interactive3DTiltCard,
  ScrollReveal,
} from '../components/MotionGraphics';

export type PublicPageType =
  | 'home'
  | 'features'
  | 'pricing'
  | 'use-cases'
  | 'help'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'terms';

const SEO_METADATA: Record<PublicPageType, { titleEn: string; titleSw: string; descEn: string; descSw: string }> = {
  home: {
    titleEn: 'InvoicePro Tanzania — Invoicing Software, Quotation Generator & Receivables Workflow',
    titleSw: 'InvoicePro Tanzania — Mfumo wa Kutengeneza Ankara, Quotation na Kufuatilia Malipo ya Wateja',
    descEn:
      'Invoicing software Tanzania and quotation generator built for freelancers, consultants, agencies, and SMBs. Create branded English & Kiswahili PDF invoices and track client receivables.',
    descSw:
      'Mfumo wa ankara Tanzania na programu ya kutengeneza invoice na quotation kwa Kiswahili na Kiingereza. Fuatilia malipo ya wateja kwa urahisi.',
  },
  features: {
    titleEn: 'Features — Invoice Generator, Quotations, Client Portal & Receivables | InvoicePro',
    titleSw: 'Huduma Zetu — Kutengeneza Quotation, Invoice PDF Kiswahili na Ufuatiliaji Malipo | InvoicePro',
    descEn:
      'Explore InvoicePro modules: sequential invoice numbering, quotation-to-invoice conversion, partial payment allocation, credit notes, project time tracking, and client portal.',
    descSw:
      'Fahamu huduma za InvoicePro: mfumo wa kutengeneza ankara, kutengeneza quotation, risiti za malipo, na ufuatiliaji wa madeni ya wateja.',
  },
  pricing: {
    titleEn: 'Pricing — Transparent TZS Plans for Freelancers, Agencies & SMBs | InvoicePro Tanzania',
    titleSw: 'Gharama za Mfumo — Mipango ya TZS kwa Wajasiriamali na Kampuni | InvoicePro Tanzania',
    descEn:
      'Transparent proposed subscription plans in Tanzanian Shillings (TSh) from Free to Business tier with role-based access control.',
    descSw: 'Gharama nafuu kwa Shilingi ya Tanzania (TSh) kuanzia mpango wa Bure hadi Biashara.',
  },
  'use-cases': {
    titleEn: 'Use Cases — Consultants, Agencies, Contractors & Growing Businesses | InvoicePro',
    titleSw: 'Matumizi — Washauri, Wakandarasi na Biashara Ndogo na za Kati | InvoicePro',
    descEn: 'How Tanzanian and East African service businesses manage quotations, milestones, retainers, and collections.',
    descSw: 'Jinsi biashara za huduma Tanzania na Afrika Mashariki zinavyosimamia mikataba, ankara na malipo.',
  },
  help: {
    titleEn: 'Help Centre — Getting Started with Invoicing & Tax Configuration | InvoicePro',
    titleSw: 'Kituo cha Msaada — Mwongozo wa Kutumia Mfumo wa Ankara | InvoicePro',
    descEn: 'Step-by-step documentation on numbering formats, VAT configuration, credit notes, and TRA VFD distinction.',
    descSw: 'Mwongozo wa hatua kwa hatua kuhusu namba za ankara, kodi ya VAT, credit notes na tofauti ya risiti za TRA.',
  },
  faq: {
    titleEn: 'Frequently Asked Questions — InvoicePro Tanzania Billing Software',
    titleSw: 'Maswali ya Mara kwa Mara — Mfumo wa Ankara wa InvoicePro Tanzania',
    descEn: 'Honest answers about multi-currency billing, Kiswahili invoice PDFs, partial payments, and fiscal compliance.',
    descSw: 'Majibu kuhusu ankara za Kiswahili, malipo ya awamu, sarafu nyingi na ulinzi wa taarifa.',
  },
  contact: {
    titleEn: 'Contact InvoicePro — Dar es Salaam, Tanzania Support & Onboarding',
    titleSw: 'Wasiliana na InvoicePro — Huduma kwa Wateja Dar es Salaam, Tanzania',
    descEn: 'Reach the InvoicePro product and engineering team for onboarding, enterprise setup, or billing support.',
    descSw: 'Wasiliana na timu ya InvoicePro kwa msaada wa kiufundi na ushauri wa mfumo.',
  },
  privacy: {
    titleEn: 'Privacy Policy & Tenant Data Protection | InvoicePro',
    titleSw: 'Sera ya Faragha na Ulinzi wa Taarifa za Biashara | InvoicePro',
    descEn: 'How InvoicePro protects tenant financial records using PostgreSQL Row Level Security and strict access controls.',
    descSw: 'Jinsi InvoicePro inavyolinda taarifa za kifedha za biashara yako kwa usalama wa hali juu.',
  },
  terms: {
    titleEn: 'Terms of Service & Commercial Document Notice | InvoicePro',
    titleSw: 'Vigezo na Masharti ya Huduma | InvoicePro',
    descEn: 'Terms governing use of InvoicePro commercial invoicing, quotation workflows, and subscription billing.',
    descSw: 'Vigezo na masharti ya matumizi ya mfumo wa ankara wa InvoicePro.',
  },
};

const MARQUEE_PILLARS = [
  'DECIMAL-SAFE BIGINT FINANCIAL ARITHMETIC',
  'M-PESA • MIXX BY YAS • AIRTEL MONEY • CRDB RTGS',
  'POSTGRESQL ROW LEVEL SECURITY (RLS)',
  'BILINGUAL KISWAHILI & ENGLISH PDF DOCUMENTS',
  'ATOMIC SEQUENTIAL DOCUMENT NUMBERING',
  'IDEMPOTENT PARTIAL PAYMENT RECONCILIATION',
  'EXPIRING & REVOCABLE CLIENT PORTAL LINKS',
  'MULTI-CURRENCY GROUPING (TZS • KES • UGX • RWF • USD)',
];

const PAYMENT_RAILS = [
  {
    id: 'mpesa',
    name: 'M-Pesa Tanzania',
    code: 'Lipa Namba • 5582910',
    settlement: 'Instant Mobile Money Reference',
    badge: 'TZS',
  },
  {
    id: 'mixx',
    name: 'Mixx by Yas',
    code: 'Merchant Pay • 884120',
    settlement: 'Mobile Wallet Allocation',
    badge: 'TZS',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    code: 'Business Till • 339104',
    settlement: 'East Africa Cross-Network',
    badge: 'TZS / KES',
  },
  {
    id: 'crdb',
    name: 'CRDB / NMB Bank',
    code: 'RTGS & EFT • 0150482910200',
    settlement: 'Corporate Bank Settlement',
    badge: 'TZS / USD',
  },
  {
    id: 'visa',
    name: 'VISA / Mastercard',
    code: 'International Settlement',
    settlement: 'Zero Raw Card Storage',
    badge: 'USD / EUR',
  },
];

export const PublicWebsite: React.FC<{ page: PublicPageType }> = ({ page }) => {
  const { currentUser, language, setLanguage, theme, toggleTheme, t } = useApp();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });

  // Interactive Hero Workspace Simulator State
  const [heroTab, setHeroTab] = useState<'invoice' | 'quote' | 'receivables' | 'portal'>('invoice');
  const [simulatedPaymentStage, setSimulatedPaymentStage] = useState<'issued' | 'partial' | 'paid'>('partial');
  const [quoteConvertedDemo, setQuoteConvertedDemo] = useState<boolean>(false);
  const [selectedRailId, setSelectedRailId] = useState<string>('mpesa');

  // Interactive Bento States
  const [immutabilityDemoMode, setImmutabilityDemoMode] = useState<'locked' | 'credit_note'>('locked');
  const [bentoCurrency, setBentoCurrency] = useState<'TZS' | 'KES' | 'USD'>('TZS');
  const [bentoDocLang, setBentoDocLang] = useState<'en' | 'sw'>('en');

  // Interactive 4-Step Workflow Scrubber State
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  // Interactive Pricing Interval
  const [planInterval, setPlanInterval] = useState<'monthly' | 'annual'>('monthly');

  // Interactive Live Decimal-Safe Sandbox Calculator State
  const [sandboxCurrency, setSandboxCurrency] = useState<CurrencyCode>('TZS');
  const [sandboxUnitPrice, setSandboxUnitPrice] = useState<string>('3500000');
  const [sandboxQty, setSandboxQty] = useState<string>('1');
  const [sandboxTaxRate, setSandboxTaxRate] = useState<string>('18.00');
  const [sandboxDepositPercent, setSandboxDepositPercent] = useState<number>(50);

  useEffect(() => {
    const meta = SEO_METADATA[page] ?? SEO_METADATA.home;
    document.title = language === 'sw' ? meta.titleSw : meta.titleEn;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute('content', language === 'sw' ? meta.descSw : meta.descEn);
    }
  }, [page, language]);

  // Live Sandbox Calculations using our real decimal-safe engine
  let sandboxTotals = { subtotal: '0.00', discountTotal: '0.00', taxTotal: '0.00', grandTotal: '0.00' };
  try {
    sandboxTotals = calculateDocumentTotals([
      {
        quantity: sandboxQty || '1',
        unitPrice: sandboxUnitPrice || '0',
        discountAmount: '0.00',
        taxRatePercent: sandboxTaxRate,
      },
    ]);
  } catch {
    // Ignore transient typing
  }

  const depositPaidRaw = (
    (Number(sandboxTotals.grandTotal) * sandboxDepositPercent) /
    100
  ).toFixed(2);
  const sandboxBalanceInfo = calculateInvoiceBalance(
    sandboxTotals.grandTotal,
    '0.00',
    depositPaidRaw
  );

  const activeRail = PAYMENT_RAILS.find((r) => r.id === selectedRailId) ?? PAYMENT_RAILS[0];

  const bentoCurrencyData = {
    TZS: { invoiced: 'TSh 28,450,000', collected: 'TSh 21,900,000', outstanding: 'TSh 6,550,000', taxLabel: '18% TRA VAT' },
    KES: { invoiced: 'KSh 1,420,000', collected: 'KSh 1,180,000', outstanding: 'KSh 240,000', taxLabel: '16% KRA VAT' },
    USD: { invoiced: '$18,500.00', collected: '$14,200.00', outstanding: '$4,300.00', taxLabel: '0% Export Service' },
  }[bentoCurrency];

  const workflowSteps = [
    {
      step: '01',
      title: language === 'sw' ? 'Tengeneza Quotation na Wigo wa Kazi' : 'Draft & Share Client Quotation',
      role: 'Sales / Owner',
      docCode: 'QUO-2026-0009',
      status: 'ACCEPTED BY CLIENT',
      desc:
        language === 'sw'
          ? 'Andaa makadirio ya gharama kwa Kiswahili au Kiingereza, weka tarehe ya mwisho wa uhalali, na tuma kiungo salama cha Tovuti ya Mteja.'
          : 'Build itemized estimates with configurable tax rates, validity dates, and revision tracking. Clients review and accept online via an expiring portal link.',
      highlights: [
        'Full revision history (v1, v2) preserved',
        'Client acceptance timestamp recorded in audit log',
        'Reusable catalog of products & hourly services',
      ],
    },
    {
      step: '02',
      title: language === 'sw' ? 'Badilisha Kuwa Ankara Rasmi Isiyofutika' : 'Convert & Lock Sequential Invoice',
      role: 'Billing / Accountant',
      docCode: 'INV-2026-0014',
      status: 'ISSUED & IMMUTABLE',
      desc:
        language === 'sw'
          ? 'Geuza quotation iliyokubaliwa kuwa ankara kwa kubofya mara moja. Mfumo unazuia ankara iliyotolewa kufutwa au kubadilishwa kimyakimya.'
          : 'Convert approved quotes in one click with duplicate-conversion protection. Once issued, database triggers lock the invoice against silent overwrites.',
      highlights: [
        'Atomic per-business numbering (INV-2026-0014)',
        'PostgreSQL trigger blocks silent mutation of issued totals',
        'Auditable Credit Notes (CN-2026-0001) for controlled adjustments',
      ],
    },
    {
      step: '03',
      title: language === 'sw' ? 'Pokea Malipo ya Awamu au Kamili' : 'Allocate Partial or Full Payments',
      role: 'Finance / Accountant',
      docCode: 'PAY-MPESA-94820',
      status: 'PARTIALLY PAID (50%)',
      desc:
        language === 'sw'
          ? 'Rekodi malipo ya M-Pesa, Mixx by Yas, Airtel Money au Benki. Mfumo unazuia kuingiza malipo mara mbili kwa namba moja ya muamala.'
          : 'Record mobilization deposits and installment payments across mobile money and bank rails with idempotency keys that prevent double-posting.',
      highlights: [
        'Separates manual entries from provider-confirmed settlements',
        'Automatic remaining balance calculation in minor units',
        'Zero storage of raw payment card numbers or PINs',
      ],
    },
    {
      step: '04',
      title: language === 'sw' ? 'Toa Risiti na Fuatilia Madeni' : 'Issue Receipt & Reconcile Aging',
      role: 'Owner / Finance',
      docCode: 'RCT-2026-0001',
      status: 'SETTLED & RECEIPTED',
      desc:
        language === 'sw'
          ? 'Risiti rasmi yenye namba mfuatano inatolewa papo hapo, vikumbusho vya madeni vinazimwa kiotomatiki, na dashibodi inasasishwa.'
          : 'Generate numbered payment receipts automatically, auto-suppress pending overdue reminders once balance hits zero, and export currency-grouped CSVs.',
      highlights: [
        'Instant bilingual PDF receipt generation',
        'Automatic suppression of scheduled reminder jobs',
        'Dashboard strictly separates Invoiced vs. Cash Collected',
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-white text-slate-900 dark:bg-[#060911] dark:text-slate-100 transition-colors duration-300 selection:bg-emerald-500 selection:text-white">
      {/* =====================================================================
          100% FULL-WIDTH ARCHITECTURAL GLASS HEADER (White Default / Dark Ready)
         ===================================================================== */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-[#060911]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 h-20 flex items-center justify-between gap-6">
          {/* Brand Identity */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-slate-950 dark:text-white group"
            >
              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0d9f6e] to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 transition-transform duration-300 group-hover:scale-105">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight leading-none">InvoicePro</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0d9f6e] dark:text-emerald-400 mt-1">
                  East Africa SaaS
                </span>
              </div>
            </Link>

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TZ • KE • UG • RW</span>
            </span>
          </div>

          {/* Center Segmented Navigation Pill */}
          <nav
            aria-label="Main Public Navigation"
            className="hidden lg:flex items-center gap-1 rounded-full bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 p-1.5 text-xs font-bold"
          >
            {[
              { id: 'home', to: '/', label: t('pub.home') },
              { id: 'features', to: '/features', label: language === 'sw' ? 'Huduma' : 'Product' },
              { id: 'use-cases', to: '/use-cases', label: language === 'sw' ? 'Sekta' : 'Solutions' },
              { id: 'pricing', to: '/pricing', label: t('pub.pricing') },
              { id: 'help', to: '/help', label: language === 'sw' ? 'Mwongozo' : 'Docs & Help' },
              { id: 'faq', to: '/faq', label: 'FAQ' },
            ].map((navItem) => {
              const isActive = page === navItem.id;
              return (
                <Link
                  key={navItem.id}
                  to={navItem.to}
                  className={`rounded-full px-4 py-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {navItem.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language, Theme, Auth CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
              aria-label="Switch Language"
            >
              <Globe className="h-3.5 w-3.5 text-[#0d9f6e] dark:text-emerald-400" />
              <span>{language === 'en' ? 'SW' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to White Theme (Default)'}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {currentUser ? (
              <Link
                to="/app"
                className="group btn-shimmer inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all duration-200"
              >
                <span>{t('pub.goToApp')}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  {language === 'sw' ? 'Ingia' : 'Sign In'}
                </Link>
                <Link
                  to="/register"
                  className="group btn-shimmer inline-flex items-center gap-2 rounded-full bg-slate-950 dark:bg-[#0d9f6e] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-slate-800 dark:hover:bg-emerald-600 transition-all duration-200"
                >
                  <span>{language === 'sw' ? 'Anza Bure' : 'Start Free'}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN PUBLIC CONTENT (100% FULL WIDTH)
         ===================================================================== */}
      <main className="flex-1 w-full">
        {page === 'home' && (
          <div className="w-full">
            {/* ---------------------------------------------------------------
                SECTION 1: ARCHITECTURAL SPLIT HERO + INTERACTIVE LIVE WORKSPACE
               --------------------------------------------------------------- */}
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white dark:from-[#060911] dark:via-[#080d17] dark:to-[#060911] pt-12 lg:pt-20 pb-20 lg:pb-28 border-b border-slate-200/70 dark:border-slate-800/80">
              {/* Subtle Architectural Grid Hairlines & Soft Radial Aura */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 right-1/4 h-[520px] w-[520px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl"
              />

              <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
                <div className="grid lg:grid-cols-12 gap-12 xl:gap-16 items-center">
                  {/* Left 6 Columns: Editorial Value Proposition & Trust Metrics */}
                  <div className="lg:col-span-6 space-y-8 animate-fade-up">
                    <div className="inline-flex flex-wrap items-center gap-2.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/70 px-4 py-1.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-300 shadow-2xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d9f6e]" />
                      </span>
                      <span>
                        {language === 'sw'
                          ? 'Tengeneza Ankara na Quotation za Kitaalamu Tanzania & Afrika Mashariki'
                          : 'Commercial Invoicing, Quotations & Receivables • East Africa'}
                      </span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-6xl xl:text-[64px] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.06]">
                      {language === 'sw' ? (
                        <>
                          Mfumo wa Kisasa wa Ankara,{' '}
                          <span className="bg-gradient-to-r from-[#0d9f6e] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                            Quotation na Mapato
                          </span>{' '}
                          kwa Biashara Makini.
                        </>
                      ) : (
                        <>
                          Precision invoicing, client quotations &{' '}
                          <span className="bg-gradient-to-r from-[#0d9f6e] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                            verified receivables.
                          </span>
                        </>
                      )}
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      {language === 'sw'
                        ? 'Badilisha quotation zilizokubaliwa kuwa ankara zenye namba mfuatano, rekodi malipo ya awamu kupitia M-Pesa, Mixx by Yas, Airtel Money na Benki, na linda kumbukumbu zako kwa PostgreSQL Row Level Security.'
                        : 'Built for freelancers, consultants, agencies, and SMBs across Tanzania and East Africa. Convert approved estimates in one click, allocate partial mobile-money and bank settlements with decimal-safe precision, and lock issued invoices against silent edits.'}
                    </p>

                    {/* Primary & Secondary Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <Link
                        to={currentUser ? '/app' : '/register'}
                        className="group btn-shimmer inline-flex items-center gap-2.5 rounded-full bg-[#0d9f6e] px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:scale-[1.02] transition-all duration-300"
                      >
                        <span>
                          {currentUser
                            ? t('pub.goToApp')
                            : language === 'sw'
                              ? 'Anza Kutengeneza Ankara Bure'
                              : 'Create Your First Invoice Free'}
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>

                      <Link
                        to={currentUser ? '/app/invoices' : '/login'}
                        className="group inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-[#0d9f6e] dark:hover:border-emerald-500 transition-all duration-300"
                      >
                        <span>
                          {language === 'sw' ? 'Jaribu Mfumo wa Mfano' : 'Explore Interactive Workspace'}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#0d9f6e] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    </div>

                    {/* 4 Architectural Engineering Metrics */}
                    <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          <AnimatedCounter value={100} suffix="%" />
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          Minor-Unit BigInt Math
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          <AnimatedCounter value={7} suffix="+" />
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          TZS, KES, UGX, RWF, USD
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          <AnimatedCounter value={29} />
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          PostgreSQL RLS Tables
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-[#0d9f6e] dark:text-emerald-400 tracking-tight">
                          EN / SW
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          Bilingual PDF Documents
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right 6 Columns: Interactive Multi-Tab Product Workspace Simulator */}
                  <div className="lg:col-span-6 animate-fade-up-delay-1">
                    <Interactive3DTiltCard
                      intensity={3.5}
                      className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.12)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65)] overflow-hidden"
                    >
                      {/* Window Chrome & Interactive Module Switcher Tabs */}
                      <div className="bg-slate-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                          <span className="ml-2 text-[11px] font-mono text-slate-400">
                            Kilimanjaro Advisory Ltd • Tenant RLS Active
                          </span>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 text-[11px] font-bold">
                          {[
                            { id: 'invoice', label: 'Invoice' },
                            { id: 'quote', label: 'Quotation' },
                            { id: 'receivables', label: 'Receivables' },
                            { id: 'portal', label: 'Payment Rails' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setHeroTab(tab.id as typeof heroTab)}
                              className={`rounded-lg px-2.5 py-1 transition-all duration-200 cursor-pointer ${
                                heroTab === tab.id
                                  ? 'bg-[#0d9f6e] text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tab 1: Interactive Commercial Invoice & Live Payment Simulator */}
                      {heroTab === 'invoice' && (
                        <div className="p-6 sm:p-8 space-y-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                  COMMERCIAL INVOICE
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  <Lock className="h-2.5 w-2.5 text-[#0d9f6e]" />
                                  Immutable Record
                                </span>
                              </div>
                              <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1 font-mono">
                                INV-2026-0014
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Billed To: <strong className="text-slate-800 dark:text-slate-200">Serengeti Logistics &amp; Freight Ltd</strong> • TIN: 104-892-319
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                                  simulatedPaymentStage === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : simulatedPaymentStage === 'partial'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {simulatedPaymentStage === 'paid'
                                  ? 'Paid in Full'
                                  : simulatedPaymentStage === 'partial'
                                    ? 'Partially Paid (50%)'
                                    : 'Issued • Net 14'}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
                                Due: 14 Nov 2026
                              </div>
                            </div>
                          </div>

                          {/* Invoice Line Items Preview */}
                          <div className="space-y-2.5 text-xs">
                            <div className="grid grid-cols-12 text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                              <div className="col-span-7">Description</div>
                              <div className="col-span-2 text-right">Tax</div>
                              <div className="col-span-3 text-right">Amount (TZS)</div>
                            </div>
                            <div className="grid grid-cols-12 items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 font-medium">
                              <div className="col-span-7 text-slate-900 dark:text-white font-semibold">
                                ERP &amp; Customs Integration Milestone 1
                              </div>
                              <div className="col-span-2 text-right text-slate-500">18% VAT</div>
                              <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                3,000,000
                              </div>
                            </div>
                            <div className="grid grid-cols-12 items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 font-medium">
                              <div className="col-span-7 text-slate-900 dark:text-white font-semibold">
                                Staff Onboarding &amp; Bilingual Training (10 hrs)
                              </div>
                              <div className="col-span-2 text-right text-slate-500">18% VAT</div>
                              <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                1,000,000
                              </div>
                            </div>
                          </div>

                          {/* Financial Totals + Interactive Payment Stage Switcher */}
                          <div className="rounded-2xl bg-slate-950 text-white p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                                  Grand Total (Incl. TSh 720,000 VAT)
                                </div>
                                <div className="text-xl font-extrabold font-mono text-white mt-0.5">
                                  TSh 4,720,000.00
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                                  Balance Due
                                </div>
                                <div className="text-xl font-extrabold font-mono text-emerald-300 mt-0.5 transition-all duration-300">
                                  {simulatedPaymentStage === 'paid'
                                    ? 'TSh 0.00'
                                    : simulatedPaymentStage === 'partial'
                                      ? 'TSh 2,360,000.00'
                                      : 'TSh 4,720,000.00'}
                                </div>
                              </div>
                            </div>

                            {/* Animated Allocation Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#0d9f6e] to-emerald-400 transition-all duration-500 ease-out"
                                  style={{
                                    width:
                                      simulatedPaymentStage === 'paid'
                                        ? '100%'
                                        : simulatedPaymentStage === 'partial'
                                          ? '50%'
                                          : '6%',
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Click below to test live payment allocation:</span>
                                {simulatedPaymentStage === 'paid' && (
                                  <span className="text-emerald-300 font-bold">
                                    Receipt #RCT-2026-0001 Generated
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Interactive Simulator Buttons */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {[
                                { id: 'issued', label: '1. Issued (0%)' },
                                { id: 'partial', label: '2. M-Pesa 50%' },
                                { id: 'paid', label: '3. Paid 100%' },
                              ].map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setSimulatedPaymentStage(st.id as typeof simulatedPaymentStage)}
                                  className={`rounded-xl py-2 px-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    simulatedPaymentStage === st.id
                                      ? 'bg-[#0d9f6e] text-white shadow-sm'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Interactive Quotation-to-Invoice Conversion Preview */}
                      {heroTab === 'quote' && (
                        <div className="p-6 sm:p-8 space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                              <span className="text-[11px] font-mono font-bold uppercase text-[#0d9f6e]">
                                QUOTATION / ESTIMATE LIFECYCLE
                              </span>
                              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white font-mono mt-0.5">
                                QUO-2026-0009 (Rev 2)
                              </h3>
                              <p className="text-xs text-slate-500">
                                Client: Azania Marine Services • Valid until 30 Nov 2026
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                              {quoteConvertedDemo ? 'CONVERTED TO INV-2026-0015' : 'ACCEPTED BY CLIENT'}
                            </span>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  Agreed Quotation Total (Preserved on Conversion)
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  3 Line Items • 18% VAT • Terms &amp; Notes Locked
                                </div>
                              </div>
                              <div className="text-lg font-extrabold font-mono text-[#0d9f6e] dark:text-emerald-400">
                                TSh 8,260,000
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 space-y-2">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                Duplicate-Conversion Guard
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                {quoteConvertedDemo
                                  ? 'Quotation QUO-2026-0009 is now linked to Invoice INV-2026-0015. Attempting a second conversion is automatically blocked to prevent double-billing.'
                                  : 'Click below to simulate converting this accepted quotation into a sequential commercial invoice.'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setQuoteConvertedDemo((prev) => !prev)}
                            className="w-full rounded-2xl bg-[#0d9f6e] hover:bg-emerald-700 text-white py-3.5 px-5 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>
                              {quoteConvertedDemo
                                ? 'Reset Quotation Conversion Demo'
                                : 'Convert QUO-2026-0009 to Sequential Invoice'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Tab 3: Receivables & Aging Preview */}
                      {heroTab === 'receivables' && (
                        <div className="p-6 sm:p-8 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                              <div className="text-[11px] font-bold uppercase text-slate-400">
                                Total Invoiced (TZS)
                              </div>
                              <div className="text-xl font-extrabold font-mono text-slate-950 dark:text-white mt-1">
                                TSh 12,862,000
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                Gross commercial value billed
                              </div>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
                              <div className="text-[11px] font-bold uppercase text-[#0d9f6e] dark:text-emerald-400">
                                Actual Cash Collected
                              </div>
                              <div className="text-xl font-extrabold font-mono text-[#0d9f6e] dark:text-emerald-400 mt-1">
                                TSh 7,133,000
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                Verified &amp; receipted settlements
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div className="font-bold text-slate-900 dark:text-white">
                              Receivables by Aging Bucket (Strictly Grouped by Currency)
                            </div>
                            {[
                              { bucket: 'Current (0–30 Days)', amount: 'TSh 3,009,000', pct: 55, color: 'bg-[#0d9f6e]' },
                              { bucket: '31–60 Days Past Due', amount: 'TSh 1,720,000', pct: 32, color: 'bg-amber-500' },
                              { bucket: '61–90+ Days Overdue', amount: 'TSh 1,000,000', pct: 18, color: 'bg-rose-500' },
                            ].map((row, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between font-semibold">
                                  <span className="text-slate-600 dark:text-slate-300">{row.bucket}</span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">{row.amount}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tab 4: East Africa Payment Rails & Client Portal */}
                      {heroTab === 'portal' && (
                        <div className="p-6 sm:p-8 space-y-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-mono font-bold uppercase text-[#0d9f6e]">
                                EXPIRING CLIENT PORTAL TOKEN
                              </span>
                              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white mt-0.5">
                                Configurable Mobile Money &amp; Bank Rails
                              </h3>
                            </div>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-mono font-bold">
                              {activeRail.badge}
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {PAYMENT_RAILS.map((rail) => (
                              <button
                                key={rail.id}
                                type="button"
                                onClick={() => setSelectedRailId(rail.id)}
                                className={`rounded-xl border py-2.5 px-2 text-[11px] font-extrabold transition cursor-pointer ${
                                  selectedRailId === rail.id
                                    ? 'border-[#0d9f6e] bg-emerald-50 dark:bg-emerald-950/70 text-[#0d9f6e] dark:text-emerald-300'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {rail.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>

                          <div className="rounded-2xl bg-slate-950 text-white p-5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400">{activeRail.name}</span>
                              <span className="font-mono text-slate-400">{activeRail.code}</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                              {activeRail.settlement} • Clients view exact payment instructions on their secure invoice link and receive an instant numbered receipt once recorded.
                            </p>
                          </div>
                        </div>
                      )}
                    </Interactive3DTiltCard>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 2: INFINITE ARCHITECTURAL CAPABILITIES TICKER
               --------------------------------------------------------------- */}
            <div className="w-full overflow-hidden bg-slate-950 border-b border-slate-800 py-4 text-white">
              <div className="animate-marquee flex items-center gap-12 text-xs font-extrabold tracking-widest uppercase">
                {[...MARQUEE_PILLARS, ...MARQUEE_PILLARS].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-[#0d9f6e] inline-block" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------------------------------------------------------
                SECTION 3: ASYMMETRIC BENTO GRID — FINANCIAL INTEGRITY & ARCHITECTURE
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-32 bg-white dark:bg-[#060911] transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-16">
                <ScrollReveal variant="fade-up" className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0d9f6e] dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t('pub.features')}</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-950 dark:text-white leading-[1.12]">
                    {language === 'sw'
                      ? 'Imeundwa kwa Usahihi wa Kifedha, Sio PDF za Kawaida Pekee.'
                      : 'Engineered for financial integrity, not just static PDFs.'}
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    Every module in InvoicePro is backed by strict tenant isolation, auditable state transitions, and East African operational workflows.
                  </p>
                </ScrollReveal>

                {/* 12-Column Asymmetric Bento Grid */}
                <div className="grid lg:grid-cols-12 gap-6 xl:gap-8">
                  {/* Bento 1 (7 Cols): Issued-Invoice Immutability & Credit Notes */}
                  <ScrollReveal variant="fade-up" delayMs={0} className="lg:col-span-7">
                    <div className="premium-card-lift h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-7 sm:p-9 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 px-3 py-1 text-xs font-extrabold">
                            <Lock className="h-3.5 w-3.5" />
                            Audit-Ready Immutability
                          </span>
                          <div className="inline-flex rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setImmutabilityDemoMode('locked')}
                              className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                                immutabilityDemoMode === 'locked'
                                  ? 'bg-slate-900 text-white dark:bg-[#0d9f6e]'
                                  : 'text-slate-500'
                              }`}
                            >
                              Issued Lock
                            </button>
                            <button
                              type="button"
                              onClick={() => setImmutabilityDemoMode('credit_note')}
                              className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                                immutabilityDemoMode === 'credit_note'
                                  ? 'bg-slate-900 text-white dark:bg-[#0d9f6e]'
                                  : 'text-slate-500'
                              }`}
                            >
                              Credit Note Path
                            </button>
                          </div>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          Issued financial documents can never be silently rewritten.
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Once an invoice moves from <code>Draft</code> to <code>Issued</code>, PostgreSQL triggers lock its line items, client, and totals. Corrections are recorded transparently via linked Credit Notes.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-5 text-xs space-y-3">
                        {immutabilityDemoMode === 'locked' ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                trg_issued_invoice_immutability
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                Direct edits to issued invoice totals are rejected at the database layer.
                              </div>
                            </div>
                            <span className="rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-3 py-1.5 font-mono font-bold shrink-0">
                              SILENT EDIT BLOCKED
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="font-mono font-bold text-[#0d9f6e] dark:text-emerald-400">
                                CN-2026-0001 → Linked to INV-2026-0014
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                Original invoice preserved • Receivable balance adjusted by -TSh 500,000
                              </div>
                            </div>
                            <span className="rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 px-3 py-1.5 font-mono font-bold shrink-0">
                              AUDITED ADJUSTMENT
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Bento 2 (5 Cols): Idempotent Mobile Money & Bank Settlements */}
                  <ScrollReveal variant="fade-up" delayMs={100} className="lg:col-span-5">
                    <div className="premium-card-lift h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-950 text-white p-7 sm:p-9 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold">
                          <Smartphone className="h-3.5 w-3.5" />
                          East Africa Collections
                        </span>
                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                          Partial deposits, M-Pesa references &amp; instant receipts.
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Record multiple payments against a single invoice with idempotency protection and clear separation between manual entries and provider-confirmed settlements.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">M-Pesa Lipa Namba</div>
                            <div className="text-[11px] text-slate-400 font-mono">Ref: MPESA-884120TZ</div>
                          </div>
                          <span className="rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 font-mono font-bold">
                            +TSh 2,000,000
                          </span>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">CRDB Bank RTGS</div>
                            <div className="text-[11px] text-slate-400 font-mono">Ref: CRDB-EFT-99201</div>
                          </div>
                          <span className="rounded-lg bg-emerald-500/20 text-emerald-300 px-2.5 py-1 font-mono font-bold">
                            +TSh 2,720,000
                          </span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Bento 3 (4 Cols): Multi-Currency Discipline */}
                  <ScrollReveal variant="fade-up" delayMs={140} className="lg:col-span-4">
                    <div className="premium-card-lift h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-7 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 px-3 py-1 text-xs font-extrabold">
                            <Globe className="h-3.5 w-3.5" />
                            Multi-Currency
                          </span>
                          <div className="flex gap-1">
                            {(['TZS', 'KES', 'USD'] as const).map((cur) => (
                              <button
                                key={cur}
                                type="button"
                                onClick={() => setBentoCurrency(cur)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer ${
                                  bentoCurrency === cur
                                    ? 'bg-[#0d9f6e] text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {cur}
                              </button>
                            ))}
                          </div>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                          Zero silent currency mixing.
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Dashboards and CSV exports group receivables strictly by currency (TZS, KES, UGX, RWF, USD, EUR, GBP).
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoiced ({bentoCurrency})</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{bentoCurrencyData.invoiced}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Collected ({bentoCurrency})</span>
                          <span className="font-mono font-bold text-[#0d9f6e] dark:text-emerald-400">{bentoCurrencyData.collected}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Default Tax Profile</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{bentoCurrencyData.taxLabel}</span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Bento 4 (4 Cols): Projects, Milestones & Billable Time */}
                  <ScrollReveal variant="fade-up" delayMs={200} className="lg:col-span-4">
                    <div className="premium-card-lift h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-7 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 px-3 py-1 text-xs font-extrabold">
                          <Clock className="h-3.5 w-3.5" />
                          Projects &amp; Time
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                          Turn approved hours &amp; milestones into invoices.
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Track project budgets, approve consultant timesheets, and link billable work directly to client invoices.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">System Audit &amp; Advisory</span>
                          <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                            14.5 hrs Approved
                          </span>
                        </div>
                        <div className="text-slate-500">
                          Rate: TSh 120,000/hr → Ready for one-click invoice line item import.
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Bento 5 (4 Cols): Bilingual English & Kiswahili Documents */}
                  <ScrollReveal variant="fade-up" delayMs={260} className="lg:col-span-4">
                    <div className="premium-card-lift h-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-7 flex flex-col justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 px-3 py-1 text-xs font-extrabold">
                            <FileText className="h-3.5 w-3.5" />
                            Bilingual PDFs
                          </span>
                          <div className="flex gap-1">
                            {(['en', 'sw'] as const).map((lng) => (
                              <button
                                key={lng}
                                type="button"
                                onClick={() => setBentoDocLang(lng)}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase transition cursor-pointer ${
                                  bentoDocLang === lng
                                    ? 'bg-[#0d9f6e] text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {lng}
                              </button>
                            ))}
                          </div>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                          English &amp; Kiswahili document rendering.
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Switch invoice, quotation, proforma, and receipt templates between English and Kiswahili per business or document.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 text-xs space-y-1.5">
                        <div className="font-mono font-extrabold text-[#0d9f6e] dark:text-emerald-400">
                          {bentoDocLang === 'sw' ? 'ANKARA YA MALIPO • INV-2026-0014' : 'COMMERCIAL INVOICE • INV-2026-0014'}
                        </div>
                        <div className="text-slate-500">
                          {bentoDocLang === 'sw'
                            ? 'Jumla Ndogo • Kodi ya Ongezeko la Thamani (VAT 18%) • Salio Linalodaiwa'
                            : 'Subtotal • Value Added Tax (VAT 18%) • Remaining Balance Due'}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 4: INTERACTIVE 4-STAGE WORKFLOW SCRUBBER
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-32 bg-slate-50 dark:bg-[#090e1a] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-16">
                <ScrollReveal variant="fade-up" className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0d9f6e] dark:text-emerald-400">
                      <Zap className="h-3.5 w-3.5" />
                      <span>End-to-End Billing Workflow</span>
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-950 dark:text-white leading-[1.12]">
                      {language === 'sw'
                        ? 'Kuanzia Quotation ya Kwanza Hadi Risiti Iliyothibitishwa.'
                        : 'From first client scope to verified payment receipt.'}
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md">
                    Click any step below to inspect how InvoicePro enforces role-based permissions and audit trails at every transition.
                  </p>
                </ScrollReveal>

                <div className="grid lg:grid-cols-12 gap-10 xl:gap-14 items-center">
                  {/* Left 5 Columns: Step Selector Buttons */}
                  <div className="lg:col-span-5 space-y-3.5">
                    {workflowSteps.map((ws, idx) => {
                      const isSelected = activeWorkflowStep === idx;
                      return (
                        <button
                          key={ws.step}
                          type="button"
                          onClick={() => setActiveWorkflowStep(idx)}
                          className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-[#0d9f6e] shadow-lg shadow-emerald-950/5 translate-x-1'
                              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <span
                                className={`h-9 w-9 rounded-xl font-mono text-xs font-extrabold flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-[#0d9f6e] text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {ws.step}
                              </span>
                              <div>
                                <div className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">
                                  {ws.title}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  Role: {ws.role} • {ws.docCode}
                                </div>
                              </div>
                            </div>
                            <ArrowRight
                              className={`h-4 w-4 transition-transform duration-300 ${
                                isSelected ? 'text-[#0d9f6e] translate-x-1' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right 7 Columns: Active Step Detailed Architectural Preview */}
                  <div className="lg:col-span-7">
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div>
                          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-[#0d9f6e] dark:text-emerald-400">
                            STEP {workflowSteps[activeWorkflowStep].step} • {workflowSteps[activeWorkflowStep].role}
                          </span>
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
                            {workflowSteps[activeWorkflowStep].title}
                          </h3>
                        </div>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 text-xs font-mono font-extrabold text-[#0d9f6e] dark:text-emerald-300">
                          {workflowSteps[activeWorkflowStep].status}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                        {workflowSteps[activeWorkflowStep].desc}
                      </p>

                      <div className="grid sm:grid-cols-3 gap-3 pt-2">
                        {workflowSteps[activeWorkflowStep].highlights.map((hl, i) => (
                          <div
                            key={i}
                            className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 p-4 space-y-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-[#0d9f6e]" />
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                              {hl}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                        <span>Document Reference: <strong className="font-mono text-slate-800 dark:text-slate-200">{workflowSteps[activeWorkflowStep].docCode}</strong></span>
                        <Link
                          to={currentUser ? '/app' : '/register'}
                          className="inline-flex items-center gap-1.5 font-extrabold text-[#0d9f6e] dark:text-emerald-400 hover:underline"
                        >
                          <span>Try this workflow in the app</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 5: INTERACTIVE DECIMAL-SAFE INVOICE & VAT SANDBOX
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-32 bg-white dark:bg-[#060911] transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
                <ScrollReveal variant="fade-up">
                  <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 p-8 sm:p-12 shadow-lg">
                    <div className="grid lg:grid-cols-12 gap-10 xl:gap-14 items-center">
                      <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-extrabold text-[#0d9f6e] dark:text-emerald-400">
                          <Calculator className="h-3.5 w-3.5" />
                          <span>Interactive Decimal-Safe Calculation Sandbox</span>
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white">
                          {language === 'sw'
                            ? 'Jaribu Kikokotoo cha Ankara, VAT na Malipo ya Awamu'
                            : 'Test our exact minor-unit invoice, VAT & deposit engine.'}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Floating-point math causes rounding drift on multi-line VAT invoices. InvoicePro computes every subtotal, discount, tax, and partial payment allocation in exact integer minor units (`BigInt`).
                        </p>

                        <div className="grid sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                              Currency
                            </label>
                            <select
                              value={sandboxCurrency}
                              onChange={(e) => setSandboxCurrency(e.target.value as CurrencyCode)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 font-extrabold"
                            >
                              <option value="TZS">TZS (TSh)</option>
                              <option value="KES">KES (KSh)</option>
                              <option value="UGX">UGX (USh)</option>
                              <option value="RWF">RWF (FRw)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={sandboxQty}
                              onChange={(e) => setSandboxQty(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 font-extrabold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={sandboxUnitPrice}
                              onChange={(e) => setSandboxUnitPrice(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 font-extrabold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                              VAT Rate (%)
                            </label>
                            <select
                              value={sandboxTaxRate}
                              onChange={(e) => setSandboxTaxRate(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 font-extrabold"
                            >
                              <option value="18.00">18% (TZ / UG / RW)</option>
                              <option value="16.00">16% (Kenya)</option>
                              <option value="0.00">0% (Exempt)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-300">
                              Simulated Mobilization Deposit / Partial Payment
                            </span>
                            <span className="text-[#0d9f6e] dark:text-emerald-400">{sandboxDepositPercent}% Paid</span>
                          </div>
                          <div className="flex gap-2">
                            {[0, 25, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setSandboxDepositPercent(pct)}
                                className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                                  sandboxDepositPercent === pct
                                    ? 'bg-[#0d9f6e] text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Live Calculated Output Card */}
                      <div className="lg:col-span-5 rounded-3xl bg-slate-950 text-white p-7 sm:p-8 space-y-5 shadow-xl border border-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Live Ledger Calculation
                            </span>
                          </div>
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300">
                            {sandboxBalanceInfo.isFullyPaid
                              ? 'Paid in Full'
                              : sandboxBalanceInfo.isPartiallyPaid
                                ? 'Partially Paid'
                                : 'Issued'}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs sm:text-sm">
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal (Net)</span>
                            <span className="font-mono font-bold text-white">
                              {formatMoney(sandboxTotals.subtotal, sandboxCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Configured Tax ({sandboxTaxRate}%)</span>
                            <span className="font-mono font-bold text-white">
                              {formatMoney(sandboxTotals.taxTotal, sandboxCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-3 font-extrabold text-base">
                            <span>Grand Total</span>
                            <span className="font-mono">{formatMoney(sandboxTotals.grandTotal, sandboxCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400 font-bold">
                            <span>Allocated Payment ({sandboxDepositPercent}%)</span>
                            <span className="font-mono">-{formatMoney(depositPaidRaw, sandboxCurrency)}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Remaining Balance Due
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-300">
                            {formatMoney(sandboxBalanceInfo.balanceDue, sandboxCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 6: COMPLETE 4-TIER TRANSPARENT PRICING MATRIX
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-32 bg-slate-50 dark:bg-[#090e1a] border-t border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14">
                <ScrollReveal variant="fade-up" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0d9f6e] dark:text-emerald-400">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>{t('pub.pricing')}</span>
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-950 dark:text-white">
                      {language === 'sw' ? 'Mipango Wazi kwa Kila Hatua ya Biashara' : 'Transparent plans that scale with your firm.'}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Proposed subscription tiers in Tanzanian Shillings (TSh) backed by server-side entitlement checks.
                    </p>
                  </div>

                  {/* Monthly / Annual Billing Toggle */}
                  <div className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-xs border border-slate-200 dark:border-slate-800 self-start">
                    <button
                      type="button"
                      onClick={() => setPlanInterval('monthly')}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                        planInterval === 'monthly'
                          ? 'bg-slate-950 dark:bg-[#0d9f6e] text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanInterval('annual')}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                        planInterval === 'annual'
                          ? 'bg-slate-950 dark:bg-[#0d9f6e] text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Annual (Save 16%)
                    </button>
                  </div>
                </ScrollReveal>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
                  {DEFAULT_SUBSCRIPTION_PLANS.map((plan, idx) => {
                    const isPopular = plan.id === 'professional';
                    const priceValue =
                      planInterval === 'monthly' ? plan.monthlyPriceTzs : plan.annualPriceTzs;
                    return (
                      <ScrollReveal key={plan.id} variant="fade-up" delayMs={idx * 90}>
                        <div
                          className={`premium-card-lift h-full rounded-3xl border p-7 sm:p-8 flex flex-col justify-between ${
                            isPopular
                              ? 'bg-slate-950 text-white border-emerald-500/50 shadow-2xl relative'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white'
                          }`}
                        >
                          <div className="space-y-5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-lg font-extrabold">
                                {language === 'sw' ? plan.nameSw : plan.nameEn}
                              </h3>
                              {isPopular && (
                                <span className="rounded-full bg-[#0d9f6e] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                  Most Popular
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="text-3xl font-extrabold font-mono tracking-tight">
                                {formatMoney(priceValue, 'TZS', { hideDecimalsForWholeShillings: true })}
                              </div>
                              <div className={`text-xs mt-1 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                                per {planInterval === 'monthly' ? 'month' : 'year'}
                              </div>
                            </div>

                            <ul className={`space-y-3 text-xs sm:text-sm pt-4 border-t ${isPopular ? 'border-slate-800 text-slate-200' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
                              <li className="flex items-center gap-2.5">
                                <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                <span>Up to <strong>{plan.maxInvoicesPerMonth}</strong> invoices / mo</span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                <span>Up to <strong>{plan.maxClients}</strong> active clients</span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                <span>Up to <strong>{plan.maxTeamMembers}</strong> team member(s)</span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                <span>{plan.allowProjectsTime ? 'Projects, Milestones & Time' : 'Quotations & Proformas'}</span>
                              </li>
                              <li className="flex items-center gap-2.5">
                                <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                <span>{plan.allowAiAssistant ? 'Safe AI Billing Assistant' : 'Bilingual EN / SW PDFs'}</span>
                              </li>
                            </ul>
                          </div>

                          <Link
                            to="/register"
                            className={`btn-shimmer mt-8 block w-full text-center rounded-full py-3.5 text-xs sm:text-sm font-extrabold transition ${
                              isPopular
                                ? 'bg-[#0d9f6e] text-white hover:bg-emerald-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-[#0d9f6e] hover:text-white'
                            }`}
                          >
                            {plan.id === 'free' ? 'Start Free' : 'Start 14-Day Trial'}
                          </Link>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 7: SECTOR WORKFLOW SPOTLIGHTS & EXECUTIVE CTA BANNER
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-32 bg-white dark:bg-[#060911] transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-20">
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Briefcase,
                      role: 'Freelancers & Consultants',
                      sub: 'Advisory, Legal, Engineering & IT Specialists',
                      text: 'Send bilingual quotations, convert approved scope in one click, and share expiring client portal links with M-Pesa Lipa Namba instructions.',
                    },
                    {
                      icon: Users,
                      role: 'Agencies & Studios',
                      sub: 'Digital, Creative & Professional Services Teams',
                      text: 'Manage multi-milestone retainers, approve staff billable hours, and enforce role-based access for Owners, Accountants, and Sales staff.',
                    },
                    {
                      icon: Building2,
                      role: 'Contractors & B2B Suppliers',
                      sub: 'Logistics, Construction & Commercial Trade',
                      text: 'Generate Proforma Invoices for procurement, allocate mobilization deposits and partial settlements, and issue linked Credit Notes.',
                    },
                  ].map((sector, idx) => (
                    <ScrollReveal key={idx} variant="fade-up" delayMs={idx * 110}>
                      <div className="premium-card-lift h-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8 space-y-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 flex items-center justify-center">
                          <sector.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{sector.role}</h3>
                          <div className="text-xs font-bold text-[#0d9f6e] dark:text-emerald-400 mt-0.5">
                            {sector.sub}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {sector.text}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* High-Contrast Executive CTA Banner */}
                <ScrollReveal variant="scale-up">
                  <div className="rounded-3xl bg-slate-950 text-white p-10 sm:p-14 lg:p-16 border border-slate-800 relative overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-[#0d9f6e]/25 blur-3xl"
                    />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="space-y-3 max-w-2xl">
                        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                          READY FOR PRODUCTION BILLING
                        </span>
                        <h2 className="font-display text-3xl sm:text-5xl font-bold text-white leading-tight">
                          {language === 'sw'
                            ? 'Anza Kusimamia Ankara na Mapato ya Biashara Yako Leo.'
                            : 'Upgrade your billing workflow from spreadsheets to verifiable ledgers.'}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300">
                          Create your business workspace in under two minutes or explore the pre-configured demo accounts.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 shrink-0">
                        <Link
                          to={currentUser ? '/app' : '/register'}
                          className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-8 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-600 transition"
                        >
                          <span>{language === 'sw' ? 'Jisajili Bure Sasa' : 'Create Free Workspace'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-7 py-4 text-sm font-bold text-white hover:bg-slate-800 transition"
                        >
                          <span>{language === 'sw' ? 'Ingia Kwenye Mfumo' : 'Sign In / Demo'}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </section>
          </div>
        )}

        {page === 'features' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-10 animate-fade-up">
            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
                {language === 'sw'
                  ? 'Huduma Kamili za Mfumo wa Kutengeneza Ankara (InvoicePro)'
                  : 'Complete Product Capabilities & Architecture'}
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-3xl">
                Every module in InvoicePro is backed by relational database constraints, tenant isolation, and decimal-safe financial arithmetic.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: '1. Commercial Invoices, Proformas & Credit Notes',
                  items: [
                    'Configurable business-scoped sequential numbering (INV-2026-0001)',
                    'Strict immutability once issued — silent rewriting is blocked by database triggers',
                    'Linked Credit Notes adjust invoice balances transparently with full audit logs',
                    'Separate Proforma Invoice lifecycle with non-fiscal disclaimers',
                  ],
                },
                {
                  title: '2. Quotations, Revisions & One-Click Conversion',
                  items: [
                    'Draft, Sent, Viewed, Accepted, Rejected, Expired, and Converted states',
                    'Full revision history tracking price and scope updates',
                    'Duplicate-conversion protection preserving agreed line items and taxes',
                  ],
                },
                {
                  title: '3. Multi-Method Payments & Partial Reconciliations',
                  items: [
                    'Support for M-Pesa, Mixx by Yas, Airtel Money, Bank Transfers, Cash, and Card',
                    'Idempotent payment recording preventing accidental double-posting',
                    'Clear distinction between manually recorded payments and provider-confirmed settlements',
                  ],
                },
                {
                  title: '4. Localization & Tax Governance for East Africa',
                  items: [
                    'Full English and Kiswahili UI and printable PDF documents',
                    'Configurable VAT/Tax labels and rates (never permanently hardcoded)',
                    'Support for TZS, KES, UGX, RWF, USD, EUR, and GBP with strict currency grouping',
                  ],
                },
              ].map((block, i) => (
                <div
                  key={i}
                  className="premium-card-lift rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs"
                >
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">{block.title}</h2>
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {block.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0 mt-0.5" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'pricing' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-10 animate-fade-up">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
                {language === 'sw' ? 'Mipango na Gharama za Mfumo (TZS)' : 'Transparent Subscription Plans'}
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Initial proposed pricing hypotheses in Tanzanian Shillings (TSh) for freelancers, consultants, agencies, and SMBs. Server-side entitlements enforce invoice, client, and seat limits.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {DEFAULT_SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`premium-card-lift rounded-3xl border p-8 flex flex-col justify-between ${
                    plan.id === 'professional'
                      ? 'bg-slate-950 text-white border-emerald-500/50 shadow-xl'
                      : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-extrabold">
                        {language === 'sw' ? plan.nameSw : plan.nameEn}
                      </h2>
                      {plan.id === 'professional' && (
                        <span className="rounded-full bg-[#0d9f6e] px-2.5 py-0.5 text-xs font-bold text-white">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-5">
                      <span className="text-3xl font-extrabold font-mono">
                        {formatMoney(plan.monthlyPriceTzs, 'TZS', { hideDecimalsForWholeShillings: true })}
                      </span>
                      <span className="text-xs opacity-75"> / month</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Annual: {formatMoney(plan.annualPriceTzs, 'TZS', { hideDecimalsForWholeShillings: true })} / yr
                    </div>

                    <ul className="mt-6 space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                        Up to {plan.maxInvoicesPerMonth} invoices / month
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                        Up to {plan.maxClients} active clients
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                        Up to {plan.maxTeamMembers} team member(s)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                        {plan.allowProjectsTime ? 'Projects & Billable Time included' : 'Core Invoicing & Quotations'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                        {plan.allowAiAssistant ? 'AI Billing Assistant enabled' : 'Standard manual templates'}
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/register"
                    className={`btn-shimmer mt-8 block text-center rounded-full px-4 py-3 text-sm font-extrabold transition ${
                      plan.id === 'professional'
                        ? 'bg-[#0d9f6e] text-white hover:bg-emerald-600'
                        : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-[#0d9f6e]'
                    }`}
                  >
                    {plan.id === 'free' ? 'Start Free' : 'Start 14-Day Trial'}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'use-cases' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-8 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {language === 'sw' ? 'Matumizi kwa Biashara za Tanzania na Afrika Mashariki' : 'Who Uses InvoicePro?'}
            </h1>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  role: 'Consultants & Freelancers',
                  desc: 'Send branded Kiswahili or English quotations in minutes, log billable hours, and share a professional payment link with M-Pesa Lipa Namba instructions.',
                },
                {
                  role: 'Digital, Creative & Legal Agencies',
                  desc: 'Manage multi-milestone client retainers, separate Sales and Accountant permissions, and track overdue receivables by aging bucket (0–30, 31–60, 61–90, 90+ days).',
                },
                {
                  role: 'Contractors, Logistics & B2B Suppliers',
                  desc: 'Issue Proforma Invoices for customs or procurement approval, convert to commercial invoices, and reconcile partial mobilization deposits.',
                },
              ].map((u, idx) => (
                <div
                  key={idx}
                  className="premium-card-lift rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8"
                >
                  <Building2 className="h-7 w-7 text-[#0d9f6e] mb-4" />
                  <h2 className="text-xl font-extrabold">{u.role}</h2>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{u.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'help' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-6 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">Help Centre &amp; Operational Guides</h1>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <h2 className="text-lg font-extrabold">Important Notice on TRA EFD / VFD Fiscal Receipts</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ordinary commercial invoices and payment receipts generated in InvoicePro are commercial billing records and are <strong>not automatically TRA EFD/VFD fiscal receipts</strong>. Fiscal-document issuance requires a separate, verified TRA VFD integration module.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <h2 className="text-lg font-extrabold">How Issued Invoice Immutability Works</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Once an invoice is marked as <code>Issued</code>, its totals, client, and line items are locked to preserve your audit trail. If you need to reduce the balance due, issue a linked <strong>Credit Note</strong>.
                </p>
              </div>
            </div>
          </section>
        )}

        {page === 'faq' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-6 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">Frequently Asked Questions (FAQ)</h1>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  q: 'Je, naweza kutengeneza ankara (invoice) na quotation kwa Kiswahili?',
                  a: 'Ndiyo! InvoicePro inaruhusu kubadilisha lugha ya mfumo na nyaraka zako za PDF kati ya Kiswahili na Kiingereza wakati wowote.',
                },
                {
                  q: 'Does InvoicePro mix different currencies together on the dashboard?',
                  a: 'Never. InvoicePro groups financial totals strictly by currency (e.g., TZS vs. USD) and requires an explicit exchange rate and timestamp before any cross-currency conversion.',
                },
                {
                  q: 'Can platform super-administrators read my private invoices?',
                  a: 'No. Row Level Security (RLS) and service-layer tenant checks block super-administrators from reading customer invoices, quotations, clients, or payments.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="premium-card-lift rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7"
                >
                  <h2 className="font-extrabold text-base flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-[#0d9f6e] shrink-0 mt-0.5" />
                    <span>{item.q}</span>
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'contact' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 max-w-4xl space-y-6 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">{t('pub.contact')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Dar es Salaam, Tanzania • Support Email: support@invoicepro.co.tz
            </p>
            {contactSubmitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 p-6 text-emerald-900 dark:text-emerald-200">
                <h2 className="font-bold">Inquiry Recorded Locally</h2>
                <p className="text-sm mt-1">
                  Thank you, {contactForm.name}. Your message has been logged. Note: Live external email delivery requires configuring <code>RESEND_API_KEY</code> on the server.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-7 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
                >
                  <Mail className="h-4 w-4" />
                  Submit Inquiry
                </button>
              </form>
            )}
          </section>
        )}

        {page === 'privacy' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-6 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">{t('pub.privacy')}</h1>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
              <p>
                <strong>1. Multi-Tenant Isolation:</strong> Every business record in InvoicePro is scoped to its <code>business_id</code> and protected by PostgreSQL Row Level Security (RLS).
              </p>
              <p>
                <strong>2. Payment Card Security:</strong> InvoicePro never stores raw payment card numbers, CVVs, or mobile money PINs.
              </p>
              <p>
                <strong>3. Administrative Access Controls:</strong> Platform administrators do not have unrestricted access to your financial documents; all administrative actions are recorded in immutable audit logs.
              </p>
            </div>
          </section>
        )}

        {page === 'terms' && (
          <section className="py-16 w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-6 animate-fade-up">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">{t('pub.terms')}</h1>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
              <p>
                <strong>1. Commercial Documents vs. Fiscal Receipts:</strong> Documents generated by InvoicePro are commercial invoices, quotations, proformas, and payment receipts. They are not substitutes for statutory TRA EFD/VFD fiscal receipts unless an authorized fiscal integration is explicitly enabled and verified.
              </p>
              <p>
                <strong>2. Unaudited Expense Summaries:</strong> Financial dashboards and expense reports are operational management summaries and are not advertised as audited statutory financial statements.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* 100% Full-Width Architectural Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#050811] py-14 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-[#0d9f6e] text-white flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              © {new Date().getFullYear()} InvoicePro Tanzania. Built for East African Businesses.
            </span>
          </div>
          <div className="flex flex-wrap gap-6 font-semibold">
            <Link to="/features" className="hover:text-[#0d9f6e] transition">{t('pub.features')}</Link>
            <Link to="/pricing" className="hover:text-[#0d9f6e] transition">{t('pub.pricing')}</Link>
            <Link to="/use-cases" className="hover:text-[#0d9f6e] transition">{t('pub.useCases')}</Link>
            <Link to="/help" className="hover:text-[#0d9f6e] transition">{t('pub.help')}</Link>
            <Link to="/faq" className="hover:text-[#0d9f6e] transition">{t('pub.faq')}</Link>
            <Link to="/contact" className="hover:text-[#0d9f6e] transition">{t('pub.contact')}</Link>
            <Link to="/privacy" className="hover:text-[#0d9f6e] transition">{t('pub.privacy')}</Link>
            <Link to="/terms" className="hover:text-[#0d9f6e] transition">{t('pub.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
