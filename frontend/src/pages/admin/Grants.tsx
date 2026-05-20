import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Trophy, XCircle, Clock, Check, ArrowLeft, RefreshCw, Award,
} from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

/* ── Theme tokens ──────────────────────────────────────────── */
const T = {
  white:       '#ffffff',
  bg:          '#f8fafc',
  bgSubtle:    '#f1f5f9',
  border:      '#e2e8f0',
  text:        '#0f172a',
  textMuted:   '#64748b',
  textSubtle:  '#94a3b8',
  emerald:     '#10b981',
  emeraldDeep: '#059669',
  emeraldBg:   '#ecfdf5',
  emeraldText: '#065f46',
  amber:       '#f59e0b',
  amberDeep:   '#d97706',
  amberBg:     '#fffbeb',
  amberText:   '#92400e',
  red:         '#ef4444',
  redDeep:     '#dc2626',
  redBg:       '#fef2f2',
  redText:     '#991b1b',
  slate900:    '#0f172a',
};

const SLOTS = 12;

const GRANT_REASON_LABEL: Record<string, string> = {
  OK:               'Grant berildi',
  GRANTED_OK:       'Grant berildi',
  ACADEMIC_FAIL:    'Bekor (Akademik)',
  LOW_SCORE:        'Bekor (Ball past)',
  PAYMENT_OVERDUE:  'Bekor (To\'lov)',
};

/* ── Types ─────────────────────────────────────────────────── */
type Student = {
  id: string;
  fullName: string;
  gpa: number;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  grantReason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  group: { id: string; name: string; course: number };
  user?: { email: string };
};
type GrantsData = { pending: Student[]; granted: Student[]; rejected: Student[] };

/* ── Avatar ─────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
function nameToColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const ini = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: nameToColor(name), color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, letterSpacing: '-0.01em',
    }}>{ini}</div>
  );
}

/* ── Status badge ───────────────────────────────────────────── */
const STATUS_META: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, dot: T.emerald, label: 'Grant berildi' },
  PENDING:     { bg: T.amberBg,   fg: T.amberText,   dot: T.amber,   label: 'Kutilmoqda'    },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText,     dot: T.red,     label: "Grant yo'q"    },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted,   dot: T.textSubtle, label: 'Aniqlanmagan' },
};
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.UNKNOWN;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 999,
      background: m.bg, color: m.fg,
      fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

/* ── Button ─────────────────────────────────────────────────── */
function Btn({
  children, onClick, variant = 'ghost', icon, disabled,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'success' | 'dangerO' | 'danger' | 'outline';
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: T.slate900, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: T.text, border: `1px solid ${T.border}` },
    outline: { background: '#fff', color: T.text, border: `1px solid ${T.border}` },
    success: { background: T.emerald, color: '#fff', border: 'none' },
    dangerO: { background: '#fff', color: T.redDeep, border: `1px solid ${T.red}` },
    danger:  { background: T.redDeep, color: '#fff', border: 'none' },
  };
  const hov: Record<string, string> = {
    primary: T.slate900, ghost: T.bgSubtle, outline: T.bg,
    success: T.emeraldDeep, dangerO: T.redBg, danger: '#b91c1c',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 7, cursor: disabled ? 'default' : 'pointer',
        fontSize: 12.5, fontWeight: 500, transition: 'background .12s, opacity .12s',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hov[variant]; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = (styles[variant].background as string); }}
    >
      {icon}{children}
    </button>
  );
}

