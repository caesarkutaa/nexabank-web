'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, X, ChevronDown, AlertCircle, CheckCircle2,
  Clock, XCircle, DollarSign, RefreshCw, Calendar, TrendingUp,
  FileText, Shield, ChevronRight, Banknote, Info,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

// ══ TYPES ══════════════════════════════════════════════════════
interface Loan {
  _id: string;
  loanType: string;
  status: string;
  requestedAmount: number;
  approvedAmount?: number;
  outstandingBalance?: number;
  disbursedAmount?: number;
  interestRate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  purpose: string;
  annualIncomeAtApplication?: number;
  creditScoreAtApplication?: number;
  rejectionReason?: string;
  nextPaymentDate?: string;
  approvedAt?: string;
  disbursedAt?: string;
  paidOffAt?: string;
  createdAt: string;
  repaymentSchedule?: Array<{
    dueDate: string; amount: number; principal: number; interest: number; status: string;
  }>;
}

interface CreditProfile {
  creditScore: number;
  creditRating: string;
  totalCreditLimit: number;
  creditUtilization: number;
  activeLoans: number;
  totalAmountOwed: number;
  tips: string[];
}

interface Account {
  _id: string; accountNumber: string; accountType: string;
  nickname?: string; availableBalance: number; currency: string; status: string;
}

// ══ CONFIG ═════════════════════════════════════════════════════
const LOAN_TYPES = [
  { value: 'personal',       label: 'Personal Loan',       icon: '👤', desc: 'For any personal expense'          },
  { value: 'mortgage',       label: 'Mortgage',             icon: '🏠', desc: 'Home purchase or refinancing'      },
  { value: 'auto',           label: 'Auto Loan',            icon: '🚗', desc: 'Vehicle purchase financing'        },
  { value: 'business',       label: 'Business Loan',        icon: '💼', desc: 'Grow or start your business'       },
  { value: 'student',        label: 'Student Loan',         icon: '🎓', desc: 'Education financing'               },
  { value: 'line_of_credit', label: 'Line of Credit',       icon: '💳', desc: 'Flexible revolving credit'         },
];

const STATUS_CFG: Record<string, { bg: string; color: string; Icon: typeof Clock; label: string }> = {
  pending:      { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', Icon: Clock,        label: 'Pending'      },
  under_review: { bg: 'rgba(96,165,250,.12)', color: '#60a5fa', Icon: FileText,     label: 'Under Review' },
  approved:     { bg: 'rgba(52,211,153,.12)', color: '#34d399', Icon: CheckCircle2, label: 'Approved'     },
  rejected:     { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle,      label: 'Rejected'     },
  active:       { bg: 'rgba(52,211,153,.12)', color: '#34d399', Icon: TrendingUp,   label: 'Active'       },
  paid_off:     { bg: 'rgba(167,139,250,.12)',color: '#a78bfa', Icon: CheckCircle2, label: 'Paid Off'     },
  defaulted:    { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: XCircle,      label: 'Defaulted'    },
};

// ══ FORMATTERS ═════════════════════════════════════════════════
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);
function fmtC(n: number, cur: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n ?? 0); }
  catch { return `${cur} ${(n ?? 0).toFixed(2)}`; }
}
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Credit score bar color
function scoreColor(score: number) {
  if (score >= 750) return '#34d399';
  if (score >= 700) return '#60a5fa';
  if (score >= 650) return '#f59e0b';
  if (score >= 600) return '#fb923c';
  return '#f87171';
}

// ══ SHARED INPUT STYLE ══════════════════════════════════════════
const inp: React.CSSProperties = {
  width: '100%', background: '#1e2940', border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fgGold = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const blrReset = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.15)');

// ══ OTP BOXES ══════════════════════════════════════════════════
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} id={`lotp${i}`} maxLength={1}
          style={{ width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#fff', background: '#1e2940', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 10, outline: 'none', fontFamily: 'monospace', WebkitTextFillColor: '#fff' }}
          value={value[i] ?? ''}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '');
            const a = value.split(''); a[i] = v; onChange(a.join('').slice(0, 6));
            if (v && i < 5) document.getElementById(`lotp${i + 1}`)?.focus();
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.6)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.15)')}
          onKeyDown={e => { if (e.key === 'Backspace' && !value[i] && i > 0) document.getElementById(`lotp${i - 1}`)?.focus(); }}
        />
      ))}
    </div>
  );
}

