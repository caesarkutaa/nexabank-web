'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

const PARTNER_TYPES = [
  {
    type:'Technology Partners',
    color:'#60a5fa',
    icon:'⚙️',
    desc:'Integrate your product with our API and serve millions of banking customers.',
    partners:[
      { name:'Alpaca Markets',  desc:'Powers our stock investment and trading infrastructure.' },
      { name:'CoinGecko',       desc:'Real-time cryptocurrency price data and market analytics.' },
      { name:'Cloudinary',      desc:'Receipt and document storage with CDN delivery.' },
      { name:'Twilio',          desc:'SMS and voice OTP delivery for account security.' },
      { name:'SendGrid',        desc:'Transactional email delivery for notifications and alerts.' },
      { name:'Stripe',          desc:'Card issuing infrastructure and payment processing.' },
    ],
  },
  {
    type:'Banking & Compliance',
    color:'#34d399',
    icon:'🏦',
    desc:'Correspondent banking, compliance, and regulatory technology partners.',
    partners:[
      { name:'Synapse',         desc:'Banking-as-a-service infrastructure and FDIC pass-through insurance.' },
      { name:'Onfido',          desc:'KYC identity verification and document authentication.' },
      { name:'Plaid',           desc:'Bank account linking and ACH initiation.' },
      { name:'LexisNexis Risk', desc:'AML screening and sanctions list monitoring.' },
    ],
  },
  {
    type:'Distribution Partners',
    color:'#a78bfa',
    icon:'🤝',
    desc:'Reach new customers and markets through co-branded programmes.',
    partners:[
      { name:'Payroll Providers', desc:'Offer NexaBank accounts as a direct deposit destination to employees.' },
      { name:'HR Platforms',      desc:'Embed financial wellness tools inside employee portals.' },
      { name:'E-commerce Platforms', desc:'Offer NexaBank checkout financing and virtual card issuance.' },
    ],
  },
];

const BENEFITS = [
  { icon:'🚀', title:'API-First Integration',    desc:'RESTful APIs with comprehensive documentation, sandbox environment, and dedicated integration support.' },
  { icon:'📊', title:'Revenue Sharing',           desc:'Earn a share of transaction revenue from every customer you refer or embed.' },
  { icon:'🔒', title:'Bank-Grade Security',       desc:'All integrations are secured with OAuth 2.0, webhook signatures, and IP allowlisting.' },
  { icon:'🌍', title:'Global Reach',              desc:'Access 850,000+ members across 180 countries through a single integration.' },
  { icon:'🛠️', title:'Dedicated Support',         desc:'A named partner success manager and direct Slack channel with our engineering team.' },
  { icon:'📋', title:'Co-Marketing',              desc:'Joint case studies, webinars, and placement in our partner directory.' },
];

export default function PartnersPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';
  const [form, setForm] = useState({ company:'', name:'', email:'', type:'', message:'' });
  const [sent, setSent] = useState(false);
  const upd = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp: React.CSSProperties = { width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#fff',outline:'none',fontFamily:'inherit',WebkitTextFillColor:'#fff',boxSizing:'border-box',transition:'border-color .2s' };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 900));
    setSent(true);
  };

  return (
    <div style={{ minHeight:'100vh',background:'#060810',color:'#e2e8f0',fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(6,8,16,.94)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(245,158,11,.1)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-.3px' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Open Account</Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign:'center',padding:'80px 32px 60px' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.28)',borderRadius:100,padding:'6px 14px',fontSize:11,fontWeight:700,color:'#f59e0b',letterSpacing:'.1em',marginBottom:24 }}>PARTNER PROGRAMME</div>
        <h1 style={{ fontSize:'clamp(30px,5vw,52px)',fontWeight:900,color:'#fff',letterSpacing:'-2px',lineHeight:1.05,marginBottom:18 }}>Build Together.<br/>Grow Together.</h1>
        <p style={{ fontSize:16,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:520,margin:'0 auto 40px',fontWeight:300 }}>
          Partner with {bankName} to reach 850,000+ members, earn revenue share, and build powerful financial experiences on top of our banking infrastructure.
        </p>
        <a href="#apply" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:12,padding:'13px 28px',fontSize:14,fontWeight:700,textDecoration:'none' }}>
          Apply to Partner →
        </a>
      </section>

      <div style={{ maxWidth:1000,margin:'0 auto',padding:'0 32px 64px' }}>

        {/* Benefits */}
        <section style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22,fontWeight:700,color:'#fff',marginBottom:24,textAlign:'center' }}>Why Partner with {bankName}?</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px' }}>
                <div style={{ fontSize:26,marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,fontWeight:300 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner types */}
        <section style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22,fontWeight:700,color:'#fff',marginBottom:24 }}>Our Partners</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:24 }}>
            {PARTNER_TYPES.map(({ type, color, icon, desc, partners }) => (
              <div key={type} style={{ background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:'24px 26px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <h3 style={{ fontSize:17,fontWeight:700,color,margin:0 }}>{type}</h3>
                </div>
                <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:18,fontWeight:300 }}>{desc}</p>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10 }}>
                  {partners.map(({ name, desc: pd }) => (
                    <div key={name} style={{ background:'rgba(255,255,255,.03)',border:`1px solid ${color}22`,borderRadius:10,padding:'12px 14px' }}>
                      <div style={{ fontSize:13,fontWeight:700,color:'#fff',marginBottom:4 }}>{name}</div>
                      <div style={{ fontSize:12,color:'rgba(255,255,255,.35)',fontWeight:300,lineHeight:1.5 }}>{pd}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Apply form */}
        <section id="apply" style={{ scrollMarginTop:80 }}>
          <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:18,padding:'32px' }}>
            <h2 style={{ fontSize:22,fontWeight:700,color:'#fff',marginBottom:6 }}>Apply to Become a Partner</h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:24,fontWeight:300 }}>We review all applications within 3 business days.</p>

            {sent ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <div style={{ fontSize:40,marginBottom:16 }}>✅</div>
                <h3 style={{ fontSize:18,fontWeight:700,color:'#fff',marginBottom:8 }}>Application Received!</h3>
                <p style={{ fontSize:14,color:'rgba(255,255,255,.4)',fontWeight:300 }}>Our partnerships team will be in touch within 3 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <div><label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6 }}>Company Name *</label><input style={inp} value={form.company} onChange={upd('company')} placeholder="Acme Corp" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6 }}>Your Name *</label><input style={inp} value={form.name} onChange={upd('name')} placeholder="Jane Smith" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <div><label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6 }}>Work Email *</label><input style={inp} type="email" value={form.email} onChange={upd('email')} placeholder="jane@acme.com" required onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6 }}>Partnership Type</label>
                    <select style={{ ...inp,appearance:'none',cursor:'pointer' }} value={form.type} onChange={upd('type')} onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}>
                      <option value="">Select…</option>
                      <option>Technology Integration</option>
                      <option>Distribution / Referral</option>
                      <option>Banking Infrastructure</option>
                      <option>Co-marketing</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div><label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6 }}>Tell us about the partnership</label><textarea style={{ ...inp,resize:'vertical',lineHeight:1.6 }} rows={4} value={form.message} onChange={upd('message')} placeholder="Describe your product, your users, and what you're hoping to build together…" onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/></div>
                <button type="submit" style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',border:'none',borderRadius:12,padding:'13px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit' }}>
                  Submit Application
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['About','/about'],['Careers','/careers'],['Partners','/partners'],['Contact','/contact'],['Privacy','/privacy']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}