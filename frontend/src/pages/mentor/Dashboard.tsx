import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, AlertTriangle, CalendarCheck,
  ArrowUpRight, ArrowDownRight, ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
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

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, hint, tone = 'default' }: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}) {
  const iconCls = {
    default: 'bg-slate-100 text-slate-600',
    danger:  'bg-red-100 text-red-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
  }[tone];

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconCls}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
];
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const sz = `${size}px`;
  return (
    <div
      className={`${AVATAR_COLORS[idx]} text-white flex items-center justify-center text-xs font-semibold rounded-full shrink-0`}
      style={{ width: sz, height: sz, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Rank list row ─────────────────────────────────────────────────────────────
function RankRow({ student, rank, showRisk, onClick }: {
  student: Student;
  rank: number;
  showRisk?: boolean;
  onClick: () => void;
}) {
  const risk = riskBadge(student.riskLevel);
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3 border-t hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <span className="text-xs text-slate-400 tabular-nums w-5 text-right shrink-0">{rank}</span>
      <Avatar name={student.fullName} size={30} />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium truncate">{student.fullName}</div>
        <div className="text-[11.5px] text-muted-foreground">
          GPA {student.gpa.toFixed(0)}% · Davomat {student.attendance.toFixed(0)}%
        </div>
      </div>
      {showRisk && student.riskLevel === 'HIGH' && (
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${risk.cls}`}>
          Risk
        </span>
      )}
      <span className="text-[16px] font-bold tabular-nums text-slate-900 shrink-0">
        {student.grantScore.toFixed(0)}
      </span>
    </div>
  );
}

// ── Status distribution row ───────────────────────────────────────────────────
function StatusRow({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="py-3 border-b last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {count} <span className="text-slate-400 font-normal text-xs">· {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
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
      return {
        total: 0, avgScore: 0, riskHigh: 0, avgAttendance: 0,
        top5: [], bottom5: [], groupChart: [],
        granted: 0, pending: 0, notGranted: 0,
      };
    }
    const total        = all.length;
    const avgScore     = all.reduce((s, x) => s + x.grantScore, 0) / total;
    const avgAttendance= all.reduce((s, x) => s + x.attendance, 0) / total;
    const riskHigh     = all.filter(x => x.riskLevel === 'HIGH').length;
    const granted      = all.filter(x => x.grantStatus === 'GRANTED').length;
    const pending      = all.filter(x => x.grantStatus === 'PENDING').length;
    const notGranted   = all.filter(x => x.grantStatus === 'NOT_GRANTED').length;

    const sorted = [...all].sort((a, b) => b.grantScore - a.grantScore);
    const top5   = sorted.slice(0, 5);
    const top5Ids = new Set(top5.map(s => s.id));
    const bottom5 = total > 5
      ? sorted.slice(-5).reverse().filter(s => !top5Ids.has(s.id))
      : [];

    // Bar chart: avg score per group
    const groupChart = (data ?? []).map(g => ({
      group: g.name,
      ball: g.students.length
        ? Math.round(g.students.reduce((a, s) => a + s.grantScore, 0) / g.students.length)
        : 0,
      gpa: g.students.length
        ? Math.round(g.students.reduce((a, s) => a + s.gpa, 0) / g.students.length)
        : 0,
    }));

    return { total, avgScore, riskHigh, avgAttendance, top5, bottom5, groupChart, granted, pending, notGranted };
  }, [data]);

  const isReady = !isLoading && !isError;

  return (
    <div className="p-4 sm:p-8 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Guruh ko'rinishi</h1>
          <p className="text-sm text-muted-foreground mt-1">Sizning guruhlaringiz va talabalar holati</p>
        </div>
        <button
          onClick={() => navigate('/mentor/feedback')}
          className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
        >
          Feedback yozish
        </button>
      </div>

      {isError && <ErrorState onRetry={() => refetch()} />}

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : isReady && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Users}         label="Talabalar"      value={stats.total}                       />
          <KpiCard icon={TrendingUp}    label="O'rtacha ball"  value={stats.avgScore.toFixed(1)} hint="100 ballik shkala" tone="success" />
          <KpiCard icon={AlertTriangle} label="Risk zonasi"    value={stats.riskHigh} hint="GPA < 80%"
            tone={stats.riskHigh > 0 ? 'warning' : 'default'} />
          <KpiCard icon={CalendarCheck} label="O'rtacha davomat" value={`${stats.avgAttendance.toFixed(0)}%`} />
        </div>
      )}

      {/* Empty state */}
      {isReady && stats.total === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-white">
          <Users className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">Talabalar yo'q</p>
          <p className="text-sm text-muted-foreground">Sizga hali guruh biriktirilmagan</p>
        </div>
      )}

      {/* Charts row */}
      {isReady && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar chart */}
          <div className="bg-white rounded-xl border p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold">Guruh bo'yicha o'rtacha ball</div>
              <div className="text-xs text-muted-foreground mt-0.5">Joriy semestr</div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.groupChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11.5, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [`${v} ball`, 'O\'rtacha']}
                  />
                  <Bar dataKey="ball" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status distribution */}
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-4 border-b">
              <div className="text-sm font-semibold">Status taqsimoti</div>
              <div className="text-xs text-muted-foreground mt-0.5">Sizning guruhlaringiz uchun</div>
            </div>
            <div className="px-5 py-2">
              <StatusRow label="Grant berildi" count={stats.granted}   total={stats.total} color="#10b981" />
              <StatusRow label="Kutilmoqda"    count={stats.pending}   total={stats.total} color="#f59e0b" />
              <StatusRow label="Grant yo'q"    count={stats.notGranted} total={stats.total} color="#ef4444" />
            </div>
          </div>
        </div>
      )}

      {/* Top + Bottom */}
      {isReady && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Eng yaxshi 5 talaba
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Ball bo'yicha</div>
              </div>
              <button
                onClick={() => navigate('/mentor/students')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                Hammasi <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {stats.top5.map((s, i) => (
              <RankRow key={s.id} student={s} rank={i + 1} onClick={() => openStudent(s.id)} />
            ))}
          </div>

          {/* Bottom 5 */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                  E'tibor zarur — bottom 5
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Past ball / GPA</div>
              </div>
              <button
                onClick={() => navigate('/mentor/students')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                Hammasi <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {stats.bottom5.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Talabalar yetarli emas (≤ 5 ta)
              </div>
            ) : (
              stats.bottom5.map((s, i) => (
                <RankRow key={s.id} student={s} rank={stats.total - i} showRisk onClick={() => openStudent(s.id)} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Groups overview */}
      {isReady && stats.total > 0 && data && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-semibold mb-3">Guruhlaringiz</h3>
          <div className="flex flex-wrap gap-2">
            {data.map(g => (
              <div key={g.id} className="px-3 py-2 rounded-lg border bg-slate-50 text-sm">
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
