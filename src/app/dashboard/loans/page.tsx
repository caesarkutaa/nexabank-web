'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Loader2, X, ChevronDown,
  AlertCircle, DollarSign, Clock, Calendar,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Loan {
  _id: string;
  loanType: string;
  loanPurpose?: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: 'pending'|'under_review'|'approved'|'disbursed'|'active'|'completed'|'rejected'|'defaulted';
  disbursedAt?: string;
  nextPaymentDate?: string;
  totalPaid: number;
  totalPayable: number;
  creditScore?: number;
  rejectionReason?: string;
  currency?: string;
  createdAt: string;
}

interface Account {
  _id: string;
  accountNumber: string;
  accountType: string;
  nickname?: string;
  availableBalance: number;
  currency: string;
  status: string;
}

/* ── Currency formatter ── */
function fmtC(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style:'currency', currency: currency||'USD', minimumFractionDigits:2,
    }).format(amount);
  } catch {
    return `${currency||'USD'} ${amount.toFixed(2)}`;
  }
}

const fmtD = (d: string) =>
  new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', year:'numeric' }).format(new Date(d));

const LOAN_TYPES = [
  { id:'personal',  label:'Personal Loan',  rate:'8–15% APR',  max:'50,000' },
  { id:'auto',      label:'Auto Loan',       rate:'5–10% APR',  max:'80,000' },
  { id:'mortgage',  label:'Mortgage',        rate:'3–7% APR',   max:'1,000,000' },
  { id:'business',  label:'Business Loan',   rate:'7–20% APR',  max:'500,000' },
  { id:'student',   label:'Student Loan',    rate:'4–8% APR',   max:'100,000' },
  { id:'emergency', label:'Emergency Loan',  rate:'10–18% APR', max:'10,000' },
];
const TERMS = [6,12,18,24,36,48,60];

const STATUS_STYLE: Record<string,{bg:string;c:string}> = {
  pending:      {bg:'rgba(251,191,36,.12)',  c:'#fbbf24'},
  under_review: {bg:'rgba(96,165,250,.12)',  c:'#60a5fa'},
  approved:     {bg:'rgba(52,211,153,.12)',  c:'#34d399'},
  disbursed:    {bg:'rgba(52,211,153,.12)',  c:'#34d399'},
  active:       {bg:'rgba(52,211,153,.12)',  c:'#34d399'},
  completed:    {bg:'rgba(156,163,175,.12)', c:'#9ca3af'},
  rejected:     {bg:'rgba(248,113,113,.12)', c:'#f87171'},
  defaulted:    {bg:'rgba(248,113,113,.12)', c:'#f87171'},
};

