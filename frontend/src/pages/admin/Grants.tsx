import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BadgeCheck, XCircle, Trophy, Users, TrendingUp,
  Filter, X, Award,
} from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

/* ── Types ─────────────────────────────────────────────────── */
type Student = {
  id: string;
  fullName: string;
  gpa: number;
  grantScore: number;
  grantStatus: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  group: { id: string; name: string; course: number };
};
type GrantsData = { pending: Student[]; granted: Student[] };

/* ── Avatar helpers ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
];
function nameToColor(n: string) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(n: string) {
  const p = n.trim().split(' ');
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

/* ── Risk / Status meta ─────────────────────────────────────── */
const RISK_META: Record<string, { bg: string; color: string; label: string }> = {
  LOW:    { bg: '#f0fdf4', color: '#16a34a', label: 'Past'    },
  MEDIUM: { bg: '#fffbeb', color: '#d97706', label: "O'rta"   },
  HIGH:   { bg: '#fef2f2', color: '#dc2626', label: 'Yuqori'  },
};
const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  GRANTED:     { bg: '#f0fdf4', color: '#16a34a', label: 'Grant berildi' },
  PENDING:     { bg: '#fffbeb', color: '#d97706', label: 'Kutilmoqda'    },
  NOT_GRANTED: { bg: '#fef2f2', color: '#dc2626', label: "Grant yo'q"    },
};

