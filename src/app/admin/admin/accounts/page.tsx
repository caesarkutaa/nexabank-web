'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, X, Wallet, ArrowUpRight, ArrowDownLeft, Snowflake,
  Flame, Trash2, DollarSign, Send, Globe, Building, CheckCircle2,
  Clock, XCircle, CreditCard, Copy,
} from 'lucide-react';
import adminApi from '../lib/api';
import { formatDate } from '../../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account {
  _id:             string;
  accountNumber:   string;
  routingNumber?:  string;
  accountType:     string;
  status:          string;
  balance:         number;
  availableBalance:number;
  pendingBalance:  number;
  totalDeposited:  number;
  totalWithdrawn:  number;
  currency:        string;
  nickname?:       string;
  isPrimary:       boolean;
  createdAt:       string;
  userId: {
    _id: string; username: string; email: string;
    firstName: string; lastName: string;
  };
}
interface Pagination { total: number; page: number; limit: number; pages: number; }

// ─── Shared styles ────────────────────────────────────────────────────────────
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
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ display: 'inline-block', background: bg, color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{label.replace(/_/g, ' ')}</span>;
}
function fmtC(n: number, cur = 'USD') {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n ?? 0); }
  catch { return `$${(n ?? 0).toFixed(2)}`; }
}
function ini(a?: string, b?: string) { return `${a?.[0] ?? ''}${b?.[0] ?? ''}`.toUpperCase() || 'U'; }
const SC: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  frozen:    { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  suspended: { bg: 'rgba(239,68,68,.12)',   color: '#f87171' },
  pending:   { bg: 'rgba(245,158,11,.12)',  color: '#f59e0b' },
};

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy} title="Copy account number"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: copied ? 'rgba(52,211,153,.15)' : 'rgba(255,255,255,.07)', border: `1px solid ${copied ? 'rgba(52,211,153,.3)' : 'rgba(255,255,255,.1)'}`, borderRadius: 5, cursor: 'pointer', flexShrink: 0, marginLeft: 5, transition: 'all .15s' }}>
      {copied ? <CheckCircle2 size={11} color="#34d399" /> : <Copy size={11} color="rgba(255,255,255,.4)" />}
    </button>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function Confirm({ title, sub, confirmLabel, danger, loading, onConfirm, onClose, children }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)', zIndex: 9200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '22px 20px', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{title}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>{sub}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}><X size={14} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, background: danger ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, color: danger ? '#fff' : '#050d1a', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? .6 : 1 }}>
            {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fund / Transfer Modal ────────────────────────────────────────────────────
function FundModal({ account, onClose, onDone }: { account: Account; onClose: () => void; onDone: () => void }) {
  type Mode = 'credit' | 'debit' | 'intrabank' | 'interbank' | 'international';
  const [mode,         setMode]         = useState<Mode>('credit');
  const [loading,      setLoading]      = useState(false);
  const [err,          setErr]          = useState('');
  const [ok,           setOk]           = useState('');
  const [amount,       setAmount]       = useState('');
  // Credit/Debit sender details — makes the tx look like a real transfer
  const [senderName,   setSenderName]   = useState('');
  const [senderAccNum, setSenderAccNum] = useState('');
  const [senderBank,   setSenderBank]   = useState('NexaBank');
  const [reason,       setReason]       = useState('');
  // Transfer fields
  const [desc,         setDesc]         = useState('');
  const [toAcc,        setToAcc]        = useState('');
  const [recName,      setRecName]      = useState('');
  const [recLookup,    setRecLookup]    = useState<{ name: string; found: boolean } | null>(null);
  const [lookupLoading,setLookupLoading]= useState(false);
  const [routing,      setRouting]      = useState('');
  const [bank,         setBank]         = useState('');
  const [swift,        setSwift]        = useState('');
  const [country,      setCountry]      = useState('');
  const [cur,          setCur]          = useState('USD');
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MODES: { id: Mode; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'credit',        label: 'Deposit',   icon: ArrowDownLeft, color: '#34d399' },
    { id: 'debit',         label: 'Withdraw',  icon: ArrowUpRight,  color: '#f87171' },
    { id: 'intrabank',     label: 'Intrabank', icon: Building,      color: '#f59e0b' },
    { id: 'interbank',     label: 'ACH',       icon: CreditCard,    color: '#60a5fa' },
    { id: 'international', label: 'Wire',      icon: Globe,         color: '#a78bfa' },
  ];

  // Auto-lookup account holder name when account number changes
  const handleAccNumChange = (val: string) => {
    setToAcc(val);
    setRecLookup(null);
    setRecName('');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (val.trim().length < 6) return;
    lookupTimer.current = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await adminApi.get('/admin/accounts', { params: { search: val.trim(), limit: 5 } });
        const accs = (res.data.data ?? res.data).accounts ?? [];
        const match = accs.find((a: any) => a.accountNumber === val.trim());
        if (match) {
          const name = `${match.userId?.firstName ?? ''} ${match.userId?.lastName ?? ''}`.trim();
          setRecLookup({ name, found: true });
          setRecName(name); // auto-fill
        } else {
          setRecLookup({ name: '', found: false });
        }
      } catch { setRecLookup(null); }
      finally { setLookupLoading(false); }
    }, 600);
  };

  const submit = async () => {
    setErr(''); setOk('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setErr('Enter a valid amount');
    setLoading(true);
    try {
      if (mode === 'credit' || mode === 'debit') {
        if (mode === 'credit' && !senderName.trim()) return setErr('Sender name is required');
        await adminApi.post('/admin/accounts/credit-debit', {
          accountId:       account._id,
          amount:          amt,
          type:            mode,
          reason:          reason || (mode === 'credit' ? 'Incoming transfer' : 'Account debit'),
          // Sender details — stored on the transaction so user sees full transfer info
          senderName:      mode === 'credit' ? senderName.trim()   : undefined,
          senderAccount:   mode === 'credit' ? senderAccNum.trim() : undefined,
          senderBank:      mode === 'credit' ? senderBank.trim()   : undefined,
        });
        setOk(`${mode === 'credit' ? 'Deposited' : 'Withdrawn'} ${fmtC(amt, account.currency)} — visible in user transaction history`);
      } else if (mode === 'intrabank') {
        if (!toAcc) return setErr('Recipient account number required');
        await adminApi.post('/admin/accounts/transfer/intrabank', {
          fromAccountId: account._id, toAccountNumber: toAcc, amount: amt,
          description: desc || 'Transfer', recipientName: recName,
        });
        setOk(`Transferred ${fmtC(amt, account.currency)} to ••••${toAcc.slice(-4)}`);
      } else if (mode === 'interbank') {
        if (!toAcc || !routing || !bank || !recName) return setErr('All ACH fields required');
        await adminApi.post('/admin/accounts/transfer/interbank', {
          fromAccountId: account._id, toAccountNumber: toAcc, toRoutingNumber: routing,
          toBankName: bank, recipientName: recName, amount: amt, description: desc || 'ACH Transfer',
        });
        setOk(`ACH transfer of ${fmtC(amt, account.currency)} initiated (1–2 business days)`);
      } else if (mode === 'international') {
        if (!toAcc || !swift || !recName || !bank || !country) return setErr('All wire fields required');
        await adminApi.post('/admin/accounts/transfer/international', {
          fromAccountId: account._id, recipientName: recName, recipientBank: bank,
          swiftCode: swift, ibanNumber: toAcc, recipientCountry: country,
          amount: amt, currency: cur, description: desc || 'International Wire Transfer',
        });
        setOk(`Wire of ${fmtC(amt, cur)} initiated (2–5 business days)`);
      }
      setTimeout(() => { onDone(); onClose(); }, 2000);
    } catch (e: any) { setErr(e.response?.data?.message || 'Operation failed'); }
    finally { setLoading(false); }
  };

  const btnColor = mode === 'debit' ? '#dc2626' : mode === 'international' ? '#7c3aed' : mode === 'interbank' ? '#2563eb' : '#d97706';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px 22px 0 0', padding: '22px 20px 32px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Fund / Transfer</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', margin: 0 }}>••••{account.accountNumber?.slice(-4)} · {account.userId?.firstName} {account.userId?.lastName} · {fmtC(account.balance, account.currency)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer', flexShrink: 0 }}><X size={15} /></button>
        </div>

        {/* Mode tabs — always fully visible, scrollable on small screens */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, flexShrink: 0 }}>
          {MODES.map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => { setMode(id); setErr(''); setOk(''); setRecLookup(null); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: mode === id ? `1px solid ${color}55` : '1px solid rgba(255,255,255,.07)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, background: mode === id ? `${color}1a` : 'rgba(255,255,255,.04)', color: mode === id ? color : 'rgba(255,255,255,.38)', transition: 'all .15s' }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px' }}><AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span></div>}
        {ok  && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,.09)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, padding: '10px 13px' }}><CheckCircle2 size={13} color="#34d399" /><span style={{ fontSize: 13, color: '#6ee7b7' }}>{ok}</span></div>}

        {/* Amount — always shown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Lbl t="Amount" />
          <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" style={{ ...inp, fontSize: 22, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-1px' }} onFocus={fg} onBlur={br} />
        </div>

        {/* ── Credit — full sender details, looks like a real incoming transfer ── */}
        {mode === 'credit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
                <Lbl t="Sender Full Name *" />
                <input value={senderName} onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. James Whitfield, Acme Corp LLC..." style={inp} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Sender Account Number" />
                <input value={senderAccNum} onChange={e => setSenderAccNum(e.target.value)}
                  placeholder="e.g. 4821039274" style={inp} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Sender Bank" />
                <input value={senderBank} onChange={e => setSenderBank(e.target.value)}
                  placeholder="e.g. Chase, Wells Fargo, NexaBank..." style={inp} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
                <Lbl t="Description / Narration" />
                <input value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Salary for March 2026, Invoice #4421, Loan repayment..." style={inp} onFocus={fg} onBlur={br} />
              </div>
            </div>
            <div style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.15)', borderRadius: 9, padding: '10px 13px', fontSize: 11, color: 'rgba(52,211,153,.8)', lineHeight: 1.6 }}>
              The user will see this exactly as an incoming transfer from <strong style={{ color: '#34d399' }}>{senderName || 'the sender'}</strong> — no mention of admin or NexaBank system.
            </div>
          </div>
        )}

        {/* ── Debit — just a description, like a bank charge or withdrawal ── */}
        {mode === 'debit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Lbl t="Description / Narration" />
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Monthly maintenance fee, Returned cheque charge, Loan instalment..." style={inp} onFocus={fg} onBlur={br} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', margin: 0, lineHeight: 1.5 }}>
              This appears as a debit in the user's transaction history with this description only.
            </p>
          </div>
        )}

        {/* ── Intrabank — with auto account name lookup ── */}
        {mode === 'intrabank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Recipient NexaBank Account Number" />
              <div style={{ position: 'relative' }}>
                <input value={toAcc} onChange={e => handleAccNumChange(e.target.value)}
                  placeholder="Enter full account number" style={inp} onFocus={fg} onBlur={br} />
                {lookupLoading && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              {/* Account name lookup result */}
              {recLookup && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, background: recLookup.found ? 'rgba(52,211,153,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${recLookup.found ? 'rgba(52,211,153,.2)' : 'rgba(239,68,68,.2)'}` }}>
                  {recLookup.found
                    ? <><CheckCircle2 size={13} color="#34d399" /><span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{recLookup.name}</span></>
                    : <><AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 12, color: '#f87171' }}>Account not found in NexaBank</span></>
                  }
                </div>
              )}
            </div>
            {/* Name is auto-filled but editable */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Recipient Name" />
              <input value={recName} onChange={e => setRecName(e.target.value)} placeholder="Auto-filled from account lookup" style={{ ...inp, color: recLookup?.found ? '#34d399' : '#fff', WebkitTextFillColor: recLookup?.found ? '#34d399' : '#fff' }} onFocus={fg} onBlur={br} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl t="Description" />
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Transfer note..." style={inp} onFocus={fg} onBlur={br} />
            </div>
          </div>
        )}

        {/* ── ACH ── */}
        {mode === 'interbank' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Account Number" /><input value={toAcc} onChange={e => setToAcc(e.target.value)} placeholder="Account number" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Routing Number" /><input value={routing} onChange={e => setRouting(e.target.value)} placeholder="9-digit routing" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Bank Name" /><input value={bank} onChange={e => setBank(e.target.value)} placeholder="Chase, Wells Fargo..." style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Name" /><input value={recName} onChange={e => setRecName(e.target.value)} placeholder="Full name" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}><Lbl t="Description" /><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Purpose..." style={inp} onFocus={fg} onBlur={br} /></div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(96,165,250,.7)', background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 9, padding: '9px 12px' }}>
              Fee: $2.50 (≤$1,000) · $5.00 (&gt;$1,000) · Settles in 1–2 business days
            </div>
          </>
        )}

        {/* ── Wire ── */}
        {mode === 'international' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Name" /><input value={recName} onChange={e => setRecName(e.target.value)} placeholder="Full name" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Recipient Bank" /><input value={bank} onChange={e => setBank(e.target.value)} placeholder="Bank name" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="SWIFT / BIC" /><input value={swift} onChange={e => setSwift(e.target.value)} placeholder="CHASUS33" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="IBAN / Account #" /><input value={toAcc} onChange={e => setToAcc(e.target.value)} placeholder="IBAN or account number" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Country" /><input value={country} onChange={e => setCountry(e.target.value)} placeholder="United Kingdom" style={inp} onFocus={fg} onBlur={br} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Currency" />
                <select value={cur} onChange={e => setCur(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
                  {['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','NGN','GHS'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}><Lbl t="Description" /><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Wire purpose..." style={inp} onFocus={fg} onBlur={br} /></div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(167,139,250,.7)', background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.15)', borderRadius: 9, padding: '9px 12px' }}>
              Fee: 2% of amount (max $50) · Processes in 2–5 business days
            </div>
          </>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={loading || !!ok}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: `linear-gradient(135deg,${btnColor},${btnColor}bb)`, color: mode === 'debit' || mode === 'international' || mode === 'interbank' ? '#fff' : '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: (loading || !!ok) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (loading || !!ok) ? .7 : 1, marginTop: 2 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
          {mode === 'credit' ? 'Deposit Funds' : mode === 'debit' ? 'Withdraw Funds' : mode === 'intrabank' ? 'Transfer Internally' : mode === 'interbank' ? 'Send ACH Transfer' : 'Send Wire Transfer'}
        </button>
      </div>
    </div>
  );
}

// ─── Create Account Modal ─────────────────────────────────────────────────────
function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ userId: '', accountType: 'checking', initialDeposit: '', nickname: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const u = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr('');
    if (!f.userId.trim()) return setErr('User ID is required');
    setLoading(true);
    try {
      await adminApi.post('/admin/accounts', { userId: f.userId, accountType: f.accountType, initialDeposit: f.initialDeposit ? parseFloat(f.initialDeposit) : undefined, nickname: f.nickname || undefined });
      onDone(); onClose();
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Create Account</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={15} /></button>
        </div>
        {err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px' }}><AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span></div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}><Lbl t="User ID *" /><input value={f.userId} onChange={e => u('userId', e.target.value)} placeholder="MongoDB ObjectId of the user" style={inp} onFocus={fg} onBlur={br} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Account Type" />
            <select value={f.accountType} onChange={e => u('accountType', e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><Lbl t="Initial Deposit ($)" /><input type="number" min="0" value={f.initialDeposit} onChange={e => u('initialDeposit', e.target.value)} placeholder="0.00" style={inp} onFocus={fg} onBlur={br} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}><Lbl t="Nickname (optional)" /><input value={f.nickname} onChange={e => u('nickname', e.target.value)} placeholder="e.g. Main Savings..." style={inp} onFocus={fg} onBlur={br} /></div>
        </div>
        <button onClick={submit} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}Create Account
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAccountsPage() {
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [mounted,    setMounted]    = useState(false);
  const [fundAcc,    setFundAcc]    = useState<Account | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [freezeAcc,  setFreezeAcc]  = useState<Account | null>(null);
  const [deleteAcc,  setDeleteAcc]  = useState<Account | null>(null);
  const [actLoading, setActLoading] = useState(false);
  const [toast,      setToast]      = useState('');
  const deb = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async (page = 1, q = search, st = status) => {
    setLoading(true);
    try {
      const p: any = { page, limit: 20 };
      if (q) p.search = q; if (st) p.status = st;
      const res = await adminApi.get('/admin/accounts', { params: p });
      const d = res.data.data ?? res.data;
      setAccounts(d.accounts ?? []); setPagination(d.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 });
    } catch {} finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  const handleFreeze = async () => {
    if (!freezeAcc) return; setActLoading(true);
    try {
      await adminApi.post(`/admin/accounts/${freezeAcc._id}/${freezeAcc.status === 'frozen' ? 'unfreeze' : 'freeze'}`);
      showToast(`Account ${freezeAcc.status === 'frozen' ? 'unfrozen' : 'frozen'}`); load(pagination.page);
    } catch (e: any) { showToast(e.response?.data?.message || 'Failed'); }
    finally { setActLoading(false); setFreezeAcc(null); }
  };

  const handleDelete = async () => {
    if (!deleteAcc) return; setActLoading(true);
    try {
      // Force-delete regardless of balance — backend now allows it
      await adminApi.delete(`/admin/accounts/${deleteAcc._id}?force=true`);
      showToast('Account deleted'); load(pagination.page);
    } catch (e: any) { showToast(e.response?.data?.message || 'Failed to delete'); }
    finally { setActLoading(false); setDeleteAcc(null); }
  };

  if (!mounted) return null;

  // Stats from current page
  const totalBal = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const totalDep = accounts.reduce((s, a) => s + (a.totalDeposited ?? 0), 0);
  const totalWit = accounts.reduce((s, a) => s + (a.totalWithdrawn ?? 0), 0);
  const frozen   = accounts.filter(a => a.status === 'frozen').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Accounts</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>{pagination.total.toLocaleString()} total accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => load(pagination.page)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, color: 'rgba(255,255,255,.55)', cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={15} /> Create Account
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} color="rgba(255,255,255,.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); if (deb.current) clearTimeout(deb.current); deb.current = setTimeout(() => load(1, e.target.value, status), 420); }}
            placeholder="Search account number…" style={{ ...inp, paddingLeft: 36 }} onFocus={fg} onBlur={br} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); load(1, search, e.target.value); }} style={{ ...inp, width: 'auto', minWidth: 150, appearance: 'none', cursor: 'pointer' }} onFocus={fg} onBlur={br}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Summary stats */}
      {accounts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {[
            { l: 'Total Balance',   v: fmtC(totalBal), c: '#fff'     },
            { l: 'Total Deposited', v: fmtC(totalDep), c: '#34d399'  },
            { l: 'Total Withdrawn', v: fmtC(totalWit), c: '#f87171'  },
            { l: 'Frozen',          v: String(frozen), c: '#60a5fa'  },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: 'monospace', letterSpacing: '-.3px' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', marginTop: 3, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        {loading && accounts.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading accounts…
          </div>
        ) : accounts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10 }}>
            <Wallet size={36} color="rgba(255,255,255,.1)" />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No accounts found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {['Account', 'Owner', 'Type', 'Status', 'Balance', 'Deposited', 'Withdrawn', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => {
                  const sc = SC[acc.status] ?? SC.pending;
                  const isFrozen = acc.status === 'frozen';
                  return (
                    <tr key={acc._id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'monospace', fontSize: 12, letterSpacing: '.03em' }}>{acc.accountNumber}</span>
                          <CopyBtn text={acc.accountNumber} />
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
                          {acc.nickname || acc.currency}
                          {acc.isPrimary && <span style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginLeft: 5 }}>PRIMARY</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#050d1a', flexShrink: 0 }}>
                            {ini(acc.userId?.firstName, acc.userId?.lastName)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{acc.userId?.firstName} {acc.userId?.lastName}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>@{acc.userId?.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}><Pill label={acc.accountType} bg="rgba(245,158,11,.08)" color="#f59e0b" /></td>
                      <td style={{ padding: '12px 14px' }}><Pill label={acc.status} bg={sc.bg} color={sc.color} /></td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{fmtC(acc.balance, acc.currency)}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtC(acc.totalDeposited, acc.currency)}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#f87171', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtC(acc.totalWithdrawn, acc.currency)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setFundAcc(acc)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            <DollarSign size={11} /> Fund
                          </button>
                          <button onClick={() => setFreezeAcc(acc)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: isFrozen ? 'rgba(52,211,153,.1)' : 'rgba(96,165,250,.1)', border: `1px solid ${isFrozen ? 'rgba(52,211,153,.2)' : 'rgba(96,165,250,.2)'}`, borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: isFrozen ? '#34d399' : '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            {isFrozen ? <><Flame size={11} /> Unfreeze</> : <><Snowflake size={11} /> Freeze</>}
                          </button>
                          <button onClick={() => setDeleteAcc(acc)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, color: '#f87171', cursor: 'pointer' }}>
                            <Trash2 size={11} />
                          </button>
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => load(pagination.page - 1)} disabled={pagination.page <= 1} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page <= 1 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}><ChevronLeft size={15} /> Prev</button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
              return <button key={pg} onClick={() => load(pg)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: pg === pagination.page ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,.05)', color: pg === pagination.page ? '#050d1a' : 'rgba(255,255,255,.5)' }}>{pg}</button>;
            })}
            <button onClick={() => load(pagination.page + 1)} disabled={pagination.page >= pagination.pages} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: pagination.page >= pagination.pages ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.6)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Next <ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {fundAcc   && <FundModal account={fundAcc} onClose={() => setFundAcc(null)} onDone={() => load(pagination.page)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={() => load(1)} />}
      {freezeAcc && (
        <Confirm title={freezeAcc.status === 'frozen' ? 'Unfreeze Account?' : 'Freeze Account?'} sub={`••••${freezeAcc.accountNumber?.slice(-4)} · ${freezeAcc.userId?.firstName} ${freezeAcc.userId?.lastName}`} confirmLabel={freezeAcc.status === 'frozen' ? 'Unfreeze' : 'Freeze Account'} loading={actLoading} onConfirm={handleFreeze} onClose={() => setFreezeAcc(null)}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0, lineHeight: 1.6 }}>{freezeAcc.status === 'frozen' ? 'Account will be restored and user can transact again.' : 'User will not be able to make any transactions from this account.'}</p>
        </Confirm>
      )}
      {deleteAcc && (
        <Confirm title="Delete Account?" sub={`••••${deleteAcc.accountNumber?.slice(-4)} · ${deleteAcc.userId?.firstName} ${deleteAcc.userId?.lastName}`} confirmLabel="Delete Permanently" danger loading={actLoading} onConfirm={handleDelete} onClose={() => setDeleteAcc(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deleteAcc.balance > 0 && (
              <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 3 }}>⚠️ Account has funds</div>
                <div style={{ fontSize: 12, color: 'rgba(245,158,11,.8)' }}>This account has a balance of <strong>{fmtC(deleteAcc.balance, deleteAcc.currency)}</strong>. Deleting it will permanently erase these funds. Consider transferring the balance first.</div>
              </div>
            )}
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '11px 13px', fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
              This action is irreversible. The account and all its transaction history will be permanently deleted.
            </div>
          </div>
        </Confirm>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111826', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,.5)', zIndex: 9999 }}>✓ {toast}</div>}

      <style>{`*, *::before, *::after{box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}select option{background:#1a2235;color:#fff;}`}</style>
    </div>
  );
}