/* ── Apply Modal ── */
function ApplyModal({ accounts, onClose, onDone }: {
  accounts: Account[]; onClose:()=>void; onDone:()=>void;
}) {
  const [loanType,   setLoanType]   = useState('personal');
  const [amount,     setAmount]     = useState('');
  const [term,       setTerm]       = useState(12);
  const [purpose,    setPurpose]    = useState('');
  const [accountId,  setAccountId]  = useState(accounts[0]?._id ?? '');
  const [employment, setEmployment] = useState('employed');
  const [income,     setIncome]     = useState('');
  const [loading,    setLoading]    = useState(false);

  const selAcc  = accounts.find(a => a._id===accountId);
  const cur     = selAcc?.currency || 'USD';
  const f       = (n: number) => fmtC(n, cur);
  const num     = parseFloat(amount) || 0;
  const estRate = 12;
  const monthlyEst = num>0 ? (num*(estRate/100/12))/(1-Math.pow(1+estRate/100/12,-term)) : 0;

  const submit = async () => {
    if (!amount||num<=0) return toast.error('Enter loan amount');
    if (!accountId) return toast.error('Select disbursement account');
    setLoading(true);
    try {
      await api.post('/loans/apply', {
        loanType, amount:num, termMonths:term, loanPurpose:purpose,
        disbursementAccountId:accountId, employmentStatus:employment,
        monthlyIncome: parseFloat(income)||undefined,
      });
      toast.success('Loan application submitted!');
      onDone(); onClose();
    } catch (e:any) { toast.error(e.response?.data?.message||'Application failed'); }
    finally { setLoading(false); }
  };

  /* currency symbol for prefix */
  const sym = (() => { try { return (0).toLocaleString(undefined,{style:'currency',currency:cur,minimumFractionDigits:0,maximumFractionDigits:0}).replace(/\d/g,'').trim(); } catch { return cur; } })();

  return (
    <div className="nx-over">
      <div className="nx-modal" style={{ maxWidth:520 }}>
        <div className="nx-mhdr">
          <h3 className="nx-mtitle">Apply for a Loan</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="nx-fg">
          <label className="nx-lbl">Loan Type</label>
          <div className="ltypes">
            {LOAN_TYPES.map(t => (
              <button key={t.id} onClick={() => setLoanType(t.id)}
                className={`ltype-btn ${loanType===t.id?'ltype-on':''}`}>
                <span className="ltype-label">{t.label}</span>
                <span className="ltype-meta">{t.rate} · up to {cur==='USD'?'$':sym}{t.max}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="nx-fg">
            <label className="nx-lbl">Amount ({cur})</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:700, pointerEvents:'none', fontFamily:'monospace' }}>{sym}</span>
              <input className="nx-inp" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="e.g. 5000" style={{ paddingLeft: sym.length>2?40:26 }}/>
            </div>
          </div>
          <div className="nx-fg">
            <label className="nx-lbl">Term</label>
            <div className="nx-selwrap">
              <select className="nx-sel" value={term} onChange={e=>setTerm(Number(e.target.value))}>
                {TERMS.map(t => <option key={t} value={t}>{t} months</option>)}
              </select>
              <ChevronDown size={13} className="nx-sel-ico"/>
            </div>
          </div>
        </div>

        <div className="nx-fg">
          <label className="nx-lbl">Purpose <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400 }}>(optional)</span></label>
          <input className="nx-inp" value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="e.g. Home renovation, debt consolidation"/>
        </div>

        <div className="nx-fg">
          <label className="nx-lbl">Disbursement Account</label>
          <div className="nx-selwrap">
            <select className="nx-sel" value={accountId} onChange={e=>setAccountId(e.target.value)}>
              {accounts.map(a => (
                <option key={a._id} value={a._id}>
                  [{a.currency||'USD'}] {a.nickname||a.accountType?.replace(/_/g,' ')} ···{a.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="nx-sel-ico"/>
          </div>
        </div>

        <div className="form-row">
          <div className="nx-fg">
            <label className="nx-lbl">Employment Status</label>
            <div className="nx-selwrap">
              <select className="nx-sel" value={employment} onChange={e=>setEmployment(e.target.value)}>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
              <ChevronDown size={13} className="nx-sel-ico"/>
            </div>
          </div>
          <div className="nx-fg">
            <label className="nx-lbl">Monthly Income <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400 }}>(opt.)</span></label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:700, pointerEvents:'none', fontFamily:'monospace' }}>{sym}</span>
              <input className="nx-inp" type="number" value={income} onChange={e=>setIncome(e.target.value)} placeholder="0" style={{ paddingLeft:sym.length>2?40:26 }}/>
            </div>
          </div>
        </div>

        {num>0 && (
          <div className="est-box">
            <div className="est-title">Estimated Monthly Payment</div>
            <div className="est-amount">{f(monthlyEst)}</div>
            <div className="est-note">~{estRate}% APR over {term} months · actual rate based on credit profile</div>
          </div>
        )}

        <button className="nx-subbtn" onClick={submit} disabled={loading||num<=0||!accountId}>
          {loading?<><Loader2 size={15} className="nx-spin"/> Submitting…</>:'Submit Application'}
        </button>
      </div>
      <LS/>
    </div>
  );
}

