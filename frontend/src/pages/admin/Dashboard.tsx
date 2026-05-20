import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Users, Trophy, Clock, XCircle, BarChart2,
  Star, AlertTriangle, BadgeCheck, ArrowRight, Download,
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
type Penalty     = { id: string; recoveryDone: boolean };

const STATUS_COLORS: Record<string, string> = {
  GRANTED:     '#10b981',
  PENDING:     '#f59e0b',
  NOT_GRANTED: '#ef4444',
};
const STATUS_LABELS: Record<string, string> = {
  GRANTED:     'Grant berildi',
  PENDING:     'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q",
};

export default function AdminDashboard() {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
  });
  const { data: pendingAch = [] } = useQuery({
    queryKey: ['admin-achievements', 'PENDING'],
    queryFn: async () =>
      (await api.get<Achievement[]>('/admin/achievements', { params: { status: 'PENDING' } })).data,
  });
  const { data: penalties = [] } = useQuery({
    queryKey: ['admin-penalties'],
    queryFn: async () => (await api.get<Penalty[]>('/admin/penalties')).data,
  });

  const stats = useMemo(() => {
    if (!students.length) return null;
    const granted    = students.filter(s => s.grantStatus === 'GRANTED').length;
    const pending    = students.filter(s => s.grantStatus === 'PENDING').length;
    const notGranted = students.filter(s => s.grantStatus === 'NOT_GRANTED').length;
    const avg        = Math.round(students.reduce((a, s) => a + s.grantScore, 0) / students.length);
    return { total: students.length, granted, pending, notGranted, avg };
  }, [students]);

  const donutData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: STATUS_LABELS.GRANTED,     value: stats.granted,    color: STATUS_COLORS.GRANTED },
      { name: STATUS_LABELS.PENDING,     value: stats.pending,    color: STATUS_COLORS.PENDING },
      { name: STATUS_LABELS.NOT_GRANTED, value: stats.notGranted, color: STATUS_COLORS.NOT_GRANTED },
    ].filter(d => d.value > 0);
  }, [stats]);

  const groupData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const s of students) {
      const k = s.group?.name ?? 'Noma\'lum';
      if (!map[k]) map[k] = { total: 0, count: 0 };
      map[k].total += s.grantScore;
      map[k].count++;
    }
    return Object.entries(map).map(([group, { total, count }]) => ({
      group,
      ball: Math.round((total / count) * 10) / 10,
    }));
  }, [students]);

  const activePenalties = penalties.filter(p => !p.recoveryDone).length;
  const total = stats?.total ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">

        {/* Page header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Statistika</h1>
            <p className="text-[13.5px] text-slate-500 mt-1">Umumiy ko'rsatkichlar va tezkor amallar</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Eksport
            </button>
            <Link
              to="/admin/grants"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-[12.5px] font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" /> Grant qarori
            </Link>
          </div>
        </div>

        {/* KPI cards — 5 col */}
        {isLoading ? (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <KpiCard
              label="Jami talabalar"
              value={stats?.total ?? 0}
              sub={`${stats?.total ?? 0} jami`}
              icon={<Users className="w-3.5 h-3.5" />}
            />
            <KpiCard
              label="Grant olganlar"
              value={stats?.granted ?? 0}
              sub={`${total ? Math.round((stats!.granted / total) * 100) : 0}%`}
              trendUp
              accent="#10b981"
              icon={<Trophy className="w-3.5 h-3.5" />}
            />
            <KpiCard
              label="Kutilmoqda"
              value={stats?.pending ?? 0}
              sub="ko'rib chiqilmoqda"
              accent="#d97706"
              icon={<Clock className="w-3.5 h-3.5" />}
            />
            <KpiCard
              label="Grant yo'q"
              value={stats?.notGranted ?? 0}
              sub={`${total ? Math.round((stats!.notGranted / total) * 100) : 0}%`}
              trendUp={false}
              accent="#dc2626"
              icon={<XCircle className="w-3.5 h-3.5" />}
            />
            <KpiCard
              label="O'rtacha ball"
              value={stats?.avg ?? 0}
              sub="/ 100"
              trendUp
              icon={<BarChart2 className="w-3.5 h-3.5" />}
            />
          </div>
        )}

        {/* Charts — 1fr : 1.4fr */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
          {/* Donut */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">Status taqsimoti</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Joriy semestr</p>
            {isLoading ? (
              <div className="h-44 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-center gap-5">
                {/* Donut with center label */}
                <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        innerRadius={56}
                        outerRadius={84}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[26px] font-semibold text-slate-900 tabular-nums tracking-tight leading-none">
                      {stats?.total ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">talaba</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {donutData.map((d, i) => (
                    <div key={i} className="py-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-[12.5px] text-slate-700">
                          <span
                            className="w-2 h-2 rounded-[3px] shrink-0"
                            style={{ background: d.color }}
                          />
                          {d.name}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                          {d.value} · {total ? Math.round((d.value / total) * 100) : 0}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: total ? `${(d.value / total) * 100}%` : '0%',
                            background: d.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">Guruh bo'yicha o'rtacha ball</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">Bahor 2026 semestri</p>
            {isLoading ? (
              <div className="bg-slate-100 animate-pulse rounded-lg" style={{ height: 260 }} />
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="group"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} ball`, "O'rtacha"]}
                    />
                    <Bar dataKey="ball" radius={[6, 6, 0, 0]} maxBarSize={52}>
                      {groupData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.ball >= 80 ? '#10b981' : d.ball >= 70 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions — 3 col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickCard
            to="/admin/achievements"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            icon={<Star className="w-5 h-5" />}
            title="Kutilayotgan yutuqlar"
            desc="Tasdiqlash kerak"
            badge={pendingAch.length}
          />
          <QuickCard
            to="/admin/grants"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            icon={<BadgeCheck className="w-5 h-5" />}
            title="Grant qarori paneli"
            desc="Slot taqsimoti"
            arrow
          />
          <QuickCard
            to="/admin/penalties"
            iconBg="bg-red-50"
            iconColor="text-red-600"
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Jarima boshqaruvi"
            desc={`${activePenalties} ta faol`}
            arrow
          />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ── KPI Card ─────────────────────────────────────────── */
function KpiCard({
  label, value, sub, trendUp, accent, icon,
}: {
  label: string;
  value: number;
  sub?: string;
  trendUp?: boolean | null;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-medium text-slate-500 leading-tight">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p
        className="text-[28px] font-semibold tabular-nums leading-none tracking-tight"
        style={{ color: accent ?? '#0f172a' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11.5px] mt-1.5 tabular-nums"
          style={{ color: trendUp === true ? '#10b981' : trendUp === false ? '#ef4444' : '#94a3b8' }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Quick action card ────────────────────────────────── */
function QuickCard({
  to, iconBg, iconColor, icon, title, desc, badge, arrow,
}: {
  to: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: number;
  arrow?: boolean;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className={`w-11 h-11 rounded-[10px] ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 leading-tight">{title}</p>
        <p className="text-[12px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      {badge != null && badge > 0 ? (
        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0">
          {badge}
        </span>
      ) : arrow ? (
        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
      ) : null}
    </Link>
  );
}
