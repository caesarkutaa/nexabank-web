'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, X, CheckCircle2, Clock, XCircle, Eye,
  FileText, Shield, ShieldCheck, ShieldX, ShieldAlert,
  Calendar, Mail, Phone, Hash, RotateCcw,
  ImageIcon, ZoomIn,
} from 'lucide-react';
import adminApi from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface KycRecord {
  _id: string;
  status: 'pending' | 'approved' | 'rejected' | 'resubmit' | 'not_started';
  documentType?: string;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  identityVerified?: boolean;
  documentVerified?: boolean;
  addressVerified?: boolean;
  reviewedAt?: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
  userId: {
    _id: string; username: string; email: string;
    firstName: string; lastName: string; phoneNumber?: string;
  };
}
interface Pagination { total: number; page: number; limit: number; pages: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const ini = (a?: string, b?: string) => `${a?.[0]??''}${b?.[0]??''}`.toUpperCase() || 'U';

const STATUS_CFG = {
  pending:     { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', Icon: Clock,       label: 'Pending'     },
  approved:    { bg: 'rgba(52,211,153,.12)', color: '#34d399', Icon: ShieldCheck, label: 'Approved'    },
  rejected:    { bg: 'rgba(239,68,68,.12)',  color: '#f87171', Icon: ShieldX,     label: 'Rejected'    },
  resubmit:    { bg: 'rgba(96,165,250,.12)', color: '#60a5fa', Icon: RotateCcw,   label: 'Resubmit'    },
  not_started: { bg: 'rgba(255,255,255,.06)',color: 'rgba(255,255,255,.3)', Icon: Shield, label: 'Not Started' },
} as const;
type SK = keyof typeof STATUS_CFG;

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as SK] ?? STATUS_CFG.not_started;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:c.bg,color:c.color,fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:100,whiteSpace:'nowrap' }}>
      <c.Icon size={11}/> {c.label}
    </span>
  );
}

const inp: React.CSSProperties = {
  width:'100%',background:'#1a2235',border:'1px solid rgba(255,255,255,.1)',
  borderRadius:10,padding:'10px 13px',fontSize:13,color:'#fff',
  outline:'none',fontFamily:'inherit',WebkitTextFillColor:'#fff',
  boxSizing:'border-box',transition:'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(245,158,11,.5)');
const bl = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'rgba(255,255,255,.1)');
const Lbl = ({ t }: { t: string }) => (
  <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.06em'}}>{t}</label>
);

