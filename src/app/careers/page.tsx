'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

const JOBS = [
  { id:1, title:'Senior Backend Engineer',        dept:'Engineering',  loc:'New York / Remote', type:'Full-time', tags:['NestJS','MongoDB','TypeScript'] },
  { id:2, title:'Frontend Engineer (React)',       dept:'Engineering',  loc:'Remote',            type:'Full-time', tags:['React','Next.js','TailwindCSS'] },
  { id:3, title:'Mobile Engineer (React Native)',  dept:'Engineering',  loc:'Remote',            type:'Full-time', tags:['React Native','iOS','Android'] },
  { id:4, title:'DevSecOps Engineer',              dept:'Engineering',  loc:'New York',          type:'Full-time', tags:['AWS','Terraform','Security'] },
  { id:5, title:'Product Manager — Payments',      dept:'Product',      loc:'New York / Remote', type:'Full-time', tags:['Payments','ACH','SWIFT'] },
  { id:6, title:'Product Designer (UX/UI)',        dept:'Design',       loc:'Remote',            type:'Full-time', tags:['Figma','Design Systems','FinTech'] },
  { id:7, title:'Compliance Officer',              dept:'Legal',        loc:'New York',          type:'Full-time', tags:['BSA','AML','KYC'] },
  { id:8, title:'Financial Analyst',               dept:'Finance',      loc:'New York',          type:'Full-time', tags:['Modeling','SQL','Excel'] },
  { id:9, title:'Customer Success Manager',        dept:'Operations',   loc:'Remote',            type:'Full-time', tags:['B2C','CRM','Banking'] },
  { id:10,title:'Data Scientist',                  dept:'Engineering',  loc:'Remote',            type:'Full-time', tags:['Python','ML','SQL'] },
  { id:11,title:'Marketing Manager',               dept:'Marketing',    loc:'New York / Remote', type:'Full-time', tags:['Growth','SEO','Fintech'] },
  { id:12,title:'Summer Internship — Engineering', dept:'Engineering',  loc:'New York',          type:'Internship',tags:['TypeScript','Learning','Mentorship'] },
];

const DEPTS = ['All', ...Array.from(new Set(JOBS.map(j => j.dept)))];

const PERKS = [
  { icon:'💰', title:'Competitive Salary',    desc:'Top-of-market compensation benchmarked quarterly against industry data.' },
  { icon:'🏥', title:'Full Health Coverage',  desc:'100% employer-paid medical, dental, and vision for you and your family.' },
  { icon:'🌍', title:'Remote-First Culture',  desc:'Work from anywhere. We have hubs in New York, London, and Lagos.' },
  { icon:'📈', title:'Equity',                desc:'Meaningful equity stake so you share in the upside you help create.' },
  { icon:'🎓', title:'Learning Budget',        desc:'$3,000/year for courses, conferences, books, and certifications.' },
  { icon:'🏖️', title:'Unlimited PTO',         desc:'Take the time you need. We care about output, not hours logged.' },
  { icon:'🍼', title:'Parental Leave',         desc:'16 weeks fully paid for all parents, regardless of how your family grows.' },
  { icon:'💻', title:'Home Office Setup',      desc:'$2,000 stipend to kit out your home office the way you like it.' },
];

const DEPT_COLORS: Record<string,string> = {
  Engineering:'rgba(96,165,250,.15)',  Product:'rgba(167,139,250,.15)',
  Design:'rgba(244,114,182,.15)',      Legal:'rgba(52,211,153,.15)',
  Finance:'rgba(245,158,11,.15)',      Operations:'rgba(251,146,60,.15)',
  Marketing:'rgba(34,211,238,.15)',
};
const DEPT_TEXT: Record<string,string> = {
  Engineering:'#60a5fa', Product:'#a78bfa', Design:'#f472b6',
  Legal:'#34d399',       Finance:'#f59e0b', Operations:'#fb923c',
  Marketing:'#22d3ee',
};