/* ── Repay Modal ── */
function RepayModal({ loan, accounts, onClose, onDone }: {
  loan:Loan; accounts:Account[]; onClose:()=>void; onDone:()=>void;
}) {
  const [amount,    setAmount]    = useState(String(loan.monthlyPayment.toFixed(2)));
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? '');
  const [loading,   setLoading]   = useState(false);

  const selAcc = accounts.find(a => a._id===accountId);
  const cur    = loan.currency || selAcc?.currency || 'USD';
  const f      = (n: number) => fmtC(n, cur);

  const submit = async () => {
    const num = parseFloat(amount);
    if (!num||num<=0) return toast.error('Enter repayment amount');
    setLoading(true);
    try {
      await api.post(`/loans/${loan._id}/repay`, { amount:num, paymentAccountId:accountId });
      toast.success('Payment processed!'); onDone(); onClose();
    } catch (e:any) { toast.error(e.response?.data?.message||'Payment failed'); }
    finally { setLoading(false); }
  };

  const sym = (() => { try { return (0).toLocaleString(undefined,{style:'currency',currency:cur,minimumFractionDigits:0,maximumFractionDigits:0}).replace(/\d/g,'').trim(); } catch { return cur; } })();

  return (
    <div className="nx-over">
      <div className="nx-modal" style={{ maxWidth:400 }}>
        <div className="nx-mhdr">
          <h3 className="nx-mtitle">Make a Payment</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="linfo-box">
          {[
            { l:'Outstanding Balance', v:f(loan.outstandingBalance) },
            { l:'Monthly Payment',     v:f(loan.monthlyPayment) },
            ...(loan.nextPaymentDate ? [{ l:'Next Due Date', v:fmtD(loan.nextPaymentDate) }] : []),
          ].map(({ l, v }) => (
            <div key={l} className="linfo-row"><span>{l}</span><strong>{v}</strong></div>
          ))}
        </div>
        <div className="nx-fg">
          <label className="nx-lbl">Payment Amount ({cur})</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.4)', fontSize:13, fontWeight:700, pointerEvents:'none', fontFamily:'monospace' }}>{sym}</span>
            <input className="nx-inp" type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ paddingLeft:sym.length>2?40:26 }}/>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {[{ l:'Monthly', v:loan.monthlyPayment }, { l:'Full Balance', v:loan.outstandingBalance }].map(({ l, v }) => (
              <button key={l} onClick={() => setAmount(v.toFixed(2))}
                style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', color:'#f59e0b', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:7, cursor:'pointer', fontFamily:'inherit' }}>
                {l}: {f(v)}
              </button>
            ))}
          </div>
        </div>
        <div className="nx-fg">
          <label className="nx-lbl">Pay From Account</label>
          <div className="nx-selwrap">
            <select className="nx-sel" value={accountId} onChange={e=>setAccountId(e.target.value)}>
              {accounts.map(a => (
                <option key={a._id} value={a._id}>
                  [{a.currency||'USD'}] {a.nickname||a.accountType?.replace(/_/g,' ')} ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance, a.currency||'USD')}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="nx-sel-ico"/>
          </div>
        </div>
        <button className="nx-subbtn" onClick={submit} disabled={loading||!parseFloat(amount)}>
          {loading?<><Loader2 size={15} className="nx-spin"/> Processing…</>:'Make Payment'}
        </button>
      </div>
      <LS/>
    </div>
  );
}

