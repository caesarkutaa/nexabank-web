'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function TermsPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  const sections = [
    { title:'1. Acceptance of Terms', content:`By opening an account or using any ${bankName} service, you agree to these Terms of Service in full. If you do not agree, do not use our services. We may update these terms at any time with 30 days notice for material changes.` },
    { title:'2. Eligibility', content:`You must be at least 18 years old and a resident of a country we serve. You must not be on any government sanctions list. You agree to provide accurate, complete, and current information during registration and to keep that information updated.` },
    { title:'3. Account Opening and KYC', content:`To open an account you must complete our identity verification (KYC) process, which includes providing government-issued identification and may include biometric verification. We reserve the right to refuse account opening or close existing accounts at our discretion, including for failure to complete KYC.` },
    { title:'4. Acceptable Use', content:`You may not use ${bankName} for illegal activities, money laundering, terrorism financing, fraud, or any activity that violates applicable law. You may not attempt to circumvent our security systems, access accounts that do not belong to you, or use our API in an unauthorized manner.` },
    { title:'5. Fees and Pricing', content:`Intrabank transfers are free. ACH transfers cost $2.50 per transaction. International wire transfers cost 2% of the amount, capped at $50. Investment trades cost 0.1% of the transaction value. Detailed fee schedules are available in your account dashboard and are subject to change with 30 days notice.` },
    { title:'6. FDIC Insurance', content:`Deposit accounts are insured by the Federal Deposit Insurance Corporation (FDIC) up to $250,000 per depositor, per ownership category. Investment products, including stocks and crypto, are not FDIC insured and may lose value.` },
    { title:'7. Limitation of Liability', content:`To the maximum extent permitted by law, ${bankName} shall not be liable for indirect, incidental, special, or consequential damages. Our total liability to you for any claim shall not exceed the greater of $100 or the total fees you paid to us in the preceding 12 months.` },
    { title:'8. Dispute Resolution', content:`Any dispute arising from these terms shall be resolved by binding arbitration administered by the American Arbitration Association. You waive your right to a jury trial or class action. You may opt out of arbitration by written notice within 30 days of account opening.` },
    { title:'9. Governing Law', content:`These terms are governed by the laws of the State of New York, United States, without regard to conflict of law principles.` },
    { title:'10. Contact', content:`For legal notices or questions about these terms, contact legal@${bankName.toLowerCase()}.com or write to: ${bankName}, N.A., Legal Department, 1 Financial Plaza, New York, NY 10005.` },
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
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', marginBottom:14 }}>Terms of Service</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', fontWeight:300 }}>Last updated: January 1, {new Date().getFullYear()}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:36 }}>
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:12 }}>{title}</h2>
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