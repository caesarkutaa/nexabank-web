'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Download, ArrowUpRight, ArrowDownLeft,
  Loader2, ChevronLeft, ChevronRight, X, ExternalLink,
  TrendingUp, TrendingDown, DollarSign, Activity, ChevronDown,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Tx {
  _id: string;
  referenceNumber: string;
  type: string;
  status: string;
  direction: 'credit' | 'debit';
  amount: number;
  fee: number;
  currency: string;
  description?: string;
  recipientName?: string;
  senderName?: string;
  recipientAccountNumber?: string;
  senderAccountNumber?: string;
  recipientBankName?: string;
  receiptUrl?: string;
  processedAt?: string;
  balanceAfter?: number;
  createdAt: string;
}

interface Pag { total: number; page: number; limit: number; pages: number; }

/* ── Per-transaction currency formatter ── */
function fmtC(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  }
}

const fmtD  = (d: string) => new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', year:'numeric' }).format(new Date(d));
const fmtDT = (d: string) => new Intl.DateTimeFormat(undefined, { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(d));

const TYPE_LABELS: Record<string, string> = {
  deposit:'Deposit', withdrawal:'Withdrawal', intrabank_transfer:'NexaBank Transfer',
  interbank_transfer:'ACH Transfer', international_transfer:'International Wire',
  bill_payment:'Bill Payment', cheque_deposit:'Cheque Deposit',
  crypto_payment:'Crypto Payment', investment:'Investment',
  loan_disbursement:'Loan Disbursement', loan_repayment:'Loan Repayment',
  card_payment:'Card Payment', fee:'Fee', interest:'Interest',
};

const STATUS_COLOR: Record<string, { bg:string; c:string }> = {
  completed:  { bg:'rgba(52,211,153,.12)',  c:'#34d399' },
  pending:    { bg:'rgba(251,191,36,.12)',   c:'#fbbf24' },
  processing: { bg:'rgba(96,165,250,.12)',   c:'#60a5fa' },
  failed:     { bg:'rgba(248,113,113,.12)',  c:'#f87171' },
  reversed:   { bg:'rgba(167,139,250,.12)',  c:'#a78bfa' },
  cancelled:  { bg:'rgba(156,163,175,.12)',  c:'#9ca3af' },
};

/* ── Detail drawer ── */
function TxDrawer({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const isCr = tx.direction === 'credit';
  const ss   = STATUS_COLOR[tx.status] ?? STATUS_COLOR.pending;
  const cur  = tx.currency || 'USD';
  const f    = (n: number) => fmtC(n, cur);

  const rows = [
    { l:'Reference',   v: tx.referenceNumber },
    { l:'Type',        v: TYPE_LABELS[tx.type] || tx.type },
    { l:'Direction',   v: isCr ? 'Credit (Incoming)' : 'Debit (Outgoing)' },
    { l:'Amount',      v: f(tx.amount) },
    { l:'Fee',         v: tx.fee ? f(tx.fee) : 'Free' },
    { l:'Currency',    v: cur },
    ...(tx.description          ? [{ l:'Description', v: tx.description }]                              : []),
    ...(tx.recipientName        ? [{ l:'Recipient',   v: tx.recipientName }]                             : []),
    ...(tx.senderName           ? [{ l:'Sender',      v: tx.senderName }]                                : []),
    ...(tx.recipientAccountNumber ? [{ l:'To Account', v:`···${tx.recipientAccountNumber.slice(-4)}` }]  : []),
    ...(tx.senderAccountNumber  ? [{ l:'From Account', v:`···${tx.senderAccountNumber.slice(-4)}` }]     : []),
    ...(tx.recipientBankName    ? [{ l:'Bank',        v: tx.recipientBankName }]                         : []),
    ...(tx.balanceAfter !== undefined ? [{ l:'Balance After', v: f(tx.balanceAfter) }]                   : []),
      { l:'Transaction Date', v: fmtDT(tx.processedAt || tx.createdAt) },
     { l:'Posted Date',     v: fmtDT(tx.processedAt || tx.createdAt) },
  ];

  return (
    <div className="dov" onClick={onClose}>
      <div className="drw" onClick={e => e.stopPropagation()}>
        <div className="dhdr">
          <div>
            <h3 className="dtitle">Transaction Details</h3>
            <p className="dref">{tx.referenceNumber}</p>
          </div>
          <button className="xbtn" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="damount" style={{ background:isCr?'rgba(52,211,153,.08)':'rgba(248,113,113,.08)', border:`1px solid ${isCr?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)'}` }}>
          <div style={{ fontSize:28, fontWeight:800, color:isCr?'#34d399':'#f87171', fontFamily:'monospace' }}>
            {isCr?'+':'-'}{f(tx.amount)}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginTop:4 }}>{TYPE_LABELS[tx.type]||tx.type}</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:6 }}>
            <span className="spill" style={{ background:ss.bg, color:ss.c }}>{tx.status.toUpperCase()}</span>
            <span style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', color:'#f59e0b', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100 }}>{cur}</span>
          </div>
        </div>

        <div className="drows">
          {rows.map(({ l, v }) => (
            <div key={l} className="drow">
              <span className="drowl">{l}</span>
              <span className="drowv">{v}</span>
            </div>
          ))}
        </div>

        {tx.receiptUrl && (
          <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="rcptbtn">
            <Download size={14}/> Download Receipt <ExternalLink size={12}/>
          </a>
        )}
      </div>
      <style>{`
        .dov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:flex-end;justify-content:center}
        @media(min-width:640px){.dov{align-items:center}}
        .drw{background:#111826;border:1px solid rgba(255,255,255,.1);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto}
        @media(min-width:640px){.drw{border-radius:20px}}
        .dhdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:12px}
        .dtitle{font-size:16px;font-weight:800;color:#fff;margin:0}
        .dref{font-size:12px;color:rgba(255,255,255,.35);margin:3px 0 0;font-family:monospace;word-break:break-all}
        .xbtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);cursor:pointer;flex-shrink:0}
        .damount{border-radius:14px;padding:18px;text-align:center;margin-bottom:16px}
        .drows{display:flex;flex-direction:column}
        .drow{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);gap:12px}
        .drowl{font-size:12px;color:rgba(255,255,255,.38);flex-shrink:0;width:110px}
        .drowv{font-size:13px;color:rgba(255,255,255,.82);text-align:right;word-break:break-all}
        .rcptbtn{display:flex;align-items:center;justify-content:center;gap:7px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:11px;color:#f59e0b;font-size:13px;font-weight:600;text-decoration:none;margin-top:16px}
        .spill{font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.05em}
      `}</style>
    </div>
  );
}