/* ── Main ── */
export default function LoansPage() {
  const [mounted,   setMounted]   = useState(false);
  const [loans,     setLoans]     = useState<Loan[]>([]);
  const [accounts,  setAccounts]  = useState<Account[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [applying,  setApplying]  = useState(false);
  const [repaying,  setRepaying]  = useState<Loan|null>(null);
  const [expanded,  setExpanded]  = useState<string|null>(null);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      const [lR, aR] = await Promise.all([api.get('/loans'), api.get('/accounts')]);
      setLoans(lR.data.data || []);
      setAccounts((aR.data.data||[]).filter((a:Account) => a.status==='active'));
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [load, mounted]);
  if (!mounted) return <div style={{ minHeight:'100vh', background:'#0a0f1a' }}/>;

  /* Use primary account currency for summary totals */
  const primaryCur    = accounts.find(a => a.currency)?.currency || 'USD';
  const active        = loans.filter(l => ['active','disbursed'].includes(l.status));
  const pending       = loans.filter(l => ['pending','under_review','approved'].includes(l.status));
  const completed     = loans.filter(l => ['completed','rejected','defaulted'].includes(l.status));
  const totalOutstanding = active.reduce((s,l) => s+l.outstandingBalance, 0);
  const totalMonthly     = active.reduce((s,l) => s+l.monthlyPayment,     0);
  const sf = (n: number) => fmtC(n, primaryCur);

  return (
    <div className="pg">
      <div className="hdr">
        <div>
          <h1 className="ttl">Loans</h1>
          <p className="sub">Personal, auto, mortgage and business loans</p>
        </div>
        <button className="addbtn" onClick={() => setApplying(true)} disabled={accounts.length===0}>
          <Plus size={15}/> Apply for a Loan
        </button>
      </div>

      <div className="stats-grid">
        {[
          { l:'Active Loans',      v:String(active.length),  Icon:Building2, c:'#34d399' },
          { l:'Pending',           v:String(pending.length),  Icon:Clock,     c:'#fbbf24' },
          { l:'Total Outstanding', v:sf(totalOutstanding),    Icon:DollarSign,c:'#f87171' },
          { l:'Monthly Due',       v:sf(totalMonthly),        Icon:Calendar,  c:'#f59e0b' },
        ].map(({ l, v, Icon, c }) => (
          <div key={l} className="scard">
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
              <Icon size={13} color={c}/>
              <span className="scard-l">{l}</span>
            </div>
            <div className="scard-v" style={{ color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="cen"><Loader2 size={20} className="nx-spin"/> Loading loans…</div>
      ) : loans.length===0 ? (
        <div className="empty">
          <Building2 size={40} color="rgba(255,255,255,.12)"/>
          <p>No loans yet. Apply for your first loan above.</p>
          {accounts.length===0 && <p style={{ color:'#fbbf24', fontSize:13 }}>⚠ You need an active account first.</p>}
        </div>
      ) : (
        <div className="loans-list">
          {[...active, ...pending, ...completed].map(loan => {
            const ss      = STATUS_STYLE[loan.status] ?? STATUS_STYLE.pending;
            const isExp   = expanded===loan._id;
            const canRepay= ['active','disbursed'].includes(loan.status);
            const progress= loan.totalPayable>0 ? Math.min((loan.totalPaid/loan.totalPayable)*100,100) : 0;
            /* Use loan's own currency if available, otherwise primary account */
            const lc      = loan.currency || primaryCur;
            const lf      = (n:number) => fmtC(n, lc);

            return (
              <div key={loan._id} className="lcard">
                <button className="lcard-hdr" onClick={() => setExpanded(isExp?null:loan._id)}>
                  <div className="lcard-hdr-left">
                    <div className="lcard-ico" style={{ background:`${ss.c}18` }}>
                      <Building2 size={16} color={ss.c}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div className="lcard-title">
                        {loan.loanType.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} Loan
                        {loan.loanPurpose && <span style={{ fontSize:12, color:'rgba(255,255,255,.35)', fontWeight:400, marginLeft:8 }}>{loan.loanPurpose}</span>}
                      </div>
                      <div className="lcard-meta">
                        {lf(loan.principalAmount)} · {loan.termMonths}mo · {loan.interestRate}% APR
                        <span style={{ marginLeft:8, fontSize:11, color:'rgba(255,255,255,.3)' }}>{fmtD(loan.createdAt)}</span>
                        <span style={{ marginLeft:8, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', color:'#f59e0b', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:100, verticalAlign:'middle' }}>{lc}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <span className="spill" style={{ background:ss.bg, color:ss.c }}>
                      {loan.status.replace(/_/g,' ').toUpperCase()}
                    </span>
                    <ChevronDown size={16} color="rgba(255,255,255,.3)"
                      style={{ transform:isExp?'rotate(180deg)':'none', transition:'transform .2s' }}/>
                  </div>
                </button>

                {isExp && (
                  <div className="lcard-body">
                    {canRepay && loan.totalPayable>0 && (
                      <div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
                          <span style={{ color:'rgba(255,255,255,.45)' }}>Repayment Progress</span>
                          <span style={{ color:'white', fontWeight:600 }}>{progress.toFixed(0)}% paid</span>
                        </div>
                        <div style={{ height:6, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, width:`${progress}%`, background:'linear-gradient(90deg,#f59e0b,#34d399)', transition:'width .5s ease' }}/>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:11, color:'rgba(255,255,255,.3)' }}>
                          <span>Paid: {lf(loan.totalPaid)}</span>
                          <span>Remaining: {lf(loan.outstandingBalance)}</span>
                        </div>
                      </div>
                    )}

                    <div className="lcard-details">
                      {[
                        { l:'Principal',       v:lf(loan.principalAmount) },
                        { l:'Interest Rate',   v:`${loan.interestRate}% APR` },
                        { l:'Term',            v:`${loan.termMonths} months` },
                        { l:'Monthly Payment', v:lf(loan.monthlyPayment) },
                        { l:'Outstanding',     v:lf(loan.outstandingBalance) },
                        { l:'Total Paid',      v:lf(loan.totalPaid) },
                        ...(loan.nextPaymentDate ? [{ l:'Next Due',  v:fmtD(loan.nextPaymentDate) }] : []),
                        ...(loan.disbursedAt    ? [{ l:'Disbursed', v:fmtD(loan.disbursedAt) }]     : []),
                        ...(loan.creditScore    ? [{ l:'Credit Score', v:String(loan.creditScore) }] : []),
                      ].map(({ l, v }) => (
                        <div key={l} className="lcard-detail-row">
                          <span className="lcard-detail-l">{l}</span>
                          <span className="lcard-detail-v">{v}</span>
                        </div>
                      ))}
                    </div>

                    {loan.status==='rejected' && loan.rejectionReason && (
                      <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.2)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, color:'#fca5a5', fontSize:13, fontWeight:600, marginBottom:4 }}>
                          <AlertCircle size={13}/> Rejection Reason
                        </div>
                        <p style={{ color:'rgba(255,255,255,.6)', fontSize:13, margin:0 }}>{loan.rejectionReason}</p>
                      </div>
                    )}

                    {canRepay && (
                      <button className="nx-subbtn" onClick={() => setRepaying(loan)}
                        style={{ background:'linear-gradient(135deg,#34d399,#059669)' }}>
                        <DollarSign size={15}/> Make a Payment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {applying && accounts.length>0 && <ApplyModal accounts={accounts} onClose={() => setApplying(false)} onDone={load}/>}
      {repaying  && <RepayModal loan={repaying} accounts={accounts} onClose={() => setRepaying(null)} onDone={load}/>}
      <LS/>
    </div>
  );
}

function LS() {
  return (
    <style>{`
      *{box-sizing:border-box}
      .pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:24px 16px}
      @media(min-width:640px){.pg{padding:32px 28px}}
      @media(min-width:1024px){.pg{padding:36px 40px}}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:12px;flex-wrap:wrap}
      .ttl{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0}
      @media(min-width:640px){.ttl{font-size:26px}}
      .sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0}
      .addbtn{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0}
      .addbtn:disabled{opacity:.5;cursor:not-allowed}
      .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
      @media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr)}}
      .scard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px}
      .scard-l{font-size:11px;color:rgba(255,255,255,.4)}
      .scard-v{font-size:17px;font-weight:800;letter-spacing:-.3px;font-family:monospace;word-break:break-all}
      .cen{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:rgba(255,255,255,.35);font-size:14px}
      .empty{display:flex;flex-direction:column;align-items:center;padding:60px 20px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08);border-radius:16px;text-align:center;gap:10px;margin-bottom:24px}
      .empty p{color:rgba(255,255,255,.35);font-size:14px;margin:0}
      .loans-list{display:flex;flex-direction:column;gap:12px}
      .lcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden}
      .lcard-hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:16px 18px;background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;transition:background .15s}
      .lcard-hdr:hover{background:rgba(255,255,255,.03)}
      .lcard-hdr-left{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
      .lcard-ico{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .lcard-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .lcard-meta{font-size:12px;color:rgba(255,255,255,.4)}
      .lcard-body{padding:16px 18px 18px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:14px}
      .lcard-details{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      @media(min-width:640px){.lcard-details{grid-template-columns:repeat(3,1fr)}}
      .lcard-detail-row{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:3px}
      .lcard-detail-l{font-size:10px;color:rgba(255,255,255,.35)}
      .lcard-detail-v{font-size:13px;font-weight:700;color:#fff;font-family:monospace;word-break:break-all}
      .spill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;letter-spacing:.05em;white-space:nowrap}
      .nx-over{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:flex-end;justify-content:center;padding:16px}
      @media(min-width:600px){.nx-over{align-items:center}}
      .nx-modal{background:#111826;border:1px solid rgba(255,255,255,.1);border-radius:20px 20px 0 0;padding:26px;width:100%;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px}
      @media(min-width:600px){.nx-modal{border-radius:20px}}
      .nx-mhdr{display:flex;justify-content:space-between;align-items:center}
      .nx-mtitle{font-size:17px;font-weight:800;color:#fff;margin:0}
      .nx-xbtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);cursor:pointer}
      .nx-fg{display:flex;flex-direction:column;gap:6px}
      .nx-lbl{font-size:12px;font-weight:600;color:rgba(255,255,255,.6)}
      .nx-inp{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit}
      .nx-inp::placeholder{color:rgba(255,255,255,.28)}
      .nx-inp:focus{border-color:rgba(245,158,11,.5)}
      .nx-selwrap{position:relative}
      .nx-sel{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit;appearance:none;cursor:pointer}
      .nx-sel option{background:#1e2940;color:#fff}
      .nx-sel-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.4);pointer-events:none}
      .nx-subbtn{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
      .nx-subbtn:disabled{opacity:.5;cursor:not-allowed}
      .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .ltypes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      @media(min-width:500px){.ltypes{grid-template-columns:repeat(3,1fr)}}
      .ltype-btn{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;cursor:pointer;font-family:inherit;transition:all .2s;text-align:left;display:flex;flex-direction:column;gap:3px}
      .ltype-btn:hover{background:rgba(255,255,255,.06)}
      .ltype-on{background:rgba(245,158,11,.1)!important;border-color:rgba(245,158,11,.4)!important}
      .ltype-label{font-size:12px;font-weight:700;color:rgba(255,255,255,.8)}
      .ltype-meta{font-size:10px;color:rgba(255,255,255,.35)}
      .ltype-on .ltype-label{color:#f59e0b}
      .est-box{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:12px;padding:14px;text-align:center}
      .est-title{font-size:11px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
      .est-amount{font-size:26px;font-weight:800;color:#34d399;font-family:monospace;margin-bottom:6px;word-break:break-all}
      .est-note{font-size:11px;color:rgba(255,255,255,.35);line-height:1.4}
      .linfo-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px}
      .linfo-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:rgba(255,255,255,.5)}
      .linfo-row strong{color:#fff;font-family:monospace}
      @keyframes spin{to{transform:rotate(360deg)}}.nx-spin{animation:spin 1s linear infinite}
    `}</style>
  );
}