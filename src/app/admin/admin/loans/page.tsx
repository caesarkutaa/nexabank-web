'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, RefreshCw, Search, Filter, ChevronDown,
  CheckCircle2, XCircle, Clock, AlertCircle, X,
  DollarSign, Calendar, User, TrendingUp, Banknote,
  FileText, Eye, ChevronRight, BadgeCheck, BarChart3,
} from 'lucide-react';
import adminApi from '../lib/api';

// ══ TYPES ══════════════════════════════════════════════════════
interface Loan {
  _id: string;
  loanType: string;
  status: string;
  requestedAmount: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  outstandingBalance?: number;
  interestRate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  purpose: string;
  collateral?: string;
  creditScoreAtApplication?: number;
  annualIncomeAtApplication?: number;
  debtToIncomeRatio?: number;
  rejectionReason?: string;
  approvedAt?: string;
  disbursedAt?: string;
  nextPaymentDate?: string;
  paidOffAt?: string;
  createdAt: string;
  reviewedBy?: string;
  repaymentSchedule?: Array<{
    dueDate: string; amount: number; principal: number; interest: number; status: string;
  }>;
  userId?: {
    _id: string; username: string; email: string;
    firstName: string; lastName: string; creditScore?: number;
  };
}

// ══ CONFIG ═════════════════════════════════════════════════════
const LOAN_TYPE_CFG: Record<string, { label: string; icon: string; color: string }> = {
  personal:       { label: 'Personal',       icon: '👤', color: '#60a5fa' },
  mortgage:       { label: 'Mortgage',        icon: '🏠', color: '#34d399' },
  auto:           { label: 'Auto',            icon: '🚗', color: '#f59e0b' },
  business:       { label: 'Business',        icon: '💼', color: '#a78bfa' },
  student:        { label: 'Student',         icon: '🎓', color: '#fb923c' },
  line_of_credit: { label: 'Line of Credit',  icon: '💳', color: '#f87171' },
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
  pending:      { label: 'Pending',      bg: 'rgba(255,255,255,.07)',    color: 'rgba(255,255,255,.5)', Icon: Clock        },
  under_review: { label: 'Under Review', bg: 'rgba(96,165,250,.12)',     color: '#60a5fa',              Icon: FileText     },
  approved:     { label: 'Approved',     bg: 'rgba(52,211,153,.12)',     color: '#34d399',              Icon: CheckCircle2 },
  rejected:     { label: 'Rejected',     bg: 'rgba(239,68,68,.12)',      color: '#f87171',              Icon: XCircle      },
  active:       { label: 'Active',       bg: 'rgba(52,211,153,.12)',     color: '#34d399',              Icon: TrendingUp   },
  paid_off:     { label: 'Paid Off',     bg: 'rgba(167,139,250,.12)',    color: '#a78bfa',              Icon: BadgeCheck   },
  defaulted:    { label: 'Defaulted',    bg: 'rgba(239,68,68,.12)',      color: '#f87171',              Icon: AlertCircle  },
};

// ══ FORMATTERS ═════════════════════════════════════════════════
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ══ SHARED INPUT STYLE ══════════════════════════════════════════
const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.1)');
const Lbl = ({ t }: { t: string }) => (
  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>{t}</label>
);

// ══ STATUS BADGE ════════════════════════════════════════════════
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const { Icon } = cfg;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, whiteSpace: 'nowrap' }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

