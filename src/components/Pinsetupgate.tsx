'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Loader2, CheckCircle2, X, Shield, AlertCircle } from 'lucide-react';
import api from '../app/lib/api';
import { toast } from 'sonner';

// ── PinBoxes ────────────────────────────────────────────────
function PinBoxes({
  value, onChange, prefix, label,
}: {
  value: string; onChange: (v: string) => void; prefix: string; label: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            id={`${prefix}-${i}`}
            inputMode="numeric"
            maxLength={1}
            type="password"
            value={value[i] ?? ''}
            onChange={e => {
              const digit = e.target.value.replace(/\D/g, '').slice(-1);
              const arr = (value.padEnd(6, ' ')).split('');
              arr[i] = digit;
              onChange(arr.join('').trimEnd());
              if (digit && i < 5) {
                setTimeout(() => document.getElementById(`${prefix}-${i + 1}`)?.focus(), 0);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                e.preventDefault();
                const arr = (value.padEnd(6, ' ')).split('');
                if (arr[i]?.trim()) {
                  arr[i] = ' ';
                  onChange(arr.join('').trimEnd());
                } else if (i > 0) {
                  arr[i - 1] = ' ';
                  onChange(arr.join('').trimEnd());
                  document.getElementById(`${prefix}-${i - 1}`)?.focus();
                }
              }
              if (e.key === 'ArrowLeft'  && i > 0) document.getElementById(`${prefix}-${i - 1}`)?.focus();
              if (e.key === 'ArrowRight' && i < 5) document.getElementById(`${prefix}-${i + 1}`)?.focus();
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(245,158,11,.8)';
              e.target.style.background  = '#1e2c45';
            }}
            onBlur={e => {
              e.target.style.borderColor = value[i]?.trim() ? 'rgba(245,158,11,.5)' : 'rgba(255,255,255,.12)';
              e.target.style.background  = '#1a2235';
            }}
            style={{
              width: 48, height: 58, textAlign: 'center', fontSize: 24,
              fontWeight: 800, color: '#fff', background: '#1a2235',
              border: `2px solid ${value[i]?.trim() ? 'rgba(245,158,11,.5)' : 'rgba(255,255,255,.12)'}`,
              borderRadius: 12, outline: 'none', fontFamily: 'monospace',
              caretColor: 'transparent', WebkitTextFillColor: '#fff',
              transition: 'border-color .15s, background .15s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── PinSetupGate ─────────────────────────────────────────────
// Shows a fullscreen modal if user has not set their security PIN.
// Wraps children — renders them normally once PIN is set.
export default function PinSetupGate({ children }: { children: React.ReactNode }) {
  const [checking,  setChecking]  = useState(true);
  const [needsPin,  setNeedsPin]  = useState(false);
  const [pin,       setPin]       = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  const pinValid    = /^\d{6}$/.test(pin);
  const confirmFull = confirm.length === 6;
  const match       = pin === confirm && confirmFull;
  const canSubmit   = pinValid && match && !loading;

  // Check if user has already set their PIN
  const check = useCallback(async () => {
    try {
      const res  = await api.get('/auth/me');
      const user = res.data.data ?? res.data;
      if (!user.hasPinSet) setNeedsPin(true);
    } catch {
      // If the check fails (network etc.) don't block the user
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const submit = async () => {
    if (!pinValid)  return toast.error('PIN must be exactly 6 digits');
    if (!match)     return toast.error('PINs do not match');
    setLoading(true);
    try {
      await api.post('/auth/security-pin/set', { pin, confirmPin: confirm });
      toast.success('Security PIN set! You now have full access.');
      setDone(true);
      // Small delay so the user sees the success state
      setTimeout(() => setNeedsPin(false), 800);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  // While checking — render nothing (avoids flash)
  if (checking) return null;

  // PIN already set — render children normally
  if (!needsPin) return <>{children}</>;

  // PIN setup required — show fullscreen gate
  return (
    <>
      {/* Dim background — children still mount but are covered */}
      <div style={{ filter: 'blur(4px) brightness(0.3)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Gate overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,10,24,.85)', backdropFilter: 'blur(12px)',
        padding: 16,
      }}>
        <div style={{
          background: '#0f1623',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 24,
          padding: '36px 28px',
          width: '100%', maxWidth: 420,
          display: 'flex', flexDirection: 'column', gap: 22,
          boxShadow: '0 32px 80px rgba(0,0,0,.7)',
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(245,158,11,.05))',
              border: '1px solid rgba(245,158,11,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              {done
                ? <CheckCircle2 size={34} color="#34d399" />
                : <Key size={34} color="#f59e0b" />
              }
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-.5px' }}>
              {done ? 'PIN Set Successfully!' : 'Set Your Security PIN'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.6 }}>
              {done
                ? 'You now have full access to NexaBank. Welcome!'
                : 'Before you continue, set a 6-digit security PIN. You\'ll need it to confirm transfers and payments.'}
            </p>
          </div>

          {!done && (
            <>
              {/* Why this matters */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.18)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <Shield size={15} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', margin: 0, lineHeight: 1.6 }}>
                  Your PIN protects every transfer you make. It is separate from your password
                  and is <strong style={{ color: '#60a5fa' }}>required before any money moves</strong>.
                  Never share it with anyone — NexaBank will never ask for it.
                </p>
              </div>

              {/* PIN inputs */}
              <PinBoxes value={pin}     onChange={setPin}     prefix="gate-pin" label="New PIN"     />
              <PinBoxes value={confirm} onChange={setConfirm} prefix="gate-cfm" label="Confirm PIN" />

              {/* Match indicator */}
              {confirmFull && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: match ? '#34d399' : '#f87171', justifyContent: 'center' }}>
                  {match
                    ? <><CheckCircle2 size={14} /> PINs match — ready to save</>
                    : <><X size={14} /> PINs do not match</>
                  }
                </div>
              )}

              {/* Rules */}
              {pin.length > 0 && !pinValid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#f87171', justifyContent: 'center' }}>
                  <AlertCircle size={13} /> PIN must be exactly 6 digits (numbers only)
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: canSubmit ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,.08)',
                  color: canSubmit ? '#050d1a' : 'rgba(255,255,255,.25)',
                  border: 'none', borderRadius: 14, padding: '14px',
                  fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all .2s',
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Setting PIN…</>
                  : <><Key size={16} /> Set My Security PIN</>
                }
              </button>

              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                You can change your PIN later in Settings → Security
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}