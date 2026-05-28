'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft,
  User, Mail, Lock, Phone, Calendar, CheckCircle,
  AlertCircle, Loader2, Building2, Star,
  MapPin, Globe, DollarSign,
} from 'lucide-react';
import api from '../lib/api'

/* ── Country data ──────────────────────────────────────────── */
const COUNTRIES = [
  { code:'US', name:'United States',        currency:'USD', flag:'🇺🇸' },
  { code:'GB', name:'United Kingdom',       currency:'GBP', flag:'🇬🇧' },
  { code:'DE', name:'Germany',              currency:'EUR', flag:'🇩🇪' },
  { code:'FR', name:'France',               currency:'EUR', flag:'🇫🇷' },
  { code:'IT', name:'Italy',                currency:'EUR', flag:'🇮🇹' },
  { code:'ES', name:'Spain',                currency:'EUR', flag:'🇪🇸' },
  { code:'NL', name:'Netherlands',          currency:'EUR', flag:'🇳🇱' },
  { code:'BE', name:'Belgium',              currency:'EUR', flag:'🇧🇪' },
  { code:'PT', name:'Portugal',             currency:'EUR', flag:'🇵🇹' },
  { code:'AT', name:'Austria',              currency:'EUR', flag:'🇦🇹' },
  { code:'GR', name:'Greece',               currency:'EUR', flag:'🇬🇷' },
  { code:'FI', name:'Finland',              currency:'EUR', flag:'🇫🇮' },
  { code:'IE', name:'Ireland',              currency:'EUR', flag:'🇮🇪' },
  { code:'CH', name:'Switzerland',          currency:'CHF', flag:'🇨🇭' },
  { code:'SE', name:'Sweden',               currency:'SEK', flag:'🇸🇪' },
  { code:'NO', name:'Norway',               currency:'NOK', flag:'🇳🇴' },
  { code:'DK', name:'Denmark',              currency:'DKK', flag:'🇩🇰' },
  { code:'PL', name:'Poland',               currency:'PLN', flag:'🇵🇱' },
  { code:'CZ', name:'Czech Republic',       currency:'CZK', flag:'🇨🇿' },
  { code:'HU', name:'Hungary',              currency:'HUF', flag:'🇭🇺' },
  { code:'RO', name:'Romania',              currency:'RON', flag:'🇷🇴' },
  { code:'UA', name:'Ukraine',              currency:'UAH', flag:'🇺🇦' },
  { code:'CA', name:'Canada',               currency:'CAD', flag:'🇨🇦' },
  { code:'AU', name:'Australia',            currency:'AUD', flag:'🇦🇺' },
  { code:'NZ', name:'New Zealand',          currency:'NZD', flag:'🇳🇿' },
  { code:'NG', name:'Nigeria',              currency:'NGN', flag:'🇳🇬' },
  { code:'GH', name:'Ghana',                currency:'GHS', flag:'🇬🇭' },
  { code:'KE', name:'Kenya',                currency:'KES', flag:'🇰🇪' },
  { code:'ZA', name:'South Africa',         currency:'ZAR', flag:'🇿🇦' },
  { code:'EG', name:'Egypt',                currency:'EGP', flag:'🇪🇬' },
  { code:'MA', name:'Morocco',              currency:'MAD', flag:'🇲🇦' },
  { code:'TZ', name:'Tanzania',             currency:'TZS', flag:'🇹🇿' },
  { code:'UG', name:'Uganda',               currency:'UGX', flag:'🇺🇬' },
  { code:'SN', name:'Senegal',              currency:'XOF', flag:'🇸🇳' },
  { code:'CI', name:"Côte d'Ivoire",        currency:'XOF', flag:'🇨🇮' },
  { code:'CM', name:'Cameroon',             currency:'XAF', flag:'🇨🇲' },
  { code:'ET', name:'Ethiopia',             currency:'ETB', flag:'🇪🇹' },
  { code:'RW', name:'Rwanda',               currency:'RWF', flag:'🇷🇼' },
  { code:'IN', name:'India',                currency:'INR', flag:'🇮🇳' },
  { code:'CN', name:'China',                currency:'CNY', flag:'🇨🇳' },
  { code:'JP', name:'Japan',                currency:'JPY', flag:'🇯🇵' },
  { code:'SG', name:'Singapore',            currency:'SGD', flag:'🇸🇬' },
  { code:'HK', name:'Hong Kong',            currency:'HKD', flag:'🇭🇰' },
  { code:'KR', name:'South Korea',          currency:'KRW', flag:'🇰🇷' },
  { code:'TH', name:'Thailand',             currency:'THB', flag:'🇹🇭' },
  { code:'MY', name:'Malaysia',             currency:'MYR', flag:'🇲🇾' },
  { code:'PH', name:'Philippines',          currency:'PHP', flag:'🇵🇭' },
  { code:'ID', name:'Indonesia',            currency:'IDR', flag:'🇮🇩' },
  { code:'VN', name:'Vietnam',              currency:'VND', flag:'🇻🇳' },
  { code:'PK', name:'Pakistan',             currency:'PKR', flag:'🇵🇰' },
  { code:'BD', name:'Bangladesh',           currency:'BDT', flag:'🇧🇩' },
  { code:'LK', name:'Sri Lanka',            currency:'LKR', flag:'🇱🇰' },
  { code:'AE', name:'United Arab Emirates', currency:'AED', flag:'🇦🇪' },
  { code:'SA', name:'Saudi Arabia',         currency:'SAR', flag:'🇸🇦' },
  { code:'QA', name:'Qatar',                currency:'QAR', flag:'🇶🇦' },
  { code:'KW', name:'Kuwait',               currency:'KWD', flag:'🇰🇼' },
  { code:'BH', name:'Bahrain',              currency:'BHD', flag:'🇧🇭' },
  { code:'OM', name:'Oman',                 currency:'OMR', flag:'🇴🇲' },
  { code:'JO', name:'Jordan',               currency:'JOD', flag:'🇯🇴' },
  { code:'IL', name:'Israel',               currency:'ILS', flag:'🇮🇱' },
  { code:'TR', name:'Turkey',               currency:'TRY', flag:'🇹🇷' },
  { code:'RU', name:'Russia',               currency:'RUB', flag:'🇷🇺' },
  { code:'BR', name:'Brazil',               currency:'BRL', flag:'🇧🇷' },
  { code:'MX', name:'Mexico',               currency:'MXN', flag:'🇲🇽' },
  { code:'AR', name:'Argentina',            currency:'ARS', flag:'🇦🇷' },
  { code:'CO', name:'Colombia',             currency:'COP', flag:'🇨🇴' },
  { code:'CL', name:'Chile',                currency:'CLP', flag:'🇨🇱' },
  { code:'PE', name:'Peru',                 currency:'PEN', flag:'🇵🇪' },
  { code:'ZW', name:'Zimbabwe',             currency:'USD', flag:'🇿🇼' },
];

