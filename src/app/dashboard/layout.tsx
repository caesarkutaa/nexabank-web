'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, CreditCard,
  TrendingUp, Receipt, Bitcoin, FileText, ShieldCheck,
  Settings, LogOut, Bell, Search, ChevronDown, Menu, X,
  Building2, BarChart3, CheckCircle, Clock, Info,
  ArrowUpRight, ArrowDownLeft, AlertCircle, ArrowRight,
  RefreshCw, ShieldX, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { clearAuthCookies, setAuthCookies } from '../lib/api';
import api from '../lib/api';

// ─── Routes that require approved KYC ────────────────────────────────────────
// Must match KYC_REQUIRED_ROUTES in middleware.ts
const KYC_REQUIRED_PATHS = [
  '/dashboard/transfers',
  '/dashboard/transactions',
  '/dashboard/cards',
  '/dashboard/loans',
  '/dashboard/investments',
  '/dashboard/bills',
  '/dashboard/crypto',
  '/dashboard/cheques',
];

const NAV = [
  { href: '/dashboard/userboard',    Icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/dashboard/accounts',     Icon: Wallet,          label: 'Accounts'     },
  { href: '/dashboard/transfers',    Icon: ArrowLeftRight,  label: 'Transfers'    },
  { href: '/dashboard/transactions', Icon: Receipt,         label: 'Transactions' },
  { href: '/dashboard/cards',        Icon: CreditCard,      label: 'Cards'        },
  { href: '/dashboard/loans',        Icon: Building2,       label: 'Loans'        },
  { href: '/dashboard/investments',  Icon: TrendingUp,      label: 'Investments'  },
  { href: '/dashboard/bills',        Icon: BarChart3,       label: 'Bills'        },
  { href: '/dashboard/crypto',       Icon: Bitcoin,         label: 'Crypto'       },
  { href: '/dashboard/cheques',      Icon: FileText,        label: 'Cheques'      },
  { href: '/dashboard/kyc',          Icon: ShieldCheck,     label: 'KYC'          },
  { href: '/dashboard/settings',     Icon: Settings,        label: 'Settings'     },
];

function ini(a?: string, b?: string) {
  return `${a?.[0] ?? ''}${b?.[0] ?? ''}`.toUpperCase() || 'U';
}
function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Inline KYC Gate ─────────────────────────────────────────────────────────
// Renders inside <main> so the sidebar/header always show.
type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'resubmit';

const KYC_CFG = {
  not_started: {
    Icon: ShieldX, iconColor: '#94a3b8', iconBg: 'rgba(148,163,184,.12)',
    title: 'Identity Verification Required',
    sub: 'Complete KYC to unlock transfers, cards, investments and all banking features.',
    cta: 'Start Verification', danger: false,
  },
  pending: {
    Icon: Clock, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,.12)',
    title: 'Verification Under Review',
    sub: 'Your documents are being reviewed. This usually takes 1–24 hours. You\'ll be notified once approved.',
    cta: 'View Status', danger: false,
  },
  rejected: {
    Icon: ShieldX, iconColor: '#f87171', iconBg: 'rgba(248,113,113,.12)',
    title: 'Verification Rejected',
    sub: 'Your identity verification was rejected. Please resubmit with clearer documents.',
    cta: 'Resubmit Documents', danger: true,
  },
  resubmit: {
    Icon: AlertCircle, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,.12)',
    title: 'Resubmission Required',
    sub: 'Additional documentation is needed to complete your verification. Please resubmit.',
    cta: 'Resubmit Now', danger: false,
  },
} as const;

