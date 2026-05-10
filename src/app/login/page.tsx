'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Shield, RefreshCw, ArrowRight,
  Lock, User, AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';
import api, { setAuthCookies } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const schema = z.object({
  username:     z.string().min(1, 'Username is required'),
  password:     z.string().min(1, 'Password is required'),
  captchaInput: z.string().min(6, 'Enter the 6-character code'),
});
type FormData = z.infer<typeof schema>;

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* ── shared input class ───────────────────────────────────────── */
const INP_BASE =
  'w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-colors';

export default function LoginPage() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [showPw,      setShowPw]      = useState(false);
  const [captcha,     setCaptcha]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [needs2FA,    setNeeds2FA]    = useState(false);
  const [userId,      setUserId]      = useState('');
  const [totpCode,    setTotpCode]    = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => { setCaptcha(generateCaptcha()); }, []);

  const onSubmit = async (data: FormData) => {
    setError('');
    if (data.captchaInput.toUpperCase() !== captcha.toUpperCase()) {
      setError('Incorrect captcha code. Please try again.');
      setCaptcha(generateCaptcha());
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username:     data.username,
        password:     data.password,
        captchaCode:  data.captchaInput,
        captchaToken: captcha,
      });
      const d = res.data.data;
      if (d.requiresTwoFactor) { setUserId(d.userId); setNeeds2FA(true); return; }
      setAuthCookies(d.accessToken, d.refreshToken, d.user.id, d.user.role);
      setUser(d.user);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push(
          d.user.role === 'admin' || d.user.role === 'super_admin'
            ? '/admin/dashboard'
            : '/dashboard/userboard',
        );
      }, 800);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Login failed. Please try again.');
      setCaptcha(generateCaptcha());
    } finally { setLoading(false); }
  };

  const handle2FA = async () => {
    if (totpCode.length !== 6) return;
    setTotpLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/2fa/verify', { userId, token: totpCode });
      if (res.data.data.verified) {
        setSuccess('2FA verified! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 800);
      }
    } catch { setError('Invalid 2FA code. Please try again.'); }
    finally { setTotpLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050d1a] font-sans flex flex-col relative">

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: -100, right: -100,
          background: 'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, bottom: 0, left: -50,
          background: 'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-base font-black text-[#050d1a]">
            N
          </div>
          <span className="text-[18px] font-extrabold text-white">NexaBank</span>
        </Link>
        <Link href="/register" className="text-sm text-white/50 hover:text-white transition-colors no-underline">
          No account? <span className="text-amber-500 font-semibold">Open one free →</span>
        </Link>
      </nav>

      {/* ── Main ── */}
      <div className="relative z-10 flex flex-1 min-h-[calc(100vh-73px)]">

        {/* Left panel — hidden on mobile */}
        <div className="hidden lg:flex flex-1 flex-col justify-between px-16 py-16"
          style={{ background: 'linear-gradient(160deg,#0a2342 0%,#050d1a 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-widest">
              <Shield size={12} /> SECURE LOGIN
            </div>
            <h1 className="font-extrabold text-white leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '-1.5px' }}>
              Welcome<br />back to<br />
              <span style={{
                background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>NexaBank</span>
            </h1>
            <p className="text-[15px] text-white/55 leading-relaxed mb-10 max-w-[360px]">
              Your complete financial platform — transfers, investments, cards, loans, and more.
            </p>
            <div className="flex flex-col gap-3">
              {['Bank-grade encryption','FDIC Insured deposits','Real-time notifications','24/7 fraud monitoring'].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                  <CheckCircle size={14} className="text-emerald-400 shrink-0" /> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-white/35 border border-white/8 px-4 py-2 rounded-full bg-white/[0.03] w-fit">
            <Shield size={13} /> Member FDIC · Deposits insured to $250,000
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 lg:flex-none lg:w-[520px] items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-[420px] bg-white/[0.03] border border-white/[0.09] rounded-2xl p-7 sm:p-9">

            {!needs2FA ? (
              <>
                {/* Header */}
                <div className="mb-7">
                  <h2 className="text-[22px] font-extrabold text-white tracking-tight mb-1.5">Sign in to your account</h2>
                  <p className="text-sm text-white/45">Enter your credentials to continue</p>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-[13px] font-medium px-3.5 py-3 rounded-xl mb-5">
                    <AlertCircle size={15} className="shrink-0" /> {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[13px] font-medium px-3.5 py-3 rounded-xl mb-5">
                    <CheckCircle size={15} className="shrink-0" /> {success}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mb-5">

                  {/* Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-white/70">Username or Email</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                      <input
                        {...register('username')}
                        className={`${INP_BASE} ${errors.username ? 'border-red-500/50' : ''}`}
                        placeholder="john_doe"
                        autoComplete="username"
                      />
                    </div>
                    {errors.username && <span className="text-[12px] text-red-300">{errors.username.message}</span>}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-semibold text-white/70">Password</label>
                      <Link href="/forgot-password" className="text-[12px] text-amber-500 font-semibold hover:opacity-75 transition-opacity no-underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                      <input
                        {...register('password')}
                        type={showPw ? 'text' : 'password'}
                        className={`${INP_BASE} pr-11 ${errors.password ? 'border-red-500/50' : ''}`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <span className="text-[12px] text-red-300">{errors.password.message}</span>}
                  </div>

                  {/* Captcha */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-white/70">Security Verification</label>
                    {/* Captcha display */}
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 select-none">
                      <div className="flex gap-1.5 items-center">
                        {captcha.split('').map((c, i) => (
                          <span key={i} className="text-2xl font-black leading-none"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (4 + i * 1.5)}deg)`,
                              color: i % 2 === 0 ? '#f59e0b' : '#60a5fa',
                              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              display: 'inline-block',
                              letterSpacing: 2,
                            }}>{c}</span>
                        ))}
                      </div>
                      <button type="button" onClick={() => setCaptcha(generateCaptcha())}
                        className="w-8 h-8 flex items-center justify-center bg-white/8 rounded-lg text-white/50 hover:bg-white/14 hover:text-white transition-all">
                        <RefreshCw size={13} />
                      </button>
                    </div>
                    {/* Captcha input */}
                    <div className="relative mt-1">
                      <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                      <input
                        {...register('captchaInput')}
                        className={`${INP_BASE} ${errors.captchaInput ? 'border-red-500/50' : ''}`}
                        placeholder="Enter the code above"
                        maxLength={6}
                        autoComplete="off"
                        style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
                      />
                    </div>
                    {errors.captchaInput && <span className="text-[12px] text-red-300">{errors.captchaInput.message}</span>}
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#050d1a] font-bold text-[15px] py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-px hover:enabled:shadow-[0_12px_30px_rgba(245,158,11,0.35)] transition-all mt-1">
                    {loading
                      ? <><Loader2 size={17} className="animate-spin" /> Signing in...</>
                      : <><ArrowRight size={17} /> Sign In</>}
                  </button>
                </form>

                <p className="text-center text-sm text-white/45">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-amber-500 font-semibold hover:underline no-underline">
                    Open a free account
                  </Link>
                </p>
              </>
            ) : (
              /* ── 2FA screen ── */
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-18 h-18 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center"
                  style={{ width: 72, height: 72 }}>
                  <Shield size={32} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-[22px] font-extrabold text-white tracking-tight mb-1.5">Two-Factor Authentication</h2>
                  <p className="text-sm text-white/45">Enter the 6-digit code from your authenticator app</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-300 text-[13px] font-medium px-3.5 py-3 rounded-xl w-full">
                    <AlertCircle size={15} className="shrink-0" /> {error}
                  </div>
                )}

                {/* TOTP digit inputs */}
                <div className="flex gap-2.5 my-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      className="w-11 h-14 bg-white/5 border border-white/12 rounded-xl text-center text-[22px] font-bold text-white outline-none focus:border-amber-500/60 transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace", caretColor: '#f59e0b' }}
                      maxLength={1}
                      value={totpCode[i] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = totpCode.split('');
                        arr[i] = val;
                        setTotpCode(arr.join('').slice(0, 6));
                        if (val && i < 5) {
                          const next = document.querySelectorAll<HTMLInputElement>('.totp-digit')[i + 1];
                          next?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !totpCode[i] && i > 0) {
                          const prev = document.querySelectorAll<HTMLInputElement>('.totp-digit')[i - 1];
                          prev?.focus();
                        }
                      }}
                      data-index={i}
                    />
                  ))}
                </div>

                <button onClick={handle2FA} disabled={totpLoading || totpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#050d1a] font-bold text-[15px] py-3.5 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed hover:enabled:-translate-y-px transition-all">
                  {totpLoading ? <><Loader2 size={17} className="animate-spin" /> Verifying...</> : 'Verify & Continue'}
                </button>

                <button onClick={() => { setNeeds2FA(false); setTotpCode(''); setCaptcha(generateCaptcha()); }}
                  className="text-sm text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer font-[inherit]">
                  ← Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}