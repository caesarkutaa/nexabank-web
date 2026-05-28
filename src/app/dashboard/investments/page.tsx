'use client';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Search, Plus, Loader2, X, BarChart3, AlertCircle, ChevronDown, RefreshCw, Shield, Clock, Copy, CheckCircle, ChevronUp, Info, Coins } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface StockPosition { _id:string;symbol:string;companyName:string;shares:number;buyPrice:number;currentPrice:number;totalInvested:number;currentValue:number;profitLoss:number;profitLossPercent:number;action:'buy'|'sell';orderStatus:string;referenceNumber:string;createdAt:string; }
interface StockSummary { totalInvested:number;totalValue:number;totalProfitLoss:number;totalProfitLossPct:number;positionCount:number; }
interface CryptoPosition { _id:string;symbol:string;coinName:string;amountUSD:number;cryptoAmount:number;buyPrice:number;currentPrice:number;currentValue:number;profitLoss:number;profitLossPercent:number;action:'buy'|'sell';orderStatus:string;referenceNumber:string;createdAt:string; }
interface CryptoSummary { totalInvested:number;totalValue:number;totalProfitLoss:number;totalProfitLossPct:number;positionCount:number; }
interface Account { _id:string;accountNumber:string;accountType:string;nickname?:string;availableBalance:number;currency:string;status:string; }
interface StockQuote { symbol:string;askPrice:number;bidPrice:number;midPrice:number; }
interface DepositAddress { _id:string;network:string;coin:string;address:string;label?:string;memo?:string;isActive:boolean;minimumDeposit?:number;confirmationsRequired?:number; }

const COINS:Record<string,{name:string;color:string;bg:string;icon:string}> = {
  BTC:{name:'Bitcoin',color:'#f7931a',bg:'rgba(247,147,26,.15)',icon:'₿'},ETH:{name:'Ethereum',color:'#627eea',bg:'rgba(98,126,234,.15)',icon:'Ξ'},
  SOL:{name:'Solana',color:'#9945ff',bg:'rgba(153,69,255,.15)',icon:'◎'},BNB:{name:'BNB',color:'#f3ba2f',bg:'rgba(243,186,47,.15)',icon:'◆'},
  ADA:{name:'Cardano',color:'#0033ad',bg:'rgba(0,51,173,.15)',icon:'₳'},AVAX:{name:'Avalanche',color:'#e84142',bg:'rgba(232,65,66,.15)',icon:'A'},
  DOGE:{name:'Dogecoin',color:'#c2a633',bg:'rgba(194,166,51,.15)',icon:'Ð'},MATIC:{name:'Polygon',color:'#8247e5',bg:'rgba(130,71,229,.15)',icon:'M'},
  LTC:{name:'Litecoin',color:'#bfbbbb',bg:'rgba(191,187,187,.12)',icon:'Ł'},XRP:{name:'XRP',color:'#0085c0',bg:'rgba(0,133,192,.15)',icon:'✕'},
};
const NET_CFG:Record<string,{color:string;bg:string;icon:string;desc:string}> = {
  bitcoin:{color:'#f7931a',bg:'rgba(247,147,26,.12)',icon:'₿',desc:'Bitcoin Network'},ethereum:{color:'#627eea',bg:'rgba(98,126,234,.12)',icon:'Ξ',desc:'Ethereum (ERC-20)'},
  tron:{color:'#eb0029',bg:'rgba(235,0,41,.12)',icon:'T',desc:'Tron Network'},usdt_trc20:{color:'#26a17b',bg:'rgba(38,161,123,.12)',icon:'₮',desc:'USDT on TRON'},
  usdt_erc20:{color:'#26a17b',bg:'rgba(38,161,123,.1)',icon:'₮',desc:'USDT on Ethereum'},usdc_erc20:{color:'#2775ca',bg:'rgba(39,117,202,.12)',icon:'$',desc:'USDC on Ethereum'},
  bnb:{color:'#f3ba2f',bg:'rgba(243,186,47,.12)',icon:'◆',desc:'BNB Smart Chain'},solana:{color:'#9945ff',bg:'rgba(153,69,255,.12)',icon:'◎',desc:'Solana Network'},
  litecoin:{color:'#bebebe',bg:'rgba(190,190,190,.1)',icon:'Ł',desc:'Litecoin Network'},ripple:{color:'#0085c0',bg:'rgba(0,133,192,.12)',icon:'✕',desc:'XRP Ledger'},
};

const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(n??0);
const fmtPct=(n:number)=>`${n>=0?'+':''}${n.toFixed(2)}%`;
function fmtC(n:number,cur:string){try{return new Intl.NumberFormat(undefined,{style:'currency',currency:cur||'USD',minimumFractionDigits:2}).format(n??0);}catch{return `${cur} ${(n??0).toFixed(2)}`;}}
function fmtCrypto(n:number,sym:string){return `${n.toFixed(['BTC','ETH'].includes(sym)?6:4)} ${sym}`;}
const POP_STOCKS=['AAPL','MSFT','GOOGL','AMZN','TSLA','META','NVDA','NFLX','SPY','QQQ'];