function KYCGate({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const updateUser   = useAuthStore(s => s.updateUser); // keep store in sync
  const [kycStatus,  setKycStatus]  = useState<KYCStatus | null>(null);
  const [checking,   setChecking]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const needsKyc      = KYC_REQUIRED_PATHS.some(p => pathname.startsWith(p));
  const requiredParam = searchParams.get('required') === '1';

  const fetchKyc = async (quiet = false) => {
    if (!quiet) setChecking(true);
    else setRefreshing(true);
    try {
      const res    = await api.get('/kyc/status');
      const data   = res.data.data ?? res.data;
      const status = (data?.status ?? 'not_started') as KYCStatus;
      setKycStatus(status);
      // Always write fresh value — this is what middleware reads on next nav
      document.cookie = `nexabank_kyc_status=${status};path=/;max-age=${7 * 86400};samesite=strict`;
      // Keep Zustand in sync so userboard banner and sidebar lock icons update instantly
      updateUser({ kycStatus: status });
    } catch {
      setKycStatus('not_started');
    } finally {
      setChecking(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (needsKyc || requiredParam) {
      fetchKyc(); // always hit the API on gated routes — never trust stale cookie
    } else {
      // Non-gated route (dashboard, settings, kyc page itself) — skip gate entirely
      setChecking(false);
      setKycStatus(null); // null = no gate needed
    }
  }, [pathname]);

  // Loading spinner
  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 14 }}>
        <Loader2 size={26} color="#f59e0b" className="nx-kspin" />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', fontFamily: 'inherit', margin: 0 }}>Checking verification status…</p>
        <style>{`@keyframes nx-kspin{to{transform:rotate(360deg)}}.nx-kspin{animation:nx-kspin 1s linear infinite}`}</style>
      </div>
    );
  }

  // Approved or non-gated route (kycStatus === null) — render children normally
  if (kycStatus === null || kycStatus === 'approved') return <>{children}</>;

  // Blocked — show gate inside the existing layout
  const cfg = KYC_CFG[kycStatus as keyof typeof KYC_CFG] ?? KYC_CFG.not_started;
  const { Icon } = cfg;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Required banner — shown when redirected by middleware */}
        {requiredParam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '11px 14px', marginBottom: 20 }}>
            <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', margin: 0 }}>
              Identity verification is required to access this feature.
            </p>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,.02)', border: `1px solid ${cfg.danger ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 24, padding: '36px 28px', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Icon size={30} color={cfg.iconColor} />
          </div>

          {/* NexaBank badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 100, padding: '4px 12px', marginBottom: 16 }}>
            <ShieldCheck size={11} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' }}>NexaBank KYC</span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-.3px' }}>{cfg.title}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: '0 0 24px', lineHeight: 1.7 }}>{cfg.sub}</p>

          {/* Steps for not_started */}
          {kycStatus === 'not_started' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24, textAlign: 'left' }}>
              {[
                'Submit a government-issued ID (front & back)',
                'Upload a clear selfie for liveness check',
                'Review takes 1–24 hours — then you\'re fully unlocked',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pending progress */}
          {kycStatus === 'pending' && (
            <div style={{ background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: '13px 14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'nx-kpulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Review in progress</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 2, animation: 'nx-kslide 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* CTA */}
          <button onClick={() => router.push('/dashboard/kyc')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: cfg.danger ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: cfg.danger ? '#fff' : '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: kycStatus === 'pending' ? 10 : 0 }}>
            {cfg.cta} <ArrowRight size={15} />
          </button>

          {/* Pending — refresh */}
          {kycStatus === 'pending' && (
            <button onClick={() => fetchKyc(true)} disabled={refreshing}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'none', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'nx-kspin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Checking…' : 'Refresh Status'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.18)', marginTop: 18, lineHeight: 1.6 }}>
          Required by financial regulations (KYC/AML) to protect your account.
        </p>
      </div>

      <style>{`
        @keyframes nx-kspin  { to { transform: rotate(360deg); } }
        @keyframes nx-kpulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        @keyframes nx-kslide { 0% { transform:translateX(-100%); } 100% { transform:translateX(250%); } }
      `}</style>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const storeUser = useAuthStore(s => s.user);
  const setUser   = useAuthStore(s => s.setUser);
  const clearUser = useAuthStore(s => s.clearUser);

  const [mounted,     setMounted]     = useState(false);
  const [sideOpen,    setSideOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState<any[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [liveUser,    setLiveUser]    = useState<any>(null);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const [profRes, txRes, kycRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/transactions?limit=8&page=1'),
          api.get('/kyc/status'),           // ← always fetch fresh KYC status
        ]);
        const prof = profRes.data?.data;

        // Fresh KYC status from API — overrides any stale persisted value
        const freshKycStatus = (kycRes.data?.data ?? kycRes.data)?.status ?? prof?.kycStatus;

        if (prof) {
          const profWithFreshKyc = { ...prof, kycStatus: freshKycStatus ?? prof.kycStatus };
          setLiveUser(profWithFreshKyc);
          setUser(profWithFreshKyc);         // update Zustand store with real status
          if (freshKycStatus) {
            // Update cookie so middleware is correct on next navigation
            document.cookie = `nexabank_kyc_status=${freshKycStatus};path=/;max-age=${7 * 86400};samesite=strict`;
          }
        }
        const txs: any[] = txRes.data?.data?.transactions ?? [];
        const list: any[] = [];
        if (freshKycStatus === 'not_started')
          list.push({ id: 'kyc',   sys: true, read: false, time: '', text: 'Complete KYC to unlock all features' });
        if (freshKycStatus === 'pending')
          list.push({ id: 'kyc-p', sys: true, read: false, time: '', text: 'KYC under review — usually 1–3 business days' });
        if (freshKycStatus === 'rejected')
          list.push({ id: 'kyc-r', sys: true, read: false, time: '', text: 'KYC rejected — please resubmit your documents' });
        txs.forEach((tx: any) => list.push({
          id: tx._id, dir: tx.direction,
          text: (tx.description || (tx.type ?? '').replace(/_/g, ' ')).toLowerCase(),
          amount: tx.amount, read: tx.status === 'completed',
          time: ago(tx.createdAt), sys: false,
        }));
        setNotifs(list);
        setUnread(list.filter(n => !n.read).length);
      } catch {}
    })();
  }, [mounted]);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    // Also clear KYC cookie on logout
    document.cookie = 'nexabank_kyc_status=;path=/;max-age=0';
    clearAuthCookies();
    clearUser();
    router.push('/login');
  };

  const user = liveUser ?? storeUser;

  if (!mounted) return <div className="min-h-screen bg-[#0a0f1a]" />;

  return (
    <div className="flex min-h-screen bg-[#0a0f1a] font-sans text-slate-200">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-[252px] flex-shrink-0 z-50
        bg-[#070c17] border-r border-white/[0.06]
        flex flex-col overflow-hidden
        transition-transform duration-300 ease-in-out
        ${sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-[18px] py-5 border-b border-white/[0.05] flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline" onClick={() => setSideOpen(false)}>
            <span className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-[15px] font-black text-[#050d1a] flex-shrink-0">N</span>
            <span className="text-[16px] font-extrabold text-white tracking-tight">NexaBank</span>
          </Link>
          <button onClick={() => setSideOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center bg-white/[0.06] border-none rounded-[7px] text-white/50 cursor-pointer hover:bg-white/10 hover:text-white transition-all">
            <X size={17} />
          </button>
        </div>

        {/* User card */}
        <div className="flex items-center gap-2.5 mx-3 my-3.5 p-3 bg-white/[0.04] border border-white/[0.07] rounded-xl flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-[13px] font-black text-[#050d1a] flex-shrink-0 overflow-hidden">
            {user?.profilePictureUrl
              ? <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover rounded-full" />
              : ini(user?.firstName, user?.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate leading-tight">{user?.firstName ?? ''} {user?.lastName ?? ''}</p>
            <p className="text-[11px] text-white/40 mt-px">@{user?.username ?? '—'}</p>
          </div>
          {/* KYC status badge in sidebar */}
          <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${
            user?.kycStatus === 'approved'
              ? 'bg-emerald-500/20 text-emerald-400'
              : user?.kycStatus === 'rejected'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
            title={`KYC: ${user?.kycStatus ?? 'not started'}`}>
            {user?.kycStatus === 'approved'
              ? <CheckCircle size={11} />
              : user?.kycStatus === 'rejected'
              ? <X size={11} />
              : <Clock size={11} />}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 flex flex-col gap-px overflow-y-auto scrollbar-hide">
          {NAV.map(({ href, Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            // Show lock indicator on gated items when KYC not approved
            const isGated = KYC_REQUIRED_PATHS.includes(href) && user?.kycStatus !== 'approved';
            return (
              <Link key={href} href={href} onClick={() => setSideOpen(false)}
                className={`
                  flex items-center gap-[11px] px-3 py-[9px] rounded-[9px]
                  text-[13.5px] font-medium no-underline relative cursor-pointer
                  transition-all duration-150
                  ${active
                    ? 'bg-amber-500/10 text-amber-400 font-bold'
                    : isGated
                    ? 'text-white/25 hover:bg-white/[0.03] hover:text-white/40'
                    : 'text-white/45 hover:bg-white/[0.05] hover:text-white/85'
                  }
                `}>
                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span className="flex-1">{label}</span>
                {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-amber-500 rounded-l" />}
                {isGated && !active && (
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,.2)' }}>🔒</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2.5 pb-[18px] pt-2.5 border-t border-white/[0.05] flex-shrink-0">
          <p className="flex items-center gap-1.5 text-[10.5px] text-white/[0.18] px-1 pb-2.5 leading-relaxed">
            <ShieldCheck size={11} /> FDIC Insured · Equal Housing Lender
          </p>
          <button onClick={logout} className="flex items-center gap-2.5 w-full px-3 py-[9px] rounded-[9px] bg-transparent border-none text-[13.5px] font-medium text-white/[0.32] cursor-pointer font-[inherit] transition-all duration-150 text-left hover:bg-red-500/[0.09] hover:text-red-300">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sideOpen && <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="sticky top-0 z-40 h-[60px] flex items-center justify-between gap-3 px-[22px] bg-[rgba(7,12,23,0.95)] backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button onClick={() => setSideOpen(true)} className="lg:hidden flex items-center justify-center w-[34px] h-[34px] bg-white/[0.05] border border-white/[0.08] rounded-[8px] text-white/50 cursor-pointer transition-all hover:bg-white/[0.09] hover:text-white flex-shrink-0">
              <Menu size={19} />
            </button>
            <label className="relative flex-1 max-w-[380px] cursor-text">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/[0.22] pointer-events-none" />
              <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[9px] py-2 pl-[34px] pr-3.5 text-[13px] text-white placeholder-white/20 outline-none font-[inherit] transition-colors focus:border-amber-500/40 focus:bg-white/[0.06]"
                placeholder="Search transactions, accounts..." />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* KYC alert chip in header — shows when not approved */}
            {user?.kycStatus && user.kycStatus !== 'approved' && (
              <Link href="/dashboard/kyc"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-[8px] text-[11px] font-bold text-amber-400 no-underline hover:bg-amber-500/15 transition-all"
                style={{ whiteSpace: 'nowrap' }}>
                <ShieldCheck size={12} />
                {user.kycStatus === 'pending'   ? 'KYC Pending'  :
                 user.kycStatus === 'rejected'  ? 'KYC Rejected' :
                 user.kycStatus === 'resubmit'  ? 'Resubmit KYC' :
                 'Verify Identity'}
              </Link>
            )}

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                className="relative w-9 h-9 flex items-center justify-center bg-white/[0.05] border border-white/[0.08] rounded-[9px] text-white/50 cursor-pointer transition-all hover:bg-white/[0.09] hover:text-white">
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-[3px] border-2 border-[#070c17]">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute top-[calc(100%+10px)] right-0 w-[316px] bg-[#111826] border border-white/10 rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] z-[200] overflow-hidden animate-dd-pop">
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
                    <span className="text-[14px] font-bold text-white">Notifications</span>
                    {unread > 0 && (
                      <button onClick={() => { setNotifs(p => p.map(n => ({ ...n, read: true }))); setUnread(0); }}
                        className="text-[11px] text-amber-400 font-semibold bg-transparent border-none cursor-pointer font-[inherit] hover:opacity-70">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                    {notifs.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-white/20 text-[13px]"><Bell size={22} /> You're all caught up!</div>
                    ) : notifs.slice(0, 8).map(n => (
                      <div key={n.id}
                        className={`flex items-start gap-2.5 px-4 py-[11px] border-b border-white/[0.04] cursor-pointer transition-colors hover:bg-white/[0.03] ${!n.read ? 'bg-amber-500/[0.04]' : ''}`}>
                        <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-px ${
                          n.sys ? 'bg-blue-500/15 text-blue-400' : n.dir === 'credit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {n.sys ? <Info size={13} /> : n.dir === 'credit' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12.5px] text-white/70 leading-snug block capitalize">
                            {n.text}
                            {n.amount && !n.sys && (
                              <strong className={`ml-1 ${n.dir === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {n.dir === 'credit' ? '+' : '-'}${Number(n.amount).toFixed(2)}
                              </strong>
                            )}
                          </span>
                          {n.time && <span className="text-[11px] text-white/30 mt-0.5 block">{n.time}</span>}
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/transactions" onClick={() => setNotifOpen(false)} className="block px-4 py-3 text-center text-[12px] font-semibold text-amber-400 border-t border-white/[0.07] hover:opacity-75 transition-opacity">
                    View all transactions →
                  </Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-[5px] pr-2.5 py-[5px] bg-white/[0.05] border border-white/[0.08] rounded-[9px] text-white/70 cursor-pointer font-[inherit] text-[13px] font-semibold transition-all hover:bg-white/[0.09] hover:text-white">
                <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-[10px] font-black text-[#050d1a] flex-shrink-0 overflow-hidden">
                  {user?.profilePictureUrl
                    ? <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    : ini(user?.firstName, user?.lastName)}
                </div>
                <span className="max-w-[90px] truncate hidden sm:block">{user?.firstName || 'Account'}</span>
                <ChevronDown size={13} />
              </button>

              {profileOpen && (
                <div className="absolute top-[calc(100%+10px)] right-0 w-[230px] bg-[#111826] border border-white/10 rounded-[14px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] z-[200] overflow-hidden animate-dd-pop">
                  <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-white/[0.07]">
                    <span className="text-[14px] font-bold text-white">{user?.firstName} {user?.lastName}</span>
                    <span className="text-[12px] text-white/38 mt-0.5">{user?.email}</span>
                  </div>
                  <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-white/60 no-underline transition-all hover:bg-white/[0.04] hover:text-white">
                    <Settings size={14} /> Profile & Settings
                  </Link>
                  <Link href="/dashboard/kyc" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-white/60 no-underline transition-all hover:bg-white/[0.04] hover:text-white">
                    <ShieldCheck size={14} />
                    KYC Verification
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      user?.kycStatus === 'approved'  ? 'bg-emerald-500/15 text-emerald-300' :
                      user?.kycStatus === 'pending'   ? 'bg-amber-500/15  text-amber-300'   :
                      user?.kycStatus === 'rejected'  ? 'bg-red-500/15    text-red-300'     :
                                                        'bg-white/[0.07]  text-white/35'
                    }`}>
                      {(user?.kycStatus ?? 'not started').replace(/_/g, ' ')}
                    </span>
                  </Link>
                  <div className="h-px bg-white/[0.07] my-1" />
                  <button onClick={logout} className="flex items-center gap-2.5 px-4 py-2.5 w-full text-[13.5px] text-white/60 bg-transparent border-none cursor-pointer font-[inherit] text-left transition-all hover:bg-red-500/[0.09] hover:text-red-300">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content — KYCGate wraps children here */}
        <main className="flex-1 p-6 lg:p-[26px] overflow-y-auto">
          <KYCGate pathname={pathname}>
            {children}
          </KYCGate>
        </main>
      </div>
    </div>
  );
}