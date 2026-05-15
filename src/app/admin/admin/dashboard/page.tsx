'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Wallet, Receipt, Building2, ShieldCheck,
  FileText, TrendingUp, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Loader2, AlertCircle, CheckCircle2,
  Clock, XCircle, Activity, BarChart3,
  ArrowRight, Bitcoin,
} from 'lucide-react';
import adminApi from '../lib/api';
import { formatDateTime } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  users:        { total: number; active: number; pending: number; suspended: number };
  accounts:     { total: number; frozen: number };
  transactions: { total: number; pending: number; completed: number; failed: number };
  loans:        { total: number; pending: number; active: number };
  kyc:          { pending: number; approved: number; rejected: number };
  cheques:      { pending: number };
  finance:      { totalDeposited: number; totalWithdrawn: number };
  recentTransactions: any[];
  recentUsers:        any[];
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${(n ?? 0).toFixed(2)}`;
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

const STATUS_COLORS: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  completed:  { bg: 'rgba(52,211,153,.12)',  color: '#34d399', Icon: CheckCircle2 },
  pending:    { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', Icon: Clock        },
  processing: { bg: 'rgba(96,165,250,.12)', color: '#60a5fa', Icon: Activity     },
  failed:     { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle      },
  cancelled:  { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle      },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, href, alert }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  href?: string; alert?: boolean;
}) {
  const card = (
    <div style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${alert ? 'rgba(239,68,68,.28)' : 'rgba(255,255,255,.08)'}`, borderRadius: 16, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all .2s', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={iconColor} />
        </div>
        {href && <ArrowRight size={13} color="rgba(255,255,255,.2)" />}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-.5px', fontFamily: 'monospace' }}>{value}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: alert ? '#fca5a5' : 'rgba(255,255,255,.28)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
  if (!href) return card;
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={e => (e.currentTarget.firstElementChild as HTMLElement)?.style && ((e.currentTarget.firstElementChild as HTMLElement).style.background = 'rgba(255,255,255,.055)')}
      onMouseLeave={e => (e.currentTarget.firstElementChild as HTMLElement)?.style && ((e.currentTarget.firstElementChild as HTMLElement).style.background = 'rgba(255,255,255,.03)')}>
      {card}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [data,       setData]       = useState<DashboardData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await adminApi.get('/admin/dashboard');
      setData(res.data.data ?? res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted, load]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: 'rgba(255,255,255,.35)', fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <Loader2 size={22} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading dashboard…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, padding: '16px 18px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <AlertCircle size={16} color="#f87171" />
        <span style={{ fontSize: 14, color: '#fca5a5' }}>{error}</span>
        <button onClick={() => load()} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,.15)', border: 'none', color: '#f87171', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const d = data;
  const netFlow = d.finance.totalDeposited - d.finance.totalWithdrawn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>Real-time overview of NexaBank operations</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* ── Action alerts ── */}
      {(d.kyc.pending > 0 || d.cheques.pending > 0 || d.loans.pending > 0) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {d.kyc.pending > 0 && (
            <Link href="/admin/kyc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.22)', borderRadius: 10, padding: '9px 14px', textDecoration: 'none' }}>
              <ShieldCheck size={14} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{d.kyc.pending} KYC pending</span>
              <ArrowRight size={13} color="#f59e0b" />
            </Link>
          )}
          {d.cheques.pending > 0 && (
            <Link href="/admin/cheques" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.22)', borderRadius: 10, padding: '9px 14px', textDecoration: 'none' }}>
              <FileText size={14} color="#60a5fa" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{d.cheques.pending} cheques awaiting review</span>
              <ArrowRight size={13} color="#60a5fa" />
            </Link>
          )}
          {d.loans.pending > 0 && (
            <Link href="/admin/loans" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.22)', borderRadius: 10, padding: '9px 14px', textDecoration: 'none' }}>
              <Building2 size={14} color="#a78bfa" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{d.loans.pending} loan{d.loans.pending !== 1 ? 's' : ''} under review</span>
              <ArrowRight size={13} color="#a78bfa" />
            </Link>
          )}
        </div>
      )}

      {/* ── Finance banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#0a1f3d,#0d2a52)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 18, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-30px', width: 180, height: 180, background: 'radial-gradient(circle,rgba(245,158,11,.1),transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>Financial Overview</div>
        <div className="fin-grid">
          {[
            { label: 'Total Deposited', value: fmtUSD(d.finance.totalDeposited), color: '#34d399' },
            { label: 'Total Withdrawn', value: fmtUSD(d.finance.totalWithdrawn), color: '#f87171' },
            { label: 'Net Cash Flow',   value: `${netFlow >= 0 ? '+' : '-'}${fmtUSD(Math.abs(netFlow))}`, color: netFlow >= 0 ? '#34d399' : '#f87171' },
            { label: 'Total Accounts',  value: fmtNum(d.accounts.total), color: '#60a5fa' },
            { label: 'Frozen Accounts', value: String(d.accounts.frozen), color: d.accounts.frozen > 0 ? '#f87171' : 'rgba(255,255,255,.4)' },
            { label: 'Active Loans',    value: String(d.loans.active), color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-.3px' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4-stat cards ── */}
      <div className="grid-4">
        <StatCard label="Total Users"       value={fmtNum(d.users.total)}
          sub={`${d.users.active} active · ${d.users.suspended} suspended`}
          icon={Users} iconColor="#f59e0b" iconBg="rgba(245,158,11,.12)" href="/admin/users" />
        <StatCard label="Transactions"      value={fmtNum(d.transactions.total)}
          sub={`${d.transactions.pending} pending`}
          icon={Receipt} iconColor="#60a5fa" iconBg="rgba(96,165,250,.12)" href="/admin/transactions"
          alert={d.transactions.pending > 0} />
        <StatCard label="KYC Submissions"   value={d.kyc.pending + d.kyc.approved + d.kyc.rejected}
          sub={`${d.kyc.pending} pending · ${d.kyc.approved} approved`}
          icon={ShieldCheck} iconColor="#34d399" iconBg="rgba(52,211,153,.12)" href="/admin/kyc"
          alert={d.kyc.pending > 0} />
        <StatCard label="Loan Applications" value={fmtNum(d.loans.total)}
          sub={`${d.loans.pending} under review`}
          icon={Building2} iconColor="#a78bfa" iconBg="rgba(167,139,250,.12)" href="/admin/loans"
          alert={d.loans.pending > 0} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2">
        {/* TX status bars */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Transaction Status</div>
          {[
            { label: 'Completed', value: d.transactions.completed, color: '#34d399' },
            { label: 'Pending',   value: d.transactions.pending,   color: '#f59e0b' },
            { label: 'Failed',    value: d.transactions.failed,    color: '#f87171' },
          ].map(({ label, value, color }) => {
            const pct = d.transactions.total > 0 ? Math.round(value / d.transactions.total * 100) : 0;
            return (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace' }}>{fmtNum(value)} <span style={{ color: 'rgba(255,255,255,.3)' }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* User status tiles */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>User Status Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Active',       value: d.users.active,    color: '#34d399', bg: 'rgba(52,211,153,.1)'  },
              { label: 'Pending',      value: d.users.pending,   color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
              { label: 'Suspended',    value: d.users.suspended, color: '#f87171', bg: 'rgba(239,68,68,.1)'   },
              { label: 'KYC Approved', value: d.kyc.approved,   color: '#60a5fa', bg: 'rgba(96,165,250,.1)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-.3px' }}>{fmtNum(value)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 3, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions table ── */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Recent Transactions</h2>
          <Link href="/admin/transactions" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#f59e0b', textDecoration: 'none' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {d.recentTransactions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>No transactions yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  {['User', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recentTransactions.map((tx: any) => {
                  const sc = STATUS_COLORS[tx.status] ?? STATUS_COLORS.pending;
                  const { Icon: SIcon } = sc;
                  const user = tx.userId;
                  return (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{user?.firstName ?? ''} {user?.lastName ?? ''}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{user?.email ?? '—'}</div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 7, background: tx.direction === 'credit' ? 'rgba(52,211,153,.12)' : 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {tx.direction === 'credit' ? <ArrowDownLeft size={12} color="#34d399" /> : <ArrowUpRight size={12} color="#f87171" />}
                          </div>
                          <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, textTransform: 'capitalize' }}>{tx.type?.replace(/_/g, ' ') ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: tx.direction === 'credit' ? '#34d399' : '#f87171', fontFamily: 'monospace', fontSize: 13 }}>
                          {tx.direction === 'credit' ? '+' : '-'}${Number(tx.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                          <SIcon size={10} /> {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: 'rgba(255,255,255,.38)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {formatDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Users + Quick Links ── */}
      <div className="grid-2">

        {/* Recent Users */}
        <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Recently Registered</h2>
            <Link href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#f59e0b', textDecoration: 'none' }}>View all <ArrowRight size={13} /></Link>
          </div>
          {d.recentUsers.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>No users yet</div>
          ) : d.recentUsers.map((u: any) => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#050d1a', flexShrink: 0, overflow: 'hidden' }}>
                {u.profilePictureUrl
                  ? <img src={u.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username} · {u.email}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize',
                  background: u.status === 'active' ? 'rgba(52,211,153,.12)' : u.status === 'pending' ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)',
                  color: u.status === 'active' ? '#34d399' : u.status === 'pending' ? '#f59e0b' : '#f87171' }}>{u.status}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.28)' }}>KYC: {(u.kycStatus ?? 'not started').replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Quick Navigation</div>
          <div className="quick-grid">
            {[
              { href: '/admin/admin/users',        Icon: Users,       label: 'Manage Users',     color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
              { href: '/admin/admin/kyc',          Icon: ShieldCheck, label: 'Review KYC',       color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
              { href: '/admin/admin/loans',        Icon: Building2,   label: 'Loan Review',      color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
              { href: '/admin/admin/cheques',      Icon: FileText,    label: 'Cheque Review',    color: '#60a5fa', bg: 'rgba(96,165,250,.12)'  },
              { href: '/admin/admin/transactions', Icon: Receipt,     label: 'Transactions',     color: '#f87171', bg: 'rgba(239,68,68,.12)'   },
              { href: '/admin/admin/accounts',     Icon: Wallet,      label: 'Accounts',         color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
              { href: '/admin/admin/investments',  Icon: TrendingUp,  label: 'Investments',      color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
              { href: '/admin/admin/crypto',       Icon: Bitcoin,     label: 'Crypto Addresses', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
              { href: '/admin/admin/otp-config',   Icon: BarChart3,   label: 'OTP Config',       color: '#60a5fa', bg: 'rgba(96,165,250,.12)'  },
              { href: '/admin/admin/logs',         Icon: Activity,    label: 'Audit Logs',       color: '#94a3b8', bg: 'rgba(148,163,184,.1)'  },
            ].map(({ href, Icon, label, color, bg }) => (
              <Link key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '11px 13px', textDecoration: 'none', transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.07)'; }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .grid-4    { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .grid-2    { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .fin-grid  { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
        .quick-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }

        @media(max-width:1100px) {
          .grid-4   { grid-template-columns:repeat(2,1fr); }
          .fin-grid { grid-template-columns:repeat(3,1fr); }
        }
        @media(max-width:768px) {
          .grid-2   { grid-template-columns:1fr; }
          .fin-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media(max-width:480px) {
          .grid-4   { grid-template-columns:1fr; }
          .fin-grid { grid-template-columns:1fr 1fr; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}