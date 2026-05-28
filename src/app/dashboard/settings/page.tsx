'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Globe, Camera, Save,
  Loader2, CheckCircle2, X, Eye, EyeOff, Shield,
  Lock, Key, Smartphone, AlertCircle, ChevronRight,
  CreditCard, BadgeCheck, Clock, ShieldCheck,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'sonner';
import { getStatusColor, formatDate } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  _id:                string;
  username:           string;
  email:              string;
  firstName:          string;
  lastName:           string;
  phoneNumber?:       string;
  address?:           string;
  city?:              string;
  state?:             string;
  zipCode?:           string;
  country:            string;
  preferredCurrency:  string;
  profilePictureUrl?: string;
  role:               string;
  status:             string;
  emailVerified:      boolean;
  phoneVerified:      boolean;
  twoFactorEnabled:   boolean;
  creditScore:        number;
  creditRating:       string;
  kycStatus:          string;
  lastLoginAt?:       string;
  createdAt:          string;
}

const CURRENCIES = ['USD','EUR','GBP','NGN','GHS','KES','ZAR','CAD','AUD','INR','JPY','CHF','SGD'];
const US_STATES  = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
                    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
                    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
                    'VA','WA','WV','WI','WY'];

function ini(a?: string, b?: string) {
  return `${a?.[0] ?? ''}${b?.[0] ?? ''}`.toUpperCase() || 'U';
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="#f59e0b" />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.28)' }}>{hint}</span>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 14, color: '#fff',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s',
  WebkitTextFillColor: '#fff',
};

function Inp({ value, onChange, placeholder, type = 'text', disabled = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input type={type} value={value} disabled={disabled}
      onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inputStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : undefined }}
      onFocus={e => !disabled && (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
    />
  );
}

function Sel({ value, onChange, options, disabled }: {
  value: string; onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
        onFocus={e => !disabled && (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <ChevronRight size={13} color="rgba(255,255,255,.3)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
    </div>
  );
}

// ─── Password Field — defined OUTSIDE modal so it never remounts on state change ──
function PwdField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          style={{ ...inputStyle, paddingRight: 42 }}
          onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,.5)')}
          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={e => e.preventDefault()} // ← prevents input from losing focus on toggle
          onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 0, display: 'flex' }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </Field>
  );
}

// ─── Password Change Modal ────────────────────────────────────────────────────
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current,     setCurrent]     = useState('');
  const [next,        setNext]        = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showC,       setShowC]       = useState(false);
  const [showN,       setShowN]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  // Special chars: includes underscore, hyphen, and all common symbols
  // Matches: !@#$%^&*()_+-=[]{}|;':",.<>/?`~\
  const hasSpecial = /[\W_]/.test(next); // \W matches non-word chars, _ covers underscore

  const checks = {
    length:    next.length >= 8,
    uppercase: /[A-Z]/.test(next),
    lowercase: /[a-z]/.test(next),
    number:    /[0-9]/.test(next),
    special:   hasSpecial,
  };
  const strong = Object.values(checks).every(Boolean);
  const match  = next === confirm && confirm.length > 0;

  const submit = async () => {
    if (!current) return toast.error('Enter your current password');
    if (!strong)  return toast.error('Password does not meet all requirements');
    if (!confirm) return toast.error('Confirm your new password');
    if (!match)   return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: current,
        newPassword:     next,
        confirmPassword: confirm,
      });
      toast.success('Password changed successfully!');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Change Password</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <PwdField label="Current Password"    value={current} onChange={setCurrent} show={showC}       onToggle={() => setShowC(v => !v)} />
        <PwdField label="New Password"         value={next}    onChange={setNext}    show={showN}       onToggle={() => setShowN(v => !v)} />
        <PwdField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />

        {/* Strength checklist */}
        {next.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {([
              { ok: checks.length,    label: '8+ characters'          },
              { ok: checks.uppercase, label: 'Uppercase (A–Z)'        },
              { ok: checks.lowercase, label: 'Lowercase (a–z)'        },
              { ok: checks.number,    label: 'Number (0–9)'           },
              { ok: checks.special,   label: 'Special char (!_@#…)'   },
            ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ok ? '#34d399' : 'rgba(255,255,255,.35)' }}>
                {ok ? <CheckCircle2 size={12} /> : <X size={12} />} {label}
              </span>
            ))}
          </div>
        )}

        {/* Match indicator */}
        {confirm.length > 0 && (
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: match ? '#34d399' : '#f87171' }}>
            {match ? <CheckCircle2 size={12} /> : <X size={12} />}
            {match ? 'Passwords match' : 'Passwords do not match'}
          </span>
        )}

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1, marginTop: 4 }}>
          {loading ? <><Loader2 size={15} className="nx-spin" /> Changing…</> : <><Lock size={15} /> Change Password</>}
        </button>
      </div>
      <style>{`@keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}`}</style>
    </div>
  );
}

