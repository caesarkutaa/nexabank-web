'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function PrivacyPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  const sections = [
    { title:'1. Information We Collect', content:`We collect information you provide directly: name, email address, date of birth, government-issued ID, Social Security Number (for US residents), phone number, and financial information needed to open and operate your account. We also collect technical data including IP address, device identifiers, browser type, and usage patterns through cookies and similar technologies. Transaction data — including amounts, timestamps, counterparties, and locations — is recorded for every financial operation.` },
    { title:'2. How We Use Your Information', content:`Your information is used to: open and maintain your account; verify your identity and prevent fraud; process transactions and send notifications; comply with legal and regulatory obligations (including AML/KYC requirements); improve our products and services; and communicate with you about your account. We do not use your data for advertising or sell it to third parties.` },
    { title:'3. Information Sharing', content:`We share your information only when necessary: with our service providers who help us operate the platform (under strict data processing agreements); with financial networks and correspondent banks to process transactions; with regulators, law enforcement, or government authorities when required by law; and with you, upon your request for data portability. We never sell your personal data to advertisers or data brokers.` },
    { title:'4. Data Security', content:`All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We maintain SOC 2 Type II certification and undergo regular third-party security audits. Access to customer data is role-based and logged. In the event of a data breach, we will notify affected users within 72 hours as required by applicable law.` },
    { title:'5. Your Rights', content:`You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data (subject to legal retention requirements); restrict or object to certain processing; data portability; and withdraw consent at any time. To exercise any of these rights, contact privacy@${bankName.toLowerCase()}.com.` },
    { title:'6. Cookies', content:`We use essential cookies for authentication and security, and analytical cookies to understand how our platform is used. You may disable non-essential cookies via your browser settings, but this may affect functionality. We do not use advertising cookies.` },
    { title:'7. Data Retention', content:`We retain your account information for the duration of your relationship with us and for a minimum of 7 years after closure, as required by financial regulations. Transaction records are retained for at least 5 years. You may request earlier deletion of certain data subject to legal requirements.` },
    { title:'8. Contact', content:`For privacy-related questions or to exercise your rights, contact our Data Protection Officer at privacy@${bankName.toLowerCase()}.com or write to: ${bankName}, N.A., 1 Financial Plaza, New York, NY 10005.` },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#060810', color:'#e2e8f0', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(6,8,16,.94)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(245,158,11,.1)', padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:'#060810' }}>{bankName[0]}</div>
          <span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{bankName}</span>
        </Link>
        <Link href="/register" style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#060810', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:700, textDecoration:'none' }}>Open Account</Link>
      </nav>
      <div style={{ maxWidth:780, margin:'0 auto', padding:'64px 32px' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:12, color:'#f59e0b', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Legal</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', marginBottom:14 }}>Privacy Policy</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', fontWeight:300 }}>Last updated: January 1, {new Date().getFullYear()} · Effective immediately</p>
        </div>
        <div style={{ background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, padding:'14px 18px', fontSize:13, color:'rgba(245,158,11,.8)', marginBottom:40, lineHeight:1.6 }}>
          {bankName} is committed to protecting your privacy. This policy explains how we collect, use, share, and protect your personal information.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:36 }}>
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:12, letterSpacing:'-.3px' }}>{title}</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.8, margin:0, fontWeight:300 }}>{content}</p>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)', padding:'24px 32px', textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)', fontWeight:300 }}>
        {bankName}, N.A. · Member FDIC · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}