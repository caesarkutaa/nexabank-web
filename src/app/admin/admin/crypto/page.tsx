'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, AlertCircle, RefreshCw, X, CheckCircle2,
  Trash2, Pencil, Copy, Shield, Coins, Eye, EyeOff,
  ToggleLeft, ToggleRight, Save,
} from 'lucide-react';
import adminApi from '../lib/api';

interface CryptoAddress {
  _id: string; network: string; coin: string; address: string;
  label?: string; memo?: string; qrCodeUrl?: string;
  isActive: boolean; minimumDeposit?: number;
  confirmationsRequired?: number; updatedAt: string;
}

const NETWORKS: Record<string, { name:string;coin:string;color:string;bg:string;icon:string;placeholder:string;memoLabel?:string;minDeposit:number;confirmations:number }> = {
  bitcoin:    { name:'Bitcoin',       coin:'BTC', color:'#f7931a', bg:'rgba(247,147,26,.12)', icon:'₿', placeholder:'bc1q... or 1... or 3...',         minDeposit:0.0001, confirmations:3  },
  ethereum:   { name:'Ethereum',      coin:'ETH', color:'#627eea', bg:'rgba(98,126,234,.12)', icon:'Ξ', placeholder:'0x...',                             minDeposit:0.001,  confirmations:12 },
  tron:       { name:'Tron',          coin:'TRX', color:'#eb0029', bg:'rgba(235,0,41,.12)',   icon:'T', placeholder:'T...',                              minDeposit:10,     confirmations:19 },
  usdt_trc20: { name:'USDT (TRC-20)', coin:'USDT',color:'#26a17b', bg:'rgba(38,161,123,.12)',icon:'₮', placeholder:'T... (TRC-20)',                     minDeposit:1,      confirmations:19 },
  usdt_erc20: { name:'USDT (ERC-20)', coin:'USDT',color:'#26a17b', bg:'rgba(38,161,123,.1)', icon:'₮', placeholder:'0x... (ERC-20)',                    minDeposit:10,     confirmations:12 },
  usdc_erc20: { name:'USDC (ERC-20)', coin:'USDC',color:'#2775ca', bg:'rgba(39,117,202,.12)',icon:'$', placeholder:'0x...',                             minDeposit:10,     confirmations:12 },
  bnb:        { name:'BNB Smart Chain',coin:'BNB',color:'#f3ba2f', bg:'rgba(243,186,47,.12)',icon:'◆', placeholder:'0x... (BSC)',                       minDeposit:0.01,   confirmations:15 },
  solana:     { name:'Solana',        coin:'SOL', color:'#9945ff', bg:'rgba(153,69,255,.12)',icon:'◎', placeholder:'Base58 address...',                  minDeposit:0.01,   confirmations:1  },
  litecoin:   { name:'Litecoin',      coin:'LTC', color:'#bebebe', bg:'rgba(190,190,190,.1)',icon:'Ł', placeholder:'L... or ltc1...',                   minDeposit:0.01,   confirmations:6  },
  ripple:     { name:'XRP (Ripple)',  coin:'XRP', color:'#0085c0', bg:'rgba(0,133,192,.12)', icon:'✕', placeholder:'r...',memoLabel:'Destination Tag',   minDeposit:10,     confirmations:1  },
};

const inp: React.CSSProperties = { width:'100%',background:'#1a2235',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 13px',fontSize:13,color:'#fff',outline:'none',fontFamily:'inherit',WebkitTextFillColor:'#fff',boxSizing:'border-box',transition:'border-color .2s' };
const fg=(e:React.FocusEvent<any>)=>(e.target.style.borderColor='rgba(245,158,11,.5)');
const bl=(e:React.FocusEvent<any>)=>(e.target.style.borderColor='rgba(255,255,255,.1)');
const Lbl=({t}:{t:string})=><label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.45)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>{t}</label>;

