'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Search, Loader2, X,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  XCircle, Clock, Filter, Eye, BarChart3,
  DollarSign, AlertCircle, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';
import adminApi from '../lib/api';

/* ─── Types — mapped exactly to Investment schema ────────────── */
interface Investment {
  _id: string;
  createdAt: string;
  filledAt?: string;
  referenceNumber?: string;
  alpacaOrderId?: string;

  // Asset
  symbol: string;
  companyName: string;       // schema: companyName (NOT assetName)

  // Financials
  shares: number;            // schema: shares (NOT quantity)
  buyPrice: number;          // schema: buyPrice (NOT pricePerUnit)
  currentPrice?: number;
  totalInvested: number;
  currentValue?: number;
  profitLoss?: number;       // schema: profitLoss (pre-computed)
  profitLossPercent?: number; // schema: profitLossPercent (pre-computed)

  // Enums
  action: 'buy' | 'sell';                               // schema: action (NOT orderType)
  orderStatus: 'pending' | 'filled' | 'cancelled' | 'failed' | string;

  // Refs (populated by backend)
  userId?: {
    _id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  accountId?: {
    _id: string;
    accountNumber?: string;
    accountType?: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n?: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(n ?? 0);
  } catch { return `$${(n ?? 0).toFixed(2)}`; }
};

const fmtD = (d?: string | Date) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d as string));
  } catch { return String(d); }
};

const fmtShort = (d?: string) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(d));
  } catch { return d; }
};

/* ─── Styles ─────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const br = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.1)');

function Lbl({ t }: { t: string }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
      {t}
    </label>
  );
}

/* ─── Status config ──────────────────────────────────────────── */
const SS: Record<string, { bg: string; color: string; Icon: React.ElementType; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,.12)',  color: '#f59e0b', Icon: Clock,        label: 'Pending'   },
  filled:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399', Icon: CheckCircle2, label: 'Filled'    },
  cancelled: { bg: 'rgba(156,163,175,.12)', color: '#9ca3af', Icon: XCircle,      label: 'Cancelled' },
  failed:    { bg: 'rgba(248,113,113,.12)', color: '#f87171', Icon: XCircle,      label: 'Failed'    },
};
const getStatus = (s?: string) => SS[s ?? ''] ?? SS.pending;

