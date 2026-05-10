'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Copy, CheckCircle, Loader2, AlertCircle, RefreshCw,
  QrCode, ChevronDown, ChevronUp, Shield, Clock, Info,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CryptoAddress {
  _id: string; network: string; coin: string; address: string;
  label?: string; memo?: string; qrCodeUrl?: string;
  isActive: boolean; minimumDeposit?: number;
  confirmationsRequired?: number;
}

// ─── Network display config (client-side only — just for colors/icons) ────────
const NET_CFG: Record<string, { color: string; bg: string; icon: string; desc: string }> = {
  bitcoin:    { color: '#f7931a', bg: 'rgba(247,147,26,.12)', icon: '₿', desc: 'Bitcoin Network (BTC)' },
  ethereum:   { color: '#627eea', bg: 'rgba(98,126,234,.12)', icon: 'Ξ', desc: 'Ethereum Network (ERC-20)' },
  tron:       { color: '#eb0029', bg: 'rgba(235,0,41,.12)',   icon: 'T', desc: 'Tron Network (TRX)' },
  usdt_trc20: { color: '#26a17b', bg: 'rgba(38,161,123,.12)', icon: '₮', desc: 'Tether USDT on TRON (TRC-20)' },
  usdt_erc20: { color: '#26a17b', bg: 'rgba(38,161,123,.1)',  icon: '₮', desc: 'Tether USDT on Ethereum (ERC-20)' },
  usdc_erc20: { color: '#2775ca', bg: 'rgba(39,117,202,.12)', icon: '$', desc: 'USD Coin on Ethereum (ERC-20)' },
  bnb:        { color: '#f3ba2f', bg: 'rgba(243,186,47,.12)', icon: '◆', desc: 'BNB Smart Chain (BSC)' },
  solana:     { color: '#9945ff', bg: 'rgba(153,69,255,.12)', icon: '◎', desc: 'Solana Network (SOL)' },
  litecoin:   { color: '#bebebe', bg: 'rgba(190,190,190,.1)', icon: 'Ł', desc: 'Litecoin Network (LTC)' },
  ripple:     { color: '#0085c0', bg: 'rgba(0,133,192,.12)',  icon: '✕', desc: 'XRP Ledger (Ripple)' },
};

