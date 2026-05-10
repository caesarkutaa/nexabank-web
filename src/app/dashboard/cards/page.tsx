'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Plus, Snowflake, Sun, Eye, EyeOff,
  Trash2, Loader2, X, Copy, CheckCircle, AlertCircle,
  Wifi, Shield, Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Card {
  _id: string;
  last4: string;
  network: 'visa' | 'mastercard';
  expiryMonth: number;
  expiryYear: number;
  expiry: string;
  cardHolderName: string;
  status: 'active' | 'frozen' | 'cancelled' | 'expired';
  nickname?: string;
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentThisMonth: number;
  onlinePayments: boolean;
  internationalPayments: boolean;
  contactlessPayments: boolean;
  accountId: string;
  currency?: string;
  createdAt: string;
}

interface Account {
  _id: string;
  accountNumber: string;
  accountType: string;
  nickname?: string;
  availableBalance: number;
  currency: string;
  status: string;
}

function fmtC(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch { return `${currency || 'USD'} ${(amount ?? 0).toFixed(2)}`; }
}

function getCurrencySymbol(currency: string): string {
  try {
    return (0).toLocaleString(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
  } catch { return currency; }
}

const CARD_GRADIENTS: Record<string, string> = {
  visa:       'linear-gradient(135deg,#1e3a5f 0%,#0a2342 100%)',
  mastercard: 'linear-gradient(135deg,#4c1d95 0%,#2e1065 100%)',
  default:    'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
};

const maskedNum = (last4: string) => `•••• •••• •••• ${last4 ?? '••••'}`;

// ─── Confirm Delete Modal ────────────────────────────────────────────────────
function ConfirmDeleteModal({ card, onClose, onConfirm, loading }: {
  card: Card; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="nx-over" style={{ zIndex: 10000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal" style={{ maxWidth: 400 }}>
        <div className="nx-mhdr">
          <h3 className="nx-mtitle" style={{ color: '#f87171' }}>Cancel Card</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
              This will permanently cancel your card ending in <strong>{card.last4}</strong>. This action cannot be undone.
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: 0 }}>
          Any pending transactions will still be processed. You can issue a new card at any time.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Keep Card
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: loading ? 0.6 : 1 }}>
            {loading ? <Loader2 size={15} className="nx-spin" /> : <Trash2 size={15} />}
            Cancel Card
          </button>
        </div>
      </div>
      <Styles />
    </div>
  );
}

