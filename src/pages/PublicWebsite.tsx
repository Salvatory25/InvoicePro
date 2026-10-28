import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Crown,
  FileCheck2,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  Link2,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Play,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
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

const HERO_PAYMENT_MODES = [
  { id: 'mpesa', name: 'M-Pesa', channel: 'Vodacom Lipa Namba • 5582910', tone: 'text-emerald-700 dark:text-emerald-400 font-extrabold' },
  { id: 'visa', name: 'VISA', channel: 'Corporate Card Settlement • Ref Verified', tone: 'text-blue-800 dark:text-blue-400 font-extrabold italic' },
  { id: 'mixx', name: 'Mixx', channel: 'Mixx by Yas Merchant • Instant Receipt', tone: 'text-indigo-700 dark:text-indigo-400 font-bold' },
  { id: 'airtel', name: 'Airtel', channel: 'Airtel Money Business • TZS / USD', tone: 'text-red-600 dark:text-red-400 font-bold' },
  { id: 'crdb', name: 'CRDB', channel: 'CRDB Bank PLC RTGS / EFT • 0150482910200', tone: 'text-teal-800 dark:text-teal-300 font-extrabold' },
];

const MARQUEE_CAPABILITIES = [
  'DECIMAL-SAFE BIGINT FINANCIAL ARITHMETIC',
  'M-PESA • MIXX BY YAS • AIRTEL MONEY • CRDB RTGS',
  'POSTGRESQL ROW LEVEL SECURITY (RLS)',
  'BILINGUAL KISWAHILI & ENGLISH PDF DOCUMENTS',
  'ATOMIC SEQUENTIAL DOCUMENT NUMBERING',
  'IDEMPOTENT PARTIAL PAYMENT RECONCILIATION',
  'EXPIRING & REVOCABLE CLIENT PORTAL LINKS',
  'MULTI-CURRENCY GROUPING (TZS • KES • UGX • RWF • USD)',
];