// ─── Security PIN Modal ───────────────────────────────────────────────────────
function PinModal({ onClose }: { onClose: () => void }) {
  const [pin,     setPin]     = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const match = pin === confirm && confirm.length === 6;
  const valid = /^\d{6}$/.test(pin);

  const submit = async () => {
    if (!valid)  return toast.error('PIN must be exactly 6 digits');
    if (!match)  return toast.error('PINs do not match');
    setLoading(true);
    try {
      await api.post('/auth/security-pin/set', { pin });
      toast.success('Security PIN set successfully!');
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to set PIN'); }
    finally { setLoading(false); }
  };

  const PinBox = ({ label, value, set, prefix }: { label: string; value: string; set: (v: string) => void; prefix: string }) => (
    <Field label={label}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            id={`${prefix}-${i}`}
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            type="password"
            value={value[i] ?? ''}
            onChange={e => {
              // Only accept digits
              const digit = e.target.value.replace(/\D/g, '').slice(-1);
              const arr = (value + '      ').slice(0, 6).split('');
              arr[i] = digit;
              const newVal = arr.join('').trimEnd();
              set(newVal);
              // Advance to next box whenever a digit is entered
              if (digit) {
                setTimeout(() => document.getElementById(`${prefix}-${i + 1}`)?.focus(), 0);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                e.preventDefault();
                const arr = (value + '      ').slice(0, 6).split('');
                if (arr[i] && arr[i].trim()) {
                  // Clear current box
                  arr[i] = '';
                  set(arr.join('').trimEnd());
                } else if (i > 0) {
                  // Move to previous and clear it
                  arr[i - 1] = '';
                  set(arr.join('').trimEnd());
                  document.getElementById(`${prefix}-${i - 1}`)?.focus();
                }
              }
              if (e.key === 'ArrowLeft'  && i > 0) document.getElementById(`${prefix}-${i - 1}`)?.focus();
              if (e.key === 'ArrowRight' && i < 5) document.getElementById(`${prefix}-${i + 1}`)?.focus();
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(245,158,11,.7)';
              e.target.style.background  = '#1e2c45';
            }}
            onBlur={e => {
              e.target.style.borderColor = value[i]?.trim() ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.12)';
              e.target.style.background  = '#1a2235';
            }}
            style={{
              width: 44, height: 52, textAlign: 'center', fontSize: 22,
              fontWeight: 800, color: '#fff', background: '#1a2235',
              border: `1.5px solid ${value[i]?.trim() ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.12)'}`,
              borderRadius: 10, outline: 'none', fontFamily: 'monospace',
              caretColor: 'transparent', WebkitTextFillColor: '#fff',
              transition: 'border-color .15s, background .15s',
            }}
            className="pin-box"
          />
        ))}
      </div>
    </Field>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px 20px 0 0', padding: '26px 22px', width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>Set Security PIN</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', margin: 0 }}>Used to confirm transfers and payments</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <div style={{ background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.18)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Key size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: 0 }}>Enter a 6-digit numeric PIN. Never share it with anyone — NexaBank will never ask for it.</p>
        </div>

        <PinBox label="New PIN"     value={pin}     set={setPin}     prefix="pin-new" />
        <PinBox label="Confirm PIN" value={confirm} set={setConfirm} prefix="pin-cfm" />

        {confirm.length === 6 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: match ? '#34d399' : '#f87171' }}>
            {match ? <CheckCircle2 size={14} /> : <X size={14} />}
            {match ? 'PINs match' : 'PINs do not match'}
          </div>
        )}

        <button onClick={submit} disabled={loading || !valid || !match}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: (loading || !valid || !match) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (loading || !valid || !match) ? .5 : 1 }}>
          {loading ? <><Loader2 size={15} className="nx-spin" /> Saving…</> : <><Key size={15} /> Set Security PIN</>}
        </button>
      </div>
      <style>{`@keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const storeUser = useAuthStore(s => s.user);
  const setUser   = useAuthStore(s => s.setUser);

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [kycStatus,    setKycStatus]    = useState<string>('not_started'); // always fresh from /kyc/status
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');
  const [city,       setCity]       = useState('');
  const [state,      setState]      = useState('');
  const [zip,        setZip]        = useState('');
  const [currency,   setCurrency]   = useState('USD');

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      // Always fetch both in parallel — never trust stale Zustand store for KYC
      const [profRes, kycRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/kyc/status'),
      ]);
      const p: UserProfile = profRes.data.data ?? profRes.data;
      const ks = (kycRes.data.data ?? kycRes.data)?.status ?? 'not_started';
      setProfile(p);
      setKycStatus(ks);
      // Sync cookie and store with fresh value
      document.cookie = `nexabank_kyc_status=${ks};path=/;max-age=${7 * 86400};samesite=strict`;
      setUser({ ...storeUser, ...p, kycStatus: ks } as any);
      setFirstName(p.firstName   || '');
      setLastName (p.lastName    || '');
      setPhone    (p.phoneNumber || '');
      setAddress  (p.address     || '');
      setCity     (p.city        || '');
      setState    (p.state       || '');
      setZip      (p.zipCode     || '');
      setCurrency (p.preferredCurrency || 'USD');
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted, load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/profile', {
        firstName, lastName,
        phoneNumber: phone,
        address, city, state,
        zipCode: zip,
        preferredCurrency: currency,
      });
      const updated = res.data.data ?? res.data;
      setProfile(updated);
      setUser({ ...storeUser, ...updated } as any);
      toast.success('Profile updated successfully!');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file); // ← matches FileInterceptor('file')
    try {
      const res = await api.post('/users/profile/picture', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.profilePictureUrl || res.data.data?.profilePictureUrl;
      if (url) {
        setProfile(p => p ? { ...p, profilePictureUrl: url } : p);
        setUser({ ...storeUser, profilePictureUrl: url } as any);
        toast.success('Profile picture updated!');
      }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to upload picture'); }
    finally { setUploading(false); }
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  const creditColor = (profile?.creditScore ?? 0) >= 750 ? '#34d399'
    : (profile?.creditScore ?? 0) >= 670 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860, margin: '0 auto' }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#fff', letterSpacing: '-.5px', margin: '0 0 4px' }}>Settings & Profile</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>Manage your personal information and account security</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 12, color: 'rgba(255,255,255,.35)', fontSize: 14 }}>
          <Loader2 size={22} color="#f59e0b" className="nx-spin" /> Loading profile…
        </div>
      ) : (
        <>
          {/* ── Avatar + quick info ─────────────────────────────── */}
          <div className="stg-hero" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '24px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#050d1a', overflow: 'hidden', border: '3px solid rgba(245,158,11,.3)' }}>
                {profile?.profilePictureUrl
                  ? <img src={profile.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : ini(profile?.firstName, profile?.lastName)}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#f59e0b', border: '2px solid #0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {uploading ? <Loader2 size={12} color="#050d1a" className="nx-spin" /> : <Camera size={12} color="#050d1a" />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f); }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 3 }}>
                {profile?.firstName} {profile?.lastName}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>
                @{profile?.username} · {profile?.email}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* KYC badge — always fresh from /kyc/status API, never stale store */}
                <span className={`spill ${getStatusColor(kycStatus)}`}>
                  {kycStatus === 'approved' ? <BadgeCheck size={11} /> : <Clock size={11} />}
                  KYC {kycStatus.replace(/_/g, ' ')}
                </span>
                {/* Email verified */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: profile?.emailVerified ? 'rgba(52,211,153,.12)' : 'rgba(255,255,255,.06)', color: profile?.emailVerified ? '#34d399' : 'rgba(255,255,255,.35)' }}>
                  <Mail size={10} /> {profile?.emailVerified ? 'Email verified' : 'Email unverified'}
                </span>
                {/* 2FA badge */}
                {profile?.twoFactorEnabled && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(52,211,153,.12)', color: '#34d399' }}>
                    <Smartphone size={10} /> 2FA on
                  </span>
                )}
                {/* Role */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(245,158,11,.1)', color: '#f59e0b', textTransform: 'capitalize' }}>
                  {profile?.role}
                </span>
              </div>
            </div>

            {/* Credit score mini card */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '14px 18px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Credit Score</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: creditColor, fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-2px' }}>{profile?.creditScore ?? 300}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: creditColor, textTransform: 'capitalize', marginTop: 3 }}>
                {(profile?.creditRating ?? 'no history').replace(/_/g, ' ')}
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden', marginTop: 8, width: 80 }}>
                <div style={{ height: '100%', borderRadius: 2, background: creditColor, width: `${((profile?.creditScore ?? 300) - 300) / 550 * 100}%` }} />
              </div>
            </div>
          </div>

          {/* ── Personal Info ───────────────────────────────────── */}
          <Section title="Personal Information" icon={User}>
            <div className="stg-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Field label="First Name">
                <Inp value={firstName} onChange={setFirstName} placeholder="John" />
              </Field>
              <Field label="Last Name">
                <Inp value={lastName} onChange={setLastName} placeholder="Doe" />
              </Field>
              <Field label="Username" hint="Username cannot be changed">
                <Inp value={profile?.username ?? ''} onChange={() => {}} disabled />
              </Field>
              <Field label="Email Address" hint="Contact support to change email">
                <Inp value={profile?.email ?? ''} onChange={() => {}} disabled />
              </Field>
              <Field label="Phone Number">
                <Inp value={phone} onChange={setPhone} placeholder="+1 555 000 0000" type="tel" />
              </Field>
              <Field label="Preferred Currency">
                <Sel value={currency} onChange={setCurrency} options={CURRENCIES} />
              </Field>
            </div>
          </Section>

          {/* ── Address ─────────────────────────────────────────── */}
          <Section title="Address" icon={MapPin}>
            {/* Full address display — shows what's on record */}
            {(profile?.address || profile?.city || profile?.state) && (
              <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: '13px 16px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Current Address on File</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.6 }}>
                    {[
                      profile.address,
                      [profile.city, profile.state, profile.zipCode].filter(Boolean).join(', '),
                      profile.country,
                    ].filter(Boolean).join('\n').split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Street Address" hint="House number, street name, apt/unit">
                  <Inp value={address} onChange={setAddress} placeholder="123 Main Street, Apt 4B" />
                </Field>
              </div>
              <Field label="City">
                <Inp value={city} onChange={setCity} placeholder="New York" />
              </Field>
              <Field label="State">
                <Sel value={state} onChange={setState}
                  options={[{ value: '', label: 'Select state' }, ...US_STATES.map(s => ({ value: s, label: s }))]} />
              </Field>
              <Field label="ZIP Code">
                <Inp value={zip} onChange={setZip} placeholder="10001" />
              </Field>
             <Field label="Country" hint="Contact support to update country">
                <Inp value={profile?.country ?? 'US'} onChange={() => {}} disabled />
              </Field>
            </div>
          </Section>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? .6 : 1 }}>
            {saving ? <><Loader2 size={16} className="nx-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
          </button>

          {/* ── Security ─────────────────────────────────────────── */}
          <Section title="Security" icon={Shield}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Change Password */}
              <button onClick={() => setShowPwdModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s', width: '100%' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={16} color="#f59e0b" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Change Password</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Update your account password</div>
                  </div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,.3)" />
              </button>

              
              {/* Security PIN */}
              <button onClick={() => setShowPinModal(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s', width: '100%' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={16} color="#60a5fa" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Security PIN</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>6-digit PIN for confirming transactions</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>••••••</span>
                  <ChevronRight size={16} color="rgba(255,255,255,.3)" />
                </div>
              </button>
            </div>
          </Section>

          {/* ── KYC Status ──────────────────────────────────────── */}
          <Section title="Identity Verification (KYC)" icon={ShieldCheck}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`spill ${getStatusColor(kycStatus)}`} style={{ fontSize: 12 }}>
                    {kycStatus === 'approved' ? <BadgeCheck size={12} /> : <Clock size={12} />}
                    {kycStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.6 }}>
                  {kycStatus === 'approved'
                    ? 'Your identity is verified. You have full access to all NexaBank features.'
                    : kycStatus === 'pending'
                    ? 'Your documents are under review. This usually takes 1–3 business days.'
                    : kycStatus === 'rejected'
                    ? 'Your verification was rejected. Please resubmit with clearer documents.'
                    : kycStatus === 'resubmit'
                    ? 'Additional documents are required. Please resubmit your verification.'
                    : 'Complete identity verification to unlock transfers, cards, and investments.'}
                </p>
              </div>
              {kycStatus !== 'approved' && (
                <a href="/dashboard/kyc"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#050d1a', textDecoration: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {kycStatus === 'rejected' || kycStatus === 'resubmit' ? 'Resubmit' : 'Verify Now'} <ChevronRight size={14} />
                </a>
              )}
            </div>
          </Section>

          {/* ── Account Info ─────────────────────────────────────── */}
          <Section title="Account Info" icon={CreditCard}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Account Status',  value: profile?.status ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} />}
      {showPinModal && <PinModal      onClose={() => setShowPinModal(false)} />}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .spill { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; }
        @keyframes nx-spin { to { transform:rotate(360deg); } }
        .nx-spin { animation:nx-spin 1s linear infinite; }

        /* ── Responsive overrides ── */

        /* Avatar + info card: stack on mobile */
        @media(max-width:600px) {
          .stg-hero { flex-direction:column !important; align-items:center !important; text-align:center; }
          .stg-hero-info { align-items:center !important; }
          .stg-hero-badges { justify-content:center !important; }
          .stg-credit { width:100% !important; }
        }

        /* PIN boxes: shrink on very small screens */
        @media(max-width:380px) {
          .pin-box { width:36px !important; height:44px !important; font-size:18px !important; }
        }

        /* Modal: full-width on mobile, centered card on desktop */
        @media(min-width:640px) {
          .stg-modal { border-radius:20px !important; max-width:480px; }
          .stg-overlay { align-items:center !important; padding:16px !important; }
        }

        /* Grid: 1-col on mobile */
        @media(max-width:480px) {
          .stg-grid-2 { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}