const CURRENCIES = [
  { code:'USD', name:'US Dollar',          symbol:'$'   },
  { code:'EUR', name:'Euro',               symbol:'€'   },
  { code:'GBP', name:'British Pound',      symbol:'£'   },
  { code:'CAD', name:'Canadian Dollar',    symbol:'CA$' },
  { code:'AUD', name:'Australian Dollar',  symbol:'A$'  },
  { code:'CHF', name:'Swiss Franc',        symbol:'Fr'  },
  { code:'NGN', name:'Nigerian Naira',     symbol:'₦'   },
  { code:'GHS', name:'Ghanaian Cedi',      symbol:'₵'   },
  { code:'KES', name:'Kenyan Shilling',    symbol:'KSh' },
  { code:'ZAR', name:'South African Rand', symbol:'R'   },
  { code:'INR', name:'Indian Rupee',       symbol:'₹'   },
  { code:'JPY', name:'Japanese Yen',       symbol:'¥'   },
  { code:'CNY', name:'Chinese Yuan',       symbol:'¥'   },
  { code:'SGD', name:'Singapore Dollar',   symbol:'S$'  },
  { code:'HKD', name:'Hong Kong Dollar',   symbol:'HK$' },
  { code:'AED', name:'UAE Dirham',         symbol:'د.إ' },
  { code:'SAR', name:'Saudi Riyal',        symbol:'﷼'   },
  { code:'BRL', name:'Brazilian Real',     symbol:'R$'  },
  { code:'MXN', name:'Mexican Peso',       symbol:'MX$' },
  { code:'SEK', name:'Swedish Krona',      symbol:'kr'  },
  { code:'NOK', name:'Norwegian Krone',    symbol:'kr'  },
  { code:'DKK', name:'Danish Krone',       symbol:'kr'  },
  { code:'KRW', name:'South Korean Won',   symbol:'₩'   },
  { code:'THB', name:'Thai Baht',          symbol:'฿'   },
  { code:'MYR', name:'Malaysian Ringgit',  symbol:'RM'  },
  { code:'PHP', name:'Philippine Peso',    symbol:'₱'   },
  { code:'PKR', name:'Pakistani Rupee',    symbol:'₨'   },
  { code:'TRY', name:'Turkish Lira',       symbol:'₺'   },
];