// ══ LOAN DETAIL / ACTION MODAL ══════════════════════════════════
function LoanModal({ loan, onClose, onDone }: {
  loan: Loan; onClose: () => void; onDone: () => void;
}) {
  const [tab,          setTab]          = useState<'details' | 'schedule' | 'approve' | 'decline'>('details');
  const [loading,      setLoading]      = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [err,          setErr]          = useState('');
  const [ok,           setOk]           = useState('');
  const [confirmDisburse, setConfirmDisburse] = useState(false);

  // Approve fields
  const [approvedAmount, setApprovedAmount] = useState(String(loan.requestedAmount));
  const [interestRate,   setInterestRate]   = useState('10.99');

  // Decline fields
  const [reason, setReason] = useState('');

  const ltCfg = LOAN_TYPE_CFG[loan.loanType] ?? { label: loan.loanType, icon: '🏦', color: '#f59e0b' };
  const user  = loan.userId;

  // Estimated monthly payment preview
  const amt   = parseFloat(approvedAmount) || 0;
  const rate  = parseFloat(interestRate) || 10.99;
  const months = loan.termMonths || 12;
  const r     = rate / 100 / 12;
  const estPmt = amt > 0 && months > 0 ? +(amt * r / (1 - Math.pow(1 + r, -months))).toFixed(2) : 0;

  const canApprove  = ['pending', 'under_review'].includes(loan.status);
  const canDecline  = ['pending', 'under_review'].includes(loan.status);
  const canDisburse = loan.status === 'approved';

  const handleApprove = async () => {
    if (!approvedAmount || parseFloat(approvedAmount) <= 0) return;
    setLoading(true); setErr(''); setOk('');
    try {
      await adminApi.post(`/admin/loans/${loan._id}/approve`, {
        approvedAmount: parseFloat(approvedAmount),
        interestRate:   parseFloat(interestRate),
      });
      setOk('Loan approved successfully!');
      setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to approve loan'); }
    finally { setLoading(false); }
  };

  const handleDecline = async () => {
    if (!reason.trim()) return;
    setLoading(true); setErr(''); setOk('');
    try {
      await adminApi.post(`/admin/loans/${loan._id}/decline`, { reason: reason.trim() });
      setOk('Loan declined.');
      setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to decline loan'); }
    finally { setLoading(false); }
  };

  const handleDisburse = async () => {
    setLoading(true); setErr(''); setOk('');
    try {
      await adminApi.post(`/admin/loans/${loan._id}/disburse`, {});
      setOk(`Disbursed ${usd(loan.approvedAmount ?? 0)} successfully!`);
      setConfirmDisburse(false);
      setTimeout(() => { onDone(); onClose(); }, 1400);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to disburse funds'); setConfirmDisburse(false); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', zIndex: 9100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,.09)', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 620, maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '17px 22px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>{ltCfg.icon}</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>{ltCfg.label} Loan</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={loan.status} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{loan._id.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 22px', flexShrink: 0 }}>
          {([
            { id: 'details',  label: 'Details'  },
            { id: 'schedule', label: 'Schedule' },
            ...(canApprove  ? [{ id: 'approve', label: '✓ Approve' }] : []),
            ...(canDecline  ? [{ id: 'decline', label: '✗ Decline' }] : []),
          ] as { id: string; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#f59e0b' : 'transparent'}`, color: tab === t.id ? '#f59e0b' : 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Error / Success banners */}
          {err && (
            <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(239,68,68,.09)',border:'1px solid rgba(239,68,68,.25)',borderRadius:12,padding:'12px 14px' }}>
              <AlertCircle size={15} color="#f87171" style={{ flexShrink:0 }}/>
              <span style={{ fontSize:13,color:'#fca5a5',flex:1 }}>{err}</span>
              <button onClick={()=>setErr('')} style={{ background:'none',border:'none',color:'rgba(255,255,255,.3)',cursor:'pointer',padding:0,display:'flex' }}><X size={14}/></button>
            </div>
          )}
          {ok && (
            <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(52,211,153,.09)',border:'1px solid rgba(52,211,153,.25)',borderRadius:12,padding:'12px 14px' }}>
              <CheckCircle2 size={15} color="#34d399" style={{ flexShrink:0 }}/>
              <span style={{ fontSize:13,color:'#6ee7b7' }}>{ok}</span>
            </div>
          )}

          {/* ── Details tab ── */}
          {tab === 'details' && (
            <>
              {/* Applicant */}
              {user && (
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Applicant</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#050d1a', flexShrink: 0 }}>
                      {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>@{user.username} · {user.email}</div>
                    </div>
                    {user.creditScore && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>Credit Score</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: user.creditScore >= 700 ? '#34d399' : user.creditScore >= 600 ? '#f59e0b' : '#f87171', fontFamily: 'monospace' }}>{user.creditScore}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loan amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Requested',     val: usd(loan.requestedAmount),          color: '#fff'     },
                  { label: 'Approved',       val: usd(loan.approvedAmount ?? 0),      color: '#34d399'  },
                  { label: 'Outstanding',    val: usd(loan.outstandingBalance ?? 0),  color: '#f87171'  },
                  { label: 'Monthly Pay',    val: usd(loan.monthlyPayment ?? 0),      color: '#f59e0b'  },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Loan details grid */}
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, overflow: 'hidden' }}>
                {[
                  { label: 'Loan Type',     val: ltCfg.label                                                      },
                  { label: 'Purpose',       val: loan.purpose                                                      },
                  { label: 'Term',          val: loan.termMonths ? `${loan.termMonths} months` : '—'              },
                  { label: 'Interest Rate', val: loan.interestRate ? `${loan.interestRate}% APR` : '—'            },
                  { label: 'Collateral',    val: loan.collateral || 'None'                                         },
                  { label: 'Annual Income', val: loan.annualIncomeAtApplication ? usd(loan.annualIncomeAtApplication) : '—' },
                  { label: 'Credit Score',  val: loan.creditScoreAtApplication ? String(loan.creditScoreAtApplication) : '—' },
                  { label: 'DTI Ratio',     val: loan.debtToIncomeRatio ? `${loan.debtToIncomeRatio}%` : '—'      },
                  { label: 'Applied',       val: fmtDate(loan.createdAt)                                           },
                  { label: 'Approved',      val: fmtDate(loan.approvedAt)                                          },
                  { label: 'Disbursed',     val: fmtDate(loan.disbursedAt)                                         },
                  { label: 'Next Payment',  val: fmtDate(loan.nextPaymentDate)                                     },
                  { label: 'Paid Off',      val: fmtDate(loan.paidOffAt)                                           },
                ].filter(r => r.val && r.val !== '—').map(({ label, val }, i, arr) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'right' }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Rejection reason */}
              {loan.rejectionReason && (
                <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Rejection Reason</div>
                  <p style={{ fontSize: 13, color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>{loan.rejectionReason}</p>
                </div>
              )}

              {/* Disburse button — only when approved */}
              {canDisburse && !confirmDisburse && (
                <button onClick={() => setConfirmDisburse(true)} disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#059669,#34d399)', color: '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <DollarSign size={15} /> Disburse {usd(loan.approvedAmount ?? 0)} to Account
                </button>
              )}
              {canDisburse && confirmDisburse && (
                <div style={{ background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:14,padding:'16px' }}>
                  <div style={{ fontSize:13,fontWeight:700,color:'#f59e0b',marginBottom:8 }}>⚠️ Confirm Disbursement</div>
                  <p style={{ fontSize:13,color:'rgba(255,255,255,.5)',margin:'0 0 14px',lineHeight:1.6 }}>
                    You are about to disburse <strong style={{ color:'#fff' }}>{usd(loan.approvedAmount ?? 0)}</strong> to <strong style={{ color:'#fff' }}>{user?.firstName} {user?.lastName}</strong>. This action cannot be undone.
                  </p>
                  <div style={{ display:'flex',gap:10 }}>
                    <button onClick={() => setConfirmDisburse(false)} style={{ flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit' }}>Cancel</button>
                    <button onClick={handleDisburse} disabled={loading}
                      style={{ flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'linear-gradient(135deg,#059669,#34d399)',color:'#050d1a',border:'none',borderRadius:10,padding:'10px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.6:1 }}>
                      {loading?<><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Disbursing…</>:<><DollarSign size={14}/> Yes, Disburse Funds</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Schedule tab ── */}
          {tab === 'schedule' && (
            <>
              {loan.repaymentSchedule && loan.repaymentSchedule.length > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 4 }}>
                    {[
                      { label: 'Total Payments', val: loan.repaymentSchedule.length },
                      { label: 'Paid',            val: loan.repaymentSchedule.filter(r => r.status === 'paid').length },
                      { label: 'Remaining',       val: loan.repaymentSchedule.filter(r => r.status !== 'paid').length },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{val}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <span>Due Date</span><span>Payment</span><span>Principal</span><span>Interest</span><span>Status</span>
                    </div>
                    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                      {loan.repaymentSchedule.map((row, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px', padding: '9px 16px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', background: row.status === 'paid' ? 'rgba(52,211,153,.03)' : 'transparent', alignItems: 'center' }}>
                          <span style={{ color: 'rgba(255,255,255,.55)' }}>{fmtDate(row.dueDate)}</span>
                          <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 600 }}>{usd(row.amount)}</span>
                          <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,.5)' }}>{usd(row.principal)}</span>
                          <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,.5)' }}>{usd(row.interest)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: row.status === 'paid' ? '#34d399' : 'rgba(255,255,255,.35)', textTransform: 'capitalize' }}>{row.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 20px', color: 'rgba(255,255,255,.25)', textAlign: 'center' }}>
                  <Calendar size={32} />
                  <p style={{ margin: 0, fontSize: 14 }}>No repayment schedule yet — generated on approval.</p>
                </div>
              )}
            </>
          )}

          {/* ── Approve tab ── */}
          {tab === 'approve' && canApprove && (
            <>
              <div style={{ background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.18)', borderRadius: 12, padding: '13px 15px', fontSize: 13, color: 'rgba(52,211,153,.8)', lineHeight: 1.6 }}>
                Approving will generate a full repayment schedule and notify the applicant. Use <strong>Disburse</strong> after approval to send funds.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <Lbl t="Approved Amount (USD)" />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700, pointerEvents: 'none' }}>$</span>
                    <input type="number" min="1" step="100" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)}
                      style={{ ...inp, paddingLeft: 26 }} onFocus={fg} onBlur={bl} />
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.28)', margin: '5px 0 0' }}>Requested: {usd(loan.requestedAmount)}</p>
                </div>
                <div>
                  <Lbl t="Interest Rate (APR %)" />
                  <input type="number" min="0" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                    style={inp} onFocus={fg} onBlur={bl} />
                </div>
              </div>

              {/* Summary preview */}
              {estPmt > 0 && (
                <div style={{ background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.18)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Approval Preview</div>
                  {[
                    { l: 'Approved Amount', v: usd(parseFloat(approvedAmount) || 0) },
                    { l: 'Interest Rate',   v: `${interestRate}% APR`               },
                    { l: 'Term',            v: `${months} months`                   },
                    { l: 'Est. Monthly Pay',v: usd(estPmt), bold: true              },
                    { l: 'Total Repayment', v: usd(estPmt * months), bold: true     },
                  ].map(({ l, v, bold }) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,.45)' }}>{l}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 500, color: bold ? '#f59e0b' : 'rgba(255,255,255,.7)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleApprove} disabled={loading || !approvedAmount || parseFloat(approvedAmount) <= 0}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#059669,#34d399)', color: '#050d1a', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !approvedAmount ? .5 : 1 }}>
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Approving…</> : <><CheckCircle2 size={15} /> Approve Loan</>}
              </button>
            </>
          )}

          {/* ── Decline tab ── */}
          {tab === 'decline' && canDecline && (
            <>
              <div style={{ background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 12, padding: '13px 15px', fontSize: 13, color: 'rgba(248,113,113,.8)', lineHeight: 1.6 }}>
                Declining will reject this application and notify the applicant with your reason.
              </div>
              <div>
                <Lbl t="Rejection Reason *" />
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Insufficient income for requested amount, high debt-to-income ratio..."
                  rows={4}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={fg} onBlur={bl} />
              </div>
              <button onClick={handleDecline} disabled={loading || !reason.trim()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading || !reason.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading || !reason.trim() ? .5 : 1 }}>
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Declining…</> : <><XCircle size={15} /> Decline Loan</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══ LOAN CARD (list row) ════════════════════════════════════════
function LoanRow({ loan, onClick }: { loan: Loan; onClick: () => void }) {
  const ltCfg = LOAN_TYPE_CFG[loan.loanType] ?? { label: loan.loanType, icon: '🏦', color: '#f59e0b' };
  const user  = loan.userId;
  return (
    <div onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1.2fr 90px', alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer', transition: 'background .15s', gap: 10 }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
      {/* Applicant + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(245,158,11,.05))', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
          {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10 }}>{ltCfg.icon}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ltCfg.label}</span>
          </div>
        </div>
      </div>
      {/* Amount */}
      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#fff' }}>{usd(loan.requestedAmount)}</div>
      {/* Status */}
      <div><StatusBadge status={loan.status} /></div>
      {/* Credit score */}
      <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: (user?.creditScore ?? 0) >= 700 ? '#34d399' : (user?.creditScore ?? 0) >= 600 ? '#f59e0b' : '#f87171' }}>
        {user?.creditScore ?? '—'}
      </div>
      {/* Applied date */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.38)' }}>{fmtDate(loan.createdAt)}</div>
      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
          <Eye size={12} /> View
        </div>
      </div>
    </div>
  );
}

// ══ MAIN PAGE ═══════════════════════════════════════════════════
export default function AdminLoansPage() {
  const [loans,      setLoans]      = useState<Loan[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewLoan,   setViewLoan]   = useState<Loan | null>(null);

  const LIMIT = 20;

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async (p = page, s = search, st = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (s)  params.set('search', s);
      if (st) params.set('status', st);
      const res = await adminApi.get(`/admin/loans?${params}`);
      const d   = res.data.data ?? res.data;
      setLoans(Array.isArray(d.loans) ? d.loans : []);
      setTotal(d.pagination?.total ?? 0);
    } catch {} finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { if (mounted) load(1, search, statusFilter); }, [mounted]);

  const applyFilters = () => { setPage(1); load(1, search, statusFilter); };
  const refresh = () => load(page, search, statusFilter);

  if (!mounted) return null;

  const pages = Math.ceil(total / LIMIT);

  // Summary counts from loaded data
  const counts = {
    under_review: loans.filter(l => l.status === 'under_review').length,
    approved:     loans.filter(l => l.status === 'approved').length,
    active:       loans.filter(l => l.status === 'active').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.5px' }}>Loans</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>{total} total · {counts.under_review} awaiting review</p>
        </div>
        <button onClick={refresh} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Under Review', val: counts.under_review, color: '#60a5fa', bg: 'rgba(96,165,250,.08)', border: 'rgba(96,165,250,.18)', filter: 'under_review' },
          { label: 'Approved',     val: counts.approved,     color: '#34d399', bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.18)', filter: 'approved'     },
          { label: 'Active',       val: counts.active,        color: '#f59e0b', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.18)', filter: 'active'       },
          { label: 'Total',        val: total,                color: '#fff',    bg: 'rgba(255,255,255,.03)',border: 'rgba(255,255,255,.08)', filter: ''             },
        ].map(({ label, val, color, bg, border, filter }) => (
          <button key={label} onClick={() => { setStatusFilter(f => f === filter ? '' : filter); setPage(1); load(1, search, statusFilter === filter ? '' : filter); }}
            style={{ background: statusFilter === filter && filter ? bg : 'rgba(255,255,255,.03)', border: `1px solid ${statusFilter === filter && filter ? border : 'rgba(255,255,255,.07)'}`, borderRadius: 14, padding: '14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace', marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="rgba(255,255,255,.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search by name or email…"
            style={{ ...inp, paddingLeft: 34 }} onFocus={fg} onBlur={bl} />
        </div>
        <div style={{ position: 'relative', minWidth: 160 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); load(1, search, e.target.value); }}
            style={{ ...inp, appearance: 'none', paddingRight: 32, cursor: 'pointer', minWidth: 160 }} onFocus={fg} onBlur={bl}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CFG).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <ChevronDown size={13} color="rgba(255,255,255,.3)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
        <button onClick={applyFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Filter size={13} /> Filter
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 1fr 1.2fr 90px', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.07em', gap: 10 }}>
          <span>Applicant</span><span>Amount</span><span>Status</span><span>Score</span><span>Applied</span><span></span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
            <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading loans…
          </div>
        ) : loans.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 10, padding: 24, textAlign: 'center' }}>
            <Banknote size={36} color="rgba(255,255,255,.1)" />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No loans found</p>
          </div>
        ) : (
          loans.map(loan => <LoanRow key={loan._id} loan={loan} onClick={() => setViewLoan(loan)} />)
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>Page {page} of {pages} · {total} total</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[...Array(Math.min(pages, 7))].map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => { setPage(p); load(p, search, statusFilter); }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: page === p ? '1.5px solid rgba(245,158,11,.5)' : '1px solid rgba(255,255,255,.09)', background: page === p ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.04)', color: page === p ? '#f59e0b' : 'rgba(255,255,255,.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {viewLoan && (
        <LoanModal loan={viewLoan} onClose={() => setViewLoan(null)} onDone={() => { setViewLoan(null); load(page, search, statusFilter); }} />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a2235; color: #fff; }
        textarea { box-sizing: border-box; }
      `}</style>
    </div>
  );
}