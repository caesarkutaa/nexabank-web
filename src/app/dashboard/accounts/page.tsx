'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, CreditCard, Snowflake, Sun, Pencil, Trash2,
  ArrowUpRight, ArrowDownLeft, Copy, CheckCircle,
  Loader2, X, Building2, TrendingUp,
  DollarSign, Eye, EyeOff, ShieldAlert, Mail,
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface Account {
  _id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings' | 'money_market';
  status: 'active' | 'frozen' | 'closed' | 'dormant';
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  interestRate: number;
  totalDeposited: number;
  totalWithdrawn: number;
  isPrimary: boolean;
  nickname?: string;
  createdAt: string;
  adminFrozen?: boolean;  // true = frozen by admin, user CANNOT self-unfreeze
}

function fmtCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2,
    }).format(amount);
  } catch { return `${currency} ${amount.toFixed(2)}`; }
}

function getSummaryCurrency(accounts: Account[]): string {
  return accounts.find(a => a.isPrimary)?.currency ?? accounts[0]?.currency ?? 'USD';
}

const TYPE_LABELS: Record<string, string> = {
  checking: 'Checking', savings: 'Savings', money_market: 'Money Market',
};
const TYPE_GRAD: Record<string, string> = {
  checking:     'linear-gradient(135deg,#1e3a5f,#0a2342)',
  savings:      'linear-gradient(135deg,#064e3b,#022c22)',
  money_market: 'linear-gradient(135deg,#4c1d95,#2e1065)',
};
const TYPE_ACCENT: Record<string, string> = {
  checking: '#60a5fa', savings: '#34d399', money_market: '#a78bfa',
};

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="nx-overlay">
      <div className="nx-modal">{children}</div>
      <style>{`
        .nx-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px}
        @media(max-width:600px){.nx-overlay{align-items:flex-end}}
        .nx-modal{background:#111826;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto}
        @media(max-width:600px){.nx-modal{border-radius:20px 20px 0 0}}
      `}</style>
    </div>
  );
}

function OpenModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<'checking' | 'savings' | 'money_market'>('checking');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/accounts', { accountType: type });
      toast.success('Account opened!');
      onDone(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div className="mh"><h3 className="mt">Open New Account</h3><button className="xbtn" onClick={onClose}><X size={16} /></button></div>
      <p className="msub">Choose the account type. Currency will match your profile setting.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0' }}>
        {(['checking', 'savings', 'money_market'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} className={`typebtn ${type === t ? 'typebtn-active' : ''}`} style={{ '--acc': TYPE_ACCENT[t] } as any}>
            <span style={{ color: type === t ? TYPE_ACCENT[t] : 'rgba(255,255,255,.65)', fontWeight: 700, fontSize: 14 }}>{TYPE_LABELS[t]}</span>
            {type === t && <CheckCircle size={15} color={TYPE_ACCENT[t]} />}
            <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.38)', marginTop: 3 }}>
              {t === 'checking' ? 'Everyday spending · free transfers' : t === 'savings' ? 'Earn interest · 2.5% APY' : 'Higher yields · 4.1% APY'}
            </span>
          </button>
        ))}
      </div>
      <button className="subbtn" onClick={submit} disabled={loading}>
        {loading ? <><Loader2 size={15} className="nx-spin" />Opening…</> : 'Open Account'}
      </button>
      <style>{`
        .mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .mt{font-size:17px;font-weight:800;color:#fff;margin:0}
        .msub{color:rgba(255,255,255,.45);font-size:13px;margin:0}
        .xbtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);cursor:pointer}
        .typebtn{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 15px;cursor:pointer;text-align:left;font-family:inherit;transition:all .2s}
        .typebtn-active{background:color-mix(in srgb,var(--acc) 10%,transparent);border-color:var(--acc)}
        .subbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .subbtn:disabled{opacity:.5;cursor:not-allowed}
      `}</style>
    </Modal>
  );
}