/* ── Main ── */
export default function TransactionsPage() {
  const [mounted,     setMounted]     = useState(false);
  const [txs,         setTxs]         = useState<Tx[]>([]);
  const [pag,         setPag]         = useState<Pag>({ total:0, page:1, limit:20, pages:0 });
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Tx|null>(null);
  const [search,      setSearch]      = useState('');
  const [direction,   setDir]         = useState('');
  const [status,      setStat]        = useState('');
  const [type,        setType]        = useState('');
  const [from,        setFrom]        = useState('');
  const [to,          setTo]          = useState('');
  const [showFilters, setShowF]       = useState(false);
  const [page,        setPage]        = useState(1);
  const [stats,       setStats]       = useState({ credit:0, debit:0, count:0, currency:'USD' });

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, string|number> = { page, limit:20 };
      if (direction) p.direction = direction;
      if (status)    p.status    = status;
      if (type)      p.type      = type;
      if (from)      p.from      = from;
      if (to)        p.to        = to;
      const res  = await api.get('/transactions', { params:p });
      const d    = res.data.data;
      const list: Tx[] = d.transactions || [];
      setTxs(list);
      setPag(d.pagination || { total:0, page:1, limit:20, pages:0 });

      /* Use first transaction's currency for stats display */
      const statsCur = list[0]?.currency || 'USD';
      const credit   = list.filter(t => t.direction==='credit' && t.status==='completed').reduce((s,t) => s+t.amount, 0);
      const debit    = list.filter(t => t.direction==='debit'  && t.status==='completed').reduce((s,t) => s+t.amount, 0);
      setStats({ credit, debit, count: d.pagination?.total||0, currency: statsCur });
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, direction, status, type, from, to]);

  useEffect(() => { if (mounted) load(); }, [load, mounted]);

  const clear   = () => { setDir(''); setStat(''); setType(''); setFrom(''); setTo(''); setPage(1); };
  const activeF = [direction, status, type, from, to].filter(Boolean).length;
  const filtered = (
  search
    ? txs.filter(t =>
        [t.referenceNumber, t.description, t.recipientName, t.senderName]
          .some(f => f?.toLowerCase().includes(search.toLowerCase()))
      )
    : txs
).sort((a, b) => {
  const dateA = new Date(a.processedAt || a.createdAt).getTime();
  const dateB = new Date(b.processedAt || b.createdAt).getTime();

  // Newest first
  return dateB - dateA;
});

  if (!mounted) return <div style={{ minHeight:'100vh', background:'#0a0f1a' }}/>;

  const sf = (n: number) => fmtC(n, stats.currency);

  return (
    <div className="pg">
      <div className="hdr">
        <div>
          <h1 className="title">Transactions</h1>
          <p className="sub">{pag.total} total records</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { l:'Total Records', v: stats.count.toString(),              Icon:Activity,     c:'#60a5fa', mono:false },
          { l:'Inflows',       v: sf(stats.credit),                    Icon:TrendingDown,  c:'#34d399', mono:true  },
          { l:'Outflows',      v: sf(stats.debit),                     Icon:TrendingUp,    c:'#f87171', mono:true  },
          { l:'Net',           v: sf(stats.credit - stats.debit),      Icon:DollarSign,    c:'#f59e0b', mono:true  },
        ].map(({ l, v, Icon, c, mono }) => (
          <div key={l} className="scard">
            <div className="scard-top"><Icon size={13} color={c}/><span className="scard-label">{l}</span></div>
            <div className="scard-val" style={{ fontFamily:mono?'monospace':'inherit' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="bar">
        <div className="swrap">
          <Search size={14} className="sico"/>
          <input className="nxinput sinput" placeholder="Search reference, name…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button className={`filtbtn ${showFilters?'filtbtn-on':''}`} onClick={() => setShowF(v => !v)}>
          <Filter size={13}/> Filters
          {activeF>0 && <span className="fcount">{activeF}</span>}
        </button>
        {activeF>0 && <button className="clearbtn" onClick={clear}>Clear</button>}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filt-panel">
          {[
            { l:'Direction', v:direction, fn:(x:string)=>{setDir(x);setPage(1);},  opts:[{v:'credit',l:'Credit'},{v:'debit',l:'Debit'}] },
            { l:'Status',    v:status,    fn:(x:string)=>{setStat(x);setPage(1);}, opts:['completed','pending','processing','failed','cancelled'].map(s=>({v:s,l:s.charAt(0).toUpperCase()+s.slice(1)})) },
            { l:'Type',      v:type,      fn:(x:string)=>{setType(x);setPage(1);}, opts:Object.entries(TYPE_LABELS).map(([v,l])=>({v,l})) },
          ].map(({ l, v, fn, opts }) => (
            <div key={l} className="filt-field">
              <label className="filt-label">{l}</label>
              <div className="sel-wrap">
                <select className="nxsel" value={v} onChange={e => fn(e.target.value)}>
                  <option value="">All</option>
                  {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <ChevronDown size={12} className="sel-ico"/>
              </div>
            </div>
          ))}
          <div className="filt-field">
            <label className="filt-label">From Date</label>
            <input type="date" className="nxinput" style={{ colorScheme:'dark', fontSize:13 }} value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}}/>
          </div>
          <div className="filt-field">
            <label className="filt-label">To Date</label>
            <input type="date" className="nxinput" style={{ colorScheme:'dark', fontSize:13 }} value={to} onChange={e=>{setTo(e.target.value);setPage(1);}}/>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="txlist">
        <div className="txlist-hdr">
          <span>Transaction</span><span>Date</span><span>Amount</span><span>Status</span><span></span>
        </div>

        {loading ? (
          <div className="cen"><Loader2 size={20} className="nx-spin"/> Loading…</div>
        ) : filtered.length===0 ? (
          <div className="empty"><Activity size={32} color="rgba(255,255,255,.12)" style={{ marginBottom:10 }}/><p>No transactions found</p></div>
        ) : filtered.map((tx, i) => {
          const isCr = tx.direction==='credit';
          const ss   = STATUS_COLOR[tx.status] ?? STATUS_COLOR.pending;
          const cur  = tx.currency || 'USD';
          const fmtAmt = fmtC(tx.amount, cur);
          return (
            <div key={tx._id} className="txrow" onClick={() => setSelected(tx)}
              style={{ borderBottom: i<filtered.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
              <div className="txrow-main">
                <div className="txrow-ico" style={{ background:isCr?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)' }}>
                  {isCr ? <ArrowDownLeft size={15} color="#34d399"/> : <ArrowUpRight size={15} color="#f87171"/>}
                </div>
                <div className="txrow-text">
                  <div className="txrow-desc">{tx.description||TYPE_LABELS[tx.type]||tx.type}</div>
                  <div className="txrow-ref">{tx.referenceNumber}</div>
                  {/* Mobile */}
                  <div className="txrow-mob">
                    <span style={{ color:isCr?'#34d399':'#f87171', fontWeight:700, fontFamily:'monospace', fontSize:13 }}>
                      {isCr?'+':'-'}{fmtAmt}
                    </span>
                    <span style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.2)', color:'#f59e0b', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:100 }}>{cur}</span>
                    <span className="spill" style={{ background:ss.bg, color:ss.c, fontSize:10 }}>{tx.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              {/* Desktop */}
              <span className="txrow-date">{fmtD(tx.processedAt || tx.createdAt)}</span>
              <span className="txrow-amount" style={{ color:isCr?'#34d399':'#f87171' }}>
                {isCr?'+':'-'}{fmtAmt}
                <span style={{ display:'block', fontSize:10, color:'rgba(255,255,255,.3)', fontFamily:'sans-serif', fontWeight:400, marginTop:1 }}>{cur}</span>
              </span>
              <span className="txrow-status">
                <span className="spill" style={{ background:ss.bg, color:ss.c }}>{tx.status.toUpperCase()}</span>
              </span>
              <span className="txrow-dl">
            {tx.receiptUrl ? (
              <a href={tx.receiptUrl} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ color:'rgba(255,255,255,.5)', display:'flex', transition:'color .15s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f59e0b')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.5)')}>
                <Download size={13}/>
              </a>
            ) : (
              <span style={{ color:'rgba(255,255,255,.18)', display:'flex', cursor:'default' }}
                title="Receipt not available">
                <Download size={13}/>
              </span>
            )}
          </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pag.pages>1 && (
        <div className="pag">
          <span className="pag-info">Page {pag.page} of {pag.pages} · {pag.total} total</span>
          <div className="pag-btns">
            <button className="pagbtn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page<=1}><ChevronLeft size={13}/> Prev</button>
            <button className="pagbtn" onClick={() => setPage(p=>Math.min(pag.pages,p+1))} disabled={page>=pag.pages}>Next <ChevronRight size={13}/></button>
          </div>
        </div>
      )}

      {selected && <TxDrawer tx={selected} onClose={() => setSelected(null)}/>}

      <style>{`
        *{box-sizing:border-box}
        .pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:24px 16px}
        @media(min-width:640px){.pg{padding:32px 28px}}
        @media(min-width:1024px){.pg{padding:36px 40px}}
        .hdr{margin-bottom:20px}
        .title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0}
        @media(min-width:640px){.title{font-size:26px}}
        .sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0}
        .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
        @media(min-width:640px){.stats-grid{grid-template-columns:repeat(4,1fr)}}
        .scard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:13px}
        .scard-top{display:flex;align-items:center;gap:6px;margin-bottom:7px}
        .scard-label{font-size:11px;color:rgba(255,255,255,.38)}
        .scard-val{font-size:15px;font-weight:700;color:#fff;word-break:break-all}
        @media(min-width:640px){.scard-val{font-size:17px}}
        .bar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
        .swrap{position:relative;flex:1;min-width:180px}
        .sico{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.3);pointer-events:none}
        .sinput{padding-left:34px!important;width:100%}
        .nxinput{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 14px;font-size:14px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit}
        .nxinput::placeholder{color:rgba(255,255,255,.28)}
        .nxinput:focus{border-color:rgba(245,158,11,.5)}
        .sel-wrap{position:relative}
        .nxsel{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 32px 10px 12px;font-size:13px;color:#fff!important;-webkit-text-fill-color:#fff!important;outline:none;font-family:inherit;appearance:none;cursor:pointer}
        .nxsel option{background:#1e2940;color:#fff}
        .sel-ico{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.4);pointer-events:none}
        .filtbtn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;cursor:pointer;color:rgba(255,255,255,.6);font-size:13px;font-weight:600;font-family:inherit;white-space:nowrap}
        .filtbtn-on{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.35);color:#f59e0b}
        .fcount{background:#f59e0b;color:#050d1a;font-size:10px;font-weight:800;border-radius:100px;width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center}
        .clearbtn{background:none;border:1px solid rgba(248,113,113,.25);border-radius:10px;padding:10px 13px;color:#f87171;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
        .filt-panel{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(min-width:640px){.filt-panel{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:900px){.filt-panel{grid-template-columns:repeat(5,1fr)}}
        .filt-field{display:flex;flex-direction:column;gap:5px}
        .filt-label{font-size:11px;color:rgba(255,255,255,.38)}
        .txlist{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:16px;overflow:hidden;margin-bottom:16px}
        .txlist-hdr{display:none}
        @media(min-width:640px){.txlist-hdr{display:grid;grid-template-columns:1fr 120px 120px 100px 36px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);font-size:10px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.07em;text-transform:uppercase}}
        .txrow{display:flex;flex-direction:column;padding:14px 16px;cursor:pointer;transition:background .15s}
        .txrow:hover{background:rgba(255,255,255,.03)}
        @media(min-width:640px){.txrow{display:grid;grid-template-columns:1fr 120px 120px 100px 36px;align-items:center;padding:13px 18px}}
        .txrow-main{display:flex;align-items:flex-start;gap:11px;min-width:0}
        .txrow-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .txrow-text{min-width:0;flex:1}
        .txrow-desc{font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .txrow-ref{font-size:11px;color:rgba(255,255,255,.3);font-family:monospace;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .txrow-mob{display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap}
        @media(min-width:640px){.txrow-mob{display:none}}
        .txrow-date{display:none;font-size:12px;color:rgba(255,255,255,.4)}
        .txrow-amount{display:none;font-size:13px;font-weight:700;font-family:monospace;line-height:1.3}
        .txrow-status{display:none}
        .txrow-dl{display:none}
        @media(min-width:640px){.txrow-date{display:block}.txrow-amount{display:block}.txrow-status{display:block}.txrow-dl{display:flex;align-items:center}}
        .spill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;letter-spacing:.05em}
        .cen{display:flex;align-items:center;justify-content:center;gap:10px;padding:50px;color:rgba(255,255,255,.35);font-size:14px}
        .empty{display:flex;flex-direction:column;align-items:center;padding:50px;color:rgba(255,255,255,.35);font-size:14px}
        .empty p{margin:0}
        .pag{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .pag-info{font-size:13px;color:rgba(255,255,255,.35)}
        .pag-btns{display:flex;gap:8px}
        .pagbtn{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 13px;font-size:13px;font-weight:600;color:rgba(255,255,255,.6);cursor:pointer;font-family:inherit}
        .pagbtn:disabled{opacity:.35;cursor:not-allowed}
        @keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}
      `}</style>
    </div>
  );
}