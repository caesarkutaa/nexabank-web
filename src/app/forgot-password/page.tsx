'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail, ArrowRight, ArrowLeft, CheckCircle,
  AlertCircle, Loader2, Lock, Eye, EyeOff, Shield
} from 'lucide-react';
import api from '../lib/api';

type Stage = 'email' | 'otp' | 'reset' | 'done';

const emailSchema = z.object({ email: z.string().email('Enter a valid email address') });
const resetSchema = z.object({
  newPassword: z.string()
    .min(8, 'Min 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Must include upper, lower, number & special char'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router              = useRouter();
  const [stage, setStage]   = useState<Stage>('email');
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCPw, setShowCPw]   = useState(false);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const sendEmail = async (data: EmailForm) => {
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStage('otp');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the complete 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password/verify-otp', { email, otp: code });
      setStage('reset');
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Invalid code. Try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (data: ResetForm) => {
    const code = otp.join('');
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: code,
        newPassword:     data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setStage('done');
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) document.querySelectorAll<HTMLInputElement>('.fp-otp')[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0)
      document.querySelectorAll<HTMLInputElement>('.fp-otp')[i - 1]?.focus();
  };

  const STAGE_TITLES: Record<Stage, string> = {
    email: 'Reset your password',
    otp:   'Check your email',
    reset: 'Create new password',
    done:  'Password reset!',
  };

  return (
    <div className="fp-page">
      <div className="fp-bg">
        <div className="fp-orb fp-orb-1" />
        <div className="fp-orb fp-orb-2" />
        <div className="fp-grid" />
      </div>

      <nav className="fp-nav">
        <Link href="/" className="fp-logo">
          <div className="fp-logo-icon">N</div>
          <span className="fp-logo-text">NexaBank</span>
        </Link>
        <Link href="/login" className="fp-nav-link">← Back to login</Link>
      </nav>

      <div className="fp-center">
        <div className="fp-card">
          {/* Progress indicator */}
          {stage !== 'done' && (
            <div className="fp-progress">
              {(['email','otp','reset'] as Stage[]).map((s, i) => (
                <div key={s} className="fp-progress-item">
                  <div className={`fp-progress-dot ${['email','otp','reset'].indexOf(stage) >= i ? 'fp-dot-active' : ''}`} />
                  {i < 2 && <div className={`fp-progress-line ${['email','otp','reset'].indexOf(stage) > i ? 'fp-line-done' : ''}`} />}
                </div>
              ))}
            </div>
          )}

          <h1 className="fp-title">{STAGE_TITLES[stage]}</h1>

          {error && (
            <div className="fp-alert">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Stage: Email */}
          {stage === 'email' && (
            <form onSubmit={emailForm.handleSubmit(sendEmail)} className="fp-form">
              <p className="fp-desc">
                Enter your email address and we'll send you a 6-digit reset code.
              </p>
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <Mail size={15} className="field-icon" />
                  <input
                    {...emailForm.register('email')}
                    type="email"
                    className={`field-input ${emailForm.formState.errors.email ? 'field-error' : ''}`}
                    placeholder="john@example.com"
                    autoFocus
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <span className="field-msg">{emailForm.formState.errors.email.message}</span>
                )}
              </div>
              <button type="submit" className="btn-fp" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spin" /> Sending...</> : <>Send Reset Code <ArrowRight size={16} /></>}
              </button>
              <Link href="/login" className="fp-back-link">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </form>
          )}

          {/* Stage: OTP */}
          {stage === 'otp' && (
            <div className="fp-form">
              <p className="fp-desc">
                We sent a code to <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>. Enter it below.
              </p>
              <div className="fp-otp-group">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    className={`fp-otp ${d ? 'fp-otp-filled' : ''}`}
                    type="text" inputMode="numeric"
                    maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button className="btn-fp" onClick={verifyOtp} disabled={loading || otp.join('').length !== 6}>
                {loading ? <><Loader2 size={16} className="spin" /> Verifying...</> : <>Verify Code <ArrowRight size={16} /></>}
              </button>
              <button className="fp-ghost-btn" onClick={() => { setStage('email'); setError(''); setOtp(['','','','','','']); }}>
                <ArrowLeft size={14} /> Try a different email
              </button>
            </div>
          )}

          {/* Stage: Reset */}
          {stage === 'reset' && (
            <form onSubmit={resetForm.handleSubmit(doReset)} className="fp-form">
              <p className="fp-desc">Choose a strong new password for your account.</p>
              <div className="field-group">
                <label className="field-label">New Password</label>
                <div className="field-wrap">
                  <Lock size={15} className="field-icon" />
                  <input
                    {...resetForm.register('newPassword')}
                    type={showPw ? 'text' : 'password'}
                    className={`field-input field-input-pw ${resetForm.formState.errors.newPassword ? 'field-error' : ''}`}
                    placeholder="New strong password"
                  />
                  <button type="button" className="field-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <span className="field-msg">{resetForm.formState.errors.newPassword.message}</span>
                )}
              </div>
              <div className="field-group">
                <label className="field-label">Confirm New Password</label>
                <div className="field-wrap">
                  <Lock size={15} className="field-icon" />
                  <input
                    {...resetForm.register('confirmPassword')}
                    type={showCPw ? 'text' : 'password'}
                    className={`field-input field-input-pw ${resetForm.formState.errors.confirmPassword ? 'field-error' : ''}`}
                    placeholder="Repeat new password"
                  />
                  <button type="button" className="field-eye" onClick={() => setShowCPw(!showCPw)}>
                    {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <span className="field-msg">{resetForm.formState.errors.confirmPassword.message}</span>
                )}
              </div>
              <button type="submit" className="btn-fp" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spin" /> Resetting...</> : <>Reset Password <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Stage: Done */}
          {stage === 'done' && (
            <div className="fp-done">
              <div className="fp-done-icon">
                <CheckCircle size={36} color="#10b981" />
              </div>
              <p className="fp-desc" style={{ textAlign: 'center' }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <div className="fp-done-security">
                <Shield size={14} color="#f59e0b" />
                <span>A security confirmation was sent to your email</span>
              </div>
              <button className="btn-fp" onClick={() => router.push('/login')}>
                Go to Login <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .fp-page {
          min-height: 100vh; background: #050d1a;
          font-family: 'Sora', 'Inter', system-ui, sans-serif;
          display: flex; flex-direction: column;
          position: relative;
        }
        .fp-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .fp-orb { position: absolute; border-radius: 50%; filter: blur(80px); }
        .fp-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%);
          top: -100px; right: -100px;
        }
        .fp-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
          bottom: 0; left: -50px;
        }
        .fp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .fp-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .fp-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 16px; color: #050d1a;
        }
        .fp-logo-text { font-size: 18px; font-weight: 800; color: white; }
        .fp-nav-link { font-size: 14px; color: rgba(255,255,255,0.45); text-decoration: none; transition: color 0.2s; }
        .fp-nav-link:hover { color: white; }

        .fp-center {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 20px; position: relative; z-index: 1;
        }
        .fp-card {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px; padding: 36px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .fp-progress {
          display: flex; align-items: center; margin-bottom: 4px;
        }
        .fp-progress-item { display: flex; align-items: center; flex: 1; }
        .fp-progress-item:last-child { flex: 0; }
        .fp-progress-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: rgba(255,255,255,0.12);
          flex-shrink: 0;
          transition: background 0.3s;
        }
        .fp-dot-active { background: #f59e0b; }
        .fp-progress-line {
          flex: 1; height: 2px;
          background: rgba(255,255,255,0.08);
          margin: 0 6px;
          transition: background 0.3s;
        }
        .fp-line-done { background: rgba(245,158,11,0.4); }

        .fp-title { font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.4px; }
        .fp-alert {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
        }
        .fp-form { display: flex; flex-direction: column; gap: 16px; }
        .fp-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.65; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.65); }
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.28); pointer-events: none;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 11px 14px 11px 40px;
          font-size: 14px; color: white; outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.22); }
        .field-input:focus { border-color: rgba(245,158,11,0.5); background: rgba(255,255,255,0.07); }
        .field-input-pw { padding-right: 42px; }
        .field-error { border-color: rgba(239,68,68,0.5) !important; }
        .field-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,0.3); cursor: pointer; padding: 0;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .field-eye:hover { color: rgba(255,255,255,0.7); }
        .field-msg { font-size: 12px; color: #fca5a5; }

        .fp-otp-group { display: flex; gap: 10px; justify-content: center; }
        .fp-otp {
          width: 50px; height: 58px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          text-align: center;
          font-size: 22px; font-weight: 800; color: white;
          font-family: 'JetBrains Mono', monospace;
          outline: none; transition: all 0.2s; caret-color: #f59e0b;
        }
        .fp-otp:focus { border-color: rgba(245,158,11,0.6); background: rgba(245,158,11,0.05); }
        .fp-otp-filled { border-color: rgba(245,158,11,0.4); }

        .btn-fp {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #050d1a; border: none; border-radius: 12px;
          padding: 14px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .btn-fp:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(245,158,11,0.35);
        }
        .btn-fp:disabled { opacity: 0.55; cursor: not-allowed; }

        .fp-back-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.35);
          text-decoration: none; transition: color 0.2s;
        }
        .fp-back-link:hover { color: rgba(255,255,255,0.7); }
        .fp-ghost-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.35); font-size: 13px;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: color 0.2s;
        }
        .fp-ghost-btn:hover { color: rgba(255,255,255,0.7); }

        /* Done */
        .fp-done { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
        .fp-done-icon {
          width: 72px; height: 72px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .fp-done-security {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: rgba(255,255,255,0.35);
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.15);
          padding: 8px 14px; border-radius: 100px;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 480px) {
          .fp-nav { padding: 16px 20px; }
          .fp-card { padding: 24px; }
        }
      `}</style>
    </div>
  );
}