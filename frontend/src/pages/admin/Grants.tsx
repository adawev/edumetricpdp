import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BadgeCheck, XCircle, Trophy, Users, TrendingUp, Filter, X, Award,
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

/* ── Avatar ─────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
function nameToColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
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

/* ── Status / Risk badges ───────────────────────────────────── */
const RISK_DOT: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  LOW:    { bg: '#d1fae5', fg: '#065f46', dot: '#10b981', label: 'Past'   },
  MEDIUM: { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: "O'rta"  },
  HIGH:   { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444', label: 'Yuqori' },
};
const STATUS_DOT: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  GRANTED:     { bg: '#d1fae5', fg: '#065f46', dot: '#10b981', label: 'Grant berildi' },
  PENDING:     { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: 'Kutilmoqda'    },
  NOT_GRANTED: { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444', label: "Grant yo'q"    },
};

function Pill({ bg, fg, dot, label }: { bg: string; fg: string; dot: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 999,
      background: bg, color: fg,
      fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function AdminGrants() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedIds = useMemo(() => {
    const p = searchParams.get('selected');
    return p ? new Set(p.split(',').filter(Boolean)) : null;
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });

  // Fetch all students only when filter active — to find NOT_GRANTED students too
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
  const filteredPending = useMemo(() => {
    if (!selectedIds) return pending;
    const base: Student[] = allStudents ?? pending;
    return base
      .filter(s => selectedIds.has(s.id) && s.grantStatus !== 'GRANTED')
      .sort((a, b) => b.grantScore - a.grantScore);
  }, [pending, selectedIds, allStudents]);

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
      <div className="p-6 space-y-4">

        {/* ── Header ──────────────────────────────────────── */}
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Grant qaror</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Kandidatlarni ko'rib chiqib, grant bering yoki bekor qiling
          </p>
        </div>

        {/* ── Stats + slot progress ────────────────────────── */}
        {!isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {/* Stats row */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span className="text-[12.5px] text-slate-500">Grant berilgan:</span>
                <span className="text-[13px] font-bold text-emerald-700 tabular-nums">{granted.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span className="text-[12.5px] text-slate-500">Kutilayotgan:</span>
                <span className="text-[13px] font-bold text-amber-700 tabular-nums">{pending.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-[12.5px] text-slate-500">Jami:</span>
                <span className="text-[13px] font-bold text-slate-700 tabular-nums">{totalCandidates}</span>
              </div>
            </div>
            {/* Slot progress */}
            <div>
              <div className="flex justify-between text-[11.5px] text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3 h-3" /> Slot to'ldirilishi
                </span>
                <span className="font-semibold text-slate-600 tabular-nums">
                  {granted.length} / {Math.max(totalCandidates, 1)} ta
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${slotPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Filter banner ────────────────────────────────── */}
        {selectedIds && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}
          >
            <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: '#d97706' }} />
            <span className="text-[12.5px] flex-1" style={{ color: '#92400e' }}>
              Reytingdan{' '}
              <strong className="font-semibold">{selectedIds.size} ta</strong>{' '}
              tanlangan talaba ko'rsatilmoqda
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1 text-[12px] font-medium transition-colors"
              style={{ color: '#b45309', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#78350f')}
              onMouseLeave={e => (e.currentTarget.style.color = '#b45309')}
            >
              <X className="w-3 h-3" /> Barchasini ko'rish
            </button>
          </div>
        )}

        {/* ── 2-col layout ─────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map(col => (
              <div key={col} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="h-5 w-36 bg-slate-100 rounded animate-pulse" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-slate-100">
                    <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 items-start">

            {/* ── Kandidatlar ──────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Column header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[13px] font-semibold text-slate-900">Kandidatlar</span>
                <span
                  className="text-[10.5px] font-medium ml-0.5 px-1.5 py-0.5 rounded-md tabular-nums"
                  style={{ background: '#fef3c7', color: '#92400e' }}
                >
                  {selectedIds ? filteredPending.length : pending.length}
                </span>
                {selectedIds && (
                  <span className="ml-auto text-[11px] text-slate-400">tanlangan</span>
                )}
              </div>

              {/* Empty */}
              {filteredPending.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-[12.5px] text-slate-400">
                    {selectedIds ? "Tanlangan talabalar topilmadi" : "Kutilayotgan kandidat yo'q"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {pagPending.pageItems.map((s, i) => (
                      <StudentRow
                        key={s.id}
                        student={s}
                        rank={pagPending.startIndex + i + 1}
                        showStatus={s.grantStatus !== 'PENDING'}
                        action={
                          <button
                            onClick={() => grantMutation.mutate(s.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: '#10b981' }}
                            onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#059669'; }}
                            onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background = '#10b981'; }}
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Grant berish
                          </button>
                        }
                      />
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <Pagination
                      page={pagPending.page}
                      pageCount={pagPending.pageCount}
                      onChange={pagPending.setPage}
                      total={pagPending.total}
                      pageSize={pagPending.pageSize}
                      style={{ border: 0, padding: 0, background: 'transparent' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ── Grant berilganlar ─────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Column header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[13px] font-semibold text-slate-900">Grant berilganlar</span>
                <span
                  className="text-[10.5px] font-medium ml-0.5 px-1.5 py-0.5 rounded-md tabular-nums"
                  style={{ background: '#d1fae5', color: '#065f46' }}
                >
                  {granted.length}
                </span>
              </div>

              {/* Empty */}
              {granted.length === 0 ? (
                <div className="py-16 text-center">
                  <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-[12.5px] text-slate-400">Hali grant berilmagan</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {pagGranted.pageItems.map((s, i) => (
                      <StudentRow
                        key={s.id}
                        student={s}
                        rank={pagGranted.startIndex + i + 1}
                        granted
                        action={
                          <button
                            onClick={() => revokeMutation.mutate(s.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold transition-colors disabled:opacity-50"
                            style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' }}
                            onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#fef2f2'; }}
                            onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background = '#fff'; }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Bekor qilish
                          </button>
                        }
                      />
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <Pagination
                      page={pagGranted.page}
                      pageCount={pagGranted.pageCount}
                      onChange={pagGranted.setPage}
                      total={pagGranted.total}
                      pageSize={pagGranted.pageSize}
                      style={{ border: 0, padding: 0, background: 'transparent' }}
                    />
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── Student row ───────────────────────────────────────────── */
function StudentRow({
  student: s, rank, granted = false, showStatus = false, action,
}: {
  student: Student;
  rank: number;
  granted?: boolean;
  showStatus?: boolean;
  action: React.ReactNode;
}) {
  const risk = RISK_DOT[s.riskLevel] ?? RISK_DOT.LOW;
  const statusMeta = STATUS_DOT[s.grantStatus];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{ background: granted ? '#f0fdf4' : undefined }}
      onMouseEnter={e => { if (!granted) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { e.currentTarget.style.background = granted ? '#f0fdf4' : ''; }}
    >
      {/* Avatar */}
      <Avatar name={s.fullName} size={32} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-slate-900 truncate">{s.fullName}</span>
          <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">#{rank}</span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">{s.group?.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[12px] font-bold text-slate-800 tabular-nums">
            {Math.round(s.grantScore * 10) / 10} ball
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: s.gpa < 80 ? '#dc2626' : '#64748b', fontWeight: s.gpa < 80 ? 600 : 400 }}
          >
            GPA {s.gpa.toFixed(1)}%
          </span>
          <Pill {...risk} />
          {showStatus && statusMeta && <Pill {...statusMeta} />}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
