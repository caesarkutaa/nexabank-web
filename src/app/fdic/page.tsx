'use client';
import Link from 'next/link';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function FdicPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  const covered = [
    'Checking accounts',
    'Savings accounts',
    'Money market deposit accounts (MMDAs)',
    'Certificates of deposit (CDs)',
    'Cashiers checks and money orders issued by the bank',
    'Negotiable order of withdrawal (NOW) accounts',
  ];

  const notCovered = [
    'Stock investments and brokerage accounts',
    'Mutual funds and ETFs',
    'Cryptocurrency holdings',
    'Life insurance policies',
    'Annuities',
    'Municipal and corporate bonds',
    'US Treasury bills, bonds, and notes (though backed by the US government)',
    'Safe deposit box contents',
  ];

  const ownershipCategories = [
    { title: 'Single Accounts',                   limit: '$250,000',  desc: 'Accounts owned by one person with no beneficiaries.' },
    { title: 'Joint Accounts',                    limit: '$500,000',  desc: 'Accounts owned by two or more people — $250,000 per co-owner.' },
    { title: 'Retirement Accounts (IRA, etc.)',   limit: '$250,000',  desc: 'Traditional and Roth IRAs are insured separately from other accounts.' },
    { title: 'Trust Accounts',                    limit: '$1,250,000+', desc: 'Revocable trusts with up to 5 beneficiaries receive $250,000 per beneficiary.' },
    { title: 'Business/Corporate Accounts',       limit: '$250,000',  desc: 'Accounts owned by corporations, partnerships, or unincorporated associations.' },
    { title: 'Government Accounts',               limit: '$250,000',  desc: 'Accounts owned by US federal, state, or local government entities.' },
  ];

  return (
    <div style={{ minHeight:'100vh',background:'#060810',color:'#e2e8f0',fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(6,8,16,.94)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(245,158,11,.1)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-.3px' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Open Account</Link>
      </nav>

      <div style={{ maxWidth:820,margin:'0 auto',padding:'64px 32px' }}>

        {/* Hero */}
        <div style={{ textAlign:'center',marginBottom:52 }}>
          <div style={{ width:72,height:72,borderRadius:18,background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
            <Shield size={34} color="#34d399"/>
          </div>
          <div style={{ fontSize:12,color:'#34d399',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>FDIC Insurance</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:14 }}>Your Deposits Are Protected</h1>
          <p style={{ fontSize:15,color:'rgba(255,255,255,.45)',fontWeight:300,maxWidth:560,margin:'0 auto',lineHeight:1.7 }}>
            {bankName} is a member of the Federal Deposit Insurance Corporation (FDIC). Your deposits are insured up to the legal limits at no cost to you.
          </p>
        </div>

        {/* Key fact banner */}
        <div style={{ background:'rgba(52,211,153,.07)',border:'1px solid rgba(52,211,153,.2)',borderRadius:16,padding:'20px 24px',marginBottom:40,display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(52,211,153,.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <CheckCircle2 size={24} color="#34d399"/>
          </div>
          <div>
            <div style={{ fontSize:16,fontWeight:800,color:'#34d399',marginBottom:4 }}>$250,000 per depositor, per ownership category</div>
            <div style={{ fontSize:13,color:'rgba(52,211,153,.7)',fontWeight:300,lineHeight:1.5 }}>
              If {bankName} were to fail, the FDIC guarantees you will receive your insured deposits within a few business days — automatically, with no action required on your part.
            </div>
          </div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:40 }}>

          {/* What is FDIC */}
          <section>
            <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:14 }}>What Is the FDIC?</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.8,fontWeight:300 }}>
              The Federal Deposit Insurance Corporation is an independent agency of the United States government, established in 1933 in response to the thousands of bank failures of the 1920s and early 1930s. The FDIC preserves and promotes public confidence in the US financial system by insuring deposits in banks and thrift institutions. Since its founding in 1933, no depositor has ever lost a penny of FDIC-insured funds.
            </p>
          </section>

          {/* Coverage limits by category */}
          <section>
            <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:16 }}>Coverage by Ownership Category</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.8,fontWeight:300,marginBottom:20 }}>
              The $250,000 limit applies separately to each ownership category, meaning you may be eligible for more than $250,000 in total coverage across different account types.
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14 }}>
              {ownershipCategories.map(({ title, limit, desc }) => (
                <div key={title} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'18px 20px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,gap:10 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{title}</div>
                    <div style={{ fontSize:14,fontWeight:800,color:'#34d399',fontFamily:'monospace',flexShrink:0 }}>{limit}</div>
                  </div>
                  <div style={{ fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,fontWeight:300 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* What's covered / not covered */}
          <section>
            <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:16 }}>What Is and Isn't Covered</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
              <div style={{ background:'rgba(52,211,153,.05)',border:'1px solid rgba(52,211,153,.15)',borderRadius:14,padding:'20px' }}>
                <div style={{ fontSize:13,fontWeight:700,color:'#34d399',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
                  <CheckCircle2 size={14}/> FDIC Covered
                </div>
                {covered.map(item => (
                  <div key={item} style={{ display:'flex',alignItems:'flex-start',gap:8,marginBottom:10 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'#34d399',flexShrink:0,marginTop:7 }}/>
                    <span style={{ fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.6,fontWeight:300 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)',borderRadius:14,padding:'20px' }}>
                <div style={{ fontSize:13,fontWeight:700,color:'#f87171',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
                  <AlertCircle size={14}/> NOT Covered
                </div>
                {notCovered.map(item => (
                  <div key={item} style={{ display:'flex',alignItems:'flex-start',gap:8,marginBottom:10 }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background:'#f87171',flexShrink:0,marginTop:7 }}/>
                    <span style={{ fontSize:13,color:'rgba(255,255,255,.55)',lineHeight:1.6,fontWeight:300 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How to verify */}
          <section>
            <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:14 }}>How to Verify Our FDIC Membership</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.8,fontWeight:300,marginBottom:16 }}>
              You can independently verify {bankName}'s FDIC membership at any time using the FDIC's official BankFind tool. Search for "{bankName}" at <a href="https://banks.data.fdic.gov" target="_blank" rel="noopener noreferrer" style={{ color:'#f59e0b',textDecoration:'none' }}>banks.data.fdic.gov</a> or call the FDIC directly at 1-877-275-3342 (FDIC). FDIC insurance is automatic — you do not need to apply or pay for it.
            </p>
            <div style={{ background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.18)',borderRadius:12,padding:'14px 16px',fontSize:13,color:'rgba(245,158,11,.8)',lineHeight:1.6 }}>
              <strong style={{ color:'#f59e0b' }}>FDIC Certificate Number:</strong> Displayed in your account dashboard under Settings → Account Details. You can use this number to look up our coverage at fdic.gov.
            </div>
          </section>

          {/* More info */}
          <section>
            <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:14 }}>Learn More</h2>
            <p style={{ fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.8,fontWeight:300 }}>
              For complete information about FDIC insurance coverage, visit <a href="https://www.fdic.gov" target="_blank" rel="noopener noreferrer" style={{ color:'#f59e0b',textDecoration:'none' }}>fdic.gov</a> or call 1-877-275-3342. You can also use the FDIC's Electronic Deposit Insurance Estimator (EDIE) at <a href="https://edie.fdic.gov" target="_blank" rel="noopener noreferrer" style={{ color:'#f59e0b',textDecoration:'none' }}>edie.fdic.gov</a> to calculate your personal coverage based on your account types and balances.
            </p>
          </section>

        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Cookie Policy','/cookies'],['FDIC Notice','/fdic'],['Disclosures','/disclosures'],['Contact','/contact']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · Equal Housing Lender · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}