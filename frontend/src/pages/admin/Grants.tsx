import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trophy, XCircle, Clock, Check, ArrowLeft, RefreshCw, X, Users, Search } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination, Select, Input } from '@/components/em/Primitives';

/* ─────────────────────── Theme (exact design tokens) ─────── */
const T = {
  white:       '#ffffff',
  bg:          '#f8fafc',
  bgSubtle:    '#f1f5f9',
  border:      '#e2e8f0',
  borderStrong:'#cbd5e1',
  text:        '#0f172a',
  textMuted:   '#64748b',
  textSubtle:  '#94a3b8',
  slate100:    '#f1f5f9',
  slate800:    '#1e293b',
  slate900:    '#0f172a',
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
};

const SLOTS = 12;

const GRANT_REASON_LABEL: Record<string, string> = {
  OK:              '',
  GRANTED_OK:      '',
  ACADEMIC_FAIL:   'Bekor qilindi (Akademik)',
  LOW_SCORE:       'Bekor qilindi (Ball past)',
  PAYMENT_OVERDUE: "Bekor qilindi (To'lov)",
};

/* ─────────────────────── Types ────────────────────────────── */
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

/* ─────────────────────── Avatar ────────────────────────────── */
const AV_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
function nameToColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const ini = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: nameToColor(name), color: '#fff',
      display: 'grid', placeItems: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 600, flexShrink: 0,
      letterSpacing: '-0.01em',
    }}>{ini}</div>
  );
}

/* ─────────────────────── Status badge ──────────────────────── */
const STATUS_COLOR: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, dot: T.emerald,   label: 'Grant berildi' },
  PENDING:     { bg: T.amberBg,   fg: T.amberText,   dot: T.amber,     label: 'Kutilmoqda'    },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText,     dot: T.red,       label: "Grant yo'q"    },
  UNKNOWN:     { bg: T.slate100,  fg: '#475569',     dot: '#94a3b8',   label: 'Aniqlanmagan'  },
};
function Badge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? STATUS_COLOR.UNKNOWN;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 999,
      background: c.bg, color: c.fg,
      fontSize: 10.5, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} />
      {c.label}
    </span>
  );
}

/* ─────────────────────── Button ────────────────────────────── */
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'dangerO';
const BTN_VAR: Record<BtnVariant, { bg: string; fg: string; bd: string; hov: string }> = {
  primary:  { bg: T.slate900,    fg: '#fff',     bd: T.slate900,    hov: T.slate800   },
  secondary:{ bg: T.bgSubtle,    fg: T.text,     bd: T.bgSubtle,    hov: '#e2e8f0'    },
  outline:  { bg: T.white,       fg: T.text,     bd: T.border,      hov: T.bgSubtle   },
  ghost:    { bg: 'transparent', fg: T.text,     bd: 'transparent', hov: T.bgSubtle   },
  success:  { bg: T.emerald,     fg: '#fff',     bd: T.emerald,     hov: T.emeraldDeep},
  danger:   { bg: T.red,         fg: '#fff',     bd: T.red,         hov: T.redDeep    },
  dangerO:  { bg: T.white,       fg: T.redDeep,  bd: '#fecaca',     hov: '#fef2f2'    },
};
function Btn({
  children, variant = 'primary', icon, onClick, disabled,
}: {
  children?: React.ReactNode;
  variant?: BtnVariant;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const v = BTN_VAR[variant];
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '6px 12px', height: 32,
        background: disabled ? T.bgSubtle : (hov ? v.hov : v.bg),
        color: disabled ? T.textSubtle : v.fg,
        border: `1px solid ${disabled ? T.border : (hov ? v.hov : v.bd)}`,
        borderRadius: 8, fontSize: 12.5, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'background .12s, border-color .12s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}{children}
    </button>
  );
}

