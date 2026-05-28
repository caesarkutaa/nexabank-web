'use client';
import Link from 'next/link';
import { useSiteConfig } from '../../app/hooks/Usesiteconfig';

export default function DisclosuresPage() {
  const { config } = useSiteConfig();
  const bankName = config?.bankName || 'NexaBank';

  const disclosures = [
    {
      id: 'D-001',
      title: 'FDIC Deposit Insurance Disclosure',
      effective: 'January 1, 2024',
      content: `${bankName}, N.A. is a member of the Federal Deposit Insurance Corporation (FDIC). Deposit accounts, including checking and savings accounts, are insured by the FDIC up to $250,000 per depositor, per insured bank, for each account ownership category. Investment products offered through ${bankName} Securities are NOT deposits, are NOT insured by the FDIC, are NOT guaranteed by the bank, and MAY LOSE VALUE. For more information about FDIC insurance, visit fdic.gov or call 1-877-275-3342.`,
    },
    {
      id: 'D-002',
      title: 'Investment Products Risk Disclosure',
      effective: 'January 1, 2024',
      content: `${bankName} offers access to investment products including equities, exchange-traded funds (ETFs), and cryptocurrency assets. ALL INVESTMENTS CARRY RISK. Past performance is not indicative of future results. The value of investments may go up or down, and you may receive back less than you originally invested. Cryptocurrency assets are particularly volatile and speculative. ${bankName} is not a registered investment adviser. Nothing on this platform constitutes investment advice. You should consider whether any investment is suitable for your particular circumstances and, if necessary, seek independent professional advice.`,
    },
    {
      id: 'D-003',
      title: 'Wire Transfer and ACH Disclosure',
      effective: 'January 1, 2024',
      content: `Domestic ACH transfers are subject to Regulation E. You have the right to receive pre-authorisation disclosures before recurring ACH debits begin. Errors in ACH transactions must be reported within 60 days of the statement date. International wire transfers are subject to the Dodd-Frank Remittance Transfer Rule. ${bankName} will disclose exchange rates, fees, and the amount to be received by the recipient before you authorise any international transfer. You have the right to cancel an international transfer within 30 minutes of payment for a full refund. Funds availability for inbound wires: same business day if received before 4:00 PM ET.`,
    },
    {
      id: 'D-004',
      title: 'Virtual Card and Debit Card Disclosure',
      effective: 'January 1, 2024',
      content: `Virtual and physical debit cards issued by ${bankName} are subject to the Electronic Fund Transfer Act (EFTA) and Regulation E. Your liability for unauthorised transactions is limited to $50 if you report the loss or theft within 2 business days, or $500 if reported within 60 days of your statement. Zero-liability protection applies to Visa/Mastercard-branded cards for transactions processed through their networks when reported promptly. To report a lost or stolen card, contact support immediately at support@${bankName.toLowerCase()}.com or call 1-800-NEXABANK.`,
    },
    {
      id: 'D-005',
      title: 'Lending and Credit Disclosure (Truth in Lending — Regulation Z)',
      effective: 'January 1, 2024',
      content: `All loan products offered by ${bankName} are subject to the Truth in Lending Act (TILA) and Regulation Z. Annual Percentage Rates (APRs) shown are representative rates based on creditworthiness. Your actual rate may differ. The APR for personal loans ranges from 6.99% to 24.99%. Mortgage APRs are subject to market conditions. ${bankName} reports loan performance to major credit bureaus. Missed or late payments will negatively affect your credit score. Prepayment of loans is permitted without penalty unless otherwise stated in your loan agreement. Loan applications are subject to credit approval.`,
    },
    {
      id: 'D-006',
      title: 'AML and KYC Disclosure',
      effective: 'January 1, 2024',
      content: `${bankName} is required by the Bank Secrecy Act (BSA) and the USA PATRIOT Act to verify the identity of all customers before opening an account. This process (Know Your Customer, or KYC) requires you to provide a valid government-issued ID and may include biometric verification. ${bankName} is required to file Currency Transaction Reports (CTRs) for cash transactions exceeding $10,000 and Suspicious Activity Reports (SARs) when suspicious activity is detected. We are prohibited by law from disclosing to you if a SAR has been filed in connection with your account.`,
    },
    {
      id: 'D-007',
      title: 'Privacy Notice (Gramm-Leach-Bliley Act)',
      effective: 'January 1, 2024',
      content: `Under the Gramm-Leach-Bliley Act (GLBA), ${bankName} is required to provide you with a notice of our privacy practices. We collect personal information such as your name, address, Social Security Number, transaction history, and account balances. We share this information with our service providers who help us operate the bank (under confidentiality agreements), with regulatory authorities as required by law, and with credit bureaus. We do not share your personal information with third parties for their own marketing purposes. You have the right to opt out of certain information sharing by contacting privacy@${bankName.toLowerCase()}.com.`,
    },
    {
      id: 'D-008',
      title: 'Cryptocurrency Risk Disclosure',
      effective: 'January 1, 2024',
      content: `Cryptocurrency assets offered through ${bankName} are not legal tender, are not backed by any government, and are not FDIC or SIPC insured. Cryptocurrency markets are highly volatile — prices can drop by 50% or more in a short period. Cryptocurrency transactions are generally irreversible. Regulatory uncertainty may adversely affect the value of cryptocurrency. ${bankName} does not provide tax advice; you are solely responsible for determining and satisfying your tax obligations in connection with cryptocurrency transactions. ${bankName} reserves the right to restrict or suspend cryptocurrency services at any time in response to regulatory developments.`,
    },
    {
      id: 'D-009',
      title: 'Equal Credit Opportunity Act (ECOA) Notice',
      effective: 'January 1, 2024',
      content: `${bankName} is an equal opportunity lender. We do not discriminate on the basis of race, colour, religion, national origin, sex, marital status, age (provided the applicant has the capacity to contract), because all or part of the applicant's income derives from a public assistance programme, or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act. If you believe you have been discriminated against, you may contact the Consumer Financial Protection Bureau (CFPB) at consumerfinance.gov or call 1-855-411-2372.`,
    },
    {
      id: 'D-010',
      title: 'Patriot Act Customer Identification Notice',
      effective: 'January 1, 2024',
      content: `IMPORTANT INFORMATION ABOUT PROCEDURES FOR OPENING A NEW ACCOUNT: To help the government fight the funding of terrorism and money laundering activities, federal law requires all financial institutions to obtain, verify, and record information that identifies each person who opens an account. What this means for you: When you open an account, we will ask for your name, address, date of birth, and other information that will allow us to identify you. We may also ask to see your driver's licence or other identifying documents.`,
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

      <div style={{ maxWidth:820,margin:'0 auto',padding:'64px 32px' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:12,color:'#f59e0b',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>Legal</div>
          <h1 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,color:'#fff',letterSpacing:'-1.5px',marginBottom:14 }}>Regulatory Disclosures</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,.4)',fontWeight:300 }}>Effective January 1, {new Date().getFullYear()} · All disclosures apply to {bankName}, N.A. and its subsidiaries</p>
        </div>

        <div style={{ background:'rgba(96,165,250,.07)',border:'1px solid rgba(96,165,250,.2)',borderRadius:12,padding:'14px 18px',fontSize:13,color:'rgba(96,165,250,.85)',marginBottom:40,lineHeight:1.6 }}>
          These disclosures are required by federal and state law. Please read them carefully. If you have questions, contact our Compliance team at compliance@{bankName.toLowerCase()}.com.
        </div>

        {/* Quick nav */}
        <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'18px 20px',marginBottom:40 }}>
          <div style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:12 }}>Quick Navigation</div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {disclosures.map(({ id, title }) => (
              <a key={id} href={`#${id}`} style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:'rgba(255,255,255,.5)',fontSize:13,transition:'color .15s' }}
                onMouseEnter={e=>((e.target as any).style.color='#f59e0b')}
                onMouseLeave={e=>((e.target as any).style.color='rgba(255,255,255,.5)')}>
                <span style={{ fontSize:10,fontWeight:700,color:'#f59e0b',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',borderRadius:5,padding:'2px 6px',flexShrink:0,fontFamily:'monospace' }}>{id}</span>
                {title}
              </a>
            ))}
          </div>
        </div>

        {/* Disclosure sections */}
        <div style={{ display:'flex',flexDirection:'column',gap:32 }}>
          {disclosures.map(({ id, title, effective, content }) => (
            <div key={id} id={id} style={{ background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:'24px 26px',scrollMarginTop:80 }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14,flexWrap:'wrap' }}>
                <div>
                  <span style={{ fontSize:10,fontWeight:700,color:'#f59e0b',background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.2)',borderRadius:6,padding:'3px 8px',fontFamily:'monospace',marginBottom:8,display:'inline-block' }}>{id}</span>
                  <h2 style={{ fontSize:17,fontWeight:700,color:'#fff',margin:'6px 0 0',letterSpacing:'-.3px' }}>{title}</h2>
                </div>
                <span style={{ fontSize:11,color:'rgba(255,255,255,.28)',flexShrink:0,paddingTop:4,fontWeight:300 }}>Effective {effective}</span>
              </div>
              <p style={{ fontSize:13,color:'rgba(255,255,255,.5)',lineHeight:1.85,margin:0,fontWeight:300 }}>{content}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop:48,background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:14,padding:'18px 22px',fontSize:13,color:'rgba(245,158,11,.7)',lineHeight:1.7 }}>
          <strong style={{ color:'#f59e0b',display:'block',marginBottom:6 }}>Questions about these disclosures?</strong>
          Contact our Compliance department at compliance@{bankName.toLowerCase()}.com, call 1-800-NEXABANK, or write to: {bankName}, N.A., Compliance Department, 1 Financial Plaza, New York, NY 10005. We are required to respond to compliance inquiries within 10 business days.
        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'24px 32px',textAlign:'center',fontSize:12,color:'rgba(255,255,255,.2)',fontWeight:300,marginTop:40 }}>
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