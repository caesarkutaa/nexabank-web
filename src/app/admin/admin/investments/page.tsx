'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Search, Loader2, X,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  XCircle, Clock, Filter, Eye, BarChart3,
  DollarSign, AlertCircle, ArrowUpRight, ArrowDownLeft, Bitcoin,
} from 'lucide-react';
import adminApi from '../lib/api';

// ── Types ──────────────────────────────────────────────────────
interface StockInvestment {
  _id: string; createdAt: string; filledAt?: string;
  referenceNumber?: string; symbol: string; companyName: string;
  shares: number; buyPrice: number; currentPrice?: number;
  totalInvested: number; currentValue?: number;
  profitLoss?: number; profitLossPercent?: number;
  action: 'buy'|'sell'; orderStatus: string;
  userId?: { _id:string; username?:string; email?:string; firstName?:string; lastName?:string };
  accountId?: { _id:string; accountNumber?:string; accountType?:string };
}

interface CryptoInvestment {
  _id: string; createdAt: string; referenceNumber?: string;
  symbol: string; coinName?: string;
  amountUSD: number; cryptoAmount?: number;
  buyPrice: number; currentPrice?: number;
  currentValue?: number; profitLoss?: number; profitLossPercent?: number;
  action: 'buy'|'sell'; orderStatus: string;
  sellPrice?: number; sellAmountUSD?: number; soldAt?: string;
  userId?: { _id:string; username?:string; email?:string; firstName?:string; lastName?:string };
  accountId?: { _id:string; accountNumber?:string };
}

