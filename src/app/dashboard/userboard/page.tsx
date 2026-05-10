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
  { icon: Bitcoin,    label: 'Crypto',      href: '/dashboard/crypto',       color: '#f97316' },
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

  const load = async () => {
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
          <div className="db-balance-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="db-balance-label">Total Balance</span>
              {!loading && (
                <span style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em' }}>
                  {primaryCurrency}
                </span>
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
              <ArrowDownLeft size={14} className="db-stat-income-icon" />
              <div>
                <div className="db-stat-val">{loading ? '—' : fmt(monthlyIncome)}</div>
                <div className="db-stat-label">Income this month</div>
              </div>
            </div>
            <div className="db-stat-divider" />
            <div className="db-stat-item">
              <ArrowUpRight size={14} className="db-stat-expense-icon" />
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
                        <span style={{ marginLeft: 7, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.18)', color: '#f59e0b', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100, verticalAlign: 'middle' }}>
                          {accCur}
                        </span>
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
                        <span style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.4)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 100 }}>{txCur}</span>
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
        .db{display:flex;flex-direction:column;gap:24px;font-family:'Inter',system-ui,sans-serif}
        .db-top{display:flex;flex-direction:column;gap:12px}
        .db-greeting{display:flex;align-items:flex-start;justify-content:space-between}
        .db-title{font-size:clamp(20px,3vw,28px);font-weight:800;color:white;letter-spacing:-0.5px;margin-bottom:4px}
        .db-name{color:#f59e0b}
        .db-subtitle{font-size:14px;color:rgba(255,255,255,0.45)}
        .db-refresh{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);cursor:pointer;transition:all .15s;flex-shrink:0}
        .db-refresh:hover{background:rgba(255,255,255,.09);color:white}

        /* KYC banner — bg and borderColor set inline per status */
        .db-kyc-banner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-width:1px;border-style:solid;border-radius:12px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,.65)}
        .db-kyc-btn{text-decoration:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;font-size:12px;font-weight:700;padding:6px 14px;border-radius:7px;white-space:nowrap;flex-shrink:0;margin-left:auto}

        .db-cards-grid{display:grid;grid-template-columns:1fr 200px 200px;gap:16px}
        @media(max-width:1100px){.db-cards-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:700px){.db-cards-grid{grid-template-columns:1fr}}

        .db-balance-card{background:linear-gradient(135deg,#0a2342,#0d2d52);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;position:relative;overflow:hidden}
        .db-balance-bg{position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(245,158,11,.12),transparent 70%);border-radius:50%;pointer-events:none}
        .db-balance-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .db-balance-label{font-size:13px;color:rgba(255,255,255,.5);font-weight:500;letter-spacing:.05em;text-transform:uppercase}
        .db-eye{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;padding:0;transition:color .15s}
        .db-eye:hover{color:white}
        .db-balance-amount{font-size:clamp(26px,4vw,40px);font-weight:900;color:white;letter-spacing:-1px;margin-bottom:6px;word-break:break-all}
        .db-balance-sub{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px}
        .db-balance-stats{display:flex;gap:0}
        .db-stat-item{display:flex;align-items:center;gap:10px;flex:1}
        .db-stat-income-icon{color:#10b981}
        .db-stat-expense-icon{color:#ef4444}
        .db-stat-val{font-size:14px;font-weight:700;color:white;word-break:break-all}
        .db-stat-label{font-size:11px;color:rgba(255,255,255,.4);margin-top:1px}
        .db-stat-divider{width:1px;background:rgba(255,255,255,.1);margin:0 16px}

        .db-donut-card,.db-credit-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px}
        @media(max-width:1100px){.db-donut-card{display:none}}
        @media(max-width:700px){.db-credit-card{display:none}}
        .db-card-title{font-size:12px;color:rgba(255,255,255,.45);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px}
        .db-donut-wrap{display:flex;justify-content:center;margin-bottom:12px}
        .db-donut-svg{width:100px;height:100px}
        .db-donut-legend{display:flex;flex-direction:column;gap:6px}
        .db-legend-item{display:flex;align-items:center;gap:7px;font-size:12px;color:rgba(255,255,255,.55)}
        .db-legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .db-credit-score{font-size:40px;font-weight:900;color:white;letter-spacing:-2px;line-height:1}
        .db-credit-rating{font-size:12px;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:4px 0 14px}
        .db-credit-bar-wrap{margin-bottom:12px}
        .db-credit-bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin-bottom:4px}
        .db-credit-fill{height:100%;border-radius:3px;transition:width 1s ease}
        .db-credit-range{display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,.3)}
        .db-kyc-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:100px;text-transform:capitalize}
        .db-kyc-ok      {background:rgba(16,185,129,.12);color:#6ee7b7}
        .db-kyc-pending {background:rgba(245,158,11,.12);color:#fcd34d}
        .db-kyc-rejected{background:rgba(239,68,68,.12); color:#fca5a5}

        .db-section{}
        .db-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        .db-section-title{font-size:16px;font-weight:700;color:white}
        .db-see-all{display:flex;align-items:center;gap:4px;font-size:13px;color:#f59e0b;text-decoration:none;font-weight:600;transition:opacity .15s}
        .db-see-all:hover{opacity:.75}
        .db-actions-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
        @media(max-width:1100px){.db-actions-grid{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:480px){.db-actions-grid{gap:8px}}
        .db-action{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;text-decoration:none;transition:all .15s}
        .db-action:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);transform:translateY(-2px)}
        .db-action-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center}
        .db-action-label{font-size:11px;color:rgba(255,255,255,.55);font-weight:600;text-align:center;white-space:nowrap}
        @media(max-width:480px){.db-action{padding:12px 4px}.db-action-icon{width:36px;height:36px}}

        .db-bottom-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:16px}
        @media(max-width:1100px){.db-bottom-grid{grid-template-columns:1fr}}

        .db-accounts-section,.db-transactions-section{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:20px}
        .db-accounts-list{display:flex;flex-direction:column;gap:10px}
        .db-account-item{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);transition:all .15s}
        .db-account-item:hover{background:rgba(255,255,255,.06)}
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
        .db-open-account:hover{border-color:rgba(245,158,11,.3);color:#f59e0b;background:rgba(245,158,11,.04)}

        .db-tx-list{display:flex;flex-direction:column;gap:4px}
        .db-tx-item{display:flex;align-items:center;gap:12px;padding:12px 10px;border-radius:10px;transition:background .15s;cursor:pointer}
        .db-tx-item:hover{background:rgba(255,255,255,.03)}
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

        .db-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:32px;color:rgba(255,255,255,.25);font-size:13px}
        .db-empty-btn{text-decoration:none;background:rgba(245,158,11,.12);color:#f59e0b;font-size:13px;font-weight:700;padding:8px 18px;border-radius:8px}

        .db-skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 100%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
        .db-skeleton-amount{height:48px;width:60%}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes db-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.db-spin{animation:db-spin 1s linear infinite}
      `}</style>
    </div>
  );
}