export default function CareersPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';
  const [dept, setDept] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = JOBS.filter(j =>
    (dept === 'All' || j.dept === dept) &&
    (j.title.toLowerCase().includes(search.toLowerCase()) || j.dept.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:'100vh', background:'#060810', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky',top:0,zIndex:50,background:'rgba(6,8,16,.94)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(245,158,11,.1)',padding:'14px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
          <div style={{ width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'-.3px' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'9px 20px',fontSize:13,fontWeight:700,textDecoration:'none' }}>Open Account</Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign:'center',padding:'80px 32px 60px',background:'linear-gradient(180deg,rgba(245,158,11,.04) 0%,transparent 100%)' }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.28)',borderRadius:100,padding:'6px 14px',fontSize:11,fontWeight:700,color:'#f59e0b',letterSpacing:'.1em',marginBottom:24 }}>WE'RE HIRING</div>
        <h1 style={{ fontSize:'clamp(32px,5vw,58px)',fontWeight:900,color:'#fff',letterSpacing:'-2px',lineHeight:1.05,marginBottom:18 }}>
          Build the Future<br/>of Banking
        </h1>
        <p style={{ fontSize:16,color:'rgba(255,255,255,.5)',lineHeight:1.7,maxWidth:540,margin:'0 auto 40px',fontWeight:300 }}>
          Join a team of 200+ engineers, designers, and financial experts on a mission to make banking radically better for everyone.
        </p>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:24,flexWrap:'wrap' }}>
          {[['200+','Team Members'],['40+','Countries Represented'],['4.8★','Glassdoor Rating']].map(([v,l])=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:26,fontWeight:900,color:'#f59e0b',letterSpacing:'-1px' }}>{v}</div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,.35)',marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section style={{ padding:'60px 32px',background:'rgba(255,255,255,.02)',borderTop:'1px solid rgba(255,255,255,.06)',borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:800,color:'#fff',textAlign:'center',marginBottom:40,letterSpacing:'-1px' }}>Why {bankName}?</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16 }}>
            {PERKS.map(({ icon, title, desc }) => (
              <div key={title} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px' }}>
                <div style={{ fontSize:28,marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.6,fontWeight:300 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job listings */}
      <section style={{ maxWidth:1000,margin:'0 auto',padding:'64px 32px' }}>
        <h2 style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:800,color:'#fff',marginBottom:32,letterSpacing:'-1px' }}>Open Positions <span style={{ fontSize:16,color:'rgba(255,255,255,.35)',fontWeight:400 }}>({filtered.length})</span></h2>

        {/* Filters */}
        <div style={{ display:'flex',gap:10,flexWrap:'wrap',marginBottom:28 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles…"
            style={{ background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#fff',outline:'none',fontFamily:'inherit',flex:1,minWidth:180,WebkitTextFillColor:'#fff' }}
            onFocus={e=>(e.target.style.borderColor='rgba(245,158,11,.5)')} onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.12)')}/>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {DEPTS.map(d=>(
              <button key={d} onClick={()=>setDept(d)}
                style={{ padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,border:dept===d?'1px solid rgba(245,158,11,.4)':'1px solid rgba(255,255,255,.1)',background:dept===d?'rgba(245,158,11,.12)':'rgba(255,255,255,.04)',color:dept===d?'#f59e0b':'rgba(255,255,255,.45)',cursor:'pointer',fontFamily:'inherit',transition:'all .15s' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,.3)',fontSize:14 }}>No roles match your search.</div>
          ) : filtered.map(job => (
            <div key={job.id} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'20px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap',transition:'border-color .15s,background .15s',cursor:'pointer' }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(245,158,11,.25)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.05)'; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)'; }}>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' }}>
                  <span style={{ fontSize:15,fontWeight:700,color:'#fff' }}>{job.title}</span>
                  {job.type==='Internship'&&<span style={{ fontSize:10,fontWeight:700,color:'#a78bfa',background:'rgba(167,139,250,.15)',border:'1px solid rgba(167,139,250,.3)',borderRadius:100,padding:'2px 8px' }}>Internship</span>}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                  <span style={{ fontSize:12,fontWeight:700,color:DEPT_TEXT[job.dept]??'#f59e0b',background:DEPT_COLORS[job.dept]??'rgba(245,158,11,.15)',borderRadius:6,padding:'3px 9px' }}>{job.dept}</span>
                  <span style={{ fontSize:12,color:'rgba(255,255,255,.35)' }}>📍 {job.loc}</span>
                  {job.tags.map(t=><span key={t} style={{ fontSize:11,color:'rgba(255,255,255,.3)',background:'rgba(255,255,255,.05)',borderRadius:5,padding:'2px 7px' }}>{t}</span>)}
                </div>
              </div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:9,padding:'8px 16px',fontSize:13,fontWeight:700,color:'#f59e0b',flexShrink:0 }}>
                Apply →
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:40,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'24px',textAlign:'center' }}>
          <div style={{ fontSize:15,fontWeight:700,color:'#fff',marginBottom:8 }}>Don't see your role?</div>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:16,fontWeight:300 }}>We're always looking for exceptional talent. Send us your CV and we'll be in touch.</p>
          <a href="mailto:careers@nexabank.com" style={{ display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#060810',borderRadius:10,padding:'10px 22px',fontSize:13,fontWeight:700,textDecoration:'none' }}>
            Send Open Application
          </a>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexWrap:'wrap',marginBottom:8 }}>
          {[['About','/about'],['Careers','/careers'],['Contact','/contact'],['Privacy','/privacy'],['Terms','/terms']].map(([l,h])=>(
            <Link key={l} href={h} style={{ color:'rgba(255,255,255,.3)',textDecoration:'none',fontSize:12 }}>{l}</Link>
          ))}
        </div>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}