function PendingBadge(){return(<span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(245,158,11,.15)',border:'1px solid rgba(245,158,11,.3)',color:'#f59e0b',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,whiteSpace:'nowrap'}}><Clock size={9}/> Pending Approval</span>);}

function StockTradeModal({mode,position,accounts,onClose,onDone}:{mode:'buy'|'sell';position?:StockPosition;accounts:Account[];onClose:()=>void;onDone:()=>void;}){
  const [symbol,setSymbol]=useState(position?.symbol??'');
  const [shares,setShares]=useState('');
  const [accountId,setAccountId]=useState(accounts[0]?._id??'');
  const [quote,setQuote]=useState<StockQuote|null>(null);
  const [fetching,setFetching]=useState(false);
  const [loading,setLoading]=useState(false);
  const selAcc=accounts.find(a=>a._id===accountId);
  const acctCur=selAcc?.currency||'USD';
  const sharesNum=parseFloat(shares)||0;
  const price=quote?.midPrice??0;
  const total=+(sharesNum*price).toFixed(2);
  const fee=+(total*0.001).toFixed(2);
  const totalDebit=+(total+fee).toFixed(2);
  const fetchQuote=async(sym:string)=>{if(!sym.trim())return;setFetching(true);try{const res=await api.get(`/investments/quote/${sym.trim().toUpperCase()}`);setQuote(res.data.data??res.data);}catch{toast.error('Symbol not found');setQuote(null);}finally{setFetching(false);}};
  const submit=async()=>{
    if(!symbol.trim())return toast.error('Enter a symbol');
    if(!sharesNum||sharesNum<=0)return toast.error('Enter valid shares');
    setLoading(true);
    try{
      if(mode==='buy'){await api.post('/investments/buy',{symbol:symbol.toUpperCase(),shares:sharesNum,accountId});}
      else{await api.post('/investments/sell',{investmentId:position!._id,sharesToSell:sharesNum,accountId});}
      toast.success(mode==='buy'?'Buy order placed — pending admin approval!':'Sell order placed!');onDone();onClose();
    }catch(e:any){toast.error(e.response?.data?.message||'Order failed');}finally{setLoading(false);}
  };
  return(
    <div className="nx-over" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="nx-modal">
        <div className="nx-mhdr"><h3 className="nx-mtitle" style={{color:mode==='buy'?'#34d399':'#f87171'}}>{mode==='buy'?'📈 Buy Stock':'📉 Sell Stock'}</h3><button className="nx-xbtn" onClick={onClose}><X size={16}/></button></div>
        {mode==='buy'&&<div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'rgba(245,158,11,.9)'}}><Clock size={13} color="#f59e0b" style={{flexShrink:0}}/>Orders are reviewed before filling. Funds reserved immediately and released if rejected.</div>}
        <div className="nx-fg">
          <label className="nx-lbl">Stock Symbol</label>
          <div style={{display:'flex',gap:8}}>
            <input className="nx-inp" style={{flex:1,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'monospace',fontWeight:700}} value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder="e.g. AAPL" disabled={!!position} onKeyDown={e=>e.key==='Enter'&&fetchQuote(symbol)}/>
            <button className="nx-actbtn" onClick={()=>fetchQuote(symbol)} disabled={fetching||!symbol.trim()}>{fetching?<Loader2 size={13} className="nx-spin"/>:<Search size={13}/>}</button>
          </div>
          {!position&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>{POP_STOCKS.slice(0,6).map(s=><button key={s} onClick={()=>{setSymbol(s);fetchQuote(s);}} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.6)',fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:7,cursor:'pointer',fontFamily:'monospace'}}>{s}</button>)}</div>}
        </div>
        {quote&&<div style={{background:'rgba(52,211,153,.08)',border:'1px solid rgba(52,211,153,.2)',borderRadius:12,padding:14}}><div style={{display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:3}}>{quote.symbol}</div><div style={{fontSize:22,fontWeight:800,color:'white',fontFamily:'monospace'}}>{usd(quote.midPrice)}</div></div><div style={{textAlign:'right',fontSize:12,color:'rgba(255,255,255,.4)'}}><div>Bid: <span style={{color:'#f87171',fontFamily:'monospace'}}>{usd(quote.bidPrice)}</span></div><div>Ask: <span style={{color:'#34d399',fontFamily:'monospace'}}>{usd(quote.askPrice)}</span></div></div></div></div>}
        <div className="nx-fg"><label className="nx-lbl">{mode==='sell'&&position?`Shares to Sell (own ${position.shares})`:'Number of Shares'}</label><input className="nx-inp" type="number" min="0.01" step="0.01" value={shares} onChange={e=>setShares(e.target.value)} placeholder="e.g. 10"/></div>
        <div className="nx-fg"><label className="nx-lbl">{mode==='buy'?'Fund From':'Credit To'} Account</label><div className="nx-selwrap"><select className="nx-sel" value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a._id} value={a._id}>[{a.currency||'USD'}] {a.nickname||a.accountType?.replace(/_/g,' ')} ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance,a.currency||'USD')}</option>)}</select><ChevronDown size={13} className="nx-sel-ico"/></div></div>
        {sharesNum>0&&price>0&&<div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 15px'}}>{[{l:`${sharesNum} × ${usd(price)}`,v:usd(total)},{l:'Fee 0.1%',v:usd(fee)},{l:`Total`,v:usd(mode==='buy'?totalDebit:+(total-fee).toFixed(2)),bold:true}].map(({l,v,bold})=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span style={{color:'rgba(255,255,255,.45)'}}>{l}</span><span style={{fontFamily:'monospace',fontWeight:bold?700:500,color:bold?'white':'rgba(255,255,255,.65)'}}>{v}</span></div>)}{mode==='buy'&&selAcc&&totalDebit>selAcc.availableBalance&&<div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,color:'#f87171',fontSize:12}}><AlertCircle size={13}/> Insufficient</div>}</div>}
        <button className="nx-subbtn" style={{background:mode==='buy'?'linear-gradient(135deg,#059669,#34d399)':'linear-gradient(135deg,#dc2626,#f87171)'}} onClick={submit} disabled={loading||!symbol.trim()||!sharesNum||sharesNum<=0||(mode==='buy'&&!!selAcc&&totalDebit>selAcc.availableBalance)}>{loading?<><Loader2 size={15} className="nx-spin"/> Placing…</>:mode==='buy'?'Place Buy Order':'Sell Shares'}</button>
      </div>
    </div>
  );
}

