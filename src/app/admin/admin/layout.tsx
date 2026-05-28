'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, Receipt, Building2,
  ShieldCheck, FileText, TrendingUp, Bitcoin, Key,
  FileCode, LogOut, Menu, X, ChevronDown, Shield,
  AlertTriangle, Settings,
} from 'lucide-react';
import { useAdminStore } from './store/admin.store';
import { useAdminAuth } from './hooks/useAdminAuth';

const NAV = [
  { href: '/admin/admin/dashboard',    Icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/admin/admin/users',        Icon: Users,           label: 'Users'        },
  { href: '/admin/admin/accounts',     Icon: Wallet,          label: 'Accounts'     },
  { href: '/admin/admin/transactions', Icon: Receipt,         label: 'Transactions' },
  { href: '/admin/admin/loans',        Icon: Building2,       label: 'Loans'        },
  { href: '/admin/admin/kyc',          Icon: ShieldCheck,     label: 'KYC Review'   },
  { href: '/admin/admin/cheques',      Icon: FileText,        label: 'Cheques'      },
  { href: '/admin/admin/investments',  Icon: TrendingUp,      label: 'Investments'  },
  { href: '/admin/admin/crypto',       Icon: Bitcoin,         label: 'Crypto'       },
  { href: '/admin/admin/otp-config',   Icon: Key,             label: 'OTP Config'   },
  { href: '/admin/admin/logs',         Icon: FileCode,        label: 'Settings'   },
];

function ini(a?: string, b?: string) {
  return `${a?.[0] ?? ''}${b?.[0] ?? ''}`.toUpperCase() || 'A';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const admin        = useAdminStore(s => s.admin);
  const { logout }   = useAdminAuth();

  const [mounted,     setMounted]     = useState(false);
  const [sideOpen,    setSideOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Don't render layout on login page
  if (pathname === '/admin/login') return <>{children}</>;

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#070c17' }} />;

  const currentPage = NAV.find(n =>
    n.href === pathname || (pathname.startsWith(n.href) && n.href !== '/admin/admin/dashboard')
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1a', fontFamily: 'Inter, system-ui, sans-serif', color: '#e2e8f0' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 242,
        background: '#070c17', borderRight: '1px solid rgba(255,255,255,.06)',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transition: 'transform .3s ease',
      }} className={`adm-aside${sideOpen ? ' adm-aside-open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#050d1a', flexShrink: 0 }}>N</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-.3px', lineHeight: 1.2 }}>NexaBank</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: '.1em', textTransform: 'uppercase' }}>Admin Panel</div>
              </div>
            </Link>
            <button onClick={() => setSideOpen(false)} className="adm-close-btn"
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'none', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          {/* Admin role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 9 }}>
            <Shield size={12} color="#f87171" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>ADMIN ACCESS</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'capitalize' }}>
              {admin?.role?.replace(/_/g, ' ') ?? 'admin'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ href, Icon, label }) => {
            const active = pathname === href ||
              (pathname.startsWith(href) && href !== '/admin/dashboard');
            return (
              <Link key={href} href={href} onClick={() => setSideOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 9,
                  textDecoration: 'none', transition: 'all .15s', position: 'relative',
                  background: active ? 'rgba(245,158,11,.1)' : 'transparent',
                  color: active ? '#f59e0b' : 'rgba(255,255,255,.42)',
                  fontWeight: active ? 700 : 500, fontSize: 13.5,
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <Icon size={16} strokeWidth={active ? 2.3 : 1.9} style={{ flexShrink: 0 }} />
                {label}
                {active && <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#f59e0b', borderRadius: '3px 0 0 3px' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '10px 8px 16px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
          {/* Admin profile mini card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: 'rgba(255,255,255,.03)', borderRadius: 10, marginBottom: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#050d1a', flexShrink: 0, overflow: 'hidden' }}>
              {admin?.profilePictureUrl
                ? <img src={admin.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : ini(admin?.firstName, admin?.lastName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin?.firstName} {admin?.lastName}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.32)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {admin?.email}
              </div>
            </div>
          </div>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.32)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', textAlign: 'left' }}
            onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,.09)'); (e.currentTarget.style.color = '#f87171'); }}
            onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = 'rgba(255,255,255,.32)'); }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }} className="adm-main">

        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 40, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 22px', background: 'rgba(7,12,23,.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSideOpen(true)} className="adm-menu-btn"
              style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>
              <Menu size={17} />
            </button>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-.2px' }}>
                {currentPage?.label ?? 'Admin Panel'}
              </h1>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.28)', margin: 0 }}>NexaBank Administration</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.18)', borderRadius: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'adm-pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399' }}>LIVE</span>
            </div>

            {/* Limited badge for non-super_admin */}
            {admin?.role === 'admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.18)', borderRadius: 8 }}>
                <AlertTriangle size={11} color="#f59e0b" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>LIMITED</span>
              </div>
            )}

            {/* Profile dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button onClick={() => setProfileOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px 5px 5px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#050d1a', flexShrink: 0, overflow: 'hidden' }}>
                  {admin?.profilePictureUrl
                    ? <img src={admin.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : ini(admin?.firstName, admin?.lastName)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.65)' }} className="adm-name-hide">
                  {admin?.firstName ?? 'Admin'}
                </span>
                <ChevronDown size={12} color="rgba(255,255,255,.35)" />
              </button>

              {profileOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210, background: '#111826', border: '1px solid rgba(255,255,255,.09)', borderRadius: 13, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.55)', zIndex: 200 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{admin?.firstName} {admin?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.32)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.email}</div>
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6 }}>
                      <Shield size={10} color="#f87171" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'capitalize' }}>{admin?.role?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <button onClick={logout}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', width: '100%', fontSize: 13, color: 'rgba(255,255,255,.55)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,.08)'); (e.currentTarget.style.color = '#f87171'); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = 'rgba(255,255,255,.55)'); }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '22px', overflowY: 'auto' }} className="adm-content">
          {children}
        </main>
      </div>

      <style>{`
        .adm-main   { margin-left: 242px; }
        .adm-aside  { transform: translateX(0); }

        @media(max-width:1023px) {
          .adm-main         { margin-left: 0 !important; }
          .adm-aside        { transform: translateX(-100%); }
          .adm-aside.adm-aside-open { transform: translateX(0); }
          .adm-menu-btn     { display: flex !important; }
          .adm-close-btn    { display: flex !important; }
          .adm-name-hide    { display: none; }
          .adm-content      { padding: 14px !important; }
        }

        nav::-webkit-scrollbar       { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }

        @keyframes adm-pulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        @keyframes adm-spin  { to { transform:rotate(360deg); } }
        .adm-spin { animation: adm-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}