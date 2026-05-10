'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck, Upload, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, ChevronRight, User, CreditCard,
  Home, Camera, Loader2, RefreshCw, Eye, ChevronLeft, X,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { KYC_DOCUMENT_TYPES } from '../../lib/constants';
import { getStatusColor, formatDate } from '../../lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────
// Matches backend Kyc schema enum exactly: not_started | pending | approved | rejected | resubmit
type KYCStatusValue = 'not_started' | 'pending' | 'approved' | 'rejected' | 'resubmit';

interface KYCStatus {
  status:           KYCStatusValue;
  createdAt?:       string;   // timestamps: true → use createdAt as submittedAt
  reviewedAt?:      Date | string;
  documentType?:    string;
  rejectionNote?:   string;   // backend field name from schema
  documentNumber?:  string;
  identityVerified?:  boolean;
  documentVerified?:  boolean;
  addressVerified?:   boolean;
}

type DocType = typeof KYC_DOCUMENT_TYPES[number]['value'];

const STEPS = [
  { id: 1, label: 'Personal',  icon: User       },
  { id: 2, label: 'Documents', icon: CreditCard  },
  { id: 3, label: 'Address',   icon: Home        },
  { id: 4, label: 'Selfie',    icon: Camera      },
] as const;

// ─── File Drop Zone ─────────────────────────────────────────────────────────
function FileDropZone({
  label, subLabel, accept, file, onChange, icon: Icon = Upload,
}: {
  label: string; subLabel?: string; accept: string;
  file: File | null; onChange: (f: File) => void;
  icon?: React.ElementType;
}) {
  const ref  = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handle = (f: File | null | undefined) => { if (f) onChange(f); };

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      className="dropzone"
      style={{
        borderColor: drag ? '#f59e0b' : file ? 'rgba(52,211,153,.45)' : 'rgba(255,255,255,.1)',
        background:  drag ? 'rgba(245,158,11,.07)' : file ? 'rgba(52,211,153,.04)' : 'rgba(255,255,255,.02)',
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display:'none' }}
        onChange={e => handle(e.target.files?.[0])} />
      {preview && (
        <img src={preview} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.35, borderRadius:10 }} />
      )}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        {file ? (
          <>
            <CheckCircle2 size={26} color="#34d399" />
            <span style={{ fontSize:12, fontWeight:700, color:'#34d399', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.name}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{(file.size/1024).toFixed(1)} KB · Click to replace</span>
          </>
        ) : (
          <>
            <Icon size={26} color="rgba(255,255,255,.25)" />
            <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.55)' }}>{label}</span>
            {subLabel && <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{subLabel}</span>}
          </>
        )}
      </div>
      <style>{`.dropzone{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;height:130px;border:2px dashed;border-radius:12px;cursor:pointer;transition:all .2s;text-align:center;padding:12px}`}</style>
    </div>
  );
}

