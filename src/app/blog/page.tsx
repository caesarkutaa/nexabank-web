'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

const POSTS = [
  { slug:'how-fdic-insurance-works',        cat:'Banking 101',  date:'May 12 2025',  read:'5 min', title:'How FDIC Insurance Actually Works — and What It Does Not Cover', excerpt:'Most people know deposits are "insured up to $250,000" but few understand the nuances of ownership categories, joint accounts, and what happens if your bank fails overnight.',       author:'Sarah Chen',      authorRole:'CEO' },
  { slug:'virtual-cards-explained',          cat:'Security',     date:'May 5 2025',   read:'4 min', title:'Virtual Cards: Your Best Defence Against Card Fraud',             excerpt:'Physical cards get skimmed. Virtual cards cannot. Here is everything you need to know about how they work, when to use them, and how to set spending limits.',                   author:'David Kim',       authorRole:'VP Security' },
  { slug:'investing-from-your-bank-account', cat:'Investing',    date:'Apr 28 2025',  read:'7 min', title:'How to Start Investing in Stocks Directly from Your Bank Account',excerpt:'You no longer need a separate brokerage. We walk through buying your first stock, understanding bid/ask spreads, and what "pending approval" means for your order.',               author:'Marcus Williams', authorRole:'CTO' },
  { slug:'crypto-vs-stocks-2025',           cat:'Investing',    date:'Apr 20 2025',  read:'6 min', title:'Crypto vs Stocks in 2025: What Every New Investor Should Know',   excerpt:'Both asset classes live inside NexaBank now. We break down the key differences in risk, liquidity, tax treatment, and when each makes sense in a diversified portfolio.',      author:'James Rodriguez', authorRole:'CFO' },
  { slug:'international-wire-guide',         cat:'Transfers',    date:'Apr 14 2025',  read:'5 min', title:'The Complete Guide to International Wire Transfers',              excerpt:'SWIFT codes, correspondent banks, cut-off times, and why your $1,000 transfer might arrive as $987.50. Everything you need to know before hitting Send.',                       author:'Priya Patel',     authorRole:'CRO' },
  { slug:'credit-score-for-loans',          cat:'Loans',        date:'Apr 7 2025',   read:'8 min', title:'What Credit Score Do You Need to Get a Loan at NexaBank?',        excerpt:'We pull back the curtain on our underwriting criteria — credit score ranges, debt-to-income ratios, income verification, and how to improve your approval chances.',              author:'Emma Thompson',   authorRole:'Head of Product' },
  { slug:'2fa-security-guide',              cat:'Security',     date:'Mar 30 2025',  read:'4 min', title:'Why You Should Enable 2FA on Your Bank Account Right Now',         excerpt:'A compromised password alone is not enough to access a 2FA-protected account. We explain TOTP, backup codes, and why SMS-based 2FA is weaker than you think.',               author:'David Kim',       authorRole:'VP Security' },
  { slug:'ach-vs-wire-transfer',            cat:'Transfers',    date:'Mar 22 2025',  read:'5 min', title:'ACH vs Wire Transfer: Which Should You Use and When?',             excerpt:'ACH is cheaper and slower. Wire is faster and pricier. But the real differences — reversibility, batch processing, and settlement windows — are more subtle than that.',       author:'Sarah Chen',      authorRole:'CEO' },
];

const CATS = ['All', ...Array.from(new Set(POSTS.map(p => p.cat)))];
const CAT_COLOR: Record<string,string> = {
  'Banking 101':'#60a5fa', Security:'#f87171', Investing:'#34d399',
  Transfers:'#f59e0b',     Loans:'#a78bfa',
};

export default function BlogPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? POSTS : POSTS.filter(p => p.cat === cat);
  const [featured, ...rest] = filtered;

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
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:12,color:'#f59e0b',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>The {bankName} Blog</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:10 }}>Banking Insights & Guides</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,.4)',fontWeight:300 }}>Plain-English guides to banking, investing, security, and personal finance.</p>
        </div>

        {/* Category filter */}
        <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:36 }}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{ padding:'7px 14px',borderRadius:10,fontSize:12,fontWeight:700,border:cat===c?`1px solid ${CAT_COLOR[c]??'rgba(245,158,11,.4)'}33`:'1px solid rgba(255,255,255,.1)',background:cat===c?`${CAT_COLOR[c]??'#f59e0b'}15`:'rgba(255,255,255,.04)',color:cat===c?(CAT_COLOR[c]??'#f59e0b'):'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:'inherit',transition:'all .15s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Featured post */}
        {featured && (
          <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.09)',borderRadius:18,padding:'32px',marginBottom:24,transition:'border-color .15s',cursor:'pointer' }}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,.2)')}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.09)')}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <span style={{ fontSize:10,fontWeight:700,color:CAT_COLOR[featured.cat]??'#f59e0b',background:`${CAT_COLOR[featured.cat]??'#f59e0b'}18`,borderRadius:6,padding:'3px 9px' }}>{featured.cat}</span>
              <span style={{ fontSize:12,color:'rgba(255,255,255,.3)' }}>{featured.date} · {featured.read} read</span>
              <span style={{ fontSize:10,fontWeight:700,color:'#f59e0b',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:6,padding:'3px 8px' }}>Featured</span>
            </div>
            <h2 style={{ fontSize:'clamp(18px,2.5vw,26px)',fontWeight:800,color:'#fff',letterSpacing:'-.5px',lineHeight:1.3,marginBottom:12 }}>{featured.title}</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.45)',lineHeight:1.7,marginBottom:16,fontWeight:300 }}>{featured.excerpt}</p>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(245,158,11,.15)',border:'1px solid rgba(245,158,11,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#f59e0b' }}>{featured.author[0]}</div>
              <div><div style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{featured.author}</div><div style={{ fontSize:11,color:'rgba(255,255,255,.3)' }}>{featured.authorRole}</div></div>
            </div>
          </div>
        )}

        {/* Rest of posts */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16 }}>
          {rest.map(post=>(
            <div key={post.slug} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'22px',transition:'border-color .15s,background .15s',cursor:'pointer' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,.2)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.05)'; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)'; }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
                <span style={{ fontSize:10,fontWeight:700,color:CAT_COLOR[post.cat]??'#f59e0b',background:`${CAT_COLOR[post.cat]??'#f59e0b'}18`,borderRadius:6,padding:'2px 7px' }}>{post.cat}</span>
                <span style={{ fontSize:11,color:'rgba(255,255,255,.28)' }}>{post.read} read</span>
              </div>
              <h3 style={{ fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.4,marginBottom:8 }}>{post.title}</h3>
              <p style={{ fontSize:12,color:'rgba(255,255,255,.4)',lineHeight:1.6,marginBottom:14,fontWeight:300 }}>{post.excerpt.slice(0,100)}…</p>
              <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                <div style={{ width:26,height:26,borderRadius:'50%',background:'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#f59e0b' }}>{post.author[0]}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.3)' }}>{post.author} · {post.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300,marginTop:32 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['About','/about'],['Blog','/blog'],['Careers','/careers'],['Contact','/contact'],['Privacy','/privacy']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}