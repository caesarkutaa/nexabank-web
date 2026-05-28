'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Droplets, Wifi, Phone, Flame, Shield, Tv, Home,
  FileText, MoreHorizontal, Loader2, X, CheckCircle2,
  AlertCircle, ChevronDown, RefreshCw, Receipt,
  Clock, Filter, ExternalLink,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { formatDate, formatDateTime, getStatusColor } from '../../lib/utils';

// ─── Types — match backend schema exactly ─────────────────────────────────────
type BillCategory = 'electricity'|'water'|'internet'|'phone'|'gas'|'insurance'|'subscription'|'rent'|'cable'|'other';
type BillStatus   = 'pending'|'processing'|'paid'|'failed';

interface Biller {
  name:     string;
  code:     string;
  category: BillCategory;
}

interface Bill {
  _id:             string;
  accountId:       string;
  billerName:      string;
  billerCode:      string;
  accountRef:      string;
  amount:          number;
  category:        BillCategory;
  status:          BillStatus;
  referenceNumber: string;
  paidAt?:         string;
  receiptUrl?:     string;
  description?:    string;
  isRecurring:     boolean;
  recurringDay?:   number;
  failureReason?:  string;
  createdAt:       string;
}

interface Account {
  _id:              string;
  accountNumber:    string;
  accountType:      string;
  nickname?:        string;
  availableBalance: number;
  currency:         string;
  status:           string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtC(n: number, cur: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n ?? 0); }
  catch { return `${cur} ${(n ?? 0).toFixed(2)}`; }
}

const CATEGORY_CFG: Record<BillCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  electricity:  { label: 'Electricity',   icon: Zap,          color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  water:        { label: 'Water',          icon: Droplets,     color: '#60a5fa', bg: 'rgba(96,165,250,.12)'  },
  internet:     { label: 'Internet',       icon: Wifi,         color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
  phone:        { label: 'Phone',          icon: Phone,        color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  gas:          { label: 'Gas',            icon: Flame,        color: '#fb923c', bg: 'rgba(251,146,60,.12)'  },
  insurance:    { label: 'Insurance',      icon: Shield,       color: '#38bdf8', bg: 'rgba(56,189,248,.12)'  },
  subscription: { label: 'Subscription',  icon: Tv,           color: '#f472b6', bg: 'rgba(244,114,182,.12)' },
  rent:         { label: 'Rent',           icon: Home,         color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
  cable:        { label: 'Cable TV',       icon: Tv,           color: '#818cf8', bg: 'rgba(129,140,248,.12)' },
  other:        { label: 'Other',          icon: MoreHorizontal,color:'#94a3b8', bg: 'rgba(148,163,184,.12)' },
};

const STATUS_ICON: Record<BillStatus, React.ElementType> = {
  pending:    Clock,
  processing: Loader2,
  paid:       CheckCircle2,
  failed:     XCircle,
};

function XCircle({ size, color }: { size: number; color?: string }) {
  return <X size={size} color={color} />;
}

// ─── OTP boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '4px 0' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} id={`botp${i}`} maxLength={1}
          style={{ width: 42, height: 50, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#fff', background: '#1e2940', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 10, outline: 'none', fontFamily: 'monospace', caretColor: '#f59e0b', WebkitTextFillColor: '#fff' }}
          value={value[i] ?? ''}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '');
            const a = value.split(''); a[i] = v; onChange(a.join('').slice(0, 6));
            if (v && i < 5) document.getElementById(`botp${i + 1}`)?.focus();
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.6)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.15)')}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && i > 0) document.getElementById(`botp${i - 1}`)?.focus(); }}
        />
      ))}
    </div>
  );
}

