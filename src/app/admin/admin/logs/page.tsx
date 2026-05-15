'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings, Palette, Layout, Shield,
  Plus, Trash2, Eye, EyeOff, Save, Loader2,
  X, ChevronDown, ChevronUp, Building2, Globe,
  Mail, AlertCircle, CheckCircle2, RefreshCw, Lock,
  Upload, ImageIcon,
} from 'lucide-react';
import adminApi from '../lib/api';
import { invalidateSiteConfig } from '../../../hooks/Usesiteconfig';
import type { NavPage, SiteConfig } from '../../../hooks/Usesiteconfig';

/* ─── Styles ──────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', background: '#1a2235', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#fff',
  outline: 'none', fontFamily: 'inherit', WebkitTextFillColor: '#fff',
  boxSizing: 'border-box', transition: 'border-color .2s',
};
const fg = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const br = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'rgba(255,255,255,.1)');

function Lbl({ t }: { t: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{t}</div>;
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#111826', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px 22px', ...style }}>{children}</div>;
}
function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.07)', ...style }}>{children}</div>;
}
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111826', border: `1px solid ${type === 'ok' ? 'rgba(52,211,153,.3)' : 'rgba(248,113,113,.3)'}`, borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 600, color: type === 'ok' ? '#34d399' : '#f87171', whiteSpace: 'nowrap', boxShadow: '0 8px 30px rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg}
    </div>
  );
}

/* ── Image upload field (Cloudinary via backend) ─────────────── */
function ImageUploadField({
  label, currentUrl, uploadEndpoint, onUploaded, hint,
}: {
  label: string;
  currentUrl: string;
  uploadEndpoint: string;       // e.g. '/admin/settings/branding/logo'
  onUploaded: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err,       setErr]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErr('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await adminApi.post(uploadEndpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data?.data ?? res.data;
      // Service returns full SiteConfig — grab the relevant url
      const url: string = d.logoUrl || d.faviconUrl || '';
      onUploaded(url);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Lbl t={label} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Preview box */}
        <div style={{ width: 72, height: 72, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {currentUrl ? (
            <img
              src={currentUrl}
              alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
              onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            />
          ) : (
            <ImageIcon size={24} color="rgba(255,255,255,.2)" />
          )}
        </div>

        {/* Upload controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 9, padding: '9px 16px', fontSize: 12, fontWeight: 700, color: '#f59e0b', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? .6 : 1 }}
          >
            {uploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />}
            {uploading ? 'Uploading to Cloudinary…' : 'Upload Image'}
          </button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>
            {hint ?? 'PNG, JPG, SVG, ICO · Max 5MB · Stored on Cloudinary'}
          </div>
          {err && <div style={{ fontSize: 11, color: '#f87171' }}>{err}</div>}
          {currentUrl && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 300 }}>{currentUrl}</div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.ico,.svg"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — BRANDING
   NO primary color field (removed per request)
═══════════════════════════════════════════════════════════════ */
function BrandingTab({ cfg, onSaved }: { cfg: SiteConfig; onSaved: (c: SiteConfig) => void }) {
  const [form, setForm] = useState({
    bankName:            cfg.bankName            || '',
    bankTagline:         cfg.bankTagline         || '',
    supportEmail:        cfg.supportEmail        || '',
    supportPhone:        cfg.supportPhone        || '',
    headquartersAddress: cfg.headquartersAddress || '',
    fdicNotice:          cfg.fdicNotice          || '',
    copyrightText:       cfg.copyrightText       || '',
  });
  const [logoUrl,    setLogoUrl]    = useState(cfg.logoUrl    || '');
  const [faviconUrl, setFaviconUrl] = useState(cfg.faviconUrl || '');
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await adminApi.put('/admin/settings/branding', form);
      const updated: SiteConfig = res.data?.data ?? res.data;
      onSaved(updated);
      invalidateSiteConfig(); // push update to landing page + sidebar
    } catch (e: any) { setErr(e?.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const field = (label: string, key: keyof typeof form, placeholder = '', textarea = false) => (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Lbl t={label} />
      {textarea ? (
        <textarea value={form[key]} onChange={set(key)} placeholder={placeholder} rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} onFocus={fg} onBlur={br} />
      ) : (
        <input value={form[key]} onChange={set(key)} placeholder={placeholder} style={inp} onFocus={fg} onBlur={br} />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {err && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px' }}>
          <AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span>
        </div>
      )}

      {/* Logo & Favicon — uploaded to Cloudinary */}
      <Card>
        <SectionTitle><ImageIcon size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Logo & Favicon</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <ImageUploadField
            label="Bank Logo"
            currentUrl={logoUrl}
            uploadEndpoint="/admin/settings/branding/logo"
            hint="Displayed in navbar and footer · PNG/SVG recommended"
            onUploaded={url => {
              setLogoUrl(url);
              // Also patch the local cfg so preview updates instantly
              onSaved({ ...cfg, logoUrl: url });
              invalidateSiteConfig();
            }}
          />
          <ImageUploadField
            label="Favicon"
            currentUrl={faviconUrl}
            uploadEndpoint="/admin/settings/branding/favicon"
            hint="Shown in browser tab · ICO or 32×32 PNG"
            onUploaded={url => {
              setFaviconUrl(url);
              onSaved({ ...cfg, faviconUrl: url });
              invalidateSiteConfig();
            }}
          />
        </div>
      </Card>

      {/* Bank identity */}
      <Card>
        <SectionTitle><Building2 size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Bank Identity</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {field('Bank Name',  'bankName',   'e.g. NexaBank')}
          {field('Tagline',    'bankTagline','e.g. Banking for the future')}
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <SectionTitle><Mail size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Contact & Support</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {field('Support Email',        'supportEmail',        'support@nexabank.com')}
          {field('Support Phone',        'supportPhone',        '+1 (800) 000-0000')}
          {field('Headquarters Address', 'headquartersAddress', '123 Main St, New York, NY')}
        </div>
      </Card>

      {/* Legal */}
      <Card>
        <SectionTitle><Globe size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Legal & Footer Text</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {field('FDIC Notice',    'fdicNotice',    'Your deposits are FDIC insured up to $250,000.', true)}
          {field('Copyright Text', 'copyrightText', `© ${new Date().getFullYear()} NexaBank. All rights reserved.`)}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: 11, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
          Save Branding
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — PAGES
═══════════════════════════════════════════════════════════════ */
function PagesTab({ cfg, onSaved }: { cfg: SiteConfig; onSaved: (c: SiteConfig) => void }) {
  const [pages,    setPages]    = useState<NavPage[]>([...cfg.pages].sort((a, b) => a.order - b.order));
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPage,  setNewPage]  = useState({ label: '', path: '', icon: '', description: '' });
  const [err,      setErr]      = useState('');

  const toggle = (key: string) =>
    setPages(ps => ps.map(p => p.key === key ? { ...p, visible: !p.visible } : p));

  const saveAll = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await adminApi.put('/admin/settings/pages/bulk', { pages });
      const updated: SiteConfig = res.data?.data ?? res.data;
      onSaved(updated);
      setPages([...(updated.pages ?? [])].sort((a, b) => a.order - b.order));
      invalidateSiteConfig(); // sidebar hides/shows pages immediately
    } catch (e: any) { setErr(e?.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const createPage = async () => {
    if (!newPage.label || !newPage.path) { setErr('Label and path are required'); return; }
    setErr('');
    setLoading(true);
    try {
      const res = await adminApi.post('/admin/settings/pages/custom', newPage);
      const updated: SiteConfig = res.data?.data ?? res.data;
      onSaved(updated);
      setPages([...(updated.pages ?? [])].sort((a, b) => a.order - b.order));
      setNewPage({ label: '', path: '', icon: '', description: '' });
      setCreating(false);
      invalidateSiteConfig();
    } catch (e: any) { setErr(e?.response?.data?.message || 'Failed to create page'); }
    finally { setLoading(false); }
  };

  const deletePage = async (key: string) => {
    if (!confirm('Delete this custom page?')) return;
    setLoading(true);
    try {
      const res = await adminApi.delete(`/admin/settings/pages/custom/${key}`);
      const updated: SiteConfig = res.data?.data ?? res.data;
      onSaved(updated);
      setPages([...(updated.pages ?? [])].sort((a, b) => a.order - b.order));
      invalidateSiteConfig();
    } catch (e: any) { setErr(e?.response?.data?.message || 'Failed to delete'); }
    finally { setLoading(false); }
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const p = [...pages];
    [p[i - 1], p[i]] = [p[i], p[i - 1]];
    p.forEach((x, idx) => { x.order = idx; });
    setPages([...p]);
  };
  const moveDown = (i: number) => {
    if (i === pages.length - 1) return;
    const p = [...pages];
    [p[i], p[i + 1]] = [p[i + 1], p[i]];
    p.forEach((x, idx) => { x.order = idx; });
    setPages([...p]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {err && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px' }}>
          <AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span>
        </div>
      )}

      <div style={{ background: 'rgba(96,165,250,.07)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 10, padding: '11px 14px', fontSize: 12, color: 'rgba(96,165,250,.9)', lineHeight: 1.6 }}>
        💡 Turning a page <strong>Off</strong> hides it from the sidebar AND redirects the user if they try to visit that URL directly. Changes apply immediately after saving.
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <SectionTitle style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            <Layout size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Navigation Pages
          </SectionTitle>
          <button onClick={() => setCreating(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 700, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> New Page
          </button>
        </div>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 16 }} />

        {/* Create form */}
        {creating && (
          <div style={{ background: 'rgba(245,158,11,.05)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Create Custom Page</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Page Name" />
                <input value={newPage.label} onChange={e => setNewPage(p => ({ ...p, label: e.target.value }))} placeholder="e.g. About Us" style={inp} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="URL Path" />
                <input value={newPage.path} onChange={e => setNewPage(p => ({ ...p, path: e.target.value }))} placeholder="e.g. /dashboard/about" style={{ ...inp, fontFamily: 'monospace' }} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Icon (lucide name or emoji)" />
                <input value={newPage.icon} onChange={e => setNewPage(p => ({ ...p, icon: e.target.value }))} placeholder="e.g. Star or 📋" style={inp} onFocus={fg} onBlur={br} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Lbl t="Description" />
                <input value={newPage.description} onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))} placeholder="Short subtitle" style={inp} onFocus={fg} onBlur={br} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreating(false)} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 9, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={createPage} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} Create
              </button>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px 80px 40px', gap: 10, padding: '6px 12px', marginBottom: 4 }}>
          {['', 'Page', 'Path', 'Visible', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
          ))}
        </div>

        {/* Page rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pages.map((page: NavPage, i: number) => (
            <div key={page.key} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 180px 80px 40px', gap: 10, alignItems: 'center', padding: '10px 12px', background: page.visible ? 'rgba(52,211,153,.03)' : 'rgba(255,255,255,.02)', borderRadius: 10, border: `1px solid ${page.visible ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)'}` }}>
              {/* Reorder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.4)', padding: 0, display: 'flex' }}><ChevronUp size={13} /></button>
                <button onClick={() => moveDown(i)} disabled={i === pages.length - 1} style={{ background: 'none', border: 'none', cursor: i === pages.length - 1 ? 'not-allowed' : 'pointer', color: i === pages.length - 1 ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.4)', padding: 0, display: 'flex' }}><ChevronDown size={13} /></button>
              </div>
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: page.visible ? '#fff' : 'rgba(255,255,255,.3)' }}>{page.label}</span>
                {page.isCustom && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(167,139,250,.15)', color: '#a78bfa', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' }}>Custom</span>}
                {!page.visible && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(248,113,113,.12)', color: '#f87171', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' }}>Hidden</span>}
              </div>
              {/* Path */}
              <code style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', background: 'rgba(255,255,255,.04)', padding: '3px 7px', borderRadius: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{page.path}</code>
              {/* Toggle */}
              <button onClick={() => toggle(page.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: page.visible ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)', border: `1px solid ${page.visible ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: page.visible ? '#34d399' : '#f87171', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {page.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                {page.visible ? 'On' : 'Off'}
              </button>
              {/* Delete (custom only) */}
              <div>{page.isCustom && (
                <button onClick={() => deletePage(page.key)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 7, color: '#f87171', cursor: 'pointer' }}>
                  <Trash2 size={12} />
                </button>
              )}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={saveAll} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: 11, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
          Save Pages
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — SECURITY
═══════════════════════════════════════════════════════════════ */
function SecurityTab() {
  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [show,    setShow]    = useState({ cur: false, nw: false, cf: false });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErr(''); setOk('');
    if (form.newPassword !== form.confirm) { setErr('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await adminApi.put('/admin/settings/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setOk('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e: any) { setErr(e?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const pwField = (label: string, key: keyof typeof form, showKey: keyof typeof show) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Lbl t={label} />
      <div style={{ position: 'relative' }}>
        <input type={show[showKey] ? 'text' : 'password'} value={form[key]} onChange={set(key)}
          placeholder="••••••••" style={{ ...inp, paddingRight: 40 }} onFocus={fg} onBlur={br} />
        <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', cursor: 'pointer', padding: 0 }}>
          {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
      <Card>
        <SectionTitle><Lock size={13} style={{ marginRight: 7, verticalAlign: 'middle' }} />Change Admin Password</SectionTitle>
        {err && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.09)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}><AlertCircle size={13} color="#f87171" /><span style={{ fontSize: 13, color: '#fca5a5' }}>{err}</span></div>}
        {ok  && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,.09)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}><CheckCircle2 size={13} color="#34d399" /><span style={{ fontSize: 13, color: '#6ee7b7' }}>{ok}</span></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pwField('Current Password',     'currentPassword', 'cur')}
          {pwField('New Password',         'newPassword',     'nw')}
          {pwField('Confirm New Password', 'confirm',         'cf')}
          <div style={{ background: 'rgba(96,165,250,.07)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: 'rgba(96,165,250,.8)', lineHeight: 1.6 }}>
            🔒 Minimum 8 characters. Takes effect immediately on next login.
          </div>
          <button onClick={save} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={15} />}
            Update Password
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'branding', label: 'Branding', Icon: Palette },
  { id: 'pages',    label: 'Pages',    Icon: Layout  },
  { id: 'security', label: 'Security', Icon: Shield  },
];

export default function AdminSettingsPage() {
  const [mounted,  setMounted]  = useState(false);
  const [tab,      setTab]      = useState('branding');
  const [cfg,      setCfg]      = useState<SiteConfig | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/settings');
      setCfg(res.data?.data ?? res.data);
    } catch { showToast('Failed to load settings', 'err'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted]); // eslint-disable-line

  const onSaved = (updated: SiteConfig) => {
    setCfg(updated);
    showToast('Settings saved', 'ok');
  };

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-.4px' }}>Site Settings</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.38)', margin: 0 }}>Control branding, page visibility, and admin security</p>
        </div>
        <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, color: 'rgba(255,255,255,.55)', cursor: 'pointer' }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#f59e0b' : 'transparent'}`, padding: '10px 16px', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#f59e0b' : 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', marginBottom: -1 }}>
              <Icon size={13} /> {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          <Loader2 size={22} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading settings…
        </div>
      ) : !cfg ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 10 }}>
          <Settings size={36} color="rgba(255,255,255,.1)" />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', margin: 0 }}>Could not load settings</p>
        </div>
      ) : (
        <>
          {tab === 'branding' && <BrandingTab cfg={cfg} onSaved={onSaved} />}
          {tab === 'pages'    && <PagesTab    cfg={cfg} onSaved={onSaved} />}
          {tab === 'security' && <SecurityTab />}
        </>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <style>{`
        *,*::before,*::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}