function NickModal({ account, onClose, onDone }: { account: Account; onClose: () => void; onDone: () => void }) {
  const [nick, setNick] = useState(account.nickname || '');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await api.patch(`/accounts/${account._id}/nickname`, { nickname: nick }); toast.success('Nickname updated!'); onDone(); onClose(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Set Nickname</h3>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <input className="nxinput" value={nick} onChange={e => setNick(e.target.value)} placeholder="e.g. Emergency Fund" autoFocus />
      <button className="subbtn2" onClick={submit} disabled={loading || !nick.trim()}>
        {loading ? <><Loader2 size={15} className="nx-spin" />Saving…</> : 'Save Nickname'}
      </button>
      <style>{`
        .nxinput{width:100%;background:#1e2940!important;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:11px 14px;font-size:14px;color:#fff!important;outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:16px;-webkit-text-fill-color:#fff}
        .nxinput::placeholder{color:rgba(255,255,255,.3)}
        .nxinput:focus{border-color:rgba(245,158,11,.5)}
        .subbtn2{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .subbtn2:disabled{opacity:.5;cursor:not-allowed}
      `}</style>
    </Modal>
  );
}

function CloseModal({ account, onClose, onDone }: { account: Account; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await api.delete(`/accounts/${account._id}`); toast.success('Account closed.'); onDone(); onClose(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Cannot close'); }
    finally { setLoading(false); }
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f87171', margin: 0 }}>Close Account</h3>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: 13, marginBottom: 16 }}>
        <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>⚠️ Permanent. Balance must be zero. Cannot close primary account.</p>
      </div>
      <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginBottom: 20 }}>
        Close <strong style={{ color: 'white' }}>{account.nickname || TYPE_LABELS[account.accountType]}</strong> ···{account.accountNumber.slice(-4)}?
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ flex: 1, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {loading ? <Loader2 size={15} className="nx-spin" /> : null} Close Account
        </button>
      </div>
    </Modal>
  );
}

