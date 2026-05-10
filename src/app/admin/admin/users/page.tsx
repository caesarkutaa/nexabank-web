'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Loader2, AlertCircle, ChevronLeft,
  ChevronRight, Eye, EyeOff, BarChart3, X, User, Mail,
  Phone, MapPin, Calendar, CreditCard, Lock, Unlock,
  RefreshCw, ArrowUpRight, ArrowDownLeft, Ban,
} from 'lucide-react';
import adminApi from '../lib/api';
import { formatDate, formatDateTime } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUserRecord {
  _id:               string;
  username:          string;
  email:             string;
  firstName:         string;
  lastName:          string;
  phoneNumber?:      string;
  address?:          string;
  city?:             string;
  state?:            string;
  zipCode?:          string;
  country?:          string;
  role:              string;
  status:            string;
  kycStatus:         string;
  emailVerified:     boolean;
  creditScore:       number;
  creditRating:      string;
  twoFactorEnabled:  boolean;
  preferredCurrency: string;
  lastLoginAt?:      string;
  createdAt:         string;
  profilePictureUrl?: string;
  transferBlocked?:  boolean;    // ← user can log in but cannot make transfers
}

interface UserDetail {
  user:         AdminUserRecord;
  accounts:     any[];
  transactions: any[];
  loans:        any[];
  kyc:          any;
}

