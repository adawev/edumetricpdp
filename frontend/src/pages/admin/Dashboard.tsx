import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, CheckCircle, Clock, XCircle, TrendingUp, Star, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

type Student = {
  id: string;
  fullName: string;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  group: { id: string; name: string; course: number };
};

type Achievement = { id: string };

const STATUS_COLORS: Record<string, string> = {
  GRANTED:     '#10b981',
  PENDING:     '#f59e0b',
  NOT_GRANTED: '#ef4444',
  UNKNOWN:     '#94a3b8',
};

const STATUS_LABELS: Record<string, string> = {
  GRANTED:     "Grant berildi",
  PENDING:     "Kutilmoqda",
  NOT_GRANTED: "Grant yo'q",
  UNKNOWN:     "Aniqlanmagan",
};

export default function AdminDashboard() {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
  });

  const { data: pendingAchievements = [] } = useQuery({
    queryKey: ['admin-achievements-pending'],
    queryFn: async () =>
      (await api.get<Achievement[]>('/admin/achievements', { params: { status: 'PENDING' } })).data,
  });

  const stats = useMemo(() => {
    if (!students.length) return null;
    const granted    = students.filter(s => s.grantStatus === 'GRANTED').length;
    const pending    = students.filter(s => s.grantStatus === 'PENDING').length;
    const notGranted = students.filter(s => s.grantStatus === 'NOT_GRANTED').length;
    const unknown    = students.filter(s => s.grantStatus === 'UNKNOWN').length;
    const avg        = students.reduce((sum, s) => sum + s.grantScore, 0) / students.length;
    return {
      total: students.length,
      granted, pending, notGranted, unknown,
      avg: Math.round(avg * 10) / 10,
    };
  }, [students]);

  const donutData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: STATUS_LABELS.GRANTED,     value: stats.granted,    color: STATUS_COLORS.GRANTED },
      { name: STATUS_LABELS.PENDING,     value: stats.pending,    color: STATUS_COLORS.PENDING },
      { name: STATUS_LABELS.NOT_GRANTED, value: stats.notGranted, color: STATUS_COLORS.NOT_GRANTED },
      { name: STATUS_LABELS.UNKNOWN,     value: stats.unknown,    color: STATUS_COLORS.UNKNOWN },
    ].filter(d => d.value > 0);
  }, [stats]);

  const groupBarData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const s of students) {
      const key = s.group?.name ?? 'Noma\'lum';
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += s.grantScore;
      map[key].count += 1;
    }
    return Object.entries(map)
      .map(([name, { total, count }]) => ({
        name,
        ball: Math.round((total / count) * 10) / 10,
      }))
      .sort((a, b) => b.ball - a.ball);
  }, [students]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Tizimning umumiy ko'rinishi</p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard label="Jami talabalar" value={stats?.total ?? 0}
              icon={<Users className="w-5 h-5 text-slate-400" />} />
            <KpiCard label="Grant berildi" value={stats?.granted ?? 0}
              valueClass="text-emerald-600"
              icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} />
            <KpiCard label="Kutilmoqda" value={stats?.pending ?? 0}
              valueClass="text-amber-600"
              icon={<Clock className="w-5 h-5 text-amber-500" />} />
            <KpiCard label="Grant yo'q" value={stats?.notGranted ?? 0}
              valueClass="text-red-600"
              icon={<XCircle className="w-5 h-5 text-red-500" />} />
            <KpiCard label="O'rtacha ball" value={stats?.avg ?? 0}
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />} />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut — status taqsimoti */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-4">Grant holati taqsimoti</h2>
            {isLoading ? (
              <div className="h-56 bg-slate-100 animate-pulse rounded-lg" />
            ) : donutData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={58} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} talaba`]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar — guruh bo'yicha o'rtacha ball */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-4">Guruh bo'yicha o'rtacha ball</h2>
            {isLoading ? (
              <div className="h-56 bg-slate-100 animate-pulse rounded-lg" />
            ) : groupBarData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={groupBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} ball`, "O'rtacha"]} />
                  <Bar dataKey="ball" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tezkor amallar */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-base font-semibold mb-4">Tezkor amallar</h2>
          <div className="flex flex-wrap gap-3">
            <QuickLink
              to="/admin/achievements"
              icon={<Star className="w-4 h-4 text-amber-500" />}
              label="Kutilayotgan yutuqlar"
              badge={pendingAchievements.length}
              badgeClass="bg-amber-100 text-amber-700"
            />
            <QuickLink
              to="/admin/grants"
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              label="Grant qarorlar"
              badge={stats?.pending ?? 0}
              badgeClass="bg-emerald-100 text-emerald-700"
            />
            <QuickLink
              to="/admin/penalties"
              icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
              label="Jarimalar"
            />
            <QuickLink
              to="/admin/students"
              icon={<Users className="w-4 h-4 text-slate-500" />}
              label="Barcha talabalar"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({
  label, value, icon, valueClass = 'text-slate-900',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium leading-tight">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function QuickLink({
  to, icon, label, badge = 0, badgeClass = '',
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeClass?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function EmptyChart() {
  return (
    <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
      Ma'lumot yo'q
    </div>
  );
}
