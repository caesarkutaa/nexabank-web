'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertCircle, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../admin/hooks/useAdminAuth';

// ─── Password input — defined outside to prevent remount on state change ──────
function PwdInput({
  value, onChange, placeholder, onEnter,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; onEnter?: () => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        autoComplete="current-password"
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{
          width: '100%', background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
          padding: '13px 44px 13px 16px', fontSize: 14, color: '#fff',
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          WebkitTextFillColor: '#fff', transition: 'border-color .2s',
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,.6)')}
        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
      />
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={e => e.preventDefault()}
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 13, top: '50%',
          transform: 'translateY(-50%)', background: 'none',
          border: 'none', color: 'rgba(255,255,255,.3)',
          cursor: 'pointer', padding: 0, display: 'flex',
        }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  const { loading, error, login } = useAdminAuth();

  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = () => {
    if (!identifier.trim() || !password) return;
    login({ identifier: identifier.trim().toLowerCase(), password });
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#070c17' }} />;

  return (
    <div style={{
      minHeight: '100vh', background: '#070c17',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(239,68,68,.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', right: '-60px', width: 360, height: 360, background: 'radial-gradient(circle, rgba(245,158,11,.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#050d1a' }}>N</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-.4px' }}>NexaBank</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '.1em', textTransform: 'uppercase' }}>Admin Portal</div>
            </div>
          </div>

          {/* Shield icon */}
          <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={27} color="#f87171" />
          </div>

          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-.4px' }}>Administrator Sign In</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>Restricted access · Authorised personnel only</p>
        </div>

        {/* Warning banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 12, padding: '12px 14px', marginBottom: 22 }}>
          <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.65 }}>
            This portal is for <strong style={{ color: '#f87171' }}>administrators only</strong>. All activity is monitored and logged. Unauthorised access attempts will result in account suspension.
          </p>
        </div>

        {/* Login card */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '26px 22px' }}>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.22)', borderRadius: 10, padding: '11px 13px', marginBottom: 18 }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

            {/* Identifier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Email or Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="rgba(255,255,255,.22)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={identifier}
                  autoComplete="username"
                  autoFocus
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="admin@nexabank.com"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
                    padding: '13px 16px 13px 40px', fontSize: 14, color: '#fff',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    WebkitTextFillColor: '#fff', transition: 'border-color .2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(239,68,68,.6)')}
                  onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Password</label>
              <PwdInput value={password} onChange={setPassword} placeholder="••••••••" onEnter={handleSubmit} />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !identifier.trim() || !password}
              style={{
                marginTop: 4, width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                background: (loading || !identifier.trim() || !password)
                  ? 'rgba(239,68,68,.35)'
                  : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 14, fontWeight: 700,
                cursor: (loading || !identifier.trim() || !password) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'opacity .2s',
              }}>
              {loading
                ? <><Loader2 size={16} className="adm-spin" /> Authenticating…</>
                : <><Lock size={15} /> Sign In to Admin Portal</>}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/login"
            style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', textDecoration: 'none', transition: 'color .15s' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,.6)')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,.28)')}>
            ← Back to user login
          </a>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.14)', marginTop: 26, lineHeight: 1.7 }}>
          By signing in you agree to NexaBank's administrator terms. All sessions are encrypted and logged.
        </p>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,.22) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #111826 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        @keyframes adm-spin { to { transform:rotate(360deg); } }
        .adm-spin { animation: adm-spin 1s linear infinite; }
        @media(max-width:480px) {
          h1 { font-size: 18px !important; }
        }
      `}</style>
    </div>
  );
}