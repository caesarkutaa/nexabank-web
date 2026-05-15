'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send, Globe, Building, Loader2, CheckCircle,
  AlertCircle, X, Shield, ChevronDown, Key, Search,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { FrozenAccountModal } from '@/components/Frozenaccountmodal';

interface Account {
  _id: string; accountNumber: string; accountType: string;
  nickname?: string; availableBalance: number; currency: string; status: string;
}

type TType = 'intrabank' | 'interbank' | 'international';
type Step  = 'form' | 'pin' | 'otp' | 'success';

function fmtCurrency(amount: number, currency: string): string {
  try { return new Intl.NumberFormat(undefined, { style:'currency', currency:currency||'USD', minimumFractionDigits:2 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(2)}`; }
}

const TYPES = [
  { id:'intrabank'     as TType, label:'NexaBank', sub:'Free · Instant',  Icon:Building, c:'#34d399' },
  { id:'interbank'     as TType, label:'ACH',       sub:'Fee · 1-2 days',  Icon:Send,     c:'#60a5fa' },
  { id:'international' as TType, label:'Wire',      sub:'Fee · 2-5 days',  Icon:Globe,    c:'#a78bfa' },
];

const CURRENCIES = [
  { code:'USD',symbol:'$'   },{ code:'EUR',symbol:'€'   },{ code:'GBP',symbol:'£'   },
  { code:'CAD',symbol:'CA$' },{ code:'AUD',symbol:'A$'  },{ code:'NGN',symbol:'₦'   },
  { code:'GHS',symbol:'₵'   },{ code:'KES',symbol:'KSh' },{ code:'ZAR',symbol:'R'   },
  { code:'INR',symbol:'₹'   },{ code:'JPY',symbol:'¥'   },{ code:'CNY',symbol:'¥'   },
  { code:'AED',symbol:'د.إ' },{ code:'SAR',symbol:'﷼'   },{ code:'BRL',symbol:'R$'  },
  { code:'MXN',symbol:'MX$' },{ code:'CHF',symbol:'Fr'  },{ code:'SEK',symbol:'kr'  },
  { code:'SGD',symbol:'S$'  },{ code:'HKD',symbol:'HK$' },{ code:'KRW',symbol:'₩'   },
  { code:'THB',symbol:'฿'   },{ code:'MYR',symbol:'RM'  },{ code:'PHP',symbol:'₱'   },
  { code:'TRY',symbol:'₺'   },{ code:'PKR',symbol:'₨'   },
];

// ── Bank list for autocomplete ───────────────────────────────────
const US_EU_BANKS = [
  // USA — Major banks
  'JPMorgan Chase Bank','Bank of America','Wells Fargo Bank','Citibank',
  'U.S. Bank','Truist Bank','PNC Bank','Goldman Sachs Bank','TD Bank',
  'Capital One Bank','Ally Bank','Citizens Bank','Fifth Third Bank',
  'KeyBank','Regions Bank','Huntington National Bank','Discover Bank',
  'American Express National Bank','BMO Harris Bank','Santander Bank',
  'M&T Bank','Synchrony Bank','TIAA Bank','Silicon Valley Bank',
  'First Republic Bank','Comerica Bank','Zions Bank','Synovus Bank',
  'Old National Bank','Glacier Bank','First National Bank','Flagstar Bank',
  'New York Community Bank','Signature Bank','WebBank','Cross River Bank',
  'Blue Ridge Bank','Customers Bank','Evolve Bank & Trust','Lead Bank',
  // USA — Credit Unions
  'Navy Federal Credit Union','Pentagon Federal Credit Union',
  'State Employees Credit Union','Boeing Employees Credit Union',
  'SchoolsFirst Federal Credit Union','Golden 1 Credit Union',
  // EU — Major banks
  'Deutsche Bank','Commerzbank','DZ Bank','KfW Bank','ING Group',
  'BNP Paribas','Crédit Agricole','Société Générale','Natixis',
  'BPCE Group','Banco Santander','BBVA','CaixaBank','Bankinter',
  'UniCredit','Intesa Sanpaolo','Mediobanca','Banco BPM',
  'ING Bank','Rabobank','ABN AMRO','Van Lanschot Kempen',
  'Erste Group Bank','Raiffeisen Bank International','BAWAG Group',
  'KBC Group','Belfius','Argenta','Bank of Ireland','AIB Group',
  'Permanent TSB','Nordea Bank','Svenska Handelsbanken','SEB Bank',
  'Swedbank','DNB Bank','SpareBank','Danske Bank','Nykredit',
  'Jyske Bank','PKO Bank Polski','Bank Pekao','mBank',
  'UBS Group','Credit Suisse','Julius Baer','PostFinance',
  'Barclays','HSBC','Lloyds Banking Group','NatWest Group',
  'Standard Chartered','Nationwide Building Society','Monzo','Starling Bank',
  // International / Global
  'HSBC Holdings','Standard Chartered Bank','Citigroup',
  'BNY Mellon','State Street Bank','Northern Trust',
];

// ── Bank Autocomplete Input ───────────────────────────────────────
function BankAutocomplete({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [open,     setOpen]     = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) { setFiltered([]); setOpen(false); return; }
    const q = value.toLowerCase();
    const matches = US_EU_BANKS.filter(b => b.toLowerCase().includes(q)).slice(0, 8);
    setFiltered(matches);
    setOpen(matches.length > 0);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <Search size={13} color="rgba(255,255,255,.3)"
          style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
        <input
          className="nxinput"
          style={{ paddingLeft:32 }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (filtered.length) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200,
          background:'#1a2540', border:'1px solid rgba(255,255,255,.12)', borderRadius:10,
          overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.5)',
        }}>
          {filtered.map(bank => (
            <button
              key={bank}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(bank); setOpen(false); }}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'10px 14px', fontSize:13, color:'rgba(255,255,255,.8)',
                background:'transparent', border:'none', cursor:'pointer',
                borderBottom:'1px solid rgba(255,255,255,.05)', fontFamily:'inherit',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,.1)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              {/* Highlight matched portion */}
              {(() => {
                const q   = value.toLowerCase();
                const idx = bank.toLowerCase().indexOf(q);
                if (idx === -1) return bank;
                return (
                  <>
                    {bank.slice(0, idx)}
                    <strong style={{ color:'#f59e0b' }}>{bank.slice(idx, idx + value.length)}</strong>
                    {bank.slice(idx + value.length)}
                  </>
                );
              })()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pin Entry Boxes ────────────────────────────────────────────
function PinBoxes({ value, onChange, prefix }: { value: string; onChange: (v: string) => void; prefix: string }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'18px 0' }}>
      {Array.from({ length:6 }).map((_,i) => (
        <input key={i} id={`${prefix}${i}`} inputMode="numeric" maxLength={1} type="password"
          value={value[i] ?? ''}
          onChange={e => {
            const digit = e.target.value.replace(/\D/g,'').slice(-1);
            const arr = (value.padEnd(6,' ')).split(''); arr[i]=digit;
            onChange(arr.join('').trimEnd());
            if (digit && i<5) setTimeout(()=>document.getElementById(`${prefix}${i+1}`)?.focus(),0);
          }}
          onKeyDown={e => {
            if (e.key==='Backspace') {
              e.preventDefault();
              const arr=(value.padEnd(6,' ')).split('');
              if (arr[i]?.trim()) { arr[i]=' '; onChange(arr.join('').trimEnd()); }
              else if (i>0) { arr[i-1]=' '; onChange(arr.join('').trimEnd()); document.getElementById(`${prefix}${i-1}`)?.focus(); }
            }
          }}
          onFocus={e => { e.target.style.borderColor='rgba(245,158,11,.8)'; e.target.style.background='#1e2c45'; }}
          onBlur={e  => { e.target.style.borderColor=value[i]?.trim()?'rgba(245,158,11,.5)':'rgba(255,255,255,.15)'; e.target.style.background='#1e2940'; }}
          style={{ width:44,height:52,textAlign:'center',fontSize:22,fontWeight:800,color:'#fff',
            WebkitTextFillColor:'#fff',background:'#1e2940',
            border:`1.5px solid ${value[i]?.trim()?'rgba(245,158,11,.5)':'rgba(255,255,255,.15)'}`,
            borderRadius:10,outline:'none',fontFamily:'monospace',caretColor:'transparent',
            transition:'border-color .15s,background .15s' }} />
      ))}
    </div>
  );
}

// ── OTP Boxes ──────────────────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="otp-row">
      {Array.from({ length:6 }).map((_,i) => (
        <input key={i} id={`o${i}`} maxLength={1} className="otp-box"
          value={value[i]??''}
          onChange={e => {
            const v = e.target.value.replace(/\D/g,'');
            const a = value.split(''); a[i]=v; onChange(a.join('').slice(0,6));
            if (v && i<5) document.getElementById(`o${i+1}`)?.focus();
          }}
          onKeyDown={e => { if (e.key==='Backspace'&&!value[i]&&i>0) document.getElementById(`o${i-1}`)?.focus(); }}
        />
      ))}
      <style>{`
        .otp-row{display:flex;gap:8px;justify-content:center;margin:18px 0}
        .otp-box{width:44px;height:52px;text-align:center;font-size:20px;font-weight:700;
          color:#fff!important;background:#1e2940!important;border:1.5px solid rgba(255,255,255,.15);
          border-radius:10px;outline:none;font-family:monospace;-webkit-text-fill-color:#fff;caret-color:#f59e0b}
        .otp-box:focus{border-color:rgba(245,158,11,.6)}
        @media(max-width:400px){.otp-box{width:36px;height:44px;font-size:17px}}
      `}</style>
    </div>
  );
}

export default function TransfersPage() {
  const [mounted,      setMounted]      = useState(false);
  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [loadingAcc,   setLoadingAcc]   = useState(true);
  const [ttype,        setTtype]        = useState<TType>('intrabank');
  const [step,         setStep]         = useState<Step>('form');
  const [pin,          setPin]          = useState('');
  const [otp,          setOtp]          = useState('');
  const [loading,      setLoading]      = useState(false);
  const [lastRef,      setLastRef]      = useState('');
  const [receiptUrl,   setReceiptUrl]   = useState('');

  const [fromId,       setFromId]       = useState('');
  const [amount,       setAmount]       = useState('');
  const [desc,         setDesc]         = useState('');
  const [toAccNum,     setToAccNum]     = useState('');
  const [recipName,    setRecipName]    = useState('');
  const [routing,      setRouting]      = useState('');
  const [bankName,     setBankName]     = useState('');
  const [swift,        setSwift]        = useState('');
  const [iban,         setIban]         = useState('');
  const [country,      setCountry]      = useState('');
  const [recipBank,    setRecipBank]    = useState('');
  const [wireCurrency, setWireCurrency] = useState('USD');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult,  setLookupResult]  = useState<{name:string;accountType:string}|null>(null);
  const [lookupError,   setLookupError]   = useState('');
  const lookupTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => { setMounted(true); }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounts');
      const active = (res.data.data||[]).filter((a: Account) => a.status==='active');
      setAccounts(active);
      if (active.length) setFromId(active[0]._id);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoadingAcc(false); }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const selAcc     = accounts.find(a => a._id===fromId);
  if (selAcc?.status === 'frozen') return <FrozenAccountModal accountNumber={selAcc.accountNumber} />;
  const acctCur    = selAcc?.currency || 'USD';
  const num        = parseFloat(amount) || 0;
  const fee        = ttype==='intrabank' ? 0 : ttype==='interbank' ? (num>1000 ? 5 : 2.5) : Math.min(num*0.02,50);
  const total      = num + fee;
  const insufficient = !!selAcc && total > selAcc.availableBalance;
  const fmt        = (n: number) => fmtCurrency(n, acctCur);
  const currSymbol = CURRENCIES.find(c=>c.code===acctCur)?.symbol ?? acctCur;

  const handleAccNumChange = (val: string) => {
    setToAccNum(val); setLookupResult(null); setLookupError(''); setRecipName('');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (val.trim().length < 6) return;
    lookupTimer.current = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await api.get('/accounts/lookup', { params:{ accountNumber:val.trim() } });
        const d = res.data.data;
        if (d) {
          const name = [d.firstName,d.lastName].filter(Boolean).join(' ') || d.username || 'Account Holder';
          setLookupResult({ name, accountType:d.accountType?.replace(/_/g,' ')||'' });
          setRecipName(name); setLookupError('');
        }
      } catch (e: any) {
        setLookupResult(null); setRecipName('');
        if (e.response?.status===404) setLookupError('Account not found on NexaBank.');
        else if (e.response?.status===400) setLookupError('Invalid account number.');
      } finally { setLookupLoading(false); }
    }, 600);
  };

  const proceedToPin = () => {
    if (!fromId||num<=0) return toast.error('Fill all required fields');
    if (ttype==='intrabank'&&!toAccNum.trim()) return toast.error('Enter recipient account number');
    if (ttype==='intrabank'&&lookupError) return toast.error('Recipient account not found');
    if (ttype==='interbank'&&(!toAccNum.trim()||!routing.trim()||!bankName.trim()||!recipName.trim())) return toast.error('Fill all recipient fields');
    if (ttype==='international'&&(!recipName.trim()||!recipBank.trim()||!swift.trim()||!iban.trim()||!country.trim())) return toast.error('Fill all international wire fields');
    if (insufficient) return toast.error('Insufficient funds');
    setPin(''); setStep('pin');
  };

  const initiate = async () => {
    if (!/^\d{6}$/.test(pin)) return toast.error('Enter your 6-digit security PIN');
    setLoading(true);
    try {
      await api.post('/transfers/initiate', { fromAccountId:fromId, amount:num, type:ttype, securityPin:pin });
      toast.success('OTP sent to your email!'); setStep('otp');
    } catch (e: any) { toast.error(e.response?.data?.message||'Failed to initiate'); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    if (otp.length!==6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      let res;
      if (ttype==='intrabank') {
        res = await api.post('/transfers/intrabank/confirm', {
          fromAccountId:fromId, toAccountNumber:toAccNum, amount:num,
          description:desc, recipientName:recipName, securityPin:pin, otp,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else if (ttype==='interbank') {
        res = await api.post('/transfers/interbank/confirm', {
          fromAccountId:fromId, toAccountNumber:toAccNum, toRoutingNumber:routing,
          toBankName:bankName, recipientName:recipName, amount:num,
          description:desc, securityPin:pin, otp,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else {
        res = await api.post('/transfers/international/confirm', {
          fromAccountId:fromId, recipientName:recipName, recipientBank:recipBank,
          swiftCode:swift, ibanNumber:iban, recipientCountry:country,
          amount:num, currency:wireCurrency, description:desc, securityPin:pin, otp,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      const d = res.data.data ?? res.data;
      setLastRef(d.referenceNumber ?? '');
      setReceiptUrl(d.receiptUrl ?? '');
      setStep('success'); toast.success('Transfer successful!');
    } catch (e: any) { toast.error(e.response?.data?.message||'Transfer failed'); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setStep('form'); setOtp(''); setPin(''); setAmount(''); setDesc('');
    setToAccNum(''); setRecipName(''); setRouting(''); setBankName('');
    setSwift(''); setIban(''); setCountry(''); setRecipBank('');
    setLookupResult(null); setLookupError(''); loadAccounts();
  };

  if (!mounted) return <div style={{ minHeight:'100vh', background:'#0a0f1a' }}/>;

  return (
    <div className="pg">
      <div className="inner">
        <div className="hdr"><h1 className="title">Send Money</h1></div>

        {/* ── FORM ── */}
        {step==='form' && (
          <div className="card">
            <div className="type-tabs">
              {TYPES.map(t => (
                <button key={t.id} className={`ttab ${ttype===t.id?'ttab-on':''}`} style={{'--tc':t.c} as any}
                  onClick={() => { setTtype(t.id); setToAccNum(''); setRecipName(''); setLookupResult(null); setLookupError(''); setBankName(''); }}>
                  <div className="ttab-ico" style={{ background:`${t.c}20` }}><t.Icon size={15} color={t.c}/></div>
                  <span className="ttab-label">{t.label}</span>
                  <span className="ttab-sub" style={{ color:ttype===t.id?t.c:'rgba(255,255,255,.3)' }}>{t.sub}</span>
                </button>
              ))}
            </div>

            {/* From account */}
            <div className="fg">
              <label className="fl">From Account</label>
              {loadingAcc ? <div className="loading-sm"><Loader2 size={14} className="nx-spin"/> Loading…</div> : (
                <div className="sel-wrap">
                  <select className="nxsel" value={fromId} onChange={e=>setFromId(e.target.value)}>
                    {accounts.length===0 && <option value="">No active accounts</option>}
                    {accounts.map(a => (
                      <option key={a._id} value={a._id}>
                        [{a.currency||'USD'}] {a.nickname||a.accountType?.replace(/_/g,' ')||'Account'} ···{a.accountNumber.slice(-4)} — {fmtCurrency(a.availableBalance,a.currency||'USD')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="sel-ico"/>
                </div>
              )}
              {selAcc && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', color:'#f59e0b', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:100 }}>{acctCur}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,.35)' }}>Amounts in {acctCur}</span>
                </div>
              )}
            </div>

            {/* Intrabank */}
            {ttype==='intrabank' && (
              <div className="fg">
                <label className="fl">Recipient Account Number</label>
                <div style={{ position:'relative' }}>
                  <input className="nxinput" value={toAccNum} onChange={e=>handleAccNumChange(e.target.value)} placeholder="NexaBank account number" maxLength={20}/>
                  {lookupLoading && <Loader2 size={14} className="nx-spin" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#f59e0b' }}/>}
                </div>
                {lookupResult && (
                  <div className="lookup-found">
                    <CheckCircle size={14} color="#34d399"/>
                    <div><div className="lookup-name">{lookupResult.name}</div>{lookupResult.accountType&&<div className="lookup-type">{lookupResult.accountType} account · NexaBank</div>}</div>
                  </div>
                )}
                {lookupError && <div className="lookup-error"><AlertCircle size={13}/>{lookupError}</div>}
              </div>
            )}

            {/* Interbank — with bank autocomplete */}
            {ttype==='interbank' && (<>
              <F label="Recipient Account Number" val={toAccNum} set={setToAccNum} ph="External account number"/>
              <F label="Routing Number (ABA)" val={routing} set={setRouting} ph="9-digit routing number"/>
              <div className="fg">
                <label className="fl">Bank Name</label>
                <BankAutocomplete value={bankName} onChange={setBankName} placeholder="Start typing bank name…"/>
              </div>
              <F label="Recipient Name" val={recipName} set={setRecipName} ph="Full name"/>
            </>)}

            {/* International — with bank autocomplete */}
            {ttype==='international' && (<>
              <F label="Recipient Name" val={recipName} set={setRecipName} ph="Full legal name"/>
              <div className="fg">
                <label className="fl">Recipient Bank</label>
                <BankAutocomplete value={recipBank} onChange={setRecipBank} placeholder="Start typing bank name…"/>
              </div>
              <F label="SWIFT / BIC Code" val={swift} set={setSwift} ph="e.g. BSCHESMM"/>
              <F label="IBAN Number" val={iban} set={setIban} ph="e.g. ES9121000418450200051332"/>
              <F label="Recipient Country Code" val={country} set={setCountry} ph="e.g. ES, GB, NG"/>
              <div className="fg">
                <label className="fl">Recipient Currency</label>
                <div className="sel-wrap">
                  <select className="nxsel" value={wireCurrency} onChange={e=>setWireCurrency(e.target.value)}>
                    {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                  </select>
                  <ChevronDown size={13} className="sel-ico"/>
                </div>
              </div>
            </>)}

            {/* Amount */}
            <div className="fg">
              <label className="fl">Amount ({acctCur})</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.45)', fontSize:13, fontWeight:700, pointerEvents:'none', fontFamily:'monospace' }}>{currSymbol}</span>
                <input className="nxinput" style={{ paddingLeft: currSymbol.length>2?40:28 }} type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/>
              </div>
            </div>

            <F label="Description (optional)" val={desc} set={setDesc} ph="What's this for?"/>

            {num>0 && (
              <div className="fee-box">
                {[{l:'Amount',v:fmt(num)},{l:'Fee',v:fee===0?'Free':fmt(fee)},{l:'Total',v:fmt(total),bold:true}].map(({l,v,bold})=>(
                  <div key={l} className="fee-row"><span className="fee-label">{l}</span><span className="fee-val" style={{ fontWeight:bold?700:500, color:bold?'#fff':'rgba(255,255,255,.65)' }}>{v}</span></div>
                ))}
                {insufficient && <div className="insuf"><AlertCircle size={13}/> Insufficient — available: {fmt(selAcc?.availableBalance??0)}</div>}
              </div>
            )}

            <button className="subbtn" onClick={proceedToPin} disabled={loading||!fromId||num<=0||insufficient}>
              {loading?<><Loader2 size={15} className="nx-spin"/> Loading…</>:<><Key size={15}/> Continue — Enter PIN</>}
            </button>
          </div>
        )}

        {/* ── PIN STEP ── */}
        {step==='pin' && (
          <div className="card" style={{ textAlign:'center' }}>
            <div className="shield-ico" style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)' }}><Key size={30} color="#f59e0b"/></div>
            <h2 className="otp-title">Enter Security PIN</h2>
            <p className="otp-sub">Enter your 6-digit security PIN to authorize this transfer.</p>
            <PinBoxes value={pin} onChange={setPin} prefix="tpin"/>
            <div className="sumbox" style={{ marginBottom:16, textAlign:'left' }}>
              {[
                { l:'Type',   v:TYPES.find(t=>t.id===ttype)?.label??ttype },
                { l:'Amount', v:fmt(num) },
                { l:'Fee',    v:fee===0?'Free':fmt(fee) },
                { l:'Total',  v:fmt(total) },
                ...(recipName?[{l:'To',v:recipName}]:[]),
                ...(bankName?[{l:'Bank',v:bankName}]:[]),
              ].map(({l,v})=>(
                <div key={l} className="sum-row"><span>{l}</span><span style={{ fontFamily:'monospace', color:'#fff', fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(96,165,250,.08)', border:'1px solid rgba(96,165,250,.15)', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'left' }}>
              <Shield size={14} color="#60a5fa" style={{ flexShrink:0 }}/>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', margin:0 }}>Your PIN is never stored in plain text. Never share it with anyone.</p>
            </div>
            <button className="subbtn" onClick={initiate} disabled={loading||pin.length!==6}>
              {loading?<><Loader2 size={15} className="nx-spin"/> Sending OTP…</>:<><Send size={15}/> Confirm PIN — Get OTP</>}
            </button>
            <button className="backbtn" onClick={()=>{setStep('form');setPin('');}}>← Back</button>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step==='otp' && (
          <div className="card" style={{ textAlign:'center' }}>
            <div className="shield-ico"><Shield size={30} color="#f59e0b"/></div>
            <h2 className="otp-title">Authorize Transfer</h2>
            <p className="otp-sub">A 6-digit code was sent to your email. Expires in 10 minutes.</p>
            <OtpBoxes value={otp} onChange={setOtp}/>
            <div className="sumbox" style={{ marginBottom:8, textAlign:'left' }}>
              {[{l:'Amount',v:fmt(num)},{l:'Fee',v:fee===0?'Free':fmt(fee)},{l:'Total',v:fmt(total)},...(recipName?[{l:'To',v:recipName}]:[])].map(({l,v})=>(
                <div key={l} className="sum-row"><span>{l}</span><span style={{ fontFamily:'monospace', color:'#fff', fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
            <button className="subbtn" onClick={confirm} disabled={loading||otp.length!==6}>
              {loading?<><Loader2 size={15} className="nx-spin"/> Confirming…</>:'Confirm Transfer'}
            </button>
            <button className="backbtn" onClick={()=>{setStep('pin');setOtp('');}}>← Back to PIN</button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step==='success' && (
          <div className="card" style={{ textAlign:'center' }}>
            <div className="success-ico"><CheckCircle size={38} color="#34d399"/></div>
            <h2 className="otp-title" style={{ color:'#34d399' }}>Transfer Sent!</h2>
            <p className="otp-sub">Your transfer has been submitted successfully.</p>
            <div className="ref-box">
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>Reference Number</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'monospace', wordBreak:'break-all' }}>{lastRef}</div>
            </div>
            {receiptUrl && (
              <a href={receiptUrl} download={`receipt-${lastRef}.pdf`} target="_blank" rel="noreferrer" className="receipt-link">
                ⬇ Download Receipt
              </a>
            )}
            <button className="subbtn" onClick={reset}>Make Another Transfer</button>
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        .pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:24px 16px}
        @media(min-width:640px){.pg{padding:32px 28px}}
        .inner{max-width:660px;margin:0 auto}
        .hdr{margin-bottom:24px}
        .title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0}
        @media(min-width:640px){.title{font-size:26px}}
        .sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:22px;display:flex;flex-direction:column;gap:14px}
        @media(min-width:640px){.card{padding:30px}}
        .type-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .ttab{background:rgba(255,255,255,.02);border:1.5px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 8px;cursor:pointer;text-align:center;font-family:inherit;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:4px}
        .ttab-on{background:color-mix(in srgb,var(--tc) 10%,transparent);border-color:var(--tc)}
        .ttab-ico{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:2px}
        .ttab-label{font-size:12px;font-weight:700;color:rgba(255,255,255,.7)}
        .ttab-on .ttab-label{color:#fff}
        .ttab-sub{font-size:10px}
        @media(min-width:480px){.ttab-label{font-size:13px}.ttab-sub{font-size:11px}}
        .fg{display:flex;flex-direction:column;gap:6px;position:relative}
        .fl{font-size:12px;font-weight:600;color:rgba(255,255,255,.6)}
        @media(min-width:480px){.fl{font-size:13px}}
        .nxinput{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit}
        .nxinput::placeholder{color:rgba(255,255,255,.28)}
        .nxinput:focus{border-color:rgba(245,158,11,.5);background:#243050!important}
        .sel-wrap{position:relative}
        .nxsel{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 36px 11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit;appearance:none;cursor:pointer}
        .nxsel:focus{border-color:rgba(245,158,11,.5)}
        .nxsel option{background:#1e2940;color:#fff}
        .sel-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.4);pointer-events:none}
        .loading-sm{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.35);font-size:13px;padding:10px 0}
        .lookup-found{display:flex;align-items:flex-start;gap:9px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.25);border-radius:10px;padding:10px 13px;margin-top:4px}
        .lookup-name{font-size:14px;font-weight:700;color:#fff;line-height:1.3}
        .lookup-type{font-size:11px;color:rgba(52,211,153,.8);margin-top:2px}
        .lookup-error{display:flex;align-items:center;gap:6px;color:#fca5a5;font-size:12px;margin-top:4px}
        .fee-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px}
        .fee-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
        .fee-label{color:rgba(255,255,255,.45)}
        .fee-val{font-family:monospace}
        .insuf{display:flex;align-items:center;gap:6px;color:#fca5a5;font-size:12px;margin-top:8px}
        .subbtn{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:12px;padding:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-top:4px}
        .subbtn:disabled{opacity:.45;cursor:not-allowed}
        .shield-ico{width:72px;height:72px;border-radius:50%;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
        .success-ico{width:80px;height:80px;border-radius:50%;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
        .otp-title{font-size:20px;font-weight:800;color:#fff;margin:0 0 8px}
        .otp-sub{color:rgba(255,255,255,.45);font-size:13px;margin:0 0 4px}
        .sumbox{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px}
        .sum-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:rgba(255,255,255,.45)}
        .ref-box{background:rgba(52,211,153,.06);border:1px solid rgba(52,211,153,.2);border-radius:12px;padding:16px;margin-bottom:12px}
        .receipt-link{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;font-size:13px;font-weight:700;text-decoration:none;margin-bottom:12px;padding:11px 20px;border-radius:10px;width:100%}
        .backbtn{background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:13px;font-family:inherit;margin-top:6px}
        @keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}
      `}</style>
    </div>
  );
}

function F({ label, val, set, ph, type='text' }: {
  label: string; val: string; set: (v: string) => void; ph: string; type?: string;
}) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      <input className="nxinput" type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}/>
    </div>
  );
}