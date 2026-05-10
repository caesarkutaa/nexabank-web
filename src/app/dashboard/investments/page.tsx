'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Search, Plus, Loader2, X,
  BarChart3, AlertCircle, ChevronDown, RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

// ─── Types (match backend schema exactly) ─────────────────────────────────────
interface Position {
  _id:              string;
  symbol:           string;
  companyName:      string;
  shares:           number;       // backend field is `shares`, not `quantity`
  buyPrice:         number;       // backend field is `buyPrice`, not `averageBuyPrice`
  currentPrice:     number;
  totalInvested:    number;
  currentValue:     number;
  profitLoss:       number;       // backend field, not `unrealizedPnL`
  profitLossPercent: number;      // backend field, not `unrealizedPnLPercent`
  action:           'buy' | 'sell';
  orderStatus:      string;
  referenceNumber:  string;
  createdAt:        string;
}

interface PortfolioSummary {
  totalInvested:    number;
  totalValue:       number;
  totalProfitLoss:  number;
  totalProfitLossPct: number;
  positionCount:    number;
}

interface Account {
  _id:              string;
  accountNumber:    string;
  accountType:      string;
  nickname?:        string;
  availableBalance: number;
  currency:         string;
  status:           string;
}

interface Quote {
  symbol:    string;
  askPrice:  number;
  bidPrice:  number;
  midPrice:  number;
  timestamp: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
// Alpaca always quotes in USD — portfolio values are always USD
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

// Account balances use the account's own currency
function fmtC(n: number, cur: string): string {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD', minimumFractionDigits: 2 }).format(n); }
  catch { return `${cur} ${n.toFixed(2)}`; }
}

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const POPULAR = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'SPY', 'QQQ'];

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ mode, position, accounts, onClose, onDone }: {
  mode: 'buy' | 'sell';
  position?: Position;
  accounts: Account[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [symbol,    setSymbol]    = useState(position?.symbol ?? '');
  const [shares,    setShares]    = useState('');   // ← `shares` matches BuyStockDto
  const [accountId, setAccountId] = useState(accounts[0]?._id ?? '');
  const [quote,     setQuote]     = useState<Quote | null>(null);
  const [fetching,  setFetching]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  const selAcc  = accounts.find(a => a._id === accountId);
  const acctCur = selAcc?.currency || 'USD';

  const fetchQuote = async (sym: string) => {
    if (!sym.trim()) return;
    setFetching(true);
    try {
      // Backend returns { askPrice, bidPrice, midPrice }
      const res = await api.get(`/investments/quote/${sym.trim().toUpperCase()}`);
      setQuote(res.data.data ?? res.data);
    } catch {
      toast.error('Symbol not found or market closed');
      setQuote(null);
    } finally { setFetching(false); }
  };

  const sharesNum = parseFloat(shares) || 0;
  // Use midPrice from backend quote (backend returns midPrice, not price)
  const price     = quote?.midPrice ?? 0;
  const total     = +(sharesNum * price).toFixed(2);
  const fee       = +(total * 0.001).toFixed(2);
  const totalDebit = +(total + fee).toFixed(2);

  const submit = async () => {
    if (!symbol.trim())       return toast.error('Enter a stock symbol');
    if (!sharesNum || sharesNum <= 0) return toast.error('Enter a valid number of shares');
    if (!accountId)           return toast.error('Select an account');

    setLoading(true);
    try {
      if (mode === 'buy') {
        // BuyStockDto: { symbol, shares, accountId }
        await api.post('/investments/buy', {
          symbol:    symbol.toUpperCase(),
          shares:    sharesNum,       // ← `shares` not `quantity`
          accountId,
          // no orderType — backend doesn't accept it
        });
      } else {
        // SellStockDto: { investmentId, sharesToSell, accountId }
        await api.post('/investments/sell', {
          investmentId: position!._id,   // ← `investmentId` not `positionId`
          sharesToSell: sharesNum,        // ← `sharesToSell` not `quantity`
          accountId,
        });
      }
      toast.success(`${mode === 'buy' ? 'Buy' : 'Sell'} order placed!`);
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Order failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="nx-over">
      <div className="nx-modal">
        <div className="nx-mhdr">
          <h3 className="nx-mtitle" style={{ color: mode === 'buy' ? '#34d399' : '#f87171' }}>
            {mode === 'buy' ? '📈 Buy Stock' : '📉 Sell Stock'}
          </h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* USD notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
          <span style={{ color: '#60a5fa' }}>ℹ</span>
          Stock prices are always in <strong style={{ color: '#60a5fa' }}>USD</strong> via Alpaca Markets.
          {acctCur !== 'USD' && <> Your account is in <strong style={{ color: '#f59e0b' }}>{acctCur}</strong> — conversion applies.</>}
        </div>

        {/* Symbol */}
        <div className="nx-fg">
          <label className="nx-lbl">Stock Symbol</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="nx-inp"
              style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', fontWeight: 700 }}
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL, TSLA"
              disabled={!!position}
              onKeyDown={e => e.key === 'Enter' && fetchQuote(symbol)}
            />
            <button className="nx-actbtn" onClick={() => fetchQuote(symbol)} disabled={fetching || !symbol.trim()}>
              {fetching ? <Loader2 size={13} className="nx-spin" /> : <Search size={13} />}
            </button>
          </div>
          {!position && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {POPULAR.slice(0, 6).map(s => (
                <button key={s} onClick={() => { setSymbol(s); fetchQuote(s); }}
                  style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quote */}
        {quote && (
          <div style={{ background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>{quote.symbol}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{usd(quote.midPrice)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>Mid-price · USD</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                <div>Bid: <span style={{ color: '#f87171', fontFamily: 'monospace' }}>{usd(quote.bidPrice)}</span></div>
                <div>Ask: <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{usd(quote.askPrice)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Shares */}
        <div className="nx-fg">
          <label className="nx-lbl">
            {mode === 'sell' && position ? `Shares to Sell (you own ${position.shares})` : 'Number of Shares'}
          </label>
          <input className="nx-inp" type="number" min="0.01" step="0.01"
            value={shares}
            onChange={e => setShares(e.target.value)}
            placeholder="e.g. 10"
          />
          {mode === 'sell' && position && sharesNum > position.shares && (
            <span style={{ fontSize: 12, color: '#f87171' }}>Cannot sell more than {position.shares} shares.</span>
          )}
        </div>

        {/* Account */}
        <div className="nx-fg">
          <label className="nx-lbl">{mode === 'buy' ? 'Fund From' : 'Credit To'} Account</label>
          <div className="nx-selwrap">
            <select className="nx-sel" value={accountId} onChange={e => setAccountId(e.target.value)}>
              {accounts.map(a => (
                <option key={a._id} value={a._id}>
                  [{a.currency || 'USD'}] {a.nickname || a.accountType?.replace(/_/g, ' ')} ···{a.accountNumber.slice(-4)} — {fmtC(a.availableBalance, a.currency || 'USD')}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="nx-sel-ico" />
          </div>
        </div>

        {/* Order summary */}
        {sharesNum > 0 && price > 0 && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Order Summary (USD)
            </div>
            {[
              { l: `${sharesNum} share${sharesNum !== 1 ? 's' : ''} × ${usd(price)}`, v: usd(total) },
              { l: 'Brokerage fee (0.1%)',                                              v: usd(fee) },
              { l: `Total ${mode === 'buy' ? 'Cost' : 'Proceeds'}`,                   v: usd(mode === 'buy' ? totalDebit : +(total - fee).toFixed(2)), bold: true },
            ].map(({ l, v, bold }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,.45)' }}>{l}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: bold ? 700 : 500, color: bold ? 'white' : 'rgba(255,255,255,.65)' }}>{v}</span>
              </div>
            ))}
            {acctCur !== 'USD' && (
              <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
                ⚠ Your account is in <strong style={{ color: '#f59e0b' }}>{acctCur}</strong>. The platform converts at the prevailing rate.
              </div>
            )}
            {mode === 'buy' && selAcc && totalDebit > selAcc.availableBalance && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 12 }}>
                <AlertCircle size={13} /> Insufficient funds — available: {fmtC(selAcc.availableBalance, acctCur)}
              </div>
            )}
          </div>
        )}

        <button className="nx-subbtn"
          style={{ background: mode === 'buy' ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#dc2626,#f87171)' }}
          onClick={submit}
          disabled={
            loading || !symbol.trim() || !sharesNum || sharesNum <= 0 || !accountId ||
            (mode === 'sell' && !!position && sharesNum > position.shares) ||
            (mode === 'buy' && !!selAcc && totalDebit > selAcc.availableBalance)
          }>
          {loading
            ? <><Loader2 size={15} className="nx-spin" /> Placing Order…</>
            : `${mode === 'buy' ? 'Buy' : 'Sell'} ${sharesNum || ''} ${symbol || 'Stock'}${sharesNum !== 1 ? 's' : ''}`
          }
        </button>
      </div>
      <IS />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvestmentsPage() {
  const [mounted,    setMounted]    = useState(false);
  const [positions,  setPositions]  = useState<Position[]>([]);
  const [summary,    setSummary]    = useState<PortfolioSummary | null>(null);
  const [accounts,   setAccounts]   = useState<Account[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buying,     setBuying]     = useState(false);
  const [selling,    setSelling]    = useState<Position | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      const [pR, aR] = await Promise.all([
        api.get('/investments/portfolio'),
        api.get('/accounts'),
      ]);
      // Backend returns { positions, summary } from getPortfolio
      const portfolio = pR.data.data ?? pR.data;
      setPositions(portfolio.positions ?? []);
      setSummary(portfolio.summary ?? null);
      setAccounts((aR.data.data || []).filter((a: Account) => a.status === 'active'));
    } catch { toast.error('Failed to load portfolio'); }
    finally { setLoading(false); }
  }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  useEffect(() => { if (mounted) load(); }, [load, mounted]);
  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  // Only show BUY positions as holdings (sell records are history)
  const holdings = positions.filter(p => p.action === 'buy');
  const pnl      = summary?.totalProfitLoss ?? 0;
  const pnlPct   = summary?.totalProfitLossPct ?? 0;

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="ttl">Investments</h1>
          <p className="sub">US equities via Alpaca Markets · Commission-free · Prices in USD</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nx-actbtn" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'nx-spin' : ''} />
          </button>
          <button className="addbtn" onClick={() => setBuying(true)} disabled={accounts.length === 0}>
            <Plus size={15} /> Buy Stock
          </button>
        </div>
      </div>

      {/* Portfolio hero */}
      <div className="port-card">
        <div className="port-inner">
          <div>
            <div className="pc-label">
              Portfolio Value
              <span style={{ fontSize: 10, background: 'rgba(96,165,250,.12)', border: '1px solid rgba(96,165,250,.2)', color: '#60a5fa', padding: '1px 7px', borderRadius: 100, marginLeft: 8, fontWeight: 700, letterSpacing: '0.06em' }}>USD</span>
            </div>
            <div className="pc-value">{loading ? '—' : usd(summary?.totalValue ?? 0)}</div>
            {summary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ color: pnl >= 0 ? '#34d399' : '#f87171', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                  {pnl >= 0 ? '+' : ''}{usd(pnl)}
                </span>
                <span style={{ color: pnl >= 0 ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 600 }}>({fmtPct(pnlPct)})</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>all time P&L</span>
              </div>
            )}
          </div>
          <div className="pc-stats">
            <div className="pc-stat">
              <div className="pc-stat-l">Total Invested</div>
              <div className="pc-stat-v">{loading ? '—' : usd(summary?.totalInvested ?? 0)}</div>
            </div>
            <div className="pc-stat">
              <div className="pc-stat-l">Positions</div>
              <div className="pc-stat-v">{summary?.positionCount ?? holdings.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="sec-title">
        My Holdings
        {holdings.length > 0 && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 500, marginLeft: 8 }}>
            {holdings.length} position{holdings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="cen"><Loader2 size={20} className="nx-spin" /> Loading portfolio…</div>
      ) : holdings.length === 0 ? (
        <div className="empty">
          <BarChart3 size={40} color="rgba(255,255,255,.12)" />
          <p>No positions yet. Buy your first stock above.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>Commission-free · All US-listed equities · Real-time quotes</p>
          {accounts.length === 0 && <p style={{ color: '#fbbf24', fontSize: 13 }}>⚠ You need an active bank account first.</p>}
        </div>
      ) : (
        <div className="pos-list">
          <div className="pos-hdr">
            <span>Stock</span><span>Shares</span><span>Buy Price</span><span>Current</span><span>Value</span><span>P&L (USD)</span><span></span>
          </div>
          {holdings.map(pos => {
            const pl    = pos.profitLoss ?? 0;
            const plPct = pos.profitLossPercent ?? 0;
            const isUp  = pl >= 0;
            return (
              <div key={pos._id} className="pos-row">
                <div className="pos-sym-cell">
                  <div className="pos-ico" style={{ background: isUp ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)' }}>
                    {isUp ? <TrendingUp size={14} color="#34d399" /> : <TrendingDown size={14} color="#f87171" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: '0.06em' }}>{pos.symbol}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pos.companyName}</div>
                    {/* Mobile summary */}
                    <div className="pos-mob">
                      <span>{pos.shares} sh @ {usd(pos.buyPrice)}</span>
                      <span style={{ color: isUp ? '#34d399' : '#f87171' }}>{isUp ? '+' : ''}{usd(pl)} ({fmtPct(plPct)})</span>
                    </div>
                  </div>
                </div>
                {/* Desktop columns */}
                <span className="pos-col">{pos.shares}</span>
                <span className="pos-col" style={{ fontFamily: 'monospace' }}>{usd(pos.buyPrice)}</span>
                <span className="pos-col" style={{ fontFamily: 'monospace' }}>{pos.currentPrice ? usd(pos.currentPrice) : '—'}</span>
                <span className="pos-col" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{usd(pos.currentValue)}</span>
                <span className="pos-col" style={{ color: isUp ? '#34d399' : '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>
                  {isUp ? '+' : ''}{usd(pl)}<br />
                  <span style={{ fontSize: 11 }}>{fmtPct(plPct)}</span>
                </span>
                <span className="pos-col">
                  <button className="nx-actbtn" onClick={() => setSelling(pos)}
                    style={{ borderColor: 'rgba(248,113,113,.25)', color: '#f87171', fontSize: 12 }}>
                    Sell
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="disclaimer">
        <AlertCircle size={13} color="rgba(255,255,255,.35)" />
        <span>Investment products are not FDIC insured and may lose value. All prices are in USD via Alpaca Markets. Currency conversion may apply for non-USD accounts.</span>
      </div>

      {buying && accounts.length > 0 && (
        <TradeModal mode="buy" accounts={accounts} onClose={() => setBuying(false)} onDone={load} />
      )}
      {selling && (
        <TradeModal mode="sell" position={selling} accounts={accounts} onClose={() => setSelling(null)} onDone={load} />
      )}
      <IS />
    </div>
  );
}

function IS() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      .pg { min-height:100vh; background:#0a0f1a; color:#e2e8f0; font-family:'Inter',system-ui,sans-serif; padding:20px 16px; }
      @media(min-width:640px)  { .pg { padding:32px 28px; } }
      @media(min-width:1024px) { .pg { padding:36px 40px; } }
      .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
      .ttl { font-size:22px; font-weight:800; color:#fff; letter-spacing:-.5px; margin:0; }
      @media(min-width:640px) { .ttl { font-size:26px; } }
      .sub { color:rgba(255,255,255,.4); font-size:13px; margin:3px 0 0; }
      .addbtn { display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#34d399,#059669); color:#050d1a; border:none; border-radius:10px; padding:10px 16px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
      .addbtn:disabled { opacity:.5; cursor:not-allowed; }
      .nx-actbtn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:9px; padding:9px 14px; font-size:13px; font-weight:600; color:rgba(255,255,255,.6); cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
      .nx-actbtn:hover { background:rgba(255,255,255,.08); }
      .nx-actbtn:disabled { opacity:.4; cursor:not-allowed; }
      .port-card { background:linear-gradient(135deg,#0a2342,#0d2d52); border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:22px; margin-bottom:28px; position:relative; overflow:hidden; }
      @media(min-width:640px) { .port-card { padding:28px; } }
      .port-card::before { content:''; position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:radial-gradient(circle,rgba(52,211,153,.1),transparent 70%); border-radius:50%; pointer-events:none; }
      .port-inner { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px; }
      .pc-label { font-size:12px; color:rgba(255,255,255,.45); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; display:flex; align-items:center; }
      .pc-value { font-size:28px; font-weight:900; color:#fff; letter-spacing:-1px; font-family:monospace; word-break:break-all; }
      @media(min-width:640px) { .pc-value { font-size:38px; } }
      .pc-stats { display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start; }
      .pc-stat { text-align:right; }
      .pc-stat-l { font-size:11px; color:rgba(255,255,255,.4); margin-bottom:4px; }
      .pc-stat-v { font-size:18px; font-weight:700; color:#fff; font-family:monospace; }
      .sec-title { font-size:16px; font-weight:700; color:#fff; display:flex; align-items:center; margin-bottom:14px; }
      .cen { display:flex; align-items:center; justify-content:center; gap:10px; padding:60px; color:rgba(255,255,255,.35); font-size:14px; }
      .empty { display:flex; flex-direction:column; align-items:center; padding:60px 20px; background:rgba(255,255,255,.02); border:1px dashed rgba(255,255,255,.08); border-radius:16px; text-align:center; gap:8px; margin-bottom:24px; }
      .empty p { color:rgba(255,255,255,.35); font-size:14px; margin:0; }
      .pos-list { background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.07); border-radius:16px; overflow:hidden; margin-bottom:20px; }
      .pos-hdr { display:none; }
      @media(min-width:700px) { .pos-hdr { display:grid; grid-template-columns:2fr 70px 110px 110px 110px 120px 70px; padding:11px 18px; border-bottom:1px solid rgba(255,255,255,.06); background:rgba(255,255,255,.02); font-size:10px; font-weight:700; color:rgba(255,255,255,.3); letter-spacing:.07em; text-transform:uppercase; } }
      .pos-row { display:flex; flex-direction:column; padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.04); }
      .pos-row:last-child { border-bottom:none; }
      .pos-row:hover { background:rgba(255,255,255,.03); }
      @media(min-width:700px) { .pos-row { display:grid; grid-template-columns:2fr 70px 110px 110px 110px 120px 70px; align-items:center; padding:13px 18px; } }
      .pos-sym-cell { display:flex; align-items:center; gap:11px; min-width:0; }
      .pos-ico { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .pos-col { display:none; font-size:13px; color:rgba(255,255,255,.7); }
      @media(min-width:700px) { .pos-col { display:block; } }
      .pos-mob { display:flex; flex-direction:column; gap:2px; margin-top:4px; font-size:12px; color:rgba(255,255,255,.4); }
      @media(min-width:700px) { .pos-mob { display:none; } }
      .disclaimer { display:flex; align-items:flex-start; gap:8px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:12px 14px; font-size:12px; color:rgba(255,255,255,.3); line-height:1.5; }
      /* Modal */
      .nx-over { position:fixed; inset:0; background:rgba(0,0,0,.75); backdrop-filter:blur(6px); z-index:9000; display:flex; align-items:flex-end; justify-content:center; }
      @media(min-width:600px) { .nx-over { align-items:center; padding:16px; } }
      .nx-modal { background:#111826; border:1px solid rgba(255,255,255,.1); border-radius:20px 20px 0 0; padding:24px 20px; width:100%; max-width:440px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
      @media(min-width:600px) { .nx-modal { border-radius:20px; padding:28px; } }
      .nx-mhdr { display:flex; justify-content:space-between; align-items:center; }
      .nx-mtitle { font-size:17px; font-weight:800; margin:0; }
      .nx-xbtn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.5); cursor:pointer; flex-shrink:0; }
      .nx-fg { display:flex; flex-direction:column; gap:6px; }
      .nx-lbl { font-size:12px; font-weight:600; color:rgba(255,255,255,.6); }
      .nx-inp { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; }
      .nx-inp::placeholder { color:rgba(255,255,255,.28); }
      .nx-inp:focus { border-color:rgba(245,158,11,.5); }
      .nx-inp:disabled { opacity:.5; }
      .nx-selwrap { position:relative; }
      .nx-sel { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; appearance:none; cursor:pointer; }
      .nx-sel option { background:#1e2940; color:#fff; }
      .nx-sel-ico { position:absolute; right:12px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,.4); pointer-events:none; }
      .nx-subbtn { display:flex; align-items:center; justify-content:center; gap:8px; color:#fff; border:none; border-radius:12px; padding:13px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
      .nx-subbtn:disabled { opacity:.5; cursor:not-allowed; }
      @keyframes spin { to { transform:rotate(360deg); } }
      .nx-spin { animation:spin 1s linear infinite; }
    `}</style>
  );
}