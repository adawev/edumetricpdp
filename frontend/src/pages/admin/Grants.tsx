import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BadgeCheck, XCircle, Trophy, Users, TrendingUp, Filter, X } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

type Student = {
  id: string;
  fullName: string;
  gpa: number;
  grantScore: number;
  grantStatus: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  group: { id: string; name: string; course: number };
};

type GrantsData = {
  pending: Student[];
  granted: Student[];
};

/* ── Avatar helpers ────────────────────────────────────────── */
const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#14b8a6',
  '#f59e0b','#10b981','#3b82f6','#ef4444',
];
function nameToColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}

const RISK_CLS: Record<string, string> = {
  LOW:    'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH:   'bg-red-100 text-red-600',
};
const RISK_LABEL: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori',
};
const STATUS_CLS: Record<string, string> = {
  GRANTED:     'bg-emerald-100 text-emerald-700',
  PENDING:     'bg-amber-100 text-amber-700',
  NOT_GRANTED: 'bg-red-100 text-red-600',
};
const STATUS_LABEL: Record<string, string> = {
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda', NOT_GRANTED: "Grant yo'q",
};

export default function AdminGrants() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedIds = useMemo(() => {
    const param = searchParams.get('selected');
    return param ? new Set(param.split(',').filter(Boolean)) : null;
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });

  // Fetch all students only when filter is active — needed to find NOT_GRANTED students too
  const { data: allStudents } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
    enabled: !!selectedIds,
  });

  const pending = useMemo(
    () => [...(data?.pending ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data]
  );
  const granted = useMemo(
    () => [...(data?.granted ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data]
  );

  const filteredPending = useMemo(() => {
    if (!selectedIds) return pending;
    // Search in ALL students (any status), exclude already GRANTED
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

  const pagPending = usePagination(filteredPending, 15);
  const pagGranted = usePagination(granted, 15);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Grant qaror</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kandidatlarni ko'rib chiqib, grant bering yoki bekor qiling
          </p>
        </div>

        {/* Stats + slot progress */}
        {!isLoading && (
          <div className="bg-white border rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Grant berilgan:</span>
                <span className="text-sm font-bold text-emerald-700 tabular-nums">{granted.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Kutilayotgan:</span>
                <span className="text-sm font-bold text-amber-700 tabular-nums">{pending.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-muted-foreground">Jami arizachi:</span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">{totalCandidates}</span>
              </div>
            </div>

            {/* Slot progress bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Slot to'ldirilishi</span>
                <span className="font-semibold text-slate-700 tabular-nums">
                  {granted.length} / {Math.max(totalCandidates, 1)} ta
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{
                    width: totalCandidates > 0
                      ? `${Math.min((granted.length / totalCandidates) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter banner — shown when navigated from Rating */}
        {selectedIds && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Filter className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800 flex-1">
              Reytingdan{' '}
              <span className="font-semibold">{selectedIds.size} ta</span>{' '}
              tanlangan talaba ko'rsatilmoqda
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Barchasini ko'rish
            </button>
          </div>
        )}

        {/* 2-column layout */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-7 w-44 bg-slate-100 animate-pulse rounded" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-[76px] bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Left — Candidates */}
            <Column
              title="Kandidatlar"
              subtitle={
                selectedIds
                  ? `${filteredPending.length} ta tanlangan`
                  : `${pending.length} ta talaba kutilmoqda`
              }
              accent="amber"
              empty={filteredPending.length === 0}
              emptyText={
                selectedIds
                  ? "Tanlangan talabalar topilmadi"
                  : "Kutilayotgan kandidat yo'q"
              }
            >
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
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
                style={{ border: 0, padding: '8px 0 0', background: 'transparent' }}
              />
            </Column>

            {/* Right — Granted */}
            <Column
              title="Grant berilganlar"
              subtitle={`${granted.length} ta tasdiqlangan`}
              accent="emerald"
              empty={granted.length === 0}
              emptyText="Hali grant berilmagan"
            >
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
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
                style={{ border: 0, padding: '8px 0 0', background: 'transparent' }}
              />
            </Column>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── Column wrapper ────────────────────────────────────────── */
function Column({
  title, subtitle, accent, empty, emptyText, children,
}: {
  title: string;
  subtitle: string;
  accent: 'amber' | 'emerald';
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  const dot = accent === 'amber' ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-muted-foreground">— {subtitle}</span>
      </div>
      {empty ? (
        <div className="text-center py-14 border-2 border-dashed rounded-xl">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
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

  return (
    <div
      className={`bg-white rounded-xl border p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow ${
        granted ? 'border-emerald-200 bg-emerald-50/20' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none"
        style={{ background: bg }}
      >
        {ini}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{s.fullName}</p>
          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">#{rank}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{s.group?.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs font-bold tabular-nums text-slate-800">
            {Math.round(s.grantScore * 10) / 10} ball
          </span>
          <span className={`text-xs tabular-nums ${s.gpa < 80 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
            GPA {s.gpa.toFixed(1)}%
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium ${RISK_CLS[s.riskLevel] ?? ''}`}>
            {RISK_LABEL[s.riskLevel] ?? s.riskLevel}
          </span>
          {showStatus && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CLS[s.grantStatus] ?? ''}`}>
              {STATUS_LABEL[s.grantStatus] ?? s.grantStatus}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
