'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, X, Receipt, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, XCircle, Activity, Pencil,
  Lock, Unlock, Filter, Calendar, DollarSign, User,
  Building, Globe, Hash, FileText, Save,
} from 'lucide-react';
import adminApi from '../lib/api';
import { formatDateTime } from '../../../lib/utils';

interface Tx {
  _id: string; referenceNumber: string; type: string; status: string; direction: string;
  amount: number; fee: number; currency: string; description: string;
  recipientName?: string; recipientAccountNumber?: string; recipientBankName?: string;
  recipientRoutingNumber?: string; senderName?: string; senderAccountNumber?: string;
  senderBankName?: string; swiftCode?: string; ibanNumber?: string; recipientCountry?: string;
  balanceAfter?: number; processedAt?: string; createdAt: string; metadata?: any;
  userId?: { _id: string; username: string; email: string; firstName: string; lastName: string; };
  accountId?: { _id: string; accountNumber: string; accountType: string; };
}
interface Pagination { total: number; page: number; limit: number; pages: number; }

const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const br = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.1)');
function Lbl({ t }: { t: string }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t}</label>;
}
function fmtC(n: number, cur = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n ?? 0); }
  catch { return `$${(n ?? 0).toFixed(2)}`; }
}
const SC: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  completed:  { bg: 'rgba(52,211,153,.12)',  color: '#34d399', Icon: CheckCircle2 },
  pending:    { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', Icon: Clock        },
  processing: { bg: 'rgba(96,165,250,.12)', color: '#60a5fa', Icon: Activity     },
  failed:     { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle      },
  cancelled:  { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle      },
  reversed:   { bg: 'rgba(167,139,250,.12)',color: '#a78bfa', Icon: Activity     },
};
function SecHead({ title, icon: Icon, color }: { title: string; icon: React.ElementType; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 5px', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 2 }}>
      <Icon size={13} color={color} />
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ tx, onClose, onDone }: { tx: Tx; onClose: () => void; onDone: () => void }) {
  const toLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  };

  const [status,     setStatus]     = useState(tx.status);
  const [direction,  setDirection]  = useState(tx.direction || 'debit');
  const [txType,     setTxType]     = useState(tx.type || '');
  const [amount,     setAmount]     = useState(String(tx.amount ?? ''));
  const [fee,        setFee]        = useState(String(tx.fee ?? 0));
  const [currency,   setCurrency]   = useState(tx.currency || 'USD');
  const [desc,       setDesc]       = useState(tx.description || '');
  const [refNum,     setRefNum]     = useState(tx.referenceNumber || '');
  const [balAfter,   setBalAfter]   = useState(String(tx.balanceAfter ?? ''));
  // Dates
  const [createdAt,  setCreatedAt]  = useState(toLocal(tx.createdAt));
  const [processedAt,setProcessedAt]= useState(toLocal(tx.processedAt || tx.createdAt));
  // Recipient
  const [recName,    setRecName]    = useState(tx.recipientName || '');
  const [recAcc,     setRecAcc]     = useState(tx.recipientAccountNumber || '');
  const [recBank,    setRecBank]    = useState(tx.recipientBankName || '');
  const [recRouting, setRecRouting] = useState(tx.recipientRoutingNumber || '');
  const [recCountry, setRecCountry] = useState(tx.recipientCountry || '');
  // Sender
  const [sendName,   setSendName]   = useState(tx.senderName || '');
  const [sendAcc,    setSendAcc]    = useState(tx.senderAccountNumber || '');
  const [sendBank,   setSendBank]   = useState(tx.senderBankName || '');
  // Wire
  const [swift,      setSwift]      = useState(tx.swiftCode || '');
  const [iban,       setIban]       = useState(tx.ibanNumber || '');
  // Admin
  const [adminNotes, setAdminNotes] = useState(tx.metadata?.adminNotes || '');

  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');

  const submit = async () => {
    setErr(''); setOk('');
    setLoading(true);
    try {
      await adminApi.put(`/admin/transactions/${tx._id}`, {
        status, direction, type: txType,
        amount:                 parseFloat(amount)   || undefined,
        fee:                    parseFloat(fee)       ?? 0,
        currency, description: desc,
        referenceNumber:        refNum               || undefined,
        balanceAfter:           balAfter ? parseFloat(balAfter) : undefined,
        // Backdating
        processedAt:            processedAt ? new Date(processedAt).toISOString() : undefined,
        createdAt:              createdAt   ? new Date(createdAt).toISOString()   : undefined,
        // Recipient
        recipientName:          recName    || undefined,
        recipientAccountNumber: recAcc     || undefined,
        recipientBankName:      recBank    || undefined,
        recipientRoutingNumber: recRouting || undefined,
        recipientCountry:       recCountry || undefined,
        // Sender
        senderName:             sendName   || undefined,
        senderAccountNumber:    sendAcc    || undefined,
        senderBankName:         sendBank   || undefined,
        // Wire
        swiftCode:              swift      || undefined,
        ibanNumber:             iban       || undefined,
        // Admin
        adminNotes:             adminNotes || undefined,
      });
      setOk('Transaction updated');
      setTimeout(() => { onDone(); onClose(); }, 1000);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', zIndex: 9100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,.09)', borderRadius: 20, width: '100%', maxWidth: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>Edit Transaction</h3>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0, fontFamily: 'monospace' }}>{tx.referenceNumber} · {tx.userId?.firstName} {tx.userId?.lastName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px' }}><AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span></div>}
          {ok  && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,.09)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, padding: '10px 13px' }}><CheckCircle2 size={13} color="#34d399" /><span style={{ fontSize: 13, color: '#6ee7b7' }}>{ok}</span></div>}

          {/* ── Core ── */}
          <SecHead title="Core Transaction Fields" icon={DollarSign} color="#f59e0b" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Status" />
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                {['pending','processing','completed','failed','cancelled','reversed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Direction" />
              <select value={direction} onChange={e => setDirection(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                <option value="credit">Credit (incoming)</option>
                <option value="debit">Debit (outgoing)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Type" />
              <select value={txType} onChange={e => setTxType(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                {['intrabank_transfer','interbank_transfer','international_transfer','deposit','withdrawal','bill_payment','loan_disbursement','loan_repayment','crypto_purchase','crypto_sale'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Amount" />
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={inp} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Fee" />
              <input type="number" min="0" step="0.01" value={fee} onChange={e => setFee(e.target.value)} style={inp} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Currency" />
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                {['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','NGN','GHS'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Reference Number" />
              <input value={refNum} onChange={e => setRefNum(e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Balance After" />
              <input type="number" min="0" step="0.01" value={balAfter} onChange={e => setBalAfter(e.target.value)} placeholder="Balance shown to user" style={inp} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
              <Lbl t="Description / Narration" />
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Transaction description shown to user" style={inp} onFocus={fg} onBlur={br} />
            </div>
          </div>

          {/* ── Backdating ── */}
          <SecHead title="Dates — Backdating" icon={Calendar} color="#60a5fa" />
          <div style={{ background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 9, padding: '9px 13px', fontSize: 11, color: 'rgba(96,165,250,.8)', lineHeight: 1.6 }}>
            📅 Editing these dates changes what the user sees. Audit log always records the true edit time regardless.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Transaction Date (createdAt)" />
              <input type="datetime-local" value={createdAt} onChange={e => setCreatedAt(e.target.value)} style={{ ...inp, colorScheme: 'dark' }} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Processed / Value Date" />
              <input type="datetime-local" value={processedAt} onChange={e => setProcessedAt(e.target.value)} style={{ ...inp, colorScheme: 'dark' }} onFocus={fg} onBlur={br} />
            </div>
          </div>

          {/* ── Recipient ── */}
          <SecHead title="Recipient Details" icon={User} color="#34d399" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Name" /><input value={recName} onChange={e => setRecName(e.target.value)} placeholder="Full name" style={inp} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Account #" /><input value={recAcc} onChange={e => setRecAcc(e.target.value)} placeholder="Account number" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Bank" /><input value={recBank} onChange={e => setRecBank(e.target.value)} placeholder="Bank name" style={inp} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Routing Number" /><input value={recRouting} onChange={e => setRecRouting(e.target.value)} placeholder="9-digit routing" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Country" /><input value={recCountry} onChange={e => setRecCountry(e.target.value)} placeholder="Country" style={inp} onFocus={fg} onBlur={br} /></div>
          </div>

          {/* ── Sender ── */}
          <SecHead title="Sender Details" icon={Building} color="#f59e0b" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Sender Name" /><input value={sendName} onChange={e => setSendName(e.target.value)} placeholder="Full name" style={inp} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Sender Account #" /><input value={sendAcc} onChange={e => setSendAcc(e.target.value)} placeholder="Account number" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Sender Bank" /><input value={sendBank} onChange={e => setSendBank(e.target.value)} placeholder="Bank name" style={inp} onFocus={fg} onBlur={br} /></div>
          </div>

          {/* ── Wire ── */}
          <SecHead title="Wire / International" icon={Globe} color="#a78bfa" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="SWIFT / BIC" /><input value={swift} onChange={e => setSwift(e.target.value)} placeholder="CHASUS33" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="IBAN Number" /><input value={iban} onChange={e => setIban(e.target.value)} placeholder="IBAN or account number" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} /></div>
          </div>

          {/* ── Admin notes ── */}
          <SecHead title="Admin Notes (internal — never shown to user)" icon={FileText} color="#94a3b8" />
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..."
            rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} onFocus={fg} onBlur={br} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 11, padding: '11px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={submit} disabled={loading || !!ok}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 11, padding: '11px', fontSize: 14, fontWeight: 700, cursor: (loading || !!ok) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (loading || !!ok) ? .7 : 1 }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Block Modal ──────────────────────────────────────────────────────────────
function BlockModal({ tx, onClose, onDone }: { tx: Tx; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setLoading(true);
    try { await adminApi.post('/admin/transactions/block', { transactionId: tx._id, reason: reason || 'Blocked by admin' }); onDone(); onClose(); }
    catch (e: any) { setErr(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)', zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '22px 20px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>Block Transaction?</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: 0, fontFamily: 'monospace' }}>{tx.referenceNumber}</p></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        {err && <div style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,.09)', borderRadius: 8, padding: '8px 12px' }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Lbl t="Reason" /><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason..." style={inp} onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,.5)')} onBlur={br} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? .6 : 1 }}>
            {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}<Lock size={13} /> Block
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTransactionsPage() {
  const [txs,        setTxs]        = useState<Tx[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [mounted,    setMounted]    = useState(false);
  const [editTx,     setEditTx]     = useState<Tx | null>(null);
  const [blockTx,    setBlockTx]    = useState<Tx | null>(null);
  const [actId,      setActId]      = useState<string | null>(null);
  const [toast,      setToast]      = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (page = 1, q = search, st = status, from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const p: any = { page, limit: 20 };
      if (q) p.search = q; if (st) p.status = st; if (from) p.from = from; if (to) p.to = to;
      const res = await adminApi.get('/admin/transactions', { params: p });
      const d = res.data.data ?? res.data;
      setTxs(d.transactions ?? []); setPagination(d.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 });
    } catch {} finally { setLoading(false); }
  }, [search, status, fromDate, toDate]);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  const handleUnblock = async (tx: Tx) => {
    setActId(tx._id);
    try { await adminApi.post(`/admin/transactions/${tx._id}/unblock`); showToast('Transaction unblocked'); load(pagination.page); }
    catch (e: any) { showToast(e.response?.data?.message || 'Failed'); }
    finally { setActId(null); }
  };

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Transactions</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>{pagination.total.toLocaleString()} total</p>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 420 }}>
            <Search size={14} color="rgba(255,255,255,.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); if (deb.current) clearTimeout(deb.current); deb.current = setTimeout(() => load(1, e.target.value, status, fromDate, toDate), 420); }}
              placeholder="Search reference, recipient name…" style={{ ...inp, paddingLeft: 36 }} onFocus={fg} onBlur={br} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); load(1, search, e.target.value, fromDate, toDate); }}
            style={{ ...inp, width: 'auto', minWidth: 150, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
            <option value="">All statuses</option>
            {['pending','processing','completed','failed','cancelled','reversed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {showFilter && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 180 }}>
              <Lbl t="From Date" />
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); load(1, search, status, e.target.value, toDate); }} style={{ ...inp, colorScheme: 'dark' }} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 180 }}>
              <Lbl t="To Date" />
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); load(1, search, status, fromDate, e.target.value); }} style={{ ...inp, colorScheme: 'dark' }} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setFromDate(''); setToDate(''); load(1, search, status, '', ''); }} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        {loading && txs.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : txs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10 }}>
            <Receipt size={36} color="rgba(255,255,255,.1)" />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No transactions found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['Reference', 'User', 'Type', 'Direction', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => {
                  const sc = SC[tx.status] ?? SC.pending;
                  const SIcon = sc.Icon;
                  const isBlocked = tx.status === 'cancelled';
                  const isCompleted = tx.status === 'completed';
                  const acting = actId === tx._id;
                  return (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#fff' }}>{tx.referenceNumber}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1, textTransform: 'capitalize' }}>{tx.type?.replace(/_/g,' ')}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.userId?.firstName} {tx.userId?.lastName}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{tx.userId?.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'capitalize' }}>{(tx.type||'').replace(/_/g,' ')}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: tx.direction === 'credit' ? 'rgba(52,211,153,.1)' : 'rgba(239,68,68,.1)', borderRadius: 7, padding: '4px 8px' }}>
                          {tx.direction === 'credit' ? <ArrowDownLeft size={12} color="#34d399" /> : <ArrowUpRight size={12} color="#f87171" />}
                          <span style={{ fontSize: 11, fontWeight: 700, color: tx.direction === 'credit' ? '#34d399' : '#f87171', textTransform: 'capitalize' }}>{tx.direction}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: tx.direction === 'credit' ? '#34d399' : '#f87171' }}>
                          {tx.direction === 'credit' ? '+' : '-'}{fmtC(tx.amount, tx.currency)}
                        </span>
                        {tx.fee > 0 && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>fee {fmtC(tx.fee, tx.currency)}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                          <SIcon size={10} /> {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,.4)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {formatDateTime(tx.processedAt || tx.createdAt)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setEditTx(tx)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <Pencil size={11} /> Edit
                          </button>
                          {isBlocked ? (
                            <button onClick={() => handleUnblock(tx)} disabled={acting}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: acting ? .5 : 1 }}>
                              {acting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlock size={11} />} Unblock
                            </button>
                          ) : !isCompleted ? (
                            <button onClick={() => setBlockTx(tx)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                              <Lock size={11} /> Block
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Showing {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit,pagination.total)} of {pagination.total.toLocaleString()}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => load(pagination.page-1)} disabled={pagination.page<=1} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page<=1?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)', cursor: pagination.page<=1?'not-allowed':'pointer', fontFamily: 'inherit' }}><ChevronLeft size={15}/> Prev</button>
            {Array.from({length:Math.min(5,pagination.pages)},(_,i)=>{const pg=Math.max(1,Math.min(pagination.pages-4,pagination.page-2))+i;return<button key={pg} onClick={()=>load(pg)} style={{width:34,height:34,borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,background:pg===pagination.page?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,.05)',color:pg===pagination.page?'#050d1a':'rgba(255,255,255,.5)'}}>{pg}</button>;})}
            <button onClick={() => load(pagination.page+1)} disabled={pagination.page>=pagination.pages} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page>=pagination.pages?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)', cursor: pagination.page>=pagination.pages?'not-allowed':'pointer', fontFamily: 'inherit' }}>Next <ChevronRight size={15}/></button>
          </div>
        </div>
      )}

      {editTx  && <EditModal  tx={editTx}  onClose={() => setEditTx(null)}  onDone={() => { showToast('Transaction saved'); load(pagination.page); }} />}
      {blockTx && <BlockModal tx={blockTx} onClose={() => setBlockTx(null)} onDone={() => { showToast('Transaction blocked'); load(pagination.page); }} />}
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111826', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,.5)', zIndex: 9999 }}>✓ {toast}</div>}

      <style>{`*,*::before,*::after{box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}select option{background:#1a2235;color:#fff;}textarea{font-family:inherit;}`}</style>
    </div>
  );
}