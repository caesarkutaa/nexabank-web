'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileCheck2, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, Eye, RefreshCw, DollarSign, Hash, User,
  Building2, StickyNote, Camera, X, ReceiptText, Filter,
  ChevronDown, CalendarClock, BadgeCheck, Banknote,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { formatDate, formatDateTime, getStatusColor } from '../../lib/utils';

// ─── Types — mirror the backend schema exactly ────────────────────────────────
type ChequeStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'cleared';

interface Account {
  _id:           string;
  accountNumber: string;
  accountType:   string;
  nickname?:     string;
  balance:       number;
  currency:      string;
  status:        string;
}

interface Cheque {
  _id:               string;
  accountId:         string;
  chequeNumber:      string;
  payerName:         string;
  payerBank:         string;
  amount:            number;
  memo:              string;
  frontImageUrl:     string;
  backImageUrl?:     string;
  status:            ChequeStatus;
  referenceNumber:   string;
  rejectionReason?:  string;
  fundsAvailableAt?: string;
  availabilityDays?: number;
  clearedAt?:        string;
  reviewedAt?:       string;
  createdAt:         string;
  updatedAt:         string;
}

// ─── Status config matches ChequeStatus enum values ──────────────────────────
type StatusCfg = { label: string; icon: React.ElementType; spin?: boolean };
const STATUS_CFG: Record<ChequeStatus, StatusCfg> = {
  submitted:  { label: 'Submitted',  icon: Clock        },
  reviewing:  { label: 'Reviewing',  icon: Loader2, spin: true },
  approved:   { label: 'Approved',   icon: CheckCircle2 },
  rejected:   { label: 'Rejected',   icon: XCircle      },
  cleared:    { label: 'Cleared',    icon: BadgeCheck   },
};

const TYPE_LABEL: Record<string, string> = {
  checking: 'Checking', savings: 'Savings', money_market: 'Money Market',
};

