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
} from 'lucide-react';
import adminApi from '../lib/api';

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
  amount: number;
  currency?: string;
  chequeImageUrl?: string;
  status: 'submitted' | 'reviewing' | 'cleared' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

const pageBg = '#0a0f1a';
const cardBg = '#111826';
const inputBg = '#1a2235';
const gold = '#f59e0b';
const goldDark = '#d97706';
const border = 'rgba(255,255,255,.07)';
const text2 = 'rgba(255,255,255,.45)';
const text3 = 'rgba(255,255,255,.25)';

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
  transition: 'border-color .2s',
};

const fg = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = 'rgba(245,158,11,.5)';
};

const br = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = 'rgba(255,255,255,.1)';
};

const formatMoney = (n: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n || 0);
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
};

const statusStyles: Record<string, React.CSSProperties> = {
  submitted: {
    background: 'rgba(96,165,250,.12)',
    color: '#60a5fa',
  },
  reviewing: {
    background: 'rgba(245,158,11,.12)',
    color: '#f59e0b',
  },
  cleared: {
    background: 'rgba(52,211,153,.12)',
    color: '#34d399',
  },
  rejected: {
    background: 'rgba(248,113,113,.12)',
    color: '#f87171',
  },
};

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
  const [selected, setSelected] = useState<ChequeItem | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
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
      showToast(err?.response?.data?.message || 'Failed to load cheques');
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

      showToast(`Cheque ${decision === 'approved' ? 'approved' : 'rejected'} successfully`);

      setSelected(null);
      setReason('');

      load(page);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        padding: 24,
        background: pageBg,
        minHeight: '100vh',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 800,
            }}
          >
            Cheque Deposits
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: text2,
              fontSize: 14,
            }}
          >
            Review and process customer cheque deposit submissions.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: '10px 14px',
            }}
          >
            <ShieldCheck size={18} color={gold} />
            <div>
              <div style={{ fontSize: 11, color: text3, fontWeight: 700, letterSpacing: '.05em' }}>
                TOTAL SUBMISSIONS
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{total}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 20,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr auto',
            gap: 12,
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color={text3}
              style={{ position: 'absolute', left: 12, top: 12 }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, user email or account"
              style={{
                ...inp,
                paddingLeft: 36,
              }}
              onFocus={fg}
              onBlur={br}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              ...inp,
              appearance: 'none',
              cursor: 'pointer',
            }}
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
              padding: '0 18px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Filter
          </button>
        </div>
      </div>

      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 22,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,.02)',
                  borderBottom: `1px solid ${border}`,
                }}
              >
                {[
                  'Customer',
                  'Reference',
                  'Account',
                  'Amount',
                  'Status',
                  'Submitted',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      fontSize: 11,
                      color: text2,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
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
                  <td colSpan={7} style={{ padding: 50, textAlign: 'center' }}>
                    <Loader2
                      size={26}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                    <FileImage size={40} color={text3} />
                    <div style={{ marginTop: 14, fontWeight: 700 }}>No cheque deposits found</div>
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
                      style={{
                        borderBottom: `1px solid ${border}`,
                        transition: 'background .15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.025)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 700 }}>{name || 'Unknown User'}</div>
                        <div style={{ color: text2, fontSize: 13 }}>
                          {item.userId?.email || 'No email'}
                        </div>
                      </td>

                      <td style={{ padding: 16 }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {item.referenceNumber || '—'}
                        </div>
                      </td>

                      <td style={{ padding: 16 }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                          }}
                        >
                          {item.accountId?.accountNumber || '—'}
                        </div>

                        <div style={{ color: text2, fontSize: 12 }}>
                          {item.accountId?.accountType || 'Checking'}
                        </div>
                      </td>

                      <td style={{ padding: 16 }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                          }}
                        >
                          {formatMoney(item.amount, item.currency)}
                        </div>
                      </td>

                      <td style={{ padding: 16 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '7px 10px',
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                            ...statusStyles[item.status],
                          }}
                        >
                          {item.status === 'cleared' ? (
                            <CheckCircle2 size={13} />
                          ) : item.status === 'rejected' ? (
                            <XCircle size={13} />
                          ) : (
                            <Clock3 size={13} />
                          )}

                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: 16 }}>
                        <div style={{ fontSize: 13 }}>
                          {formatDateTime(item.createdAt)}
                        </div>
                      </td>

                      <td style={{ padding: 16 }}>
                        <button
                          onClick={() => {
                            setSelected(item);
                            setDecision('approved');
                            setReason('');
                          }}
                          style={{
                            border: `1px solid rgba(245,158,11,.25)`,
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
                          }}
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            flexWrap: 'wrap',
            gap: 12,
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
                background: cardBg,
                color: '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? .45 : 1,
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
                  border: 'none',
                  background: p === page
                    ? `linear-gradient(135deg, ${gold}, ${goldDark})`
                    : cardBg,
                  color: p === page ? '#111' : '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                  borderColor: border,
                  fontFamily: 'inherit',
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
                background: cardBg,
                color: '#fff',
                cursor: page >= pages ? 'not-allowed' : 'pointer',
                opacity: page >= pages ? .45 : 1,
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

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
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 920,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 24,
              padding: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22,
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                  Review Cheque Deposit
                </h2>

                <p style={{ margin: '6px 0 0', color: text2, fontSize: 14 }}>
                  Verify cheque details before clearing or rejecting.
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr .9fr',
                gap: 18,
              }}
            >
              <div
                style={{
                  background: '#0d1422',
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: text2,
                    marginBottom: 10,
                  }}
                >
                  Uploaded Cheque
                </div>

                {selected.chequeImageUrl ? (
                  <img
                    src={selected.chequeImageUrl}
                    alt="Cheque"
                    style={{
                      width: '100%',
                      borderRadius: 14,
                      objectFit: 'cover',
                      border: `1px solid ${border}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 320,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px dashed ${border}`,
                      borderRadius: 14,
                      color: text2,
                    }}
                  >
                    No cheque image uploaded
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    background: '#0d1422',
                    border: `1px solid ${border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: text2, fontWeight: 700 }}>
                        CUSTOMER
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 700 }}>
                        {selected.userId?.firstName} {selected.userId?.lastName}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: text2, fontWeight: 700 }}>
                        AMOUNT
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatMoney(selected.amount, selected.currency)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: text2, fontWeight: 700 }}>
                        ACCOUNT NUMBER
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {selected.accountId?.accountNumber || '—'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: text2, fontWeight: 700 }}>
                        SUBMITTED
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {formatDateTime(selected.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#0d1422',
                    border: `1px solid ${border}`,
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: text2,
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    REVIEW DECISION
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <button
                      onClick={() => setDecision('approved')}
                      style={{
                        flex: 1,
                        border: `1px solid ${decision === 'approved' ? 'rgba(52,211,153,.35)' : border}`,
                        background: decision === 'approved'
                          ? 'rgba(52,211,153,.12)'
                          : 'transparent',
                        color: '#34d399',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontFamily: 'inherit',
                      }}
                    >
                      Approve Deposit
                    </button>

                    <button
                      onClick={() => setDecision('rejected')}
                      style={{
                        flex: 1,
                        border: `1px solid ${decision === 'rejected' ? 'rgba(248,113,113,.35)' : border}`,
                        background: decision === 'rejected'
                          ? 'rgba(248,113,113,.12)'
                          : 'transparent',
                        color: '#f87171',
                        borderRadius: 12,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontFamily: 'inherit',
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
                        minHeight: 110,
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
                      background: decision === 'approved'
                        ? 'linear-gradient(135deg,#34d399,#10b981)'
                        : 'linear-gradient(135deg,#f87171,#ef4444)',
                      color: '#fff',
                      borderRadius: 14,
                      padding: '14px 16px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: submitting ? .7 : 1,
                    }}
                  >
                    {submitting ? 'Processing...' : decision === 'approved' ? 'Approve Cheque' : 'Reject Cheque'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#111826',
            border: `1px solid ${border}`,
            color: '#fff',
            padding: '14px 16px',
            borderRadius: 14,
            fontWeight: 700,
            zIndex: 2000,
            boxShadow: '0 20px 50px rgba(0,0,0,.35)',
          }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
