import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BadgeCheck, XCircle, Trophy, Users, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

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

const RISK_CLS: Record<string, string> = {
  LOW:    'bg-emerald-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  HIGH:   'bg-red-500 text-white',
};
const RISK_LABEL: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori',
};

export default function AdminGrants() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-grants'],
    queryFn: async () => (await api.get<GrantsData>('/admin/grants')).data,
  });

  const pending = useMemo(
    () => [...(data?.pending ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data]
  );
  const granted = useMemo(
    () => [...(data?.granted ?? [])].sort((a, b) => b.grantScore - a.grantScore),
    [data]
  );

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
  const total  = pending.length + granted.length;

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

        {/* Slot indikatori */}
        {!isLoading && (
          <div className="flex flex-wrap gap-4">
            <StatChip
              icon={<Trophy className="w-4 h-4 text-emerald-500" />}
              label="Grant berilgan"
              value={granted.length}
              cls="text-emerald-700"
            />
            <StatChip
              icon={<Users className="w-4 h-4 text-amber-500" />}
              label="Kutilayotgan"
              value={pending.length}
              cls="text-amber-700"
            />
            <StatChip
              icon={<TrendingUp className="w-4 h-4 text-slate-500" />}
              label="Jami arizachi"
              value={total}
              cls="text-slate-700"
            />
          </div>
        )}

        {/* 2-ustunli layout */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-7 w-40 bg-slate-100 animate-pulse rounded" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Chap — Kandidatlar */}
            <Column
              title="Kandidatlar"
              subtitle={`${pending.length} ta talaba kutilmoqda`}
              accent="amber"
              empty={pending.length === 0}
              emptyText="Kutilayotgan kandidat yo'q"
            >
              {pending.map((s, i) => (
                <StudentCard
                  key={s.id}
                  student={s}
                  rank={i + 1}
                  action={
                    <button
                      onClick={() => grantMutation.mutate(s.id)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Grant berish
                    </button>
                  }
                />
              ))}
            </Column>

            {/* O'ng — Grant berilganlar */}
            <Column
              title="Grant berilganlar"
              subtitle={`${granted.length} ta tasdiqlangan`}
              accent="emerald"
              empty={granted.length === 0}
              emptyText="Hali grant berilmagan"
            >
              {granted.map((s, i) => (
                <StudentCard
                  key={s.id}
                  student={s}
                  rank={i + 1}
                  granted
                  action={
                    <button
                      onClick={() => revokeMutation.mutate(s.id)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Bekor qilish
                    </button>
                  }
                />
              ))}
            </Column>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── Stat chip ─────────────────────────────────────────────── */
function StatChip({
  icon, label, value, cls,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2.5">
      {icon}
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`text-sm font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
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
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
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
  student: s, rank, granted = false, action,
}: {
  student: Student;
  rank: number;
  granted?: boolean;
  action: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${granted ? 'border-emerald-200' : ''}`}>
      {/* Rank */}
      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
        {rank}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{s.fullName}</p>
        <p className="text-xs text-muted-foreground">{s.group?.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-semibold tabular-nums text-slate-700">
            {Math.round(s.grantScore * 10) / 10} ball
          </span>
          <span className={`text-xs ${s.gpa < 80 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
            GPA {s.gpa.toFixed(1)}%
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${RISK_CLS[s.riskLevel] ?? ''}`}>
            {RISK_LABEL[s.riskLevel] ?? s.riskLevel}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