function CopyBtn({text}:{text:string}){
  const[c,setC]=useState(false);
  return(
    <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(text).then(()=>{setC(true);setTimeout(()=>setC(false),1800);});}} title="Copy"
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:26,height:26,background:c?'rgba(52,211,153,.15)':'rgba(255,255,255,.07)',border:`1px solid ${c?'rgba(52,211,153,.3)':'rgba(255,255,255,.1)'}`,borderRadius:6,cursor:'pointer',flexShrink:0,transition:'all .15s'}}>
      {c?<CheckCircle2 size={12} color="#34d399"/>:<Copy size={12} color="rgba(255,255,255,.4)"/>}
    </button>
  );
}

function UpsertModal({existing,onClose,onDone}:{existing?:CryptoAddress;onClose:()=>void;onDone:()=>void}){
  const isEdit=!!existing;
  const[network,setNetwork]=useState(existing?.network??'bitcoin');
  const[address,setAddress]=useState(existing?.address??'');
  const[label,setLabel]=useState(existing?.label??'');
  const[memo,setMemo]=useState(existing?.memo??'');
  const[minDep,setMinDep]=useState(String(existing?.minimumDeposit??NETWORKS[existing?.network??'bitcoin']?.minDeposit??''));
  const[confirms,setConfirms]=useState(String(existing?.confirmationsRequired??NETWORKS[existing?.network??'bitcoin']?.confirmations??''));
  const[isActive,setIsActive]=useState(existing?.isActive??true);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState('');
  const[ok,setOk]=useState('');
  const cfg=NETWORKS[network]??NETWORKS.bitcoin;

  const handleNet=(net:string)=>{setNetwork(net);if(!isEdit){setAddress('');setMemo('');setMinDep(String(NETWORKS[net]?.minDeposit??''));setConfirms(String(NETWORKS[net]?.confirmations??''));}};

  const submit=async()=>{
    setErr('');setOk('');
    if(!address.trim())return setErr('Wallet address is required');
    if(address.trim().length<20)return setErr('Address appears too short — please verify');
    setLoading(true);
    try{
      await adminApi.put('/admin/crypto/addresses',{network,coin:cfg.coin,address:address.trim(),label:label.trim()||undefined,memo:memo.trim()||undefined,isActive,minimumDeposit:parseFloat(minDep)||cfg.minDeposit,confirmationsRequired:parseInt(confirms)||cfg.confirmations});
      setOk(isEdit?'Address updated':'Address published');
      setTimeout(()=>{onDone();onClose();},1000);
    }catch(e:any){setErr(e.response?.data?.message||'Failed to save');}
    finally{setLoading(false);}
  };

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.82)',backdropFilter:'blur(8px)',zIndex:9100,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#0f1623',border:'1px solid rgba(255,255,255,.09)',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:580,maxHeight:'94vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'17px 22px',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 3px'}}>{isEdit?'Edit Address':'Add Crypto Address'}</h3>
            <p style={{fontSize:12,color:'rgba(255,255,255,.35)',margin:0}}>This address will be visible to all users for deposits</p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.4)',cursor:'pointer'}}><X size={15}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px',display:'flex',flexDirection:'column',gap:15}}>
          {err&&<div style={{display:'flex',alignItems:'flex-start',gap:9,background:'rgba(239,68,68,.09)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'11px 13px'}}><AlertCircle size={13} color="#f87171" style={{flexShrink:0,marginTop:1}}/><span style={{fontSize:13,color:'#fca5a5',lineHeight:1.5}}>{err}</span></div>}
          {ok&&<div style={{display:'flex',alignItems:'center',gap:9,background:'rgba(52,211,153,.09)',border:'1px solid rgba(52,211,153,.2)',borderRadius:10,padding:'11px 13px'}}><CheckCircle2 size={13} color="#34d399"/><span style={{fontSize:13,color:'#6ee7b7'}}>{ok}</span></div>}

          <div>
            <Lbl t="Network / Coin"/>
            {isEdit?(
              <div style={{display:'flex',alignItems:'center',gap:10,background:'#1a2235',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 13px'}}>
                <div style={{width:30,height:30,borderRadius:8,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:cfg.color,flexShrink:0}}>{cfg.icon}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{cfg.name}</div><div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{cfg.coin}</div></div>
                <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,.25)',fontStyle:'italic'}}>Network locked on edit</span>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8}}>
                {Object.entries(NETWORKS).map(([key,nc])=>(
                  <button key={key} onClick={()=>handleNet(key)} style={{display:'flex',alignItems:'center',gap:9,background:network===key?nc.bg:'rgba(255,255,255,.03)',border:network===key?`1.5px solid ${nc.color}55`:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:'10px 12px',cursor:'pointer',textAlign:'left',fontFamily:'inherit',transition:'all .15s'}}>
                    <div style={{width:28,height:28,borderRadius:7,background:nc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:nc.color,flexShrink:0}}>{nc.icon}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:network===key?nc.color:'rgba(255,255,255,.7)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nc.coin}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nc.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Lbl t={`${cfg.coin} Wallet Address *`}/>
            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder={cfg.placeholder} style={{...inp,fontFamily:'monospace',fontSize:12}} onFocus={fg} onBlur={bl}/>
          </div>

          {cfg.memoLabel&&(
            <div>
              <Lbl t={`${cfg.memoLabel} (optional)`}/>
              <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder={`Enter ${cfg.memoLabel}...`} style={{...inp,fontFamily:'monospace'}} onFocus={fg} onBlur={bl}/>
              <p style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:5}}>Users must include this when sending — funds may be lost without it.</p>
            </div>
          )}

          <div><Lbl t="Label (optional)"/><input value={label} onChange={e=>setLabel(e.target.value)} placeholder={`e.g. NexaBank ${cfg.coin} Hot Wallet`} style={inp} onFocus={fg} onBlur={bl}/></div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><Lbl t={`Min Deposit (${cfg.coin})`}/><input type="number" min="0" step="any" value={minDep} onChange={e=>setMinDep(e.target.value)} style={inp} onFocus={fg} onBlur={bl}/></div>
            <div><Lbl t="Confirmations Required"/><input type="number" min="1" step="1" value={confirms} onChange={e=>setConfirms(e.target.value)} style={inp} onFocus={fg} onBlur={bl}/></div>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 15px'}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Show to users</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2}}>When off, this address is hidden from the user deposit page</div>
            </div>
            <button onClick={()=>setIsActive(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}>
              {isActive?<ToggleRight size={32} color="#34d399"/>:<ToggleLeft size={32} color="rgba(255,255,255,.2)"/>}
            </button>
          </div>

          <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:10,padding:'11px 13px',fontSize:12,color:'rgba(245,158,11,.8)',lineHeight:1.6}}>
            ⚠️ Verify this address before publishing. Users will send real funds here — an incorrect address means permanent loss.
          </div>
        </div>
        <div style={{display:'flex',gap:10,padding:'14px 22px',borderTop:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:'12px',fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={submit} disabled={loading||!!ok} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#050d1a',border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:(loading||!!ok)?'not-allowed':'pointer',fontFamily:'inherit',opacity:(loading||!!ok)?.65:1}}>
            {loading?<Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>:<Save size={15}/>}
            {isEdit?'Save Changes':'Publish Address'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({addr,onClose,onDone}:{addr:CryptoAddress;onClose:()=>void;onDone:()=>void}){
  const[loading,setLoading]=useState(false);
  const cfg=NETWORKS[addr.network];
  const del=async()=>{setLoading(true);try{await adminApi.delete(`/admin/crypto/addresses/${addr.network}`);onDone();onClose();}catch{setLoading(false);}};
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.78)',backdropFilter:'blur(6px)',zIndex:9200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#111826',border:'1px solid rgba(255,255,255,.1)',borderRadius:18,padding:'22px 20px',width:'100%',maxWidth:360,display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h3 style={{fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 4px'}}>Remove Address?</h3><p style={{fontSize:12,color:'rgba(255,255,255,.4)',margin:0}}>{cfg?.name??addr.network} · {cfg?.coin}</p></div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.06)',border:'none',borderRadius:8,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,.4)',cursor:'pointer'}}><X size={14}/></button>
        </div>
        <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,padding:'11px 13px',fontSize:13,color:'#fca5a5',lineHeight:1.6}}>This will immediately hide the address from users. Pending deposits to this address are unaffected.</div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:10,fontSize:13,fontWeight:600,color:'rgba(255,255,255,.5)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={del} disabled={loading} style={{flex:1,background:'linear-gradient(135deg,#dc2626,#b91c1c)',border:'none',borderRadius:10,padding:10,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:loading?.6:1}}>
            {loading&&<Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>}<Trash2 size={13}/> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressCard({addr,onEdit,onDelete,onToggle}:{addr:CryptoAddress;onEdit:(a:CryptoAddress)=>void;onDelete:(a:CryptoAddress)=>void;onToggle:(a:CryptoAddress)=>void}){
  const cfg=NETWORKS[addr.network]??{name:addr.network,coin:addr.coin??addr.network,color:'#f59e0b',bg:'rgba(245,158,11,.1)',icon:'●'};
  const[showFull,setShowFull]=useState(false);
  const short=addr.address.length>22?`${addr.address.slice(0,10)}...${addr.address.slice(-8)}`:addr.address;
  return(
    <div style={{background:'rgba(255,255,255,.025)',border:`1px solid ${addr.isActive?'rgba(255,255,255,.08)':'rgba(255,255,255,.04)'}`,borderRadius:18,overflow:'hidden',opacity:addr.isActive?1:.6,transition:'all .2s'}}
      onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor=addr.isActive?'rgba(255,255,255,.14)':'rgba(255,255,255,.07)')}
      onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor=addr.isActive?'rgba(255,255,255,.08)':'rgba(255,255,255,.04)')}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:44,height:44,borderRadius:13,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:900,color:cfg.color,flexShrink:0,fontFamily:'monospace'}}>{cfg.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
            <span style={{fontSize:15,fontWeight:800,color:'#fff'}}>{cfg.coin}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:100,background:cfg.bg,color:cfg.color}}>{cfg.name}</span>
          </div>
          {addr.label&&<div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{addr.label}</div>}
        </div>
        <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:100,background:addr.isActive?'rgba(52,211,153,.12)':'rgba(255,255,255,.06)',color:addr.isActive?'#34d399':'rgba(255,255,255,.3)',border:`1px solid ${addr.isActive?'rgba(52,211,153,.2)':'rgba(255,255,255,.08)'}`,whiteSpace:'nowrap',flexShrink:0}}>
          {addr.isActive?'● Live':'○ Hidden'}
        </span>
      </div>
      <div style={{padding:'12px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(0,0,0,.3)',border:'1px solid rgba(255,255,255,.07)',borderRadius:10,padding:'10px 12px'}}>
          <span style={{flex:1,fontFamily:'monospace',fontSize:12,color:'#fff',wordBreak:'break-all',lineHeight:1.5}}>{showFull?addr.address:short}</span>
          <div style={{display:'flex',gap:5,flexShrink:0}}>
            <button onClick={()=>setShowFull(v=>!v)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:26,height:26,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,cursor:'pointer'}}>
              {showFull?<EyeOff size={12} color="rgba(255,255,255,.4)"/>:<Eye size={12} color="rgba(255,255,255,.4)"/>}
            </button>
            <CopyBtn text={addr.address}/>
          </div>
        </div>
        {addr.memo&&(
          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',borderRadius:8,padding:'7px 11px'}}>
            <span style={{fontSize:10,fontWeight:700,color:'#f59e0b',whiteSpace:'nowrap'}}>{NETWORKS[addr.network]?.memoLabel??'Memo'}:</span>
            <span style={{fontFamily:'monospace',fontSize:12,color:'#fff',fontWeight:600}}>{addr.memo}</span>
            <CopyBtn text={addr.memo}/>
          </div>
        )}
        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'rgba(255,255,255,.35)',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:7,padding:'4px 9px'}}>Min: <strong style={{color:'rgba(255,255,255,.65)'}}>{addr.minimumDeposit} {cfg.coin}</strong></span>
          <span style={{fontSize:11,color:'rgba(255,255,255,.35)',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:7,padding:'4px 9px'}}>Confirmations: <strong style={{color:'rgba(255,255,255,.65)'}}>{addr.confirmationsRequired}</strong></span>
        </div>
      </div>
      <div style={{padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',gap:7}}>
        <button onClick={()=>onToggle(addr)} style={{flex:1,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,background:addr.isActive?'rgba(239,68,68,.08)':'rgba(52,211,153,.08)',border:`1px solid ${addr.isActive?'rgba(239,68,68,.2)':'rgba(52,211,153,.2)'}`,borderRadius:9,padding:'8px',fontSize:12,fontWeight:700,color:addr.isActive?'#f87171':'#34d399',cursor:'pointer',fontFamily:'inherit'}}>
          {addr.isActive?<><ToggleLeft size={13}/> Hide</>:<><ToggleRight size={13}/> Show</>}
        </button>
        <button onClick={()=>onEdit(addr)} style={{flex:1,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:9,padding:'8px',fontSize:12,fontWeight:700,color:'#f59e0b',cursor:'pointer',fontFamily:'inherit'}}>
          <Pencil size={13}/> Edit
        </button>
        <button onClick={()=>onDelete(addr)} style={{width:36,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:9,padding:'8px',color:'#f87171',cursor:'pointer'}}>
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
}

export default function AdminCryptoPage() {
  const[addresses,setAddresses]=useState<CryptoAddress[]>([]);
  const[loading,setLoading]=useState(true);
  const[mounted,setMounted]=useState(false);
  const[showAdd,setShowAdd]=useState(false);
  const[editAddr,setEditAddr]=useState<CryptoAddress|null>(null);
  const[deleteAddr,setDeleteAddr]=useState<CryptoAddress|null>(null);
  const[toast,setToast]=useState('');
  const[filter,setFilter]=useState<'all'|'active'|'hidden'>('all');

  useEffect(()=>{setMounted(true);},[]);
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000);};

  const load=useCallback(async()=>{
    setLoading(true);
    try{const res=await adminApi.get('/admin/crypto/addresses');const raw=res.data.data??res.data;setAddresses(Array.isArray(raw)?raw:[]);}
    catch{}finally{setLoading(false);}
  },[]);

  useEffect(()=>{if(mounted)load();},[mounted]);

  const handleToggle=async(addr:CryptoAddress)=>{
    try{
      await adminApi.put('/admin/crypto/addresses',{network:addr.network,coin:addr.coin,address:addr.address,label:addr.label,memo:addr.memo,isActive:!addr.isActive,minimumDeposit:addr.minimumDeposit,confirmationsRequired:addr.confirmationsRequired});
      showToast(`${NETWORKS[addr.network]?.name??addr.network} ${!addr.isActive?'shown to':'hidden from'} users`);
      load();
    }catch(e:any){showToast(e.response?.data?.message||'Failed');}
  };

  if(!mounted)return null;

  const filtered=filter==='all'?addresses:filter==='active'?addresses.filter(a=>a.isActive):addresses.filter(a=>!a.isActive);
  const activeCount=addresses.filter(a=>a.isActive).length;

  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,fontFamily:'Inter,system-ui,sans-serif'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:'clamp(18px,3vw,26px)',fontWeight:800,color:'#fff',margin:'0 0 4px',letterSpacing:'-.5px'}}>Crypto Addresses</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,.38)',margin:0}}>{activeCount} live · {addresses.length} total — shown to users on deposit page</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:38,height:38,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.09)',borderRadius:10,color:'rgba(255,255,255,.55)',cursor:'pointer'}}>
            <RefreshCw size={14} style={{animation:loading?'spin 1s linear infinite':'none'}}/>
          </button>
          <button onClick={()=>setShowAdd(true)} style={{display:'inline-flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#050d1a',border:'none',borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
            <Plus size={15}/> Add Address
          </button>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'flex-start',gap:12,background:'rgba(96,165,250,.07)',border:'1px solid rgba(96,165,250,.18)',borderRadius:14,padding:'14px 16px'}}>
        <Shield size={18} color="#60a5fa" style={{flexShrink:0,marginTop:1}}/>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#60a5fa',marginBottom:4}}>How this works</div>
          <div style={{fontSize:12,color:'rgba(96,165,250,.7)',lineHeight:1.7}}>Addresses you publish here appear on the <strong style={{color:'#93c5fd'}}>Crypto Deposits</strong> page for all users. Toggle <em>Live/Hidden</em> to control visibility without deleting. Users see the coin, address, minimum deposit, and confirmations required. Always verify addresses before publishing.</div>
        </div>
      </div>

      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {([['all','All',addresses.length],['active','Live',activeCount],['hidden','Hidden',addresses.length-activeCount]] as const).map(([val,label,count])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,border:filter===val?'1.5px solid rgba(245,158,11,.5)':'1px solid rgba(255,255,255,.08)',cursor:'pointer',fontFamily:'inherit',background:filter===val?'rgba(245,158,11,.12)':'rgba(255,255,255,.04)',color:filter===val?'#f59e0b':'rgba(255,255,255,.38)',transition:'all .15s'}}>
            {label} <span style={{background:filter===val?'rgba(245,158,11,.2)':'rgba(255,255,255,.08)',borderRadius:100,padding:'1px 6px',fontSize:10}}>{count}</span>
          </button>
        ))}
      </div>

      {loading&&addresses.length===0?(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:240,gap:10,color:'rgba(255,255,255,.3)',fontSize:13}}>
          <Loader2 size={20} color="#f59e0b" style={{animation:'spin 1s linear infinite'}}/> Loading addresses…
        </div>
      ):filtered.length===0?(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:220,gap:12,background:'rgba(255,255,255,.02)',border:'1px dashed rgba(255,255,255,.08)',borderRadius:18}}>
          <Coins size={36} color="rgba(255,255,255,.1)"/>
          <p style={{fontSize:14,color:'rgba(255,255,255,.3)',margin:0}}>{filter!=='all'?`No ${filter} addresses`:'No crypto addresses added yet'}</p>
          {filter==='all'&&<button onClick={()=>setShowAdd(true)} style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'9px 16px',fontSize:13,fontWeight:700,color:'#f59e0b',cursor:'pointer',fontFamily:'inherit'}}><Plus size={14}/> Add your first address</button>}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,310px),1fr))',gap:14}}>
          {filtered.map(addr=><AddressCard key={addr._id??addr.network} addr={addr} onEdit={setEditAddr} onDelete={setDeleteAddr} onToggle={handleToggle}/>)}
        </div>
      )}

      {showAdd&&<UpsertModal onClose={()=>setShowAdd(false)} onDone={()=>{showToast('Address published');load();}}/>}
      {editAddr&&<UpsertModal existing={editAddr} onClose={()=>setEditAddr(null)} onDone={()=>{showToast('Address updated');load();}}/>}
      {deleteAddr&&<DeleteConfirm addr={deleteAddr} onClose={()=>setDeleteAddr(null)} onDone={()=>{showToast('Address removed');load();}}/>}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#111826',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'12px 22px',fontSize:13,fontWeight:600,color:'#34d399',whiteSpace:'nowrap',boxShadow:'0 8px 30px rgba(0,0,0,.5)',zIndex:9999}}>✓ {toast}</div>}

      <style>{`*,*::before,*::after{box-sizing:border-box;}@keyframes spin{to{transform:rotate(360deg);}}select option{background:#1a2235;color:#fff;}`}</style>
    </div>
  );
}