function CryptoTradeModal({mode,position,accounts,rates,onClose,onDone}:{mode:'buy'|'sell';position?:CryptoPosition;accounts:Account[];rates:Record<string,number>;onClose:()=>void;onDone:()=>void;}){
  const [coin,setCoin]=useState(position?.symbol??'BTC');
  const [amountUSD,setAmountUSD]=useState('');
  const [accountId,setAccountId]=useState(accounts[0]?._id??'');
  const [loading,setLoading]=useState(false);
  const selAcc=accounts.find(a=>a._id===accountId);
  const acctCur=selAcc?.currency||'USD';
  const cfg=COINS[coin]??COINS.BTC;
  const rate=rates[coin]??0;
  const amtNum=parseFloat(amountUSD)||0;
  const cryptoAmt=rate>0?+(amtNum/rate).toFixed(8):0;
  const fee=+(amtNum*0.001).toFixed(2);
  const totalCost=+(amtNum+fee).toFixed(2);
  const insuf=!!selAcc&&totalCost>selAcc.availableBalance;
  const sellRate=rates[position?.symbol??'BTC']??0;
  const sellValue=position?+(position.cryptoAmount*sellRate).toFixed(2):0;
  const sellFee=+(sellValue*0.001).toFixed(2);
  const sellProceeds=+(sellValue-sellFee).toFixed(2);
  const submit=async()=>{
    if(!accountId)return toast.error('Select an account');
    setLoading(true);
    try{
      if(mode==='buy'){if(!amtNum||amtNum<=0){setLoading(false);return toast.error('Enter amount');}if(insuf){setLoading(false);return toast.error('Insufficient funds');}await api.post('/crypto/invest/buy',{symbol:coin,amountUSD:amtNum,accountId});toast.success('Buy order placed — pending admin approval!');}
      else{await api.post('/crypto/invest/sell',{investmentId:position!._id,accountId});toast.success(`Sold ${position?.symbol} position!`);}
      onDone();onClose();
    }catch(e:any){toast.error(e.response?.data?.message||'Order failed');}finally{setLoading(false);}
  };
  return(
    <div className="nx-over" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="nx-modal">
        <div className="nx-mhdr"><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:38,height:38,borderRadius:10,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:cfg.color,fontFamily:'monospace'}}>{cfg.icon}</div><h3 className="nx-mtitle" style={{color:mode==='buy'?'#34d399':'#f87171'}}>{mode==='buy'?'Buy Crypto':'Sell Crypto'}</h3></div><button className="nx-xbtn" onClick={onClose}><X size={16}/></button></div>
        {mode==='buy'&&<div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'rgba(245,158,11,.9)'}}><Clock size={13} color="#f59e0b" style={{flexShrink:0}}/>Orders reviewed before filling. Funds reserved immediately.</div>}
        {mode==='sell'&&position&&<>
          <div style={{background:cfg.bg,border:`1px solid ${cfg.color}30`,borderRadius:14,padding:'16px 18px'}}><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:6}}>Selling entire position</div><div style={{fontSize:22,fontWeight:800,color:cfg.color,fontFamily:'monospace',marginBottom:4}}>{fmtCrypto(position.cryptoAmount,position.symbol)}</div><div style={{marginTop:8,fontSize:13,fontWeight:700,color:position.profitLoss>=0?'#34d399':'#f87171'}}>P&L: {position.profitLoss>=0?'+':''}{usd(position.profitLoss)} ({fmtPct(position.profitLossPercent)})</div></div>
          <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 15px'}}>{[{l:'Rate',v:`${usd(sellRate)} / ${position.symbol}`},{l:'Gross',v:usd(sellValue)},{l:'Fee 0.1%',v:usd(sellFee)},{l:'You Receive',v:usd(sellProceeds),bold:true}].map(({l,v,bold})=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span style={{color:'rgba(255,255,255,.45)'}}>{l}</span><span style={{fontFamily:'monospace',fontWeight:bold?700:500,color:bold?'#fff':'rgba(255,255,255,.65)'}}>{v}</span></div>)}</div>
          <div className="nx-fg"><label className="nx-lbl">Credit To Account</label><div className="nx-selwrap"><select className="nx-sel" value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a._id} value={a._id}>[{a.currency||'USD'}] ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance,a.currency||'USD')}</option>)}</select><ChevronDown size={13} className="nx-sel-ico"/></div></div>
          <button className="nx-subbtn" style={{background:'linear-gradient(135deg,#dc2626,#f87171)'}} onClick={submit} disabled={loading}>{loading?<><Loader2 size={15} className="nx-spin"/> Selling…</>:`Sell ${position.symbol} — Receive ${usd(sellProceeds)}`}</button>
        </>}
        {mode==='buy'&&<>
          <div className="nx-fg"><label className="nx-lbl">Select Coin</label><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(85px,1fr))',gap:7}}>{Object.entries(COINS).map(([sym,c])=>{const active=coin===sym;const r=rates[sym];return(<button key={sym} onClick={()=>setCoin(sym)} style={{padding:'9px 4px',borderRadius:10,border:`${active?1.5:1}px solid ${active?c.color+'80':'rgba(255,255,255,.1)'}`,background:active?c.bg:'rgba(255,255,255,.02)',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><span style={{fontSize:16,fontWeight:900,color:active?c.color:'rgba(255,255,255,.45)',fontFamily:'monospace'}}>{c.icon}</span><span style={{fontSize:9,fontWeight:800,color:active?c.color:'rgba(255,255,255,.4)'}}>{sym}</span>{r>0&&<span style={{fontSize:8,color:'rgba(255,255,255,.3)',fontFamily:'monospace'}}>{r>=1000?`$${(r/1000).toFixed(1)}k`:`$${r.toFixed(2)}`}</span>}</button>);})}</div></div>
          {rate>0&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:cfg.bg,border:`1px solid ${cfg.color}30`,borderRadius:11,padding:'11px 14px'}}><div><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:2}}>{cfg.name} · Live</div><div style={{fontSize:20,fontWeight:800,color:cfg.color,fontFamily:'monospace'}}>{usd(rate)}</div></div>{amtNum>0&&<div style={{textAlign:'right'}}><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:2}}>You get</div><div style={{fontSize:16,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{fmtCrypto(cryptoAmt,coin)}</div></div>}</div>}
          <div className="nx-fg"><label className="nx-lbl">Amount (USD)</label><div style={{position:'relative'}}><span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,.4)',fontSize:14,fontWeight:700,pointerEvents:'none',fontFamily:'monospace'}}>$</span><input className="nx-inp" type="number" min="1" step="0.01" value={amountUSD} onChange={e=>setAmountUSD(e.target.value)} placeholder="500" style={{paddingLeft:28,fontSize:18,fontWeight:700,fontFamily:'monospace'}}/></div><div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>{[50,100,250,500,1000].map(amt=><button key={amt} onClick={()=>setAmountUSD(String(amt))} style={{background:amountUSD===String(amt)?'rgba(245,158,11,.15)':'rgba(255,255,255,.05)',border:`1px solid ${amountUSD===String(amt)?'rgba(245,158,11,.4)':'rgba(255,255,255,.1)'}`,color:amountUSD===String(amt)?'#f59e0b':'rgba(255,255,255,.5)',fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:7,cursor:'pointer',fontFamily:'monospace'}}>${amt}</button>)}</div>{insuf&&<span style={{fontSize:12,color:'#f87171',display:'flex',alignItems:'center',gap:5}}><AlertCircle size={12}/> Insufficient</span>}</div>
          <div className="nx-fg"><label className="nx-lbl">Fund From Account</label><div className="nx-selwrap"><select className="nx-sel" value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a._id} value={a._id}>[{a.currency||'USD'}] ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance,a.currency||'USD')}</option>)}</select><ChevronDown size={13} className="nx-sel-ico"/></div></div>
          <button className="nx-subbtn" style={{background:'linear-gradient(135deg,#059669,#34d399)'}} onClick={submit} disabled={loading||!amtNum||amtNum<=0||insuf}>{loading?<><Loader2 size={15} className="nx-spin"/> Placing…</>:`Buy ${coin} — ${amtNum>0?fmtCrypto(cryptoAmt,coin):'...'}`}</button>
        </>}
      </div>
    </div>
  );
}