// ─── Admin Frozen Notice — shown instead of freeze/unfreeze button ─────────────
function AdminFrozenNotice() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 9, padding: '8px 12px', marginTop: 2 }}>
      <ShieldAlert size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', display: 'block' }}>Frozen by compliance team</span>
        <a href="mailto:support@nexabank.com" style={{ fontSize: 11, color: 'rgba(96,165,250,.7)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
          <Mail size={10} /> Contact support@nexabank.com to unfreeze
        </a>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AccountsPage() {
  const [accounts,    setAccounts]    = useState<Account[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showBal,     setShowBal]     = useState(true);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [freezingId,  setFreezingId]  = useState<string | null>(null);
  const [openModal,   setOpenModal]   = useState(false);
  const [nickTarget,  setNickTarget]  = useState<Account | null>(null);
  const [closeTarget, setCloseTarget] = useState<Account | null>(null);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/accounts');
      const all: Account[] = res.data.data || [];
      setAccounts(all.filter(a => a.status !== 'closed'));
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied!');
  };

  const freeze = async (a: Account) => {
    // Client-side guard — show clear message before even hitting the API
    if (a.adminFrozen && a.status === 'frozen') {
      toast.error('This account was frozen by our team. Contact support@nexabank.com to unfreeze it.');
      return;
    }
    setFreezingId(a._id);
    try {
      await api.post(`/accounts/${a._id}/freeze`);
      toast.success(a.status === 'frozen' ? 'Account unfrozen' : 'Account frozen');
      load();
    } catch (e: any) {
      // Backend 403 message is already user-friendly
      toast.error(e.response?.data?.message || 'Failed');
    }
    finally { setFreezingId(null); }
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#0a0f1a' }} />;

  const sumCurrency = getSummaryCurrency(accounts);
  const totalBal    = accounts.reduce((s, a) => s + a.balance, 0);
  const totalAvail  = accounts.reduce((s, a) => s + a.availableBalance, 0);
  const totalPend   = accounts.reduce((s, a) => s + a.pendingBalance, 0);

  return (
    <div className="pg">
      {/* Header */}
      <div className="hdr">
        <div>
          <h1 className="title">My Accounts</h1>
          <p className="sub">Manage your NexaBank accounts</p>
        </div>
        <button className="addbtn" onClick={() => setOpenModal(true)}>
          <Plus size={15} /> Open Account
        </button>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        {[
          { label: 'Total Balance', val: totalBal,   Icon: DollarSign, c: '#f59e0b' },
          { label: 'Available',     val: totalAvail,  Icon: TrendingUp,  c: '#34d399' },
          { label: 'Pending',       val: totalPend,   Icon: Building2,   c: '#60a5fa' },
        ].map(({ label, val, Icon, c }) => (
          <div key={label} className="sumcard">
            <div className="sumcard-top">
              <span className="sumlabel">{label}</span>
              <div className="sumico" style={{ background: `${c}18` }}><Icon size={14} color={c} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sumval">{showBal ? fmtCurrency(val, sumCurrency) : '••••••'}</span>
              {label === 'Total Balance' && (
                <button className="eyebtn" onClick={() => setShowBal(v => !v)}>
                  {showBal ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="loader-row"><Loader2 size={20} className="nx-spin" /> Loading accounts…</div>
      ) : accounts.length === 0 ? (
        <div className="empty">
          <CreditCard size={36} color="rgba(255,255,255,.15)" />
          <p>No accounts yet. Open your first one above.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {accounts.map(a => {
            const frozen     = a.status === 'frozen';
            const adminFroze = frozen && !!a.adminFrozen;  // admin-locked
            const acc        = TYPE_ACCENT[a.accountType];
            const f          = (n: number) => fmtCurrency(n, a.currency || 'USD');

            return (
              <div key={a._id} className="acard"
                style={{ borderColor: adminFroze ? 'rgba(239,68,68,.3)' : frozen ? 'rgba(96,165,250,.3)' : 'rgba(255,255,255,.08)' }}>

                {/* Card top */}
                <div className="acard-top" style={{ background: TYPE_GRAD[a.accountType] }}>
                  <div className="acard-shine" style={{ background: `${acc}14` }} />
                  <div className="acard-header">
                    <div>
                      <div className="acard-type">{TYPE_LABELS[a.accountType]}</div>
                      <div className="acard-name">{a.nickname || `${TYPE_LABELS[a.accountType]} Account`}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.25)', color: '#f59e0b', letterSpacing: '0.06em' }}>
                        {a.currency || 'USD'}
                      </span>
                      {a.isPrimary && <span className="badge badge-gold">PRIMARY</span>}
                      {/* Status badge — red border if admin-frozen */}
                      <span className="badge" style={{
                        background: adminFroze ? 'rgba(239,68,68,.2)' : frozen ? 'rgba(96,165,250,.2)' : 'rgba(52,211,153,.2)',
                        border: `1px solid ${adminFroze ? 'rgba(239,68,68,.4)' : frozen ? 'rgba(96,165,250,.4)' : 'rgba(52,211,153,.4)'}`,
                        color: adminFroze ? '#f87171' : frozen ? '#60a5fa' : '#34d399',
                      }}>
                        {adminFroze ? '🔒 FROZEN' : frozen ? '🔒 FROZEN' : '● ACTIVE'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="acard-bal-label">Available Balance</div>
                    <div className="acard-bal">{showBal ? f(a.availableBalance) : '•••••••'}</div>
                    {a.pendingBalance > 0 && <div className="acard-pend">{f(a.pendingBalance)} pending</div>}
                  </div>
                </div>

                {/* Card body */}
                <div className="acard-body">
                  <div className="accnum-row">
                    <div>
                      <div className="accnum-label">Account No.</div>
                      <div className="accnum-val">····{a.accountNumber.slice(-4)}</div>
                    </div>
                    <button className="copybtn" onClick={() => copy(a.accountNumber, a._id)}>
                      {copiedId === a._id ? <CheckCircle size={14} color="#34d399" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="stats-row">
                    {[
                      { label: 'Total In',  val: a.totalDeposited, Icon: ArrowDownLeft, c: '#34d399' },
                      { label: 'Total Out', val: a.totalWithdrawn,  Icon: ArrowUpRight,  c: '#f87171' },
                    ].map(({ label, val, Icon, c }) => (
                      <div key={label} className="statbox">
                        <div className="statbox-top"><Icon size={11} color={c} /><span className="statbox-label">{label}</span></div>
                        <div className="statbox-val">{showBal ? f(val) : '•••••'}</div>
                      </div>
                    ))}
                  </div>

                  <div className="routing">
                    Routing: <span style={{ color: 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>{a.routingNumber}</span>
                    {a.interestRate > 0 && <span style={{ marginLeft: 14 }}>APY: <span style={{ color: acc }}>{a.interestRate}%</span></span>}
                  </div>

                  {/* Actions */}
                  <div className="actions-row">
                    {/* ── Freeze button — hidden if admin-frozen, shows notice instead ── */}
                    {adminFroze ? (
                      <AdminFrozenNotice />
                    ) : (
                      <button className="actbtn" onClick={() => freeze(a)} disabled={freezingId === a._id}
                        style={{ borderColor: frozen ? 'rgba(96,165,250,.35)' : 'rgba(255,255,255,.12)', color: frozen ? '#60a5fa' : 'rgba(255,255,255,.6)' }}>
                        {freezingId === a._id ? <Loader2 size={12} className="nx-spin" /> : frozen ? <Sun size={12} /> : <Snowflake size={12} />}
                        {frozen ? 'Unfreeze' : 'Freeze'}
                      </button>
                    )}
                    <button className="actbtn" onClick={() => setNickTarget(a)} style={{ borderColor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)' }}>
                      <Pencil size={12} /> Rename
                    </button>
                    {!a.isPrimary && (
                      <button className="actbtn" onClick={() => setCloseTarget(a)} style={{ borderColor: 'rgba(239,68,68,.25)', color: '#f87171' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openModal   && <OpenModal  onClose={() => setOpenModal(false)}   onDone={load} />}
      {nickTarget  && <NickModal  account={nickTarget}  onClose={() => setNickTarget(null)}  onDone={load} />}
      {closeTarget && <CloseModal account={closeTarget} onClose={() => setCloseTarget(null)} onDone={load} />}

      <style>{`
        *{box-sizing:border-box}
        .pg{min-height:100vh;background:#0a0f1a;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:28px 20px}
        @media(min-width:640px){.pg{padding:32px 28px}}
        @media(min-width:1024px){.pg{padding:36px 40px}}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:12px;flex-wrap:wrap}
        .title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;margin:0}
        @media(min-width:640px){.title{font-size:26px}}
        .sub{color:rgba(255,255,255,.4);font-size:13px;margin:3px 0 0}
        .addbtn{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#050d1a;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
        .summary-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:24px}
        @media(min-width:480px){.summary-grid{grid-template-columns:repeat(3,1fr)}}
        .sumcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px}
        .sumcard-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .sumlabel{font-size:12px;color:rgba(255,255,255,.45);font-weight:500}
        .sumico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center}
        .sumval{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;font-family:monospace}
        @media(min-width:640px){.sumval{font-size:20px}}
        @media(min-width:1024px){.sumval{font-size:22px}}
        .eyebtn{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;padding:2px;display:flex;align-items:center}
        .loader-row{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:rgba(255,255,255,.35);font-size:14px}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.08);border-radius:16px;text-align:center}
        .empty p{color:rgba(255,255,255,.35);font-size:14px;margin:10px 0 0}
        .cards-grid{display:grid;grid-template-columns:1fr;gap:18px}
        @media(min-width:640px){.cards-grid{grid-template-columns:repeat(2,1fr)}}
        @media(min-width:1280px){.cards-grid{grid-template-columns:repeat(3,1fr)}}
        .acard{background:rgba(255,255,255,.03);border:1px solid;border-radius:20px;overflow:hidden}
        .acard-top{padding:22px 22px 18px;position:relative;overflow:hidden}
        .acard-shine{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;pointer-events:none}
        .acard-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;position:relative;gap:8px;flex-wrap:wrap}
        .acard-type{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
        .acard-name{font-size:14px;font-weight:700;color:#fff}
        .badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.05em;display:inline-block}
        .badge-gold{background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.4);color:#f59e0b}
        .acard-bal-label{font-size:11px;color:rgba(255,255,255,.4);margin-bottom:3px}
        .acard-bal{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.3px;font-family:monospace;word-break:break-all}
        .acard-pend{font-size:12px;color:rgba(255,255,255,.38);margin-top:3px}
        .acard-body{padding:18px 22px}
        .accnum-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px 13px;margin-bottom:14px}
        .accnum-label{font-size:10px;color:rgba(255,255,255,.3);margin-bottom:2px}
        .accnum-val{font-size:14px;font-weight:600;color:#fff;font-family:monospace;letter-spacing:.08em}
        .copybtn{background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;padding:3px;display:flex;align-items:center}
        .stats-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}
        .statbox{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px 12px}
        .statbox-top{display:flex;align-items:center;gap:5px;margin-bottom:4px}
        .statbox-label{font-size:11px;color:rgba(255,255,255,.38)}
        .statbox-val{font-size:13px;font-weight:700;color:#fff;font-family:monospace}
        .routing{font-size:12px;color:rgba(255,255,255,.3);margin-bottom:14px}
        .actions-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .actbtn{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.03);border:1px solid;border-radius:8px;padding:7px 11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s}
        .actbtn:disabled{opacity:.4;cursor:not-allowed}
        @keyframes nx-spin{to{transform:rotate(360deg)}}.nx-spin{animation:nx-spin 1s linear infinite}
      `}</style>
    </div>
  );
}