'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

const METRICS = [
  { label:'Total Assets Under Management', value:'$2.4B',  note:'As of Q1 2025' },
  { label:'Annual Revenue Run Rate',        value:'$180M',  note:'Q1 2025 annualised' },
  { label:'Year-over-Year Growth',          value:'70%',    note:'Member growth 2024→2025' },
  { label:'Active Members',                 value:'850K+',  note:'Across 180 countries' },
  { label:'Net Promoter Score',             value:'72',     note:'Industry avg: 34' },
  { label:'Valuation (Series C)',           value:'$1.4B',  note:'November 2024' },
];

const ROUNDS = [
  { round:'Series C', date:'Nov 2024', amount:'$120M', lead:'Andreessen Horowitz',     investors:'a16z, Sequoia, Tiger Global',         note:'International expansion + AI fraud detection' },
  { round:'Series B', date:'Mar 2023', amount:'$55M',  lead:'Sequoia Capital',          investors:'Sequoia, General Catalyst, Ribbit',   note:'Lending product launch + banking charter' },
  { round:'Series A', date:'Aug 2021', amount:'$18M',  lead:'General Catalyst',         investors:'General Catalyst, Inspired Capital',  note:'Product-market fit, first 50K members' },
  { round:'Seed',     date:'Jan 2020', amount:'$3.2M', lead:'Y Combinator',             investors:'YC, angel investors',                 note:'Initial product development' },
];

const BOARD = [
  { name:'Sarah Chen',       role:'CEO & Co-founder',       init:'SC', color:'#f59e0b' },
  { name:'Marcus Williams',  role:'CTO & Co-founder',       init:'MW', color:'#60a5fa' },
  { name:'Alexandra Park',   role:'Board Member (a16z)',     init:'AP', color:'#a78bfa' },
  { name:'Robert Mensah',    role:'Board Member (Sequoia)', init:'RM', color:'#34d399' },
  { name:'Dr. Janet Lewis',  role:'Independent Director',   init:'JL', color:'#f87171' },
];

export default function InvestorsPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  return (
    <div style={{ minHeight:'100vh',background:'#060810',color:'#e2e8f0',fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(6,8,16,.94)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(245,158,11,.1)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-.3px' }}>{bankName}</span>
        </Link>
        <a href="mailto:investors@nexabank.com" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Investor Enquiries</a>
      </nav>

      <div style={{ maxWidth:960,margin:'0 auto',padding:'64px 32px' }}>
        <div style={{ marginBottom:52 }}>
          <div style={{ fontSize:12,color:'#f59e0b',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>Investor Relations</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:14 }}>Building the World's Most Trusted Digital Bank</h1>
          <p style={{ fontSize:15,color:'rgba(255,255,255,.45)',lineHeight:1.7,maxWidth:620,fontWeight:300 }}>
            {bankName} is a FDIC-insured digital bank serving 850,000+ members across 180 countries. We offer a complete financial OS — checking, savings, transfers, investments, virtual cards, loans, and crypto — all in one platform.
          </p>
        </div>

        {/* Key metrics */}
        <section style={{ marginBottom:52 }}>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:20 }}>Key Metrics</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14 }}>
            {METRICS.map(({ label, value, note }) => (
              <div key={label} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px' }}>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8 }}>{label}</div>
                <div style={{ fontSize:28,fontWeight:900,color:'#f59e0b',fontFamily:'monospace',letterSpacing:'-1px',marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.28)',fontWeight:300 }}>{note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Funding history */}
        <section style={{ marginBottom:52 }}>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:20 }}>Funding History</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {ROUNDS.map(({ round, date, amount, lead, investors, note }) => (
              <div key={round} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px 22px',display:'grid',gridTemplateColumns:'80px 80px 1fr',gap:16,alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:4 }}>Round</div>
                  <div style={{ fontSize:14,fontWeight:800,color:'#f59e0b' }}>{round}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginTop:2 }}>{date}</div>
                </div>
                <div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginBottom:4 }}>Raised</div>
                  <div style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:'monospace' }}>{amount}</div>
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#fff',marginBottom:4 }}>Led by {lead}</div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:4,fontWeight:300 }}>{investors}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.25)',fontStyle:'italic' }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Board */}
        <section style={{ marginBottom:52 }}>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:20 }}>Board of Directors</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14 }}>
            {BOARD.map(({ name, role, init, color }) => (
              <div key={name} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:46,height:46,borderRadius:'50%',background:`${color}18`,border:`1px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color,flexShrink:0 }}>{init}</div>
                <div><div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:3 }}>{name}</div><div style={{ fontSize:12,color:'rgba(255,255,255,.4)',fontWeight:300 }}>{role}</div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section style={{ background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:16,padding:'28px 32px' }}>
          <h2 style={{ fontSize:18,fontWeight:700,color:'#fff',marginBottom:8 }}>Investor Relations Contact</h2>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:16,fontWeight:300,lineHeight:1.6 }}>For investor enquiries, financial reports, or media requests, please reach out directly.</p>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            <a href="mailto:investors@nexabank.com" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>📧 investors@nexabank.com</a>
            <a href="mailto:press@nexabank.com" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.6)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,textDecoration:'none' }}>Press Enquiries</a>
          </div>
          <div style={{ marginTop:16,fontSize:12,color:'rgba(255,255,255,.25)',fontWeight:300 }}>Forward-looking statements on this page involve risks and uncertainties. Actual results may differ materially from those projected.</div>
        </section>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300,marginTop:32 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['About','/about'],['Careers','/careers'],['Press','/press'],['Investors','/investors'],['Contact','/contact']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}