'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileImage,
  ShieldCheck,
  X,
  Banknote,
  Hash,
  Building2,
  Calendar,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import adminApi from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChequeItem {
  _id: string;
  userId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  accountId?: {
    _id?: string;
    accountNumber?: string;
    accountType?: string;
  };
  referenceNumber?: string;
  chequeNumber?: string;
  payerName?: string;
  payerBank?: string;
  amount: number;
  currency?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  status: 'submitted' | 'reviewing' | 'cleared' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const pageBg   = '#0a0f1a';
const cardBg   = '#111826';
const cardBg2  = '#0d1422';
const inputBg  = '#1a2235';
const gold     = '#f59e0b';
const goldDark = '#d97706';
const border   = 'rgba(255,255,255,.07)';
const text2    = 'rgba(255,255,255,.45)';
const text3    = 'rgba(255,255,255,.25)';

const inp: React.CSSProperties = {
  width: '100%',
  background: inputBg,
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  padding: '10px 13px',
  fontSize: 13,
  color: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  WebkitTextFillColor: '#fff',
  boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
};

const fg = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'rgba(245,158,11,.5)';
  e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.12)';
};

const br = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = 'rgba(255,255,255,.1)';
  e.target.style.boxShadow = 'none';
};

const formatMoney = (n: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n || 0);
  } catch {
    return `$${(n || 0).toFixed(2)}`;
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const statusStyles: Record<string, { bg: string; color: string }> = {
  submitted: { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  reviewing: { bg: 'rgba(245,158,11,.12)',  color: '#f59e0b' },
  cleared:   { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  rejected:  { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

function StatusBadge({ status }: { status: string }) {
  const sc = statusStyles[status] ?? statusStyles.submitted;
  const Icon = status === 'cleared' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock3;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '6px 11px',
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        background: sc.bg,
        color: sc.color,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: text2, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

// ─── Lightbox for cheque images ────────────────────────────────────────────────
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 2100,
        cursor: 'zoom-out',
        animation: 'fadeIn .15s ease',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          width: 40,
          height: 40,
          borderRadius: 12,
          border: `1px solid ${border}`,
          background: 'rgba(255,255,255,.06)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '88vh',
          borderRadius: 16,
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          cursor: 'default',
        }}
      />
    </div>
  );
}

// ─── Cheque image panel with front/back toggle ─────────────────────────────────
function ChequeImagePanel({ item }: { item: ChequeItem }) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const hasFront = !!item.frontImageUrl;
  const hasBack = !!item.backImageUrl;
  const activeSrc = side === 'front' ? item.frontImageUrl : item.backImageUrl;

  return (
    <div
      style={{
        background: cardBg2,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <FieldLabel>Uploaded Cheque</FieldLabel>
        {hasBack && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: 3 }}>
            {(['front', 'back'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                style={{
                  border: 'none',
                  background: side === s ? `linear-gradient(135deg, ${gold}, ${goldDark})` : 'transparent',
                  color: side === s ? '#111' : text2,
                  borderRadius: 7,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                  transition: 'all .15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSrc ? (
        <div
          onClick={() => setLightbox(activeSrc)}
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            border: `1px solid ${border}`,
            cursor: 'zoom-in',
            group: 'true',
          } as React.CSSProperties}
        >
          <img
            src={activeSrc}
            alt={`Cheque ${side}`}
            style={{
              width: '100%',
              display: 'block',
              objectFit: 'cover',
              maxHeight: 340,
              minHeight: 180,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(0,0,0,.55)',
              borderRadius: 9,
              padding: '6px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            <ZoomIn size={12} /> View full size
          </div>
        </div>
      ) : (
        <div
          style={{
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: `1px dashed ${border}`,
            borderRadius: 14,
            color: text2,
          }}
        >
          <FileImage size={30} color={text3} />
          <span style={{ fontSize: 13 }}>No cheque image uploaded</span>
        </div>
      )}

      {lightbox && (
        <ImageLightbox src={lightbox} alt={`Cheque ${side}`} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

// ─── Mobile card row ────────────────────────────────────────────────────────────
function ChequeCard({ item, onReview }: { item: ChequeItem; onReview: () => void }) {
  const name = `${item.userId?.firstName || ''} ${item.userId?.lastName || ''}`.trim() || 'Unknown User';
  return (
    <div
      style={{
        background: cardBg2,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ color: text2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.userId?.email || 'No email'}
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        <div>
          <FieldLabel>Reference</FieldLabel>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: 3, fontSize: 12.5 }}>
            {item.referenceNumber || '—'}
          </div>
        </div>
        <div>
          <FieldLabel>Amount</FieldLabel>
          <div style={{ fontFamily: 'monospace', fontWeight: 800, marginTop: 3, fontSize: 13.5 }}>
            {formatMoney(item.amount, item.currency)}
          </div>
        </div>
        <div>
          <FieldLabel>Account</FieldLabel>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: 3 }}>
            {item.accountId?.accountNumber || '—'}
          </div>
        </div>
        <div>
          <FieldLabel>Submitted</FieldLabel>
          <div style={{ marginTop: 3 }}>{formatDateTime(item.createdAt)}</div>
        </div>
      </div>

      <button
        onClick={onReview}
        style={{
          marginTop: 4,
          border: '1px solid rgba(245,158,11,.25)',
          background: 'rgba(245,158,11,.12)',
          color: gold,
          borderRadius: 10,
          padding: '10px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
        }}
      >
        <Eye size={15} />
        Review Submission
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminChequesPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChequeItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selected, setSelected] = useState<ChequeItem | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 860);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const showToast = (m: string, type: 'success' | 'error' = 'success') => {
    setToast(m);
    setToastType(type);
    setTimeout(() => setToast(''), 3200);
  };

  const load = useCallback(async (pg = 1, q = search, st = status) => {
    try {
      setLoading(true);

      const res = await adminApi.get('/admin/cheques', {
        params: {
          page: pg,
          limit: 10,
          search: q || undefined,
          status: st || undefined,
        },
      });

      const d = res.data.data ?? res.data;

      setItems(d.items ?? d.cheques ?? []);
      setPages(d.pagination?.pages ?? 1);
      setPage(d.pagination?.page ?? 1);
      setTotal(d.pagination?.total ?? 0);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load cheques', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) load();
  }, [mounted, load]);

  const pagesArray = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, pages]);

  const reviewCheque = async () => {
    if (!selected) return;

    try {
      setSubmitting(true);

      await adminApi.post(`/admin/cheques/${selected._id}/review`, {
        decision,
        reason: decision === 'rejected' ? reason : undefined,
      });

      showToast(`Cheque ${decision === 'approved' ? 'approved' : 'rejected'} successfully`, 'success');

      setSelected(null);
      setReason('');

      load(page);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        padding: 'clamp(14px, 4vw, 24px)',
        background: pageBg,
        minHeight: '100vh',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        * { box-sizing: border-box; }
        select option { background: #1a2235; color: #fff; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 8px; }
        .cheque-filters { display: grid; grid-template-columns: 2fr 1fr auto; gap: 12px; }
        @media (max-width: 720px) {
          .cheque-filters { grid-template-columns: 1fr; }
        }
        .cheque-modal-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 18px; }
        @media (max-width: 820px) {
          .cheque-modal-grid { grid-template-columns: 1fr; }
        }
        .cheque-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 420px) {
          .cheque-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(20px, 3.5vw, 30px)',
              fontWeight: 800,
              letterSpacing: '-.4px',
            }}
          >
            Cheque Deposits
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: text2,
              fontSize: 13.5,
              maxWidth: 460,
            }}
          >
            Review and process customer cheque deposit submissions.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: '10px 16px',
            boxShadow: '0 1px 0 rgba(255,255,255,.03) inset',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(245,158,11,.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={17} color={gold} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: text3, fontWeight: 700, letterSpacing: '.06em' }}>
              TOTAL SUBMISSIONS
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>{total}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 18,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div className="cheque-filters">
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              color={text3}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
              placeholder="Search reference, user email or account"
              style={{ ...inp, paddingLeft: 36 }}
              onFocus={fg}
              onBlur={br}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
            onFocus={fg}
            onBlur={br}
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="reviewing">Reviewing</option>
            <option value="cleared">Cleared</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => load(1)}
            style={{
              border: 'none',
              background: `linear-gradient(135deg, ${gold}, ${goldDark})`,
              color: '#111',
              fontWeight: 800,
              borderRadius: 12,
              padding: '0 20px',
              minHeight: 42,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              transition: 'filter .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            Filter
          </button>
        </div>
      </div>

      {/* Desktop table */}
      {!isMobile && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 22,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(255,255,255,.02)',
                    borderBottom: `1px solid ${border}`,
                  }}
                >
                  {['Customer', 'Reference', 'Account', 'Amount', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        fontSize: 11,
                        color: text2,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                      <Loader2 size={26} color={gold} style={{ animation: 'spin 1s linear infinite' }} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                      <FileImage size={40} color={text3} style={{ marginBottom: 14 }} />
                      <div style={{ fontWeight: 700 }}>No cheque deposits found</div>
                      <div style={{ marginTop: 6, color: text2, fontSize: 14 }}>
                        Try changing your filters or search query.
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const name = `${item.userId?.firstName || ''} ${item.userId?.lastName || ''}`.trim();

                    return (
                      <tr
                        key={item._id}
                        style={{ borderBottom: `1px solid ${border}`, transition: 'background .15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: 16 }}>
                          <div style={{ fontWeight: 700, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name || 'Unknown User'}
                          </div>
                          <div style={{ color: text2, fontSize: 13, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.userId?.email || 'No email'}
                          </div>
                        </td>

                        <td style={{ padding: 16 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                            {item.referenceNumber || '—'}
                          </div>
                        </td>

                        <td style={{ padding: 16 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {item.accountId?.accountNumber || '—'}
                          </div>
                          <div style={{ color: text2, fontSize: 12, textTransform: 'capitalize' }}>
                            {item.accountId?.accountType || 'Checking'}
                          </div>
                        </td>

                        <td style={{ padding: 16 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                            {formatMoney(item.amount, item.currency)}
                          </div>
                        </td>

                        <td style={{ padding: 16 }}>
                          <StatusBadge status={item.status} />
                        </td>

                        <td style={{ padding: 16 }}>
                          <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatDateTime(item.createdAt)}</div>
                        </td>

                        <td style={{ padding: 16 }}>
                          <button
                            onClick={() => {
                              setSelected(item);
                              setDecision('approved');
                              setReason('');
                            }}
                            style={{
                              border: '1px solid rgba(245,158,11,.25)',
                              background: 'rgba(245,158,11,.12)',
                              color: gold,
                              borderRadius: 10,
                              padding: '9px 12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              whiteSpace: 'nowrap',
                              transition: 'background .15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245,158,11,.2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(245,158,11,.12)')}
                          >
                            <Eye size={15} />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              flexWrap: 'wrap',
              gap: 12,
              borderTop: `1px solid ${border}`,
            }}
          >
            <div style={{ color: text2, fontSize: 13 }}>
              Showing page {page} of {pages}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: cardBg2,
                  color: '#fff',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>

              {pagesArray.map((p) => (
                <button
                  key={p}
                  onClick={() => load(p)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: `1px solid ${p === page ? 'transparent' : border}`,
                    background: p === page ? `linear-gradient(135deg, ${gold}, ${goldDark})` : cardBg2,
                    color: p === page ? '#111' : '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= pages}
                onClick={() => load(page + 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: cardBg2,
                  color: '#fff',
                  cursor: page >= pages ? 'not-allowed' : 'pointer',
                  opacity: page >= pages ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile card list */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: 50, textAlign: 'center' }}>
              <Loader2 size={26} color={gold} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 18,
                padding: 50,
                textAlign: 'center',
              }}
            >
              <FileImage size={36} color={text3} style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700 }}>No cheque deposits found</div>
              <div style={{ marginTop: 6, color: text2, fontSize: 13 }}>
                Try changing your filters or search query.
              </div>
            </div>
          ) : (
            items.map((item) => (
              <ChequeCard
                key={item._id}
                item={item}
                onReview={() => {
                  setSelected(item);
                  setDecision('approved');
                  setReason('');
                }}
              />
            ))
          )}

          {items.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: 14,
                gap: 12,
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: cardBg2,
                  color: '#fff',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: 13, color: text2 }}>
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => load(page + 1)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: cardBg2,
                  color: '#fff',
                  cursor: page >= pages ? 'not-allowed' : 'pointer',
                  opacity: page >= pages ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.7)',
            backdropFilter: 'blur(7px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(8px, 3vw, 16px)',
            zIndex: 1000,
            animation: 'fadeIn .15s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '94vh',
              overflowY: 'auto',
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 'clamp(14px, 3vw, 24px)',
              padding: 'clamp(16px, 4vw, 22px)',
              animation: 'slideUp .2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800 }}>
                  Review Cheque Deposit
                </h2>
                <p style={{ margin: '6px 0 0', color: text2, fontSize: 13.5 }}>
                  Verify cheque details before clearing or rejecting.
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cheque-modal-grid">
              <ChequeImagePanel item={selected} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Details card */}
                <div
                  style={{
                    background: cardBg2,
                    border: `1px solid ${border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div className="cheque-detail-grid">
                    <div>
                      <FieldLabel>Customer</FieldLabel>
                      <div style={{ marginTop: 6, fontWeight: 700 }}>
                        {selected.userId?.firstName} {selected.userId?.lastName}
                      </div>
                      <div style={{ marginTop: 1, fontSize: 12, color: text2 }}>
                        {selected.userId?.email || '—'}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Amount</FieldLabel>
                      <div style={{ marginTop: 6, fontWeight: 800, fontFamily: 'monospace', fontSize: 15 }}>
                        {formatMoney(selected.amount, selected.currency)}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Cheque Number</FieldLabel>
                      <div style={{ marginTop: 6, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Hash size={12} color={text3} />
                        {selected.chequeNumber || '—'}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Payer</FieldLabel>
                      <div style={{ marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={12} color={text3} />
                        <span>
                          {selected.payerName || '—'}
                          {selected.payerBank ? ` · ${selected.payerBank}` : ''}
                        </span>
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Account Number</FieldLabel>
                      <div style={{ marginTop: 6, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Banknote size={12} color={text3} />
                        {selected.accountId?.accountNumber || '—'}
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Submitted</FieldLabel>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} color={text3} />
                        {formatDateTime(selected.createdAt)}
                      </div>
                    </div>

                    {selected.rejectionReason && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <FieldLabel>Previous Rejection Reason</FieldLabel>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: '#fca5a5',
                            background: 'rgba(248,113,113,.08)',
                            border: '1px solid rgba(248,113,113,.18)',
                            borderRadius: 9,
                            padding: '8px 11px',
                          }}
                        >
                          {selected.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision card */}
                <div
                  style={{
                    background: cardBg2,
                    border: `1px solid ${border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <FieldLabel>Review Decision</FieldLabel>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 16 }}>
                    <button
                      onClick={() => setDecision('approved')}
                      style={{
                        flex: 1,
                        border: `1px solid ${decision === 'approved' ? 'rgba(52,211,153,.35)' : border}`,
                        background: decision === 'approved' ? 'rgba(52,211,153,.12)' : 'transparent',
                        color: '#34d399',
                        borderRadius: 12,
                        padding: '12px 10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        fontSize: 'clamp(12px, 2.5vw, 14px)',
                        transition: 'all .15s',
                      }}
                    >
                      Approve Deposit
                    </button>

                    <button
                      onClick={() => setDecision('rejected')}
                      style={{
                        flex: 1,
                        border: `1px solid ${decision === 'rejected' ? 'rgba(248,113,113,.35)' : border}`,
                        background: decision === 'rejected' ? 'rgba(248,113,113,.12)' : 'transparent',
                        color: '#f87171',
                        borderRadius: 12,
                        padding: '12px 10px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        fontSize: 'clamp(12px, 2.5vw, 14px)',
                        transition: 'all .15s',
                      }}
                    >
                      Reject Deposit
                    </button>
                  </div>

                  {decision === 'rejected' && (
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter rejection reason"
                      style={{
                        ...inp,
                        minHeight: 100,
                        resize: 'vertical',
                      }}
                      onFocus={fg}
                      onBlur={br}
                    />
                  )}

                  <button
                    disabled={submitting || (decision === 'rejected' && !reason.trim())}
                    onClick={reviewCheque}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      border: 'none',
                      background:
                        decision === 'approved'
                          ? 'linear-gradient(135deg,#34d399,#10b981)'
                          : 'linear-gradient(135deg,#f87171,#ef4444)',
                      color: '#fff',
                      borderRadius: 14,
                      padding: '14px 16px',
                      fontWeight: 800,
                      cursor: submitting || (decision === 'rejected' && !reason.trim()) ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: submitting || (decision === 'rejected' && !reason.trim()) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 14,
                      transition: 'filter .15s',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        Processing...
                      </>
                    ) : decision === 'approved' ? (
                      'Approve Cheque'
                    ) : (
                      'Reject Cheque'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'clamp(16px, 4vw, 24px)',
            right: 'clamp(12px, 4vw, 24px)',
            left: 'clamp(12px, 4vw, auto)',
            maxWidth: 380,
            marginLeft: 'auto',
            background: cardBg,
            border: `1px solid ${toastType === 'success' ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.25)'}`,
            color: '#fff',
            padding: '14px 16px',
            borderRadius: 14,
            fontWeight: 700,
            zIndex: 2000,
            boxShadow: '0 20px 50px rgba(0,0,0,.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideUp .2s ease',
          }}
        >
          {toastType === 'success' ? (
            <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
          ) : (
            <XCircle size={16} color="#f87171" style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 13.5 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}