function DepositCard({addr}:{addr:DepositAddress}){
  const cfg=NET_CFG[addr.network]??{color:'#f59e0b',bg:'rgba(245,158,11,.1)',icon:'●',desc:addr.network};
  const [copied,setCopied]=useState(false);const [copiedMemo,setCopiedMemo]=useState(false);const [expanded,setExpanded]=useState(false);
  return(
    <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,overflow:'hidden'}} onMouseEnter={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.14)')} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.08)')}>
      <div style={{padding:'18px 20px 14px',background:`linear-gradient(135deg,${cfg.bg},transparent)`}}><div style={{display:'flex',alignItems:'center',gap:14}}><div style={{width:50,height:50,borderRadius:14,background:cfg.bg,border:`1px solid ${cfg.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:cfg.color,flexShrink:0,fontFamily:'monospace'}}>{cfg.icon}</div><div><div style={{fontSize:18,fontWeight:800,color:'#fff'}}>{addr.coin}</div><div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:2}}>{cfg.desc}</div></div></div></div>
      <div style={{padding:'0 20px 16px'}}>
        <div style={{background:'rgba(0,0,0,.35)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:8}}><span style={{flex:1,fontFamily:'monospace',fontSize:13,color:'#fff',wordBreak:'break-all',lineHeight:1.6}}>{addr.address}</span><button onClick={()=>{navigator.clipboard.writeText(addr.address);setCopied(true);setTimeout(()=>setCopied(false),2000);toast.success('Copied');}} style={{display:'inline-flex',alignItems:'center',gap:5,background:copied?'rgba(52,211,153,.15)':'rgba(245,158,11,.1)',border:`1px solid ${copied?'rgba(52,211,153,.3)':'rgba(245,158,11,.25)'}`,borderRadius:9,padding:'7px 11px',fontSize:12,fontWeight:700,color:copied?'#34d399':'#f59e0b',cursor:'pointer',fontFamily:'inherit',flexShrink:0,whiteSpace:'nowrap'}}>{copied?<CheckCircle size={13}/>:<Copy size={13}/>} {copied?'Copied':'Copy'}</button></div>
        {addr.memo&&<div style={{marginTop:8,background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',borderRadius:11,padding:'10px 14px',marginBottom:8}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:'#f59e0b',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>⚠️ Memo Required</div><div style={{fontFamily:'monospace',fontSize:15,fontWeight:800,color:'#fff'}}>{addr.memo}</div></div><button onClick={()=>{navigator.clipboard.writeText(addr.memo!);setCopiedMemo(true);setTimeout(()=>setCopiedMemo(false),2000);toast.success('Copied');}} style={{display:'inline-flex',alignItems:'center',gap:5,background:copiedMemo?'rgba(52,211,153,.15)':'rgba(245,158,11,.12)',border:`1px solid ${copiedMemo?'rgba(52,211,153,.3)':'rgba(245,158,11,.25)'}`,borderRadius:8,padding:'7px 10px',fontSize:12,fontWeight:700,color:copiedMemo?'#34d399':'#f59e0b',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>{copiedMemo?<CheckCircle size={12}/>:<Copy size={12}/>} Copy</button></div></div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}><span style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,padding:'6px 11px',fontSize:11,color:'rgba(255,255,255,.35)'}}>Min: <strong style={{color:'#fff',fontFamily:'monospace',marginLeft:2}}>{addr.minimumDeposit} {addr.coin}</strong></span><span style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:8,padding:'6px 11px',fontSize:11,color:'rgba(255,255,255,.35)'}}><Clock size={11}/> Confirms: <strong style={{color:'#fff',marginLeft:2}}>{addr.confirmationsRequired}</strong></span></div>
        <button onClick={()=>setExpanded(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',padding:'4px 0',color:'rgba(255,255,255,.4)',fontSize:12,fontWeight:600,fontFamily:'inherit'}}><Info size={13}/> How to deposit {expanded?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</button>
        {expanded&&<div style={{marginTop:8,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:'13px 14px'}}><ol style={{margin:0,padding:'0 0 0 16px',display:'flex',flexDirection:'column',gap:8}}>{[`Copy the ${addr.coin} address above`,'Open your external wallet','Paste as recipient',addr.memo?`Include Memo: ${addr.memo} (required)`:null,`Send minimum ${addr.minimumDeposit} ${addr.coin}`,`Balance updates after ${addr.confirmationsRequired} confirmations`].filter(Boolean).map((s,i)=><li key={i} style={{fontSize:12,color:'rgba(255,255,255,.55)',lineHeight:1.6}}>{s}</li>)}</ol></div>}
      </div>
    </div>
  );
}

export default function InvestmentsPage(){
  type Tab='stocks'|'crypto'|'deposit';
  const [mounted,setMounted]=useState(false);
  const [tab,setTab]=useState<Tab>('stocks');
  const [stockPos,setStockPos]=useState<StockPosition[]>([]);const [stockSum,setStockSum]=useState<StockSummary|null>(null);const [stockLoad,setStockLoad]=useState(true);
  const [buyingStock,setBuyingStock]=useState(false);const [sellStockPos,setSellStockPos]=useState<StockPosition|null>(null);
  const [cryptoPos,setCryptoPos]=useState<CryptoPosition[]>([]);const [cryptoSum,setCryptoSum]=useState<CryptoSummary|null>(null);const [cryptoLoad,setCryptoLoad]=useState(false);
  const [rates,setRates]=useState<Record<string,number>>({});const [rateLoad,setRateLoad]=useState(false);
  const [buyingCrypto,setBuyingCrypto]=useState(false);const [sellCryptoPos,setSellCryptoPos]=useState<CryptoPosition|null>(null);
  const [depAddrs,setDepAddrs]=useState<DepositAddress[]>([]);const [depLoad,setDepLoad]=useState(false);const [depFilter,setDepFilter]=useState('all');
  const [accounts,setAccounts]=useState<Account[]>([]);const [refreshing,setRefreshing]=useState(false);
  useEffect(()=>{setMounted(true);},[]);
  const loadStocks=useCallback(async()=>{setStockLoad(true);try{const[pR,aR]=await Promise.all([api.get('/investments/portfolio'),api.get('/accounts')]);const p=pR.data.data??pR.data;setStockPos(p.positions??[]);setStockSum(p.summary??null);setAccounts((aR.data.data||[]).filter((a:Account)=>a.status==='active'));}catch{toast.error('Failed to load portfolio');}finally{setStockLoad(false);}},[]); 
  const loadCrypto=useCallback(async()=>{setCryptoLoad(true);try{const[rR,pR]=await Promise.all([api.get('/crypto/rates'),api.get('/crypto/invest/portfolio')]);setRates(rR.data.data??rR.data??{});const p=pR.data.data??pR.data;setCryptoPos(p.positions??[]);setCryptoSum(p.summary??null);}catch{try{const rR=await api.get('/crypto/rates');setRates(rR.data.data??rR.data??{});}catch{}}finally{setCryptoLoad(false);}},[]); 
  const loadDeposit=useCallback(async()=>{setDepLoad(true);try{const res=await api.get('/crypto/addresses');const raw=res.data.data??res.data;setDepAddrs(Array.isArray(raw)?raw.filter((a:DepositAddress)=>a.isActive):[]);}catch{toast.error('Failed to load addresses');}finally{setDepLoad(false);}},[]); 
  useEffect(()=>{if(mounted)loadStocks();},[mounted,loadStocks]);
  useEffect(()=>{if(mounted&&tab==='crypto')loadCrypto();},[mounted,tab,loadCrypto]);
  useEffect(()=>{if(mounted&&tab==='deposit')loadDeposit();},[mounted,tab,loadDeposit]);
  const refresh=async()=>{setRefreshing(true);if(tab==='stocks')await loadStocks();if(tab==='crypto')await loadCrypto();if(tab==='deposit')await loadDeposit();setRefreshing(false);};
  if(!mounted)return<div style={{minHeight:'100vh',background:'#0a0f1a'}}/>;

  // Show pending AND filled positions
  const stockHoldings=stockPos.filter(p=>p.action==='buy'&&(p.orderStatus==='filled'||p.orderStatus==='pending'));
  const pendingStocks=stockHoldings.filter(p=>p.orderStatus==='pending').length;
  const cryptoHoldings=cryptoPos.filter(p=>p.action==='buy'&&(p.orderStatus==='filled'||p.orderStatus==='pending'));
  const pendingCrypto=cryptoHoldings.filter(p=>p.orderStatus==='pending').length;
  const sPnl=stockSum?.totalProfitLoss??0;const sPct=stockSum?.totalProfitLossPct??0;
  const cPnl=cryptoSum?.totalProfitLoss??0;const cPct=cryptoSum?.totalProfitLossPct??0;
  const depCoins=['all',...Array.from(new Set(depAddrs.map(a=>a.coin)))];
  const filteredDep=depFilter==='all'?depAddrs:depAddrs.filter(a=>a.coin===depFilter);

  return(
    <div className="pg">
      <div className="hdr">
        <div><h1 className="ttl">Investments</h1><p className="sub">Stocks · Crypto · Deposits</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="nx-actbtn" onClick={refresh} disabled={refreshing}><RefreshCw size={14} className={refreshing?'nx-spin':''}/></button>
          {tab==='stocks'&&<button className="addbtn" onClick={()=>setBuyingStock(true)} disabled={accounts.length===0}><Plus size={15}/> Buy Stock</button>}
          {tab==='crypto'&&<button className="addbtn" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#050d1a'}} onClick={()=>setBuyingCrypto(true)} disabled={accounts.length===0}><Plus size={15}/> Buy Crypto</button>}
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:24,overflowX:'auto',paddingBottom:2}}>
        {([['stocks','📈','Stocks'],['crypto','₿','Crypto'],['deposit','⬇','Deposit']]as const).map(([id,emoji,label])=>(
          <button key={id} onClick={()=>setTab(id as Tab)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:11,fontSize:13,fontWeight:700,border:tab===id?'none':'1px solid rgba(255,255,255,.09)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,background:tab===id?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,.04)',color:tab===id?'#050d1a':'rgba(255,255,255,.5)',transition:'all .15s'}}><span>{emoji}</span> {label}</button>
        ))}
      </div>

      {tab==='stocks'&&<>
        {pendingStocks>0&&<div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:12,padding:'12px 16px',marginBottom:16}}><Clock size={15} color="#f59e0b" style={{flexShrink:0}}/><p style={{fontSize:13,color:'#f59e0b',margin:0,fontWeight:600}}>{pendingStocks} stock order{pendingStocks!==1?'s':''} pending admin approval — funds reserved, released if rejected.</p></div>}
        <div className="port-card"><div className="port-inner"><div><div className="pc-label">Portfolio Value <span style={{fontSize:10,background:'rgba(96,165,250,.12)',border:'1px solid rgba(96,165,250,.2)',color:'#60a5fa',padding:'1px 7px',borderRadius:100,marginLeft:8,fontWeight:700}}>USD</span></div><div className="pc-value">{stockLoad?'—':usd(stockSum?.totalValue??0)}</div>{stockSum&&<div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}><span style={{color:sPnl>=0?'#34d399':'#f87171',fontSize:14,fontWeight:700,fontFamily:'monospace'}}>{sPnl>=0?'+':''}{usd(sPnl)}</span><span style={{color:sPnl>=0?'#34d399':'#f87171',fontSize:13}}>({fmtPct(sPct)})</span><span style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>P&L</span></div>}</div><div className="pc-stats"><div className="pc-stat"><div className="pc-stat-l">Invested</div><div className="pc-stat-v">{stockLoad?'—':usd(stockSum?.totalInvested??0)}</div></div><div className="pc-stat"><div className="pc-stat-l">Positions</div><div className="pc-stat-v">{stockHoldings.length}</div></div></div></div></div>
        <div className="sec-title">My Stock Holdings {stockHoldings.length>0&&<span style={{fontSize:12,color:'rgba(255,255,255,.35)',fontWeight:500,marginLeft:8}}>{stockHoldings.length} position{stockHoldings.length!==1?'s':''}</span>}</div>
        {stockLoad?<div className="cen"><Loader2 size={20} className="nx-spin"/> Loading…</div>:stockHoldings.length===0?<div className="empty"><BarChart3 size={40} color="rgba(255,255,255,.12)"/><p>No positions yet. Buy your first stock above.</p></div>:
        <div className="pos-list">
          <div className="pos-hdr"><span>Stock</span><span>Shares</span><span>Buy Price</span><span>Current</span><span>Value</span><span>P&L</span><span></span></div>
          {stockHoldings.map(pos=>{const pl=pos.profitLoss??0;const plPct=pos.profitLossPercent??0;const isUp=pl>=0;const isPending=pos.orderStatus==='pending';return(
            <div key={pos._id} className="pos-row" style={{background:isPending?'rgba(245,158,11,.03)':undefined,borderLeft:isPending?'3px solid rgba(245,158,11,.4)':undefined}}>
              <div className="pos-sym-cell"><div className="pos-ico" style={{background:isPending?'rgba(245,158,11,.12)':isUp?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)'}}>{isPending?<Clock size={14} color="#f59e0b"/>:isUp?<TrendingUp size={14} color="#34d399"/>:<TrendingDown size={14} color="#f87171"/>}</div>
                <div><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:14,fontWeight:700,color:'white',fontFamily:'monospace'}}>{pos.symbol}</span>{isPending&&<PendingBadge/>}</div><div style={{fontSize:11,color:'rgba(255,255,255,.35)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pos.companyName}</div><div className="pos-mob"><span>{pos.shares} sh @ {usd(pos.buyPrice)}</span>{isPending?<span style={{color:'#f59e0b',fontSize:11}}>Awaiting admin approval</span>:<span style={{color:isUp?'#34d399':'#f87171'}}>{isUp?'+':''}{usd(pl)} ({fmtPct(plPct)})</span>}</div></div>
              </div>
              <span className="pos-col">{pos.shares}</span>
              <span className="pos-col" style={{fontFamily:'monospace'}}>{usd(pos.buyPrice)}</span>
              <span className="pos-col" style={{fontFamily:'monospace'}}>{isPending?<span style={{color:'rgba(255,255,255,.3)'}}>Pending</span>:pos.currentPrice?usd(pos.currentPrice):'—'}</span>
              <span className="pos-col" style={{fontFamily:'monospace',fontWeight:700}}>{usd(isPending?pos.totalInvested:pos.currentValue)}</span>
              <span className="pos-col" style={{color:isPending?'rgba(245,158,11,.7)':isUp?'#34d399':'#f87171',fontFamily:'monospace',fontWeight:700}}>{isPending?<span style={{fontSize:11}}>Reserved</span>:<>{isUp?'+':''}{usd(pl)}<br/><span style={{fontSize:11}}>{fmtPct(plPct)}</span></>}</span>
              <span className="pos-col">{isPending?<span style={{fontSize:11,color:'rgba(245,158,11,.6)',whiteSpace:'nowrap'}}>⏳ Pending</span>:<button className="nx-actbtn" onClick={()=>setSellStockPos(pos)} style={{borderColor:'rgba(248,113,113,.25)',color:'#f87171',fontSize:12}}>Sell</button>}</span>
            </div>
          );})}
        </div>}
        <div className="disclaimer"><AlertCircle size={13} color="rgba(255,255,255,.35)"/><span>Investment products are not FDIC insured. Prices in USD via Yahoo Finance. Orders require admin approval before filling.</span></div>
      </>}

      {tab==='crypto'&&<>
        {pendingCrypto>0&&<div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:12,padding:'12px 16px',marginBottom:16}}><Clock size={15} color="#f59e0b" style={{flexShrink:0}}/><p style={{fontSize:13,color:'#f59e0b',margin:0,fontWeight:600}}>{pendingCrypto} crypto order{pendingCrypto!==1?'s':''} pending admin approval.</p></div>}
        <div className="port-card" style={{background:'linear-gradient(135deg,#1a0533,#0d1a2e)'}}><div className="port-inner"><div><div className="pc-label">Crypto Portfolio</div><div className="pc-value">{cryptoLoad?'—':usd(cryptoSum?.totalValue??0)}</div>{cryptoSum&&<div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}><span style={{color:cPnl>=0?'#34d399':'#f87171',fontSize:14,fontWeight:700,fontFamily:'monospace'}}>{cPnl>=0?'+':''}{usd(cPnl)}</span><span style={{color:cPnl>=0?'#34d399':'#f87171',fontSize:13}}>({fmtPct(cPct)})</span></div>}</div><div className="pc-stats"><div className="pc-stat"><div className="pc-stat-l">Invested</div><div className="pc-stat-v">{cryptoLoad?'—':usd(cryptoSum?.totalInvested??0)}</div></div><div className="pc-stat"><div className="pc-stat-l">Positions</div><div className="pc-stat-v">{cryptoHoldings.length}</div></div></div></div></div>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.6)'}}>Live Rates (USD)</span><button onClick={async()=>{setRateLoad(true);try{const r=await api.get('/crypto/rates');setRates(r.data.data??r.data??{});}catch{}finally{setRateLoad(false);}}} disabled={rateLoad} style={{display:'inline-flex',alignItems:'center',gap:5,background:'none',border:'none',fontSize:12,color:'rgba(255,255,255,.35)',cursor:'pointer',fontFamily:'inherit'}}><RefreshCw size={13} className={rateLoad?'nx-spin':''}/> Refresh</button></div>
          <div className="rates-grid">{Object.entries(COINS).map(([sym,c])=>{const rate=rates[sym]??0;return(<div key={sym} className="rate-card" style={{borderColor:`${c.color}20`}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><div style={{width:32,height:32,borderRadius:9,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:c.color,fontFamily:'monospace'}}>{c.icon}</div><span style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,.35)',letterSpacing:'0.08em'}}>{sym}</span></div><div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:3}}>{c.name}</div><div style={{fontSize:14,fontWeight:800,color:'#fff',fontFamily:'monospace'}}>{cryptoLoad||rateLoad?<Loader2 size={13} className="nx-spin" color={c.color}/>:rate>0?usd(rate):'—'}</div><button onClick={()=>setBuyingCrypto(true)} disabled={accounts.length===0} style={{marginTop:8,width:'100%',background:c.bg,border:`1px solid ${c.color}30`,borderRadius:7,padding:'6px 0',fontSize:11,fontWeight:700,color:c.color,cursor:'pointer',fontFamily:'inherit'}}>Buy {sym}</button></div>);})}</div>
        </div>
        <div className="sec-title">My Crypto Holdings {cryptoHoldings.length>0&&<span style={{fontSize:12,color:'rgba(255,255,255,.35)',fontWeight:500,marginLeft:8}}>{cryptoHoldings.length} position{cryptoHoldings.length!==1?'s':''}</span>}</div>
        {cryptoLoad?<div className="cen"><Loader2 size={20} className="nx-spin"/> Loading…</div>:cryptoHoldings.length===0?<div className="empty"><Coins size={40} color="rgba(255,255,255,.12)"/><p>No crypto positions yet. Buy above.</p></div>:
        <div className="pos-list">
          <div className="pos-hdr"><span>Coin</span><span>Amount</span><span>Buy Price</span><span>Current</span><span>Value</span><span>P&L</span><span></span></div>
          {cryptoHoldings.map(pos=>{const pl=pos.profitLoss??0;const plPct=pos.profitLossPercent??0;const isUp=pl>=0;const isPending=pos.orderStatus==='pending';const c=COINS[pos.symbol]??{color:'#f59e0b',bg:'rgba(245,158,11,.12)',icon:'●',name:pos.symbol};return(
            <div key={pos._id} className="pos-row" style={{background:isPending?'rgba(245,158,11,.03)':undefined,borderLeft:isPending?'3px solid rgba(245,158,11,.4)':undefined}}>
              <div className="pos-sym-cell"><div className="pos-ico" style={{background:c.bg}}>{isPending?<Clock size={14} color="#f59e0b"/>:<span style={{fontSize:16,fontWeight:900,color:c.color,fontFamily:'monospace'}}>{c.icon}</span>}</div>
                <div><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:14,fontWeight:700,color:'white',fontFamily:'monospace'}}>{pos.symbol}</span>{isPending&&<PendingBadge/>}</div><div style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>{c.name}</div><div className="pos-mob"><span>{fmtCrypto(pos.cryptoAmount,pos.symbol)}</span>{isPending?<span style={{color:'#f59e0b',fontSize:11}}>Awaiting approval</span>:<span style={{color:isUp?'#34d399':'#f87171'}}>{isUp?'+':''}{usd(pl)}</span>}</div></div>
              </div>
              <span className="pos-col" style={{fontFamily:'monospace',fontSize:12}}>{fmtCrypto(pos.cryptoAmount,pos.symbol)}</span>
              <span className="pos-col" style={{fontFamily:'monospace'}}>{usd(pos.buyPrice)}</span>
              <span className="pos-col" style={{fontFamily:'monospace'}}>{isPending?<span style={{color:'rgba(255,255,255,.3)'}}>Pending</span>:pos.currentPrice?usd(pos.currentPrice):'—'}</span>
              <span className="pos-col" style={{fontFamily:'monospace',fontWeight:700}}>{usd(isPending?pos.amountUSD:pos.currentValue)}</span>
              <span className="pos-col" style={{color:isPending?'rgba(245,158,11,.7)':isUp?'#34d399':'#f87171',fontFamily:'monospace',fontWeight:700}}>{isPending?<span style={{fontSize:11}}>Reserved</span>:<>{isUp?'+':''}{usd(pl)}<br/><span style={{fontSize:11}}>{fmtPct(plPct)}</span></>}</span>
              <span className="pos-col">{isPending?<span style={{fontSize:11,color:'rgba(245,158,11,.6)',whiteSpace:'nowrap'}}>⏳ Pending</span>:<button className="nx-actbtn" onClick={()=>setSellCryptoPos(pos)} style={{borderColor:'rgba(248,113,113,.25)',color:'#f87171',fontSize:12}}>Sell</button>}</span>
            </div>
          );})}
        </div>}
        <div className="disclaimer"><AlertCircle size={13} color="rgba(255,255,255,.35)"/><span>Crypto is highly volatile and not FDIC insured. Rates from CoinGecko. Admin approval required.</span></div>
      </>}

      {tab==='deposit'&&<div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.15)',borderRadius:14,padding:'14px 16px'}}><Shield size={17} color="#34d399" style={{flexShrink:0,marginTop:1}}/><div style={{fontSize:12,color:'rgba(52,211,153,.8)',lineHeight:1.7}}><strong style={{color:'#34d399'}}>Security:</strong> Only send matching coin. Wrong coin = permanent loss.</div></div>
        {depCoins.length>2&&<div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2}}>{depCoins.map(coin=>{const addr=depAddrs.find(a=>a.coin===coin);const cfg=addr?(NET_CFG[addr.network]??{color:'#f59e0b',bg:'rgba(245,158,11,.12)'}):({color:'rgba(255,255,255,.5)',bg:'rgba(255,255,255,.06)'});return<button key={coin} onClick={()=>setDepFilter(coin)} style={{padding:'8px 14px',borderRadius:10,fontSize:12,fontWeight:700,border:depFilter===coin?`1.5px solid ${cfg.color}55`:'1px solid rgba(255,255,255,.08)',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,background:depFilter===coin?cfg.bg:'rgba(255,255,255,.04)',color:depFilter===coin?cfg.color:'rgba(255,255,255,.38)',transition:'all .15s'}}>{coin==='all'?'All Coins':coin}</button>;})}</div>}
        {depLoad?<div className="cen"><Loader2 size={20} color="#f59e0b" className="nx-spin"/> Loading…</div>:filteredDep.length===0?<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:260,gap:12,background:'rgba(255,255,255,.02)',border:'1px dashed rgba(255,255,255,.08)',borderRadius:18,textAlign:'center',padding:24}}><Coins size={36} color="rgba(255,255,255,.15)"/><p style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,.4)',margin:'0 0 6px'}}>No deposit addresses available</p></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,340px),1fr))',gap:16}}>{filteredDep.map(addr=><DepositCard key={addr._id??addr.network} addr={addr}/>)}</div>}
      </div>}

      {buyingStock&&accounts.length>0&&<StockTradeModal mode="buy" accounts={accounts} onClose={()=>setBuyingStock(false)} onDone={loadStocks}/>}
      {sellStockPos&&<StockTradeModal mode="sell" position={sellStockPos} accounts={accounts} onClose={()=>setSellStockPos(null)} onDone={loadStocks}/>}
      {buyingCrypto&&accounts.length>0&&<CryptoTradeModal mode="buy" accounts={accounts} rates={rates} onClose={()=>setBuyingCrypto(false)} onDone={loadCrypto}/>}
      {sellCryptoPos&&<CryptoTradeModal mode="sell" position={sellCryptoPos} accounts={accounts} rates={rates} onClose={()=>setSellCryptoPos(null)} onDone={loadCrypto}/>}

      <style>{`*,*::before,*::after{box-sizing:border-box;}.pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:18px 14px;}@media(min-width:480px){.pg{padding:22px 18px;}}@media(min-width:768px){.pg{padding:28px 28px;}}@media(min-width:1024px){.pg{padding:36px 40px;}}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;gap:12px;flex-wrap:wrap;}@media(min-width:640px){.hdr{align-items:center;margin-bottom:28px;}}.ttl{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0;}@media(min-width:640px){.ttl{font-size:26px;}}.sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0;}.addbtn{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#34d399,#059669);color:#050d1a;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}.addbtn:disabled{opacity:.5;cursor:not-allowed;}.nx-actbtn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:9px 14px;font-size:13px;font-weight:600;color:rgba(255,255,255,.6);cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap;}.nx-actbtn:hover{background:rgba(255,255,255,.08);}.nx-actbtn:disabled{opacity:.4;cursor:not-allowed;}.port-card{background:linear-gradient(135deg,#0a2342,#0d2d52);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:22px;margin-bottom:28px;position:relative;overflow:hidden;}@media(min-width:640px){.port-card{padding:28px;}}.port-card::before{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(52,211,153,.1),transparent 70%);border-radius:50%;pointer-events:none;}.port-inner{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;}.pc-label{font-size:12px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;display:flex;align-items:center;}.pc-value{font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;font-family:monospace;word-break:break-all;}@media(min-width:640px){.pc-value{font-size:38px;}}.pc-stats{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;}.pc-stat{text-align:right;}.pc-stat-l{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:4px;}.pc-stat-v{font-size:18px;font-weight:700;color:#fff;font-family:monospace;}.sec-title{font-size:16px;font-weight:700;color:#fff;display:flex;align-items:center;margin-bottom:14px;}.cen{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px 20px;color:rgba(255,255,255,.35);font-size:14px;}.empty{display:flex;flex-direction:column;align-items:center;padding:60px 20px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08);border-radius:16px;text-align:center;gap:8px;margin-bottom:24px;}.empty p{color:rgba(255,255,255,.35);font-size:14px;margin:0;}.pos-list{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:20px;}.pos-hdr{display:none;}@media(min-width:700px){.pos-hdr{display:grid;grid-template-columns:2fr 100px 110px 110px 110px 120px 70px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.07em;text-transform:uppercase;}}.pos-row{display:flex;flex-direction:column;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.04);}.pos-row:last-child{border-bottom:none;}.pos-row:hover{background:rgba(255,255,255,.03);}@media(min-width:700px){.pos-row{display:grid;grid-template-columns:2fr 100px 110px 110px 110px 120px 70px;align-items:center;padding:13px 18px;}}.pos-sym-cell{display:flex;align-items:center;gap:11px;min-width:0;}.pos-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.pos-col{display:none;font-size:13px;color:rgba(255,255,255,.7);}@media(min-width:700px){.pos-col{display:block;}}.pos-mob{display:flex;flex-direction:column;gap:2px;margin-top:4px;font-size:12px;color:rgba(255,255,255,.4);}@media(min-width:700px){.pos-mob{display:none;}}.disclaimer{display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px;font-size:12px;color:rgba(255,255,255,.3);line-height:1.5;}.rates-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}@media(min-width:480px){.rates-grid{grid-template-columns:repeat(3,1fr);}}@media(min-width:640px){.rates-grid{grid-template-columns:repeat(4,1fr);}}@media(min-width:900px){.rates-grid{grid-template-columns:repeat(5,1fr);}}.rate-card{background:rgba(255,255,255,.03);border:1px solid;border-radius:14px;padding:14px 12px;}.nx-over{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:flex-end;justify-content:center;}@media(min-width:600px){.nx-over{align-items:center;padding:16px;}}.nx-modal{background:#111826;border:1px solid rgba(255,255,255,.1);border-radius:20px 20px 0 0;padding:22px 18px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px;}@media(min-width:600px){.nx-modal{border-radius:20px;padding:26px;}}.nx-mhdr{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}.nx-mtitle{font-size:17px;font-weight:800;color:#fff;margin:0;}.nx-xbtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);cursor:pointer;flex-shrink:0;}.nx-fg{display:flex;flex-direction:column;gap:6px;}.nx-lbl{font-size:12px;font-weight:600;color:rgba(255,255,255,.6);}.nx-inp{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit;transition:border-color .2s;}.nx-inp::placeholder{color:rgba(255,255,255,.28);}.nx-inp:focus{border-color:rgba(245,158,11,.5);}.nx-inp:disabled{opacity:.5;}.nx-selwrap{position:relative;}.nx-sel{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit;appearance:none;cursor:pointer;}.nx-sel option{background:#1e2940;color:#fff;}.nx-sel-ico{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.4);pointer-events:none;}.nx-subbtn{display:flex;align-items:center;justify-content:center;gap:8px;color:#050d1a;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}.nx-subbtn:disabled{opacity:.5;cursor:not-allowed;}@keyframes spin{to{transform:rotate(360deg);}}.nx-spin{animation:spin 1s linear infinite;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:10px;}`}</style>
    </div>
  );
}