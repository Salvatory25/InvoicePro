import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Smartphone,
  CheckCircle2,
  Play,
  Pause,
  ArrowUpRight,
  Lock,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

/**
 * 1. Interactive 3D Mouse-Parallax Tilt Wrapper with Dynamic Cursor Spotlight
 */
export const Interactive3DTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}> = ({ children, className = '', intensity = 6 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  );
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransformStyle(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.012, 1.012, 1.012)`
    );
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.16,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-30 transition-opacity duration-300"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.65), transparent 55%)`,
        }}
      />
    </div>
  );
};

/**
 * 2. Hero Live Payment Stream & Orbital Telemetry SVG Motion Graphic
 * Renders animated SVG Bézier payment streams, glowing traveling data packets,
 * and an auto-cycling live transaction state ticker directly on the Hero showcase.
 */
export const HeroPaymentStreamMotionGraphic: React.FC<{ isSw: boolean }> = ({ isSw }) => {
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);

  const liveEvents = [
    {
      channel: 'M-Pesa STK Push',
      reference: 'MPESA-9482019TZ',
      amount: 'TZS 1,500,000',
      state: isSw ? 'Imethibitishwa Moja kwa Moja' : 'Settled & Allocated',
      color: '#10b981',
    },
    {
      channel: 'CRDB Bank EFT',
      reference: 'CRDB-2026-88412',
      amount: 'TZS 2,738,000',
      state: isSw ? 'Risiti #RCP-0001 Imetolewa' : 'Receipt #RCP-0001 Issued',
      color: '#0d9f6e',
    },
    {
      channel: 'Airtel Money TZ',
      reference: 'AIRTEL-7731904',
      amount: 'TZS 850,000',
      state: isSw ? 'Salio la Ankaraimesasishwa' : 'Invoice Balance Updated',
      color: '#f59e0b',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeedIndex((prev) => (prev + 1) % liveEvents.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [liveEvents.length]);

  const currentEvent = liveEvents[activeFeedIndex];

  return (
    <div className="mt-4 rounded-xl bg-slate-950/95 dark:bg-slate-950 border border-emerald-500/25 p-3.5 text-white shadow-inner overflow-hidden relative">
      {/* Animated SVG Background Vector Stream */}
      <svg
        className="w-full h-16 overflow-visible"
        viewBox="0 0 420 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Live payment settlement motion graphic"
      >
        <defs>
          <linearGradient id="heroStreamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="heroStreamGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d9f6e" stopOpacity="0.1" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
          </linearGradient>
          <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Subtle Telemetry Grid Lines */}
        <line x1="0" y1="16" x2="420" y2="16" stroke="rgba(16,185,129,0.1)" strokeDasharray="3 3" />
        <line x1="0" y1="34" x2="420" y2="34" stroke="rgba(16,185,129,0.14)" strokeDasharray="3 3" />
        <line x1="0" y1="52" x2="420" y2="52" stroke="rgba(16,185,129,0.1)" strokeDasharray="3 3" />

        {/* Base Guide Curves */}
        <path
          d="M 18 50 C 95 50, 125 14, 210 34 C 295 54, 330 18, 402 22"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 18 18 C 105 18, 140 52, 210 34 C 280 16, 335 48, 402 46"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          fill="none"
        />

        {/* Animated Flowing Dash Streams */}
        <path
          id="paymentStreamPath1"
          d="M 18 50 C 95 50, 125 14, 210 34 C 295 54, 330 18, 402 22"
          stroke="url(#heroStreamGrad1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="10 14"
          className="animate-dash-flow"
          filter="url(#heroGlow)"
        />
        <path
          id="paymentStreamPath2"
          d="M 18 18 C 105 18, 140 52, 210 34 C 280 16, 335 48, 402 46"
          stroke="url(#heroStreamGrad2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 16"
          className="animate-dash-flow-fast"
        />

        {/* Glowing Particles Traveling Along SVG Paths */}
        <circle r="4" fill="#34d399" filter="url(#heroGlow)">
          <animateMotion
            dur="3.2s"
            repeatCount="indefinite"
            path="M 18 50 C 95 50, 125 14, 210 34 C 295 54, 330 18, 402 22"
          />
        </circle>
        <circle r="3.5" fill="#fbbf24" filter="url(#heroGlow)">
          <animateMotion
            dur="4.1s"
            begin="1.1s"
            repeatCount="indefinite"
            path="M 18 18 C 105 18, 140 52, 210 34 C 280 16, 335 48, 402 46"
          />
        </circle>

        {/* Source Node (Client Payment Rail) */}
        <g transform="translate(18, 34)">
          <circle r="10" fill="rgba(16,185,129,0.2)" className="animate-radar-ping" />
          <circle r="6" fill="#10b981" stroke="#052e24" strokeWidth="2" />
        </g>

        {/* Central Verification Hub Node */}
        <g transform="translate(210, 34)">
          <circle
            r="16"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            className="animate-orbit-slow"
          />
          <circle r="9" fill="#0d9f6e" stroke="#6ee7b7" strokeWidth="1.8" />
          <circle r="3.5" fill="#ffffff" />
        </g>

        {/* Destination Node (Immutable Receipt Ledger) */}
        <g transform="translate(402, 34)">
          <circle r="11" fill="rgba(251,191,36,0.22)" className="animate-radar-ping" />
          <circle r="6.5" fill="#fbbf24" stroke="#052e24" strokeWidth="2" />
        </g>
      </svg>

      {/* Live Animated Telemetry Status Bar */}
      <div className="mt-1.5 flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-semibold text-emerald-300 truncate">{currentEvent.channel}</span>
          <span className="text-slate-400 font-mono hidden sm:inline">• {currentEvent.reference}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-white tabular-nums">{currentEvent.amount}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-400/25">
            {currentEvent.state}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Interactive Auto-Playing 4-Stage Billing & Settlement Motion Graphics Theater
 * A dedicated full-width choreographed motion canvas showing animated vector scenes for:
 * Stage 1: Quotation Blueprint & Scope Lock
 * Stage 2: Sequential Immutable Invoice Lock
 * Stage 3: Live Mobile Money & Bank Settlement Stream
 * Stage 4: Automated Receipt & Real-Time Receivables Radar
 */
export const LiveBillingMotionTheater: React.FC<{ isSw: boolean }> = ({ isSw }) => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const stages = [
    {
      id: 'quote',
      step: '01',
      title: isSw ? 'Nukuu na KufungaWigo' : 'Quotation & Scope Lock',
      subtitle: isSw
        ? ' Mistari ya huduma, kodi ya VAT 18%, na idhini ya mteja vinahakikiwa kwa usahihi wa desimali.'
        : 'Service line items, 18% VAT rules, and client acceptance timestamps lock into a verifiable blueprint.',
      metricLabel: isSw ? 'Usahihi wa Hesabu' : 'Arithmetic Precision',
      metricValue: '100% Minor-Unit BigInt',
      badge: 'QUO-2026-0001',
      icon: FileText,
    },
    {
      id: 'invoice',
      step: '02',
      title: isSw ? 'Ankara Isiyobadilika Kiholela' : 'Immutable Invoice Seal',
      subtitle: isSw
        ? 'Ankara iliyotolewa hufungwa dhidi ya ufutaji wa siri; mabadiliko hupitia Noti ya Mkopo pekee.'
        : 'Issued invoices are cryptographically locked against silent edits; adjustments require an auditable Credit Note.',
      metricLabel: isSw ? 'Kufunga Kumbukumbu' : 'Audit Trail Protection',
      metricValue: 'PostgreSQL Trigger + RLS',
      badge: 'INV-2026-0001',
      icon: Lock,
    },
    {
      id: 'settlement',
      step: '03',
      title: isSw ? 'Mtiririko wa Malipo ya Simu na Benki' : 'Mobile Money & Bank Stream',
      subtitle: isSw
        ? 'Malipo ya awamu au kamili kupitia M-Pesa, Airtel Money, na CRDB huunganishwa bila kurudia.'
        : 'Partial deposits and final settlements via M-Pesa, Airtel Money, and bank EFT allocate idempotently.',
      metricLabel: isSw ? 'Ulinzi wa Marudio' : 'Idempotency Guard',
      metricValue: 'Unique Reference Key',
      badge: 'TZS 2,738,000',
      icon: Smartphone,
    },
    {
      id: 'receipt',
      step: '04',
      title: isSw ? 'Risiti na Rada ya Mapato' : 'Automated Receipt & Cashflow Radar',
      subtitle: isSw
        ? 'Risiti rasmi inatolewa papo hapo na dashibodi ya madeni inasasishwa kwa wakati halisi.'
        : 'Instant numbered receipts generate automatically while aged receivables and VAT ledgers reconcile live.',
      metricLabel: isSw ? 'Usawazishaji wa Leja' : 'Ledger Reconciliation',
      metricValue: 'Real-Time Zero Drift',
      badge: 'RCP-2026-0001',
      icon: CheckCircle2,
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStage((stage) => (stage + 1) % stages.length);
          return 0;
        }
        return prev + 2.5;
      });
    }, 110);
    return () => clearInterval(interval);
  }, [isPlaying, stages.length]);

  const handleSelectStage = (index: number) => {
    setActiveStage(index);
    setProgress(0);
  };

  return (
    <div className="rounded-[2rem] bg-slate-950 text-white border border-emerald-500/25 shadow-2xl overflow-hidden relative">
      {/* Ambient Radial Motion Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"
      />

      {/* Top Motion Theater Header Bar */}
      <div className="px-6 sm:px-10 py-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {isSw ? 'injini ya michoro mwendo hai' : 'Live Interactive Motion Graphics'}
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            {isSw
              ? 'Bofya hatua yoyote au tazama mzunguko wa bili ukifanya kazi moja kwa moja'
              : 'Click any stage or watch the automated billing telemetry animate in real time'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            {isPlaying ? (isSw ? 'Simamisha Mwendo' : 'Pause Motion') : isSw ? 'Cheza Mwendo' : 'Play Motion'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStage((s) => (s + 1) % stages.length);
              setProgress(0);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-semibold text-emerald-300 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isSw ? 'Hatua Inayofuata' : 'Next Stage'}
          </button>
        </div>
      </div>

      {/* Main Split Motion Theater: Left Stage Controls + Right Animated SVG Vector Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
        {/* Left 5 Columns: Interactive Stage Selector Cards with Live Progress Bars */}
        <div className="lg:col-span-5 space-y-3">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === activeStage;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleSelectStage(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-emerald-950/60 border-emerald-400/50 shadow-lg shadow-emerald-950/50'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                          STEP {stage.step}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200">
                          {stage.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">{stage.title}</h4>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <p className="text-xs text-slate-300 leading-relaxed mt-3 pl-13">{stage.subtitle}</p>
                )}

                {/* Animated Progress Scrubber inside active stage */}
                {isActive && (
                  <div className="mt-3.5 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right 7 Columns: High-Resolution Animated SVG Motion Graphics Canvas */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#07261f] to-slate-950 border border-emerald-400/25 p-6 sm:p-8 relative overflow-hidden min-h-[390px] flex flex-col justify-between shadow-inner">
            {/* Top Canvas Status Pill */}
            <div className="flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-semibold">
                  {stages[activeStage].id.toUpperCase()} TELEMETRY ENGINE
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-amber-300">
                {stages[activeStage].metricLabel}: <strong>{stages[activeStage].metricValue}</strong>
              </div>
            </div>

            {/* Dynamic SVG Vector Motion Scene Based on Active Stage */}
            <div className="my-4 flex items-center justify-center relative z-10">
              {activeStage === 0 && (
                /* STAGE 1 MOTION GRAPHIC: Animated Blueprint Scanning & Line-Item Vector Assembly */
                <svg
                  className="w-full max-w-[540px] h-[250px]"
                  viewBox="0 0 540 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="scanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                      <stop offset="50%" stopColor="#34d399" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Orbiting Blueprint Rings */}
                  <circle
                    cx="135"
                    cy="125"
                    r="88"
                    stroke="rgba(16,185,129,0.22)"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    className="animate-orbit-slow"
                  />
                  <circle
                    cx="135"
                    cy="125"
                    r="64"
                    stroke="rgba(251,191,36,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="10 8"
                    className="animate-orbit-reverse"
                  />

                  {/* Quotation Document Vector Card */}
                  <rect
                    x="65"
                    y="45"
                    width="140"
                    height="160"
                    rx="14"
                    fill="#0b3b2e"
                    stroke="#34d399"
                    strokeWidth="2"
                  />
                  <rect x="82" y="65" width="60" height="10" rx="5" fill="#34d399" />
                  <rect x="82" y="88" width="106" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
                  <rect x="82" y="106" width="90" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
                  <rect x="82" y="124" width="106" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
                  <rect x="82" y="152" width="106" height="28" rx="8" fill="rgba(16,185,129,0.25)" stroke="#10b981" />
                  <text x="95" y="170" fill="#6ee7b7" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    VAT 18% LOCKED
                  </text>

                  {/* Animated Laser Scan Beam Moving Up and Down */}
                  <rect x="60" y="50" width="150" height="22" fill="url(#scanBeam)">
                    <animate attributeName="y" values="45;180;45" dur="3.2s" repeatCount="indefinite" />
                  </rect>

                  {/* Animated Vector Connection Stream to Client Acceptance Node */}
                  <path
                    d="M 205 125 C 260 125, 275 85, 330 85"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeDasharray="8 8"
                    className="animate-dash-flow"
                  />
                  <path
                    d="M 205 125 C 260 125, 275 165, 330 165"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    strokeDasharray="8 8"
                    className="animate-dash-flow-fast"
                  />

                  {/* Glowing Packets */}
                  <circle r="4.5" fill="#34d399">
                    <animateMotion
                      dur="2.2s"
                      repeatCount="indefinite"
                      path="M 205 125 C 260 125, 275 85, 330 85"
                    />
                  </circle>
                  <circle r="4.5" fill="#fbbf24">
                    <animateMotion
                      dur="2.6s"
                      repeatCount="indefinite"
                      path="M 205 125 C 260 125, 275 165, 330 165"
                    />
                  </circle>

                  {/* Right Output Nodes */}
                  <g transform="translate(330, 58)">
                    <rect width="175" height="54" rx="12" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                    <text x="16" y="22" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                      SUBTOTAL + 18% TRA VAT
                    </text>
                    <text x="16" y="40" fill="#ffffff" fontSize="14" fontFamily="monospace" fontWeight="bold">
                      TZS 2,738,000
                    </text>
                  </g>

                  <g transform="translate(330, 138)">
                    <rect width="175" height="54" rx="12" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="16" y="22" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                      CLIENT PORTAL STATUS
                    </text>
                    <text x="16" y="40" fill="#fbbf24" fontSize="13" fontFamily="monospace" fontWeight="bold">
                      ACCEPTED &amp; CONVERTED
                    </text>
                  </g>
                </svg>
              )}

              {activeStage === 1 && (
                /* STAGE 2 MOTION GRAPHIC: Cryptographic Seal & Immutability Shield Orbit */
                <svg
                  className="w-full max-w-[540px] h-[250px]"
                  viewBox="0 0 540 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Concentric Rotating Security Rings */}
                  <g transform="translate(270, 125)">
                    <circle
                      r="102"
                      stroke="rgba(16,185,129,0.2)"
                      strokeWidth="1.5"
                      strokeDasharray="12 8"
                      className="animate-orbit-slow"
                    />
                    <circle
                      r="78"
                      stroke="rgba(52,211,153,0.4)"
                      strokeWidth="2"
                      strokeDasharray="18 10"
                      className="animate-orbit-reverse"
                    />
                    <circle r="54" fill="rgba(13,159,110,0.22)" className="animate-radar-ping" />
                    <circle r="48" fill="#064e3b" stroke="#34d399" strokeWidth="2.5" />

                    {/* Shield Icon Path inside Center */}
                    <path
                      d="M 0 -22 L 18 -14 L 18 4 C 18 16 0 24 0 24 C 0 24 -18 16 -18 4 L -18 -14 Z"
                      fill="rgba(52,211,153,0.2)"
                      stroke="#6ee7b7"
                      strokeWidth="2.2"
                    />
                    <path d="M -6 2 L -1 7 L 8 -4" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Left Node: Sequential Atomic Generator */}
                  <g transform="translate(24, 48)">
                    <rect width="145" height="62" rx="12" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#6ee7b7" fontSize="10" fontFamily="monospace">
                      ATOMIC SEQUENCE
                    </text>
                    <text x="14" y="44" fill="#ffffff" fontSize="14" fontFamily="monospace" fontWeight="bold">
                      INV-2026-0001
                    </text>
                  </g>

                  {/* Bottom Left Node: Tenant Isolation RLS */}
                  <g transform="translate(24, 140)">
                    <rect width="145" height="62" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                      TENANT RLS POLICY
                    </text>
                    <text x="14" y="44" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">
                      ISOLATED TENANT
                    </text>
                  </g>

                  {/* Right Node: Silent Edit Blocked */}
                  <g transform="translate(370, 48)">
                    <rect width="148" height="62" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#fbbf24" fontSize="10" fontFamily="monospace">
                      DIRECT OVERWRITE
                    </text>
                    <text x="14" y="44" fill="#fbbf24" fontSize="13" fontFamily="monospace" fontWeight="bold">
                      BLOCKED BY DB
                    </text>
                  </g>

                  {/* Bottom Right Node: Credit Note Audit Path */}
                  <g transform="translate(370, 140)">
                    <rect width="148" height="62" rx="12" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                    <text x="14" y="24" fill="#6ee7b7" fontSize="10" fontFamily="monospace">
                      CORRECTION PATH
                    </text>
                    <text x="14" y="44" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold">
                      CN-2026-0001
                    </text>
                  </g>

                  {/* Connecting Animated Beams */}
                  <line
                    x1="169"
                    y1="79"
                    x2="222"
                    y2="108"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    className="animate-dash-flow"
                  />
                  <line
                    x1="169"
                    y1="171"
                    x2="222"
                    y2="142"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    className="animate-dash-flow"
                  />
                  <line
                    x1="318"
                    y1="108"
                    x2="370"
                    y2="79"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    className="animate-dash-flow-fast"
                  />
                  <line
                    x1="318"
                    y1="142"
                    x2="370"
                    y2="171"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    className="animate-dash-flow"
                  />
                </svg>
              )}

              {activeStage === 2 && (
                /* STAGE 3 MOTION GRAPHIC: Multi-Rail Payment Convergence Wave */
                <svg
                  className="w-full max-w-[540px] h-[250px]"
                  viewBox="0 0 540 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 3 Left Payment Rail Nodes */}
                  <g transform="translate(20, 30)">
                    <rect width="128" height="46" rx="10" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                    <text x="14" y="20" fill="#6ee7b7" fontSize="9" fontFamily="monospace">
                      MOBILE MONEY
                    </text>
                    <text x="14" y="35" fill="#ffffff" fontSize="12" fontWeight="bold">
                      M-Pesa / Airtel
                    </text>
                  </g>
                  <g transform="translate(20, 102)">
                    <rect width="128" height="46" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="14" y="20" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                      BANK TRANSFER
                    </text>
                    <text x="14" y="35" fill="#ffffff" fontSize="12" fontWeight="bold">
                      CRDB / NMB EFT
                    </text>
                  </g>
                  <g transform="translate(20, 174)">
                    <rect width="128" height="46" rx="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="14" y="20" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                      CARD &amp; INTL
                    </text>
                    <text x="14" y="35" fill="#ffffff" fontSize="12" fontWeight="bold">
                      VISA / USD Wire
                    </text>
                  </g>

                  {/* Converging Animated Bézier Streams */}
                  <path
                    d="M 148 53 C 220 53, 230 125, 295 125"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeDasharray="8 10"
                    className="animate-dash-flow"
                  />
                  <path
                    d="M 148 125 L 295 125"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="8 10"
                    className="animate-dash-flow-fast"
                  />
                  <path
                    d="M 148 197 C 220 197, 230 125, 295 125"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    strokeDasharray="8 10"
                    className="animate-dash-flow"
                  />

                  {/* Traveling Energy Orbs */}
                  <circle r="5" fill="#34d399">
                    <animateMotion
                      dur="2.1s"
                      repeatCount="indefinite"
                      path="M 148 53 C 220 53, 230 125, 295 125"
                    />
                  </circle>
                  <circle r="5" fill="#38bdf8">
                    <animateMotion dur="1.8s" repeatCount="indefinite" path="M 148 125 L 295 125" />
                  </circle>
                  <circle r="5" fill="#fbbf24">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path="M 148 197 C 220 197, 230 125, 295 125"
                    />
                  </circle>

                  {/* Right Allocation Vault Card */}
                  <g transform="translate(295, 42)">
                    <rect width="220" height="166" rx="18" fill="#0b3b2e" stroke="#34d399" strokeWidth="2" />
                    <text x="20" y="34" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      IDEMPOTENT ALLOCATION ENGINE
                    </text>
                    <text x="20" y="64" fill="#ffffff" fontSize="20" fontFamily="monospace" fontWeight="bold">
                      TZS 2,738,000
                    </text>
                    <text x="20" y="84" fill="#94a3b8" fontSize="11">
                      100% Allocated • Balance: TZS 0
                    </text>

                    {/* Animated Progress Bar Inside SVG */}
                    <rect x="20" y="102" width="180" height="12" rx="6" fill="rgba(255,255,255,0.12)" />
                    <rect x="20" y="102" width="180" height="12" rx="6" fill="#34d399">
                      <animate attributeName="width" values="45;180;180" dur="3s" repeatCount="indefinite" />
                    </rect>

                    <rect x="20" y="128" width="180" height="24" rx="6" fill="rgba(16,185,129,0.2)" />
                    <text x="32" y="144" fill="#6ee7b7" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      STATUS: PAID IN FULL
                    </text>
                  </g>
                </svg>
              )}

              {activeStage === 3 && (
                /* STAGE 4 MOTION GRAPHIC: Live Cashflow Spline Wave & Radial Gauge */
                <svg
                  className="w-full max-w-[540px] h-[250px]"
                  viewBox="0 0 540 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="areaWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Left Animated Radial Gauge */}
                  <g transform="translate(105, 125)">
                    <circle r="76" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                    <circle
                      r="76"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeDasharray="390 480"
                      strokeLinecap="round"
                      transform="rotate(-90)"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        values="120 480;390 480;390 480"
                        dur="3.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      r="54"
                      stroke="#fbbf24"
                      strokeWidth="8"
                      strokeDasharray="240 340"
                      strokeLinecap="round"
                      transform="rotate(-90)"
                      className="animate-orbit-slow"
                    />
                    <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold">
                      94.2%
                    </text>
                    <text x="0" y="16" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="monospace">
                      COLLECTED
                    </text>
                  </g>

                  {/* Right Animated Revenue Spline Curve & Scanning Playhead */}
                  <g transform="translate(215, 28)">
                    <rect
                      width="300"
                      height="190"
                      rx="16"
                      fill="rgba(15,23,42,0.75)"
                      stroke="rgba(52,211,153,0.3)"
                      strokeWidth="1.5"
                    />
                    <text x="20" y="28" fill="#6ee7b7" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      REAL-TIME RECEIVABLES TELEMETRY
                    </text>
                    <text x="20" y="48" fill="#ffffff" fontSize="16" fontFamily="monospace" fontWeight="bold">
                      TZS 24,500,000
                    </text>

                    {/* Area Under Spline */}
                    <path
                      d="M 20 155 C 65 145, 95 95, 140 110 C 185 125, 215 65, 280 58 L 280 170 L 20 170 Z"
                      fill="url(#areaWaveFill)"
                    />

                    {/* Animated Spline Curve */}
                    <path
                      d="M 20 155 C 65 145, 95 95, 140 110 C 185 125, 215 65, 280 58"
                      stroke="#34d399"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Animated Scanning Playhead Line */}
                    <g>
                      <line x1="140" y1="54" x2="140" y2="170" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4">
                        <animate attributeName="x1" values="40;265;40" dur="4.5s" repeatCount="indefinite" />
                        <animate attributeName="x2" values="40;265;40" dur="4.5s" repeatCount="indefinite" />
                      </line>
                    </g>

                    {/* Glowing Data Nodes */}
                    <circle cx="85" cy="116" r="4.5" fill="#34d399" />
                    <circle cx="140" cy="110" r="4.5" fill="#34d399" />
                    <circle cx="215" cy="82" r="5" fill="#fbbf24" />
                    <circle cx="280" cy="58" r="6" fill="#10b981" className="animate-ping" />
                    <circle cx="280" cy="58" r="5" fill="#34d399" />
                  </g>
                </svg>
              )}
            </div>

            {/* Bottom Stage Summary Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{stages[activeStage].title}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px] text-emerald-300">
                <span>LATENCY: &lt;18ms</span>
                <span>•</span>
                <span>DECIMAL ENGINE: ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 4. Interactive Multi-Ring SVG Donut & Live Telemetry Motion Graphic
 * Replaces static SVG rings in the Bento section with interactive hover segments,
 * orbiting telemetry markers, and animated dash sweeps.
 */
export const AnimatedInvoiceStatusDonut: React.FC<{ isSw: boolean }> = ({ isSw }) => {
  const [selectedSlice, setSelectedSlice] = useState<'paid' | 'pending' | 'overdue'>('paid');

  const slices = {
    paid: {
      label: isSw ? 'Zilizolipwa Kamili' : 'Paid & Receipted',
      percent: '58%',
      amount: 'TZS 14,210,000',
      color: '#0d9f6e',
      desc: isSw ? 'Zimehakikiwa na risiti kutolewa' : 'Verified & receipted in ledger',
    },
    pending: {
      label: isSw ? 'Zinazosubiri / Awamu' : 'Issued & Partial',
      percent: '27%',
      amount: 'TZS 6,615,000',
      color: '#f59e0b',
      desc: isSw ? 'Vikumbusho vya kiotomatiki vinatumwa' : 'Automated reminders active',
    },
    overdue: {
      label: isSw ? 'Zilizochelewa' : 'Overdue Receivables',
      percent: '15%',
      amount: 'TZS 3,675,000',
      color: '#ef4444',
      desc: isSw ? 'Zimepewa kipaumbele cha ufuatiliaji' : 'Flagged for priority follow-up',
    },
  };

  const activeData = slices[selectedSlice];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Orbiting Telemetry Ring */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="64"
            fill="none"
            stroke="rgba(13, 159, 110, 0.18)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            className="animate-orbit-slow"
          />

          {/* Background Track */}
          <circle
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="16"
          />

          {/* Green Paid Segment (58% -> ~182 of 314) */}
          <circle
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke="#0d9f6e"
            strokeWidth={selectedSlice === 'paid' ? '19' : '16'}
            strokeDasharray="182 314"
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setSelectedSlice('paid')}
            onClick={() => setSelectedSlice('paid')}
          />

          {/* Amber Pending Segment (27% -> ~85 of 314) */}
          <circle
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke="#f59e0b"
            strokeWidth={selectedSlice === 'pending' ? '19' : '16'}
            strokeDasharray="85 314"
            strokeDashoffset="-186"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setSelectedSlice('pending')}
            onClick={() => setSelectedSlice('pending')}
          />

          {/* Coral Overdue Segment (15% -> ~43 of 314) */}
          <circle
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke="#ef4444"
            strokeWidth={selectedSlice === 'overdue' ? '19' : '16'}
            strokeDasharray="43 314"
            strokeDashoffset="-275"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setSelectedSlice('overdue')}
            onClick={() => setSelectedSlice('overdue')}
          />
        </svg>

        {/* Center Live Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <span
            className="text-2xl font-extrabold font-display tracking-tight transition-colors duration-300"
            style={{ color: activeData.color }}
          >
            {activeData.percent}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-tight">
            {activeData.label}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            {activeData.amount}
          </span>
        </div>
      </div>

      {/* Interactive Segment Selector Pills */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        {(['paid', 'pending', 'overdue'] as const).map((key) => {
          const item = slices[key];
          const isSelected = selectedSlice === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedSlice(key)}
              className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-slate-800 border-emerald-500/40 shadow-xs'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.percent}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{activeData.desc}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-[#0d9f6e] shrink-0" />
      </div>
    </div>
  );
};
