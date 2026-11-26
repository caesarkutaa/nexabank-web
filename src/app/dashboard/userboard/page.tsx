'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownLeft, Plus, Send, CreditCard,
  TrendingUp, ShieldCheck, AlertTriangle, RefreshCw,
  Eye, EyeOff, Bitcoin, FileText, Building2, BarChart3,
  ArrowRight, Wallet, Clock, CheckCircle, Receipt,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

/* Endpoint that returns the CURRENT user (UsersService.getProfile).
   Change this if your users controller uses a different route. */
const PROFILE_ENDPOINT = '/users/profile';

/* ── Currency formatter — uses account's own currency ── */
function fmtC(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    return `${currency || 'USD'} ${(amount ?? 0).toFixed(2)}`;
  }
}

const STATUS_COLORS: Record<string, string> = {
  completed:  '#10b981',
  pending:    '#f59e0b',
  processing: '#3b82f6',
  failed:     '#ef4444',
};

const QUICK_ACTIONS = [
  { icon: Send,       label: 'Send Money',  href: '/dashboard/transfers',    color: '#f59e0b' },
  { icon: Plus,       label: 'Add Money',   href: '/dashboard/accounts',     color: '#10b981' },
  { icon: CreditCard, label: 'Cards',       href: '/dashboard/cards',        color: '#3b82f6' },
  { icon: TrendingUp, label: 'Invest',      href: '/dashboard/investments',  color: '#8b5cf6' },
  { icon: Building2,  label: 'Loans',       href: '/dashboard/loans',        color: '#ec4899' },
  { icon: BarChart3,  label: 'Pay Bills',   href: '/dashboard/bills',        color: '#06b6d4' },
  { icon: FileText,   label: 'Cheques',     href: '/dashboard/cheques',      color: '#84cc16' },
];

// ── Status-aware KYC banner config ──────────────────────────────────────────
type KYCStatus = 'not_started' | 'pending' | 'rejected' | 'resubmit';

const KYC_BANNER: Record<KYCStatus, {
  bg: string; border: string; iconColor: string;
  Icon: React.ElementType; title: string; sub: string; cta: string;
}> = {
  not_started: {
    bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.25)',
    iconColor: '#f59e0b', Icon: AlertTriangle,
    title: 'Identity verification required.',
    sub:   'Complete KYC to unlock transfers, cards, investments and all banking features.',
    cta:   'Start Verification →',
  },
  pending: {
    bg: 'rgba(59,130,246,.08)', border: 'rgba(59,130,246,.25)',
    iconColor: '#60a5fa', Icon: Clock,
    title: 'Verification under review.',
    sub:   'Our team is reviewing your documents — this usually takes 1-3 business days.',
    cta:   'View Status →',
  },
  rejected: {
    bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)',
    iconColor: '#f87171', Icon: ShieldCheck,
    title: 'Verification rejected.',
    sub:   'Your submission was rejected. Please resubmit with clearer documents.',
    cta:   'Resubmit Now →',
  },
  resubmit: {
    bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.25)',
    iconColor: '#f59e0b', Icon: AlertTriangle,
    title: 'Additional documents required.',
    sub:   'Please resubmit your KYC documents to continue.',
    cta:   'Resubmit →',
  },
};

