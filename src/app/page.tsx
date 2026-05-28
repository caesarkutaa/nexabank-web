'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, Zap, Globe, TrendingUp, CreditCard, Lock,
  ChevronRight, ArrowRight, CheckCircle, Users,
  Building2, Award, ChevronDown, Bitcoin, BarChart3, FileText,
} from 'lucide-react';
import { useSiteConfig } from '../app/hooks/Usesiteconfig';

const STATS = [
  { value: '$2.4B+', label: 'Assets Under Management' },
  { value: '850K+',  label: 'Active Members'           },
  { value: '180+',   label: 'Countries Served'         },
  { value: '99.99%', label: 'Uptime Guarantee'         },
];

const SECURITY = [
  'AES-256 encryption on all card data',
  '6-digit Security PIN on every transfer',
  'Email OTP authorization for all payments',
  'TOTP Two-Factor Authentication (2FA)',
  'AI-powered fraud detection',
  'Account lockout after failed attempts',
  'Full KYC identity verification',
  'Real-time transaction alerts',
];

const CHART_BARS = [40, 65, 45, 80, 55, 90, 70, 95, 60, 85];

const FAQS = [
  { q: 'Is this bank FDIC insured?',            a: 'Yes. Your deposits are insured up to $250,000 per depositor, per ownership category.'                          },
  { q: 'How long does account opening take?',   a: "Most accounts are opened in under 5 minutes. Register, verify your email, complete KYC, and you're ready."    },
  { q: 'What are the transfer fees?',           a: 'Intrabank transfers are always free. ACH costs $2.50. International wires are 2% capped at $50.'               },
  { q: 'Can I invest in stocks?',               a: 'Yes. We integrate with Alpaca Markets, giving you access to all US-listed equities directly from the dashboard.' },
  { q: 'How do virtual cards work?',            a: 'Virtual cards are generated instantly and linked to your account. Set limits, freeze, or delete anytime.'       },
];

// ── Footer columns: [column title, [[label, href], ...]][] ────
const FOOTER_LINKS: [string, [string, string][]][] = [
  ['Products', [
    ['Checking Account', '/register'],
    ['Savings Account',  '/register'],
    ['Virtual Cards',    '/dashboard/cards'],
    ['Investments',      '/dashboard/investments'],
    ['Loans',            '/dashboard/loans'],
    ['Crypto',           '/dashboard/crypto'],
  ]],
  ['Company', [
    ['About Us',  '/aboutus'],
    ['Careers',   '/careers'],
    ['Press',     '/press'],
    ['Blog',      '/blog'],
    ['Investors', '/investors'],
    ['Partners',  '/partners'],
  ]],
  ['Support', [
    ['Help Center', '/help'],
    ['Contact Us',  '/contact'],
    ['Security',    '/security'],
    ['Status',      '/status'],
    ['Community',   '/community'],
    ['API Docs',    '/docs'],
  ]],
  ['Legal', [
    ['Privacy Policy',   '/privacy'],
    ['Terms of Service', '/terms'],
    ['Cookie Policy',    '/cookies'],
    ['FDIC Notice',      '/fdic'],
    ['Disclosures',      '/disclosures'],
  ]],
];