export const PublicWebsite: React.FC<{ page: PublicPageType }> = ({ page }) => {
  const { currentUser, language, setLanguage, theme, toggleTheme, t } = useApp();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [activeAccordion, setActiveAccordion] = useState<number>(0);
  const [selectedHeroPayment, setSelectedHeroPayment] = useState<string>('mpesa');
  const [activeDonutMetric, setActiveDonutMetric] = useState<'collected' | 'outstanding' | 'overdue'>('collected');
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

  const activePaymentMode =
    HERO_PAYMENT_MODES.find((m) => m.id === selectedHeroPayment) ?? HERO_PAYMENT_MODES[0];

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

  return (
    <div className="min-h-screen w-full flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* =====================================================================
          100% FULL-WIDTH TOP NAVIGATION BAR
         ===================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-[#0d9f6e]/95 dark:bg-[#064e3b]/95 backdrop-blur-md text-white border-b border-white/15 transition-colors duration-300">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-white group">
            <span className="h-10 w-10 rounded-xl bg-white text-[#0d9f6e] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <Crown className="h-5 w-5 fill-[#0d9f6e]" />
            </span>
            <span className="text-xl tracking-tight">InvoicePro</span>
          </Link>

          {/* Center Navigation Links */}
          <nav
            aria-label="Main Public Navigation"
            className="hidden lg:flex items-center gap-9 text-sm font-semibold text-emerald-50/90"
          >
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 py-1 transition-all duration-200 ${page === 'home'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'hover:text-white hover:-translate-y-0.5'
                }`}
            >
              {t('pub.home')}
              <ChevronDown className="h-3.5 w-3.5 opacity-75" />
            </Link>
            <Link
              to="/features"
              className={`inline-flex items-center gap-1.5 py-1 transition-all duration-200 ${page === 'features'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'hover:text-white hover:-translate-y-0.5'
                }`}
            >
              {language === 'sw' ? 'Huduma' : 'Product'}
              <ChevronDown className="h-3.5 w-3.5 opacity-75" />
            </Link>
            <Link
              to="/use-cases"
              className={`inline-flex items-center gap-1.5 py-1 transition-all duration-200 ${page === 'use-cases'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'hover:text-white hover:-translate-y-0.5'
                }`}
            >
              {language === 'sw' ? 'Sekta' : 'Industries'}
              <ChevronDown className="h-3.5 w-3.5 opacity-75" />
            </Link>
            <Link
              to="/pricing"
              className={`py-1 transition-all duration-200 ${page === 'pricing'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'hover:text-white hover:-translate-y-0.5'
                }`}
            >
              {t('pub.pricing')}
            </Link>
            <Link
              to="/help"
              className={`inline-flex items-center gap-1.5 py-1 transition-all duration-200 ${page === 'help' || page === 'faq'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'hover:text-white hover:-translate-y-0.5'
                }`}
            >
              {language === 'sw' ? 'Msaada' : 'Resources'}
              <ChevronDown className="h-3.5 w-3.5 opacity-75" />
            </Link>
          </nav>

          {/* Right Action Pills */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Switch Language"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === 'en' ? 'SW' : 'EN'}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to White Theme (Default)'}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {currentUser ? (
              <Link
                to="/app"
                className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-extrabold text-[#0d9f6e] shadow-md hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-200"
              >
                {t('pub.goToApp')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-white/80 px-6 py-2 text-xs sm:text-sm font-bold text-white hover:bg-white/15 transition-all duration-200"
                >
                  {language === 'sw' ? 'Ingia' : 'Log In'}
                </Link>
                <Link
                  to="/register"
                  className="btn-shimmer rounded-full bg-white px-6 py-2.5 text-xs sm:text-sm font-extrabold text-[#0d9f6e] shadow-md hover:bg-emerald-50 hover:scale-[1.02] transition-all duration-200"
                >
                  {language === 'sw' ? 'Jisajili Bure' : 'Sign Up Free'}
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
                SECTION 1: 100% FULL-WIDTH EMERALD HERO SECTION
               --------------------------------------------------------------- */}
            <section className="relative w-full overflow-hidden hero-mesh-pattern pt-14 lg:pt-20 pb-0 text-white">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
                {/* Centered Two-Line Editorial Serif Headline */}
                <div className="text-center max-w-5xl mx-auto animate-fade-up">
                  {language === 'sw' && (
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-3">
                      Tengeneza Ankara na Quotation za Kitaalamu Tanzania & Afrika Mashariki
                    </p>
                  )}
                  <h1 className="font-display text-4xl sm:text-6xl xl:text-[68px] font-bold tracking-tight leading-[1.1] text-white">
                    {language === 'sw' ? (
                      <>
                        Mfumo Imara wa Ankara na Quotation
                        <span className="mt-3 flex flex-wrap items-center justify-center gap-4">
                          <span>Biashara Yako</span>
                          <span className="inline-flex h-12 w-16 sm:h-14 sm:w-20 items-center justify-center rounded-full bg-white text-[#0d9f6e] shadow-xl animate-pulse-ring">
                            <BarChart3 className="h-7 w-7" />
                          </span>
                          <span>Wateja Wako</span>
                        </span>
                      </>
                    ) : (
                      <>
                        Powerful Invoicing Platform
                        <span className="mt-3 flex flex-wrap items-center justify-center gap-4">
                          <span>Your Business</span>
                          <span className="inline-flex h-12 w-16 sm:h-14 sm:w-20 items-center justify-center rounded-full bg-white text-[#0d9f6e] shadow-xl animate-pulse-ring">
                            <BarChart3 className="h-7 w-7" />
                          </span>
                          <span>Your Clients</span>
                        </span>
                      </>
                    )}
                  </h1>
                </div>

                {/* Two-Column Hero Showcase Below Headline */}
                <div className="mt-14 lg:mt-16 grid lg:grid-cols-12 gap-12 xl:gap-16 items-end">
                  {/* Left Column: Lead Copy, Checkmarks & Bottom Mini-Invoice + Stat */}
                  <div className="lg:col-span-6 space-y-8 pb-14 animate-fade-up-delay-1">
                    <div className="border-l-2 border-white/80 pl-5 text-base sm:text-lg text-emerald-50/95 leading-relaxed max-w-2xl font-normal">
                      {language === 'sw'
                        ? 'Mfumo rahisi wa malipo unakusaidia kulipwa kwa wakati. Wape wateja wako njia nyingi za malipo (M-Pesa, Mixx by Yas, Airtel Money na Benki) kwa usalama na uhakika.'
                        : 'A simple, structured billing workflow helps you get paid on time. Provide multiple mobile-money and bank payment options that your customers can choose from to settle invoices securely.'}
                    </div>

                    <ul className="space-y-3.5 text-sm sm:text-base font-medium text-white">
                      <li className="flex items-center gap-3">
                        <span className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span>
                          {language === 'sw'
                            ? 'Tuma ankara na quotation kwa WhatsApp, barua pepe na Tovuti ya Mteja'
                            : 'Send invoices via WhatsApp link, email and secure client portal'}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span>
                          {language === 'sw'
                            ? 'Fuatilia hali ya ankara, malipo ya awamu na salio la mteja'
                            : "Keep track of customers' invoice status and partial payment balances"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span>
                          {language === 'sw'
                            ? 'Kumbusha wateja malipo yaliyopitiliza muda kwa mpangilio maalum'
                            : 'Follow up with automated payment reminders and promise dates'}
                        </span>
                      </li>
                    </ul>

                    {/* Bottom-Left Mini Invoice Preview Card + Capability Stat & Role Avatars */}
                    <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                      {/* Mini Floating Invoice Card with Gold Circular Action Badge */}
                      <div className="relative w-56 rounded-2xl bg-white dark:bg-slate-900 p-5 text-slate-800 dark:text-slate-100 shadow-2xl animate-float-delayed border border-white/40">
                        {/* Gold Circular Badge Overlapping Left Edge */}
                        <Link
                          to={currentUser ? '/app' : '/login'}
                          title="Open Interactive Demo Workspace"
                          className="absolute -left-5 bottom-5 h-13 w-13 rounded-full bg-amber-400 text-slate-950 shadow-lg flex flex-col items-center justify-center border-2 border-white hover:scale-110 transition-transform duration-300"
                        >
                          <Play className="h-4 w-4 fill-slate-950 ml-0.5" />
                          <span className="text-[7px] font-extrabold uppercase tracking-tighter mt-0.5">
                            DEMO
                          </span>
                        </Link>

                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                          <span className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950 inline-block" />
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Invoice
                          </span>
                        </div>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span className="font-mono">INV-2026-0014</span>
                            <span className="text-[#0d9f6e] dark:text-emerald-400 font-bold">TZS</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-950" />
                          <div className="h-2 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800" />
                          <div className="pt-1.5 flex justify-between font-extrabold text-slate-900 dark:text-white">
                            <span>Total</span>
                            <span className="text-[#0d9f6e] dark:text-emerald-400">
                              <AnimatedCounter value={4720000} />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stat & Overlapping Role Badges */}
                      <div className="space-y-2.5">
                        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                          <AnimatedCounter value={7} suffix="+ Currencies" />
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-emerald-100">
                          {language === 'sw'
                            ? 'TZS, KES, UGX, RWF & USD • Kiswahili & Kiingereza'
                            : 'TZS, KES, UGX, RWF & USD • Bilingual TZ Ready'}
                        </div>
                        <div className="flex items-center -space-x-2.5 pt-1">
                          {[
                            { initials: 'FL', bg: 'bg-amber-500', label: 'Freelancers' },
                            { initials: 'CS', bg: 'bg-teal-800', label: 'Consultants' },
                            { initials: 'AG', bg: 'bg-slate-900', label: 'Agencies' },
                            { initials: 'SM', bg: 'bg-emerald-950', label: 'SMBs' },
                          ].map((av, i) => (
                            <span
                              key={i}
                              title={av.label}
                              className={`h-10 w-10 rounded-full ${av.bg} border-2 border-white text-xs font-extrabold text-white flex items-center justify-center shadow-md transition-transform duration-300 hover:-translate-y-1.5 hover:scale-110`}
                            >
                              {av.initials}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stacked 3D Interactive Client & Payment Card */}
                  <div className="lg:col-span-6 relative group/hero animate-fade-up-delay-2">
                    {/* Floating Live Receipt Notification Badge */}
                    <div className="hidden sm:flex items-center gap-3 absolute -top-6 right-6 z-20 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 shadow-xl border border-emerald-400/30 animate-float-badge">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                      </span>
                      <div className="text-[11px]">
                        <span className="font-extrabold text-emerald-300">RCT-2026-0001 Issued</span> •{' '}
                        <span className="text-slate-300">{activePaymentMode.name} Settlement</span>
                      </div>
                    </div>

                    {/* Decorative 3D Angled Background Cards on Right (Smoothly fan out on hover) */}
                    <div className="hidden sm:block absolute -right-5 top-8 bottom-0 w-full rounded-t-3xl bg-white/15 rotate-3 transition-transform duration-500 ease-out group-hover/hero:rotate-5 group-hover/hero:translate-x-2 pointer-events-none" />
                    <div className="hidden sm:block absolute -right-2.5 top-4 bottom-0 w-full rounded-t-3xl bg-white/30 rotate-1.5 transition-transform duration-500 ease-out group-hover/hero:rotate-3 group-hover/hero:translate-x-1 pointer-events-none" />

                    {/* Main Foreground Card with Pro 3D Perspective Hover */}
                    <Interactive3DTiltCard className="rounded-t-3xl bg-white dark:bg-slate-900 p-7 sm:p-9 text-slate-800 dark:text-slate-100 shadow-2xl border border-emerald-100 dark:border-slate-800 transition-colors duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Hello, Amani Mwakasege
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Kilimanjaro Digital & Advisory Ltd • Dar es Salaam, TZ
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 inline-block" />
                          <span className="h-3.5 w-9 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 inline-block" />
                        </div>
                      </div>

                      {/* Outstanding Invoices & Available Credits Box */}
                      <div className="rounded-2xl border border-emerald-100 dark:border-slate-800 bg-[#f8fdfb] dark:bg-slate-800/60 p-6 flex flex-wrap items-center justify-between gap-4 mb-6 transition-all duration-300 hover:border-emerald-300/80">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {language === 'sw' ? 'Salio la Ankara Zinazodaiwa' : 'Outstanding Invoices'}
                          </div>
                          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#0d9f6e] dark:text-emerald-400 tracking-tight">
                            <AnimatedCounter value={2720000} prefix="TSh " decimals={2} />
                          </div>
                          <Link
                            to={currentUser ? '/app/payments' : '/login'}
                            className="group/btn btn-shimmer mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#0d9f6e] px-6 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 hover:scale-[1.03] transition-all duration-300"
                          >
                            <span>{language === 'sw' ? 'Rekodi Malipo' : 'Pay Now'}</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                          </Link>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {language === 'sw' ? 'Credit Notes Zilizotolewa' : 'Available Credits'}
                          </div>
                          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#0d9f6e] dark:text-emerald-400 tracking-tight">
                            TSh 0.00
                          </div>
                          <div className="mt-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition-all duration-300">
                            {activePaymentMode.channel}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Payment Modes Row */}
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{language === 'sw' ? 'Njia za Malipo Zinazokubaliwa' : 'Payment Modes'}</span>
                          <span className="text-[11px] font-semibold text-[#0d9f6e] dark:text-emerald-400 transition-all duration-300">
                            {activePaymentMode.name} Selected
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2.5 text-center">
                          {HERO_PAYMENT_MODES.map((pm) => {
                            const isSelected = pm.id === selectedHeroPayment;
                            return (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setSelectedHeroPayment(pm.id)}
                                className={`rounded-xl border py-2.5 px-2 text-xs flex items-center justify-center transition-all duration-300 cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0d9f6e] bg-emerald-50/80 dark:bg-emerald-950/60 shadow-sm -translate-y-0.5 scale-[1.04]'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-200 hover:-translate-y-0.5'
                                }`}
                              >
                                <span className={pm.tone}>{pm.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Bottom 5 Mint Action Icon Tiles */}
                        <div className="grid grid-cols-5 gap-3 pt-3">
                          {[
                            { icon: Link2, label: 'Client Portal' },
                            { icon: MessageSquare, label: 'Reminders' },
                            { icon: FileText, label: 'Invoices' },
                            { icon: Settings, label: 'Tax & Setup' },
                            { icon: UserCheck, label: 'Clients' },
                          ].map((tile, idx) => (
                            <Link
                              key={idx}
                              to={currentUser ? '/app' : '/login'}
                              title={tile.label}
                              className="group rounded-xl bg-[#e6f8f1] dark:bg-emerald-950/50 hover:bg-[#0d9f6e] dark:hover:bg-[#0d9f6e] text-[#0d9f6e] dark:text-emerald-400 hover:text-white py-3.5 flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                            >
                              <tile.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-115" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </Interactive3DTiltCard>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                INFINITE FINTECH CAPABILITIES MARQUEE TICKER
               --------------------------------------------------------------- */}
            <div className="w-full overflow-hidden bg-slate-900 dark:bg-slate-900/90 border-b border-slate-800 py-3.5 text-white">
              <div className="animate-marquee flex items-center gap-10 text-xs font-extrabold tracking-wider uppercase">
                {[...MARQUEE_CAPABILITIES, ...MARQUEE_CAPABILITIES].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------------------------------------------------------
                SECTION 2: ALL-IN-ONE INVOICE PLATFORM (100% Full Width, White Default / Dark Ready)
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-28 bg-white dark:bg-slate-950 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-12 gap-14 xl:gap-20 items-start">
                {/* Left Column with Scroll-Triggered Reveal */}
                <ScrollReveal variant="fade-right" className="lg:col-span-5 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 px-3.5 py-1 text-xs font-bold text-slate-800 dark:text-amber-300">
                    <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{t('pub.features')}</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-[1.15]">
                    {language === 'sw'
                      ? 'Mfumo Kamili wa Ankara na Mapato'
                      : 'All-in-One Invoice Platform'}
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    {language === 'sw'
                      ? 'Simamia kazi zako kuanzia quotation ya awali hadi risiti ya mwisho kwa usahihi wa hesabu za fedha na ulinzi wa kumbukumbu.'
                      : 'Track your entire client engagement from initial quotation to final payment receipt with clean views that make receivables management effortless.'}
                  </p>
                  <div className="pt-3">
                    <Link
                      to="/features"
                      className="group btn-shimmer inline-flex items-center gap-2 rounded-full bg-[#0d9f6e] px-7 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 hover:scale-[1.03] transition-all duration-300"
                    >
                      <span>{language === 'sw' ? 'Tazama Huduma Zote' : 'View All Features'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </ScrollReveal>

                {/* Right 2x2 Feature Grid with Staggered Scroll Reveals & Icon Micro-Animations */}
                <div className="lg:col-span-7 grid sm:grid-cols-2 gap-8 xl:gap-10">
                  {[
                    {
                      icon: Receipt,
                      title: language === 'sw' ? 'Utengenezaji Rahisi wa Ankara' : 'Effortless Invoicing',
                      desc:
                        language === 'sw'
                          ? 'Tengeneza ankara, proforma na quotation za Kiswahili au Kiingereza zenye namba zinazojipanga zenyewe.'
                          : 'Create professional commercial invoices, proformas, and estimates with sequential numbering and decimal-safe totals.',
                    },
                    {
                      icon: Zap,
                      title: language === 'sw' ? 'Ufuatiliaji wa Kiotomatiki' : 'Automation At Its Best',
                      desc:
                        language === 'sw'
                          ? 'Vikumbusho vya malipo, ubadilishaji wa quotation kuwa ankara, na uzimaji wa vikumbusho ankara ikilipwa.'
                          : 'Convert accepted quotes in one click, queue overdue reminders, and auto-suppress notifications when balance reaches zero.',
                    },
                    {
                      icon: Cloud,
                      title: language === 'sw' ? 'Usalama wa Taarifa (RLS)' : 'Save With Cloud & RLS',
                      desc:
                        language === 'sw'
                          ? 'Kila biashara inalindwa kwa Row Level Security na mgawanyo wa majukumu (Mmiliki, Mhasibu, Mauzo).'
                          : 'Protected by PostgreSQL Row Level Security and strict role permissions for Owners, Accountants, and Sales staff.',
                    },
                    {
                      icon: Globe,
                      title: language === 'sw' ? 'Tayari kwa Afrika Mashariki' : 'East Africa Multi-Currency',
                      desc:
                        language === 'sw'
                          ? 'Inafanya kazi kwa TZS, KES, UGX, RWF na USD bila kuchanganya sarafu tofauti kwenye ripoti.'
                          : 'Built for Tanzania, Kenya, Uganda, and Rwanda with configurable VAT rates and strict currency-grouped reporting.',
                    },
                  ].map((item, idx) => (
                    <ScrollReveal key={idx} variant="fade-up" delayMs={idx * 110}>
                      <div className="group premium-card-lift h-full rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 p-7 space-y-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-[#e6f8f1] dark:bg-emerald-950/70 text-[#0d9f6e] dark:text-emerald-400 group-hover:bg-[#0d9f6e] group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 shadow-xs">
                          <item.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-[#0d9f6e] dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 3: 100% FULL-WIDTH MINT SHOWCASE — BENTO CARDS + DONUT CHART
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-28 bg-[#ebfaf4] dark:bg-slate-900/80 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-28">
                {/* Part A: Bento Cards on Left + "Invoicing Solution For All" on Right */}
                <div className="grid lg:grid-cols-12 gap-14 xl:gap-20 items-center">
                  {/* Left 2x2 Bento Mosaic with Staggered Scale-Up Reveals */}
                  <div className="lg:col-span-6 grid sm:grid-cols-2 gap-5">
                    {/* Card 1: Dark Navy Template Card */}
                    <ScrollReveal variant="scale-up" delayMs={0}>
                      <div className="premium-card-lift h-full rounded-3xl bg-[#1e2538] p-7 text-white space-y-4 shadow-lg">
                        <span className="inline-block rounded-md bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">
                          New
                        </span>
                        <div className="text-base sm:text-lg font-extrabold leading-snug">
                          {language === 'sw'
                            ? 'Nyaraka za Kiswahili na Kiingereza'
                            : "We've Added Bilingual Templates"}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {language === 'sw'
                            ? 'Chapisha au pakua PDF za ankara na risiti kwa lugha anayoipenda mteja wako.'
                            : 'Generate branded commercial invoices, quotations, and receipts in English or Kiswahili.'}
                        </p>
                        <Link
                          to={currentUser ? '/app/invoices' : '/register'}
                          className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-extrabold text-slate-900 hover:bg-emerald-50 transition-all duration-300 hover:scale-105"
                        >
                          <span>{language === 'sw' ? 'Fungua Sasa' : 'Download Now'}</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </ScrollReveal>

                    {/* Right Column of Bento Stack */}
                    <div className="space-y-5">
                      {/* Card 2: White Quotation Card */}
                      <ScrollReveal variant="fade-up" delayMs={100}>
                        <div className="premium-card-lift rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-emerald-100 dark:border-slate-800 flex items-start gap-3.5 text-slate-800 dark:text-slate-100">
                          <div className="h-11 w-11 rounded-full bg-[#0d9f6e] text-white flex items-center justify-center shrink-0">
                            <FileCheck2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold">Quotations & Proformas</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Effortlessly track revisions and convert accepted estimates.
                            </div>
                          </div>
                        </div>
                      </ScrollReveal>

                      {/* Card 3: Emerald 18% Configurable VAT Pill */}
                      <ScrollReveal variant="fade-up" delayMs={180}>
                        <div className="premium-card-lift rounded-3xl bg-[#0d9f6e] p-5 text-white shadow-md flex items-center gap-4">
                          <span className="text-3xl font-extrabold tracking-tight">
                            <AnimatedCounter value={18} suffix="%" />
                          </span>
                          <span className="text-xs text-emerald-50 leading-snug font-medium">
                            Configurable VAT & Tax Rates per Country & Item
                          </span>
                        </div>
                      </ScrollReveal>

                      {/* Card 4: Verified Client Pill */}
                      <ScrollReveal variant="fade-up" delayMs={260}>
                        <div className="premium-card-lift rounded-3xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-emerald-100 dark:border-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-3">
                            <span className="h-10 w-10 rounded-full bg-slate-900 text-teal-400 font-extrabold text-xs flex items-center justify-center">
                              SL
                            </span>
                            <div>
                              <div className="text-xs sm:text-sm font-extrabold">Serengeti Logistics</div>
                              <span className="inline-block rounded bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                Verified Client
                              </span>
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-[#0d9f6e]" />
                        </div>
                      </ScrollReveal>
                    </div>

                    {/* Bottom-Left Total Revenue Mini Card */}
                    <ScrollReveal variant="fade-up" delayMs={220} className="sm:col-span-1">
                      <div className="premium-card-lift rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-emerald-100 dark:border-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-100">
                        <div>
                          <div className="h-8 w-8 rounded-xl bg-[#e6f8f1] dark:bg-emerald-950 text-[#0d9f6e] flex items-center justify-center mb-2">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                            <AnimatedCounter value={4720000} prefix="TSh " />
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Sample Issued Invoice</div>
                        </div>
                        <span className="text-[11px] font-extrabold text-[#0d9f6e] bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
                          100% Exact
                        </span>
                      </div>
                    </ScrollReveal>
                  </div>

                  {/* Right Content: Invoicing Solution For All with Smooth Animated Accordion */}
                  <ScrollReveal variant="fade-left" className="lg:col-span-6 space-y-5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>About InvoicePro</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-[1.15]">
                      {language === 'sw' ? 'Suluhisho la Ankara kwa Kila Biashara' : 'Invoicing Solution For All'}
                    </h2>

                    <div className="space-y-3.5 pt-2">
                      {[
                        {
                          title: 'Custom Workflow Management',
                          desc: 'Manage the complete document lifecycle from draft estimate to final payment receipt without losing audit history.',
                          bullets: [
                            'Convert accepted quotations to invoices without duplicates',
                            'Enforce issued-document immutability with linked Credit Notes',
                          ],
                        },
                        {
                          title: 'Bill in Multiple Currencies (TZS, KES, UGX, USD)',
                          desc: 'Issue documents in your client’s preferred currency while keeping dashboard and CSV reports strictly grouped by currency.',
                          bullets: [
                            'Configurable decimal and thousands separators',
                            'Explicit exchange rate & timestamp required for cross-currency conversion',
                          ],
                        },
                        {
                          title: 'Manage Accounts Receivable & Partial Payments',
                          desc: 'Record partial deposits via M-Pesa, Mixx by Yas, Airtel Money, or bank transfer and track remaining balances automatically.',
                          bullets: [
                            'Idempotent payment recording prevents double posting',
                            'Distinguishes manual entries from provider-confirmed settlements',
                          ],
                        },
                      ].map((acc, idx) => {
                        const isOpen = activeAccordion === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveAccordion(idx)}
                            className={`cursor-pointer rounded-2xl transition-all duration-300 p-5 ${
                              isOpen
                                ? 'bg-[#d4f4e7] dark:bg-emerald-950/60 border-l-4 border-[#0d9f6e] text-slate-900 dark:text-white shadow-sm translate-x-1'
                                : 'bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 border border-emerald-100 dark:border-slate-800 hover:translate-x-0.5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-base font-extrabold">{acc.title}</div>
                              <ChevronDown
                                className={`h-4 w-4 text-[#0d9f6e] transition-transform duration-300 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <div
                              className={`grid transition-all duration-300 ease-out ${
                                isOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0 mt-0'
                              }`}
                            >
                              <div className="overflow-hidden space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                <p className="leading-relaxed">{acc.desc}</p>
                                <ul className="space-y-1.5 pt-1">
                                  {acc.bullets.map((b, j) => (
                                    <li key={j} className="flex items-center gap-2 font-semibold">
                                      <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" />
                                      <span>{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollReveal>
                </div>

                {/* Part B: "An Online Invoicing Software" + Clean Reference Invoice Status Donut Card */}
                <div className="grid lg:grid-cols-12 gap-14 xl:gap-20 items-center">
                  <ScrollReveal variant="fade-right" className="lg:col-span-6 space-y-6">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Why Choose Us</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-[1.15]">
                      {language === 'sw'
                        ? 'Mfumo wa Kisasa wa Ankara Mtandaoni'
                        : 'An Online Invoicing Software'}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      InvoicePro clearly separates invoiced commercial value from actual cash collected, giving business owners and accountants an accurate view of receivables.
                    </p>

                    <div className="space-y-5 pt-2">
                      <div className="group flex items-start gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-[#d1f3e6] dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 group-hover:bg-[#0d9f6e] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Save More Time</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Reuse saved products and services, auto-generate sequential document numbers, and share expiring client portal links in seconds.
                          </p>
                        </div>
                      </div>

                      <div className="group flex items-start gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-[#d1f3e6] dark:bg-emerald-950 text-[#0d9f6e] dark:text-emerald-400 group-hover:bg-[#0d9f6e] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Get More Productive</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Log billable project hours, approve team timesheets, and use the rule-based AI assistant to prioritize overdue follow-ups.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Right Column: Reference Donut Chart Card ("Invoice Status") with Pro Animations */}
                  <ScrollReveal variant="scale-up" delayMs={120} className="lg:col-span-6 flex justify-center">
                    <Interactive3DTiltCard className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xl border border-emerald-100 dark:border-slate-800 text-center space-y-6 text-slate-800 dark:text-slate-100">
                      {/* Multi-Segment SVG Donut Chart matching the reference template */}
                      <div className="relative mx-auto h-56 w-56 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90 overflow-visible">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="transparent"
                            stroke="currentColor"
                            className="text-slate-100 dark:text-slate-800"
                            strokeWidth="4.5"
                          />
                          {/* Emerald Segment: Paid (48%) */}
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="transparent"
                            stroke="#0d9f6e"
                            strokeWidth={activeDonutMetric === 'collected' ? '5.8' : '4.5'}
                            strokeDasharray="42 88"
                            strokeDashoffset="0"
                            className="transition-all duration-500 ease-out cursor-pointer"
                            onMouseEnter={() => setActiveDonutMetric('collected')}
                            onClick={() => setActiveDonutMetric('collected')}
                          />
                          {/* Coral/Red Segment: Overdue (28%) */}
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth={activeDonutMetric === 'overdue' ? '5.8' : '4.5'}
                            strokeDasharray="25 88"
                            strokeDashoffset="-43"
                            className="transition-all duration-500 ease-out cursor-pointer"
                            onMouseEnter={() => setActiveDonutMetric('overdue')}
                            onClick={() => setActiveDonutMetric('overdue')}
                          />
                          {/* Amber Segment: Partially Paid / Issued (24%) */}
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth={activeDonutMetric === 'outstanding' ? '5.8' : '4.5'}
                            strokeDasharray="20 88"
                            strokeDashoffset="-69"
                            className="transition-all duration-500 ease-out cursor-pointer"
                            onMouseEnter={() => setActiveDonutMetric('outstanding')}
                            onClick={() => setActiveDonutMetric('outstanding')}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Invoice</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">Status</span>
                        </div>
                      </div>

                      {/* Interactive Legend Row with Animated Counters */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveDonutMetric('collected')}
                          className={`rounded-xl p-2.5 transition-all duration-300 cursor-pointer ${
                            activeDonutMetric === 'collected'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-[#0d9f6e] -translate-y-0.5'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-slate-500 dark:text-slate-400">Cash Collected</div>
                          <div className="font-extrabold text-[#0d9f6e] dark:text-emerald-400 mt-1">
                            <AnimatedCounter value={7133000} prefix="TSh " />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDonutMetric('outstanding')}
                          className={`rounded-xl p-2.5 transition-all duration-300 cursor-pointer ${
                            activeDonutMetric === 'outstanding'
                              ? 'bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-500 -translate-y-0.5'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-slate-500 dark:text-slate-400">Outstanding</div>
                          <div className="font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                            <AnimatedCounter value={3009000} prefix="TSh " />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDonutMetric('overdue')}
                          className={`rounded-xl p-2.5 transition-all duration-300 cursor-pointer ${
                            activeDonutMetric === 'overdue'
                              ? 'bg-red-50 dark:bg-red-950/60 ring-1 ring-red-500 -translate-y-0.5'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-slate-500 dark:text-slate-400">Overdue</div>
                          <div className="font-extrabold text-red-600 dark:text-red-400 mt-1">
                            <AnimatedCounter value={2720000} prefix="TSh " />
                          </div>
                        </button>
                      </div>
                    </Interactive3DTiltCard>
                  </ScrollReveal>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 4: HOW DOES IT WORK + LIVE DECIMAL-SAFE SANDBOX
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-28 bg-white dark:bg-slate-950 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-20">
                <div className="space-y-14">
                  <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Process</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                      {language === 'sw' ? 'Jinsi Mfumo Unavyofanya Kazi' : 'How Does It Work'}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                      From client quotation and project timesheets to verified payment receipts in three structured steps.
                    </p>
                  </ScrollReveal>

                  <div className="grid md:grid-cols-3 gap-8 xl:gap-10">
                    {/* Step Card 1: Soft Cream */}
                    <ScrollReveal variant="fade-up" delayMs={0}>
                      <div className="group premium-card-lift h-full rounded-3xl bg-[#fdf8e7] dark:bg-slate-900 dark:border dark:border-amber-900/40 p-7 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
                        <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-xs space-y-3.5 transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                            Proposals & Quotes
                          </div>
                          <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <span className="h-7 w-7 rounded-full bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-xs transition-transform duration-300 group-hover:scale-110">
                              01
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Approved Quotation</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <span className="h-7 w-7 rounded-full bg-[#0d9f6e] text-white font-extrabold flex items-center justify-center text-xs transition-transform duration-300 group-hover:scale-110">
                              02
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">Billable Project Hours</span>
                          </div>
                        </div>
                        <div className="text-center space-y-2 px-2">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Track Time, Expenses & Quotes
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Create client quotations, log approved project hours, and convert directly into sequential commercial invoices.
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Step Card 2: Soft Mint */}
                    <ScrollReveal variant="fade-up" delayMs={120}>
                      <div className="group premium-card-lift h-full rounded-3xl bg-[#eafaf4] dark:bg-slate-900 dark:border dark:border-emerald-900/40 p-7 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
                        <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-xs space-y-3.5 transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                            Revenue Flow
                          </div>
                          <div className="h-24 flex items-end justify-between gap-2.5 pt-2 px-3">
                            {[45, 75, 55, 95, 65, 85].map((h, i) => (
                              <div key={i} className="w-full flex flex-col items-center gap-1 h-full justify-end">
                                <div
                                  style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                                  className={`w-3 rounded-t-full animate-bar-grow transition-transform duration-300 group-hover:scale-y-105 ${
                                    i % 2 === 0 ? 'bg-[#0d9f6e]' : 'bg-emerald-200 dark:bg-emerald-800'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-center space-y-2 px-2">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Your Finances In One Place
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Distinguish total invoiced value from cash actually collected across aging buckets and currencies.
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Step Card 3: Soft Warm Peach */}
                    <ScrollReveal variant="fade-up" delayMs={240}>
                      <div className="group premium-card-lift h-full rounded-3xl bg-[#fef4e8] dark:bg-slate-900 dark:border dark:border-orange-900/40 p-7 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
                        <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-xs space-y-3 transition-transform duration-300 group-hover:-translate-y-1">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                            All Transactions
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs transition-transform duration-300 group-hover:translate-x-1">
                            <span className="font-semibold">M-Pesa Lipa Namba</span>
                            <span className="text-[#0d9f6e] dark:text-emerald-400 font-extrabold">
                              +<AnimatedCounter value={2000000} />
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs transition-transform duration-300 delay-75 group-hover:translate-x-1">
                            <span className="font-semibold">CRDB Bank RTGS</span>
                            <span className="text-[#0d9f6e] dark:text-emerald-400 font-extrabold">
                              +<AnimatedCounter value={5133000} />
                            </span>
                          </div>
                        </div>
                        <div className="text-center space-y-2 px-2">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Record & Verify Payments
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Allocate partial or full payments with idempotency protection and generate instant sequential receipts.
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                </div>

                {/* INTERACTIVE DECIMAL-SAFE INVOICE & VAT SANDBOX WIDGET */}
                <ScrollReveal variant="fade-up" delayMs={100}>
                  <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-gradient-to-br from-[#f4fcf9] via-white to-[#ebfaf4] dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 p-8 sm:p-10 lg:p-12 shadow-lg">
                    <div className="grid lg:grid-cols-12 gap-10 items-center">
                      <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#0d9f6e]/10 dark:bg-emerald-950 px-3.5 py-1 text-xs font-extrabold text-[#0d9f6e] dark:text-emerald-400">
                          <Calculator className="h-3.5 w-3.5" />
                          <span>Interactive Decimal-Safe Calculation Engine</span>
                        </div>
                        <h3 className="font-display text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                          {language === 'sw'
                            ? 'Jaribu Kikokotoo cha Ankara, VAT na Malipo ya Awamu'
                            : 'Test Our Live Invoice, VAT & Partial Payment Engine'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Every calculation in InvoicePro runs through our exact integer minor-unit (`BigInt`) financial engine—never floating-point approximations. Adjust the values below to preview real-time invoice and partial deposit reconciliation.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-4 text-xs">
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
                              <option value="USD">USD ($)</option>
                            </select>
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
                              Configurable VAT (%)
                            </label>
                            <select
                              value={sandboxTaxRate}
                              onChange={(e) => setSandboxTaxRate(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 font-extrabold"
                            >
                              <option value="18.00">18% (Tanzania / Uganda / Rwanda)</option>
                              <option value="16.00">16% (Kenya Standard)</option>
                              <option value="0.00">0% (Exempt / Zero-Rated)</option>
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
                            {[0, 30, 50, 75, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setSandboxDepositPercent(pct)}
                                className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                                  sandboxDepositPercent === pct
                                    ? 'bg-[#0d9f6e] text-white shadow-sm -translate-y-0.5'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:-translate-y-0.5'
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Live Calculated Output Card */}
                      <div className="lg:col-span-5 rounded-3xl bg-slate-900 text-white p-7 sm:p-8 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Live Reconciliation Preview
                            </span>
                          </div>
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300">
                            {sandboxBalanceInfo.isFullyPaid
                              ? 'Paid'
                              : sandboxBalanceInfo.isPartiallyPaid
                                ? 'Partially Paid'
                                : 'Issued'}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal (Net)</span>
                            <span className="font-bold text-white">
                              {formatMoney(sandboxTotals.subtotal, sandboxCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Configured Tax ({sandboxTaxRate}%)</span>
                            <span className="font-bold text-white">
                              {formatMoney(sandboxTotals.taxTotal, sandboxCurrency)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-2.5 font-extrabold text-base">
                            <span>Grand Total</span>
                            <span>{formatMoney(sandboxTotals.grandTotal, sandboxCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400 font-bold">
                            <span>Allocated Payment ({sandboxDepositPercent}%)</span>
                            <span>-{formatMoney(depositPaidRaw, sandboxCurrency)}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Remaining Balance Due
                          </span>
                          <span className="text-lg sm:text-xl font-extrabold text-amber-300">
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
                SECTION 5: CHOOSE YOUR PLAN (100% Full Width Mint Section + Billing Switcher)
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-28 bg-[#ebfaf4] dark:bg-slate-900/80 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14">
                <ScrollReveal variant="fade-up" className="text-center max-w-2xl mx-auto space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Price</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                    {language === 'sw' ? 'Chagua Mpango Wako' : 'Choose Your Plan'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                    Transparent proposed subscription tiers in Tanzanian Shillings (TSh). Also includes our Starter Plan at TSh 10,000/month.
                  </p>

                  {/* Interactive Monthly / Annual Switcher */}
                  <div className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-xs border border-emerald-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPlanInterval('monthly')}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                        planInterval === 'monthly'
                          ? 'bg-[#0d9f6e] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanInterval('annual')}
                      className={`rounded-full px-5 py-2 text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                        planInterval === 'annual'
                          ? 'bg-[#0d9f6e] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Annual Billing (2 Months Free)
                    </button>
                  </div>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-8 xl:gap-10 items-center max-w-7xl mx-auto">
                  {/* Left Card: Business Plan */}
                  <ScrollReveal variant="fade-up" delayMs={0}>
                    <div className="premium-card-lift rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-9 shadow-md border border-emerald-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-7">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="h-12 w-12 rounded-2xl bg-[#1e2538] text-white flex items-center justify-center font-bold">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Business
                          </div>
                          <div className="text-2xl font-extrabold text-[#0d9f6e] dark:text-emerald-400 mt-0.5">
                            {planInterval === 'monthly' ? 'TSh 50,000' : 'TSh 500,000'}
                            <span className="text-xs font-normal text-slate-400">
                              /{planInterval === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Up to 10,000 invoices / month
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Up to 25 team members & roles
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Projects, Time & AI Assistant
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Custom branding & CSV exports
                        </li>
                      </ul>
                      <Link
                        to="/register"
                        className="btn-shimmer block w-full text-center rounded-full bg-[#0d9f6e] py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-emerald-700 transition"
                      >
                        Start Free 14-Day Trial
                      </Link>
                    </div>
                  </ScrollReveal>

                  {/* Center Card: Highlighted Emerald Card (Professional Plan) */}
                  <ScrollReveal variant="scale-up" delayMs={120}>
                    <div className="premium-card-lift rounded-3xl bg-[#0d9f6e] p-9 sm:p-10 shadow-2xl text-white space-y-7 md:scale-105">
                      <div className="flex items-center justify-between border-b border-white/20 pb-5">
                        <div className="h-12 w-12 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold">
                          <Crown className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                            Professional Plan
                          </div>
                          <div className="text-3xl font-extrabold text-white mt-0.5">
                            {planInterval === 'monthly' ? 'TSh 25,000' : 'TSh 250,000'}
                            <span className="text-xs font-normal text-emerald-100">
                              /{planInterval === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-3.5 text-xs sm:text-sm text-emerald-50">
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-white shrink-0" /> Up to 250 invoices / month
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-white shrink-0" /> Up to 5 team members
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-white shrink-0" /> Projects, Contracts & Time
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-white shrink-0" /> Safe AI Billing Assistant
                        </li>
                      </ul>
                      <Link
                        to="/register"
                        className="btn-shimmer block w-full text-center rounded-full bg-white py-3.5 text-xs sm:text-sm font-extrabold text-[#0d9f6e] shadow-md hover:bg-emerald-50 transition"
                      >
                        Start Free 14-Day Trial
                      </Link>
                    </div>
                  </ScrollReveal>

                  {/* Right Card: Forever Free / Starter */}
                  <ScrollReveal variant="fade-up" delayMs={240}>
                    <div className="premium-card-lift rounded-3xl bg-white dark:bg-slate-900 p-8 sm:p-9 shadow-md border border-emerald-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-7">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="h-12 w-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Forever Free
                          </div>
                          <div className="text-2xl font-extrabold text-[#0d9f6e] dark:text-emerald-400 mt-0.5">
                            TSh 0<span className="text-xs font-normal text-slate-400">/mo</span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Up to 5 invoices / month
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Up to 10 saved clients
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Bilingual PDF Invoices & Quotes
                        </li>
                        <li className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-[#0d9f6e] shrink-0" /> Starter Plan available @ TSh 10k
                        </li>
                      </ul>
                      <Link
                        to="/register"
                        className="block w-full text-center rounded-full bg-[#1e2538] dark:bg-slate-800 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                      >
                        Start For Free
                      </Link>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------
                SECTION 6: WORKFLOW SPOTLIGHTS (100% Full Width White / Dark Section)
               --------------------------------------------------------------- */}
            <section className="w-full py-24 lg:py-28 bg-white dark:bg-slate-950 transition-colors duration-300">
              <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 space-y-14 text-center">
                <ScrollReveal variant="fade-up" className="max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Built For Your Sector</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                    {language === 'sw'
                      ? 'Imeundwa kwa Biashara za Afrika Mashariki'
                      : 'Tailored For Every Business Workflow'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                    Purpose-built workflows for Tanzanian and East African service providers, agencies, and growing enterprises.
                  </p>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-8 xl:gap-12 pt-4">
                  {[
                    {
                      initials: 'FC',
                      bg: 'bg-[#0d9f6e]',
                      role: 'Freelancers & Consultants',
                      sub: 'Advisory, IT & Legal Specialists',
                      text: 'Issue bilingual English and Kiswahili quotations, convert approved scope into sequential invoices, and share M-Pesa Lipa Namba payment instructions.',
                    },
                    {
                      initials: 'DA',
                      bg: 'bg-[#1e2538]',
                      role: 'Agencies & Studios',
                      sub: 'Creative, Digital & Engineering Teams',
                      text: 'Track project budgets, approve billable staff hours, and separate Sales and Accountant permissions with database-level Row Level Security.',
                    },
                    {
                      initials: 'CL',
                      bg: 'bg-amber-500',
                      role: 'Contractors & Suppliers',
                      sub: 'Logistics, Construction & B2B Trade',
                      text: 'Generate Proforma Invoices for procurement, record mobilization deposits and partial payments, and reconcile credit notes with a complete audit trail.',
                    },
                  ].map((spot, idx) => (
                    <ScrollReveal key={idx} variant="fade-up" delayMs={idx * 130}>
                      <div className="group premium-card-lift h-full rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/50 p-8 space-y-4">
                        <div
                          className={`mx-auto h-16 w-16 rounded-full ${spot.bg} text-white font-display text-lg font-bold flex items-center justify-center shadow-md border-4 border-emerald-50 dark:border-slate-800 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1`}
                        >
                          {spot.initials}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{spot.role}</h3>
                          <div className="text-xs font-bold text-[#0d9f6e] dark:text-emerald-400 mt-0.5">
                            {spot.sub}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {spot.text}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
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
                  className="premium-card-lift rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs"
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
                  className={`premium-card-lift rounded-3xl border p-8 flex flex-col justify-between ${plan.id === 'professional'
                      ? 'bg-[#0d9f6e] text-white border-[#0d9f6e] shadow-xl'
                      : 'bg-white border-emerald-100 dark:bg-slate-900 dark:border-slate-800'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-extrabold">
                        {language === 'sw' ? plan.nameSw : plan.nameEn}
                      </h2>
                      {plan.id === 'professional' && (
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-5">
                      <span className="text-3xl font-extrabold">
                        {formatMoney(plan.monthlyPriceTzs, 'TZS', { hideDecimalsForWholeShillings: true })}
                      </span>
                      <span className="text-xs opacity-75"> / month</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Annual: {formatMoney(plan.annualPriceTzs, 'TZS', { hideDecimalsForWholeShillings: true })} / yr
                    </div>

                    <ul className="mt-6 space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Up to {plan.maxInvoicesPerMonth} invoices / month
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Up to {plan.maxClients} active clients
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Up to {plan.maxTeamMembers} team member(s)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {plan.allowProjectsTime ? 'Projects & Billable Time included' : 'Core Invoicing & Quotations'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {plan.allowAiAssistant ? 'AI Billing Assistant enabled' : 'Standard manual templates'}
                      </li>
                    </ul>
                  </div>

                  <Link
                    to="/register"
                    className={`btn-shimmer mt-8 block text-center rounded-full px-4 py-3 text-sm font-extrabold transition ${plan.id === 'professional'
                        ? 'bg-white text-[#0d9f6e] hover:bg-emerald-50'
                        : 'bg-[#0d9f6e] text-white hover:bg-emerald-700'
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
                  className="premium-card-lift rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8"
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
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold">Help Centre & Operational Guides</h1>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
                <h2 className="text-lg font-extrabold">Important Notice on TRA EFD / VFD Fiscal Receipts</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ordinary commercial invoices and payment receipts generated in InvoicePro are commercial billing records and are <strong>not automatically TRA EFD/VFD fiscal receipts</strong>. Fiscal-document issuance requires a separate, verified TRA VFD integration module.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
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
                  className="premium-card-lift rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-7"
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
                className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-5"
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
            <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
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
            <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
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

      {/* 100% Full-Width Footer */}
      <footer className="w-full border-t border-emerald-100 dark:border-slate-800 bg-[#f8fdfb] dark:bg-slate-950 py-12 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#0d9f6e]" />
            <span className="font-medium">
              © {new Date().getFullYear()} InvoicePro Tanzania. Built for East African Businesses.
            </span>
          </div>
          <div className="flex flex-wrap gap-6 font-medium">
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
