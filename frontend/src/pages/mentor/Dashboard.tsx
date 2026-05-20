import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, CalendarCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/States';
import { statusBadge, riskBadge, type GrantStatus, type GrantReason, type RiskLevel } from '@/lib/grantLabels';

type Student = {
  id: string;
  fullName: string;
  gpa: number;
  attendance: number;
  grantScore: number;
  grantStatus: GrantStatus;
  grantReason: GrantReason;
  riskLevel: RiskLevel;
};

type Group = {
  id: string;
  name: string;
  course: number;
  students: Student[];
};

function KpiCard({ icon: Icon, label, value, hint, tone = 'default' }: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'danger' | 'success';
}) {
  const toneCls = {
    default: 'bg-slate-100 text-slate-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
  }[tone];

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${toneCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function StudentRow({ student, rank, onClick }: { student: Student; rank: number; onClick: () => void }) {
  const status = statusBadge(student.grantStatus, student.grantReason);
  const risk = riskBadge(student.riskLevel);
  return (
    <tr
      onClick={onClick}
      className="border-t hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <td className="px-4 py-3 text-muted-foreground tabular-nums w-12">{rank}</td>
      <td className="px-4 py-3 font-medium">{student.fullName}</td>
      <td className="px-4 py-3 text-right tabular-nums">{student.gpa.toFixed(0)}%</td>
      <td className="px-4 py-3 text-right tabular-nums">{student.attendance.toFixed(0)}%</td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">{student.grantScore.toFixed(0)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${status.cls}`}>
          {status.text}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${risk.cls}`}>
          {risk.text}
        </span>
      </td>
    </tr>
  );
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => (await api.get<Group[]>('/mentor/students')).data,
  });

  const openStudent = (id: string) => navigate(`/mentor/students?student=${id}`);

  const stats = useMemo(() => {
    const all = (data ?? []).flatMap(g => g.students);
    if (!all.length) {
      return { total: 0, avgScore: 0, riskHigh: 0, avgAttendance: 0, top5: [], bottom5: [] };
    }
    const total = all.length;
    const avgScore = all.reduce((s, x) => s + x.grantScore, 0) / total;
    const avgAttendance = all.reduce((s, x) => s + x.attendance, 0) / total;
    const riskHigh = all.filter(x => x.riskLevel === 'HIGH').length;
    const sorted = [...all].sort((a, b) => b.grantScore - a.grantScore);
    const top5 = sorted.slice(0, 5);
    const top5Ids = new Set(top5.map(s => s.id));
    const bottom5 = total > 5
      ? sorted.slice(-5).reverse().filter(s => !top5Ids.has(s.id))
      : [];
    return {
      total,
      avgScore,
      riskHigh,
      avgAttendance,
      top5,
      bottom5,
    };
  }, [data]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Guruhlaringiz va talabalar holati</p>
      </div>

      {isError && <ErrorState onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Talabalar soni" value={stats.total} />
          <KpiCard
            icon={TrendingUp}
            label="O'rtacha ball"
            value={stats.avgScore.toFixed(1)}
            hint="100 ballik shkala"
            tone="success"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Risk zonadagilar"
            value={stats.riskHigh}
            hint="Yuqori risk darajasi"
            tone={stats.riskHigh > 0 ? 'danger' : 'default'}
          />
          <KpiCard
            icon={CalendarCheck}
            label="O'rtacha davomat"
            value={`${stats.avgAttendance.toFixed(0)}%`}
          />
        </div>
      )}

      {!isLoading && !isError && stats.total === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-white">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">Talabalar yo'q</p>
          <p className="text-sm text-muted-foreground">Sizga hali guruh biriktirilmagan</p>
        </div>
      )}

      {stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold">Top-5 talabalar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Ism</th>
                    <th className="px-4 py-2 font-medium text-right">GPA</th>
                    <th className="px-4 py-2 font-medium text-right">Davomat</th>
                    <th className="px-4 py-2 font-medium text-right">Ball</th>
                    <th className="px-4 py-2 font-medium">Holat</th>
                    <th className="px-4 py-2 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top5.map((s, i) => <StudentRow key={s.id} student={s} rank={i + 1} onClick={() => openStudent(s.id)} />)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b">
              <ArrowDownRight className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold">Diqqat talab — Bottom-5</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Ism</th>
                    <th className="px-4 py-2 font-medium text-right">GPA</th>
                    <th className="px-4 py-2 font-medium text-right">Davomat</th>
                    <th className="px-4 py-2 font-medium text-right">Ball</th>
                    <th className="px-4 py-2 font-medium">Holat</th>
                    <th className="px-4 py-2 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bottom5.map((s, i) => <StudentRow key={s.id} student={s} rank={stats.total - i} onClick={() => openStudent(s.id)} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {stats.total > 0 && data && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">Guruhlaringiz</h3>
          <div className="flex flex-wrap gap-2">
            {data.map(g => (
              <div key={g.id} className="px-3 py-2 rounded-md border bg-slate-50 text-sm">
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground"> · {g.course}-kurs · {g.students.length} talaba</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
