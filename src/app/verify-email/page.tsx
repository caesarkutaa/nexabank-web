'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Clock, Shield
} from 'lucide-react';
import api from '../lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId') ?? '';
  const email  = params.get('email')  ?? '';

  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // ── 10-minute countdown ──────────────────────────────────────
  const TOTAL    = 10 * 60; // 600 seconds
  const [timeLeft, setTimeLeft]   = useState(TOTAL);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setTimeLeft(TOTAL);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mins     = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs     = String(timeLeft % 60).padStart(2, '0');
  const pct      = (timeLeft / TOTAL) * 100;
  const isExpired = timeLeft === 0;

  // ── Refs for each OTP digit ───────────────────────────────────
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string) => {
    const v    = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    setError('');
    if (v && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp]; next[index] = ''; setOtp(next);
      } else if (index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) inputRefs[index - 1].current?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs[5].current?.focus();
      e.preventDefault();
    }
  };

  // ── Verify ────────────────────────────────────────────────────
  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the complete 6-digit code'); return; }
    if (!userId)            { setError('Missing session. Please register again.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-email', { userId, otp: code });
      if (timerRef.current) clearInterval(timerRef.current);
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => router.push('/login?verified=true'), 1800);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Invalid or expired code.');
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────
  const resend = async () => {
    if (!canResend || !userId) return;
    setResending(true); setError('');
    try {
      await api.post('/auth/resend-otp', { userId, email });
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
      startTimer();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="vp">
      <div className="vp-bg">
        <div className="vp-orb vp-orb-1" />
        <div className="vp-orb vp-orb-2" />
        <div className="vp-grid" />
      </div>

      <nav className="vp-nav">
        <Link href="/" className="vp-logo">
          <div className="vp-logo-icon">N</div>
          <span className="vp-logo-text">NexaBank</span>
        </Link>
        <Link href="/login" className="vp-back-link">← Back to login</Link>
      </nav>

      <div className="vp-center">
        <div className="vp-card">

          {/* Animated mail icon */}
          <div className="vp-icon-wrap">
            <div className="vp-icon-ring" />
            <Mail size={30} color="#f59e0b" style={{ position: 'relative', zIndex: 1 }} />
          </div>

          <h1 className="vp-title">Check your email</h1>
          <p className="vp-sub">
            We sent a <strong>6-digit code</strong> to<br />
            <span className="vp-email">{email || 'your email address'}</span>
          </p>

          {/* Circular countdown */}
          <div className="vp-timer-wrap">
            <svg viewBox="0 0 64 64" className="vp-ring-svg">
              <circle cx="32" cy="32" r="28" className="vp-ring-track" />
              <circle
                cx="32" cy="32" r="28"
                className="vp-ring-prog"
                style={{
                  strokeDasharray:  '175.9',
                  strokeDashoffset: `${175.9 * (1 - pct / 100)}`,
                  stroke: isExpired ? '#ef4444' : pct > 33 ? '#f59e0b' : '#f97316',
                }}
              />
            </svg>
            <div className="vp-timer-inner">
              <Clock size={12} color={isExpired ? '#ef4444' : '#f59e0b'} />
              <span className="vp-timer-val" style={{ color: isExpired ? '#ef4444' : '#f59e0b' }}>
                {mins}:{secs}
              </span>
            </div>
          </div>

          {/* Expired badge */}
          {isExpired && (
            <div className="vp-expired">
              <AlertCircle size={14} /> Code expired — request a new one below
            </div>
          )}

          {/* Alerts */}
          {error && !isExpired && (
            <div className="vp-alert vp-err"><AlertCircle size={14} /> {error}</div>
          )}
          {success && (
            <div className="vp-alert vp-ok"><CheckCircle size={14} /> {success}</div>
          )}

          {/* OTP digits */}
          <div className="vp-digits" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                className={`vp-digit ${digit ? 'vp-digit-filled' : ''} ${isExpired ? 'vp-digit-expired' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isExpired || !!success}
                autoFocus={i === 0}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <p className="vp-hint">💡 You can paste your 6-digit code all at once</p>

          {/* Verify button */}
          <button
            className="vp-btn-verify"
            onClick={verify}
            disabled={loading || otp.join('').length !== 6 || isExpired || !!success}
          >
            {loading
              ? <><Loader2 size={17} className="spin" /> Verifying...</>
              : <><CheckCircle size={17} /> Verify Email</>
            }
          </button>

          {/* Resend */}
          <div className="vp-resend">
            {canResend ? (
              <>
                <span className="vp-resend-label">Code expired.</span>
                <button className="vp-resend-btn" onClick={resend} disabled={resending}>
                  {resending
                    ? <><Loader2 size={13} className="spin" /> Sending...</>
                    : <><RefreshCw size={13} /> Get a new code</>
                  }
                </button>
              </>
            ) : (
              <>
                <span className="vp-resend-label">Didn't receive it?</span>
                <span className="vp-resend-count">Resend available in {mins}:{secs}</span>
              </>
            )}
          </div>

          {/* Security note */}
          <div className="vp-security-note">
            <Shield size={12} />
            Code valid for <strong>10 minutes</strong> · One-time use only
          </div>

          <Link href="/login" className="vp-login-link">← Return to login</Link>
        </div>
      </div>

      <style jsx>{`
        .vp {
          min-height: 100vh; background: #050d1a;
          font-family: 'Sora', 'Inter', system-ui, sans-serif;
          display: flex; flex-direction: column;
          position: relative;
        }
        .vp-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .vp-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
        .vp-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%);
          top: -100px; right: -100px;
        }
        .vp-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          bottom: 0; left: -50px;
        }
        .vp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .vp-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .vp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .vp-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 16px; color: #050d1a;
        }
        .vp-logo-text { font-size: 18px; font-weight: 800; color: white; }
        .vp-back-link {
          font-size: 14px; color: rgba(255,255,255,0.4);
          text-decoration: none; transition: color 0.2s;
        }
        .vp-back-link:hover { color: white; }

        .vp-center {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 20px; position: relative; z-index: 1;
        }

        .vp-card {
          width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 24px; padding: 40px;
          display: flex; flex-direction: column;
          align-items: center; gap: 18px; text-align: center;
        }

        /* Icon */
        .vp-icon-wrap {
          position: relative;
          width: 80px; height: 80px;
          display: flex; align-items: center; justify-content: center;
        }
        .vp-icon-ring {
          position: absolute; inset: 0;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 50%;
          animation: vp-pulse 2s ease-in-out infinite;
        }
        @keyframes vp-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.6; }
        }

        .vp-title { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .vp-sub   { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.65; }
        .vp-sub strong { color: rgba(255,255,255,0.75); }
        .vp-email { color: #f59e0b; font-weight: 700; }

        /* Timer ring */
        .vp-timer-wrap {
          position: relative;
          width: 76px; height: 76px;
          display: flex; align-items: center; justify-content: center;
        }
        .vp-ring-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          transform: rotate(-90deg);
        }
        .vp-ring-track {
          fill: none;
          stroke: rgba(255,255,255,0.07);
          stroke-width: 4;
        }
        .vp-ring-prog {
          fill: none;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear, stroke 0.4s;
        }
        .vp-timer-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; gap: 2px;
        }
        .vp-timer-val {
          font-size: 15px; font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 1px;
          transition: color 0.4s;
        }

        /* Expired badge */
        .vp-expired {
          display: flex; align-items: center; gap: 7px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          font-size: 13px; font-weight: 600;
          padding: 8px 16px; border-radius: 100px;
        }

        /* Alerts */
        .vp-alert {
          width: 100%;
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500; text-align: left;
        }
        .vp-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }
        .vp-ok  { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #6ee7b7; }

        /* OTP digits */
        .vp-digits { display: flex; gap: 10px; }
        .vp-digit {
          width: 52px; height: 64px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          text-align: center;
          font-size: 26px; font-weight: 800; color: white;
          font-family: 'JetBrains Mono', monospace;
          outline: none; transition: all 0.2s;
          caret-color: #f59e0b;
        }
        .vp-digit:focus {
          border-color: rgba(245,158,11,0.65);
          background: rgba(245,158,11,0.06);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .vp-digit-filled  { border-color: rgba(245,158,11,0.4); }
        .vp-digit-expired { opacity: 0.35; cursor: not-allowed; }
        .vp-digit:disabled{ opacity: 0.35; cursor: not-allowed; }

        .vp-hint { font-size: 12px; color: rgba(255,255,255,0.22); }

        /* Verify button */
        .vp-btn-verify {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #050d1a; border: none; border-radius: 12px;
          padding: 14px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .vp-btn-verify:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(245,158,11,0.35);
        }
        .vp-btn-verify:disabled {
          opacity: 0.5; cursor: not-allowed;
          transform: none; box-shadow: none;
        }

        /* Resend */
        .vp-resend {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap; justify-content: center;
        }
        .vp-resend-label { font-size: 13px; color: rgba(255,255,255,0.4); }
        .vp-resend-btn {
          display: flex; align-items: center; gap: 5px;
          background: none; border: none;
          color: #f59e0b; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: opacity 0.2s;
        }
        .vp-resend-btn:hover:not(:disabled) { opacity: 0.75; }
        .vp-resend-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .vp-resend-count {
          font-size: 13px; color: rgba(255,255,255,0.28);
          font-family: 'JetBrains Mono', monospace; font-weight: 600;
        }

        /* Security note */
        .vp-security-note {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 8px 14px; border-radius: 100px;
        }
        .vp-security-note strong { color: rgba(255,255,255,0.5); }

        .vp-login-link {
          font-size: 13px; color: rgba(255,255,255,0.3);
          text-decoration: none; transition: color 0.2s;
        }
        .vp-login-link:hover { color: rgba(255,255,255,0.65); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 480px) {
          .vp-nav  { padding: 16px 20px; }
          .vp-card { padding: 28px 16px; }
          .vp-digit{ width: 44px; height: 54px; font-size: 22px; }
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#050d1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}