// ─── Reveal Card Modal ────────────────────────────────────────────────────────
function RevealModal({ card, cardData, onClose }: {
  card: Card;
  cardData: { cardNumber: string; cvv: string; expiryMonth?: number; expiryYear?: number };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const grad = CARD_GRADIENTS[card.network] ?? CARD_GRADIENTS.default;
  const expiry = card.expiry ?? `${String(card.expiryMonth ?? cardData.expiryMonth ?? 0).padStart(2, '0')}/${card.expiryYear ?? cardData.expiryYear ?? ''}`;
  const formattedNum = cardData.cardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val.replace(/\s/g, ''));
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="nx-over" style={{ zIndex: 10000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal" style={{ maxWidth: 440 }}>
        <div className="nx-mhdr">
          <div>
            <h3 className="nx-mtitle">Full Card Details</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', margin: '2px 0 0' }}>Keep this information private</p>
          </div>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Full card visual */}
        <div style={{ background: grad, borderRadius: 16, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden', margin: '4px 0' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, background: 'rgba(255,255,255,.06)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, background: 'rgba(255,255,255,.04)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, position: 'relative' }}>
            <Wifi size={22} color="rgba(255,255,255,.6)" style={{ transform: 'rotate(90deg)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{card.network ?? 'visa'}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'white', letterSpacing: '3.5px', fontFamily: 'monospace', marginBottom: 24, position: 'relative', lineHeight: 1.4 }}>
            {formattedNum}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Card Holder</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>{card.cardHolderName}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expires</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>{expiry}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>CVV</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'monospace', letterSpacing: '0.2em' }}>{cardData.cvv}</div>
            </div>
          </div>
        </div>

        {/* Copy buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Card Number', value: cardData.cardNumber, display: formattedNum },
            { label: 'CVV',         value: cardData.cvv,        display: cardData.cvv },
            { label: 'Expiry',      value: expiry,              display: expiry },
          ].map(({ label, value, display }) => (
            <button key={label} onClick={() => copy(value, label)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: '0.06em' }}>{display}</div>
              </div>
              {copied === label
                ? <CheckCircle size={16} color="#34d399" />
                : <Copy size={15} color="rgba(255,255,255,.35)" />}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10, padding: '10px 13px' }}>
          <Shield size={14} color="#f87171" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0, lineHeight: 1.5 }}>
            Never share your card details with anyone. NexaBank will never ask for your CVV.
          </p>
        </div>

        <button onClick={onClose}
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
      <Styles />
    </div>
  );
}

// ─── Issue Card Modal ─────────────────────────────────────────────────────────
function IssueModal({ accounts, onClose, onDone }: {
  accounts: Account[]; onClose: () => void; onDone: () => void;
}) {
  const [accountId,      setAccountId]      = useState(accounts[0]?._id ?? '');
  const [cardHolderName, setCardHolderName] = useState('');
  const [loading,        setLoading]        = useState(false);

  const selAcc = accounts.find(a => a._id === accountId);
  const cur    = selAcc?.currency || 'USD';

  const submit = async () => {
    if (!accountId)             return toast.error('Select a billing account');
    if (!cardHolderName.trim()) return toast.error('Enter the card holder name');
    setLoading(true);
    try {
      await api.post('/cards/issue', {
        accountId,
        cardHolderName: cardHolderName.trim().toUpperCase(),
      });
      toast.success('Virtual card issued!');
      onDone(); onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to issue card');
    } finally { setLoading(false); }
  };

  return (
    <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal">
        <div className="nx-mhdr">
          <h3 className="nx-mtitle">Issue Virtual Card</h3>
          <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="nx-msub">Virtual card — instantly usable for online purchases.</p>

        <div className="nx-fields">
          <div className="nx-fg">
            <label className="nx-lbl">Billing Account</label>
            <div className="nx-selwrap">
              <select className="nx-sel" value={accountId} onChange={e => setAccountId(e.target.value)}>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>
                    [{a.currency || 'USD'}] {a.nickname || (a.accountType || 'account').replace(/_/g, ' ')} ···{a.accountNumber?.slice(-4)} — {fmtC(a.availableBalance, a.currency || 'USD')}
                  </option>
                ))}
              </select>
            </div>
            {selAcc && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>
                Card spend will be tracked in <strong style={{ color: '#f59e0b' }}>{cur}</strong>
              </span>
            )}
          </div>

          <div className="nx-fg">
            <label className="nx-lbl">Card Holder Name</label>
            <input
              className="nx-inp"
              value={cardHolderName}
              onChange={e => setCardHolderName(e.target.value.toUpperCase())}
              placeholder="e.g. JOHN DOE"
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>Appears on the virtual card</span>
          </div>
        </div>

        <button className="nx-subbtn" onClick={submit} disabled={loading || !accountId || !cardHolderName.trim()}>
          {loading ? <><Loader2 size={15} className="nx-spin" /> Issuing…</> : 'Issue Card'}
        </button>
      </div>
      <Styles />
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ card, accountMap, onClose, onRefresh, onDelete }: {
  card: Card;
  accountMap: Map<string, Account>;
  onClose: () => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  const [revealing,    setRevealing]    = useState(false);
  const [revealData,   setRevealData]   = useState<{ cardNumber: string; cvv: string } | null>(null);
  const [showReveal,   setShowReveal]   = useState(false);
  const [freezing,     setFreezing]     = useState(false);
  const [newLimit,     setNewLimit]     = useState(String(card.monthlyLimit ?? 0));
  const [updLimit,     setUpdLimit]     = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const linkedAccount = accountMap.get(card.accountId);
  const cur   = card.currency || linkedAccount?.currency || 'USD';
  const f     = (n: number) => fmtC(n, cur);
  const sym   = getCurrencySymbol(cur);
  const frozen    = card.status === 'frozen';
  const grad      = CARD_GRADIENTS[card.network] ?? CARD_GRADIENTS.default;
  const spent     = card.spentThisMonth ?? 0;
  const limit     = card.monthlyLimit ?? 1;
  const spendPct  = Math.min((spent / (limit || 1)) * 100, 100);
  const expiry    = card.expiry ?? `${String(card.expiryMonth ?? 0).padStart(2, '0')}/${card.expiryYear ?? ''}`;

  const reveal = async () => {
    setRevealing(true);
    try {
      const res = await api.post(`/cards/${card._id}/reveal`);
      setRevealData(res.data.data);
      setShowReveal(true);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Could not reveal card details'); }
    finally { setRevealing(false); }
  };

  const toggleFreeze = async () => {
    setFreezing(true);
    try {
      await api.post(`/cards/${card._id}/freeze`);
      toast.success(frozen ? 'Card unfrozen' : 'Card frozen');
      onRefresh(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Action failed'); }
    finally { setFreezing(false); }
  };

  const updateLimit = async () => {
    const val = parseFloat(newLimit);
    if (isNaN(val) || val <= 0) return toast.error('Enter a valid limit');
    setUpdLimit(true);
    try {
      await api.patch(`/cards/${card._id}/limits`, { monthlyLimit: val });
      toast.success('Spending limit updated');
      onRefresh();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update limit'); }
    finally { setUpdLimit(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/cards/${card._id}`);
      toast.success('Card cancelled successfully');
      onDelete(card._id);   // ← remove from list immediately, no reload needed
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to cancel card');
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="nx-over" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="nx-modal" style={{ maxWidth: 480 }}>
          <div className="nx-mhdr">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 className="nx-mtitle">Card Details</h3>
              <span style={{ fontSize: 10, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: 100, fontWeight: 700, letterSpacing: '0.06em' }}>{cur}</span>
            </div>
            <button className="nx-xbtn" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Card visual */}
          <div style={{ background: grad, borderRadius: 14, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden', margin: '2px 0' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,.05)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative' }}>
              <Wifi size={20} color="rgba(255,255,255,.5)" style={{ transform: 'rotate(90deg)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{card.network ?? 'visa'}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'white', letterSpacing: '3px', fontFamily: 'monospace', marginBottom: 20 }}>
              {maskedNum(card.last4)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Card Holder</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{card.cardHolderName}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{expiry}</div>
              </div>
            </div>
          </div>

          {/* Spend progress */}
          <div className="nx-spendbox">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Monthly spend</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>{f(spent)} / {f(limit)}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${spendPct}%`, background: spendPct > 85 ? '#ef4444' : spendPct > 60 ? '#f59e0b' : '#34d399', transition: 'width .5s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 5 }}>{f(limit - spent)} remaining</div>
          </div>

          {/* Reveal button */}
          <button className="nx-actbtn" onClick={reveal} disabled={revealing} style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
            {revealing ? <><Loader2 size={14} className="nx-spin" /> Revealing…</> : <><Eye size={14} /> Reveal Full Card Details</>}
          </button>

          {/* Update limit */}
          <div className="nx-fg">
            <label className="nx-lbl">Update Monthly Limit ({cur})</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700, pointerEvents: 'none', fontFamily: 'monospace' }}>{sym}</span>
                <input className="nx-inp" type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
                  style={{ paddingLeft: sym.length > 2 ? 40 : 28 }} />
              </div>
              <button className="nx-actbtn" onClick={updateLimit} disabled={updLimit} style={{ flexShrink: 0 }}>
                {updLimit ? <Loader2 size={13} className="nx-spin" /> : null} Save
              </button>
            </div>
          </div>

          {/* Freeze + Cancel */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="nx-actbtn" onClick={toggleFreeze} disabled={freezing}
              style={{ flex: 1, justifyContent: 'center', borderColor: frozen ? 'rgba(96,165,250,.35)' : 'rgba(255,255,255,.12)', color: frozen ? '#60a5fa' : 'rgba(255,255,255,.6)' }}>
              {freezing ? <Loader2 size={13} className="nx-spin" /> : frozen ? <Sun size={13} /> : <Snowflake size={13} />}
              {frozen ? 'Unfreeze' : 'Freeze'}
            </button>
            <button className="nx-actbtn" onClick={() => setShowDelete(true)}
              style={{ borderColor: 'rgba(239,68,68,.25)', color: '#f87171' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <Styles />
      </div>

      {/* Reveal modal — layered on top */}
      {showReveal && revealData && (
        <RevealModal card={card} cardData={revealData} onClose={() => setShowReveal(false)} />
      )}

      {/* Delete confirm modal — layered on top */}
      {showDelete && (
        <ConfirmDeleteModal
          card={card}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const [mounted,  setMounted]  = useState(false);
  const [cards,    setCards]    = useState<Card[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [issuing,  setIssuing]  = useState(false);
  const [selected, setSelected] = useState<Card | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      const [cR, aR] = await Promise.all([api.get('/cards'), api.get('/accounts')]);
      setCards(cR.data.data || []);
      setAccounts((aR.data.data || []).filter((a: Account) => a.status === 'active'));
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) load(); }, [load, mounted]);

  // ← Optimistic removal — card disappears immediately, no reload flash
  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c._id !== id));
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  const accountMap   = new Map(accounts.map(a => [a._id, a]));
  const primaryCur   = accounts.find(a => a.currency)?.currency || 'USD';
  const sf           = (n: number) => fmtC(n, primaryCur);
  const visibleCards = cards.filter(c => c.status !== 'cancelled');
  const activeCards  = cards.filter(c => c.status === 'active').length;
  const frozenCards  = cards.filter(c => c.status === 'frozen').length;
  const totalSpend   = cards.reduce((s, c) => s + (c.spentThisMonth ?? 0), 0);
  const totalLimit   = cards.reduce((s, c) => s + (c.monthlyLimit ?? 0), 0);
  const canIssueMore = visibleCards.length < 5;

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="ttl">Virtual Cards</h1>
          <p className="sub">Issue up to 5 virtual cards · Freeze or cancel anytime</p>
        </div>
        <button className="addbtn" onClick={() => setIssuing(true)} disabled={!canIssueMore || accounts.length === 0}>
          <Plus size={15} /> Issue New Card
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { l: 'Active Cards',  v: String(activeCards), c: '#34d399' },
          { l: 'Frozen Cards',  v: String(frozenCards), c: '#60a5fa' },
          { l: 'Total Spend',   v: sf(totalSpend),      c: '#f87171' },
          { l: 'Total Limit',   v: sf(totalLimit),      c: '#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="scard">
            <div className="scard-l">{l}</div>
            <div className="scard-v" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="cen"><Loader2 size={20} className="nx-spin" /> Loading cards…</div>
      ) : visibleCards.length === 0 ? (
        <div className="empty">
          <CreditCard size={40} color="rgba(255,255,255,.12)" />
          <p>No cards yet. Issue your first virtual card above.</p>
          {accounts.length === 0 && <p style={{ color: '#fbbf24', fontSize: 13 }}>⚠ You need at least one active account first.</p>}
        </div>
      ) : (
        <div className="cards-grid">
          {visibleCards.map(card => {
            const grad     = CARD_GRADIENTS[card.network] ?? CARD_GRADIENTS.default;
            const frozen   = card.status === 'frozen';
            const spent    = card.spentThisMonth ?? 0;
            const lim      = card.monthlyLimit ?? 1;
            const pct      = Math.min((spent / (lim || 1)) * 100, 100);
            const expiry   = card.expiry ?? `${String(card.expiryMonth ?? 0).padStart(2, '0')}/${card.expiryYear ?? ''}`;
            const cardCur  = card.currency || accountMap.get(card.accountId)?.currency || primaryCur;
            const cf       = (n: number) => fmtC(n, cardCur);

            return (
              <div key={card._id} className="vcard" onClick={() => setSelected(card)}>
                <div className="vcard-face" style={{ background: grad }}>
                  <div className="vcard-shine" />
                  {frozen && (
                    <div className="vcard-overlay">
                      <Lock size={24} color="rgba(96,165,250,.9)" />
                      <span>Frozen</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                    <Wifi size={18} color="rgba(255,255,255,.5)" style={{ transform: 'rotate(90deg)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{card.network ?? 'visa'}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'white', letterSpacing: '2.5px', fontFamily: 'monospace', marginBottom: 16 }}>
                    {maskedNum(card.last4)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Card Holder</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{card.cardHolderName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expires</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'white', fontFamily: 'monospace' }}>{expiry}</div>
                    </div>
                  </div>
                </div>

                <div className="vcard-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Monthly Spend</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>{cf(spent)} / {cf(lim)}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#34d399' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.28)' }}>🔐 Virtual · {(card.network ?? 'visa').toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.2)', color: '#f59e0b', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100 }}>{cardCur}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: frozen ? 'rgba(96,165,250,.12)' : 'rgba(52,211,153,.12)', color: frozen ? '#60a5fa' : '#34d399' }}>
                        {frozen ? '🔒 FROZEN' : '● ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {canIssueMore && (
            <button className="vcard-add" onClick={() => setIssuing(true)} disabled={accounts.length === 0}>
              <div className="vcard-add-inner">
                <Plus size={28} color="rgba(245,158,11,.5)" />
                <span>Issue New Card</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                  {5 - visibleCards.length} slot{5 - visibleCards.length === 1 ? '' : 's'} remaining
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="infobanner">
        <Shield size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Virtual cards use your account balance. Each card has its own spending limit and can be frozen or cancelled anytime. Maximum 5 active cards per account.</span>
      </div>

      {issuing && accounts.length > 0 && (
        <IssueModal accounts={accounts} onClose={() => setIssuing(false)} onDone={load} />
      )}
      {selected && (
        <DetailModal
          card={selected}
          accountMap={accountMap}
          onClose={() => setSelected(null)}
          onRefresh={load}
          onDelete={removeCard}
        />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .pg { min-height:100vh; background:#0a0f1a; color:#e2e8f0; font-family:'Inter',system-ui,sans-serif; padding:18px 14px; }
        @media(min-width:480px)  { .pg { padding:22px 18px; } }
        @media(min-width:768px)  { .pg { padding:28px 28px; } }
        @media(min-width:1024px) { .pg { padding:36px 40px; } }

        .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        @media(min-width:640px) { .hdr { margin-bottom:24px; align-items:center; } }
        .ttl { font-size:20px; font-weight:800; color:#fff; letter-spacing:-.5px; margin:0; }
        @media(min-width:480px) { .ttl { font-size:22px; } }
        @media(min-width:768px) { .ttl { font-size:26px; } }
        .sub { color:rgba(255,255,255,.4); font-size:13px; margin:3px 0 0; }
        .addbtn { display:inline-flex; align-items:center; gap:7px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; flex-shrink:0; }
        @media(min-width:480px) { .addbtn { padding:10px 16px; } }
        .addbtn:disabled { opacity:.5; cursor:not-allowed; }

        .stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:20px; }
        @media(min-width:640px) { .stats-grid { grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; } }
        .scard { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:13px 14px; }
        @media(min-width:640px) { .scard { padding:14px 16px; } }
        .scard-l { font-size:11px; color:rgba(255,255,255,.4); margin-bottom:5px; }
        @media(min-width:480px) { .scard-l { font-size:12px; } }
        .scard-v { font-size:16px; font-weight:800; letter-spacing:-.3px; font-family:monospace; word-break:break-all; }
        @media(min-width:480px) { .scard-v { font-size:18px; } }

        .cards-grid { display:grid; grid-template-columns:1fr; gap:14px; margin-bottom:20px; }
        @media(min-width:480px) { .cards-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
        @media(min-width:900px) { .cards-grid { grid-template-columns:repeat(3,1fr); gap:18px; } }

        .vcard { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:16px; overflow:hidden; cursor:pointer; transition:transform .15s,border-color .15s; }
        @media(min-width:640px) { .vcard { border-radius:18px; } }
        .vcard:hover { transform:translateY(-2px); border-color:rgba(255,255,255,.15); }
        .vcard-face { padding:18px; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; min-height:160px; }
        @media(min-width:640px) { .vcard-face { padding:20px; } }
        .vcard-shine { position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:rgba(255,255,255,.05); border-radius:50%; pointer-events:none; }
        .vcard-overlay { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; font-size:13px; font-weight:700; color:rgba(255,255,255,.7); backdrop-filter:blur(2px); }
        .vcard-body { padding:12px 14px; }
        @media(min-width:640px) { .vcard-body { padding:13px 16px; } }

        .vcard-add { background:rgba(255,255,255,.02); border:1.5px dashed rgba(245,158,11,.2); border-radius:16px; cursor:pointer; font-family:inherit; transition:all .2s; overflow:hidden; min-height:180px; width:100%; }
        @media(min-width:640px) { .vcard-add { border-radius:18px; } }
        .vcard-add:hover { background:rgba(245,158,11,.04); border-color:rgba(245,158,11,.4); }
        .vcard-add:disabled { opacity:.4; cursor:not-allowed; }
        .vcard-add-inner { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; height:100%; min-height:180px; padding:20px; color:rgba(255,255,255,.35); font-size:14px; font-weight:600; }

        .cen { display:flex; align-items:center; justify-content:center; gap:10px; padding:60px 20px; color:rgba(255,255,255,.35); font-size:14px; }
        .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:50px 20px; background:rgba(255,255,255,.02); border:1px dashed rgba(255,255,255,.08); border-radius:16px; text-align:center; gap:10px; margin-bottom:20px; }
        .empty p { color:rgba(255,255,255,.35); font-size:14px; margin:0; }
        .infobanner { display:flex; align-items:flex-start; gap:10px; background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.2); border-radius:12px; padding:12px 14px; font-size:12px; color:rgba(255,255,255,.5); line-height:1.5; }
        @media(min-width:640px) { .infobanner { font-size:13px; padding:14px 16px; } }

        @keyframes nx-spin { to { transform:rotate(360deg); } }
        .nx-spin { animation:nx-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      .nx-over { position:fixed; inset:0; background:rgba(0,0,0,.78); backdrop-filter:blur(6px); z-index:9000; display:flex; align-items:flex-end; justify-content:center; }
      @media(min-width:600px) { .nx-over { align-items:center; padding:16px; } }
      .nx-modal { background:#111826; border:1px solid rgba(255,255,255,.1); border-radius:20px 20px 0 0; padding:22px 18px; width:100%; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
      @media(min-width:600px) { .nx-modal { border-radius:20px; padding:26px; } }
      .nx-mhdr { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
      .nx-mtitle { font-size:17px; font-weight:800; color:#fff; margin:0; }
      .nx-msub { font-size:13px; color:rgba(255,255,255,.4); margin:0; }
      .nx-xbtn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.5); cursor:pointer; flex-shrink:0; }
      .nx-fields { display:flex; flex-direction:column; gap:14px; }
      .nx-fg { display:flex; flex-direction:column; gap:6px; }
      .nx-lbl { font-size:12px; font-weight:600; color:rgba(255,255,255,.6); }
      .nx-selwrap { position:relative; }
      .nx-sel { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; appearance:none; cursor:pointer; }
      .nx-sel option { background:#1e2940; color:#fff; }
      .nx-inp { width:100%; background:#1e2940!important; border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:11px 14px; font-size:14px; color:#fff!important; -webkit-text-fill-color:#fff!important; outline:none; font-family:inherit; }
      .nx-inp::placeholder { color:rgba(255,255,255,.28); }
      .nx-inp:focus { border-color:rgba(245,158,11,.5); }
      .nx-subbtn { display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#050d1a; border:none; border-radius:12px; padding:13px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:4px; }
      .nx-subbtn:disabled { opacity:.5; cursor:not-allowed; }
      .nx-actbtn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:9px; padding:9px 14px; font-size:13px; font-weight:600; color:rgba(255,255,255,.6); cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
      .nx-actbtn:hover { background:rgba(255,255,255,.08); }
      .nx-actbtn:disabled { opacity:.4; cursor:not-allowed; }
      .nx-spendbox { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:14px; }
      @keyframes nx-spin { to { transform:rotate(360deg); } }
      .nx-spin { animation:nx-spin 1s linear infinite; }
    `}</style>
  );
}