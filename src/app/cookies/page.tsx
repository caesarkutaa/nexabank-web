'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function CookiesPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  const sections = [
    {
      title: '1. What Are Cookies',
      content: `Cookies are small text files placed on your device when you visit our website or use our app. They help us recognise you, remember your preferences, keep your session secure, and understand how people use our platform so we can improve it. Cookies cannot access other files on your device or carry viruses.`,
    },
    {
      title: '2. Types of Cookies We Use',
      items: [
        { name: 'Strictly Necessary', color: '#34d399', desc: `Required for the platform to function. These include session authentication tokens, CSRF protection cookies, and load-balancer cookies. You cannot opt out of these — without them the site will not work.` },
        { name: 'Functional',         color: '#60a5fa', desc: `Remember your preferences such as language, timezone, currency display, and dark/light mode. These are set only after you configure a preference and persist for 12 months.` },
        { name: 'Analytical',         color: '#f59e0b', desc: `Help us understand aggregate usage — which features are used most, where users drop off, page load performance. Data is anonymised before storage. We use a self-hosted analytics stack; no data leaves our infrastructure.` },
        { name: 'Security',           color: '#a78bfa', desc: `Detect and prevent fraud and abuse. These include device-fingerprint tokens used to flag suspicious login attempts, and rate-limit identifiers used to block brute-force attacks.` },
      ],
    },
    {
      title: '3. What We Do NOT Do',
      content: `We do not use advertising or tracking cookies. We do not sell or share cookie data with advertisers, data brokers, or social media platforms. We do not use cross-site tracking pixels. We do not use cookies to build a profile of your behaviour outside of ${bankName}.`,
    },
    {
      title: '4. Third-Party Cookies',
      content: `Our platform does not load third-party scripts that set their own cookies during normal use. If you use our "Sign in with Google" option on a supported device, Google may set its own cookies subject to Google's privacy policy, which we do not control.`,
    },
    {
      title: '5. Cookie Lifespan',
      items: [
        { name: 'Session cookies',      color: '#34d399', desc: 'Deleted automatically when you close your browser.' },
        { name: 'Authentication tokens', color: '#60a5fa', desc: 'Expire after 30 days of inactivity or immediately on sign-out.' },
        { name: 'Preference cookies',   color: '#f59e0b', desc: 'Persist for 12 months, then prompt you to confirm preferences again.' },
        { name: 'Security tokens',      color: '#a78bfa', desc: 'Expire after 90 days or on password change.' },
      ],
    },
    {
      title: '6. Managing Cookies',
      content: `You can control cookies through your browser settings. Most browsers let you view, block, or delete cookies at any time. Blocking strictly necessary cookies will prevent you from logging in. To opt out of analytical cookies specifically, email privacy@${bankName.toLowerCase()}.com and we will add your account to our do-not-analyse list within 48 hours.`,
    },
    {
      title: '7. Changes to This Policy',
      content: `We may update this Cookie Policy when we add new features or change how we operate. Material changes will be notified via in-app banner at least 14 days before they take effect. The "last updated" date at the top of this page always reflects the current version.`,
    },
    {
      title: '8. Contact',
      content: `Questions about our use of cookies? Contact our Data Protection Officer at privacy@${bankName.toLowerCase()}.com or write to: ${bankName}, N.A., Privacy Team, 1 Financial Plaza, New York, NY 10005.`,
    },
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

      <div style={{ maxWidth:780,margin:'0 auto',padding:'64px 32px' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:12,color:'#f59e0b',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>Legal</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:14 }}>Cookie Policy</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,.4)',fontWeight:300 }}>Last updated: January 1, {new Date().getFullYear()} · Applies to all {bankName} web and mobile platforms</p>
        </div>

        <div style={{ background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:12,padding:'14px 18px',fontSize:13,color:'rgba(245,158,11,.85)',marginBottom:40,lineHeight:1.6 }}>
          {bankName} uses cookies only for security, functionality, and anonymised analytics. We never use advertising or cross-site tracking cookies, and we never sell cookie data.
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:36 }}>
          {sections.map(({ title, content, items }) => (
            <div key={title}>
              <h2 style={{ fontSize:18,fontWeight:700,color:'#fff',marginBottom:14,letterSpacing:'-.3px' }}>{title}</h2>
              {content && (
                <p style={{ fontSize:14,color:'rgba(255,255,255,.5)',lineHeight:1.8,margin:0,fontWeight:300 }}>{content}</p>
              )}
              {items && (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {items.map(({ name, color, desc }) => (
                    <div key={name} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'14px 16px',display:'flex',gap:14 }}>
                      <div style={{ width:10,height:10,borderRadius:'50%',background:color,flexShrink:0,marginTop:5 }} />
                      <div>
                        <div style={{ fontSize:13,fontWeight:700,color:'#fff',marginBottom:5 }}>{name}</div>
                        <div style={{ fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.7,fontWeight:300 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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