function fmtAmt(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
  } catch { return `${currency} ${n.toFixed(2)}`; }
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ChequeStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.submitted;
  const Icon = cfg.icon;
  return (
    <span className={`spill ${getStatusColor(status)}`}>
      <Icon size={11} className={cfg.spin ? 'nx-spin' : ''} />
      {cfg.label}
    </span>
  );
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────
function ImageDrop({ label, subLabel, file, onChange, required }: {
  label: string; subLabel: string; required?: boolean;
  file: File | null; onChange: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files[0]; if (f) onChange(f);
      }}
      style={{
        position: 'relative', overflow: 'hidden', height: 120, borderRadius: 12,
        border: `2px dashed ${drag ? '#f59e0b' : file ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.1)'}`,
        background: drag ? 'rgba(245,158,11,.07)' : file ? 'rgba(52,211,153,.05)' : 'rgba(255,255,255,.02)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all .2s', padding: 12, textAlign: 'center',
      }}
    >
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      {preview && (
        <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .3 }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {file ? (
          <>
            <CheckCircle2 size={22} color="#34d399" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{(file.size / 1024).toFixed(0)} KB · click to replace</span>
          </>
        ) : (
          <>
            <Camera size={22} color="rgba(255,255,255,.25)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>
              {label}{required && <span style={{ color: '#f87171' }}> *</span>}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.28)' }}>{subLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ChequeModal({ cheque, currency, onClose }: { cheque: Cheque; currency: string; onClose: () => void }) {
  const fmt = (n: number) => fmtAmt(n, currency);
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>Cheque Details</h3>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontFamily: 'monospace' }}>{cheque.referenceNumber}</span>
          </div>
          <button onClick={onClose} className="xbtn"><X size={15} /></button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>{fmt(cheque.amount)}</span>
          <StatusPill status={cheque.status} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {([
            ['Cheque #',         `#${cheque.chequeNumber}`],
            ['Payer Name',       cheque.payerName],
            ['Payer Bank',       cheque.payerBank],
            ['Memo',             cheque.memo || '—'],
            ['Submitted',        formatDateTime(cheque.createdAt)],
            ['Funds Available',  cheque.fundsAvailableAt ? formatDate(cheque.fundsAvailableAt) : '—'],
            ['Reviewed',         cheque.reviewedAt ? formatDateTime(cheque.reviewedAt) : 'Pending'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>

        {cheque.rejectionReason && (
          <div style={{ marginTop: 14, padding: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,.8)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Rejection Reason</p>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{cheque.rejectionReason}</p>
          </div>
        )}

        {(cheque.frontImageUrl || cheque.backImageUrl) && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cheque Images</p>
            <div style={{ display: 'grid', gridTemplateColumns: cheque.backImageUrl ? '1fr 1fr' : '1fr', gap: 8 }}>
              {[{ url: cheque.frontImageUrl, lbl: 'Front' }, { url: cheque.backImageUrl, lbl: 'Back' }]
                .filter(i => i.url)
                .map(({ url, lbl }) => (
                  <a key={lbl} href={url} target="_blank" rel="noreferrer"
                    style={{ display: 'block', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', textDecoration: 'none' }}>
                    <img src={url!} alt={lbl} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center', margin: '4px 0 6px', fontWeight: 600 }}>{lbl}</p>
                  </a>
                ))}
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 18, width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Cheque Row ───────────────────────────────────────────────────────────────
function ChequeRow({ cheque, currency, onView }: { cheque: Cheque; currency: string; onView: () => void }) {
  const cfg = STATUS_CFG[cheque.status] ?? STATUS_CFG.submitted;
  const Icon = cfg.icon;
  return (
    <div className="crow" onClick={onView}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <div className={`crow-ico ${getStatusColor(cheque.status)}`}>
          <Icon size={13} className={cfg.spin ? 'nx-spin' : ''} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>#{cheque.chequeNumber}</span>
            <StatusPill status={cheque.status} />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.32)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cheque.payerName} · {cheque.payerBank} · {formatDate(cheque.createdAt)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{fmtAmt(cheque.amount, currency)}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.28)', marginTop: 1 }}>{cheque.referenceNumber}</div>
        </div>
        <button className="view-btn" onClick={e => { e.stopPropagation(); onView(); }}><Eye size={13} /></button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChequePage() {
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');

  const [accounts,    setAccounts]    = useState<Account[]>([]);
  const [loadingAccs, setLoadingAccs] = useState(true);

  // Form fields match the backend DTO exactly
  const [form, setForm] = useState({
    accountId: '', chequeNumber: '', payerName: '',
    payerBank: '', amount: '',      memo: '',
  });
  const [frontImg,   setFrontImg]   = useState<File | null>(null);
  const [backImg,    setBackImg]    = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [cheques,        setCheques]        = useState<Cheque[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selected,       setSelected]       = useState<Cheque | null>(null);
  const [filter,         setFilter]         = useState('all');
  const [mounted,        setMounted]        = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    api.get('/accounts')
      .then(res => {
        const all: Account[] = res.data.data || [];
        const active = all.filter(a => a.status === 'active');
        setAccounts(active);
        if (active.length) setForm(f => ({ ...f, accountId: active[0]._id }));
      })
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoadingAccs(false));
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/cheques/history');
      const data = res.data.data ?? res.data;
      setCheques(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load cheque history.'); }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => {
    if (tab === 'history') {
      // Ensure accounts are loaded before fetching history so getCurrency has a populated map
      if (!loadingAccs) fetchHistory();
    }
  }, [tab, fetchHistory, loadingAccs]);

  const handleDeposit = async () => {
    if (!form.accountId)                                   return toast.error('Select an account.');
    if (!form.chequeNumber.trim())                         return toast.error('Cheque number is required.');
    if (!form.payerName.trim())                            return toast.error('Payer name is required.');
    if (!form.payerBank.trim())                            return toast.error('Payer bank is required.');
    if (!form.amount || Number(form.amount) <= 0)          return toast.error('Enter a valid amount.');
    if (!form.memo.trim())                                 return toast.error('Memo is required.');
    if (!frontImg)                                         return toast.error('Front image of the cheque is required.');

    const fd = new FormData();
    fd.append('accountId',    form.accountId);
    fd.append('chequeNumber', form.chequeNumber);
    fd.append('payerName',    form.payerName);
    fd.append('payerBank',    form.payerBank);
    fd.append('amount',       form.amount);
    fd.append('memo',         form.memo);
    fd.append('front',        frontImg);           // ← matches backend: { name: 'front' }
    if (backImg) fd.append('back', backImg);       // ← matches backend: { name: 'back' }

    setSubmitting(true);
    try {
      const res = await api.post('/cheques/deposit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'Cheque submitted successfully!');
      setForm(f => ({ ...f, chequeNumber: '', payerName: '', payerBank: '', amount: '', memo: '' }));
      setFrontImg(null);
      setBackImg(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Deposit failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  // Map accountId → currency so every cheque shows its account's currency
  const accountMap = Object.fromEntries(accounts.map(a => [a._id, a]));
  const selectedCurrency = accountMap[form.accountId]?.currency ?? 'USD';

  const getCurrency = (cheque: Cheque) => accountMap[cheque.accountId]?.currency ?? 'USD';

  const filtered = filter === 'all' ? cheques : cheques.filter(c => c.status === filter);
  const stats = [
    { label: 'Total',    count: cheques.length,                                                                    color: '#e2e8f0' },
    { label: 'Pending',  count: cheques.filter(c => c.status === 'submitted' || c.status === 'reviewing').length,  color: '#f59e0b' },
    { label: 'Cleared',  count: cheques.filter(c => c.status === 'cleared'   || c.status === 'approved').length,   color: '#34d399' },
    { label: 'Rejected', count: cheques.filter(c => c.status === 'rejected').length,                               color: '#f87171' },
  ];

  const fld = (
    key: keyof typeof form, label: string,
    type = 'text', placeholder = '', required = false,
    Icon?: React.ElementType,
  ) => (
    <div>
      <label className="fld-label">{label}{required && <span style={{ color: '#f87171' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} color="rgba(255,255,255,.28)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />}
        <input type={type} placeholder={placeholder} className="nxinput"
          style={{ paddingLeft: Icon ? 34 : 13 }}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        />
      </div>
    </div>
  );

  return (
    <div className="pg">

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="hdr">
        <div>
          <h1 className="title">Cheque Deposit</h1>
          <p className="sub">Submit & track your cheque deposits</p>
        </div>
        <div className="tabs">
          {(['deposit', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? 'tab-active' : ''}`}>
              {t === 'deposit' ? <ReceiptText size={13} /> : <Clock size={13} />}
              <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── DEPOSIT TAB ────────────────────────────────────── */}
      {tab === 'deposit' && (
        <div className="col-gap">

          <div className="info-banner">
            <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.6 }}>
              Cheques under <strong style={{ color: '#f59e0b' }}>$5,500</strong> clear in{' '}
              <strong style={{ color: '#f59e0b' }}>1 business day</strong>; larger amounts in{' '}
              <strong style={{ color: '#f59e0b' }}>2 days</strong>. Funds are held until clearance is confirmed.
            </p>
          </div>

          {/* Account selector */}
          <div className="card">
            <div className="card-head"><Banknote size={15} color="#f59e0b" /><span className="card-title">Deposit To Account</span></div>
            {loadingAccs ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.35)', fontSize: 13 }}>
                <Loader2 size={16} className="nx-spin" /> Loading accounts…
              </div>
            ) : accounts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', margin: 0 }}>No active accounts found.</p>
            ) : (
              <div style={{ position: 'relative' }}>
                <select className="nxinput" style={{ appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                  value={form.accountId}
                  onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.nickname || TYPE_LABEL[a.accountType] || a.accountType} · ····{a.accountNumber.slice(-4)} · {fmtAmt(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            )}
            {/* Currency pill — same pattern as transfers page */}
            {!loadingAccs && selectedCurrency && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#f59e0b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                  {selectedCurrency}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Amounts shown in {selectedCurrency}</span>
              </div>
            )}
          </div>

          {/* Cheque details */}
          <div className="card">
            <div className="card-head"><ReceiptText size={15} color="#f59e0b" /><span className="card-title">Cheque Details</span></div>
            <div className="form-col">
              <div className="two-col">
                {fld('chequeNumber', 'Cheque Number', 'text',   'e.g. 001234', true, Hash)}
                {fld('amount',       `Amount (${selectedCurrency})`, 'number', '0.00', true, DollarSign)}
              </div>
              <div className="two-col">
                {fld('payerName', 'Payer Name', 'text', 'Full name on cheque', true, User)}
                {fld('payerBank', 'Payer Bank', 'text', 'e.g. Chase Bank',     true, Building2)}
              </div>
              <div>
                <label className="fld-label">Memo <span style={{ color: '#f87171' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <StickyNote size={14} color="rgba(255,255,255,.28)" style={{ position: 'absolute', left: 12, top: 12, pointerEvents: 'none' }} />
                  <textarea rows={2} placeholder="Purpose of payment or any reference…" className="nxinput"
                    style={{ paddingLeft: 34, resize: 'none' }}
                    value={form.memo}
                    onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card">
            <div className="card-head"><Camera size={15} color="#f59e0b" /><span className="card-title">Cheque Images</span></div>
            <div className="two-col" style={{ marginBottom: 10 }}>
              <div>
                <label className="fld-label">Front <span style={{ color: '#f87171' }}>*</span></label>
                <ImageDrop label="Upload Front" subLabel="All 4 corners · JPG/PNG/WEBP" required file={frontImg} onChange={setFrontImg} />
              </div>
              <div>
                <label className="fld-label">Back <span style={{ color: 'rgba(255,255,255,.3)' }}>(optional)</span></label>
                <ImageDrop label="Upload Back" subLabel="Endorsement side" file={backImg} onChange={setBackImg} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.28)', margin: 0 }}>Max 10 MB per image. JPEG, PNG, WEBP only.</p>
          </div>

          {/* Availability estimate */}
          {Number(form.amount) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 12, padding: '11px 14px' }}>
              <CalendarClock size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: 0 }}>
                <strong style={{ color: '#60a5fa' }}>{fmtAmt(Number(form.amount), selectedCurrency)}</strong> will be available in{' '}
                <strong style={{ color: '#60a5fa' }}>{Number(form.amount) <= 5500 ? '1 business day' : '2 business days'}</strong> after approval.
              </p>
            </div>
          )}

          <button onClick={handleDeposit} disabled={submitting || loadingAccs} className="submit-btn">
            {submitting
              ? <><Loader2 size={16} className="nx-spin" />Submitting…</>
              : <><FileCheck2 size={16} />Submit Cheque Deposit</>}
          </button>
        </div>
      )}

      {/* ─── HISTORY TAB ────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="col-gap">

          <div className="stats-grid">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'monospace', letterSpacing: '-.5px', lineHeight: 1 }}>{s.count}</span>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Filter size={13} color="rgba(255,255,255,.28)" />
              <div className="filter-pills">
                {['all', 'submitted', 'reviewing', 'approved', 'cleared', 'rejected'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`filter-btn ${filter === f ? 'filter-active' : ''}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={fetchHistory} disabled={loadingHistory} className="refresh-btn">
              <RefreshCw size={13} className={loadingHistory ? 'nx-spin' : ''} /> Refresh
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingHistory ? (
              <div className="empty-state">
                <Loader2 size={26} color="#f59e0b" className="nx-spin" />
                <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14, margin: 0 }}>Loading history…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <FileCheck2 size={36} color="rgba(255,255,255,.1)" />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.35)', margin: 0 }}>No cheques found</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', margin: 0 }}>
                  {filter !== 'all' ? `No ${filter} cheques yet.` : 'Deposit your first cheque to get started.'}
                </p>
                {filter !== 'all' && (
                  <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    View all
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '6px 0' }}>
                {filtered.map(c => <ChequeRow key={c._id} cheque={c} currency={getCurrency(c)} onView={() => setSelected(c)} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {selected && <ChequeModal cheque={selected} currency={getCurrency(selected)} onClose={() => setSelected(null)} />}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .pg { min-height:100vh; background:#0a0f1a; color:#e2e8f0; font-family:'Inter',system-ui,sans-serif; padding:18px 14px; }
        @media(min-width:480px)  { .pg { padding:22px 18px; } }
        @media(min-width:768px)  { .pg { padding:28px 28px; } }
        @media(min-width:1024px) { .pg { padding:36px 40px; max-width:860px; } }

        .col-gap { display:flex; flex-direction:column; gap:14px; }
        @media(min-width:640px) { .col-gap { gap:18px; } }

        /* Header */
        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; gap:10px; flex-wrap:wrap; }
        @media(min-width:640px) { .hdr { margin-bottom:24px; align-items:center; } }
        .title { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.5px; margin:0; }
        @media(min-width:480px) { .title { font-size:22px; } }
        @media(min-width:768px) { .title { font-size:26px; } }
        .sub { color:rgba(255,255,255,.4); font-size:13px; margin:3px 0 0; }

        /* Tabs */
        .tabs { display:flex; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:4px; gap:3px; }
        .tab-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:7px; font-size:12px; font-weight:700; background:transparent; color:rgba(255,255,255,.4); border:none; cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
        @media(min-width:480px) { .tab-btn { padding:7px 15px; font-size:13px; } }
        .tab-active { background:linear-gradient(135deg,#f59e0b,#d97706) !important; color:#050d1a !important; }

        /* Cards */
        .card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:16px; }
        @media(min-width:640px) { .card { border-radius:20px; padding:22px; } }
        .card-head { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
        .card-title { font-size:14px; font-weight:700; color:#fff; }

        /* Grid */
        .two-col { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:420px) { .two-col { grid-template-columns:1fr 1fr; gap:14px; } }
        .form-col { display:flex; flex-direction:column; gap:12px; }
        @media(min-width:640px) { .form-col { gap:14px; } }

        /* Inputs */
        .fld-label { display:block; font-size:12px; color:rgba(255,255,255,.4); font-weight:500; margin-bottom:6px; }
        .nxinput { width:100%; background:#1a2235; border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:10px 13px; font-size:14px; color:#fff; outline:none; font-family:inherit; transition:border-color .2s; -webkit-text-fill-color:#fff; }
        .nxinput::placeholder { color:rgba(255,255,255,.22); }
        .nxinput:focus { border-color:rgba(245,158,11,.5); }

        /* Banner */
        .info-banner { display:flex; align-items:flex-start; gap:10px; background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.2); border-radius:14px; padding:12px 14px; }

        /* Stats */
        .stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
        @media(min-width:640px) { .stats-grid { grid-template-columns:repeat(4,1fr); } }
        .stat-card { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; }
        .stat-label { font-size:12px; color:rgba(255,255,255,.4); font-weight:500; }

        /* Toolbar */
        .toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .filter-pills { display:flex; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:3px; gap:2px; flex-wrap:wrap; }
        .filter-btn { padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700; background:transparent; color:rgba(255,255,255,.38); border:none; cursor:pointer; font-family:inherit; text-transform:capitalize; transition:all .2s; white-space:nowrap; }
        @media(min-width:480px) { .filter-btn { font-size:11px; padding:4px 10px; } }
        .filter-active { background:linear-gradient(135deg,#f59e0b,#d97706) !important; color:#050d1a !important; }
        .refresh-btn { display:inline-flex; align-items:center; gap:5px; background:none; border:none; font-size:12px; color:rgba(255,255,255,.35); cursor:pointer; font-family:inherit; transition:color .2s; white-space:nowrap; }
        .refresh-btn:hover { color:#f59e0b; }

        /* Rows */
        .crow { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; cursor:pointer; transition:background .15s; gap:8px; border-bottom:1px solid rgba(255,255,255,.05); }
        @media(min-width:640px) { .crow { padding:13px 18px; gap:12px; } }
        .crow:last-child { border-bottom:none; }
        .crow:hover { background:rgba(255,255,255,.025); }
        .crow-ico { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid; flex-shrink:0; }
        @media(min-width:480px) { .crow-ico { width:34px; height:34px; } }
        .view-btn { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.4); cursor:pointer; transition:all .2s; flex-shrink:0; }
        .view-btn:hover { color:#f59e0b; border-color:rgba(245,158,11,.35); }

        /* Status pill */
        .spill { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:2px 8px; border-radius:100px; }
        @media(min-width:480px) { .spill { font-size:11px; padding:3px 9px; } }

        /* Empty */
        .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 20px; gap:10px; text-align:center; }

        /* Submit */
        .submit-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:14px; padding:14px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:opacity .2s; }
        .submit-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Modal */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,.78); backdrop-filter:blur(6px); z-index:9000; display:flex; align-items:flex-end; justify-content:center; }
        @media(min-width:640px) { .overlay { align-items:center; padding:16px; } }
        .modal { background:#111826; border:1px solid rgba(255,255,255,.1); border-radius:20px 20px 0 0; padding:22px 18px; width:100%; max-width:460px; max-height:92vh; overflow-y:auto; }
        @media(min-width:640px) { .modal { border-radius:20px; padding:28px; } }
        .xbtn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.5); cursor:pointer; flex-shrink:0; }

        @keyframes nx-spin { to { transform:rotate(360deg); } }
        .nx-spin { animation:nx-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}