/* ── Schemas ───────────────────────────────────────────────── */
const step1Schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Enter a valid email'),
  username:  z.string()
    .min(3,'Min 3 characters').max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers & underscores only'),
});

const step2Schema = z.object({
  country:           z.string().min(1, 'Select your country'),
  state:             z.string().optional(),
  zipCode:           z.string().optional(),
  address:           z.string().optional(),
  preferredCurrency: z.string().min(1, 'Select a currency'),
});

const step3Schema = z.object({
  password: z.string()
    .min(8,'Minimum 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Must include uppercase, lowercase, number & special character'),
  confirmPassword: z.string().min(1,'Confirm your password'),
  phoneNumber:     z.string().optional(),
  dateOfBirth:     z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

type S1 = z.infer<typeof step1Schema>;
type S2 = z.infer<typeof step2Schema>;
type S3 = z.infer<typeof step3Schema>;

const STEPS = ['Personal','Location','Security'];

/* ── Password strength ─────────────────────────────────────── */
function PwStrength({ pw }: { pw: string }) {
  const checks = [
    { l:'8+ characters',       ok: pw.length >= 8 },
    { l:'Uppercase (A–Z)',      ok: /[A-Z]/.test(pw) },
    { l:'Lowercase (a–z)',      ok: /[a-z]/.test(pw) },
    { l:'Number (0–9)',         ok: /\d/.test(pw) },
    { l:'Special (@$!%*?&)',    ok: /[@$!%*?&]/.test(pw) },
  ];
  const score = checks.filter(c => c.ok).length;
  const bar   = ['bg-red-500','bg-orange-500','bg-yellow-400','bg-emerald-500','bg-emerald-400'];
  const txt   = ['text-red-400','text-orange-400','text-yellow-400','text-emerald-400','text-emerald-300'];
  const lbl   = ['Very Weak','Weak','Fair','Strong','Very Strong'];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-1.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i<=score ? bar[score-1] : 'bg-white/10'}`} />
        ))}
        {pw && <span className={`text-xs font-bold ml-1 shrink-0 ${txt[score-1]}`}>{lbl[score-1]}</span>}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c,i) => (
          <div key={i} className={`flex items-center gap-1.5 text-[11px] transition-colors ${c.ok ? 'text-emerald-400' : 'text-white/28'}`}>
            <CheckCircle size={10} /> {c.l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable Field wrapper ────────────────────────────────── */
function F({ label, err, opt, children }: {
  label: string; err?: string; opt?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-white/60">
        {label}{opt && <span className="text-[11px] font-normal text-white/28 ml-1">(optional)</span>}
      </label>
      {children}
      {err && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={10}/>{err}</span>}
    </div>
  );
}

/* ── Shared Tailwind classes ───────────────────────────────── */
const base = 'w-full bg-[#1e2940] border border-white/15 rounded-xl py-3 text-sm text-white placeholder-white/22 outline-none focus:border-amber-500/55 focus:bg-[#243050] transition-all [color-scheme:dark]';
const pi   = `${base} pl-10 pr-4`;   // padded left for icon
const plain = `${base} px-4`;         // no icon
const sel  = `${pi} appearance-none cursor-pointer`;
const err  = 'border-red-500/50';

/* ── Main ──────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [step,       setStep]       = useState(0);
  const [s1data,     setS1data]     = useState<S1 | null>(null);
  const [s2data,     setS2data]     = useState<S2 | null>(null);
  const [showPw,     setShowPw]     = useState(false);
  const [showCPw,    setShowCPw]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [apiErr,     setApiErr]     = useState('');
  const [userId,     setUserId]     = useState('');
  const [pwVal,      setPwVal]      = useState('');
  const [ctyInfo,    setCtyInfo]    = useState<typeof COUNTRIES[0]|null>(null);

  const f1 = useForm<S1>({ resolver: zodResolver(step1Schema) });
  const f2 = useForm<S2>({ resolver: zodResolver(step2Schema), defaultValues: { preferredCurrency:'USD' } });
  const f3 = useForm<S3>({ resolver: zodResolver(step3Schema) });

  const onS1 = (d: S1) => { setS1data(d); setStep(1); setApiErr(''); };
  const onS2 = (d: S2) => { setS2data(d); setStep(2); setApiErr(''); };

  const onS3 = async (d: S3) => {
    if (!s1data || !s2data) return;
    setLoading(true); setApiErr('');
    try {
      const res = await api.post('/auth/register', {
        ...s1data, ...s2data,
        password:    d.password,
        phoneNumber: d.phoneNumber || undefined,
        dateOfBirth: d.dateOfBirth || undefined,
      });
      setUserId(res.data.data?.userId ?? '');
      setStep(3);
    } catch (e: any) {
      const m = e.response?.data?.message;
      setApiErr(Array.isArray(m) ? m[0] : m || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const back = () => { setStep(s => s-1); setApiErr(''); };

  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find(x => x.code === code) ?? null;
    setCtyInfo(c);
    if (c) f2.setValue('preferredCurrency', c.currency);
  };

  /* Stepper pill */
  const dot = (i: number) =>
    i < step  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
    : i===step ? 'bg-amber-500/12 border-amber-500/45 text-amber-400'
    :            'bg-white/4 border-white/10 text-white/22';

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col relative overflow-hidden" style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-emerald-500/4 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-500/3 blur-[80px]" />
        <div className="absolute inset-0" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-[#050d1a] text-[15px]">N</div>
          <span className="font-extrabold text-[17px] text-white">NexaBank</span>
        </Link>
        <Link href="/login" className="text-sm text-white/38 hover:text-white/70 transition-colors no-underline">
          Already have an account? <span className="text-amber-400 font-semibold">Sign in →</span>
        </Link>
      </nav>

      {/* Layout */}
      <div className="relative z-10 flex flex-1">

        {/* Left — hidden on mobile/tablet */}
        <aside className="hidden xl:flex flex-col justify-center flex-1 bg-gradient-to-br from-[#0a2342]/80 to-[#050d1a] border-r border-white/5 px-14 py-12">
          <div className="max-w-[360px]">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-full mb-8 tracking-widest">
              <Building2 size={11}/> OPEN IN 5 MINUTES · 70+ COUNTRIES
            </div>
            <h1 className="text-[46px] font-extrabold leading-[1.07] tracking-tight mb-5">
              Your Financial<br/>Future Starts<br/>
              <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Right Here</span>
            </h1>
            <p className="text-white/42 text-[14px] leading-relaxed mb-9">
              Join 850,000+ members who trust NexaBank for transfers, investments, virtual cards, and global wires — in your currency.
            </p>
            <div className="space-y-4 mb-9">
              {[
                ['🏦','Free Checking & Savings','No monthly fees, no minimums'],
                ['📈','Stock Investments','Buy US equities commission-free'],
                ['💳','Virtual Cards','Up to 5 Visa or Mastercard cards'],
                ['🌍','Global Transfers','Send to 70+ countries in local currency'],
              ].map(([e,t,d],i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{e}</span>
                  <div>
                    <div className="text-[13px] font-bold text-white">{t}</div>
                    <div className="text-[12px] text-white/38">{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={13} fill="#f59e0b" color="#f59e0b"/>)}</div>
              <p className="text-[11px] text-white/28">4.9/5 · 50,000+ reviews · FDIC Insured · SOC 2 Certified</p>
            </div>
          </div>
        </aside>

        {/* Right — form */}
        <div className="flex flex-col items-center justify-start flex-1 xl:flex-none xl:w-[580px] px-5 py-8 md:px-10 overflow-y-auto">
          <div className="w-full max-w-[440px]">

            {step < 3 ? (
              <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-6 md:p-8">

                {/* Stepper */}
                <div className="flex items-center mb-7">
                  {STEPS.map((s,i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all shrink-0 ${dot(i)}`}>
                          {i < step ? <CheckCircle size={13}/> : <span>{i+1}</span>}
                        </div>
                        <span className={`text-[12px] font-semibold hidden sm:block transition-colors ${i<=step ? 'text-white/65' : 'text-white/20'}`}>{s}</span>
                      </div>
                      {i < STEPS.length-1 && (
                        <div className={`h-px w-6 md:w-10 mx-2 transition-all ${i<step ? 'bg-emerald-500/35' : 'bg-white/8'}`}/>
                      )}
                    </div>
                  ))}
                </div>

                {/* API error */}
                {apiErr && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-[13px] rounded-xl px-4 py-3 mb-5">
                    <AlertCircle size={14} className="shrink-0"/> {apiErr}
                  </div>
                )}

                {/* ── STEP 1 ── */}
                {step===0 && (
                  <form onSubmit={f1.handleSubmit(onS1)} className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-[19px] font-extrabold tracking-tight">Personal Information</h2>
                      <p className="text-white/35 text-[13px] mt-1">Tell us a bit about yourself</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <F label="First Name" err={f1.formState.errors.firstName?.message}>
                        <div className="relative">
                          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                          <input {...f1.register('firstName')} placeholder="John" className={`${pi} ${f1.formState.errors.firstName ? err : ''}`}/>
                        </div>
                      </F>
                      <F label="Last Name" err={f1.formState.errors.lastName?.message}>
                        <div className="relative">
                          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                          <input {...f1.register('lastName')} placeholder="Doe" className={`${pi} ${f1.formState.errors.lastName ? err : ''}`}/>
                        </div>
                      </F>
                    </div>

                    <F label="Email Address" err={f1.formState.errors.email?.message}>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                        <input {...f1.register('email')} type="email" placeholder="john@example.com" className={`${pi} ${f1.formState.errors.email ? err : ''}`}/>
                      </div>
                    </F>

                    <F label="Username" err={f1.formState.errors.username?.message}>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-bold text-[14px] pointer-events-none">@</span>
                        <input {...f1.register('username')} placeholder="john_doe" autoComplete="username" className={`${pi} ${f1.formState.errors.username ? err : ''}`}/>
                      </div>
                    </F>

                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#050d1a] font-bold text-[14px] py-3.5 rounded-xl transition-all hover:-translate-y-px active:translate-y-0 hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)]">
                      Continue <ArrowRight size={15}/>
                    </button>
                    <p className="text-center text-[13px] text-white/35">
                      Have an account? <Link href="/login" className="text-amber-400 font-semibold hover:underline no-underline">Sign in</Link>
                    </p>
                  </form>
                )}

                {/* ── STEP 2 ── */}
                {step===1 && (
                  <form onSubmit={f2.handleSubmit(onS2)} className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-[19px] font-extrabold tracking-tight">Location & Currency</h2>
                      <p className="text-white/35 text-[13px] mt-1">Tell us where you're based</p>
                    </div>

                    {/* Country */}
                    <F label="Country" err={f2.formState.errors.country?.message}>
                      <div className="relative">
                        <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none z-10"/>
                        <select
                          {...f2.register('country')}
                          onChange={e => { f2.register('country').onChange(e); onCountryChange(e.target.value); }}
                          className={`${sel} ${f2.formState.errors.country ? err : ''}`}
                        >
                          <option value="">Select your country…</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▾</span>
                      </div>
                    </F>

                    {/* Currency */}
                    <F label="Account Currency" err={f2.formState.errors.preferredCurrency?.message}>
                      <div className="relative">
                        <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none z-10"/>
                        <select {...f2.register('preferredCurrency')} className={`${sel} ${f2.formState.errors.preferredCurrency ? err : ''}`}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▾</span>
                      </div>
                      {ctyInfo && (
                        <p className="text-[11px] text-white/28 -mt-0.5">
                          Auto-selected for {ctyInfo.flag} {ctyInfo.name} — you can change this
                        </p>
                      )}
                    </F>

                    {/* State */}
                    <F label="State / Province / Region" opt>
                      <div className="relative">
                        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                        <input {...f2.register('state')} placeholder="e.g. California, Lagos, Ontario" className={pi}/>
                      </div>
                    </F>

                    <div className="grid grid-cols-2 gap-3">
                      <F label="ZIP / Postal Code" opt>
                        <input {...f2.register('zipCode')} placeholder="e.g. 10001" className={plain}/>
                      </F>
                      <div/>{/* spacer */}
                    </div>

                    {/* Address */}
                    <F label="Street Address" opt>
                      <div className="relative">
                        <MapPin size={13} className="absolute left-3 top-3.5 text-white/25 pointer-events-none"/>
                        <textarea {...f2.register('address')} rows={2} placeholder="e.g. 123 Main Street, Apt 4B"
                          className={`${pi} resize-none leading-relaxed`}/>
                      </div>
                    </F>

                    {/* Info banner */}
                    <div className="flex items-start gap-2.5 bg-blue-500/7 border border-blue-500/15 rounded-xl px-4 py-3">
                      <span className="text-blue-400 text-base leading-none mt-px shrink-0">ℹ</span>
                      <p className="text-[12px] text-white/40 leading-relaxed">
                        All your accounts will be created in your chosen currency. You can still send and receive in other currencies via transfers.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={back}
                        className="flex items-center gap-1.5 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-semibold text-white/50 hover:bg-white/8 hover:text-white transition-all shrink-0">
                        <ArrowLeft size={14}/> Back
                      </button>
                      <button type="submit"
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#050d1a] font-bold text-[14px] py-3 rounded-xl transition-all hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)]">
                        Continue <ArrowRight size={15}/>
                      </button>
                    </div>
                  </form>
                )}

                {/* ── STEP 3 ── */}
                {step===2 && (
                  <form onSubmit={f3.handleSubmit(onS3)} className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-[19px] font-extrabold tracking-tight">Security Setup</h2>
                      <p className="text-white/35 text-[13px] mt-1">Create a strong password to protect your account</p>
                    </div>

                    <F label="Password" err={f3.formState.errors.password?.message}>
                      <div className="relative">
                        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                        <input
                          {...f3.register('password')}
                          type={showPw ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          className={`${pi} pr-11 ${f3.formState.errors.password ? err : ''}`}
                          onChange={e => { f3.register('password').onChange(e); setPwVal(e.target.value); }}
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/60 transition-colors bg-transparent border-none p-0 cursor-pointer">
                          {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                      {pwVal && <PwStrength pw={pwVal}/>}
                    </F>

                    <F label="Confirm Password" err={f3.formState.errors.confirmPassword?.message}>
                      <div className="relative">
                        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                        <input
                          {...f3.register('confirmPassword')}
                          type={showCPw ? 'text' : 'password'}
                          placeholder="Repeat your password"
                          className={`${pi} pr-11 ${f3.formState.errors.confirmPassword ? err : ''}`}
                        />
                        <button type="button" onClick={() => setShowCPw(!showCPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/28 hover:text-white/60 transition-colors bg-transparent border-none p-0 cursor-pointer">
                          {showCPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </F>

                    <div className="grid grid-cols-2 gap-3">
                      <F label="Phone" opt>
                        <div className="relative">
                          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                          <input {...f3.register('phoneNumber')} type="tel" placeholder="+1 212 555 0123" className={pi}/>
                        </div>
                      </F>
                      <F label="Date of Birth" opt>
                        <div className="relative">
                          <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"/>
                          <input {...f3.register('dateOfBirth')} type="date" className={pi}/>
                        </div>
                      </F>
                    </div>

                    {/* Terms */}
                    <div className="flex gap-3 items-start pt-1">
                      <input id="terms" type="checkbox" required className="mt-0.5 shrink-0 w-4 h-4 accent-amber-500 cursor-pointer"/>
                      <label htmlFor="terms" className="text-[13px] text-white/42 leading-relaxed cursor-pointer">
                        I agree to the{' '}
                        <a href="#" className="text-amber-400 font-semibold hover:underline">Terms of Service</a>{' '}
                        and <a href="#" className="text-amber-400 font-semibold hover:underline">Privacy Policy</a>.
                        I am 18+ years old.
                      </label>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={back}
                        className="flex items-center gap-1.5 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[13px] font-semibold text-white/50 hover:bg-white/8 hover:text-white transition-all shrink-0">
                        <ArrowLeft size={14}/> Back
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#050d1a] font-bold text-[14px] py-3 rounded-xl transition-all hover:not-disabled:-translate-y-px hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)]">
                        {loading
                          ? <><Loader2 size={15} className="animate-spin"/> Creating Account…</>
                          : <>Create Account <ArrowRight size={15}/></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            ) : (
              /* ── SUCCESS ── */
              <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-7 md:p-9 flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle size={38} color="#10b981"/>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold mb-2">Account Created! 🎉</h2>
                  <p className="text-white/48 text-[14px] leading-relaxed">
                    Welcome to NexaBank, <strong className="text-white">{s1data?.firstName}</strong>!<br/>
                    We sent a code to <strong className="text-white">{s1data?.email}</strong>.
                  </p>
                </div>

                {/* Summary */}
                <div className="w-full bg-white/3 border border-white/7 rounded-xl p-4 text-left space-y-2.5">
                  {[
                    { l:'Country',  v:`${COUNTRIES.find(c=>c.code===s2data?.country)?.flag??''} ${COUNTRIES.find(c=>c.code===s2data?.country)?.name ?? s2data?.country}` },
                    { l:'Currency', v: CURRENCIES.find(c=>c.code===s2data?.preferredCurrency)?.name ?? s2data?.preferredCurrency },
                  ].filter(r => r.v).map(({ l, v }) => (
                    <div key={l} className="flex justify-between text-[13px]">
                      <span className="text-white/38">{l}</span>
                      <span className="text-white font-semibold">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Next steps */}
                <div className="w-full bg-white/3 border border-white/7 rounded-xl p-4 text-left space-y-3">
                  {[
                    'Check your email for the 6-digit OTP code',
                    'Verify your email to activate your account',
                    'Complete KYC to unlock all features',
                  ].map((t,i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-extrabold text-amber-400">{i+1}</div>
                      <span className="text-[13px] text-white/60">{t}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push(`/verify-email?userId=${userId}&email=${s1data?.email}`)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#050d1a] font-bold text-[15px] py-3.5 rounded-xl transition-all hover:-translate-y-px hover:shadow-[0_10px_28px_rgba(245,158,11,0.28)]">
                  Verify Email Now <ArrowRight size={16}/>
                </button>
                <button onClick={() => router.push('/login')}
                  className="text-[13px] text-white/28 hover:text-white/50 transition-colors bg-transparent border-none cursor-pointer" style={{ fontFamily:'inherit' }}>
                  I'll verify later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}