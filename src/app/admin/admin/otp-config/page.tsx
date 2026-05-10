'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Loader2, CheckCircle2, XCircle, Clock,
  RefreshCw, AlertCircle, Mail, ArrowLeftRight,
  LogIn, KeyRound, Lock, Receipt, Bitcoin,
  CreditCard, Building2, ChevronDown, Save,
} from 'lucide-react';
import adminApi from '../lib/api';

/* ─── Types ──────────────────────────────────────────────────── */
interface OtpConfig {
  _id?: string;
  purpose: string;
  isEnabled: boolean;
  expiryMinutes: number;
  maxAttempts: number;
  pausedReason?: string;
  pausedAt?: string;
  pausedBy?: string;
}

/* ─── Purpose metadata ───────────────────────────────────────── */
const PURPOSE_META: Record<string, {
  label: string;
  desc: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
  risk: 'high' | 'medium' | 'low';
}> = {
  email_verification: {
    label: 'Email Verification',
    desc:  'Sent when a new user registers or changes their email address.',
    Icon:  Mail, color: '#60a5fa', bg: 'rgba(96,165,250,.12)', risk: 'low',
  },
  transfer_confirmation: {
    label: 'Transfer Confirmation',
    desc:  'Required before any money transfer is processed.',
    Icon:  ArrowLeftRight, color: '#f59e0b', bg: 'rgba(245,158,11,.12)', risk: 'high',
  },
  login_verification: {
    label: 'Login Verification',
    desc:  'Additional OTP step during login for extra security.',
    Icon:  LogIn, color: '#34d399', bg: 'rgba(52,211,153,.12)', risk: 'medium',
  },
  password_reset: {
    label: 'Password Reset',
    desc:  'Sent when a user requests a password reset link.',
    Icon:  KeyRound, color: '#a78bfa', bg: 'rgba(167,139,250,.12)', risk: 'high',
  },
  security_pin_change: {
    label: 'Security PIN Change',
    desc:  'Required when a user changes their transaction PIN.',
    Icon:  Lock, color: '#f97316', bg: 'rgba(249,115,22,.12)', risk: 'high',
  },
  bill_payment: {
    label: 'Bill Payment',
    desc:  'OTP confirmation before processing any bill payment.',
    Icon:  Receipt, color: '#06b6d4', bg: 'rgba(6,182,212,.12)', risk: 'medium',
  },
  crypto_payment: {
    label: 'Crypto Payment',
    desc:  'Required before sending cryptocurrency transactions.',
    Icon:  Bitcoin, color: '#eab308', bg: 'rgba(234,179,8,.12)', risk: 'high',
  },
  loan_repayment: {
    label: 'Loan Repayment',
    desc:  'Confirmation OTP for loan repayment transactions.',
    Icon:  Building2, color: '#ec4899', bg: 'rgba(236,72,153,.12)', risk: 'medium',
  },
};

const RISK_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: 'rgba(248,113,113,.12)', color: '#f87171', label: 'High Risk'   },
  medium: { bg: 'rgba(245,158,11,.12)',  color: '#f59e0b', label: 'Medium Risk' },
  low:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399', label: 'Low Risk'    },
};

const DEFAULT_PURPOSES = [
  'email_verification', 'transfer_confirmation', 'login_verification',
  'password_reset', 'security_pin_change', 'bill_payment',
  'crypto_payment', 'loan_repayment',
];

