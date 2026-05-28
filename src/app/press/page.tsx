'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

const PRESS_RELEASES = [
  { date:'May 2025',  tag:'Product',    title:'NexaBank Launches Crypto Investment Portfolio with Admin Approval Workflow',   excerpt:'Users can now invest in 10 top cryptocurrencies directly from their banking dashboard, with built-in compliance controls and admin oversight for every order.' },
  { date:'Mar 2025',  tag:'Growth',     title:'NexaBank Crosses 850,000 Active Members Across 180 Countries',                excerpt:'The milestone marks a 70% year-over-year growth rate, driven by expansion in Sub-Saharan Africa, Southeast Asia, and Latin America.' },
  { date:'Jan 2025',  tag:'Product',    title:'NexaBank Introduces Virtual Card Instant Issuance with Spending Controls',    excerpt:'Members can now issue unlimited virtual cards, set per-transaction and monthly spend limits, and freeze or delete cards in real time from the dashboard.' },
  { date:'Nov 2024',  tag:'Funding',    title:'NexaBank Raises $120M Series C Led by Andreessen Horowitz',                   excerpt:'The round values NexaBank at $1.4B and will fund international expansion, regulatory licensing in 15 new markets, and AI-powered fraud detection.' },
  { date:'Sep 2024',  tag:'Regulatory', title:'NexaBank Obtains Full Banking Charter, Achieves FDIC Member Status',          excerpt:'The charter allows NexaBank to offer FDIC-insured deposits up to $250,000, completing our transition from a fintech app to a fully licensed national bank.' },
  { date:'Jun 2024',  tag:'Product',    title:'NexaBank Launches Smart Loan Platform with Instant Decisioning',              excerpt:'Personal, auto, mortgage, and business loans are now available with automated underwriting, digital KYC, and same-day disbursement for approved applicants.' },
];

const COVERAGE = [
  { outlet:'TechCrunch',      logo:'TC', color:'#00d100', headline:'NexaBank is making banking actually bearable',        date:'Apr 2025' },
  { outlet:'Forbes',          logo:'F',  color:'#e4002b', headline:'The 10 Most Innovative Fintech Companies of 2025',   date:'Mar 2025' },
  { outlet:'Financial Times', logo:'FT', color:'#f7c948', headline:'How NexaBank is winning the underbanked market',     date:'Feb 2025' },
  { outlet:'Bloomberg',       logo:'B',  color:'#00c0ff', headline:'NexaBank: The startup banks are finally afraid of',  date:'Jan 2025' },
  { outlet:'Wired',           logo:'W',  color:'#fff',    headline:'Inside the bank that built itself like a startup',   date:'Dec 2024' },
  { outlet:'Business Insider',logo:'BI', color:'#fc0',    headline:'NexaBank named Best Digital Bank of 2024',           date:'Nov 2024' },
];

const TAG_COLOR: Record<string,string> = {
  Product:'#60a5fa', Growth:'#34d399', Funding:'#a78bfa', Regulatory:'#f59e0b',
};

export default function PressPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  return (
    <div style={{ minHeight:'100vh',background:'#060810',color:'#e2e8f0',fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(6,8,16,.94)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(245,158,11,.1)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-.3px' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Open Account</Link>
      </nav>

      <div style={{ maxWidth:1000,margin:'0 auto',padding:'64px 32px' }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:20,flexWrap:'wrap',marginBottom:52 }}>
          <div>
            <div style={{ fontSize:12,color:'#f59e0b',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>Newsroom</div>
            <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:10 }}>{bankName} Press Room</h1>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.4)',fontWeight:300 }}>Latest news, press releases, and media resources.</p>
          </div>
          <a href="mailto:press@nexabank.com" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'10px 18px',fontSize:13,fontWeight:700,color:'#f59e0b',textDecoration:'none',flexShrink:0 }}>
            📧 press@nexabank.com
          </a>
        </div>

        {/* Press coverage */}
        <section style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:20 }}>In the News</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
            {COVERAGE.map(({ outlet, logo, color, headline, date }) => (
              <div key={outlet} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'18px 20px',transition:'border-color .15s',cursor:'pointer' }}
                onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.15)')}
                onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)')}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
                  <div style={{ width:36,height:36,borderRadius:8,background:`${color}22`,border:`1px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color,flexShrink:0,fontFamily:'Georgia,serif' }}>{logo}</div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{outlet}</div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,.3)' }}>{date}</div>
                  </div>
                </div>
                <p style={{ fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.6,margin:0,fontWeight:300 }}>"{headline}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* Press releases */}
        <section style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:20 }}>Press Releases</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {PRESS_RELEASES.map(({ date, tag, title, excerpt }) => (
              <div key={title} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px 22px',transition:'border-color .15s,background .15s',cursor:'pointer' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,.2)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.05)'; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)'; }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                  <span style={{ fontSize:10,fontWeight:700,color:TAG_COLOR[tag]??'#f59e0b',background:`${TAG_COLOR[tag]??'#f59e0b'}18`,borderRadius:6,padding:'2px 8px' }}>{tag}</span>
                  <span style={{ fontSize:12,color:'rgba(255,255,255,.3)' }}>{date}</span>
                </div>
                <div style={{ fontSize:15,fontWeight:700,color:'#fff',marginBottom:8,lineHeight:1.4 }}>{title}</div>
                <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,margin:0,fontWeight:300 }}>{excerpt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Media kit */}
        <section style={{ background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)',borderRadius:16,padding:'28px 32px' }}>
          <h2 style={{ fontSize:18,fontWeight:700,color:'#fff',marginBottom:8 }}>Media Kit</h2>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.45)',marginBottom:20,lineHeight:1.6,fontWeight:300 }}>
            Download logos, brand guidelines, executive headshots, and product screenshots for editorial use.
          </p>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {['Logo Pack (.zip)','Brand Guidelines (PDF)','Executive Bios (PDF)','Product Screenshots (.zip)'].map(item=>(
              <div key={item} style={{ background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:9,padding:'8px 14px',fontSize:12,fontWeight:600,color:'rgba(255,255,255,.6)',cursor:'pointer' }}>
                ↓ {item}
              </div>
            ))}
          </div>
          <div style={{ marginTop:20,fontSize:13,color:'rgba(255,255,255,.35)',fontWeight:300 }}>
            Press enquiries: <a href="mailto:press@nexabank.com" style={{ color:'#f59e0b',textDecoration:'none' }}>press@nexabank.com</a> · Response within 2 business hours.
          </div>
        </section>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['About','/about'],['Careers','/careers'],['Press','/press'],['Contact','/contact'],['Privacy','/privacy']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}