// ══ APPLY LOAN MODAL ═══════════════════════════════════════════
function ApplyModal({ accounts, onClose, onDone }: {
  accounts: Account[]; onClose: () => void; onDone: () => void;
}) {
  // Field names match ApplyLoanDto EXACTLY:
  // loanType, requestedAmount, termMonths, purpose, annualIncome, collateral
  const [loanType,         setLoanType]         = useState('personal');
  const [requestedAmount,  setRequestedAmount]  = useState('');
  const [termMonths,       setTermMonths]        = useState('24');
  const [purpose,          setPurpose]           = useState('');
  const [annualIncome,     setAnnualIncome]      = useState('');
  const [collateral,       setCollateral]        = useState('');
  const [loading,          setLoading]           = useState(false);

  // Estimated monthly payment preview
  const principal = parseFloat(requestedAmount) || 0;
  const months    = parseInt(termMonths)         || 24;
  // Rough estimate at 10% APR
  const r = 0.10 / 12;
  const estPayment = principal > 0 && months > 0
    ? +(principal * r / (1 - Math.pow(1 + r, -months))).toFixed(2)
    : 0;

  const submit = async () => {
    if (!requestedAmount || parseFloat(requestedAmount) <= 0) return toast.error('Enter a valid loan amount');
    if (!purpose.trim()) return toast.error('Loan purpose is required');
    if (!annualIncome || parseFloat(annualIncome) <= 0) return toast.error('Enter your annual income');
    setLoading(true);
    try {
      // Sending EXACTLY what ApplyLoanDto expects — no extra fields
      await api.post('/loans/apply', {
        loanType,
        requestedAmount: parseFloat(requestedAmount),
        termMonths:      parseInt(termMonths),
        purpose:         purpose.trim(),
        annualIncome:    parseFloat(annualIncome),
        collateral:      collateral.trim() || undefined,
      });
      toast.success('Loan application submitted! We will review within 2 business days.');
      onDone(); onClose();
    } catch (e: any) {
      // Show the first validation message if it comes as an array
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Application failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal" style={{ maxWidth: 540 }}>
        <div className="nx-mhdr">
          <h3 className="nx-mtitle">Apply for a Loan</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Loan type grid */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: 8 }}>Loan Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {LOAN_TYPES.map(t => (
              <button key={t.value} onClick={() => setLoanType(t.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 11, border: `${loanType === t.value ? 1.5 : 1}px solid ${loanType === t.value ? 'rgba(245,158,11,.6)' : 'rgba(255,255,255,.12)'}`, background: loanType === t.value ? 'rgba(245,158,11,.1)' : 'rgba(255,255,255,.03)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: loanType === t.value ? '#f59e0b' : 'rgba(255,255,255,.75)' }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount + Term */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Loan Amount (USD) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>$</span>
              <input type="number" min="100" step="100" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)}
                placeholder="e.g. 10000" style={{ ...inp, paddingLeft: 26 }} onFocus={fgGold} onBlur={blrReset} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[1000, 5000, 10000, 25000, 50000].map(a => (
                <button key={a} onClick={() => setRequestedAmount(String(a))}
                  style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: requestedAmount === String(a) ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.04)', color: requestedAmount === String(a) ? '#f59e0b' : 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'monospace' }}>
                  ${a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Term (Months)</label>
            <div style={{ position: 'relative' }}>
              <select value={termMonths} onChange={e => setTermMonths(e.target.value)}
                style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fgGold} onBlur={blrReset}>
                {[6, 12, 18, 24, 36, 48, 60, 84, 120, 180, 240, 360].map(m => (
                  <option key={m} value={m}>{m} months{m >= 12 ? ` (${m / 12}yr${m > 12 ? 's' : ''})` : ''}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Loan Purpose *</label>
          <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)}
            placeholder="e.g. Home renovation, Debt consolidation, Business expansion..."
            style={inp} onFocus={fgGold} onBlur={blrReset} />
        </div>

        {/* Annual income */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Annual Gross Income (USD) *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>$</span>
            <input type="number" min="1000" step="1000" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)}
              placeholder="e.g. 75000" style={{ ...inp, paddingLeft: 26 }} onFocus={fgGold} onBlur={blrReset} />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Used to assess your debt-to-income ratio</span>
        </div>

        {/* Collateral (optional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Collateral <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>(optional)</span></label>
          <input type="text" value={collateral} onChange={e => setCollateral(e.target.value)}
            placeholder="e.g. Vehicle, Property, Savings account..."
            style={inp} onFocus={fgGold} onBlur={blrReset} />
        </div>

        {/* Estimated payment preview */}
        {estPayment > 0 && (
          <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Estimated Monthly Payment</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>{usd(estPayment)}/mo</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>At ~10% APR · Final rate based on credit profile</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Total Repayment</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{usd(estPayment * months)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(96,165,250,.07)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 10, padding: '10px 13px' }}>
          <Info size={13} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.6 }}>
            Loan approval is subject to credit assessment. Your KYC must be verified. Submitting an application does not guarantee approval.
          </p>
        </div>

        <button className="nx-subbtn" onClick={submit} disabled={loading}>
          {loading ? <><Loader2 size={15} className="nx-spin" /> Submitting…</> : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}

// ══ REPAY MODAL (2-step: initiate → OTP confirm) ═══════════════
function RepayModal({ loan, accounts, onClose, onDone }: {
  loan: Loan; accounts: Account[]; onClose: () => void; onDone: () => void;
}) {
  type Step = 'form' | 'otp';
  const [step,      setStep]      = useState<Step>('form');
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? '');
  const [amount,    setAmount]    = useState(String(loan.monthlyPayment ?? ''));
  const [otp,       setOtp]       = useState('');
  const [loading,   setLoading]   = useState(false);

  const selAcc = accounts.find(a => a._id === accountId);
  const amtNum = parseFloat(amount) || 0;
  const maxPay = Math.min(amtNum, loan.outstandingBalance ?? 0);
  const insuf  = selAcc && amtNum > selAcc.availableBalance;

  const initiate = async () => {
    if (!amtNum || amtNum <= 0) return toast.error('Enter a valid amount');
    if (insuf) return toast.error('Insufficient funds');
    setLoading(true);
    try {
      await api.post('/loans/initiate-repay', {
        loanId:    loan._id,
        accountId,
        amount:    amtNum,
      });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to initiate');
    } finally { setLoading(false); }
  };

  const confirm = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      // LoanRepaymentDto: { loanId, accountId, amount, otp }
      await api.post('/loans/repay', {
        loanId:    loan._id,
        accountId,
        amount:    amtNum,
        otp,
      });
      toast.success('Repayment successful!');
      onDone(); onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Repayment failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal">
        <div className="nx-mhdr">
          <h3 className="nx-mtitle">Loan Repayment</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Loan summary */}
        <div style={{ background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.18)', borderRadius: 12, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>Outstanding Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{usd(loan.outstandingBalance ?? 0)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>Monthly Payment</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>{usd(loan.monthlyPayment ?? 0)}</div>
            </div>
          </div>
        </div>

        {step === 'form' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Payment Amount (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>$</span>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="Amount to pay" style={{ ...inp, paddingLeft: 26 }} onFocus={fgGold} onBlur={blrReset} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {loan.monthlyPayment && (
                  <button onClick={() => setAmount(String(loan.monthlyPayment))}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(52,211,153,.3)', background: 'rgba(52,211,153,.08)', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Monthly {usd(loan.monthlyPayment)}
                  </button>
                )}
                {loan.outstandingBalance && (
                  <button onClick={() => setAmount(String(loan.outstandingBalance))}
                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.08)', color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Pay Off {usd(loan.outstandingBalance)}
                  </button>
                )}
              </div>
              {insuf && <span style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} /> Insufficient funds</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Pay From Account</label>
              <div style={{ position: 'relative' }}>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  style={{ ...inp, appearance: 'none', cursor: 'pointer' }} onFocus={fgGold} onBlur={blrReset}>
                  {accounts.map(a => (
                    <option key={a._id} value={a._id}>
                      [{a.currency}] {a.nickname || a.accountType.replace(/_/g, ' ')} ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance, a.currency)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', pointerEvents: 'none' }} />
              </div>
            </div>

            <button className="nx-subbtn" onClick={initiate} disabled={loading || !amtNum || amtNum <= 0 || !!insuf}>
              {loading ? <><Loader2 size={15} className="nx-spin" /> Sending OTP…</> : 'Continue — Get OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Shield size={26} color="#34d399" />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Authorize Payment</h4>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>
                Enter the 6-digit code sent to your email to pay <strong style={{ color: '#34d399' }}>{usd(amtNum)}</strong>
              </p>
            </div>
            <OtpBoxes value={otp} onChange={setOtp} />
            <button className="nx-subbtn" style={{ background: 'linear-gradient(135deg,#059669,#34d399)', color: '#050d1a' }} onClick={confirm} disabled={loading || otp.length !== 6}>
              {loading ? <><Loader2 size={15} className="nx-spin" /> Processing…</> : `Confirm — Pay ${usd(amtNum)}`}
            </button>
            <button onClick={() => { setStep('form'); setOtp(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ══ LOAN CARD ══════════════════════════════════════════════════
function LoanCard({ loan, onRepay }: { loan: Loan; onRepay: (l: Loan) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[loan.status] ?? STATUS_CFG.pending;
  const { Icon: SIcon, bg, color, label } = cfg;
  const loanTypeCfg = LOAN_TYPES.find(t => t.value === loan.type) ??
    LOAN_TYPES.find(t => t.value === loan.loanType);
  const canRepay = loan.status === 'active' && (loan.outstandingBalance ?? 0) > 0;

  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden', transition: 'border-color .2s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.14)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)')}>

      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 24 }}>{loanTypeCfg?.icon ?? '🏦'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{loanTypeCfg?.label ?? loan.loanType?.replace(/_/g, ' ')}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
              <SIcon size={10} /> {label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{loan.purpose} · Applied {fmtDate(loan.createdAt)}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {usd(loan.approvedAmount ?? loan.requestedAmount)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>
            {loan.status === 'active' ? 'Approved Amount' : 'Requested'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
        {loan.status === 'active' && ([
          { label: 'Outstanding',  val: usd(loan.outstandingBalance ?? 0), color: '#f87171' },
          { label: 'Monthly Pay',  val: usd(loan.monthlyPayment ?? 0),    color: '#f59e0b' },
          { label: 'Interest Rate',val: `${loan.interestRate ?? 0}% APR`, color: '#60a5fa' },
          { label: 'Next Payment', val: fmtDate(loan.nextPaymentDate),    color: '#fff'    },
        ] as const).map(({ label, val, color: c }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c, fontFamily: 'monospace' }}>{val}</div>
          </div>
        ))}
        {loan.status !== 'active' && ([
          { label: 'Requested', val: usd(loan.requestedAmount)               },
          { label: 'Term',      val: `${loan.termMonths} months`             },
          { label: 'Est. Rate', val: `${loan.interestRate ?? '—'}% APR`     },
          { label: 'Status',    val: label                                    },
        ] as const).map(({ label: l, val }) => (
          <div key={l}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Rejection note */}
      {loan.status === 'rejected' && loan.rejectionReason && (
        <div style={{ margin: '0 18px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fca5a5' }}>
          Reason: {loan.rejectionReason}
        </div>
      )}

      {/* Progress bar for active loans */}
      {loan.status === 'active' && loan.approvedAmount && loan.outstandingBalance !== undefined && (
        <div style={{ padding: '0 18px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>
            <span>Paid: {usd(loan.approvedAmount - loan.outstandingBalance)}</span>
            <span>Remaining: {usd(loan.outstandingBalance)}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, ((loan.approvedAmount - loan.outstandingBalance) / loan.approvedAmount) * 100)}%`, background: 'linear-gradient(90deg,#34d399,#059669)', borderRadius: 100, transition: 'width .5s' }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {canRepay && (
          <button onClick={() => onRepay(loan)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#059669,#34d399)', color: '#050d1a', border: 'none', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <DollarSign size={14} /> Make Payment
          </button>
        )}
        {loan.repaymentSchedule && loan.repaymentSchedule.length > 0 && (
          <button onClick={() => setExpanded(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Calendar size={14} /> {expanded ? 'Hide' : 'View'} Schedule
          </button>
        )}
      </div>

      {/* Repayment schedule */}
      {expanded && loan.repaymentSchedule && loan.repaymentSchedule.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', maxHeight: 280, overflowY: 'auto' }}>
          <div style={{ padding: '10px 18px 5px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8 }}>
            <span>Due Date</span><span>Payment</span><span>Principal</span><span>Interest</span><span>Status</span>
          </div>
          {loan.repaymentSchedule.map((row, i) => (
            <div key={i} style={{ padding: '8px 18px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8, fontSize: 12, borderTop: '1px solid rgba(255,255,255,.04)', background: row.status === 'paid' ? 'rgba(52,211,153,.04)' : 'transparent' }}>
              <span style={{ color: 'rgba(255,255,255,.55)' }}>{fmtDate(row.dueDate)}</span>
              <span style={{ fontFamily: 'monospace', color: '#fff' }}>{usd(row.amount)}</span>
              <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,.55)' }}>{usd(row.principal)}</span>
              <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,.55)' }}>{usd(row.interest)}</span>
              <span style={{ color: row.status === 'paid' ? '#34d399' : 'rgba(255,255,255,.4)', textTransform: 'capitalize', fontWeight: 600 }}>{row.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ CREDIT PROFILE CARD ════════════════════════════════════════
function CreditCard({ profile }: { profile: CreditProfile }) {
  const sc = scoreColor(profile.creditScore);
  const pct = Math.min(100, ((profile.creditScore - 300) / (850 - 300)) * 100);
  return (
    <div style={{ background: 'linear-gradient(135deg,#0a2342,#0d2d52)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '22px', position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, background: `radial-gradient(circle,${sc}15,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Credit Score</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: sc, fontFamily: 'monospace', lineHeight: 1 }}>{profile.creditScore}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{profile.creditRating}</div>
          {/* Score bar */}
          <div style={{ marginTop: 12, width: 200 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,#f87171,#f59e0b,#34d399)`, borderRadius: 100 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,.25)' }}>
              <span>300</span><span>Poor</span><span>Good</span><span>850</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
          {[
            { label: 'Credit Limit',   val: usd(profile.totalCreditLimit)          },
            { label: 'Amount Owed',    val: usd(profile.totalAmountOwed)            },
            { label: 'Utilization',    val: `${profile.creditUtilization}%`         },
            { label: 'Active Loans',   val: String(profile.activeLoans)             },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      {profile.tips.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Tips to Improve</div>
          {profile.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <ChevronRight size={11} color={sc} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ MAIN PAGE ══════════════════════════════════════════════════
export default function LoansPage() {
  const [mounted,      setMounted]      = useState(false);
  const [loans,        setLoans]        = useState<Loan[]>([]);
  const [profile,      setProfile]      = useState<CreditProfile | null>(null);
  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showApply,    setShowApply]    = useState(false);
  const [repayLoan,    setRepayLoan]    = useState<Loan | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      const [lR, pR, aR] = await Promise.all([
        api.get('/loans'),
        api.get('/loans/credit-profile'),
        api.get('/accounts'),
      ]);
      setLoans(lR.data.data ?? lR.data ?? []);
      setProfile(pR.data.data ?? pR.data ?? null);
      setAccounts((aR.data.data || []).filter((a: Account) => a.status === 'active'));
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted, load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  const FILTERS = [
    { val: 'all',         label: 'All'          },
    { val: 'active',      label: 'Active'        },
    { val: 'under_review',label: 'Under Review'  },
    { val: 'approved',    label: 'Approved'      },
    { val: 'paid_off',    label: 'Paid Off'      },
    { val: 'rejected',    label: 'Rejected'      },
  ];
  const filtered = activeFilter === 'all' ? loans : loans.filter(l => l.status === activeFilter);
  const activeCount = loans.filter(l => l.status === 'active').length;

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="ttl">Loans & Credit</h1>
          <p className="sub">{loans.length} application{loans.length !== 1 ? 's' : ''} · {activeCount} active loan{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nx-actbtn" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'nx-spin' : ''} />
          </button>
          <button className="addbtn" onClick={() => setShowApply(true)}>
            <Plus size={15} /> Apply for Loan
          </button>
        </div>
      </div>

      {/* Credit profile */}
      {profile && <CreditCard profile={profile} />}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 18 }}>
        {FILTERS.map(({ val, label }) => (
          <button key={val} onClick={() => setActiveFilter(val)}
            style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: activeFilter === val ? '1.5px solid rgba(245,158,11,.5)' : '1px solid rgba(255,255,255,.09)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, background: activeFilter === val ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.04)', color: activeFilter === val ? '#f59e0b' : 'rgba(255,255,255,.5)', transition: 'all .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Loan list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 14 }}>
          <Loader2 size={20} className="nx-spin" color="#f59e0b" /> Loading loans…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 14, background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)', borderRadius: 18, textAlign: 'center', padding: 24 }}>
          <Banknote size={44} color="rgba(255,255,255,.12)" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.4)', margin: '0 0 6px' }}>
              {activeFilter === 'all' ? 'No loan applications yet' : `No ${activeFilter.replace(/_/g, ' ')} loans`}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)', margin: 0 }}>
              {activeFilter === 'all' ? 'Apply for a loan to get started' : 'Try a different filter'}
            </p>
          </div>
          {activeFilter === 'all' && (
            <button className="addbtn" onClick={() => setShowApply(true)} style={{ marginTop: 4 }}>
              <Plus size={15} /> Apply for Loan
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(loan => (
            <LoanCard key={loan._id} loan={loan} onRepay={setRepayLoan} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6, marginTop: 24 }}>
        <AlertCircle size={13} color="rgba(255,255,255,.3)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Loans are subject to credit approval. Interest rates vary based on credit profile and loan type. Your credit score is updated with each successful repayment.</span>
      </div>

      {/* Modals */}
      {showApply && (
        <ApplyModal accounts={accounts} onClose={() => setShowApply(false)} onDone={load} />
      )}
      {repayLoan && (
        <RepayModal loan={repayLoan} accounts={accounts} onClose={() => setRepayLoan(null)} onDone={load} />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .pg { min-height:100vh; background:#0a0f1a; color:#e2e8f0; font-family:'Inter',system-ui,sans-serif; padding:18px 14px; }
        @media(min-width:480px)  { .pg { padding:22px 18px; } }
        @media(min-width:768px)  { .pg { padding:28px 28px; } }
        @media(min-width:1024px) { .pg { padding:36px 40px; } }
        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; gap:12px; flex-wrap:wrap; }
        @media(min-width:640px)  { .hdr { align-items:center; margin-bottom:28px; } }
        .ttl { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.5px; margin:0; }
        @media(min-width:480px)  { .ttl { font-size:22px; } }
        @media(min-width:768px)  { .ttl { font-size:26px; } }
        .sub { color:rgba(255,255,255,.4); font-size:13px; margin:3px 0 0; }
        .addbtn { display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:10px; padding:10px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
        .nx-actbtn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:9px; padding:9px 14px; font-size:13px; font-weight:600; color:rgba(255,255,255,.6); cursor:pointer; font-family:inherit; }
        .nx-actbtn:disabled { opacity:.4; cursor:not-allowed; }
        .nx-over { position:fixed; inset:0; background:rgba(0,0,0,.78); backdrop-filter:blur(6px); z-index:9000; display:flex; align-items:flex-end; justify-content:center; }
        @media(min-width:600px) { .nx-over { align-items:center; padding:16px; } }
        .nx-modal { background:#111826; border:1px solid rgba(255,255,255,.1); border-radius:20px 20px 0 0; padding:22px 18px; width:100%; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
        @media(min-width:600px) { .nx-modal { border-radius:20px; padding:26px; } }
        .nx-mhdr { display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .nx-mtitle { font-size:17px; font-weight:800; color:#fff; margin:0; }
        .nx-xbtn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.5); cursor:pointer; flex-shrink:0; }
        .nx-subbtn { display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:12px; padding:13px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
        .nx-subbtn:disabled { opacity:.5; cursor:not-allowed; }
        select option { background:#1e2940; color:#fff; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .nx-spin { animation:spin 1s linear infinite; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:10px; }
      `}</style>
    </div>
  );
}