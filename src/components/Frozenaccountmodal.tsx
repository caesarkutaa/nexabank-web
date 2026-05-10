'use client';

import { Snowflake, Mail } from 'lucide-react';

interface Props {
  accountNumber?: string;
}

export function FrozenAccountModal({ accountNumber }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '40px 24px', gap: 16,
      background: 'rgba(96,165,250,.04)', border: '1px solid rgba(96,165,250,.15)',
      borderRadius: 18, fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Snowflake size={28} color="#60a5fa" />
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Account Frozen</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-.3px' }}>
          This account is frozen
        </h3>
        {accountNumber && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: '0 0 4px' }}>
            Account ••••{accountNumber.slice(-4)}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0, lineHeight: 1.7 }}>
          You cannot make transfers or payments from a frozen account. Contact our support team to resolve this.
        </p>
      </div>

      <a
        href="mailto:support@nexabank.com"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(96,165,250,.12)', border: '1px solid rgba(96,165,250,.25)',
          color: '#60a5fa', textDecoration: 'none', borderRadius: 11,
          padding: '10px 20px', fontSize: 13, fontWeight: 700,
        }}>
        <Mail size={14} /> Contact Support
      </a>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', margin: 0 }}>
        support@nexabank.com · Available 24/7
      </p>
    </div>
  );
}