export default function LandingPage() {
  const { config } = useSiteConfig();

  const BASE      = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';
  const bankName  = config?.bankName    || 'NexaBank';
  const tagline   = config?.bankTagline || 'Banking Built for the Modern Era';
  const logoUrl   = config?.logoUrl     ? `${BASE}${config.logoUrl}` : null;
  const copyright = config?.copyrightText || `© ${new Date().getFullYear()} ${bankName}, N.A. · Member FDIC · Equal Housing Lender`;

  const FEATURES = [
    { Icon: Zap,        title: 'Instant Transfers',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  desc: 'Move money in seconds — intrabank, ACH, or international wire.'                       },
    { Icon: Shield,     title: 'Bank-Grade Security', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  desc: 'AES-256 encryption, 2FA, biometric PIN, and real-time fraud monitoring.'              },
    { Icon: TrendingUp, title: 'Stock Investments',   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  desc: 'Buy and sell US equities directly from your banking dashboard.'                       },
    { Icon: Globe,      title: 'International Wires', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Send funds globally via SWIFT. Competitive exchange rates with transparent fees.'      },
    { Icon: CreditCard, title: 'Virtual Cards',       color: '#ec4899', bg: 'rgba(236,72,153,0.12)', desc: 'Issue virtual cards instantly. Set limits, freeze, or cancel anytime.'                 },
    { Icon: Lock,       title: 'Smart Lending',       color: '#f97316', bg: 'rgba(249,115,22,0.12)', desc: 'Personal, auto, mortgage and business loans with instant decisioning.'                 },
    { Icon: Bitcoin,    title: 'Crypto Payments',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',  desc: 'Send and receive crypto payments seamlessly integrated into your banking workflow.'    },
    { Icon: BarChart3,  title: 'Bill Payments',       color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  desc: 'Manage all your bills from one dashboard. Schedule, automate, never miss a payment.'   },
    { Icon: FileText,   title: 'Cheque Services',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', desc: 'Issue and manage digital cheques with full audit trail and instant verification.'     },
  ];

  const [openFaq,  setOpenFaq]  = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [tilt,     setTilt]     = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const onCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top)  / r.height - 0.5) * 12,
      y: ((e.clientX - r.left) / r.width  - 0.5) * -12,
    });
  };

  return (
    <div className="min-h-screen bg-[#060810] text-slate-300 overflow-x-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes approved-stamp {
          0%  { opacity:0; transform:rotate(-6deg) scale(0.6); }
          65% { transform:rotate(4deg) scale(1.06); }
          100%{ opacity:1; transform:rotate(4deg) scale(1); }
        }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse-ring { 0%,100%{opacity:.25;transform:scale(1)} 50%{opacity:.6;transform:scale(1.05)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .card-float { animation: float 5s ease-in-out infinite; }
        .approved   { animation: approved-stamp .55s 1.1s cubic-bezier(.34,1.56,.64,1) both; }
        .shimmer-gold {
          background: linear-gradient(90deg,#f59e0b 0%,#fde68a 40%,#f59e0b 60%,#d97706 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .anim-1{ animation: fade-up .8s .0s ease both; }
        .anim-2{ animation: fade-up .8s .12s ease both; }
        .anim-3{ animation: fade-up .8s .24s ease both; }
        .anim-4{ animation: fade-up .8s .36s ease both; }
        .footer-link {
          display: block;
          font-size: 13px;
          margin-bottom: 10px;
          color: rgba(255,255,255,0.35);
          font-weight: 300;
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover { color: rgba(255,255,255,0.7); }
      `}</style>

      {/* Atmospheric bg */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{ position:'absolute', width:700, height:700, top:-120, right:-80, background:'radial-gradient(circle,rgba(245,158,11,0.09) 0%,transparent 68%)', filter:'blur(70px)' }} />
        <div style={{ position:'absolute', width:600, height:600, bottom:-80, left:-100, background:'radial-gradient(circle,rgba(59,130,246,0.07) 0%,transparent 68%)', filter:'blur(70px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)', backgroundSize:'72px 72px' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 35%,rgba(6,8,16,0.65) 100%)' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ padding: scrolled ? '13px 0' : '20px 0', background: scrolled ? 'rgba(6,8,16,0.94)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(245,158,11,0.1)' : 'none' }}>
        <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={bankName} style={{ height:36, width:'auto', objectFit:'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#060810', boxShadow:'0 0 18px rgba(245,158,11,0.28)' }}>
                {bankName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xl font-extrabold text-white" style={{ letterSpacing:'-0.3px' }}>{bankName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-9">
            {['Features','Security','FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[13px] font-medium text-white/60 hover:text-white transition-colors" style={{ letterSpacing:'0.02em' }}>{l}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-white/70 px-4 py-2 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Sign In</Link>
            <Link href="/register" className="text-[13px] font-bold text-[#060810] px-5 py-2.5 rounded-lg transition-all hover:-translate-y-px"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 4px 16px rgba(245,158,11,0.22)' }}>
              Open Account
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-8 flex items-center gap-16 flex-wrap"
        style={{ minHeight:'100vh', paddingTop:120, paddingBottom:80 }}>
        <div className="flex-1 min-w-[320px] max-w-[560px]">
          <div className="anim-1 inline-flex items-center gap-2 text-[11px] font-semibold px-3.5 py-1.5 rounded-full mb-7"
            style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.28)', color:'#f59e0b', letterSpacing:'0.1em' }}>
            <Shield size={11} /> FDIC INSURED · MEMBER SINCE 2024
          </div>

          <h1 className="anim-2 font-extrabold text-white mb-5"
            style={{ fontSize:'clamp(38px,5vw,60px)', letterSpacing:'-2px', lineHeight:1.05 }}>
            {tagline.split(' ').slice(0, -2).join(' ')}{' '}
            <span className="shimmer-gold">{tagline.split(' ').slice(-2).join(' ')}</span>
          </h1>

          <p className="anim-3 text-[16px] leading-relaxed mb-9 max-w-[460px]" style={{ color:'rgba(255,255,255,0.55)', fontWeight:300 }}>
            One account. Every financial service you need. Transfers, investments, virtual cards, crypto, and loans — all in one place.
          </p>

          <div className="anim-3 flex gap-3.5 flex-wrap mb-7">
            <Link href="/register" className="inline-flex items-center gap-2 text-[14px] font-bold text-[#060810] px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 8px 24px rgba(245,158,11,0.28)' }}>
              Start Banking Free <ArrowRight size={16} />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 text-[14px] font-semibold text-white px-6 py-3.5 rounded-xl transition-all hover:bg-white/[0.08]"
              style={{ border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.03)' }}>
              See All Features
            </a>
          </div>

          <div className="anim-4 flex gap-5 flex-wrap">
            {['No monthly fees','No minimum balance','Open in 5 minutes'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-[12px]" style={{ color:'rgba(255,255,255,0.45)', fontWeight:300 }}>
                <CheckCircle size={13} color="#10b981" className="flex-shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — card visuals */}
        <div className="flex-1 min-w-[300px] max-w-[420px] flex flex-col gap-4">
          <div ref={cardRef} className="card-float" onMouseMove={onCardMove} onMouseLeave={() => setTilt({ x:0, y:0 })}
            style={{ position:'relative', cursor:'default', transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition:'transform 0.14s ease' }}>
            <div className="relative overflow-hidden rounded-[20px]"
              style={{ padding:'28px 26px', background:'linear-gradient(135deg,#1a2f45 0%,#0a1e30 55%,#14273d 100%)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.08)' }}>
              <div style={{ position:'absolute', inset:0, borderRadius:20, pointerEvents:'none', background:'linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.035) 50%,transparent 70%)' }} />
              <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(245,158,11,0.06)', pointerEvents:'none' }} />
              <div style={{ width:44, height:34, borderRadius:7, marginBottom:26, background:'linear-gradient(135deg,#d4af37,#9a7c10)', boxShadow:'0 4px 12px rgba(212,175,55,0.35)' }} />
              <div className="text-[11px] uppercase mb-1.5" style={{ color:'rgba(255,255,255,0.4)', letterSpacing:'0.18em' }}>{bankName}</div>
              <div className="text-[19px] font-medium text-white mb-5" style={{ letterSpacing:'3.5px', fontFamily:"'Courier New', monospace", color:'rgba(240,230,200,0.9)' }}>4921 •••• •••• 8847</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[9px] uppercase mb-1" style={{ color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>Card Holder</div>
                  <div className="text-[13px] font-semibold text-white" style={{ letterSpacing:'1.5px' }}>JOHN DOE</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase mb-1" style={{ color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em' }}>Expires</div>
                  <div className="text-[13px] font-semibold text-white">04/27</div>
                </div>
                <div style={{ display:'flex' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(220,53,69,0.8)', marginRight:-10 }} />
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,165,0,0.8)' }} />
                </div>
              </div>
              <div style={{ position:'absolute', bottom:-50, right:-50, width:160, height:160, borderRadius:'50%', border:'1px solid rgba(245,158,11,0.07)', pointerEvents:'none' }} />
            </div>
            <div className="approved" style={{ position:'absolute', top:14, right:-10, border:'2.5px solid rgba(16,185,129,0.8)', borderRadius:7, padding:'5px 11px', fontSize:12, fontWeight:700, letterSpacing:'0.18em', color:'rgba(16,185,129,0.9)', background:'rgba(6,8,16,0.75)', backdropFilter:'blur(8px)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', transform:'rotate(4deg)' }}>✓ APPROVED</div>
          </div>

          <div className="rounded-[16px] p-5" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[13px]" style={{ color:'rgba(255,255,255,0.45)' }}>Total Balance</span>
              <span className="text-[22px] font-bold text-white" style={{ letterSpacing:'-0.5px' }}>$48,291.00</span>
            </div>
            <div style={{ height:1, background:'rgba(255,255,255,0.07)', marginBottom:14 }} />
            <div className="flex gap-5 mb-4">
              {[['#10b981','Income','+$6,420'],['#ef4444','Expenses','-$2,180']].map(([c,l,v]) => (
                <div key={l as string} className="flex items-center gap-1.5 text-[12px]" style={{ color:'rgba(255,255,255,0.55)', fontWeight:300 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:c as string, flexShrink:0 }} />
                  {l}<span className="font-semibold ml-1" style={{ color:'rgba(255,255,255,0.8)' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1" style={{ height:44 }}>
              {CHART_BARS.map((h,i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height:`${h}%`, minHeight:4, background:`linear-gradient(180deg,rgba(245,158,11,${0.7+i*0.02}),rgba(245,158,11,0.2))` }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[14px] px-4 py-3.5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CheckCircle size={16} color="#10b981" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-white/80">Wire Transfer</div>
                <div className="text-[11px]" style={{ color:'rgba(255,255,255,0.35)', fontWeight:300 }}>Today, 2:14 PM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold" style={{ color:'#10b981' }}>+$3,250.00</div>
              <div className="text-[10px] font-bold" style={{ color:'rgba(16,185,129,0.6)', letterSpacing:'0.08em' }}>COMPLETED</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="relative z-10 py-14 px-8" style={{ borderTop:'1px solid rgba(245,158,11,0.1)', borderBottom:'1px solid rgba(245,158,11,0.1)', background:'rgba(245,158,11,0.018)' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s,i) => (
            <div key={i}>
              <div className="font-extrabold mb-1.5 shimmer-gold" style={{ fontSize:'clamp(28px,3vw,38px)', letterSpacing:'-1.5px' }}>{s.value}</div>
              <div className="text-[13px] font-medium" style={{ color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-28 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase mb-5" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', letterSpacing:'0.12em' }}>Everything You Need</span>
            <h2 className="font-extrabold text-white mb-4" style={{ fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-1.5px' }}>A Complete Financial OS</h2>
            <p className="text-[15px] max-w-[500px] mx-auto leading-relaxed" style={{ color:'rgba(255,255,255,0.5)', fontWeight:300 }}>
              {bankName} replaces your bank, brokerage, and crypto wallet with one unified, secure platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f,i) => (
              <div key={i} className="rounded-[16px] p-7 cursor-default transition-all duration-200"
                style={{ background:'rgba(255,255,255,0.028)', border:'1px solid rgba(255,255,255,0.065)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background='rgba(255,255,255,0.055)'; el.style.borderColor='rgba(245,158,11,0.2)'; el.style.transform='translateY(-3px)'; el.style.boxShadow='0 16px 40px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background='rgba(255,255,255,0.028)'; el.style.borderColor='rgba(255,255,255,0.065)'; el.style.transform='translateY(0)'; el.style.boxShadow='none'; }}>
                <div style={{ width:46, height:46, borderRadius:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', background:f.bg, color:f.color }}><f.Icon size={21} /></div>
                <h3 className="text-[16px] font-bold text-white mb-2.5">{f.title}</h3>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color:'rgba(255,255,255,0.48)', fontWeight:300 }}>{f.desc}</p>
                <ChevronRight size={15} style={{ color:'rgba(255,255,255,0.25)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" className="relative z-10 py-28 px-8" style={{ background:'rgba(10,22,40,0.5)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1200px] mx-auto flex gap-20 items-center flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <span className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase mb-6" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', letterSpacing:'0.12em' }}>Security First</span>
            <h2 className="font-extrabold text-white mb-5" style={{ fontSize:'clamp(28px,4vw,44px)', letterSpacing:'-1.5px', lineHeight:1.1 }}>Your Money.<br />Fully Protected.</h2>
            <p className="text-[15px] leading-relaxed mb-9" style={{ color:'rgba(255,255,255,0.5)', fontWeight:300, maxWidth:440 }}>
              {bankName} was built with a security-first architecture. Every transaction is verified, every session is monitored, and every account is protected by multiple independent layers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECURITY.map((item,i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px]" style={{ color:'rgba(255,255,255,0.65)', fontWeight:300 }}>
                  <CheckCircle size={14} color="#10b981" className="flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-7 flex-shrink-0">
            <div className="relative flex items-center justify-center" style={{ width:210, height:210 }}>
              {[210,158,106].map((s,i) => (
                <div key={i} className="absolute rounded-full" style={{ width:s, height:s, border:'1px solid', borderColor:`rgba(245,158,11,${0.08+i*0.12})`, animation:`pulse-ring ${3.2+i*0.6}s ease-in-out ${i*0.45}s infinite` }} />
              ))}
              <div className="relative z-10 flex items-center justify-center rounded-full" style={{ width:82, height:82, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.28)', boxShadow:'0 0 36px rgba(245,158,11,0.12)' }}>
                <Shield size={36} color="#f59e0b" />
              </div>
            </div>
            <div className="flex gap-2.5 flex-wrap justify-center">
              {[['FDIC Insured',Award],['256-bit SSL',Lock],['SOC 2 Type II',Shield]].map(([label,Icon]: any, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.6)' }}>
                  <Icon size={13} /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-28 px-8">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase mb-5" style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', letterSpacing:'0.12em' }}>FAQ</span>
            <h2 className="font-extrabold text-white" style={{ fontSize:'clamp(28px,4vw,44px)', letterSpacing:'-1.5px' }}>Common Questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((f,i) => (
              <div key={i} className="rounded-[12px] overflow-hidden transition-all duration-200"
                style={{ background:'rgba(255,255,255,0.028)', border:`1px solid ${openFaq===i ? 'rgba(245,158,11,0.28)' : 'rgba(255,255,255,0.07)'}` }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-white text-[14px] font-semibold text-left cursor-pointer"
                  style={{ padding:'18px 22px', background:'transparent', border:'none', fontFamily:'inherit' }}>
                  <span>{f.q}</span>
                  <ChevronDown size={17} className="flex-shrink-0" style={{ color: openFaq===i ? '#f59e0b' : 'rgba(255,255,255,0.35)', transform: openFaq===i ? 'rotate(180deg)' : 'none', transition:'transform 0.2s, color 0.2s' }} />
                </button>
                {openFaq===i && (
                  <div className="text-[13px] leading-relaxed" style={{ padding:'0 22px 18px', color:'rgba(255,255,255,0.55)', fontWeight:300 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-28 px-8 overflow-hidden" style={{ background:'linear-gradient(135deg,#0a1e30 0%,#0d2540 100%)', borderTop:'1px solid rgba(245,158,11,0.1)' }}>
        <div style={{ position:'absolute', top:-200, right:-100, width:600, height:600, pointerEvents:'none', background:'radial-gradient(circle,rgba(245,158,11,0.08),transparent 68%)', filter:'blur(40px)' }} />
        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          <div style={{ width:72, height:72, borderRadius:18, margin:'0 auto 28px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.28)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 36px rgba(245,158,11,0.1)' }}>
            <Building2 size={34} color="#f59e0b" />
          </div>
          <h2 className="font-extrabold text-white mb-5" style={{ fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-1.5px', lineHeight:1.1 }}>Ready to Upgrade Your Banking?</h2>
          <p className="text-[15px] max-w-[460px] mx-auto leading-relaxed mb-10" style={{ color:'rgba(255,255,255,0.55)', fontWeight:300 }}>
            Join 850,000+ members who trust {bankName} for their financial life. Open your account in 5 minutes.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap mb-9">
            <Link href="/register" className="inline-flex items-center gap-2 text-[14px] font-bold text-[#060810] px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow:'0 8px 24px rgba(245,158,11,0.28)' }}>
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="inline-flex items-center text-[14px] font-medium px-6 py-3.5 rounded-xl transition-colors hover:text-white" style={{ color:'rgba(255,255,255,0.6)' }}>
              Already a member? Sign in
            </Link>
          </div>
          <div className="flex items-center justify-center gap-7 flex-wrap">
            {[[Users,'850K+ members'],[Shield,'FDIC Insured'],[Award,'SOC 2 Certified']].map(([Icon,label]: any,i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color:'rgba(255,255,255,0.38)', fontWeight:300 }}>
                <Icon size={12} color="rgba(245,158,11,0.55)" /> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 pt-16 pb-9 px-8" style={{ background:'#040509', borderTop:'1px solid rgba(245,158,11,0.08)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex gap-20 mb-12 flex-wrap">

            {/* Brand blurb */}
            <div className="flex-shrink-0" style={{ width:240 }}>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={bankName} style={{ height:34, width:'auto', objectFit:'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                ) : (
                  <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#040509' }}>
                    {bankName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[19px] font-extrabold text-white" style={{ letterSpacing:'-0.3px' }}>{bankName}</span>
              </Link>
              <p className="text-[13px] leading-relaxed mb-5" style={{ color:'rgba(255,255,255,0.35)', fontWeight:300 }}>
                Banking for the modern era. Secure, fast, and built for you.
              </p>
            </div>

            {/* Link columns */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
              {FOOTER_LINKS.map(([title, links]) => (
                <div key={title}>
                  <div className="text-[11px] font-bold text-white/80 uppercase mb-4" style={{ letterSpacing:'0.1em' }}>
                    {title}
                  </div>
                  {links.map(([label, href]) => (
                    <Link key={label} href={href} className="footer-link">
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

          </div>

          {/* Bottom legal */}
          <div className="flex flex-col gap-2 pt-7" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.22)', fontWeight:300 }}>{copyright}</p>
            <p className="text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.22)', fontWeight:300 }}>
              {bankName} is not a licensed investment advisor. Investment products are not FDIC insured, not bank guaranteed, and may lose value.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}