// ─── Doc Image ────────────────────────────────────────────────────────────────
function DocImage({ url, label }: { url?: string; label: string }) {
  const [z, setZ] = useState(false);
  if (!url) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.03)',border:'1px dashed rgba(255,255,255,.1)',borderRadius:12,padding:'28px 16px',gap:8}}>
      <ImageIcon size={22} color="rgba(255,255,255,.15)"/>
      <span style={{fontSize:11,color:'rgba(255,255,255,.2)',fontWeight:600}}>{label}</span>
      <span style={{fontSize:10,color:'rgba(255,255,255,.12)'}}>Not uploaded</span>
    </div>
  );
  return (
    <>
      <div style={{position:'relative',borderRadius:12,overflow:'hidden',background:'#0a0f1a',border:'1px solid rgba(255,255,255,.1)'}}>
        <div style={{position:'absolute',top:8,left:8,zIndex:2,background:'rgba(0,0,0,.65)',borderRadius:6,padding:'3px 8px',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.7)'}}>{label}</div>
        <button onClick={()=>setZ(true)} style={{position:'absolute',top:8,right:8,zIndex:2,background:'rgba(0,0,0,.65)',border:'none',borderRadius:6,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff'}}><ZoomIn size={13}/></button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} style={{width:'100%',height:150,objectFit:'cover',display:'block'}}/>
      </div>
      {z && (
        <div onClick={()=>setZ(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16,cursor:'zoom-out'}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:12,objectFit:'contain',boxShadow:'0 20px 60px rgba(0,0,0,.8)'}}/>
        </div>
      )}
    </>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ kyc, onClose, onDone }: { kyc: KycRecord; onClose: () => void; onDone: () => void }) {
  const [decision, setDecision] = useState<'approved'|'rejected'|'resubmit'>('approved');
  const [notes,    setNotes]    = useState(kyc.rejectionNote || '');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [ok,       setOk]       = useState('');

  const submit = async () => {
    setErr(''); setOk('');
    if ((decision === 'rejected' || decision === 'resubmit') && !notes.trim())
      return setErr('Please provide a reason for this decision.');
    setLoading(true);
    try {
      await adminApi.post(`/admin/kyc/${kyc._id}/review`, { decision, notes: notes.trim() || undefined });
      setOk(`KYC ${decision} successfully`);
      setTimeout(() => { onDone(); onClose(); }, 1100);
    } catch (e: any) { setErr(e.response?.data?.message || 'Review failed'); }
    finally { setLoading(false); }
  };

  const DECISIONS = [
    { id:'approved' as const, label:'Approve',           color:'#34d399', bg:'rgba(52,211,153,.12)',  Icon:ShieldCheck, desc:'Documents verified, identity confirmed'      },
    { id:'rejected' as const, label:'Reject',            color:'#f87171', bg:'rgba(239,68,68,.12)',   Icon:ShieldX,     desc:'Identity mismatch or invalid documents'      },
    { id:'resubmit' as const, label:'Request Resubmit',  color:'#60a5fa', bg:'rgba(96,165,250,.12)',  Icon:RotateCcw,   desc:'Ask user to upload clearer documents'         },
  ];

  const full = `${kyc.userId?.firstName} ${kyc.userId?.lastName}`;
  const btnBg = decision === 'approved' ? 'linear-gradient(135deg,#34d399,#059669)' : decision === 'rejected' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)';

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(8px)',zIndex:9100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:'#0f1623',border:'1px solid rgba(255,255,255,.09)',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:900,maxHeight:'94vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 3px'}}>KYC Review</h3>
            <p style={{fontSize:12,color:'rgba(255,255,255,.35)',margin:0}}>{full} · @{kyc.userId?.username} · {fmtDate(kyc.createdAt)}</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.4)',cursor:'pointer',flexShrink:0}}><X size={16}/></button>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:18}}>
          {err && <div style={{display:'flex',alignItems:'flex-start',gap:9,background:'rgba(239,68,68,.09)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'11px 13px'}}><AlertCircle size={14} color="#f87171" style={{flexShrink:0,marginTop:1}}/><span style={{fontSize:13,color:'#fca5a5',lineHeight:1.5}}>{err}</span></div>}
          {ok  && <div style={{display:'flex',alignItems:'center',gap:9,background:'rgba(52,211,153,.09)',border:'1px solid rgba(52,211,153,.2)',borderRadius:10,padding:'11px 13px'}}><CheckCircle2 size={14} color="#34d399"/><span style={{fontSize:13,color:'#6ee7b7'}}>{ok}</span></div>}

          {/* Two column grid — stacks on small screens */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18}}>

            {/* LEFT: user info + docs */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* User info card */}
              <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:15}}>
                <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:13}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#050d1a',flexShrink:0}}>{ini(kyc.userId?.firstName,kyc.userId?.lastName)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{full}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:1}}>@{kyc.userId?.username}</div>
                  </div>
                  <StatusPill status={kyc.status}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    {Icon:Mail,    label:'Email',    val:kyc.userId?.email},
                    {Icon:Phone,   label:'Phone',    val:kyc.userId?.phoneNumber||'—'},
                    {Icon:FileText,label:'Doc Type', val:kyc.documentType?.replace(/_/g,' ')||'—'},
                    {Icon:Hash,    label:'Doc No.',  val:kyc.documentNumber||'—'},
                    {Icon:Calendar,label:'Submitted',val:fmtDate(kyc.createdAt)},
                    {Icon:Calendar,label:'Reviewed', val:fmtDate(kyc.reviewedAt)},
                  ].map(({Icon,label,val})=>(
                    <div key={label} style={{background:'rgba(255,255,255,.03)',borderRadius:8,padding:'8px 10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}><Icon size={10} color="rgba(255,255,255,.3)"/><span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span></div>
                      <div style={{fontSize:12,fontWeight:600,color:'#fff',wordBreak:'break-all',lineHeight:1.3}}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:7,marginTop:11,flexWrap:'wrap'}}>
                  {[{label:'Identity',ok:kyc.identityVerified},{label:'Document',ok:kyc.documentVerified},{label:'Address',ok:kyc.addressVerified}].map(({label,ok:v})=>(
                    <span key={label} style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:100,background:v?'rgba(52,211,153,.1)':'rgba(255,255,255,.05)',color:v?'#34d399':'rgba(255,255,255,.3)',border:`1px solid ${v?'rgba(52,211,153,.25)':'rgba(255,255,255,.08)'}`}}>
                      {v?<CheckCircle2 size={10}/>:<XCircle size={10}/>} {label}
                    </span>
                  ))}
                </div>
                {kyc.rejectionNote && (
                  <div style={{marginTop:11,background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.18)',borderRadius:9,padding:'9px 11px'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#f87171',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3}}>Previous Note</div>
                    <div style={{fontSize:12,color:'rgba(255,100,100,.8)',lineHeight:1.5}}>{kyc.rejectionNote}</div>
                  </div>
                )}
              </div>
              {/* Document images */}
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                <DocImage url={kyc.documentFrontUrl} label="Front of Document"/>
                <DocImage url={kyc.documentBackUrl}  label="Back of Document"/>
                <DocImage url={kyc.selfieUrl}         label="Selfie / Liveness"/>
              </div>
            </div>

            {/* RIGHT: decision */}
            <div style={{display:'flex',flexDirection:'column',gap:13}}>
              <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:15}}>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:11}}>Decision</div>
                <div style={{display:'flex',flexDirection:'column',gap:7}}>
                  {DECISIONS.map(({id,label,color,bg,Icon,desc})=>(
                    <button key={id} onClick={()=>{setDecision(id);setErr('');}}
                      style={{display:'flex',alignItems:'center',gap:11,background:decision===id?bg:'rgba(255,255,255,.03)',border:decision===id?`1.5px solid ${color}55`:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:'11px 13px',cursor:'pointer',textAlign:'left',fontFamily:'inherit',transition:'all .15s'}}>
                      <div style={{width:34,height:34,borderRadius:9,background:decision===id?bg:'rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Icon size={16} color={decision===id?color:'rgba(255,255,255,.3)'}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:decision===id?color:'rgba(255,255,255,.7)',marginBottom:1}}>{label}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.32)',lineHeight:1.4}}>{desc}</div>
                      </div>
                      {decision===id&&<div style={{width:18,height:18,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><CheckCircle2 size={11} color="#050d1a"/></div>}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <Lbl t={decision==='approved'?'Notes (optional)':'Reason *'}/>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={5}
                  placeholder={decision==='approved'?'Optional internal note...':decision==='rejected'?'Explain why the KYC was rejected (shown to user)...':'Tell user what documents to resubmit and why...'}
                  style={{...inp,resize:'vertical',lineHeight:1.6}} onFocus={fg} onBlur={bl}/>
                {(decision==='rejected'||decision==='resubmit')&&<p style={{fontSize:11,color:'rgba(255,255,255,.3)',margin:0}}>This message will be shown to the user in their KYC status page.</p>}
              </div>
              <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:12,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#f59e0b',marginBottom:8,textTransform:'uppercase',letterSpacing:'.05em'}}>Review Checklist</div>
                {['Name matches document exactly','Document is not expired','Image is clear and unobstructed','Selfie matches document photo','Document number is readable'].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<4?5:0}}>
                    <div style={{width:16,height:16,borderRadius:4,background:'rgba(245,158,11,.15)',border:'1px solid rgba(245,158,11,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><CheckCircle2 size={10} color="#f59e0b"/></div>
                    <span style={{fontSize:12,color:'rgba(255,255,255,.45)'}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:10,padding:'13px 20px',borderTop:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:'11px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={submit} disabled={loading||!!ok}
            style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:btnBg,color:'#fff',border:'none',borderRadius:12,padding:'11px',fontSize:14,fontWeight:700,cursor:(loading||!!ok)?'not-allowed':'pointer',fontFamily:'inherit',opacity:(loading||!!ok)?.65:1,transition:'opacity .15s'}}>
            {loading?<Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>:decision==='approved'?<ShieldCheck size={15}/>:decision==='rejected'?<ShieldX size={15}/>:<RotateCcw size={15}/>}
            {decision==='approved'?'Approve KYC':decision==='rejected'?'Reject KYC':'Request Resubmission'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KYC Card (mobile / card view) ───────────────────────────────────────────
function KycCard({ kyc, onReview }: { kyc: KycRecord; onReview: (k: KycRecord) => void }) {
  const full = `${kyc.userId?.firstName??''} ${kyc.userId?.lastName??''}`.trim();
  return (
    <div style={{background:'rgba(255,255,255,.025)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,overflow:'hidden',transition:'border-color .15s'}}
      onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.13)')}
      onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)')}>
      <div style={{padding:'13px 15px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',gap:11}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#050d1a',flexShrink:0}}>{ini(kyc.userId?.firstName,kyc.userId?.lastName)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:'#fff',fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{full||'Unknown'}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{kyc.userId?.email}</div>
        </div>
        <StatusPill status={kyc.status}/>
      </div>
      <div style={{padding:'12px 15px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{label:'Doc Type',val:kyc.documentType?.replace(/_/g,' ')||'—'},{label:'Doc No.',val:kyc.documentNumber||'—'},{label:'Submitted',val:fmtDate(kyc.createdAt)},{label:'Reviewed',val:fmtDate(kyc.reviewedAt)}].map(({label,val})=>(
          <div key={label}>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.28)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:2}}>{label}</div>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.75)',wordBreak:'break-word'}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'0 15px 11px',display:'flex',gap:6,flexWrap:'wrap'}}>
        {[{label:'Front',has:!!kyc.documentFrontUrl},{label:'Back',has:!!kyc.documentBackUrl},{label:'Selfie',has:!!kyc.selfieUrl}].map(({label,has})=>(
          <span key={label} style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:100,background:has?'rgba(52,211,153,.1)':'rgba(255,255,255,.05)',color:has?'#34d399':'rgba(255,255,255,.25)',border:`1px solid ${has?'rgba(52,211,153,.2)':'rgba(255,255,255,.06)'}`}}>
            {has?'✓':'✗'} {label}
          </span>
        ))}
      </div>
      <div style={{padding:'10px 15px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <button onClick={()=>onReview(kyc)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:7,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.22)',borderRadius:10,padding:'9px',fontSize:13,fontWeight:700,color:'#f59e0b',cursor:'pointer',fontFamily:'inherit'}}>
          <Eye size={14}/> Review KYC
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminKycPage() {
  const [kycs,       setKycs]       = useState<KycRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({total:0,page:1,limit:20,pages:1});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('pending');
  const [mounted,    setMounted]    = useState(false);
  const [reviewKyc,  setReviewKyc]  = useState<KycRecord|null>(null);
  const [toast,      setToast]      = useState('');
  const [viewMode,   setViewMode]   = useState<'table'|'cards'>('table');
  const deb = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    setMounted(true);
    const check = () => setViewMode(window.innerWidth < 768 ? 'cards' : 'table');
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const load = useCallback(async (page=1, q=search, st=status) => {
    setLoading(true);
    try {
      const p: any = { page, limit: 20 };
      if (q) p.search = q; if (st) p.status = st;
      const res = await adminApi.get('/admin/kyc', { params: p });
      const d = res.data.data ?? res.data;
      setKycs(d.kycs ?? []); setPagination(d.pagination ?? {total:0,page:1,limit:20,pages:1});
    } catch {} finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  if (!mounted) return null;

  const TABS = [
    {val:'',         label:'All',      color:'rgba(255,255,255,.5)'},
    {val:'pending',  label:'Pending',  color:'#f59e0b'},
    {val:'approved', label:'Approved', color:'#34d399'},
    {val:'rejected', label:'Rejected', color:'#f87171'},
    {val:'resubmit', label:'Resubmit', color:'#60a5fa'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18,fontFamily:'Inter,system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:800,color:'#fff',margin:'0 0 4px',letterSpacing:'-.5px'}}>KYC Review</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,.38)',margin:0}}>{pagination.total.toLocaleString()} submission{pagination.total!==1?'s':''}</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {/* View mode toggle */}
          <div style={{display:'flex',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,overflow:'hidden'}}>
            {(['table','cards'] as const).map(v=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{padding:'8px 13px',fontSize:12,fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',background:viewMode===v?'rgba(245,158,11,.15)':'transparent',color:viewMode===v?'#f59e0b':'rgba(255,255,255,.4)',transition:'all .15s',textTransform:'capitalize'}}>{v}</button>
            ))}
          </div>
          <button onClick={()=>load(pagination.page)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:38,height:38,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:10,color:'rgba(255,255,255,.55)',cursor:'pointer'}}>
            <RefreshCw size={14} style={{animation:loading?'spin 1s linear infinite':'none'}}/>
          </button>
        </div>
      </div>

      {/* Status tabs — scrollable on mobile */}
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>
        {TABS.map(({val,label,color})=>(
          <button key={val} onClick={()=>{setStatus(val);load(1,search,val);}}
            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,border:status===val?`1.5px solid ${color}55`:'1px solid rgba(255,255,255,.08)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,background:status===val?`${color}18`:'rgba(255,255,255,.04)',color:status===val?color:'rgba(255,255,255,.38)',transition:'all .15s'}}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{position:'relative',maxWidth:440}}>
        <Search size={14} color="rgba(255,255,255,.25)" style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
        <input value={search} onChange={e=>{setSearch(e.target.value);if(deb.current)clearTimeout(deb.current);deb.current=setTimeout(()=>load(1,e.target.value,status),420);}}
          placeholder="Search name, email, username…" style={{...inp,paddingLeft:38}} onFocus={fg} onBlur={bl}/>
      </div>

      {/* Stats bar */}
      {!loading && kycs.length > 0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10}}>
          {(Object.entries(STATUS_CFG) as [SK, typeof STATUS_CFG[SK]][]).filter(([k])=>k!=='not_started').map(([key,cfg])=>{
            const count = kycs.filter(k=>k.status===key).length;
            return (
              <div key={key} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'11px 13px'}}>
                <div style={{fontSize:18,fontWeight:800,color:cfg.color,fontFamily:'monospace'}}>{count}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.38)',marginTop:2,fontWeight:600}}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading && kycs.length === 0 ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:10,color:'rgba(255,255,255,.3)',fontSize:13}}>
          <Loader2 size={20} color="#f59e0b" style={{animation:'spin 1s linear infinite'}}/> Loading submissions…
        </div>
      ) : kycs.length === 0 ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:260,gap:12,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16}}>
          <ShieldAlert size={40} color="rgba(255,255,255,.1)"/>
          <p style={{fontSize:14,color:'rgba(255,255,255,.3)',margin:0}}>{search?'No results for that search':status?`No ${status} submissions`:'No KYC submissions found'}</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,310px),1fr))',gap:14}}>
          {kycs.map(k=><KycCard key={k._id} kyc={k} onReview={setReviewKyc}/>)}
        </div>
      ) : (
        <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                  {['User','Document','Status','Submitted','Reviewed','Docs','Action'].map(h=>(
                    <th key={h} style={{padding:'13px 15px',textAlign:'left',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kycs.map(kyc=>{
                  const full=`${kyc.userId?.firstName??''} ${kyc.userId?.lastName??''}`.trim();
                  return (
                    <tr key={kyc._id} style={{borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .15s'}}
                      onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)')}
                      onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
                      <td style={{padding:'13px 15px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#050d1a',flexShrink:0}}>{ini(kyc.userId?.firstName,kyc.userId?.lastName)}</div>
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{full||'Unknown'}</div>
                            <div style={{fontSize:11,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{kyc.userId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'13px 15px'}}>
                        <div style={{fontWeight:600,color:'rgba(255,255,255,.8)',fontSize:12,textTransform:'capitalize'}}>{kyc.documentType?.replace(/_/g,' ')||'—'}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,.3)',fontFamily:'monospace',marginTop:1}}>{kyc.documentNumber||'—'}</div>
                      </td>
                      <td style={{padding:'13px 15px'}}><StatusPill status={kyc.status}/></td>
                      <td style={{padding:'13px 15px',color:'rgba(255,255,255,.5)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(kyc.createdAt)}</td>
                      <td style={{padding:'13px 15px',color:'rgba(255,255,255,.4)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(kyc.reviewedAt)}</td>
                      <td style={{padding:'13px 15px'}}>
                        <div style={{display:'flex',gap:5}}>
                          {[{s:'F',has:!!kyc.documentFrontUrl,t:'Front'},{s:'B',has:!!kyc.documentBackUrl,t:'Back'},{s:'S',has:!!kyc.selfieUrl,t:'Selfie'}].map(({s,has,t})=>(
                            <span key={s} title={t} style={{width:22,height:22,borderRadius:5,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,background:has?'rgba(52,211,153,.15)':'rgba(255,255,255,.06)',color:has?'#34d399':'rgba(255,255,255,.2)',border:`1px solid ${has?'rgba(52,211,153,.25)':'rgba(255,255,255,.08)'}`}}>{s}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{padding:'13px 15px'}}>
                        <button onClick={()=>setReviewKyc(kyc)} style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.22)',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,color:'#f59e0b',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                          <Eye size={12}/> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <span style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>
            {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit,pagination.total)} of {pagination.total.toLocaleString()}
          </span>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>load(pagination.page-1)} disabled={pagination.page<=1}
              style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:pagination.page<=1?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)',cursor:pagination.page<=1?'not-allowed':'pointer',fontFamily:'inherit'}}>
              <ChevronLeft size={15}/> Prev
            </button>
            {Array.from({length:Math.min(5,pagination.pages)},(_,i)=>{
              const pg=Math.max(1,Math.min(pagination.pages-4,pagination.page-2))+i;
              return <button key={pg} onClick={()=>load(pg)} style={{width:34,height:34,borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,background:pg===pagination.page?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,.05)',color:pg===pagination.page?'#050d1a':'rgba(255,255,255,.5)'}}>{pg}</button>;
            })}
            <button onClick={()=>load(pagination.page+1)} disabled={pagination.page>=pagination.pages}
              style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:pagination.page>=pagination.pages?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)',cursor:pagination.page>=pagination.pages?'not-allowed':'pointer',fontFamily:'inherit'}}>
              Next <ChevronRight size={15}/>
            </button>
          </div>
        </div>
      )}

      {reviewKyc && <ReviewModal kyc={reviewKyc} onClose={()=>setReviewKyc(null)} onDone={()=>{showToast('KYC review submitted');load(pagination.page);}}/>}

      {toast && <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#111826',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'12px 22px',fontSize:13,fontWeight:600,color:'#34d399',whiteSpace:'nowrap',boxShadow:'0 8px 30px rgba(0,0,0,.5)',zIndex:9999}}>✓ {toast}</div>}

      <style>{`
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg);}}
        select option{background:#1a2235;color:#fff;}
        textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:10px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2);}

        /* Responsive: full-width review modal on small screens */
        @media(max-width:600px){
          .kyc-modal-inner{border-radius:18px 18px 0 0 !important;}
        }
      `}</style>
    </div>
  );
}