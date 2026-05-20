import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Users, Trophy, Clock, XCircle, BarChart2,
  Star, AlertTriangle, BadgeCheck, ArrowRight, Download, RefreshCw,
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
type Group = { id: string; name: string; course: number };
type Achievement = { id: string };
type Penalty = { id: string; recoveryDone: boolean };

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

function exportCSV(students: Student[]) {
  const headers = ['Ism', 'Guruh', 'Ball', 'Status'];
  const rows = students.map(s => [
    `"${s.fullName}"`,
    `"${s.group?.name ?? ''}"`,
    s.grantScore,
    s.grantStatus,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talabalar_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: students = [], isLoading, isFetching } = useQuery({
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
  const { data: allGroups = [] } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => (await api.get<Group[]>('/admin/groups')).data,
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
    const scoreMap: Record<string, { total: number; count: number }> = {};
    for (const s of students) {
      const k = s.group?.name ?? "Noma'lum";
      if (!scoreMap[k]) scoreMap[k] = { total: 0, count: 0 };
      scoreMap[k].total += s.grantScore;
      scoreMap[k].count++;
    }
    const groups = allGroups.length ? allGroups.map(g => g.name) : Object.keys(scoreMap);
    return groups.map(group => {
      const d = scoreMap[group];
      return { group, ball: d ? Math.round((d.total / d.count) * 10) / 10 : 0 };
    });
  }, [students, allGroups]);

  const activePenalties = penalties.filter(p => !p.recoveryDone).length;
  const total = stats?.total ?? 0;

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-students'] });
    qc.invalidateQueries({ queryKey: ['admin-achievements'] });
    qc.invalidateQueries({ queryKey: ['admin-penalties'] });
    qc.invalidateQueries({ queryKey: ['admin-groups'] });
  }

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
            <button
              onClick={refresh}
              title="Yangilash"
              className={`flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors ${isFetching ? 'opacity-60' : ''}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => exportCSV(students)}
              disabled={!students.length}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <KpiCard
              label="Jami talabalar"
              value={stats?.total ?? 0}
              trend={`${stats?.total ?? 0} ta ro'yxatda`}
              icon={<Users className="w-3.5 h-3.5" />}
              onClick={() => navigate('/admin/students')}
            />
            <KpiCard
              label="Grant olganlar"
              value={stats?.granted ?? 0}
              sub={`/ ${total}`}
              trend={`${total ? Math.round((stats!.granted / total) * 100) : 0}% ulushi`}
              trendUp
              accent="#10b981"
              icon={<Trophy className="w-3.5 h-3.5" />}
              onClick={() => navigate('/admin/grants')}
            />
            <KpiCard
              label="Kutilmoqda"
              value={stats?.pending ?? 0}
              trend="ko'rib chiqilmoqda"
              accent="#d97706"
              icon={<Clock className="w-3.5 h-3.5" />}
              onClick={() => navigate('/admin/grants')}
            />
            <KpiCard
              label="Grant yo'q"
              value={stats?.notGranted ?? 0}
              trend={`${total ? Math.round((stats!.notGranted / total) * 100) : 0}% ulushi`}
              trendUp={false}
              accent="#dc2626"
              icon={<XCircle className="w-3.5 h-3.5" />}
              onClick={() => navigate('/admin/students')}
            />
            <KpiCard
              label="O'rtacha ball"
              value={stats?.avg ?? 0}
              sub="/ 100"
              trend="+3 oxirgi oyda"
              trendUp
              icon={<BarChart2 className="w-3.5 h-3.5" />}
              onClick={() => navigate('/admin/rating')}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
          {/* Donut */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">Status taqsimoti</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Joriy semestr</p>
            {isLoading ? (
              <div className="h-44 bg-slate-100 animate-pulse rounded-lg" />
            ) : donutData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                Ma'lumot yo'q
              </div>
            ) : (
              <div className="flex items-center gap-5">
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
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [`${v} ta`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[26px] font-semibold text-slate-900 tabular-nums tracking-tight leading-none">
                      {stats?.total ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">talaba</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {donutData.map((d, i) => (
                    <div key={i} className="py-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-[12.5px] text-slate-700">
                          <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: d.color }} />
                          {d.name}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                          {d.value} · {total ? Math.round((d.value / total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: total ? `${(d.value / total) * 100}%` : '0%', background: d.color }}
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
              <div className="bg-slate-100 animate-pulse rounded-lg" style={{ height: 220 }} />
            ) : groupData.length === 0 ? (
              <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: 220 }}>
                Guruhlar yo'q
              </div>
            ) : (
              <div style={{ height: 220 }}>
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
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v} ball`, "O'rtacha"]}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="ball" radius={[6, 6, 0, 0]} maxBarSize={48}>
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

        {/* Quick actions */}
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
            badge={activePenalties || undefined}
            arrow={!activePenalties}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ── KPI Card ─────────────────────────────────────────── */
function KpiCard({
  label, value, sub, trend, trendUp, accent, icon, onClick,
}: {
  label: string;
  value: number;
  sub?: string;
  trend?: string;
  trendUp?: boolean | null;
  accent?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-medium text-slate-500 leading-tight">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p
          className="text-[28px] font-semibold tabular-nums leading-none tracking-tight"
          style={{ color: accent ?? '#0f172a' }}
        >
          {value}
        </p>
        {sub && <span className="text-[12px] text-slate-400 tabular-nums">{sub}</span>}
      </div>
      {trend && (
        <p
          className="text-[11.5px] mt-1.5 tabular-nums"
          style={{ color: trendUp === true ? '#10b981' : trendUp === false ? '#ef4444' : '#94a3b8' }}
        >
          {trend}
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