// ─── Step Bar ────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', marginBottom:28 }}>
      {STEPS.map((s, i) => {
        const Icon   = s.icon;
        const done   = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{
                width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                border: `2px solid ${done ? '#34d399' : active ? '#f59e0b' : 'rgba(255,255,255,.12)'}`,
                background: done ? '#34d399' : active ? '#f59e0b' : 'rgba(255,255,255,.03)',
                transition:'all .3s',
              }}>
                {done
                  ? <CheckCircle2 size={15} color="#050d1a" />
                  : <Icon size={14} color={active ? '#050d1a' : 'rgba(255,255,255,.35)'} />}
              </div>
              <span style={{ fontSize:10, fontWeight:600, color: active ? '#f59e0b' : done ? '#34d399' : 'rgba(255,255,255,.3)', whiteSpace:'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex:1, height:2, margin:'0 6px', marginTop:-16,
                background: current > s.id ? '#34d399' : 'rgba(255,255,255,.08)',
                borderRadius:2, transition:'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status Banner ───────────────────────────────────────────────────────────
type BannerCfg = { bg: string; border: string; icon: React.ElementType; iconColor: string; title: string; sub: string };

function StatusBanner({ kyc, onRefresh }: { kyc: KYCStatus; onRefresh: () => void }) {
  const BANNER_CFG: Partial<Record<KYCStatusValue, BannerCfg>> = {
    approved:  { bg:'rgba(52,211,153,.08)', border:'rgba(52,211,153,.25)', icon: ShieldCheck, iconColor:'#34d399', title:'Identity Verified',      sub:'Your account is fully verified. You have access to all NexaBank features.' },
    pending:   { bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.25)', icon: Clock,        iconColor:'#f59e0b', title:'Under Review',            sub:'Your documents are being reviewed. This typically takes  1-3 business days.' },
    rejected:  { bg:'rgba(239,68,68,.08)',  border:'rgba(239,68,68,.25)',  icon: XCircle,      iconColor:'#f87171', title:'Verification Rejected',   sub: kyc.rejectionNote || 'Your submission was rejected. Please re-submit with clearer documents.' },
    resubmit:  { bg:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.25)', icon: AlertCircle,  iconColor:'#f59e0b', title:'Resubmission Required',   sub: kyc.rejectionNote || 'Please upload clearer document images and resubmit.' },
  };

  const cfg = BANNER_CFG[kyc.status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:16, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
      <div style={{ width:42, height:42, borderRadius:'50%', background:`${cfg.iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={20} color={cfg.iconColor} />
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:700, color:'#fff', fontSize:14, margin:'0 0 3px' }}>{cfg.title}</p>
        <p style={{ color:'rgba(255,255,255,.45)', fontSize:13, margin:0 }}>{cfg.sub}</p>
      </div>
      {kyc.status === 'pending' && (
        <button onClick={onRefresh} style={{ background:'none', border:'none', color:'rgba(255,255,255,.35)', cursor:'pointer', padding:4 }}>
          <RefreshCw size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function KYCPage() {
  const [kyc,        setKyc]        = useState<KYCStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step,       setStep]       = useState(1);
  const [mounted,    setMounted]    = useState(false);

  // Form
  const [personal, setPersonal] = useState({ firstName:'', lastName:'', dob:'', nationality:'', documentNumber:'' });
  const [docType,  setDocType]  = useState<DocType>('national_id');
  const [files,    setFiles]    = useState<{ idFront:File|null; idBack:File|null; addressProof:File|null; selfie:File|null }>({
    idFront:null, idBack:null, addressProof:null, selfie:null,
  });

  useEffect(() => { setMounted(true); }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/kyc/status');
      setKyc(res.data.data || res.data);
    } catch {
      setKyc({ status: 'not_started' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSubmit = async () => {
    if (!files.idFront || !files.selfie) {
      toast.error('Front image and selfie are required.');
      return;
    }
    if (!personal.documentNumber) {
      toast.error('Document number is required.');
      return;
    }
    const fd = new FormData();
    fd.append('documentType',   docType);
    fd.append('documentNumber', personal.documentNumber);
    if (personal.dob) fd.append('expiryDate', personal.dob);
    if (files.idFront)  fd.append('front',  files.idFront);
    if (files.idBack)   fd.append('back',   files.idBack!);
    if (files.selfie)   fd.append('selfie', files.selfie);

    setSubmitting(true);
    try {
      await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('KYC submitted! We\'ll review within 1-3 business days.');
      fetchStatus();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return <div style={{ minHeight:'100vh', background:'#0a0f1a' }} />;

  const status    = kyc?.status ?? 'not_started';
  // Backend returns 'not_started' (no record yet) or 'resubmit' — both allow form submission
  const canSubmit = status === 'not_started' || status === 'rejected' || status === 'resubmit';

  const inp = (key: keyof typeof personal, label: string, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="fld-label">{label}{required && <span style={{ color:'#f87171' }}> *</span>}</label>
      <input
        type={type} placeholder={placeholder} className="nxinput"
        value={personal[key]}
        onChange={e => setPersonal(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="title">Identity Verification</h1>
          <p className="sub">KYC · Know Your Customer</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {kyc && (
            <span className={`kbadge ${getStatusColor(status)}`}>
              {status === 'not_started' ? 'Not Started'  :
               status === 'pending'     ? 'Under Review' :
               status === 'approved'    ? 'Verified'     :
               status === 'resubmit'   ? 'Resubmit'     : 'Rejected'}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loader-row"><Loader2 size={20} className="nx-spin" /> Loading…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Status banner — shown for all states except the initial not_started */}
          {kyc && status !== 'not_started' && (
            <StatusBanner kyc={kyc} onRefresh={fetchStatus} />
          )}

          {/* Requirements info */}
          {canSubmit && (
            <div className="card">
              <div className="card-head">
                <FileText size={15} color="#f59e0b" />
                <span className="card-title">Required Documents</span>
              </div>
              <div className="req-grid">
                {[
                  { Icon:CreditCard,  title:'Government ID',   desc:'Passport, National ID, or Driver\'s License' },
                  { Icon:Camera,      title:'Selfie',           desc:'Clear, well-lit photo of your face' },
                  { Icon:Home,        title:'Address Proof',    desc:'Utility bill or bank statement (optional)' },
                  { Icon:ShieldCheck, title:'All Four Corners', desc:'Ensure full document is visible in photos' },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="req-item">
                    <Icon size={15} color="#f59e0b" style={{ flexShrink:0, marginTop:1 }} />
                    <div>
                      <p style={{ fontSize:12, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>{title}</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', margin:0 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-step form */}
          {canSubmit && (
            <div className="card">
              <StepBar current={step} />

              {/* Step 1 — Personal Info */}
              {step === 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <p className="step-title">Personal Information</p>
                  <div className="two-col">
                    {inp('firstName', 'First Name', 'text', 'John')}
                    {inp('lastName',  'Last Name',  'text', 'Doe')}
                  </div>
                  <div className="two-col">
                    {inp('nationality', 'Nationality', 'text', 'e.g. Nigerian')}
                    {inp('dob', 'Document Expiry Date', 'date', '')}
                  </div>
                  {inp('documentNumber', 'Document Number', 'text', 'e.g. A12345678', true)}
                </div>
              )}

              {/* Step 2 — ID Document */}
              {step === 2 && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <p className="step-title">Government-Issued ID</p>
                  <div>
                    <label className="fld-label">Document Type</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {KYC_DOCUMENT_TYPES.map(opt => (
                        <button key={opt.value} onClick={() => setDocType(opt.value as DocType)}
                          className="typebtn" style={{ '--acc':'#f59e0b' } as any}
                          data-active={docType === opt.value}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="two-col">
                    <div>
                      <label className="fld-label">Front <span style={{ color:'#f87171' }}>*</span></label>
                      <FileDropZone label="Upload Front" subLabel="All corners visible" accept="image/*,.pdf"
                        file={files.idFront} onChange={f => setFiles(p => ({ ...p, idFront:f }))} icon={CreditCard}/>
                    </div>
                    <div>
                      <label className="fld-label">Back</label>
                      <FileDropZone label="Upload Back" subLabel="If applicable" accept="image/*,.pdf"
                        file={files.idBack} onChange={f => setFiles(p => ({ ...p, idBack:f }))} icon={CreditCard}/>
                    </div>
                  </div>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', margin:0 }}>
                    Ensure all four corners are visible and text is clearly legible.
                  </p>
                </div>
              )}

              {/* Step 3 — Address Proof */}
              {step === 3 && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <p className="step-title">Proof of Address <span style={{ color:'rgba(255,255,255,.3)', fontWeight:400 }}>(Optional)</span></p>
                  <FileDropZone label="Utility Bill or Bank Statement" subLabel="JPG, PNG, or PDF · Max 10MB"
                    accept="image/*,.pdf" file={files.addressProof}
                    onChange={f => setFiles(p => ({ ...p, addressProof:f }))} icon={Home}/>
                  <div className="info-box">
                    <p style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.55)', margin:'0 0 6px' }}>Accepted Documents</p>
                    {['Electricity or water bill (within 3 months)', 'Bank or credit card statement', 'Government-issued letter with address'].map(i => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                        <div style={{ width:4, height:4, borderRadius:'50%', background:'#f59e0b', flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,.35)' }}>{i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 — Selfie */}
              {step === 4 && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <p className="step-title">Selfie Verification</p>
                  <FileDropZone label="Upload a Clear Selfie" subLabel="Face must be clearly visible · JPG or PNG"
                    accept="image/*" file={files.selfie}
                    onChange={f => setFiles(p => ({ ...p, selfie:f }))} icon={Camera}/>
                  <div className="two-col" style={{ gap:8 }}>
                    {[
                      { ok:true,  text:'Face clearly visible'     },
                      { ok:true,  text:'Good, even lighting'       },
                      { ok:false, text:'No sunglasses or hats'     },
                      { ok:false, text:'No filters or edits'       },
                    ].map(({ ok, text }) => (
                      <div key={text} style={{ display:'flex', alignItems:'center', gap:7 }}>
                        {ok
                          ? <CheckCircle2 size={13} color="#34d399" />
                          : <X size={13} color="#f87171" />}
                        <span style={{ fontSize:12, color:'rgba(255,255,255,.45)' }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,.07)' }}>
                <button
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:600, color:'rgba(255,255,255,.5)', cursor:step===1?'not-allowed':'pointer', opacity:step===1?.3:1, fontFamily:'inherit' }}>
                  <ChevronLeft size={14} /> Back
                </button>

                {step < 4 ? (
                  <button onClick={() => setStep(s => s + 1)} className="subbtn">
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="subbtn" style={{ opacity:submitting?.6:1 }}>
                    {submitting ? <><Loader2 size={15} className="nx-spin"/>Submitting…</> : <><ShieldCheck size={15}/>Submit KYC</>}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Previous submission detail — only when a KYC record exists */}
          {kyc?.createdAt && (
            <div className="card">
              <div className="card-head">
                <Eye size={15} color="#f59e0b" />
                <span className="card-title">Submission Details</span>
              </div>
              <div className="detail-grid">
                {[
                  { label:'Submitted',     value: formatDate(kyc.createdAt) },
                  { label:'Document Type', value: KYC_DOCUMENT_TYPES.find(d => d.value === kyc.documentType)?.label ?? kyc.documentType ?? '—' },
                  { label:'Reviewed',      value: kyc.reviewedAt ? formatDate(String(kyc.reviewedAt)) : 'Pending' },
                  { label:'Review Note',   value: kyc.rejectionNote || 'None' },
                ].map(({ label, value }) => (
                  <div key={label} className="detail-item">
                    <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', margin:'0 0 4px' }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:600, color:'#fff', margin:0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        *{box-sizing:border-box}
        .pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:28px 20px}
        @media(min-width:640px){.pg{padding:32px 28px}}
        @media(min-width:1024px){.pg{padding:36px 40px;max-width:780px}}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:12px;flex-wrap:wrap}
        .title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0}
        @media(min-width:640px){.title{font-size:26px}}
        .sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0}
        .kbadge{font-size:11px;font-weight:700;padding:4px 11px;border-radius:100px;letter-spacing:.04em}
        .loader-row{display:flex;align-items:center;justify-content:center;gap:10px;padding:80px;color:rgba(255,255,255,.35);font-size:14px}
        .card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:22px}
        .card-head{display:flex;align-items:center;gap:8px;margin-bottom:16px}
        .card-title{font-size:14px;font-weight:700;color:#fff}
        .step-title{font-size:15px;font-weight:800;color:#fff;margin:0 0 4px}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:480px){.two-col{grid-template-columns:1fr}}
        .fld-label{display:block;font-size:12px;color:rgba(255,255,255,.4);font-weight:500;margin-bottom:6px}
        .nxinput{width:100%;background:#1e2940;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 13px;font-size:14px;color:#fff;outline:none;font-family:inherit;transition:border-color .2s;-webkit-text-fill-color:#fff}
        .nxinput::placeholder{color:rgba(255,255,255,.25)}
        .nxinput:focus{border-color:rgba(245,158,11,.5)}
        .typebtn{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;color:rgba(255,255,255,.5);cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap}
        .typebtn[data-active="true"]{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.45);color:#f59e0b}
        .info-box{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px}
        .req-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:480px){.req-grid{grid-template-columns:1fr}}
        .req-item{display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:11px 13px}
        .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:480px){.detail-grid{grid-template-columns:1fr}}
        .detail-item{background:rgba(255,255,255,.02);border-radius:10px;padding:12px}
        .subbtn{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
        .subbtn:disabled{cursor:not-allowed}
        @keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}
      `}</style>
    </div>
  );
}