interface Pagination {
  total: number; page: number; limit: number; pages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ini(a?: string, b?: string) {
  return `${a?.[0] ?? ''}${b?.[0] ?? ''}`.toUpperCase() || 'U';
}
function fmtC(n: number, cur = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n ?? 0); }
  catch { return `$${(n ?? 0).toFixed(2)}`; }
}

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  pending:   { bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
  suspended: { bg: 'rgba(239,68,68,.12)',  color: '#f87171' },
  locked:    { bg: 'rgba(239,68,68,.12)',  color: '#f87171' },
};
const KYC_CFG: Record<string, { bg: string; color: string }> = {
  approved:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  pending:     { bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
  rejected:    { bg: 'rgba(239,68,68,.12)',  color: '#f87171' },
  not_started: { bg: 'rgba(148,163,184,.1)', color: '#94a3b8' },
  resubmit:    { bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
};

const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ display: 'inline-block', background: bg, color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{label.replace(/_/g, ' ')}</span>;
}

function Lbl({ text }: { text: string }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{text}</label>;
}

// ─── Credit Score Modal ───────────────────────────────────────────────────────
function CreditModal({ user, onClose, onDone }: { user: AdminUserRecord; onClose: () => void; onDone: () => void }) {
  const [score,   setScore]   = useState(String(user.creditScore ?? 300));
  const [rating,  setRating]  = useState(user.creditRating ?? 'no_history');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const n          = parseInt(score) || 300;
  const scoreColor = n >= 750 ? '#34d399' : n >= 670 ? '#f59e0b' : '#f87171';

  const submit = async () => {
    if (isNaN(n) || n < 300 || n > 850) return setErr('Score must be between 300 and 850');
    setLoading(true);
    try {
      await adminApi.patch(`/admin/users/${user._id}/credit-score`, { score: n, rating });
      onDone(); onClose();
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)', zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '24px 22px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Update Credit Score</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={14} /></button>
        </div>

        {/* Score preview */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor, fontFamily: 'monospace', letterSpacing: '-2px', lineHeight: 1 }}>{score || '—'}</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden', margin: '12px 0 0' }}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (n - 300) / 550 * 100))}%`, background: scoreColor, borderRadius: 3, transition: 'width .3s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 3 }}><span>300</span><span>850</span></div>
        </div>

        {err && <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,.09)', borderRadius: 8, padding: '8px 12px' }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Lbl text="Score (300–850)" />
          <input type="number" min={300} max={850} value={score} onChange={e => setScore(e.target.value)} style={inp}
            onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Lbl text="Rating" />
          <select value={rating} onChange={e => setRating(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}>
            <option value="excellent">Excellent (750–850)</option>
            <option value="good">Good (670–749)</option>
            <option value="fair">Fair (580–669)</option>
            <option value="poor">Poor (300–579)</option>
            <option value="no_history">No History</option>
          </select>
        </div>

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
          {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          <BarChart3 size={14} /> Update Score
        </button>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', role: 'user', skipEmailVerification: false });
  const [loading,      setLoading]      = useState(false);
  const [err,          setErr]          = useState('');
  const [showPassword, setShowPassword] = useState(false); // ← eye toggle
  const upd = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr('');
    if (!f.username || !f.email || !f.password) return setErr('Username, email and password are required');
    setLoading(true);
    try {
      await adminApi.post('/admin/users', f);
      onDone(); onClose();
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to create user'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Create User</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        {err && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px' }}>
            <AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { k: 'firstName',   l: 'First Name',  p: 'John'             },
            { k: 'lastName',    l: 'Last Name',   p: 'Doe'              },
            { k: 'username',    l: 'Username *',  p: 'john_doe'         },
            { k: 'email',       l: 'Email *',     p: 'john@example.com' },
            { k: 'phoneNumber', l: 'Phone',       p: '+1 555 000 0000'  },
          ].map(({ k, l, p }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl text={l} />
              <input type="text" value={(f as any)[k]}
                onChange={e => upd(k, e.target.value)} placeholder={p} style={inp}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')} />
            </div>
          ))}

          {/* Password field with eye toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Lbl text="Password *" />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={f.password}
                onChange={e => upd('password', e.target.value)}
                placeholder="SecurePass@123"
                style={{ ...inp, paddingRight: 38 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
              />
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Lbl text="Role" />
            <select value={f.role} onChange={e => upd('role', e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '10px 13px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, width: '100%' }}>
              <input type="checkbox" checked={f.skipEmailVerification} onChange={e => upd('skipEmailVerification', e.target.checked)} style={{ width: 14, height: 14, accentColor: '#f59e0b', cursor: 'pointer' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>Skip email verification</span>
            </label>
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
          Create User
        </button>
      </div>
    </div>
  );
}

// ─── Transactions Tab — with block / unblock per transaction ─────────────────
function TransactionsTab({ transactions, onRefresh }: { transactions: any[]; onRefresh: () => void }) {
  const [blockTx,   setBlockTx]   = useState<any | null>(null);
  const [reason,    setReason]    = useState('');
  const [actTxId,   setActTxId]   = useState<string | null>(null); // tracks which tx is loading
  const [localTxs,  setLocalTxs]  = useState(transactions);

  // Keep in sync if parent refreshes
  useEffect(() => { setLocalTxs(transactions); }, [transactions]);

  const doBlock = async () => {
    if (!blockTx) return;
    setActTxId(blockTx._id);
    try {
      await adminApi.post('/admin/transactions/block', {
        transactionId: blockTx._id,
        reason: reason || 'Blocked by admin',
      });
      setLocalTxs(prev => prev.map(t => t._id === blockTx._id ? { ...t, status: 'cancelled' } : t));
      onRefresh();
    } catch {}
    finally { setActTxId(null); setBlockTx(null); setReason(''); }
  };

  const doUnblock = async (tx: any) => {
    setActTxId(tx._id);
    try {
      await adminApi.post(`/admin/transactions/${tx._id}/unblock`);
      setLocalTxs(prev => prev.map(t => t._id === tx._id ? { ...t, status: 'pending' } : t));
      onRefresh();
    } catch {}
    finally { setActTxId(null); }
  };

  if (!localTxs.length) {
    return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 40, fontSize: 13 }}>No transactions found</div>;
  }

  return (
    <>
      <div>
        {localTxs.map((tx: any) => {
          const isBlocked   = tx.status === 'cancelled';
          const isCompleted = tx.status === 'completed';
          const canBlock    = !isBlocked && !isCompleted;
          const loading     = actTxId === tx._id;
          return (
            <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.05)', flexWrap: 'wrap' }}>
              {/* Direction icon */}
              <div style={{ width: 32, height: 32, borderRadius: 9, background: tx.direction === 'credit' ? 'rgba(52,211,153,.12)' : 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tx.direction === 'credit' ? <ArrowDownLeft size={14} color="#34d399" /> : <ArrowUpRight size={14} color="#f87171" />}
              </div>
              {/* Description + ref */}
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {tx.description || tx.type?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
                  {formatDate(tx.createdAt)} · {tx.referenceNumber}
                </div>
              </div>
              {/* Amount + status */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx.direction === 'credit' ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                  {tx.direction === 'credit' ? '+' : '-'}${Number(tx.amount ?? 0).toFixed(2)}
                </div>
                <Pill label={tx.status} {...(STATUS_CFG[tx.status] ?? { bg: 'rgba(148,163,184,.1)', color: '#94a3b8' })} />
              </div>
              {/* Block / Unblock action */}
              <div style={{ flexShrink: 0 }}>
                {isBlocked ? (
                  <button onClick={() => doUnblock(tx)} disabled={loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? .5 : 1 }}>
                    {loading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlock size={11} />}
                    Unblock
                  </button>
                ) : canBlock ? (
                  <button onClick={() => setBlockTx(tx)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Lock size={11} /> Block
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Block confirm sheet */}
      {blockTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', zIndex: 9300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setBlockTx(null)}>
          <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '22px 20px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Block Transaction?</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>
                Ref: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{blockTx.referenceNumber}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Reason</label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for blocking…"
                style={{ width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setBlockTx(null); setReason(''); }} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={doBlock} disabled={actTxId === blockTx._id}
                style={{ flex: 1, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actTxId === blockTx._id ? .6 : 1 }}>
                {actTxId === blockTx._id && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                <Lock size={13} /> Block Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose, onRefresh }: { userId: string; onClose: () => void; onRefresh: () => void }) {
  const [data,         setData]         = useState<UserDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'overview' | 'accounts' | 'transactions' | 'loans'>('overview');
  const [blockOpen,    setBlockOpen]    = useState(false);
  const [reason,       setReason]       = useState('');
  const [creditOpen,   setCreditOpen]   = useState(false);
  const [actLoading,   setActLoading]   = useState(false);
  const [toast,        setToast]        = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const refresh = () => {
    setLoading(true);
    adminApi.get(`/admin/users/${userId}`)
      .then(res => { const d = res.data.data ?? res.data; setData(d.user ? d : { user: d, accounts: [], transactions: [], loans: [], kyc: null }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [userId]);

  const user: AdminUserRecord | null = (data as any)?.user ?? null;

  const handleBlock = async () => {
    setActLoading(true);
    try {
      await adminApi.post(`/admin/users/${userId}/block`, { reason: reason || 'Blocked by admin' });
      showToast('User login blocked'); onRefresh();
      setData(d => d ? { ...d, user: { ...d.user, status: 'suspended' } } : d);
    } catch (e: any) { showToast(e.response?.data?.message || 'Failed to block'); }
    finally { setActLoading(false); setBlockOpen(false); }
  };

  const handleUnblock = async () => {
    setActLoading(true);
    try {
      await adminApi.post(`/admin/users/${userId}/unblock`);
      showToast('User login unblocked'); onRefresh();
      setData(d => d ? { ...d, user: { ...d.user, status: 'active' } } : d);
    } catch (e: any) { showToast(e.response?.data?.message || 'Failed to unblock'); }
    finally { setActLoading(false); }
  };

  // Toggle transfer block — user can still log in but all transfers/payments are blocked
  const handleToggleTransferBlock = async () => {
    const isBlocked = user?.transferBlocked;
    setActLoading(true);
    try {
      await adminApi.patch(`/admin/users/${userId}/transfer-block`, {
        transferBlocked: !isBlocked,
      });
      showToast(isBlocked ? 'Transfers unblocked' : 'Transfers blocked for this user');
      onRefresh();
      setData(d => d ? { ...d, user: { ...d.user, transferBlocked: !isBlocked } } : d);
    } catch (e: any) { showToast(e.response?.data?.message || 'Failed'); }
    finally { setActLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#050d1a', overflow: 'hidden', flexShrink: 0 }}>
              {user?.profilePictureUrl ? <img src={user.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(user?.firstName, user?.lastName)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>@{user?.username} · {user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Block / Unblock account login */}
            {user?.status === 'suspended'
              ? <button onClick={handleUnblock} disabled={actLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Unlock size={13} /> Unblock Login
                </button>
              : <button onClick={() => setBlockOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Lock size={13} /> Block Login
                </button>
            }
            {/* Block / Unblock transfers — user can still log in but cannot transfer */}
            <button onClick={handleToggleTransferBlock} disabled={actLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: user?.transferBlocked ? 'rgba(52,211,153,.1)' : 'rgba(245,158,11,.1)', border: `1px solid ${user?.transferBlocked ? 'rgba(52,211,153,.25)' : 'rgba(245,158,11,.25)'}`, borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: user?.transferBlocked ? '#34d399' : '#f59e0b', cursor: 'pointer', fontFamily: 'inherit' }}>
              {user?.transferBlocked ? <><Unlock size={13} /> Allow Transfers</> : <><Ban size={13} /> Block Transfers</>}
            </button>
            {/* Credit score */}
            <button onClick={() => setCreditOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.25)', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit' }}>
              <BarChart3 size={13} /> Credit Score
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={15} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0, overflowX: 'auto' }}>
          {(['overview', 'accounts', 'transactions', 'loans'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: tab === t ? 'rgba(245,158,11,.12)' : 'transparent', color: tab === t ? '#f59e0b' : 'rgba(255,255,255,.4)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
              {t}{t !== 'overview' ? ` (${(data as any)?.[t]?.length ?? 0})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 10, color: 'rgba(255,255,255,.35)' }}>
              <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>
          ) : !user ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 40 }}>Failed to load user details</div>
          ) : tab === 'overview' ? (

            // ── Overview ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Status badges — KYC read from data.kyc (live KYC document) not user.kycStatus */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill label={user.status} {...(STATUS_CFG[user.status] ?? STATUS_CFG.pending)} />
                {user.transferBlocked && (
                  <Pill label="Transfers Blocked" bg="rgba(239,68,68,.12)" color="#f87171" />
                )}
                {(() => {
                  const liveKyc = data?.kyc?.status ?? user.kycStatus ?? 'not_started';
                  return <Pill label={`KYC: ${liveKyc.replace(/_/g, ' ')}`} {...(KYC_CFG[liveKyc] ?? KYC_CFG.not_started)} />;
                })()}
                {user.emailVerified && <Pill label="Email verified" bg="rgba(52,211,153,.1)" color="#34d399" />}
                {user.twoFactorEnabled && <Pill label="2FA enabled" bg="rgba(96,165,250,.1)" color="#60a5fa" />}
                <Pill label={user.role.replace(/_/g, ' ')} bg="rgba(245,158,11,.1)" color="#f59e0b" />
              </div>

              {/* Info grid */}
              <div className="det-grid">
                {[
                  { Icon: Mail,       label: 'Email',        value: user.email                    },
                  { Icon: Phone,      label: 'Phone',        value: user.phoneNumber ?? '—'        },
                  { Icon: Calendar,   label: 'Member Since', value: formatDate(user.createdAt)     },
                  { Icon: Calendar,   label: 'Last Login',   value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—' },
                  { Icon: MapPin,     label: 'Address',      value: [user.address, user.city, user.state, user.zipCode].filter(Boolean).join(', ') || '—' },
                  { Icon: CreditCard, label: 'Currency',     value: user.preferredCurrency ?? 'USD' },
                ].map(({ Icon, label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Credit score */}
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>Credit Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: user.creditScore >= 750 ? '#34d399' : user.creditScore >= 670 ? '#f59e0b' : '#f87171' }}>{user.creditScore}</span>
                    <Pill label={user.creditRating.replace(/_/g, ' ')} bg="rgba(245,158,11,.1)" color="#f59e0b" />
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(user.creditScore - 300) / 550 * 100}%`, background: user.creditScore >= 750 ? '#34d399' : user.creditScore >= 670 ? '#f59e0b' : '#f87171', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 3 }}><span>300</span><span>850</span></div>
              </div>

              {/* Live KYC document details — from data.kyc (KYC collection), not user.kycStatus */}
              {data?.kyc && (
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>KYC Document</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    {[
                      { l: 'Document Type',   v: data.kyc.documentType?.replace(/_/g, ' ') ?? '—' },
                      { l: 'Document Number', v: data.kyc.documentNumber ?? '—' },
                      { l: 'Status',          v: data.kyc.status ?? '—' },
                      { l: 'Submitted',       v: data.kyc.createdAt ? formatDate(data.kyc.createdAt) : '—' },
                      { l: 'Reviewed At',     v: data.kyc.reviewedAt ? formatDate(data.kyc.reviewedAt) : '—' },
                      { l: 'Expiry Date',     v: data.kyc.expiryDate ? formatDate(data.kyc.expiryDate) : '—' },
                    ].map(({ l, v }) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{l}</div>
                        <div style={{ color: '#fff', fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {data.kyc.rejectionNote && (
                    <div style={{ marginTop: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Rejection Note</div>
                      <div style={{ fontSize: 12, color: '#fca5a5' }}>{data.kyc.rejectionNote}</div>
                    </div>
                  )}
                  {/* KYC document images */}
                  {(data.kyc.frontImageUrl || data.kyc.selfieUrl) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {data.kyc.frontImageUrl && (
                        <a href={data.kyc.frontImageUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}>
                          📄 View ID Front
                        </a>
                      )}
                      {data.kyc.backImageUrl && (
                        <a href={data.kyc.backImageUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}>
                          📄 View ID Back
                        </a>
                      )}
                      {data.kyc.selfieUrl && (
                        <a href={data.kyc.selfieUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}>
                          🤳 View Selfie
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          ) : tab === 'accounts' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!data?.accounts?.length ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 40, fontSize: 13 }}>No accounts found</div>
              ) : data.accounts.map((acc: any) => (
                <div key={acc._id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{acc.nickname || acc.accountType?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontFamily: 'monospace' }}>••••{acc.accountNumber?.slice(-4)} · {acc.currency}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{fmtC(acc.balance, acc.currency)}</div>
                      <Pill label={acc.status} {...(STATUS_CFG[acc.status] ?? STATUS_CFG.pending)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, flexWrap: 'wrap' }}>
                    <span style={{ color: 'rgba(255,255,255,.35)' }}>Deposited: <strong style={{ color: '#34d399' }}>{fmtC(acc.totalDeposited, acc.currency)}</strong></span>
                    <span style={{ color: 'rgba(255,255,255,.35)' }}>Withdrawn: <strong style={{ color: '#f87171' }}>{fmtC(acc.totalWithdrawn, acc.currency)}</strong></span>
                    {acc.isPrimary && <Pill label="Primary" bg="rgba(245,158,11,.1)" color="#f59e0b" />}
                  </div>
                </div>
              ))}
            </div>

          ) : tab === 'transactions' ? (
            <TransactionsTab transactions={data?.transactions ?? []} onRefresh={refresh} />

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!data?.loans?.length ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 40, fontSize: 13 }}>No loans found</div>
              ) : data.loans.map((loan: any) => (
                <div key={loan._id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{loan.loanType?.replace(/_/g, ' ') ?? 'Loan'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{loan.termMonths} months · {loan.interestRate}% p.a.</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{fmtC(loan.requestedAmount)}</div>
                      <Pill label={loan.status} {...(STATUS_CFG[loan.status] ?? { bg: 'rgba(148,163,184,.1)', color: '#94a3b8' })} />
                    </div>
                  </div>
                  {loan.purpose && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Purpose: {loan.purpose}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#111826', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,.4)', zIndex: 10 }}>
            ✓ {toast}
          </div>
        )}
      </div>

      {/* Block confirm */}
      {blockOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setBlockOpen(false)}>
          <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '22px 20px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Block @{user?.username}?</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>They won't be able to log in or perform any actions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl text="Reason (optional)" />
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for blocking…" style={inp}
                onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setBlockOpen(false)} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleBlock} disabled={actLoading}
                style={{ flex: 1, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actLoading ? .6 : 1 }}>
                {actLoading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                <Lock size={13} /> Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit modal */}
      {creditOpen && user && (
        <CreditModal user={user} onClose={() => setCreditOpen(false)}
          onDone={() => { refresh(); onRefresh(); }} />
      )}
    </div>
  );
}

// ─── Main Users Page ──────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<AdminUserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [mounted,    setMounted]    = useState(false);
  const [detailId,   setDetailId]   = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async (page = 1, q = search, st = status) => {
    setLoading(true);
    try {
      // No role=user needed — backend now excludes admin/super_admin by default
      const params: any = { page, limit: 20 };
      if (q)  params.search = q;
      if (st) params.status = st;
      const res = await adminApi.get('/admin/users', { params });
      const d   = res.data.data ?? res.data;
      // Belt-and-braces: never show admin rows even if backend returns them
      const regularUsers = (d.users ?? []).filter(
        (u: AdminUserRecord) => u.role !== 'admin' && u.role !== 'super_admin'
      );
      setUsers(regularUsers);
      setPagination(d.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 });
    } catch {}
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(1, val, status), 420);
  };

  const handleStatus = (val: string) => {
    setStatus(val);
    load(1, search, val);
  };

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Users</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>{pagination.total.toLocaleString()} total registered users</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => load(pagination.page)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, color: 'rgba(255,255,255,.55)', cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={15} /> Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} color="rgba(255,255,255,.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search name, email, username…"
            style={{ ...inp, paddingLeft: 36 }}
            onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.4)')}
            onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')} />
        </div>
        <select value={status} onChange={e => handleStatus(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: 150, appearance: 'none', cursor: 'pointer', paddingRight: 28 }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.4)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        {loading && users.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10 }}>
            <User size={36} color="rgba(255,255,255,.1)" />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No users found</p>
            {search && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', margin: 0 }}>Try adjusting your search or filters</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['User', 'Status', 'KYC', 'Credit Score', 'Role', 'Joined', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const sc = STATUS_CFG[u.status] ?? STATUS_CFG.pending;
                  const kc = KYC_CFG[u.kycStatus] ?? KYC_CFG.not_started;
                  const cc = u.creditScore >= 750 ? '#34d399' : u.creditScore >= 670 ? '#f59e0b' : '#f87171';
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#050d1a', flexShrink: 0, overflow: 'hidden' }}>
                            {u.profilePictureUrl ? <img src={u.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(u.firstName, u.lastName)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><Pill label={u.status} bg={sc.bg} color={sc.color} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        {/* kycStatus here is from the User document — the live KYC is in the detail modal */}
                        <Pill label={(u.kycStatus ?? 'not started').replace(/_/g, ' ')} {...(KYC_CFG[u.kycStatus] ?? KYC_CFG.not_started)} />
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: cc }}>{u.creditScore}</td>
                      <td style={{ padding: '12px 16px' }}><Pill label={u.role.replace(/_/g, ' ')} bg="rgba(245,158,11,.1)" color="#f59e0b" /></td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,.4)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setDetailId(u._id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page <= 1 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
              return (
                <button key={pg} onClick={() => load(pg)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: pg === pagination.page ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,.05)', color: pg === pagination.page ? '#050d1a' : 'rgba(255,255,255,.5)' }}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page >= pagination.pages ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} onRefresh={() => load(pagination.page)} />}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onDone={() => load(1)} />}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a2235; color: #fff; }
        .det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media(max-width: 500px) { .det-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}