// ─── Pay Bill Modal ───────────────────────────────────────────────────────────
function PayModal({ biller, accounts, onClose, onDone }: {
  biller: Biller | null;
  accounts: Account[];
  onClose: () => void;
  onDone: () => void;
}) {
  type Step = 'form' | 'otp' | 'success';
  const [step,       setStep]       = useState<Step>('form');
  const [accountId,  setAccountId]  = useState(accounts[0]?._id ?? '');
  const [accountRef, setAccountRef] = useState('');
  const [amount,     setAmount]     = useState('');
  const [desc,       setDesc]       = useState('');
  const [isRecurring,setIsRecurring]= useState(false);
  const [recurringDay,setRecurringDay] = useState('1');
  const [otp,        setOtp]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [ref,        setRef]        = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const selAcc   = accounts.find(a => a._id === accountId);
  const cur      = selAcc?.currency || 'USD';
  const amtNum   = parseFloat(amount) || 0;
  const catCfg   = biller ? CATEGORY_CFG[biller.category] : CATEGORY_CFG.other;
  const Icon     = catCfg.icon;
  const insuf    = !!selAcc && amtNum > selAcc.availableBalance;

  // Step 1 — initiate → send OTP
  const initiate = async () => {
    if (!accountId)    return toast.error('Select an account');
    if (!accountRef.trim()) return toast.error('Enter your account/reference number with the biller');
    if (!amtNum || amtNum <= 0) return toast.error('Enter a valid amount');
    if (insuf)         return toast.error('Insufficient funds');
    setLoading(true);
    try {
      await api.post('/bills/initiate', {
        accountId,
        billerName:  biller!.name,
        billerCode:  biller!.code,
        accountRef:  accountRef.trim(),
        amount:      amtNum,
        category:    biller!.category,
        description: desc.trim() || `${biller!.name} bill payment`,
        isRecurring,
        ...(isRecurring ? { recurringDay: parseInt(recurringDay) } : {}),
      });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to initiate payment'); }
    finally { setLoading(false); }
  };

  // Step 2 — confirm with OTP
  const confirm = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/bills/confirm', {
        accountId,
        billerName:  biller!.name,
        billerCode:  biller!.code,
        accountRef:  accountRef.trim(),
        amount:      amtNum,
        category:    biller!.category,
        description: desc.trim() || `${biller!.name} bill payment`,
        isRecurring,
        ...(isRecurring ? { recurringDay: parseInt(recurringDay) } : {}),
        otp,
      });
      setRef(res.data.referenceNumber || res.data.data?.referenceNumber || '');
      setReceiptUrl(res.data.receiptUrl || res.data.data?.receiptUrl || '');
      setStep('success');
      toast.success('Bill paid successfully!');
      onDone();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Payment failed. Check OTP and try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal">
        {/* Header */}
        <div className="nx-mhdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: catCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={catCfg.color} />
            </div>
            <div>
              <h3 className="nx-mtitle">{biller?.name ?? 'Pay Bill'}</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0 }}>{catCfg.label}</p>
            </div>
          </div>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── FORM ── */}
        {step === 'form' && (
          <>
            {/* Account */}
            <div className="nx-fg">
              <label className="nx-lbl">Pay From</label>
              <div style={{ position: 'relative' }}>
                <select className="nx-sel" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>
                      [{a.currency}] {a.nickname || a.accountType.replace(/_/g, ' ')} ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance, a.currency)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} color="rgba(255,255,255,.35)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Account ref */}
            <div className="nx-fg">
              <label className="nx-lbl">Account / Meter / Reference Number <span style={{ color: '#f87171' }}>*</span></label>
              <input className="nx-inp" value={accountRef} onChange={e => setAccountRef(e.target.value)}
                placeholder={`Your ${biller?.name ?? 'biller'} account number`} />
            </div>

            {/* Amount */}
            <div className="nx-fg">
              <label className="nx-lbl">Amount ({cur})</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', fontFamily: 'monospace' }}>
                  {cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'NGN' ? '₦' : cur}
                </span>
                <input className="nx-inp" type="number" min="0" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ paddingLeft: 34 }} />
              </div>
              {insuf && (
                <span style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={12} /> Insufficient funds — available: {fmtC(selAcc?.availableBalance ?? 0, cur)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="nx-fg">
              <label className="nx-lbl">Note <span style={{ color: 'rgba(255,255,255,.3)' }}>(optional)</span></label>
              <input className="nx-inp" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. January electricity bill" />
            </div>

            {/* Recurring toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Set as Recurring</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: '2px 0 0' }}>Auto-pay this bill monthly</p>
              </div>
              <button onClick={() => setIsRecurring(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: isRecurring ? '#f59e0b' : 'rgba(255,255,255,.12)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isRecurring ? 23 : 3, transition: 'left .2s' }} />
              </button>
            </div>

            {isRecurring && (
              <div className="nx-fg">
                <label className="nx-lbl">Billing Day of Month</label>
                <input className="nx-inp" type="number" min="1" max="31" value={recurringDay} onChange={e => setRecurringDay(e.target.value)} placeholder="e.g. 15" />
              </div>
            )}

            {/* Fee preview */}
            {amtNum > 0 && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 14px' }}>
                {[
                  { l: 'Amount',  v: fmtC(amtNum, cur) },
                  { l: 'Fee',     v: 'Free' },
                  { l: 'Total',   v: fmtC(amtNum, cur), bold: true },
                ].map(({ l, v, bold }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,.45)' }}>{l}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 500, color: bold ? '#fff' : 'rgba(255,255,255,.65)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="nx-subbtn" onClick={initiate} disabled={loading || !accountId || !accountRef.trim() || amtNum <= 0 || insuf}>
              {loading ? <><Loader2 size={15} className="nx-spin" /> Sending OTP…</> : 'Continue — Get OTP'}
            </button>
          </>
        )}

        {/* ── OTP ── */}
        {step === 'otp' && (
          <>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Shield size={28} color="#f59e0b" />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Verify Payment</h4>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>
                Enter the 6-digit code sent to your email to confirm paying <strong style={{ color: '#f59e0b' }}>{fmtC(amtNum, cur)}</strong> to <strong style={{ color: '#fff' }}>{biller?.name}</strong>.
              </p>
            </div>
            <OtpBoxes value={otp} onChange={setOtp} />
            <button className="nx-subbtn" onClick={confirm} disabled={loading || otp.length !== 6}>
              {loading ? <><Loader2 size={15} className="nx-spin" /> Confirming…</> : 'Confirm Payment'}
            </button>
            <button onClick={() => { setStep('form'); setOtp(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              ← Back
            </button>
          </>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={34} color="#34d399" />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: '#34d399', margin: '0 0 8px' }}>Payment Successful!</h4>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: '0 0 18px' }}>
              {fmtC(amtNum, cur)} paid to <strong style={{ color: '#fff' }}>{biller?.name}</strong>
            </p>
            {ref && (
              <div style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: '0 0 4px' }}>Reference Number</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{ref}</p>
              </div>
            )}
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
                <Receipt size={14} /> Download Receipt <ExternalLink size={12} />
              </a>
            )}
            <button className="nx-subbtn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
      <Styles />
    </div>
  );
}