/* ─────────────────────── Stat tile ─────────────────────────── */
function StatTile({ label, value, accent, icon, bg }: {
  label: string; value: number; accent: string; icon: React.ReactNode; bg?: string;
}) {
  return (
    <div style={{
      padding: '14px 16px',
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      background: bg ?? T.white,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 11.5, color: T.textMuted, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}>{label}</span>
        {icon}
      </div>
      <div style={{
        marginTop: 6, fontSize: 28, fontWeight: 700,
        letterSpacing: '-0.03em', color: accent,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

/* ─────────────────────── Dialog ────────────────────────────── */
function Dlg({
  open, onClose, title, description, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)', overflow: 'auto',
          background: T.white, borderRadius: 12,
          boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 0 0 1px rgba(15,23,42,.05)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 4px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            {title && <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: T.text }}>{title}</div>}
            {description && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{description}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, border: 0, background: 'transparent',
              color: T.textMuted, cursor: 'pointer', borderRadius: 6,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}
          ><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, flex: 1 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '12px 18px',
            borderTop: `1px solid ${T.border}`,
            background: T.bg,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type StatusFilter = 'ALL' | 'PENDING' | 'GRANTED' | 'NOT_GRANTED';

/* ══════════════════════════════════════════════════════════════ */
export default function AdminGrants() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [rejectDialog, setRejectDialog] = useState<Student | null>(null);
  const [rejectReason, setRejectReason] = useState<'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE'>('LOW_SCORE');
  const [confirmFinal, setConfirmFinal] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');

  /* ── Query — barcha nomzodlar ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });

  /* ── Barcha nomzod talabalar ── */
  const allCandidates = useMemo(() => {
    const pending  = data?.pending  ?? [];
    const granted  = data?.granted  ?? [];
    const rejected = data?.rejected ?? [];
    return [...pending, ...granted, ...rejected];
  }, [data]);

  /* ── Guruh ro'yxati (filtr uchun) ── */
  const groupOptions = useMemo(() => {
    const names = [...new Set(allCandidates.map(s => s.group?.name).filter(Boolean))].sort();
    return [{ value: 'ALL', label: 'Barcha guruhlar' }, ...names.map(n => ({ value: n, label: n }))];
  }, [allCandidates]);

  /* ── Filtrlangan + saralangan ro'yxat ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCandidates
      .filter(s => statusFilter === 'ALL' || s.grantStatus === statusFilter)
      .filter(s => groupFilter === 'ALL' || s.group?.name === groupFilter)
      .filter(s => !q || s.fullName.toLowerCase().includes(q) || (s.user?.email ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.grantScore - a.grantScore);
  }, [allCandidates, search, statusFilter, groupFilter]);

  const hasFilter = statusFilter !== 'ALL' || groupFilter !== 'ALL' || search.trim() !== '';

  const pag = usePagination(filtered, 20, [filtered.length]);

  /* ── Statistika — har doim umumiy (filtrdan mustaqil) ── */
  const stats = {
    total:    allCandidates.length,
    granted:  (data?.granted  ?? []).length,
    rejected: (data?.rejected ?? []).length,
    pending:  (data?.pending  ?? []).length,
  };
  const totalGranted = stats.granted;

  /* ── Mutations ── */
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-grants'] });
    qc.invalidateQueries({ queryKey: ['admin-students'] });
    qc.invalidateQueries({ queryKey: ['admin-rating'] });
  };
  const grantMut  = useMutation({ mutationFn: (id: string) => api.post(`/admin/grants/${id}/grant`),  onSuccess: () => { inv(); toast.success('Grant berildi'); }, onError: () => toast.error('Xatolik') });
  const rejectMut = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/admin/grants/${id}/reject`, { reason }), onSuccess: () => { inv(); toast.warning('Rad etildi'); setRejectDialog(null); }, onError: () => toast.error('Xatolik') });
  const revokeMut = useMutation({ mutationFn: (id: string) => api.post(`/admin/grants/${id}/revoke`), onSuccess: () => { inv(); toast.warning('Grant bekor qilindi'); }, onError: () => toast.error('Xatolik') });
  const restoreMut= useMutation({ mutationFn: (id: string) => api.post(`/admin/grants/${id}/restore`), onSuccess: () => { inv(); toast.success("Qayta ko'rib chiqishga qaytarildi"); }, onError: () => toast.error('Xatolik') });

  const isBusy = grantMut.isPending || rejectMut.isPending || revokeMut.isPending || restoreMut.isPending;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Header ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em', color: T.text }}>
              Grant qarori
            </h1>
            <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 13.5 }}>
              Jami <span style={{ fontWeight: 600, color: T.text }}>{stats.total}</span> ta nomzod talaba ·{' '}
              <span>slot </span>
              <span style={{ color: T.emeraldDeep, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{totalGranted}</span>
              <span style={{ color: T.textMuted }}>/</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{SLOTS}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn variant="ghost" icon={<ArrowLeft size={13} />} onClick={() => navigate('/admin/rating')}>
              Reytingga qaytish
            </Btn>
            <Btn variant="primary" icon={<Check size={14} />} onClick={() => setConfirmFinal(true)}>
              Qarorni yakunlash
            </Btn>
          </div>
        </div>

        {/* ── 4 Stat tiles ────────────────────────────── */}
        {!isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 10, marginBottom: 14 }}>
            <StatTile label="Jami talaba"    value={stats.total}    accent={T.text}        icon={<Users   size={14} color={T.textMuted}  />} />
            <StatTile label="Grant berildi"  value={stats.granted}  accent={T.emeraldDeep} icon={<Trophy  size={14} color={T.emerald}    />} bg={T.emeraldBg} />
            <StatTile label="Rad etildi"     value={stats.rejected} accent={T.redDeep}     icon={<XCircle size={14} color={T.red}        />} bg={T.redBg} />
            <StatTile label="Kutilmoqda"     value={stats.pending}  accent={T.amberDeep}   icon={<Clock   size={14} color={T.amber}      />} bg={T.amberBg} />
          </div>
        )}

        {/* ── Slot bar ─────────────────────────────────── */}
        <div style={{
          background: T.white, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: 12, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, justifyContent: 'flex-end' }}>
            <span style={{ color: T.textMuted }}>Slot</span>
            <div style={{ width: 140, height: 6, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((totalGranted / SLOTS) * 100, 100)}%`,
                height: '100%', background: T.emerald, transition: 'width .3s',
              }} />
            </div>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              <span style={{ color: T.emeraldDeep }}>{totalGranted}</span>
              <span style={{ color: T.textMuted, fontWeight: 400 }}> / {SLOTS}</span>
            </span>
          </div>
        </div>

        {/* ── Filtrlar ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 260 }}>
            <Input
              size="sm"
              placeholder="Talaba ismi yoki email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div style={{ width: 180 }}>
            <Select
              size="sm"
              value={statusFilter}
              onChange={v => setStatusFilter(v as StatusFilter)}
              options={[
                { value: 'ALL',         label: 'Barcha holatlar' },
                { value: 'PENDING',     label: 'Kutilmoqda' },
                { value: 'GRANTED',     label: 'Grant berildi' },
                { value: 'NOT_GRANTED', label: "Grant yo'q" },
              ]}
            />
          </div>
          <div style={{ width: 180 }}>
            <Select size="sm" value={groupFilter} onChange={setGroupFilter} options={groupOptions} />
          </div>
          {hasFilter && (
            <Btn variant="ghost" icon={<X size={12} />} onClick={() => { setSearch(''); setStatusFilter('ALL'); setGroupFilter('ALL'); }}>
              Tozalash
            </Btn>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: T.textMuted }}>
            {filtered.length} ta natija
          </span>
        </div>

        {/* ── Table card ───────────────────────────────── */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 8, background: T.bgSubtle }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div style={{ padding: '48px 24px', textAlign: 'center', color: T.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: T.bgSubtle, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
                <Trophy size={26} color={T.textSubtle} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>
                {hasFilter ? 'Natija topilmadi' : "Nomzodlar yo'q"}
              </div>
              <div style={{ fontSize: 13, marginTop: 4, maxWidth: 360 }}>
                {hasFilter
                  ? 'Filtrlarni o\'zgartiring yoki tozalang.'
                  : 'Hali nomzod talabalar yo\'q — reyting hisoblangach bu yerda paydo bo\'ladi.'}
              </div>
              {hasFilter && (
                <div style={{ marginTop: 14 }}>
                  <Btn variant="outline" icon={<X size={12} />} onClick={() => { setSearch(''); setStatusFilter('ALL'); setGroupFilter('ALL'); }}>
                    Filtrlarni tozalash
                  </Btn>
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {([
                    { l: '#',      a: 'center', w: 56  },
                    { l: 'Talaba', a: 'left'           },
                    { l: 'Guruh',  a: 'left',   w: 110 },
                    { l: 'GPA',    a: 'right',  w: 70  },
                    { l: 'Ball',   a: 'right',  w: 80  },
                    { l: 'Status', a: 'left',   w: 190 },
                    { l: 'Amal',   a: 'right',  w: 220 },
                  ] as const).map((h, i) => (
                    <th key={i} style={{
                      textAlign: h.a,
                      padding: '11px 16px', fontSize: 11.5, fontWeight: 600,
                      color: T.textMuted, textTransform: 'uppercase',
                      letterSpacing: '.04em', width: (h as any).w,
                    }}>{h.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pag.pageItems.map((s, i) => {
                  const isPending  = s.grantStatus === 'PENDING';
                  const isGranted  = s.grantStatus === 'GRANTED';
                  const isRejected = s.grantStatus === 'NOT_GRANTED';
                  const rowBg = isGranted ? '#f0fdf4' : isRejected ? '#fff1f2' : 'transparent';
                  const td: React.CSSProperties = {
                    padding: '12px 16px',
                    borderBottom: i < pag.pageItems.length - 1 ? `1px solid ${T.border}` : 'none',
                    background: rowBg,
                  };
                  return (
                    <tr key={s.id}>
                      {/* # */}
                      <td style={{ ...td, textAlign: 'center', color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {pag.startIndex + i + 1}
                      </td>
                      {/* Talaba */}
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={s.fullName} size={30} />
                          <div>
                            <div style={{ fontWeight: 500, color: T.text }}>{s.fullName}</div>
                            <div style={{ fontSize: 11.5, color: T.textMuted }}>
                              {s.user?.email ?? s.group?.name}
                            </div>
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
                        {(Math.round(s.grantScore * 10) / 10).toFixed(1)}
                      </td>
                      {/* Status */}
                      <td style={td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Badge status={s.grantStatus} />
                          {s.grantReason && GRANT_REASON_LABEL[s.grantReason] && (
                            <span style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.3 }}>
                              {GRANT_REASON_LABEL[s.grantReason]}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Amal */}
                      <td style={{ ...td, textAlign: 'right' }}>
                        {isPending && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <Btn variant="dangerO" icon={<X size={12} />} onClick={() => { setRejectDialog(s); setRejectReason('LOW_SCORE'); }} disabled={isBusy}>
                              Rad et
                            </Btn>
                            <Btn variant="success" icon={<Check size={12} />} onClick={() => grantMut.mutate(s.id)} disabled={isBusy}>
                              Grant ber
                            </Btn>
                          </div>
                        )}
                        {isGranted && (
                          <Btn variant="ghost" icon={<RefreshCw size={12} />} onClick={() => revokeMut.mutate(s.id)} disabled={isBusy}>
                            Bekor qilish
                          </Btn>
                        )}
                        {isRejected && (
                          <Btn variant="ghost" icon={<RefreshCw size={12} />} onClick={() => restoreMut.mutate(s.id)} disabled={isBusy}>
                            Qayta ko'rib chiqish
                          </Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* ── Pagination ───────────────────────────────── */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Pagination
              page={pag.page}
              pageCount={pag.pageCount}
              onChange={pag.setPage}
              total={filtered.length}
              pageSize={20}
            />
          </div>
        )}

      </div>

      {/* ── Reject dialog ──────────────────────────────── */}
      <Dlg
        open={!!rejectDialog}
        onClose={() => setRejectDialog(null)}
        title="Grant rad etish sababi"
        description={rejectDialog ? `${rejectDialog.fullName} ga grant berilmaydi. Sababni belgilang — talaba va mentor xabar oladi.` : ''}
        footer={
          <>
            <Btn variant="outline" onClick={() => setRejectDialog(null)}>Bekor qilish</Btn>
            <Btn variant="danger" icon={<X size={13} />} onClick={() => rejectDialog && rejectMut.mutate({ id: rejectDialog.id, reason: rejectReason })} disabled={rejectMut.isPending}>
              Rad etish
            </Btn>
          </>
        }
      >
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Sabab</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { id: 'ACADEMIC_FAIL'   as const, label: 'Akademik past',   desc: "GPA / akademik ko'rsatkich past"    },
              { id: 'LOW_SCORE'       as const, label: 'Ball past',        desc: 'Umumiy ball minimal chegaradan past' },
              { id: 'PAYMENT_OVERDUE' as const, label: "To'lov muddati",  desc: "Kontrakt to'lovi muddatida emas"    },
            ] as const).map(opt => {
              const active = rejectReason === opt.id;
              return (
                <button key={opt.id} onClick={() => setRejectReason(opt.id)} style={{
                  padding: 12, textAlign: 'left',
                  border: `1.5px solid ${active ? T.slate900 : T.border}`,
                  background: active ? T.bg : T.white,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  transition: 'border-color .1s',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{opt.label}</span>
                  <span style={{ fontSize: 11.5, color: T.textMuted }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Dlg>

      {/* ── Finalize dialog ────────────────────────────── */}
      <Dlg
        open={confirmFinal}
        onClose={() => setConfirmFinal(false)}
        title="Qarorni yakunlash"
        description={`${totalGranted} ta talabaga grant berilishi tasdiqlanmoqda. Bu amaldan keyin barcha talabalar va mentorlarga xabar yuboriladi.`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmFinal(false)}>Bekor qilish</Btn>
            <Btn variant="primary" icon={<Check size={14} />} onClick={() => {
              setConfirmFinal(false);
              toast.success(`Qaror yakunlandi — ${totalGranted} ta grant berildi`);
            }}>Tasdiqlash</Btn>
          </>
        }
      >
        <div style={{ padding: '8px 0', display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13 }}>
          {[
            { l: 'Jami talaba', v: stats.total,                       c: T.text        },
            { l: 'Berildi',     v: totalGranted,                      c: T.emeraldDeep },
            { l: "Bo'sh slot",  v: Math.max(0, SLOTS - totalGranted), c: T.text        },
            { l: 'Rad etilgan', v: stats.rejected,                    c: T.redDeep     },
            { l: 'Kutilmoqda',  v: stats.pending,                     c: T.amberDeep   },
          ].map((it, i) => (
            <div key={i}>
              <div style={{ color: T.textMuted, marginBottom: 2 }}>{it.l}</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: it.c, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{it.v}</div>
            </div>
          ))}
        </div>
      </Dlg>
    </AdminLayout>
  );
}