interface Pagination { total:number; page:number; limit:number; pages:number; }

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n?: number) => {
  try { return new Intl.NumberFormat('en-US',{ style:'currency',currency:'USD',minimumFractionDigits:2 }).format(n??0); }
  catch { return `$${(n??0).toFixed(2)}`; }
};
const fmtD = (d?: string|Date) => {
  if (!d) return '—';
  try { return new Intl.DateTimeFormat('en-US',{ month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit' }).format(new Date(d as string)); }
  catch { return String(d); }
};

// ── Styles ─────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width:'100%',background:'#1a2235',border:'1px solid rgba(255,255,255,.1)',
  borderRadius:10,padding:'10px 13px',fontSize:13,color:'#fff',
  outline:'none',fontFamily:'inherit',WebkitTextFillColor:'#fff',
  boxSizing:'border-box',transition:'border-color .2s',
};
const fg = (e: React.FocusEvent<any>) => (e.target.style.borderColor='rgba(245,158,11,.5)');
const br = (e: React.FocusEvent<any>) => (e.target.style.borderColor='rgba(255,255,255,.1)');
function Lbl({ t }: { t:string }) {
  return <label style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.05em' }}>{t}</label>;
}

// ── Status ─────────────────────────────────────────────────────
const SS: Record<string,{ bg:string;color:string;Icon:React.ElementType;label:string }> = {
  pending:   { bg:'rgba(245,158,11,.12)', color:'#f59e0b', Icon:Clock,        label:'Pending'   },
  filled:    { bg:'rgba(52,211,153,.12)', color:'#34d399', Icon:CheckCircle2, label:'Filled'    },
  cancelled: { bg:'rgba(156,163,175,.12)',color:'#9ca3af', Icon:XCircle,      label:'Cancelled' },
  failed:    { bg:'rgba(248,113,113,.12)',color:'#f87171', Icon:XCircle,      label:'Failed'    },
};
const getS = (s?: string) => SS[s??'']??SS.pending;

const COIN_COLOR: Record<string,string> = {
  BTC:'#f7931a',ETH:'#627eea',SOL:'#9945ff',BNB:'#f3ba2f',
  ADA:'#0033ad',AVAX:'#e84142',DOGE:'#c3a634',MATIC:'#8247e5',
  LTC:'#345d9d',XRP:'#00aae4',
};

// ── Stock Modal ────────────────────────────────────────────────
function StockModal({ inv, onClose, onDone }: { inv:StockInvestment; onClose:()=>void; onDone:(m:string)=>void }) {
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');

  const review = async (decision: 'approved'|'rejected') => {
    setErr(''); setLoading(true);
    try {
      await adminApi.post(`/admin/investments/${inv._id}/review`, { decision });
      onDone(decision==='approved'?'Stock order approved ✓':'Stock order rejected');
      onClose();
    } catch (e:any) { setErr(e?.response?.data?.message||'Action failed'); }
    finally { setLoading(false); }
  };

  const ss = getS(inv.orderStatus); const SIco = ss.Icon;
  const isPending = inv.orderStatus==='pending';
  const pl = inv.profitLoss??0; const plPct = inv.profitLossPercent??0;
  const hasPL = (inv.currentValue??0)>0 && inv.orderStatus==='filled';

  const rows = [
    { l:'Reference',    v:inv.referenceNumber||'—',  mono:true },
    { l:'Symbol',       v:inv.symbol||'—',            mono:true },
    { l:'Company',      v:inv.companyName||'—'                  },
    { l:'Action',       v:(inv.action??'—').toUpperCase()       },
    { l:'Shares',       v:String(inv.shares??0),      mono:true },
    { l:'Buy Price',    v:fmt(inv.buyPrice),           mono:true },
    { l:'Current Price',v:inv.currentPrice?fmt(inv.currentPrice):'—',mono:true },
    { l:'Total Invested',v:fmt(inv.totalInvested),    mono:true },
    { l:'Current Value',v:inv.currentValue?fmt(inv.currentValue):'—',mono:true },
    { l:'P&L',          v:hasPL?`${pl>=0?'+':''}${fmt(pl)} (${plPct>=0?'+':''}${plPct.toFixed(2)}%)`:'—',mono:true },
    { l:'Status',       v:ss.label                              },
    { l:'Submitted',    v:fmtD(inv.createdAt)                  },
    ...(inv.filledAt?[{ l:'Filled At', v:fmtD(inv.filledAt) }]:[]),
    ...(inv.accountId?.accountNumber?[{ l:'Account #', v:inv.accountId.accountNumber, mono:true }]:[]),
  ].filter(r=>r.v&&r.v!=='—');

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(8px)',zIndex:9100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#0f1623',border:'1px solid rgba(255,255,255,.09)',borderRadius:20,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 22px',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 2px' }}>Stock Order — {inv.symbol}</h3>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.35)',margin:0 }}>{inv.userId?.firstName??''} {inv.userId?.lastName??''} · {inv.userId?.email??''}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.4)',cursor:'pointer' }}><X size={15}/></button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:14 }}>
          {err&&<div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(239,68,68,.09)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'10px 13px' }}><AlertCircle size={13} color="#f87171"/><span style={{ fontSize:13,color:'#fca5a5' }}>{err}</span></div>}

          {/* Status banner */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:ss.bg,border:`1px solid ${ss.color}33`,borderRadius:12,padding:'14px 18px' }}>
            <div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:4 }}>Order Status</div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <SIco size={14} color={ss.color}/>
                <span style={{ fontSize:16,fontWeight:800,color:ss.color }}>{ss.label}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:4 }}>Total Invested</div>
              <div style={{ fontSize:20,fontWeight:900,color:'#fff',fontFamily:'monospace' }}>{fmt(inv.totalInvested)}</div>
            </div>
          </div>

          {/* Action + P&L */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,padding:'12px 14px' }}>
              <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginBottom:6 }}>ORDER TYPE</div>
              <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:inv.action==='buy'?'rgba(52,211,153,.15)':'rgba(248,113,113,.15)',color:inv.action==='buy'?'#34d399':'#f87171',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:100 }}>
                {inv.action==='buy'?<ArrowDownLeft size={12}/>:<ArrowUpRight size={12}/>} {(inv.action??'').toUpperCase()}
              </span>
            </div>
            {hasPL&&(
              <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,padding:'12px 14px' }}>
                <div style={{ fontSize:10,color:'rgba(255,255,255,.35)',marginBottom:6 }}>P&L</div>
                <div style={{ fontSize:14,fontWeight:700,color:pl>=0?'#34d399':'#f87171',fontFamily:'monospace' }}>
                  {pl>=0?'+':''}{fmt(pl)}
                </div>
              </div>
            )}
          </div>

          {/* Investor */}
          {inv.userId&&(
            <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 16px' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10 }}>Investor</div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:9,background:'rgba(245,158,11,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#f59e0b',flexShrink:0 }}>
                  {(inv.userId.firstName?.[0]??'U').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{inv.userId.firstName??''} {inv.userId.lastName??''}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.4)' }}>@{inv.userId.username??''} · {inv.userId.email??''}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,overflow:'hidden' }}>
            {rows.map(({ l,v,mono },i)=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',gap:12,borderBottom:i<rows.length-1?'1px solid rgba(255,255,255,.05)':'none' }}>
                <span style={{ fontSize:12,color:'rgba(255,255,255,.38)',flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:13,color:'rgba(255,255,255,.85)',textAlign:'right',fontFamily:mono?'monospace':'inherit',wordBreak:'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'14px 22px',borderTop:'1px solid rgba(255,255,255,.07)',flexShrink:0,display:'flex',flexDirection:'column',gap:10 }}>
          {isPending&&(
            <>
              <div style={{ background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'rgba(245,158,11,.8)' }}>
                ⏳ This order is waiting for admin approval. Approve to fill the order, reject to cancel and refund the user.
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>review('rejected')} disabled={loading}
                  style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:11,padding:'12px',fontSize:13,fontWeight:700,color:'#f87171',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.6:1 }}>
                  {loading?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<XCircle size={14}/>} Reject & Refund
                </button>
                <button onClick={()=>review('approved')} disabled={loading}
                  style={{ flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:7,background:'linear-gradient(135deg,#34d399,#059669)',border:'none',borderRadius:11,padding:'12px',fontSize:14,fontWeight:700,color:'#050d1a',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.6:1 }}>
                  {loading?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<CheckCircle2 size={14}/>} Approve Order
                </button>
              </div>
            </>
          )}
          <button onClick={onClose} style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:'10px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Crypto Modal ───────────────────────────────────────────────
function CryptoModal({ inv, onClose, onDone }: { inv:CryptoInvestment; onClose:()=>void; onDone:(m:string)=>void }) {
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');

  const review = async (decision: 'approved'|'rejected') => {
    setErr(''); setLoading(true);
    try {
      // Use the dedicated crypto review endpoint
      await adminApi.post(`/admin/crypto/invest/${inv._id}/review`, { decision });
      onDone(decision==='approved'?'Crypto order approved ✓':'Crypto order rejected');
      onClose();
    } catch (e:any) { setErr(e?.response?.data?.message||'Action failed'); }
    finally { setLoading(false); }
  };

  const ss = getS(inv.orderStatus); const SIco = ss.Icon;
  const isPending = inv.orderStatus==='pending';
  const pl = inv.profitLoss??0; const plPct = inv.profitLossPercent??0;
  const hasPL = (inv.currentValue??0)>0 && inv.orderStatus==='filled';
  const coinColor = COIN_COLOR[inv.symbol]??'#f59e0b';

  const rows = [
    { l:'Reference',      v:inv.referenceNumber||'—',  mono:true },
    { l:'Symbol',         v:inv.symbol||'—',            mono:true },
    { l:'Coin',           v:inv.coinName||inv.symbol||'—'          },
    { l:'Action',         v:(inv.action??'—').toUpperCase()        },
    { l:'Amount (USD)',   v:fmt(inv.amountUSD),          mono:true },
    { l:'Crypto Amount',  v:inv.cryptoAmount?`${inv.cryptoAmount} ${inv.symbol}`:'—',mono:true },
    { l:'Buy Price',      v:fmt(inv.buyPrice),           mono:true },
    { l:'Current Price',  v:inv.currentPrice?fmt(inv.currentPrice):'—',mono:true },
    { l:'Current Value',  v:inv.currentValue?fmt(inv.currentValue):'—',mono:true },
    { l:'P&L',            v:hasPL?`${pl>=0?'+':''}${fmt(pl)} (${plPct>=0?'+':''}${plPct.toFixed(2)}%)`:'—',mono:true },
    { l:'Status',         v:ss.label                               },
    { l:'Order Date',     v:fmtD(inv.createdAt)                   },
    ...(inv.soldAt?[{ l:'Sold At', v:fmtD(inv.soldAt) }]:[]),
    ...(inv.sellPrice?[{ l:'Sell Price', v:fmt(inv.sellPrice), mono:true }]:[]),
    ...(inv.sellAmountUSD?[{ l:'Proceeds', v:fmt(inv.sellAmountUSD), mono:true }]:[]),
    ...(inv.accountId?.accountNumber?[{ l:'Account #', v:inv.accountId.accountNumber, mono:true }]:[]),
  ].filter(r=>r.v&&r.v!=='—');

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(8px)',zIndex:9100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#0f1623',border:'1px solid rgba(255,255,255,.09)',borderRadius:20,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 22px',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:`${coinColor}22`,border:`1px solid ${coinColor}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Bitcoin size={18} color={coinColor}/>
            </div>
            <div>
              <h3 style={{ fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 2px' }}>Crypto Order — {inv.symbol}</h3>
              <p style={{ fontSize:11,color:'rgba(255,255,255,.35)',margin:0 }}>{inv.userId?.firstName??''} {inv.userId?.lastName??''} · {inv.userId?.email??''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.4)',cursor:'pointer' }}><X size={15}/></button>
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:14 }}>
          {err&&<div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(239,68,68,.09)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'10px 13px' }}><AlertCircle size={13} color="#f87171"/><span style={{ fontSize:13,color:'#fca5a5' }}>{err}</span></div>}

          {/* Status + amount banner */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:`${coinColor}11`,border:`1px solid ${coinColor}33`,borderRadius:12,padding:'14px 18px' }}>
            <div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:4 }}>Order Status</div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <SIco size={14} color={ss.color}/>
                <span style={{ fontSize:16,fontWeight:800,color:ss.color }}>{ss.label}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:4 }}>Amount</div>
              <div style={{ fontSize:20,fontWeight:900,color:'#fff',fontFamily:'monospace' }}>{fmt(inv.amountUSD)}</div>
              {inv.cryptoAmount&&<div style={{ fontSize:12,color:`${coinColor}cc`,fontFamily:'monospace' }}>{inv.cryptoAmount} {inv.symbol}</div>}
            </div>
          </div>

          {/* Investor */}
          {inv.userId&&(
            <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 16px' }}>
              <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10 }}>Investor</div>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:34,height:34,borderRadius:9,background:`${coinColor}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:coinColor,flexShrink:0 }}>
                  {(inv.userId.firstName?.[0]??'U').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{inv.userId.firstName??''} {inv.userId.lastName??''}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.4)' }}>@{inv.userId.username??''} · {inv.userId.email??''}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,overflow:'hidden' }}>
            {rows.map(({ l,v,mono },i)=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',gap:12,borderBottom:i<rows.length-1?'1px solid rgba(255,255,255,.05)':'none' }}>
                <span style={{ fontSize:12,color:'rgba(255,255,255,.38)',flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:13,color:'rgba(255,255,255,.85)',textAlign:'right',fontFamily:mono?'monospace':'inherit',wordBreak:'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'14px 22px',borderTop:'1px solid rgba(255,255,255,.07)',flexShrink:0,display:'flex',flexDirection:'column',gap:10 }}>
          {isPending&&(
            <>
              <div style={{ background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'rgba(245,158,11,.8)' }}>
                ⏳ Pending approval. Approve to confirm the purchase, reject to cancel and refund the user's account.
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>review('rejected')} disabled={loading}
                  style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:11,padding:'12px',fontSize:13,fontWeight:700,color:'#f87171',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.6:1 }}>
                  {loading?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<XCircle size={14}/>} Reject & Refund
                </button>
                <button onClick={()=>review('approved')} disabled={loading}
                  style={{ flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:7,background:`linear-gradient(135deg,${coinColor},${coinColor}bb)`,border:'none',borderRadius:11,padding:'12px',fontSize:14,fontWeight:700,color:'#050d1a',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.6:1 }}>
                  {loading?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<CheckCircle2 size={14}/>} Approve Order
                </button>
              </div>
            </>
          )}
          <button onClick={onClose} style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:'10px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Row component shared by both tables ────────────────────────
function InvRow({ children, onClick }: { children: React.ReactNode; onClick: ()=>void }) {
  return (
    <div onClick={onClick} style={{ cursor:'pointer',transition:'background .15s',borderBottom:'1px solid rgba(255,255,255,.04)' }}
      onMouseEnter={e=>((e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)')}
      onMouseLeave={e=>((e.currentTarget as HTMLElement).style.background='transparent')}>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminInvestmentsPage() {
  const [tab,          setTab]          = useState<'stocks'|'crypto'>('stocks');
  const [stocks,       setStocks]       = useState<StockInvestment[]>([]);
  const [stockPag,     setStockPag]     = useState<Pagination>({ total:0,page:1,limit:20,pages:1 });
  const [stockLoad,    setStockLoad]    = useState(true);
  const [cryptos,      setCryptos]      = useState<CryptoInvestment[]>([]);
  const [cryptoPag,    setCryptoPag]    = useState<Pagination>({ total:0,page:1,limit:20,pages:1 });
  const [cryptoLoad,   setCryptoLoad]   = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter,   setShowFilter]   = useState(false);
  const [selStock,     setSelStock]     = useState<StockInvestment|null>(null);
  const [selCrypto,    setSelCrypto]    = useState<CryptoInvestment|null>(null);
  const [toast,        setToast]        = useState('');
  const [mounted,      setMounted]      = useState(false);
  useEffect(()=>{ setMounted(true); },[]);
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500); };

  const loadStocks = useCallback(async (page=1, st=statusFilter)=>{
    setStockLoad(true);
    try {
      const p: any = { page, limit:20 };
      if (st) p.orderStatus=st;
      const res = await adminApi.get('/admin/investments', { params:p });
      // API interceptor: { success:true, data: { data: { investments:[...], pagination:{...} } } }
      const inner = res.data?.data?.data ?? res.data?.data ?? res.data;
      const items: StockInvestment[] =
        Array.isArray(inner?.investments) ? inner.investments :
        Array.isArray(inner?.items)       ? inner.items :
        Array.isArray(inner)              ? inner : [];
      setStocks(items);
      if (inner?.pagination) setStockPag(inner.pagination);
      else if (typeof inner?.total==='number') setStockPag({ total:inner.total,page,limit:20,pages:Math.ceil(inner.total/20) });
    } catch(e){ console.error('stocks load error',e); }
    finally { setStockLoad(false); }
  },[statusFilter]);

  const loadCrypto = useCallback(async (page=1, st=statusFilter)=>{
    setCryptoLoad(true);
    try {
      const p: any = { page, limit:20 };
      if (st) p.orderStatus=st;  // backend filters on orderStatus not status
      const res = await adminApi.get('/admin/crypto/invest/portfolio', { params:p });
      console.log('[ADMIN CRYPTO] full res.data:', JSON.stringify(res.data).slice(0,300));

      // Handle every possible nesting shape NestJS might return:
      // Shape A: { data: { positions: [...], pagination: {...} } }   ← our backend
      // Shape B: { positions: [...], pagination: {...} }
      // Shape C: { data: [...] }
      // Shape D: [...]
      // Response shape: { success:true, data: { data: { positions:[...], pagination:{...} } } }
      // API interceptor adds outer { success, data } wrapper → need res.data.data.data.positions
      const inner = res.data?.data?.data ?? res.data?.data ?? res.data;
      const items: CryptoInvestment[] =
        Array.isArray(inner?.positions) ? inner.positions :
        Array.isArray(inner)            ? inner : [];
      const pag = inner?.pagination ?? null;

      console.log('[ADMIN CRYPTO] extracted items count:', items.length, '| sample:', items[0]);
      setCryptos(items);
      if (pag) setCryptoPag(pag);
    } catch(e:any) {
      console.error('[ADMIN CRYPTO] load error:', e?.response?.status, e?.response?.data ?? e?.message);
    }
    finally { setCryptoLoad(false); }
  },[statusFilter]);

  useEffect(()=>{ if(mounted){ loadStocks(); loadCrypto(); } },[mounted]); // eslint-disable-line

  const reload = () => {
    if (tab==='stocks') loadStocks(stockPag.page, statusFilter);
    else loadCrypto(cryptoPag.page, statusFilter);
  };

  const quickReview = async (id:string, decision:'approved'|'rejected', type:'stock'|'crypto') => {
    try {
      const url = type==='stock'
        ? `/admin/investments/${id}/review`
        : `/admin/crypto/invest/${id}/review`;
      await adminApi.post(url, { decision });
      showToast(decision==='approved'?`✓ Order approved`:`Order rejected`);
      if (type==='stock') loadStocks(stockPag.page,statusFilter);
      else loadCrypto(cryptoPag.page,statusFilter);
    } catch(e:any) { showToast(e?.response?.data?.message||'Action failed'); }
  };

  // Client-side search
  const filteredStocks = search
    ? stocks.filter(i=>[i.symbol,i.companyName,i.referenceNumber,i.userId?.email,i.userId?.firstName,i.userId?.lastName].some(f=>f?.toLowerCase().includes(search.toLowerCase())))
    : stocks;
  const filteredCrypto = search
    ? cryptos.filter(i=>[i.symbol,i.coinName,i.referenceNumber,i.userId?.email,i.userId?.firstName,i.userId?.lastName].some(f=>f?.toLowerCase().includes(search.toLowerCase())))
    : cryptos;

  // Combined stats
  const allItems = [...stocks,...cryptos];
  const pendingCount  = allItems.filter(i=>i.orderStatus==='pending').length;
  const filledCount   = allItems.filter(i=>i.orderStatus==='filled').length;
  const failedCount   = allItems.filter(i=>i.orderStatus==='cancelled'||i.orderStatus==='failed').length;
  const volume = allItems.reduce((s,i)=>s+(('totalInvested' in i?(i as any).totalInvested:0)||('amountUSD' in i?(i as any).amountUSD:0)),0);

  if (!mounted) return null;

  // Shared table column grid
  const cols = '1.8fr 1.4fr 90px 120px 90px 180px';

  const renderTableHeader = (labels: string[]) => (
    <div style={{ display:'grid',gridTemplateColumns:cols,padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,.07)',background:'rgba(255,255,255,.02)' }}>
      {labels.map(h=><span key={h} style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.06em' }}>{h}</span>)}
    </div>
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20,fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'clamp(18px,2.5vw,24px)',fontWeight:800,color:'#fff',margin:'0 0 4px',letterSpacing:'-.4px' }}>Investments</h1>
          <p style={{ fontSize:13,color:'rgba(255,255,255,.38)',margin:0 }}>{(stockPag.total+cryptoPag.total).toLocaleString()} total orders</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={()=>setShowFilter(v=>!v)} style={{ display:'inline-flex',alignItems:'center',gap:6,background:showFilter?'rgba(245,158,11,.12)':'rgba(255,255,255,.05)',border:`1px solid ${showFilter?'rgba(245,158,11,.3)':'rgba(255,255,255,.09)'}`,borderRadius:10,padding:'9px 14px',fontSize:13,fontWeight:600,color:showFilter?'#f59e0b':'rgba(255,255,255,.55)',cursor:'pointer',fontFamily:'inherit' }}>
            <Filter size={13}/> Filter
          </button>
          <button onClick={reload} style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:38,height:38,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:10,color:'rgba(255,255,255,.55)',cursor:'pointer' }}>
            <RefreshCw size={14} style={{ animation:(stockLoad||cryptoLoad)?'spin 1s linear infinite':'none' }}/>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12 }} className="sg">
        {([
          { l:'Pending Review', v:pendingCount,     c:'#f59e0b', Icon:Clock        },
          { l:'Filled',         v:filledCount,      c:'#34d399', Icon:CheckCircle2 },
          { l:'Failed/Rejected',v:failedCount,      c:'#f87171', Icon:XCircle      },
          { l:'Total Volume',   v:fmt(volume),      c:'#60a5fa', Icon:DollarSign,mono:true },
        ] as const).map(({ l,v,c,Icon,mono })=>(
          <div key={l} style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:'14px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}><Icon size={13} color={c}/><span style={{ fontSize:11,color:'rgba(255,255,255,.4)' }}>{l}</span></div>
            <div style={{ fontSize:'clamp(16px,2vw,22px)',fontWeight:800,color:c,fontFamily:(mono as any)?'monospace':'inherit' }}>{typeof v==='number'?v.toLocaleString():v}</div>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {pendingCount>0&&(
        <div style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:12,padding:'12px 16px' }}>
          <Clock size={16} color="#f59e0b" style={{ flexShrink:0 }}/>
          <p style={{ fontSize:13,color:'#f59e0b',margin:0,fontWeight:600 }}>
            {pendingCount} order{pendingCount!==1?'s':''} waiting for your approval — click any row to review
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        {([
          { id:'stocks' as const, label:'📈 Stocks', count:stockPag.total, pending:stocks.filter(i=>i.orderStatus==='pending').length },
          { id:'crypto' as const, label:'₿ Crypto',  count:cryptoPag.total, pending:cryptos.filter(i=>i.orderStatus==='pending').length },
        ]).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',fontSize:13,fontWeight:700,background:'none',border:'none',borderBottom:`2px solid ${tab===t.id?'#f59e0b':'transparent'}`,color:tab===t.id?'#f59e0b':'rgba(255,255,255,.4)',cursor:'pointer',fontFamily:'inherit',marginBottom:-1,transition:'color .15s',whiteSpace:'nowrap' }}>
            {t.label}
            <span style={{ background:tab===t.id?'rgba(245,158,11,.15)':'rgba(255,255,255,.07)',color:tab===t.id?'#f59e0b':'rgba(255,255,255,.35)',fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:100 }}>{t.count}</span>
            {t.pending>0&&<span style={{ background:'rgba(245,158,11,.25)',color:'#f59e0b',fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:100 }}>{t.pending} pending</span>}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          <div style={{ position:'relative',flex:1,minWidth:200,maxWidth:400 }}>
            <Search size={14} color="rgba(255,255,255,.25)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol, name, email…" style={{ ...inp,paddingLeft:36 }} onFocus={fg} onBlur={br}/>
          </div>
          <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); loadStocks(1,e.target.value); loadCrypto(1,e.target.value); }}
            style={{ ...inp,width:'auto',minWidth:160,appearance:'none',cursor:'pointer' }} onFocus={fg} onBlur={br}>
            <option value="">All statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="filled">✓ Filled</option>
            <option value="cancelled">✗ Cancelled</option>
            <option value="failed">✗ Failed</option>
          </select>
        </div>
      </div>

      {/* ── STOCKS TAB ── */}
      {tab==='stocks'&&(
        <div style={{ background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,overflow:'hidden' }}>
          {stockLoad&&stocks.length===0?(
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:280,gap:10,color:'rgba(255,255,255,.3)',fontSize:13 }}>
              <Loader2 size={20} color="#f59e0b" style={{ animation:'spin 1s linear infinite' }}/> Loading stock orders…
            </div>
          ):filteredStocks.length===0?(
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:240,gap:10 }}>
              <BarChart3 size={36} color="rgba(255,255,255,.1)"/>
              <p style={{ fontSize:14,color:'rgba(255,255,255,.3)',margin:0 }}>No stock orders found</p>
            </div>
          ):(
            <>
              {renderTableHeader(['Asset','Investor','Action','Invested','Status','Actions'])}
              {filteredStocks.map((inv,i)=>{
                const ss=getS(inv.orderStatus); const SIco=ss.Icon;
                const isPending=inv.orderStatus==='pending';
                return (
                  <InvRow key={inv._id} onClick={()=>setSelStock(inv)}>
                    <div style={{ display:'grid',gridTemplateColumns:cols,alignItems:'center',padding:'13px 18px',gap:8 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0 }}>
                        <div style={{ width:36,height:36,borderRadius:9,flexShrink:0,background:isPending?'rgba(245,158,11,.15)':inv.action==='buy'?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:isPending?'#f59e0b':inv.action==='buy'?'#34d399':'#f87171',fontFamily:'monospace',border:isPending?'1px solid rgba(245,158,11,.3)':'none' }}>
                          {inv.symbol.slice(0,2)}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:'#fff',fontFamily:'monospace' }}>{inv.symbol}</div>
                          <div style={{ fontSize:11,color:'rgba(255,255,255,.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150 }}>{inv.companyName}</div>
                        </div>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{inv.userId?.firstName??''} {inv.userId?.lastName??''}</div>
                        <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{inv.userId?.email??''}</div>
                      </div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:inv.action==='buy'?'rgba(52,211,153,.1)':'rgba(248,113,113,.1)',color:inv.action==='buy'?'#34d399':'#f87171',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:7 }}>
                        {inv.action==='buy'?<ArrowDownLeft size={10}/>:<ArrowUpRight size={10}/>}{(inv.action??'').toUpperCase()}
                      </span>
                      <div style={{ fontSize:13,fontWeight:700,color:'#fff',fontFamily:'monospace' }}>{fmt(inv.totalInvested)}</div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:ss.bg,color:ss.color,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:100 }}><SIco size={10}/>{ss.label}</span>
                      <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                        <button onClick={e=>{e.stopPropagation();setSelStock(inv);}} style={{ display:'inline-flex',alignItems:'center',gap:4,background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.2)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#60a5fa',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' }}><Eye size={11}/> View</button>
                        {isPending&&<>
                          <button onClick={e=>{e.stopPropagation();quickReview(inv._id,'approved','stock');}} style={{ display:'inline-flex',alignItems:'center',gap:3,background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.2)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#34d399',cursor:'pointer',fontFamily:'inherit' }}><CheckCircle2 size={11}/> ✓</button>
                          <button onClick={e=>{e.stopPropagation();quickReview(inv._id,'rejected','stock');}} style={{ display:'inline-flex',alignItems:'center',gap:3,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#f87171',cursor:'pointer',fontFamily:'inherit' }}><XCircle size={11}/> ✗</button>
                        </>}
                      </div>
                    </div>
                  </InvRow>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── CRYPTO TAB ── */}
      {tab==='crypto'&&(
        <div style={{ background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,overflow:'hidden' }}>
          {cryptoLoad&&cryptos.length===0?(
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:280,gap:10,color:'rgba(255,255,255,.3)',fontSize:13 }}>
              <Loader2 size={20} color="#f59e0b" style={{ animation:'spin 1s linear infinite' }}/> Loading crypto orders…
            </div>
          ):filteredCrypto.length===0?(
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:240,gap:10 }}>
              <Bitcoin size={36} color="rgba(255,255,255,.1)"/>
              <p style={{ fontSize:14,color:'rgba(255,255,255,.3)',margin:0 }}>No crypto orders found</p>
              <p style={{ fontSize:12,color:'rgba(255,255,255,.2)',margin:0 }}>Make sure you applied Patch 1 to admin.controller.ts</p>
            </div>
          ):(
            <>
              {renderTableHeader(['Coin','Investor','Action','Amount','Status','Actions'])}
              {filteredCrypto.map((inv,i)=>{
                const ss=getS(inv.orderStatus); const SIco=ss.Icon;
                const isPending=inv.orderStatus==='pending';
                const coinColor=COIN_COLOR[inv.symbol]??'#f59e0b';
                return (
                  <InvRow key={inv._id} onClick={()=>setSelCrypto(inv)}>
                    <div style={{ display:'grid',gridTemplateColumns:cols,alignItems:'center',padding:'13px 18px',gap:8 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0 }}>
                        <div style={{ width:36,height:36,borderRadius:'50%',flexShrink:0,background:`${coinColor}22`,border:`1px solid ${coinColor}${isPending?'66':'33'}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <Bitcoin size={16} color={coinColor}/>
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:'#fff',fontFamily:'monospace' }}>{inv.symbol}</div>
                          <div style={{ fontSize:11,color:'rgba(255,255,255,.35)' }}>{inv.coinName??inv.symbol}</div>
                        </div>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{inv.userId?.firstName??''} {inv.userId?.lastName??''}</div>
                        <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{inv.userId?.email??''}</div>
                      </div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:inv.action==='buy'?'rgba(52,211,153,.1)':'rgba(248,113,113,.1)',color:inv.action==='buy'?'#34d399':'#f87171',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:7 }}>
                        {inv.action==='buy'?<ArrowDownLeft size={10}/>:<ArrowUpRight size={10}/>}{(inv.action??'').toUpperCase()}
                      </span>
                      <div style={{ fontSize:13,fontWeight:700,color:'#fff',fontFamily:'monospace' }}>{fmt(inv.amountUSD)}</div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:4,background:ss.bg,color:ss.color,fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:100 }}><SIco size={10}/>{ss.label}</span>
                      <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                        <button onClick={e=>{e.stopPropagation();setSelCrypto(inv);}} style={{ display:'inline-flex',alignItems:'center',gap:4,background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.2)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#60a5fa',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' }}><Eye size={11}/> View</button>
                        {isPending&&<>
                          <button onClick={e=>{e.stopPropagation();quickReview(inv._id,'approved','crypto');}} style={{ display:'inline-flex',alignItems:'center',gap:3,background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.2)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#34d399',cursor:'pointer',fontFamily:'inherit' }}><CheckCircle2 size={11}/> ✓</button>
                          <button onClick={e=>{e.stopPropagation();quickReview(inv._id,'rejected','crypto');}} style={{ display:'inline-flex',alignItems:'center',gap:3,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',borderRadius:7,padding:'5px 9px',fontSize:11,fontWeight:700,color:'#f87171',cursor:'pointer',fontFamily:'inherit' }}><XCircle size={11}/> ✗</button>
                        </>}
                      </div>
                    </div>
                  </InvRow>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {(()=>{
        const pag = tab==='stocks'?stockPag:cryptoPag;
        const load = tab==='stocks'?(p:number)=>loadStocks(p,statusFilter):(p:number)=>loadCrypto(p,statusFilter);
        if (pag.pages<=1) return null;
        return (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
            <span style={{ fontSize:12,color:'rgba(255,255,255,.35)' }}>Showing {((pag.page-1)*pag.limit)+1}–{Math.min(pag.page*pag.limit,pag.total)} of {pag.total.toLocaleString()}</span>
            <div style={{ display:'flex',gap:6 }}>
              <button onClick={()=>load(pag.page-1)} disabled={pag.page<=1} style={{ display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:pag.page<=1?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)',cursor:pag.page<=1?'not-allowed':'pointer',fontFamily:'inherit' }}><ChevronLeft size={15}/> Prev</button>
              {Array.from({ length:Math.min(5,pag.pages) },(_,i)=>{ const pg=Math.max(1,Math.min(pag.pages-4,pag.page-2))+i; return <button key={pg} onClick={()=>load(pg)} style={{ width:34,height:34,borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:700,background:pg===pag.page?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,.05)',color:pg===pag.page?'#050d1a':'rgba(255,255,255,.5)' }}>{pg}</button>; })}
              <button onClick={()=>load(pag.page+1)} disabled={pag.page>=pag.pages} style={{ display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:pag.page>=pag.pages?'rgba(255,255,255,.2)':'rgba(255,255,255,.6)',cursor:pag.page>=pag.pages?'not-allowed':'pointer',fontFamily:'inherit' }}>Next <ChevronRight size={15}/></button>
            </div>
          </div>
        );
      })()}

      {selStock  && <StockModal  inv={selStock}  onClose={()=>setSelStock(null)}  onDone={m=>{ showToast(m); loadStocks(stockPag.page,statusFilter); }}/>}
      {selCrypto && <CryptoModal inv={selCrypto} onClose={()=>setSelCrypto(null)} onDone={m=>{ showToast(m); loadCrypto(cryptoPag.page,statusFilter); }}/>}

      {toast&&<div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#111826',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'12px 22px',fontSize:13,fontWeight:600,color:'#34d399',whiteSpace:'nowrap',boxShadow:'0 8px 30px rgba(0,0,0,.5)',zIndex:9999 }}>{toast}</div>}

      <style>{`
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes spin{to{transform:rotate(360deg);}}
        select option{background:#1a2235;color:#fff;}
        @media(min-width:640px){.sg{grid-template-columns:repeat(4,1fr) !important;}}
      `}</style>
    </div>
  );
}