export default function DashboardPage() {
  const user                        = useAuthStore(s => s.user);
  const setUser                     = useAuthStore(s => s.setUser);
  const [dashboard,    setDashboard]    = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [hideBalance,  setHideBalance]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  /* Primary currency from primary account or first account */
  const primaryCurrency: string =
    dashboard?.accounts?.find((a: any) => a.isPrimary)?.currency
    ?? dashboard?.accounts?.[0]?.currency
    ?? (user as any)?.preferredCurrency
    ?? 'USD';

  const fmt = (n: number) => fmtC(n, primaryCurrency);

  /* Re-fetch the current user so server-side changes (KYC approval, credit
     score, etc.) replace the stale copy saved in localStorage. Runs on its own
     so a failure in the dashboard/transactions calls can't skip it. */
  const refreshUser = async () => {
    try {
      const res     = await api.get(PROFILE_ENDPOINT);
      const profile = res.data?.data;
      if (!profile) return;
      const current = useAuthStore.getState().user as any;
      setUser({ ...(current ?? {}), ...profile, id: current?.id ?? profile._id });
    } catch (err) {
      console.warn('Could not refresh user profile', err);
    }
  };

  const load = async () => {
    refreshUser();
    try {
      const [dashRes, txRes] = await Promise.all([
        api.get('/accounts/dashboard'),
        api.get('/transactions?limit=5'),
      ]);
      setDashboard(dashRes.data.data);
      setTransactions(txRes.data.data.transactions ?? []);
    } catch {}
    setLoading(false);
  };

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const totalBalance    = dashboard?.totalBalance           ?? 0;
  const incomePercent   = dashboard?.analytics?.incomePercent  ?? 0;
  const debitPercent    = dashboard?.analytics?.debitPercent   ?? 0;
  const monthlyIncome   = dashboard?.analytics?.monthlyIncome  ?? 0;
  const monthlyExpenses = dashboard?.analytics?.monthlyExpenses ?? 0;
  const accounts        = dashboard?.accounts ?? [];
  const kycStatus       = user?.kycStatus ?? 'not_started';
  const kycApproved     = kycStatus === 'approved';

  return (
    <div className="db">

      {/* Greeting */}
      <div className="db-top">
        <div className="db-greeting">
          <div>
            <h1 className="db-title">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
              <span className="db-name"> {user?.firstName || user?.username} 👋</span>
            </h1>
            <p className="db-subtitle">Here's your financial overview for today.</p>
          </div>
          <button className="db-refresh" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'db-spin' : ''} />
          </button>
        </div>

        {/* ── Status-aware KYC banner ─────────────────────────────────── */}
        {!kycApproved && (() => {
          const cfg = KYC_BANNER[kycStatus as KYCStatus] ?? KYC_BANNER.not_started;
          const { Icon } = cfg;
          return (
            <div className="db-kyc-banner" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <Icon size={16} style={{ color: cfg.iconColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#fff' }}>{cfg.title}</strong>{' '}
                <span>{cfg.sub}</span>
              </div>
              <Link href="/dashboard/kyc" className="db-kyc-btn">{cfg.cta}</Link>
            </div>
          );
        })()}
      </div>

      {/* Cards grid */}
      <div className="db-cards-grid">
        {/* Balance card */}
        <div className="db-balance-card">
          <div className="db-balance-bg" />
          <div className="db-balance-bg2" />
          <div className="db-balance-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="db-balance-label">Total Balance</span>
              {!loading && (
                <span className="db-currency-chip">{primaryCurrency}</span>
              )}
            </div>
            <button className="db-eye" onClick={() => setHideBalance(h => !h)}>
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="db-balance-amount">
            {loading
              ? <div className="db-skeleton db-skeleton-amount" />
              : hideBalance ? '••••••••' : fmt(totalBalance)
            }
          </div>
          <div className="db-balance-sub">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
          <div className="db-balance-stats">
            <div className="db-stat-item">
              <div className="db-stat-icon-wrap db-stat-income-wrap">
                <ArrowDownLeft size={14} className="db-stat-income-icon" />
              </div>
              <div>
                <div className="db-stat-val">{loading ? '—' : fmt(monthlyIncome)}</div>
                <div className="db-stat-label">Income this month</div>
              </div>
            </div>
            <div className="db-stat-divider" />
            <div className="db-stat-item">
              <div className="db-stat-icon-wrap db-stat-expense-wrap">
                <ArrowUpRight size={14} className="db-stat-expense-icon" />
              </div>
              <div>
                <div className="db-stat-val">{loading ? '—' : fmt(monthlyExpenses)}</div>
                <div className="db-stat-label">Expenses this month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="db-donut-card">
          <div className="db-card-title">Income vs Expenses</div>
          <div className="db-donut-wrap">
            <svg viewBox="0 0 100 100" className="db-donut-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12"
                strokeDasharray={`${incomePercent * 2.388} 238.8`} strokeLinecap="round" transform="rotate(-90 50 50)" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="12"
                strokeDasharray={`${debitPercent * 2.388} 238.8`} strokeLinecap="round"
                transform={`rotate(${-90 + incomePercent * 3.6} 50 50)`} />
              <text x="50" y="46" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">{incomePercent}%</text>
              <text x="50" y="58" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">income</text>
            </svg>
          </div>
          <div className="db-donut-legend">
            <div className="db-legend-item"><div className="db-legend-dot" style={{ background: '#10b981' }} /><span>Income {incomePercent}%</span></div>
            <div className="db-legend-item"><div className="db-legend-dot" style={{ background: '#ef4444' }} /><span>Expenses {debitPercent}%</span></div>
          </div>
        </div>

        {/* Credit */}
        <div className="db-credit-card">
          <div className="db-card-title">Credit Score</div>
          <div className="db-credit-score">{user?.creditScore ?? 0}</div>
          <div className="db-credit-rating">{user?.creditRating?.replace(/_/g, ' ').toUpperCase() ?? 'N/A'}</div>
          <div className="db-credit-bar-wrap">
            <div className="db-credit-bar">
              <div className="db-credit-fill" style={{
                width: `${((user?.creditScore ?? 0) - 300) / 550 * 100}%`,
                background: (user?.creditScore ?? 0) >= 750 ? '#10b981' : (user?.creditScore ?? 0) >= 670 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
            <div className="db-credit-range"><span>300</span><span>850</span></div>
          </div>
          {/* KYC pill mirrors the banner status */}
          <div className={`db-kyc-status ${
            kycStatus === 'approved'  ? 'db-kyc-ok'      :
            kycStatus === 'pending'   ? 'db-kyc-pending'  :
            kycStatus === 'rejected'  ? 'db-kyc-rejected' :
                                        'db-kyc-pending'
          }`}>
            {kycStatus === 'approved'
              ? <CheckCircle size={13} />
              : kycStatus === 'rejected'
              ? <ShieldCheck size={13} />
              : <Clock size={13} />}
            KYC {kycStatus.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="db-section">
        <div className="db-section-header">
          <h2 className="db-section-title">Quick Actions</h2>
        </div>
        <div className="db-actions-grid">
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} className="db-action">
              <div className="db-action-icon" style={{ background: `${a.color}18`, color: a.color }}>
                <a.icon size={20} />
              </div>
              <span className="db-action-label">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="db-bottom-grid">
        {/* Accounts */}
        <div className="db-accounts-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Your Accounts</h2>
            <Link href="/dashboard/accounts" className="db-see-all">See all <ArrowRight size={13} /></Link>
          </div>
          <div className="db-accounts-list">
            {loading
              ? [1, 2].map(i => <div key={i} className="db-skeleton" style={{ height: 72, borderRadius: 12 }} />)
              : accounts.length === 0
              ? (
                <div className="db-empty">
                  <Wallet size={24} />
                  <p>No accounts yet</p>
                  <Link href="/dashboard/accounts" className="db-empty-btn">Open Account</Link>
                </div>
              )
              : accounts.map((acc: any) => {
                const accCur = acc.currency || 'USD';
                return (
                  <div key={acc._id} className="db-account-item">
                    <div className="db-account-icon"><Wallet size={18} /></div>
                    <div className="db-account-info">
                      <div className="db-account-name">
                        {acc.nickname || `${(acc.accountType || '').charAt(0).toUpperCase() + (acc.accountType || '').slice(1)} Account`}
                      </div>
                      <div className="db-account-number">
                        ••••{acc.accountNumber?.slice(-4)}
                        <span className="db-account-cur-chip">{accCur}</span>
                      </div>
                    </div>
                    <div className="db-account-right">
                      <div className="db-account-balance">{fmtC(acc.balance, accCur)}</div>
                      <div className={`db-account-status ${acc.status === 'active' ? 'db-status-active' : 'db-status-frozen'}`}>
                        {acc.status}
                      </div>
                    </div>
                  </div>
                );
              })
            }
            <Link href="/dashboard/accounts" className="db-open-account">
              <Plus size={16} /> Open New Account
            </Link>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="db-transactions-section">
          <div className="db-section-header">
            <h2 className="db-section-title">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="db-see-all">See all <ArrowRight size={13} /></Link>
          </div>
          <div className="db-tx-list">
            {loading
              ? [1, 2, 3, 4].map(i => <div key={i} className="db-skeleton" style={{ height: 60, borderRadius: 10 }} />)
              : transactions.length === 0
              ? (
                <div className="db-empty">
                  <Receipt size={24} />
                  <p>No transactions yet</p>
                </div>
              )
              : [...transactions]
                .sort((a, b) => {
                  const dateA = new Date(a.processedAt || a.createdAt).getTime();
                  const dateB = new Date(b.processedAt || b.createdAt).getTime();

                  return dateB - dateA;
                })
                .map((tx: any) => {
                  const txCur = tx.currency || primaryCurrency;
                return (
                  <div key={tx._id} className="db-tx-item">
                    <div className={`db-tx-icon ${tx.direction === 'credit' ? 'db-tx-credit-icon' : 'db-tx-debit-icon'}`}>
                      {tx.direction === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="db-tx-info">
                      <div className="db-tx-desc">{tx.description || tx.type?.replace(/_/g, ' ')}</div>
                      <div className="db-tx-meta">
                        <span className="db-tx-date">
                         {new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric' }).format(new Date(tx.processedAt || tx.createdAt))}
                        </span>
                        <span className="db-tx-dot" />
                        <span className="db-tx-status" style={{ color: STATUS_COLORS[tx.status] ?? '#9ca3af' }}>{tx.status}</span>
                        <span className="db-tx-cur-chip">{txCur}</span>
                      </div>
                    </div>
                    <div className={`db-tx-amount ${tx.direction === 'credit' ? 'db-tx-credit' : 'db-tx-debit'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{fmtC(tx.amount, txCur)}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>

      <style>{`
        *{box-sizing:border-box}

        .db{
          display:flex;flex-direction:column;gap:clamp(18px,2.5vw,28px);
          font-family:'Inter',system-ui,sans-serif;
          max-width:1680px;margin:0 auto;width:100%;
        }

        .db-top{display:flex;flex-direction:column;gap:12px}
        .db-greeting{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .db-title{font-size:clamp(19px,2.6vw,30px);font-weight:800;color:white;letter-spacing:-0.5px;margin-bottom:4px;line-height:1.25}
        .db-name{color:#f59e0b}
        .db-subtitle{font-size:clamp(12.5px,1.4vw,14px);color:rgba(255,255,255,0.45)}
        .db-refresh{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);cursor:pointer;transition:all .15s;flex-shrink:0}
        .db-refresh:hover{background:rgba(255,255,255,.09);color:white;border-color:rgba(255,255,255,.18)}
        .db-refresh:active{transform:scale(.93)}

        /* KYC banner */
        .db-kyc-banner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-width:1px;border-style:solid;border-radius:14px;padding:13px 16px;font-size:13px;color:rgba(255,255,255,.65);backdrop-filter:blur(6px)}
        .db-kyc-btn{text-decoration:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;font-size:12px;font-weight:700;padding:7px 15px;border-radius:8px;white-space:nowrap;flex-shrink:0;margin-left:auto;transition:filter .15s, transform .15s}
        .db-kyc-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}

        .db-currency-chip{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:#f59e0b;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em}
        .db-account-cur-chip{margin-left:7px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.18);color:#f59e0b;font-size:9px;font-weight:700;padding:1px 6px;border-radius:100px;vertical-align:middle}
        .db-tx-cur-chip{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4);font-size:9px;font-weight:700;padding:1px 5px;border-radius:100px}

        /* ── Cards grid: fluid from phone to ultra-wide ── */
        .db-cards-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:clamp(12px,1.6vw,18px)}
        @media(max-width:1100px){.db-cards-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:640px){.db-cards-grid{grid-template-columns:1fr}}
        @media(min-width:1681px){.db-cards-grid{grid-template-columns:2fr 1fr 1fr;max-width:1680px}}

        .db-balance-card{
          background:linear-gradient(135deg,#0a2342,#0d2d52);
          border:1px solid rgba(255,255,255,.1);border-radius:20px;
          padding:clamp(20px,2.6vw,30px);position:relative;overflow:hidden;
          box-shadow:0 1px 0 rgba(255,255,255,.06) inset, 0 20px 50px -25px rgba(0,0,0,.6);
        }
        .db-balance-bg{position:absolute;top:-60px;right:-60px;width:220px;height:220px;background:radial-gradient(circle,rgba(245,158,11,.14),transparent 70%);border-radius:50%;pointer-events:none}
        .db-balance-bg2{position:absolute;bottom:-80px;left:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(59,130,246,.08),transparent 70%);border-radius:50%;pointer-events:none}
        .db-balance-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;position:relative;z-index:1}
        .db-balance-label{font-size:12.5px;color:rgba(255,255,255,.5);font-weight:500;letter-spacing:.05em;text-transform:uppercase}
        .db-eye{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:6px;margin:-6px;border-radius:8px;transition:color .15s,background .15s}
        .db-eye:hover{color:white;background:rgba(255,255,255,.06)}
        .db-balance-amount{font-size:clamp(28px,4.2vw,44px);font-weight:900;color:white;letter-spacing:-1px;margin-bottom:6px;word-break:break-all;position:relative;z-index:1}
        .db-balance-sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:clamp(18px,3vw,26px);position:relative;z-index:1}
        .db-balance-stats{display:flex;gap:0;position:relative;z-index:1;flex-wrap:wrap}
        .db-stat-item{display:flex;align-items:center;gap:10px;flex:1;min-width:140px}
        .db-stat-icon-wrap{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .db-stat-income-wrap{background:rgba(16,185,129,.12)}
        .db-stat-expense-wrap{background:rgba(239,68,68,.1)}
        .db-stat-income-icon{color:#10b981}
        .db-stat-expense-icon{color:#ef4444}
        .db-stat-val{font-size:13.5px;font-weight:700;color:white;word-break:break-all}
        .db-stat-label{font-size:11px;color:rgba(255,255,255,.4);margin-top:1px}
        .db-stat-divider{width:1px;background:rgba(255,255,255,.1);margin:0 16px}
        @media(max-width:380px){.db-stat-divider{display:none}.db-balance-stats{gap:14px}}

        .db-donut-card,.db-credit-card{
          background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);
          border-radius:20px;padding:clamp(16px,2vw,20px);
          display:flex;flex-direction:column;
        }
        .db-card-title{font-size:11.5px;color:rgba(255,255,255,.45);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px}
        .db-donut-wrap{display:flex;justify-content:center;margin-bottom:12px;flex:1;align-items:center}
        .db-donut-svg{width:clamp(80px,9vw,100px);height:clamp(80px,9vw,100px)}
        .db-donut-legend{display:flex;flex-direction:column;gap:6px}
        .db-legend-item{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(255,255,255,.55)}
        .db-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

        .db-credit-score{font-size:clamp(32px,4vw,40px);font-weight:900;color:white;letter-spacing:-2px;line-height:1}
        .db-credit-rating{font-size:11.5px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:4px 0 14px}
        .db-credit-bar-wrap{margin-bottom:12px}
        .db-credit-bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin-bottom:4px}
        .db-credit-fill{height:100%;border-radius:3px;transition:width 1s ease}
        .db-credit-range{display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.3)}
        .db-kyc-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:100px;text-transform:capitalize;align-self:flex-start}
        .db-kyc-ok      {background:rgba(16,185,129,.12);color:#6ee7b7}
        .db-kyc-pending {background:rgba(245,158,11,.12);color:#fcd34d}
        .db-kyc-rejected{background:rgba(239,68,68,.12); color:#fca5a5}

        /* At medium width: donut + credit go side by side under the balance card */
        @media(max-width:1100px) and (min-width:641px){
          .db-donut-card,.db-credit-card{min-height:230px}
        }
        /* On the smallest screens keep both cards, stacked, full width */
        @media(max-width:640px){
          .db-donut-card,.db-credit-card{width:100%}
        }

        .db-section{}
        .db-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap}
        .db-section-title{font-size:clamp(14.5px,1.8vw,16px);font-weight:700;color:white}
        .db-see-all{display:flex;align-items:center;gap:4px;font-size:13px;color:#f59e0b;text-decoration:none;font-weight:600;transition:opacity .15s,gap .15s}
        .db-see-all:hover{opacity:.75;gap:6px}

        /* ── Quick actions: scale columns smoothly, never below 2 ── */
        .db-actions-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:clamp(8px,1.2vw,10px)}
        @media(max-width:1280px){.db-actions-grid{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:560px){.db-actions-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:360px){.db-actions-grid{grid-template-columns:repeat(2,1fr)}}

        .db-action{display:flex;flex-direction:column;align-items:center;gap:8px;padding:clamp(12px,2vw,16px) 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;text-decoration:none;transition:all .15s}
        .db-action:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);transform:translateY(-2px);box-shadow:0 10px 24px -16px rgba(0,0,0,.7)}
        .db-action:active{transform:translateY(0)}
        .db-action-icon{width:clamp(36px,4.4vw,42px);height:clamp(36px,4.4vw,42px);border-radius:12px;display:flex;align-items:center;justify-content:center;transition:transform .15s}
        .db-action:hover .db-action-icon{transform:scale(1.06)}
        .db-action-label{font-size:11px;color:rgba(255,255,255,.55);font-weight:600;text-align:center;white-space:nowrap}

        /* ── Bottom grid ── */
        .db-bottom-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(12px,1.6vw,18px)}
        @media(max-width:1000px){.db-bottom-grid{grid-template-columns:1fr}}
        @media(min-width:1681px){.db-bottom-grid{grid-template-columns:1fr 1.4fr}}

        .db-accounts-section,.db-transactions-section{
          background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);
          border-radius:20px;padding:clamp(16px,2.2vw,20px);
        }
        .db-accounts-list{display:flex;flex-direction:column;gap:10px}
        .db-account-item{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:all .15s}
        .db-account-item:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}
        .db-account-icon{width:40px;height:40px;background:rgba(245,158,11,.12);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#f59e0b;flex-shrink:0}
        .db-account-info{flex:1;min-width:0}
        .db-account-name{font-size:13px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .db-account-number{font-size:12px;color:rgba(255,255,255,.35);font-family:monospace}
        .db-account-right{text-align:right;flex-shrink:0}
        .db-account-balance{font-size:14px;font-weight:700;color:white;font-family:monospace;word-break:break-all}
        .db-account-status{font-size:11px;font-weight:600;text-transform:capitalize;margin-top:2px}
        .db-status-active{color:#10b981}
        .db-status-frozen{color:#3b82f6}
        .db-open-account{display:flex;align-items:center;justify-content:center;gap:7px;padding:12px;border-radius:10px;border:1px dashed rgba(255,255,255,.12);font-size:13px;font-weight:600;color:rgba(255,255,255,.35);text-decoration:none;transition:all .15s}
        .db-open-account:hover{border-color:rgba(245,158,11,.35);color:#f59e0b;background:rgba(245,158,11,.05)}

        .db-tx-list{display:flex;flex-direction:column;gap:4px}
        .db-tx-item{display:flex;align-items:center;gap:12px;padding:12px 10px;border-radius:10px;transition:background .15s;cursor:pointer}
        .db-tx-item:hover{background:rgba(255,255,255,.04)}
        .db-tx-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .db-tx-credit-icon{background:rgba(16,185,129,.12);color:#10b981}
        .db-tx-debit-icon{background:rgba(239,68,68,.1);color:#ef4444}
        .db-tx-info{flex:1;min-width:0}
        .db-tx-desc{font-size:13px;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize}
        .db-tx-meta{display:flex;align-items:center;gap:5px;margin-top:2px;flex-wrap:wrap}
        .db-tx-date{font-size:11px;color:rgba(255,255,255,.35)}
        .db-tx-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0}
        .db-tx-status{font-size:11px;font-weight:600;text-transform:capitalize}
        .db-tx-amount{font-size:13px;font-weight:700;white-space:nowrap;flex-shrink:0;font-family:monospace}
        .db-tx-credit{color:#10b981}
        .db-tx-debit{color:#ef4444}

        .db-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:32px;color:rgba(255,255,255,.25);font-size:13px;text-align:center}
        .db-empty-btn{text-decoration:none;background:rgba(245,158,11,.12);color:#f59e0b;font-size:13px;font-weight:700;padding:8px 18px;border-radius:8px;transition:background .15s}
        .db-empty-btn:hover{background:rgba(245,158,11,.2)}

        .db-skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 100%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
        .db-skeleton-amount{height:clamp(36px,5vw,48px);width:60%}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes db-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.db-spin{animation:db-spin 1s linear infinite}

        @media(prefers-reduced-motion:reduce){
          .db-action,.db-account-item,.db-tx-item,.db-eye,.db-refresh,.db-kyc-btn,.db-see-all,.db-open-account,.db-empty-btn{transition:none}
          .db-skeleton{animation:none}
        }
      `}</style>
    </div>
  );
}