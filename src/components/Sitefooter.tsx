'use client';

import { useSiteConfig, FooterSection, FooterLink } from '../app/hooks/Usesiteconfig';

export default function SiteFooter() {
  const { config } = useSiteConfig();

  const bankName       = config?.bankName       || 'NexaBank';
  const fdicNotice     = config?.fdicNotice     || 'Your deposits are FDIC insured up to $250,000.';
  const copyrightText  = config?.copyrightText  || `© ${new Date().getFullYear()} ${bankName}. All rights reserved.`;
  const footerSections: FooterSection[] = config?.footerSections ?? [];

  return (
    <footer style={{
      background: '#0a0f1a',
      borderTop: '1px solid rgba(255,255,255,.07)',
      padding: '48px 32px 28px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {footerSections.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32,
          marginBottom: 40,
        }}>
          {footerSections.map((section: FooterSection) => (
            <div key={section.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {section.links.map((link: FooterLink) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', textDecoration: 'none', transition: 'color .15s' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,.45)')}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', lineHeight: 1.7, marginBottom: 12, maxWidth: 680 }}>
          {fdicNotice}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>{copyrightText}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,158,11,.6)', letterSpacing: '.04em' }}>{bankName}</span>
        </div>
      </div>
    </footer>
  );
}