// ─── Individual address card ───────────────────────────────────────────────────
function DepositCard({ addr }: { addr: CryptoAddress }) {
  const cfg    = NET_CFG[addr.network] ?? { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', icon: '●', desc: addr.network };
  const [copied,   setCopied]   = useState(false);
  const [copiedMemo,setCopiedMemo]=useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyAddr = () => {
    navigator.clipboard.writeText(addr.address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };
  const copyMemo = () => {
    if (!addr.memo) return;
    navigator.clipboard.writeText(addr.memo);
    setCopiedMemo(true); setTimeout(() => setCopiedMemo(false), 2000);
    toast.success('Memo copied');
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 20, overflow: 'hidden',
      transition: 'border-color .2s, box-shadow .2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.14)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,.25)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}>

      {/* Card top — coin identity */}
      <div style={{ padding: '18px 20px 14px', background: `linear-gradient(135deg, ${cfg.bg}, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: cfg.bg, border: `1px solid ${cfg.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: cfg.color, flexShrink: 0, fontFamily: 'monospace' }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>{addr.coin}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{cfg.desc}</div>
          </div>
        </div>
      </div>

      {/* Address section */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Deposit Address
        </div>

        {/* Address box */}
        <div style={{ background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#fff', wordBreak: 'break-all', lineHeight: 1.6, fontWeight: 500 }}>
            {addr.address}
          </span>
          <button onClick={copyAddr}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(52,211,153,.15)' : 'rgba(245,158,11,.1)', border: `1px solid ${copied ? 'rgba(52,211,153,.3)' : 'rgba(245,158,11,.25)'}`, borderRadius: 9, padding: '7px 11px', fontSize: 12, fontWeight: 700, color: copied ? '#34d399' : '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all .15s', whiteSpace: 'nowrap' }}>
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Memo / Destination tag */}
        {addr.memo && (
          <div style={{ marginTop: 10, background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 11, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                  ⚠️ Memo / Destination Tag Required
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#fff' }}>{addr.memo}</div>
              </div>
              <button onClick={copyMemo}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: copiedMemo ? 'rgba(52,211,153,.15)' : 'rgba(245,158,11,.12)', border: `1px solid ${copiedMemo ? 'rgba(52,211,153,.3)' : 'rgba(245,158,11,.25)'}`, borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700, color: copiedMemo ? '#34d399' : '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                {copiedMemo ? <CheckCircle size={12} /> : <Copy size={12} />} Copy
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(245,158,11,.7)', margin: '8px 0 0', lineHeight: 1.5 }}>
              You MUST include this memo/tag when sending. Transactions without it cannot be credited and may be lost permanently.
            </p>
          </div>
        )}

        {/* Deposit details */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '6px 11px' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Min deposit:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{addr.minimumDeposit} {addr.coin}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '6px 11px' }}>
            <Clock size={11} color="rgba(255,255,255,.35)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Confirmations:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{addr.confirmationsRequired}</span>
          </div>
        </div>

        {/* Expandable instructions */}
        <button onClick={() => setExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 0', color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
          <Info size={13} />
          How to deposit
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div style={{ marginTop: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '13px 14px' }}>
            <ol style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                `Copy the ${addr.coin} deposit address above`,
                `Open your external wallet or exchange`,
                addr.memo ? `Enter the Memo/Destination Tag: ${addr.memo} (required)` : `Paste the address as the recipient`,
                `Enter the amount (minimum ${addr.minimumDeposit} ${addr.coin})`,
                `Confirm and send the transaction`,
                `Your balance will update after ${addr.confirmationsRequired} network confirmation${addr.confirmationsRequired !== 1 ? 's' : ''}`,
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.6 }}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CryptoDepositPage() {
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [mounted,   setMounted]   = useState(false);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/crypto/addresses');
      const raw = res.data.data ?? res.data;
      setAddresses(Array.isArray(raw) ? raw.filter((a: CryptoAddress) => a.isActive) : []);
    } catch {
      toast.error('Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (mounted) load(); }, [mounted]);

  if (!mounted) return <div style={{ minHeight: '60vh', background: '#0a0f1a' }} />;

  // Unique coins for filter tabs
  const coins = ['all', ...Array.from(new Set(addresses.map(a => a.coin)))];
  const filtered = filter === 'all' ? addresses : addresses.filter(a => a.coin === filter);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 24, padding: 'clamp(16px,3vw,32px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-.5px' }}>Crypto Deposit</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>Send crypto to any address below — your balance updates automatically after confirmation</p>
        </div>
        <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Security notice */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.15)', borderRadius: 14, padding: '14px 16px' }}>
        <Shield size={17} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: 'rgba(52,211,153,.8)', lineHeight: 1.7 }}>
          <strong style={{ color: '#34d399' }}>Security reminder:</strong> Always send only the matching coin to each address. Sending a different coin to an incompatible address will result in permanent loss. NexaBank cannot recover funds sent to wrong addresses.
        </div>
      </div>

      {/* Coin filter tabs — only shown when multiple coins available */}
      {coins.length > 2 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {coins.map(coin => {
            const addr = addresses.find(a => a.coin === coin);
            const cfg  = addr ? (NET_CFG[addr.network] ?? { color: '#f59e0b', bg: 'rgba(245,158,11,.12)' }) : { color: 'rgba(255,255,255,.5)', bg: 'rgba(255,255,255,.06)' };
            return (
              <button key={coin} onClick={() => setFilter(coin)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: filter === coin ? `1.5px solid ${cfg.color}55` : '1px solid rgba(255,255,255,.08)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, background: filter === coin ? cfg.bg : 'rgba(255,255,255,.04)', color: filter === coin ? cfg.color : 'rgba(255,255,255,.38)', transition: 'all .15s' }}>
                {coin === 'all' ? 'All Coins' : coin}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: 'rgba(255,255,255,.3)', fontSize: 13 }}>
          <Loader2 size={20} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} /> Loading deposit addresses…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12, background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)', borderRadius: 18, textAlign: 'center', padding: 24 }}>
          <AlertCircle size={36} color="rgba(255,255,255,.15)" />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.4)', margin: '0 0 6px' }}>No deposit addresses available</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.25)', margin: 0 }}>Please check back later or contact support</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
          {filtered.map(addr => <DepositCard key={addr._id ?? addr.network} addr={addr} />)}
        </div>
      )}

      {/* Important notices */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>Important Deposit Information</div>
          {[
            'Deposits are credited after the required number of network confirmations',
            'Minimum deposit amounts apply — amounts below minimum may not be credited',
            'For coins requiring a Memo/Tag, always include it or funds may be lost permanently',
            'Crypto deposits are irreversible — verify the address and network before sending',
            'For large deposits, contact support first to confirm processing time',
          ].map((note, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.25)', flexShrink: 0, marginTop: 7 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>{note}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 10px; }
      `}</style>
    </div>
  );
}