/* ─── Shared styles ──────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const br = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.1)');

/* ─── Edit Modal ─────────────────────────────────────────────── */
function EditModal({
  config, onClose, onDone,
}: {
  config: OtpConfig;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const meta = PURPOSE_META[config.purpose];
  const [isEnabled,     setIsEnabled]     = useState(config.isEnabled);
  const [expiryMinutes, setExpiryMinutes] = useState(String(config.expiryMinutes));
  const [maxAttempts,   setMaxAttempts]   = useState(String(config.maxAttempts));
  const [pausedReason,  setPausedReason]  = useState(config.pausedReason || '');
  const [loading,       setLoading]       = useState(false);
  const [err,           setErr]           = useState('');

  const submit = async () => {
    const expiry   = parseInt(expiryMinutes);
    const attempts = parseInt(maxAttempts);
    if (!expiry || expiry < 1)    return setErr('Expiry must be at least 1 minute');
    if (!attempts || attempts < 1) return setErr('Max attempts must be at least 1');

    setErr(''); setLoading(true);
    try {
      await adminApi.put('/admin/otp/config', {
        purpose:       config.purpose,
        isEnabled,
        expiryMinutes: expiry,
        maxAttempts:   attempts,
        pausedReason:  !isEnabled ? pausedReason || 'Paused by admin' : undefined,
      });
      onDone(`OTP config for "${meta?.label ?? config.purpose}" updated`);
      onClose();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const Icon = meta?.Icon ?? Shield;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)',
        backdropFilter: 'blur(8px)', zIndex: 9100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#0f1623', border: '1px solid rgba(255,255,255,.09)',
        borderRadius: 20, width: '100%', maxWidth: 480,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: meta?.bg ?? 'rgba(245,158,11,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={meta?.color ?? '#f59e0b'} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>
                {meta?.label ?? config.purpose}
              </h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0, fontFamily: 'monospace' }}>
                {config.purpose}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8,
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,.4)', cursor: 'pointer', flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {err && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 10, padding: '10px 13px',
            }}>
              <AlertCircle size={13} color="#f87171" />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span>
            </div>
          )}

          {/* Description */}
          {meta?.desc && (
            <div style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 10, padding: '11px 14px', fontSize: 13,
              color: 'rgba(255,255,255,.55)', lineHeight: 1.6,
            }}>
              {meta.desc}
            </div>
          )}

          {/* Enable / Disable toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: isEnabled ? 'rgba(52,211,153,.06)' : 'rgba(248,113,113,.06)',
            border: `1px solid ${isEnabled ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                OTP {isEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
                {isEnabled
                  ? 'Users must enter OTP to complete this action'
                  : 'OTP step is bypassed — use with caution'}
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => setIsEnabled(v => !v)}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: isEnabled ? '#34d399' : 'rgba(255,255,255,.12)',
                position: 'relative', transition: 'background .25s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: isEnabled ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
              }} />
            </button>
          </div>

          {/* Expiry + Attempts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Expiry (minutes)
              </label>
              <input
                type="number" min="1" max="60"
                value={expiryMinutes}
                onChange={e => setExpiryMinutes(e.target.value)}
                style={inp} onFocus={fg} onBlur={br}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
                OTP becomes invalid after this time
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Max Attempts
              </label>
              <input
                type="number" min="1" max="10"
                value={maxAttempts}
                onChange={e => setMaxAttempts(e.target.value)}
                style={inp} onFocus={fg} onBlur={br}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
                Failed tries before lockout
              </span>
            </div>
          </div>

          {/* Pause reason — only shown when disabling */}
          {!isEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Pause Reason
              </label>
              <textarea
                value={pausedReason}
                onChange={e => setPausedReason(e.target.value)}
                placeholder="Why is this OTP being disabled?"
                rows={2}
                style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                onFocus={fg} onBlur={br}
              />
            </div>
          )}

          {/* Warning for high-risk */}
          {meta?.risk === 'high' && !isEnabled && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.2)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
                <strong>Warning:</strong> This is a high-risk OTP purpose. Disabling it removes a critical security layer. Ensure you have an alternative control in place.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, padding: '14px 22px',
          borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 11, padding: 11, fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none',
              borderRadius: 11, padding: 11, fontSize: 14, fontWeight: 700,
              color: '#050d1a', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: loading ? .7 : 1,
            }}
          >
            {loading
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Save size={15} />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── OTP Card ───────────────────────────────────────────────── */
function OtpCard({
  config, onEdit,
}: {
  config: OtpConfig;
  onEdit: (config: OtpConfig) => void;
}) {
  const meta   = PURPOSE_META[config.purpose];
  const risk   = RISK_BADGE[meta?.risk ?? 'low'];
  const Icon   = meta?.Icon ?? Shield;

  return (
    <div style={{
      background: 'rgba(255,255,255,.03)', border: `1px solid ${config.isEnabled ? 'rgba(255,255,255,.08)' : 'rgba(248,113,113,.2)'}`,
      borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'all .2s', position: 'relative', overflow: 'hidden',
    }}>
      {/* Disabled overlay stripe */}
      {!config.isEnabled && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'rgba(248,113,113,.08)', width: '100%', height: '100%',
          pointerEvents: 'none', borderRadius: 'inherit',
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: config.isEnabled ? (meta?.bg ?? 'rgba(245,158,11,.12)') : 'rgba(255,255,255,.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: config.isEnabled ? 1 : 0.5,
          }}>
            <Icon size={20} color={config.isEnabled ? (meta?.color ?? '#f59e0b') : 'rgba(255,255,255,.3)'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: config.isEnabled ? '#fff' : 'rgba(255,255,255,.5)', marginBottom: 3 }}>
              {meta?.label ?? config.purpose}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Enabled / Disabled pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: config.isEnabled ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)',
                color: config.isEnabled ? '#34d399' : '#f87171',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              }}>
                {config.isEnabled ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                {config.isEnabled ? 'Active' : 'Paused'}
              </span>
              {/* Risk pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: risk.bg, color: risk.color,
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              }}>
                {risk.label}
              </span>
            </div>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(config)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)',
            borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700,
            color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Configure
        </button>
      </div>

      {/* Description */}
      {meta?.desc && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.42)', lineHeight: 1.6, margin: 0 }}>
          {meta.desc}
        </p>
      )}

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}>
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 9, padding: '9px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={10} /> Expiry
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {config.expiryMinutes}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.4)', marginLeft: 4 }}>min</span>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 9, padding: '9px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Shield size={10} /> Max Attempts
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {config.maxAttempts}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.4)', marginLeft: 4 }}>tries</span>
          </div>
        </div>
      </div>

      {/* Pause reason */}
      {!config.isEnabled && config.pausedReason && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.18)',
          borderRadius: 9, padding: '9px 12px',
        }}>
          <AlertCircle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Paused
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{config.pausedReason}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdminOtpConfigPage() {
  const [configs,  setConfigs]  = useState<OtpConfig[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<OtpConfig | null>(null);
  const [toast,    setToast]    = useState('');
  const [filter,   setFilter]   = useState<'all' | 'active' | 'paused'>('all');
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/otp/config');
      const raw: any[] = res.data.data ?? res.data ?? [];
      // Ensure all default purposes exist even if not yet in DB
      const merged = DEFAULT_PURPOSES.map(p => {
        const found = raw.find((c: any) => c.purpose === p);
        return found ?? {
          purpose:       p,
          isEnabled:     true,
          expiryMinutes: 10,
          maxAttempts:   3,
        };
      });
      setConfigs(merged);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  const displayed = configs.filter(c => {
    if (filter === 'active') return c.isEnabled;
    if (filter === 'paused') return !c.isEnabled;
    return true;
  });

  const totalActive = configs.filter(c => c.isEnabled).length;
  const totalPaused = configs.filter(c => !c.isEnabled).length;
  const highRiskPaused = configs.filter(c => !c.isEnabled && PURPOSE_META[c.purpose]?.risk === 'high').length;

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>
            OTP Configuration
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>
            Control OTP behaviour for each action across the platform
          </p>
        </div>
        <button
          onClick={load}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.09)', borderRadius: 10,
            color: 'rgba(255,255,255,.55)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* ── Warning banner if high-risk OTPs are paused ── */}
      {highRiskPaused > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
          background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.25)',
          borderRadius: 14, padding: '14px 18px',
        }}>
          <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
              {highRiskPaused} high-risk OTP purpose{highRiskPaused > 1 ? 's' : ''} currently paused
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>
              Critical security OTPs are disabled. This may expose users to elevated risk. Review and re-enable unless you have an intentional reason to keep them paused.
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="otp-stats">
        {[
          { l: 'Total Purposes', v: configs.length,  c: '#60a5fa', Icon: Shield      },
          { l: 'Active',         v: totalActive,      c: '#34d399', Icon: CheckCircle2 },
          { l: 'Paused',         v: totalPaused,      c: '#f87171', Icon: XCircle     },
          { l: 'High Risk Paused', v: highRiskPaused, c: highRiskPaused > 0 ? '#f87171' : '#9ca3af', Icon: AlertCircle },
        ].map(({ l, v, c, Icon: IcoComp }) => (
          <div key={l} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <IcoComp size={13} color={c} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{l}</span>
            </div>
            <div style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: c, letterSpacing: '-.5px' }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          { key: 'all',    label: `All (${configs.length})`   },
          { key: 'active', label: `Active (${totalActive})`  },
          { key: 'paused', label: `Paused (${totalPaused})`  },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: 'inline-flex', alignItems: 'center',
              background: filter === key ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${filter === key ? 'rgba(245,158,11,.35)' : 'rgba(255,255,255,.09)'}`,
              borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: filter === key ? '#f59e0b' : 'rgba(255,255,255,.5)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Config cards grid ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading OTP configurations…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 }}>
          <Shield size={36} color="rgba(255,255,255,.1)" />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>No OTP configs match this filter</p>
        </div>
      ) : (
        <div className="otp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          {displayed.map(config => (
            <OtpCard
              key={config.purpose}
              config={config}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {/* ── Info footer ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.18)',
        borderRadius: 12, padding: '13px 16px', fontSize: 13,
        color: 'rgba(255,255,255,.5)', lineHeight: 1.6,
      }}>
        <Shield size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Changes take effect immediately. Disabling a high-risk OTP removes a security layer for all users.
          All configuration changes are logged in the admin audit trail.
        </span>
      </div>

      {/* ── Edit modal ── */}
      {editing && (
        <EditModal
          config={editing}
          onClose={() => setEditing(null)}
          onDone={msg => { showToast(msg); load(); }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111826', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 600,
          color: '#34d399', whiteSpace: 'nowrap',
          boxShadow: '0 8px 30px rgba(0,0,0,.5)', zIndex: 9999,
        }}>
          ✓ {toast}
        </div>
      )}

      <style>{`
        *,*::before,*::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea { font-family: inherit; }
        select option { background: #1a2235; color: #fff; }

        /* Stats: 4 columns on sm+ */
        @media (min-width: 540px) {
          .otp-stats { grid-template-columns: repeat(4, 1fr) !important; }
        }

        /* Cards: 2 columns on md, 3 on lg */
        @media (min-width: 640px) {
          .otp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1100px) {
          .otp-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}