// ─── Bill History Row ─────────────────────────────────────────────────────────
function BillRow({ bill, accountMap, onView }: {
  bill: Bill;
  accountMap: Map<string, Account>;
  onView: () => void;
}) {
  const catCfg  = CATEGORY_CFG[bill.category] ?? CATEGORY_CFG.other;
  const Icon    = catCfg.icon;
  const StIcon  = STATUS_ICON[bill.status] ?? Clock;
  const cur     = accountMap.get(bill.accountId)?.currency ?? 'USD';

  return (
    <div className="bill-row" onClick={onView}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: catCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={catCfg.color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{bill.billerName}</span>
            <span className={`spill ${getStatusColor(bill.status)}`}>
              <StIcon size={10} className={bill.status === 'processing' ? 'nx-spin' : ''} />
              {bill.status}
            </span>
            {bill.isRecurring && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.2)', padding: '1px 6px', borderRadius: 100 }}>RECURRING</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.32)', display: 'block', marginTop: 1 }}>
            {bill.accountRef} · {bill.paidAt ? formatDate(bill.paidAt) : formatDate(bill.createdAt)}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: bill.status === 'failed' ? '#f87171' : '#fff', fontFamily: 'monospace' }}>
          {fmtC(bill.amount, cur)}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.28)', marginTop: 1 }}>{bill.referenceNumber || '—'}</div>
      </div>
    </div>
  );
}