/* ─── Detail Modal ───────────────────────────────────────────── */
function InvestmentModal({
  inv, onClose, onDone,
}: {
  inv: Investment;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const review = async (decision: 'approved' | 'rejected') => {
    setErr('');
    setLoading(true);
    try {
      await adminApi.post(`/admin/investments/${inv._id}/review`, { decision });
      onDone(decision === 'approved' ? 'Investment approved' : 'Investment rejected');
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Action failed');
    } finally { setLoading(false); }
  };

  const ss        = getStatus(inv.orderStatus);
  const SIco      = ss.Icon;
  const isPending = inv.orderStatus === 'pending';

  // Use pre-computed profitLoss from schema — no need to recompute
  const pl    = inv.profitLoss ?? 0;
  const plPct = inv.profitLossPercent ?? 0;
  const hasPL = inv.currentValue !== undefined && inv.currentValue > 0;

  const rows: { l: string; v: string; mono?: boolean }[] = [
    { l: 'Symbol',        v: inv.symbol      || '—', mono: true },
    { l: 'Company',       v: inv.companyName || '—'             },
    { l: 'Action',        v: (inv.action ?? '—').toUpperCase()  },
    { l: 'Shares',        v: (inv.shares ?? 0).toString(),       mono: true },
    { l: 'Buy Price',     v: fmt(inv.buyPrice),                  mono: true },
    { l: 'Current Price', v: inv.currentPrice ? fmt(inv.currentPrice) : '—', mono: true },
    { l: 'Total Invested',v: fmt(inv.totalInvested),             mono: true },
    { l: 'Current Value', v: inv.currentValue ? fmt(inv.currentValue) : '—', mono: true },
    { l: 'P&L',           v: hasPL ? `${pl >= 0 ? '+' : ''}${fmt(pl)} (${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%)` : '—', mono: true },
    { l: 'Status',        v: ss.label                            },
    { l: 'Submitted',     v: fmtD(inv.createdAt)                },
    ...(inv.filledAt   ? [{ l: 'Filled At',  v: fmtD(inv.filledAt)  }] : []),
    ...(inv.referenceNumber ? [{ l: 'Reference', v: inv.referenceNumber, mono: true }] : []),
    ...(inv.accountId?.accountNumber ? [{ l: 'Account #', v: inv.accountId.accountNumber, mono: true }] : []),
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>Investment Details</h3>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0, fontFamily: 'monospace' }}>
              {inv.symbol} · {inv.userId?.firstName ?? ''} {inv.userId?.lastName ?? ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px' }}>
              <AlertCircle size={13} color="#f87171" />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span>
            </div>
          )}

          {/* Hero */}
          <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.18)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Total Invested</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '-1px' }}>
              {fmt(inv.totalInvested)}
            </div>

            {/* Action badge */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: inv.action === 'buy' ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)', color: inv.action === 'buy' ? '#34d399' : '#f87171', fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 100 }}>
                {inv.action === 'buy' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                {(inv.action ?? '').toUpperCase()} ORDER
              </span>
            </div>

            {/* P&L */}
            {hasPL && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                {pl >= 0 ? <TrendingUp size={14} color="#34d399" /> : <TrendingDown size={14} color="#f87171" />}
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: pl >= 0 ? '#34d399' : '#f87171' }}>
                  {pl >= 0 ? '+' : ''}{fmt(pl)} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                </span>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>
                <SIco size={11} /> {ss.label}
              </span>
            </div>
          </div>

          {/* Investor card */}
          {inv.userId && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '13px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Investor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
                  {(inv.userId.firstName?.[0] ?? 'U').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {inv.userId.firstName ?? ''} {inv.userId.lastName ?? ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                    {inv.userId.username ? `@${inv.userId.username} · ` : ''}{inv.userId.email ?? ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
            {rows.map(({ l, v, mono }, i) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', gap: 12, borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isPending && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => review('rejected')} disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 11, padding: '11px', fontSize: 13, fontWeight: 700, color: '#f87171', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={14} />}
                Reject
              </button>
              <button onClick={() => review('approved')} disabled={loading}
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#34d399,#059669)', border: 'none', borderRadius: 11, padding: '11px', fontSize: 14, fontWeight: 700, color: '#050d1a', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
                Approve Investment
              </button>
            </div>
          )}
          <button onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '10px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [pagination,  setPagination]  = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [status,      setStatus]      = useState('');
  const [action,      setAction]      = useState('');   // buy | sell
  const [showFilter,  setShowFilter]  = useState(false);
  const [selected,    setSelected]    = useState<Investment | null>(null);
  const [toast,       setToast]       = useState('');
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (page = 1, st = status, ac = action) => {
    setLoading(true);
    try {
      const p: any = { page, limit: 20 };
      if (st) p.orderStatus = st;
      if (ac) p.action      = ac;
      const res = await adminApi.get('/admin/investments', { params: p });

      // Handle all API response shapes
      const outer = res.data?.data ?? res.data;
      const items: Investment[] =
        Array.isArray(outer)              ? outer :
        Array.isArray(outer?.items)       ? outer.items :
        Array.isArray(outer?.investments) ? outer.investments :
        Array.isArray(outer?.data)        ? outer.data :
        [];

      setInvestments(items);
      if (outer?.pagination) setPagination(outer.pagination);
    } catch (e) {
      console.error('Failed to load investments', e);
    } finally { setLoading(false); }
  }, [status, action]);

  useEffect(() => { if (mounted) load(); }, [mounted]); // eslint-disable-line

  // Client-side search across symbol, companyName, user fields
  const filtered = search
    ? investments.filter(inv =>
        [inv.symbol, inv.companyName, inv.referenceNumber,
         inv.userId?.username, inv.userId?.email,
         inv.userId?.firstName, inv.userId?.lastName]
          .some(f => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : investments;

  // Stats derived from current page data
  const totalPending  = investments.filter(i => i.orderStatus === 'pending').length;
  const totalFilled   = investments.filter(i => i.orderStatus === 'filled').length;
  const totalFailed   = investments.filter(i => i.orderStatus === 'failed' || i.orderStatus === 'cancelled').length;
  const totalVolume   = investments.filter(i => i.orderStatus === 'filled').reduce((s, i) => s + (i.totalInvested ?? 0), 0);

  if (!mounted) return null;

  const quickReview = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await adminApi.post(`/admin/investments/${id}/review`, { decision });
      showToast(decision === 'approved' ? 'Investment approved' : 'Investment rejected');
      load(pagination.page);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Investments</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>{pagination.total.toLocaleString()} total orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowFilter(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: showFilter ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.05)', border: `1px solid ${showFilter ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.09)'}`, borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, color: showFilter ? '#f59e0b' : 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Filter size={13} /> Filters
          </button>
          <button onClick={() => load(pagination.page)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, color: 'rgba(255,255,255,.55)', cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="stats-grid">
        {([
          { l: 'Pending',      v: totalPending,     Icon: Clock,        c: '#f59e0b', mono: false },
          { l: 'Filled',       v: totalFilled,      Icon: CheckCircle2, c: '#34d399', mono: false },
          { l: 'Failed/Cancel',v: totalFailed,      Icon: XCircle,      c: '#f87171', mono: false },
          { l: 'Total Volume', v: fmt(totalVolume), Icon: DollarSign,   c: '#60a5fa', mono: true  },
        ] as const).map(({ l, v, Icon, c, mono }) => (
          <div key={l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon size={13} color={c} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{l}</span>
            </div>
            <div style={{ fontSize: 'clamp(16px,2vw,22px)', fontWeight: 800, color: c, letterSpacing: '-.3px', fontFamily: mono ? 'monospace' : 'inherit' }}>
              {typeof v === 'number' ? v.toLocaleString() : v}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
            <Search size={14} color="rgba(255,255,255,.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol, company, user…" style={{ ...inp, paddingLeft: 36 }} onFocus={fg} onBlur={br} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); load(1, e.target.value, action); }} style={{ ...inp, width: 'auto', minWidth: 150, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="filled">Filled</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {showFilter && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 140 }}>
              <Lbl t="Action" />
              <select value={action} onChange={e => { setAction(e.target.value); load(1, status, e.target.value); }} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                <option value="">Buy & Sell</option>
                <option value="buy">Buy orders</option>
                <option value="sell">Sell orders</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setAction(''); setStatus(''); load(1, '', ''); }} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        {loading && investments.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10 }}>
            <BarChart3 size={36} color="rgba(255,255,255,.1)" />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No investments found</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="inv-tbl-hdr" style={{ display: 'none', gridTemplateColumns: '1.8fr 1.4fr 90px 120px 120px 90px 150px', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
              {['Asset', 'Investor', 'Action', 'Invested', 'P&L', 'Status', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
              ))}
            </div>

            {filtered.map((inv, i) => {
              const ss        = getStatus(inv.orderStatus);
              const SIco      = ss.Icon;
              const isPending = inv.orderStatus === 'pending';
              const pl        = inv.profitLoss ?? 0;
              const plPct     = inv.profitLossPercent ?? 0;
              const hasPL     = (inv.currentValue ?? 0) > 0;

              return (
                <div key={inv._id} className="inv-row"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', transition: 'background .15s', cursor: 'pointer' }}
                  onClick={() => setSelected(inv)}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  {/* ── Mobile card ── */}
                  <div className="inv-mobile" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: isPending ? 'rgba(245,158,11,.15)' : inv.action === 'buy' ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: isPending ? '#f59e0b' : inv.action === 'buy' ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                          {inv.symbol.slice(0, 2)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{inv.symbol}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.companyName}</div>
                        </div>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, flexShrink: 0 }}>
                        <SIco size={9} /> {ss.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>Investor</div>
                        <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{inv.userId?.firstName ?? ''} {inv.userId?.lastName ?? ''}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>Invested</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{fmt(inv.totalInvested)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>Shares × Price</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>{inv.shares} × {fmt(inv.buyPrice)}</div>
                      </div>
                      {hasPL && (
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>P&L</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: pl >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                            {pl >= 0 ? '+' : ''}{fmt(pl)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{fmtShort(inv.createdAt)}</span>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(inv); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <Eye size={11} /> View
                        </button>
                        {isPending && (
                          <>
                            <button onClick={e => { e.stopPropagation(); quickReview(inv._id, 'approved'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <CheckCircle2 size={11} /> Approve
                            </button>
                            <button onClick={e => { e.stopPropagation(); quickReview(inv._id, 'rejected'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop row ── */}
                  <div className="inv-desktop" style={{ display: 'none', gridTemplateColumns: '1.8fr 1.4fr 90px 120px 120px 90px 150px', alignItems: 'center', padding: '13px 18px', gap: 8 }}>
                    {/* Asset */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: inv.action === 'buy' ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: inv.action === 'buy' ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                        {inv.symbol.slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{inv.symbol}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{inv.companyName}</div>
                      </div>
                    </div>
                    {/* Investor */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.userId?.firstName ?? ''} {inv.userId?.lastName ?? ''}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.userId?.email ?? ''}</div>
                    </div>
                    {/* Action badge */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: inv.action === 'buy' ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)', color: inv.action === 'buy' ? '#34d399' : '#f87171', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 7 }}>
                        {inv.action === 'buy' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {(inv.action ?? '').toUpperCase()}
                      </span>
                    </div>
                    {/* Invested */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{fmt(inv.totalInvested)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>{inv.shares} sh @ {fmt(inv.buyPrice)}</div>
                    </div>
                    {/* P&L */}
                    <div>
                      {hasPL ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: pl >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                            {pl >= 0 ? '+' : ''}{fmt(pl)}
                          </div>
                          <div style={{ fontSize: 10, color: pl >= 0 ? '#34d399' : '#f87171', marginTop: 1 }}>
                            {plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>—</span>
                      )}
                    </div>
                    {/* Status */}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                      <SIco size={10} /> {ss.label}
                    </span>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(inv); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        <Eye size={11} /> View
                      </button>
                      {isPending && (
                        <>
                          <button onClick={e => { e.stopPropagation(); quickReview(inv._id, 'approved'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <CheckCircle2 size={11} /> Approve
                          </button>
                          <button onClick={e => { e.stopPropagation(); quickReview(inv._id, 'rejected'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <XCircle size={11} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page <= 1 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
              return <button key={pg} onClick={() => load(pg)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: pg === pagination.page ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,.05)', color: pg === pagination.page ? '#050d1a' : 'rgba(255,255,255,.5)' }}>{pg}</button>;
            })}
            <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page >= pagination.pages ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {selected && (
        <InvestmentModal
          inv={selected}
          onClose={() => setSelected(null)}
          onDone={msg => { showToast(msg); load(pagination.page); }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111826', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,.5)', zIndex: 9999 }}>
          ✓ {toast}
        </div>
      )}

      <style>{`
        *,*::before,*::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a2235; color: #fff; }
        @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @media (min-width: 700px) {
          .inv-mobile  { display: none !important; }
          .inv-desktop { display: grid !important; }
          .inv-tbl-hdr { display: grid !important; }
        }
      `}</style>
    </div>
  );
}