/* ── Stat tile ──────────────────────────────────────────────── */
function StatTile({ label, value, accent, icon, bg }: {
  label: string; value: number; accent: string; icon: React.ReactNode; bg?: string;
}) {
  return (
    <div style={{
      padding: '14px 16px', border: `1px solid ${T.border}`, borderRadius: 10,
      background: bg ?? T.white,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {label}
        </span>
        {icon}
      </div>
      <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function AdminGrants() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState<'selected' | 'all'>('selected');
  const [rejectDialog, setRejectDialog] = useState<Student | null>(null);
  const [rejectReason, setRejectReason] = useState<'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE'>('LOW_SCORE');
  const [confirmFinal, setConfirmFinal] = useState(false);

  const selectedIds = useMemo(() => {
    const p = searchParams.get('selected');
    return p ? new Set(p.split(',').filter(Boolean)) : null;
  }, [searchParams]);

  const hasSelection = !!(selectedIds && selectedIds.size > 0);
  const activeFilter = hasSelection ? filter : 'all';

  /* Queries */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });
  const { data: allStudents = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
  });

  /* Working set */
  const allCandidates = useMemo(() => {
    const pending  = data?.pending  ?? [];
    const granted  = data?.granted  ?? [];
    const rejected = data?.rejected ?? [];
    const combined = [...pending, ...granted, ...rejected];

    if (activeFilter === 'selected' && selectedIds) {
      // find in combined first, then fallback to allStudents
      const combinedMap = new Map(combined.map(s => [s.id, s]));
      return [...selectedIds].map(id => combinedMap.get(id) ?? allStudents.find(s => s.id === id))
        .filter(Boolean) as Student[];
    }
    return combined;
  }, [data, allStudents, activeFilter, selectedIds]);

  const sorted = [...allCandidates].sort((a, b) => b.grantScore - a.grantScore);

  const stats = {
    selected: selectedIds?.size ?? 0,
    granted:  sorted.filter(s => s.grantStatus === 'GRANTED').length,
    rejected: sorted.filter(s => s.grantStatus === 'NOT_GRANTED').length,
    pending:  sorted.filter(s => s.grantStatus === 'PENDING').length,
  };

  const totalGranted = (data?.granted ?? []).length;

  /* Mutations */
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-grants'] });
    qc.invalidateQueries({ queryKey: ['admin-students'] });
    qc.invalidateQueries({ queryKey: ['admin-rating'] });
  };

  const grantMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/grants/${id}/grant`),
    onSuccess: (_, id) => { invalidate(); toast.success('Grant berildi'); },
    onError: () => toast.error('Xatolik'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/grants/${id}/reject`, { reason }),
    onSuccess: () => { invalidate(); toast.warning('Rad etildi'); setRejectDialog(null); },
    onError: () => toast.error('Xatolik'),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/grants/${id}/revoke`),
    onSuccess: () => { invalidate(); toast.warning('Grant bekor qilindi'); },
    onError: () => toast.error('Xatolik'),
  });
  const restoreMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/grants/${id}/restore`),
    onSuccess: () => { invalidate(); toast.success('Qayta ko\'rib chiqishga qaytarildi'); },
    onError: () => toast.error('Xatolik'),
  });

  const isBusy = grantMut.isPending || rejectMut.isPending || revokeMut.isPending || restoreMut.isPending;

  return (
    <AdminLayout>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em', color: T.text }}>
              Grant qarori
            </h1>
            <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 13.5 }}>
              <span style={{ fontWeight: 500, color: T.text }}>{sorted.length}</span> ta nomzod talaba ·
              <span style={{ marginLeft: 6 }}>slot </span>
              <span style={{ color: T.emeraldDeep, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{totalGranted}</span>
              <span style={{ color: T.textMuted }}>/</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{SLOTS}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Btn variant="ghost" icon={<ArrowLeft size={13} />} onClick={() => navigate('/admin/rating')}>
              Reytingga qaytish
            </Btn>
            <Btn variant="primary" icon={<Check size={14} />} onClick={() => setConfirmFinal(true)}>
              Qarorni yakunlash
            </Btn>
          </div>
        </div>

        {/* ── 4 Stat tiles ────────────────────────────────── */}
        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatTile label="Tanlangan"     value={stats.selected} accent={T.text}        icon={<Check   size={14} color={T.textMuted} />} />
            <StatTile label="Grant berildi" value={stats.granted}  accent={T.emeraldDeep} icon={<Trophy  size={14} color={T.emerald}  />} bg={T.emeraldBg} />
            <StatTile label="Rad etildi"    value={stats.rejected} accent={T.redDeep}     icon={<XCircle size={14} color={T.red}      />} bg={T.redBg} />
            <StatTile label="Kutilmoqda"    value={stats.pending}  accent={T.amberDeep}   icon={<Clock   size={14} color={T.amber}    />} bg={T.amberBg} />
          </div>
        )}

        {/* ── Filter + slot progress ───────────────────────── */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Tabs — only when selection exists */}
            {hasSelection ? (
              <div style={{ display: 'inline-flex', padding: 3, borderRadius: 8, background: T.bg, gap: 2 }}>
                {[
                  { id: 'selected' as const, label: 'Tanlanganlar', count: selectedIds!.size },
                  { id: 'all'      as const, label: 'Barcha nomzodlar' },
                ].map(tab => {
                  const active = activeFilter === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                      padding: '5px 11px', borderRadius: 6, border: 0, cursor: 'pointer',
                      background: active ? T.white : 'transparent',
                      color: active ? T.text : T.textMuted,
                      fontWeight: active ? 500 : 400, fontSize: 12.5,
                      boxShadow: active ? '0 1px 2px rgba(15,23,42,.06)' : 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      transition: 'background .1s, color .1s',
                    }}>
                      {tab.label}
                      {tab.count != null && (
                        <span style={{
                          fontSize: 10.5, padding: '0 5px', borderRadius: 999,
                          background: T.bgSubtle, color: T.textMuted,
                          minWidth: 16, height: 16, fontVariantNumeric: 'tabular-nums',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>{tab.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 12.5, color: T.textMuted }}>
                Barcha nomzodlar ko'rsatilmoqda
              </span>
            )}

            {/* Slot progress — right side */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
              <span style={{ color: T.textMuted }}>Slot</span>
              <div style={{ width: 140, height: 6, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((totalGranted / SLOTS) * 100, 100)}%`,
                  height: '100%', background: T.emerald, transition: 'width .35s',
                }} />
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                <span style={{ color: T.emeraldDeep }}>{totalGranted}</span>
                <span style={{ color: T.textMuted, fontWeight: 400 }}> / {SLOTS}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────── */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 8, background: T.bgSubtle }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <Trophy size={40} color={T.textSubtle} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Nomzodlar yo'q</p>
              <p style={{ fontSize: 12, color: T.textSubtle, marginTop: 4 }}>
                Reyting sahifasidan kandidatlarni tanlang
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {[
                    { l: '#',      align: 'center', w: 52  },
                    { l: 'Talaba', align: 'left'           },
                    { l: 'Guruh',  align: 'left',   w: 110 },
                    { l: 'GPA',    align: 'right',  w: 72  },
                    { l: 'Ball',   align: 'right',  w: 80  },
                    { l: 'Status', align: 'left',   w: 200 },
                    { l: 'Amal',   align: 'right',  w: 220 },
                  ].map((h, i) => (
                    <th key={i} style={{
                      textAlign: h.align as 'left' | 'right' | 'center',
                      padding: '11px 16px', fontSize: 11.5, fontWeight: 600,
                      color: T.textMuted, textTransform: 'uppercase',
                      letterSpacing: '.04em', width: h.w,
                    }}>{h.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const isGranted  = s.grantStatus === 'GRANTED';
                  const isRejected = s.grantStatus === 'NOT_GRANTED';
                  const isPending  = s.grantStatus === 'PENDING';
                  const rowBg = isGranted ? '#f0fdf4' : isRejected ? '#fff1f2' : 'transparent';
                  const td: React.CSSProperties = {
                    padding: '12px 16px',
                    borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none',
                    background: rowBg,
                  };
                  return (
                    <tr key={s.id}>
                      {/* # */}
                      <td style={{ ...td, textAlign: 'center', color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {i + 1}
                      </td>
                      {/* Talaba */}
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={s.fullName} size={30} />
                          <div>
                            <div style={{ fontWeight: 500, color: T.text }}>{s.fullName}</div>
                            <div style={{ fontSize: 11.5, color: T.textMuted }}>{s.user?.email ?? s.group?.name}</div>
                          </div>
                        </div>
                      </td>
                      {/* Guruh */}
                      <td style={{ ...td, color: T.textMuted }}>{s.group?.name}</td>
                      {/* GPA */}
                      <td style={{
                        ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                        color: s.gpa < 75 ? T.redDeep : T.text,
                        fontWeight: s.gpa < 75 ? 600 : 400,
                      }}>
                        {s.gpa.toFixed(1)}%
                      </td>
                      {/* Ball */}
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>
                        {Math.round(s.grantScore * 10) / 10}
                      </td>
                      {/* Status */}
                      <td style={td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <StatusBadge status={s.grantStatus} />
                          {s.grantReason && s.grantReason !== 'OK' && s.grantReason !== 'GRANTED_OK' && (
                            <span style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.3 }}>
                              {GRANT_REASON_LABEL[s.grantReason] ?? s.grantReason}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Amal */}
                      <td style={{ ...td, textAlign: 'right' }}>
                        {isPending && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <Btn
                              variant="dangerO"
                              icon={<XCircle size={12} />}
                              onClick={() => { setRejectDialog(s); setRejectReason('LOW_SCORE'); }}
                              disabled={isBusy}
                            >Rad et</Btn>
                            <Btn
                              variant="success"
                              icon={<Check size={12} />}
                              onClick={() => grantMut.mutate(s.id)}
                              disabled={isBusy}
                            >Grant ber</Btn>
                          </div>
                        )}
                        {isGranted && (
                          <Btn
                            variant="ghost"
                            icon={<RefreshCw size={12} />}
                            onClick={() => revokeMut.mutate(s.id)}
                            disabled={isBusy}
                          >Bekor qilish</Btn>
                        )}
                        {isRejected && (
                          <Btn
                            variant="ghost"
                            icon={<RefreshCw size={12} />}
                            onClick={() => restoreMut.mutate(s.id)}
                            disabled={isBusy}
                          >Qayta ko'rib chiqish</Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ── Reject dialog ──────────────────────────────────── */}
      {rejectDialog && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 40 }}
            onClick={() => setRejectDialog(null)}
          />
          <div style={{
            position: 'fixed', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 440, background: T.white,
            borderRadius: 12, boxShadow: '0 20px 60px rgba(15,23,42,.18)',
            zIndex: 50, padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: 0 }}>Grant rad etish sababi</h2>
              <button
                onClick={() => setRejectDialog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 2, borderRadius: 4 }}
              >✕</button>
            </div>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
              <span style={{ fontWeight: 500, color: T.text }}>{rejectDialog.fullName}</span>
              {' ga grant berilmaydi. Sababni belgilang.'}
            </p>

            {/* Reason cards 2-col */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {([
                { id: 'ACADEMIC_FAIL'   as const, label: 'Akademik past',   desc: 'GPA / akademik ko\'rsatkich past' },
                { id: 'LOW_SCORE'       as const, label: 'Ball past',        desc: 'Umumiy ball minimal chegaradan past' },
                { id: 'PAYMENT_OVERDUE' as const, label: 'To\'lov muddati', desc: 'Kontrakt to\'lovi muddatida emas' },
              ] as const).map(opt => {
                const active = rejectReason === opt.id;
                return (
                  <button key={opt.id} onClick={() => setRejectReason(opt.id)} style={{
                    padding: 12, textAlign: 'left',
                    border: `1.5px solid ${active ? T.slate900 : T.border}`,
                    background: active ? T.bg : T.white,
                    borderRadius: 8, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    transition: 'border-color .1s',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{opt.label}</span>
                    <span style={{ fontSize: 11.5, color: T.textMuted }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="outline" onClick={() => setRejectDialog(null)}>Bekor qilish</Btn>
              <Btn
                variant="danger"
                icon={<XCircle size={13} />}
                onClick={() => rejectMut.mutate({ id: rejectDialog.id, reason: rejectReason })}
                disabled={rejectMut.isPending}
              >Rad etish</Btn>
            </div>
          </div>
        </>
      )}

      {/* ── Finalize dialog ────────────────────────────────── */}
      {confirmFinal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 40 }}
            onClick={() => setConfirmFinal(false)}
          />
          <div style={{
            position: 'fixed', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400, background: T.white,
            borderRadius: 12, boxShadow: '0 20px 60px rgba(15,23,42,.18)',
            zIndex: 50, padding: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>Qarorni yakunlash</h2>
            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
              {totalGranted} ta talabaga grant berilishi tasdiqlanmoqda.
            </p>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 24, padding: '12px 0', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
              {[
                { l: 'Slot',        v: SLOTS,                                             c: T.text        },
                { l: 'Berildi',     v: totalGranted,                                      c: T.emeraldDeep },
                { l: "Bo'sh",       v: Math.max(0, SLOTS - totalGranted),                 c: T.text        },
                { l: 'Rad etilgan', v: (data?.rejected ?? []).length,                     c: T.redDeep     },
              ].map((it, i) => (
                <div key={i}>
                  <div style={{ color: T.textMuted, marginBottom: 2 }}>{it.l}</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: it.c, fontVariantNumeric: 'tabular-nums' }}>{it.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="outline" onClick={() => setConfirmFinal(false)}>Bekor qilish</Btn>
              <Btn
                variant="primary"
                icon={<Check size={14} />}
                onClick={() => {
                  setConfirmFinal(false);
                  toast.success(`Qaror yakunlandi — ${totalGranted} ta grant berildi`);
                }}
              >Tasdiqlash</Btn>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
