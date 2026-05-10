'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldX, Clock, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import api from '../app/lib/api';

type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'resubmit';

interface KYCGateProps {
  children: React.ReactNode;
}

const STATUS_CFG = {
  not_started: {
    icon: ShieldX,
    iconColor: '#94a3b8',
    iconBg: 'rgba(148,163,184,.12)',
    title: 'Identity Verification Required',
    sub: 'You need to complete identity verification before you can use this feature.',
    cta: 'Start Verification',
    ctaColor: 'linear-gradient(135deg,#f59e0b,#d97706)',
    ctaText: '#050d1a',
    border: 'rgba(255,255,255,.08)',
    bg: 'rgba(255,255,255,.02)',
  },
  pending: {
    icon: Clock,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,.12)',
    title: 'Verification Under Review',
    sub: 'Your documents are being reviewed by our team. This usually takes  1-3 business days. You\'ll be notified once approved.',
    cta: 'Check Status',
    ctaColor: 'rgba(255,255,255,.06)',
    ctaText: 'rgba(255,255,255,.7)',
    border: 'rgba(245,158,11,.2)',
    bg: 'rgba(245,158,11,.04)',
  },
  rejected: {
    icon: ShieldX,
    iconColor: '#f87171',
    iconBg: 'rgba(248,113,113,.12)',
    title: 'Verification Rejected',
    sub: 'Your identity verification was rejected. Please resubmit with clearer documents.',
    cta: 'Resubmit Documents',
    ctaColor: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    ctaText: '#fff',
    border: 'rgba(239,68,68,.2)',
    bg: 'rgba(239,68,68,.04)',
  },
  resubmit: {
    icon: AlertCircle,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,.12)',
    title: 'Resubmission Required',
    sub: 'Additional documents are needed to complete your verification. Please resubmit.',
    cta: 'Resubmit Now',
    ctaColor: 'linear-gradient(135deg,#f59e0b,#d97706)',
    ctaText: '#050d1a',
    border: 'rgba(245,158,11,.2)',
    bg: 'rgba(245,158,11,.04)',
  },
} as const;

export function KYCGate({ children }: KYCGateProps) {
  const router = useRouter();
  const [status,  setStatus]  = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/kyc/status');
      const data = res.data.data ?? res.data;
      setStatus((data?.status as KYCStatus) ?? 'not_started');
    } catch {
      // If request fails (e.g. unauthenticated), treat as not started
      setStatus('not_started');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <Loader2 size={28} color="#f59e0b" style={{ animation: 'nx-spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.35)', fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>Checking verification status…</p>
        <style>{`@keyframes nx-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Approved — render page normally ──
  if (status === 'approved') {
    return <>{children}</>;
  }

  // ── Blocked — show gate ──
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.not_started;
  const Icon = cfg.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Card */}
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 24, padding: '36px 32px', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Icon size={32} color={cfg.iconColor} />
          </div>

          {/* NexaBank badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 100, padding: '4px 12px', marginBottom: 18 }}>
            <ShieldCheck size={12} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' }}>NexaBank Security</span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-.3px' }}>
            {cfg.title}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', margin: '0 0 28px', lineHeight: 1.7 }}>
            {cfg.sub}
          </p>

          {/* Steps — only for not_started */}
          {status === 'not_started' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
              {[
                { step: '1', label: 'Submit your government-issued ID' },
                { step: '2', label: 'Upload a clear selfie' },
                { step: '3', label: 'Review takes  1-3 business days' },
              ].map(({ step, label }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
                    {step}
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pending — progress indicator */}
          {status === 'pending' && (
            <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 22, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Review in progress</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', borderRadius: 2, animation: 'progress-slide 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => router.push('/kyc')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: cfg.ctaColor, color: cfg.ctaText, border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: status === 'pending' ? 12 : 0 }}>
            {cfg.cta} <ArrowRight size={16} />
          </button>

          {/* Pending refresh */}
          {status === 'pending' && (
            <button onClick={() => fetchStatus(true)} disabled={refreshing}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'none', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'nx-spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Checking…' : 'Refresh Status'}
            </button>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.2)', marginTop: 20, lineHeight: 1.6 }}>
          Identity verification is required by financial regulations (KYC/AML) to protect your account and comply with banking laws.
        </p>
      </div>

      <style>{`
        @keyframes nx-spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes progress-slide { 0% { transform:translateX(-100%); } 100% { transform:translateX(250%); } }
      `}</style>
    </div>
  );
}