// ─── Bill Detail Modal ────────────────────────────────────────────────────────
function BillDetailModal({ bill, accountMap, onClose }: {
  bill: Bill;
  accountMap: Map<string, Account>;
  onClose: () => void;
}) {
  const catCfg = CATEGORY_CFG[bill.category] ?? CATEGORY_CFG.other;
  const Icon   = catCfg.icon;
  const cur    = accountMap.get(bill.accountId)?.currency ?? 'USD';

  return (
    <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal" style={{ maxWidth: 440 }}>
        <div className="nx-mhdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: catCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={catCfg.color} />
            </div>
            <h3 className="nx-mtitle">{bill.billerName}</h3>
          </div>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.18)', borderRadius: 12, padding: '13px 16px' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>{fmtC(bill.amount, cur)}</span>
          <span className={`spill ${getStatusColor(bill.status)}`} style={{ fontSize: 12 }}>
            {bill.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {([
            ['Category',    catCfg.label],
            ['Biller Code', bill.billerCode],
            ['Account Ref', bill.accountRef],
            ['Reference',   bill.referenceNumber || '—'],
            ['Paid At',     bill.paidAt ? formatDateTime(bill.paidAt) : '—'],
            ['Submitted',   formatDateTime(bill.createdAt)],
            ['Recurring',   bill.isRecurring ? `Yes — day ${bill.recurringDay ?? '?'} of month` : 'No'],
            ['Note',        bill.description || '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>

        {bill.failureReason && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f87171', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Failure Reason</p>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{bill.failureReason}</p>
          </div>
        )}

        {bill.receiptUrl && (
          <a href={bill.receiptUrl} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: 12, color: '#f59e0b', fontWeight: 600, fontSize: 13, textDecoration: 'none', fontFamily: 'inherit' }}>
            <Receipt size={14} /> Download Receipt <ExternalLink size={12} />
          </a>
        )}

        <button onClick={onClose}
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
      <Styles />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BillsPage() {
  const [mounted,   setMounted]   = useState(false);
  const [tab,       setTab]       = useState<'pay' | 'history'>('pay');
  const [billers,   setBillers]   = useState<Biller[]>([]);
  const [bills,     setBills]     = useState<Bill[]>([]);
  const [accounts,  setAccounts]  = useState<Account[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [payTarget, setPayTarget] = useState<Biller | null>(null);
  const [viewBill,  setViewBill]  = useState<Bill | null>(null);
  const [filter,    setFilter]    = useState('all');
  const [loadingH,  setLoadingH]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadBase = useCallback(async () => {
    try {
      const [bR, aR] = await Promise.all([api.get('/bills/billers'), api.get('/accounts')]);
      setBillers(bR.data.data ?? bR.data ?? []);
      setAccounts((aR.data.data || []).filter((a: Account) => a.status === 'active'));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingH(true);
    try {
      const res = await api.get('/bills/history');
      setBills(Array.isArray(res.data.data ?? res.data) ? (res.data.data ?? res.data) : []);
    } catch { toast.error('Failed to load bill history'); }
    finally { setLoadingH(false); }
  }, []);

  useEffect(() => { if (mounted) loadBase(); }, [loadBase, mounted]);
  useEffect(() => { if (mounted && tab === 'history') loadHistory(); }, [tab, mounted, loadHistory]);

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  const accountMap = new Map(accounts.map(a => [a._id, a]));

  // Group billers by category
  const groups = billers.reduce<Record<string, Biller[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  const primaryCur = accounts[0]?.currency ?? 'USD';
  const totalPaid  = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const filtered   = filter === 'all' ? bills : bills.filter(b => b.status === filter || b.category === filter);

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="ttl">Bill Payments</h1>
          <p className="sub">Pay utilities, subscriptions & more — OTP-secured</p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 4, gap: 3 }}>
          {(['pay', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: tab === t ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'transparent', color: tab === t ? '#050d1a' : 'rgba(255,255,255,.4)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── PAY TAB ─────────────────────────────────────────────── */}
      {tab === 'pay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loading ? (
            <div className="cen"><Loader2 size={20} className="nx-spin" /> Loading billers…</div>
          ) : (
            Object.entries(groups).map(([category, catBillers]) => {
              const cfg  = CATEGORY_CFG[category as BillCategory] ?? CATEGORY_CFG.other;
              const CIcon = cfg.icon;
              return (
                <div key={category}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CIcon size={14} color={cfg.color} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'capitalize' }}>{cfg.label}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.06)', marginLeft: 4 }} />
                  </div>
                  <div className="billers-grid">
                    {catBillers.map(biller => {
                      const BIcon = CATEGORY_CFG[biller.category]?.icon ?? FileText;
                      const bcfg  = CATEGORY_CFG[biller.category] ?? CATEGORY_CFG.other;
                      return (
                        <button key={biller.code} onClick={() => setPayTarget(biller)} className="biller-btn">
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: bcfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, flexShrink: 0 }}>
                            <BIcon size={20} color={bcfg.color} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{biller.name}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{biller.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {accounts.length === 0 && !loading && (
            <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: 0 }}>You need an active account to pay bills.</p>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary */}
          <div className="stats-grid">
            {[
              { l: 'Total Bills',  v: String(bills.length),                            c: '#e2e8f0' },
              { l: 'Paid',         v: String(bills.filter(b => b.status === 'paid').length), c: '#34d399' },
              { l: 'Total Spent',  v: fmtC(totalPaid, primaryCur),                    c: '#f87171' },
              { l: 'Recurring',    v: String(bills.filter(b => b.isRecurring).length), c: '#a78bfa' },
            ].map(({ l, v, c }) => (
              <div key={l} className="scard">
                <div className="scard-l">{l}</div>
                <div className="scard-v" style={{ color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Filter + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Filter size={13} color="rgba(255,255,255,.28)" />
              <div style={{ display: 'flex', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 3, gap: 2, flexWrap: 'wrap' }}>
                {['all', 'paid', 'pending', 'failed'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: filter === f ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'transparent', color: filter === f ? '#050d1a' : 'rgba(255,255,255,.38)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={loadHistory} disabled={loadingH}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontSize: 12, color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} className={loadingH ? 'nx-spin' : ''} /> Refresh
            </button>
          </div>

          {/* List */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden' }}>
            {loadingH ? (
              <div className="cen"><Loader2 size={22} color="#f59e0b" className="nx-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="cen" style={{ flexDirection: 'column', gap: 10, padding: '48px 20px' }}>
                <FileText size={36} color="rgba(255,255,255,.1)" />
                <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14, fontWeight: 600, margin: 0 }}>No bills found</p>
                <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, margin: 0 }}>
                  {filter !== 'all' ? `No ${filter} bills yet.` : 'Pay your first bill to get started.'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '6px 0' }}>
                {filtered.map(b => (
                  <BillRow key={b._id} bill={b} accountMap={accountMap} onView={() => setViewBill(b)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {payTarget && accounts.length > 0 && (
        <PayModal biller={payTarget} accounts={accounts} onClose={() => setPayTarget(null)} onDone={loadHistory} />
      )}
      {viewBill && (
        <BillDetailModal bill={viewBill} accountMap={accountMap} onClose={() => setViewBill(null)} />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .pg { min-height:100vh; background:#0a0f1a; color:#e2e8f0; font-family:'Inter',system-ui,sans-serif; padding:18px 14px; }
        @media(min-width:480px)  { .pg { padding:22px 18px; } }
        @media(min-width:768px)  { .pg { padding:28px 28px; } }
        @media(min-width:1024px) { .pg { padding:36px 40px; } }

        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; gap:12px; flex-wrap:wrap; }
        @media(min-width:640px) { .hdr { align-items:center; margin-bottom:28px; } }
        .ttl { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.5px; margin:0; }
        @media(min-width:480px) { .ttl { font-size:22px; } }
        @media(min-width:768px) { .ttl { font-size:26px; } }
        .sub { color:rgba(255,255,255,.4); font-size:13px; margin:3px 0 0; }

        .billers-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        @media(min-width:400px) { .billers-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:640px) { .billers-grid { grid-template-columns:repeat(4,1fr); gap:12px; } }
        @media(min-width:900px) { .billers-grid { grid-template-columns:repeat(5,1fr); } }

        .biller-btn { display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px 10px 12px; cursor:pointer; font-family:inherit; transition:all .2s; }
        .biller-btn:hover { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); transform:translateY(-2px); }

        .stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        @media(min-width:640px) { .stats-grid { grid-template-columns:repeat(4,1fr); } }
        .scard { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:13px 14px; }
        .scard-l { font-size:11px; color:rgba(255,255,255,.4); margin-bottom:5px; }
        .scard-v { font-size:16px; font-weight:800; letter-spacing:-.3px; font-family:monospace; word-break:break-all; }

        .bill-row { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; cursor:pointer; transition:background .15s; gap:10px; border-bottom:1px solid rgba(255,255,255,.05); }
        @media(min-width:640px) { .bill-row { padding:13px 18px; } }
        .bill-row:last-child { border-bottom:none; }
        .bill-row:hover { background:rgba(255,255,255,.025); }

        .spill { display:inline-flex; align-items:center; gap:3px; font-size:10px; font-weight:700; padding:2px 7px; border-radius:100px; }

        .cen { display:flex; align-items:center; justify-content:center; gap:10px; padding:48px 20px; color:rgba(255,255,255,.35); font-size:14px; }

        @keyframes nx-spin { to { transform:rotate(360deg); } }
        .nx-spin { animation:nx-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      .nx-over { position:fixed; inset:0; background:rgba(0,0,0,.78); backdrop-filter:blur(6px); z-index:9000; display:flex; align-items:flex-end; justify-content:center; }
      @media(min-width:600px) { .nx-over { align-items:center; padding:16px; } }
      .nx-modal { background:#111826; border:1px solid rgba(255,255,255,.1); border-radius:20px 20px 0 0; padding:22px 18px; width:100%; max-width:460px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
      @media(min-width:600px) { .nx-modal { border-radius:20px; padding:26px; } }
      .nx-mhdr { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
      .nx-mtitle { font-size:17px; font-weight:800; color:#fff; margin:0; }
      .nx-xbtn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.5); cursor:pointer; flex-shrink:0; }
      .nx-fg { display:flex; flex-direction:column; gap:6px; }
      .nx-lbl { font-size:12px; font-weight:600; color:rgba(255,255,255,.6); }
      .nx-sel { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; appearance:none; cursor:pointer; }
      .nx-sel option { background:#1e2940; color:#fff; }
      .nx-inp { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; transition:border-color .2s; }
      .nx-inp::placeholder { color:rgba(255,255,255,.28); }
      .nx-inp:focus { border-color:rgba(245,158,11,.5); }
      .nx-subbtn { display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:12px; padding:13px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
      .nx-subbtn:disabled { opacity:.5; cursor:not-allowed; }
      @keyframes nx-spin { to { transform:rotate(360deg); } }
      .nx-spin { animation:nx-spin 1s linear infinite; }
    `}</style>
  );
}