/* ══════════════════════════════════════════════════════════════ */
export default function AdminGrants() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedIds = useMemo(() => {
    const param = searchParams.get('selected');
    return param ? new Set(param.split(',').filter(Boolean)) : null;
  }, [searchParams]);

  /* Queries */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });

  // Fetch ALL students only when filter is active — to find NOT_GRANTED/UNKNOWN students too
  const { data: allStudents } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
    enabled: !!selectedIds,
  });

  const pending = useMemo(
    () => [...(data?.pending ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data],
  );
  const granted = useMemo(
    () => [...(data?.granted ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data],
  );

  // When filter active → search ALL students (any status), exclude already-GRANTED ones
  const filteredPending = useMemo(() => {
    if (!selectedIds) return pending;
    const base: Student[] = allStudents ?? pending;
    return base
      .filter(s => selectedIds.has(s.id) && s.grantStatus !== 'GRANTED')
      .sort((a, b) => b.grantScore - a.grantScore);
  }, [pending, selectedIds, allStudents]);

  /* Mutations */
  const grantMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/grants/${id}/grant`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-grants'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Grant berildi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/grants/${id}/revoke`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-grants'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Grant bekor qilindi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const isBusy = grantMutation.isPending || revokeMutation.isPending;
  const totalCandidates = pending.length + granted.length;
  const slotPct = totalCandidates > 0
    ? Math.min((granted.length / totalCandidates) * 100, 100)
    : 0;

  const pagPending = usePagination(filteredPending, 15);
  const pagGranted = usePagination(granted, 15);

  return (
    <AdminLayout>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Grant qaror
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3, margin: '3px 0 0' }}>
            Kandidatlarni ko'rib chiqib, grant bering yoki bekor qiling
          </p>
        </div>

        {/* ── KPI Cards ───────────────────────────────────── */}
        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {/* Grant berilgan */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy style={{ width: 15, height: 15, color: '#16a34a' }} />
                </div>
                <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, margin: 0 }}>Grant berilgan</p>
              </div>
              <p style={{ fontSize: 30, fontWeight: 700, color: '#15803d', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {granted.length}
              </p>
              <p style={{ fontSize: 11, color: '#22c55e', marginTop: 5, opacity: 0.8 }}>Tasdiqlangan talabalar</p>
            </div>

            {/* Kutilayotgan */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users style={{ width: 15, height: 15, color: '#d97706' }} />
                </div>
                <p style={{ fontSize: 12, color: '#d97706', fontWeight: 500, margin: 0 }}>Kutilayotgan</p>
              </div>
              <p style={{ fontSize: 30, fontWeight: 700, color: '#b45309', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {pending.length}
              </p>
              <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 5, opacity: 0.8 }}>Qaror kutayotganlar</p>
            </div>

            {/* Jami */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp style={{ width: 15, height: 15, color: '#475569' }} />
                </div>
                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0 }}>Jami arizachi</p>
              </div>
              <p style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {totalCandidates}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Pending + granted</p>
            </div>
          </div>
        )}

        {/* ── Slot progress ────────────────────────────────── */}
        {!isLoading && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award style={{ width: 15, height: 15, color: '#10b981' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Slot to'ldirilishi</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                {granted.length} / {Math.max(totalCandidates, 1)} ta
              </span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${slotPct}%`,
                  background: 'linear-gradient(90deg,#10b981,#34d399)',
                  borderRadius: 999,
                  transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 7 }}>
              {slotPct.toFixed(0)}% slot band — {pending.length} ta talaba hali qaror kutmoqda
            </p>
          </div>
        )}

        {/* ── Filter banner (from Rating navigation) ───────── */}
        {selectedIds && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
          }}>
            <Filter style={{ width: 15, height: 15, color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#92400e', flex: 1 }}>
              Reytingdan{' '}
              <strong style={{ fontWeight: 600 }}>{selectedIds.size} ta</strong>{' '}
              tanlangan talaba ko'rsatilmoqda
            </span>
            <button
              onClick={() => setSearchParams({})}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 500, color: '#b45309',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 4px', borderRadius: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#78350f')}
              onMouseLeave={e => (e.currentTarget.style.color = '#b45309')}
            >
              <X style={{ width: 13, height: 13 }} />
              Barchasini ko'rish
            </button>
          </div>
        )}

        {/* ── 2-Column layout ──────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[0, 1].map(col => (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 28, width: 160, borderRadius: 6, background: '#f1f5f9' }} />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 76, borderRadius: 12, background: '#f1f5f9' }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* ── Left: Candidates ──────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Kandidatlar</h2>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  —{' '}
                  {selectedIds
                    ? `${filteredPending.length} ta tanlangan`
                    : `${pending.length} ta talaba kutilmoqda`}
                </span>
              </div>

              {filteredPending.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
                  <Users style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    {selectedIds ? "Tanlangan talabalar topilmadi" : "Kutilayotgan kandidat yo'q"}
                  </p>
                </div>
              ) : (
                <>
                  {pagPending.pageItems.map((s, i) => (
                    <StudentCard
                      key={s.id}
                      student={s}
                      rank={pagPending.startIndex + i + 1}
                      showStatus={s.grantStatus !== 'PENDING'}
                      action={
                        <button
                          onClick={() => grantMutation.mutate(s.id)}
                          disabled={isBusy}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8,
                            background: isBusy ? '#d1fae5' : '#10b981',
                            color: '#fff', border: 'none', cursor: isBusy ? 'default' : 'pointer',
                            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                            transition: 'background .15s',
                          }}
                          onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#059669'; }}
                          onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background = '#10b981'; }}
                        >
                          <BadgeCheck style={{ width: 13, height: 13 }} />
                          Grant berish
                        </button>
                      }
                    />
                  ))}
                  <Pagination
                    page={pagPending.page}
                    pageCount={pagPending.pageCount}
                    onChange={pagPending.setPage}
                    total={pagPending.total}
                    pageSize={pagPending.pageSize}
                    style={{ border: 0, padding: '4px 0 0', background: 'transparent' }}
                  />
                </>
              )}
            </div>

            {/* ── Right: Granted ────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Grant berilganlar</h2>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>— {granted.length} ta tasdiqlangan</span>
              </div>

              {granted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
                  <Trophy style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Hali grant berilmagan</p>
                </div>
              ) : (
                <>
                  {pagGranted.pageItems.map((s, i) => (
                    <StudentCard
                      key={s.id}
                      student={s}
                      rank={pagGranted.startIndex + i + 1}
                      granted
                      action={
                        <button
                          onClick={() => revokeMutation.mutate(s.id)}
                          disabled={isBusy}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8,
                            background: '#fff', color: '#dc2626',
                            border: '1px solid #fca5a5',
                            cursor: isBusy ? 'default' : 'pointer',
                            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                            opacity: isBusy ? 0.5 : 1,
                            transition: 'background .15s',
                          }}
                          onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background = '#fff'; }}
                        >
                          <XCircle style={{ width: 13, height: 13 }} />
                          Bekor qilish
                        </button>
                      }
                    />
                  ))}
                  <Pagination
                    page={pagGranted.page}
                    pageCount={pagGranted.pageCount}
                    onChange={pagGranted.setPage}
                    total={pagGranted.total}
                    pageSize={pagGranted.pageSize}
                    style={{ border: 0, padding: '4px 0 0', background: 'transparent' }}
                  />
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── Student card ──────────────────────────────────────────── */
function StudentCard({
  student: s, rank, granted = false, showStatus = false, action,
}: {
  student: Student;
  rank: number;
  granted?: boolean;
  showStatus?: boolean;
  action: React.ReactNode;
}) {
  const bg  = nameToColor(s.fullName);
  const ini = initials(s.fullName);
  const risk = RISK_META[s.riskLevel] ?? RISK_META.LOW;
  const statusMeta = STATUS_META[s.grantStatus];

  return (
    <div
      style={{
        background: granted ? '#f0fdf4' : '#fff',
        border: `1px solid ${granted ? '#bbf7d0' : '#e2e8f0'}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: bg, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0, userSelect: 'none',
        }}
      >
        {ini}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.fullName}
          </p>
          <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            #{rank}
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.group?.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
          {/* Ball */}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(s.grantScore * 10) / 10} ball
          </span>
          {/* GPA */}
          <span style={{ fontSize: 11, color: s.gpa < 80 ? '#dc2626' : '#64748b', fontWeight: s.gpa < 80 ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
            GPA {s.gpa.toFixed(1)}%
          </span>
          {/* Risk */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 999,
            background: risk.bg, color: risk.color,
            fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: risk.color }} />
            {risk.label}
          </span>
          {/* Status (only when not PENDING, e.g. NOT_GRANTED candidates from Rating) */}
          {showStatus && statusMeta && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: 999,
              background: statusMeta.bg, color: statusMeta.color,
              fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusMeta.color }} />
              {statusMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}
