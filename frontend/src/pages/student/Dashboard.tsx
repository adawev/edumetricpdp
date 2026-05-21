import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { T, GRANT_REASON_LABEL_SHORT } from '@/lib/theme';
import { Card, Skeleton, Tooltip, Dialog } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useStudentMe, useStudentRankings, useAchievements } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { GrantStatus } from '@/types/student';

// ── constants ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<GrantStatus, { bg: string; fg: string; border: string; dot: string; label: string }> = {
  GRANTED:     { bg: T.emeraldBg,  fg: T.emeraldText, border: T.emerald, dot: T.emerald, label: 'Grant berildi' },
  PENDING:     { bg: T.amberBg,    fg: T.amberText,   border: T.amber,   dot: T.amber,   label: 'Kutilmoqda' },
  NOT_GRANTED: { bg: T.redBg,      fg: T.redText,     border: T.red,     dot: T.red,     label: "Grant yo'q" },
  UNKNOWN:     { bg: T.bgSubtle,   fg: T.textMuted,   border: T.border,  dot: T.textSubtle, label: 'Aniqlanmagan' },
};

const PIE_ITEMS = [
  { key: 'academic',   label: 'Akademik',  max: 40, color: '#10b981', desc: 'GPA asosida hisoblangan, max 40 ball' },
  { key: 'attendance', label: 'Davomat',   max: 20, color: '#34d399', desc: 'LMS davomat foizi asosida, max 20 ball' },
  { key: 'projects',   label: 'Loyihalar', max: 15, color: '#6ee7b7', desc: 'Loyiha topshiriqlar natijasi, max 15 ball' },
  { key: 'activity',   label: 'Faollik',   max: 10, color: '#a7f3d0', desc: 'Sertifikat va tadbir ishtiroki, max 10 ball' },
  { key: 'tutor',      label: 'Tyutor',    max: 5,  color: '#fbbf24', desc: 'Mentor tomonidan beriladigan baho, max 5 ball' },
  { key: 'discipline', label: 'Intizom',   max: 10, color: '#f59e0b', desc: 'Intizom va xulq ko\'rsatkichi, max 10 ball' },
];

function buildGrowthData(total: number, gpa: number) {
  const months = ['Noy', 'Dek', 'Yan', 'Fev', 'Mar', 'Apr'];
  const DELTAS = [0.31, 0.67, 0.19, 0.53, 0.42];
  return months.map((month, i) => {
    const offset = i === 5 ? 0 : -((5 - i) * (2 + DELTAS[i] * 3));
    return {
      month,
      ball: Math.max(0, Math.round((total + offset) * 10) / 10),
      gpa:  Math.max(0, Math.round((gpa + offset * 0.4) * 10) / 10),
    };
  });
}

const fmtRelative = (s: string) => {
  const d = new Date(s);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  if (diff < 7) return `${diff} kun oldin`;
  if (diff < 30) return `${Math.round(diff / 7)} hafta oldin`;
  return `${Math.round(diff / 30)} oy oldin`;
};

// ── sub-components ────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, height = 4 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s ease' }} />
    </div>
  );
}

function KpiCard({ label, value, sub, accent, icon }: {
  label: string; value: string | number; sub?: string;
  accent?: string; icon: (p: any) => JSX.Element;
}) {
  const ac = accent ?? T.textMuted;
  return (
    <Card padding={18}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: ac + '18', display: 'grid', placeItems: 'center' }}>
          {icon({ size: 13, stroke: ac })}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: T.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        {sub && <span style={{ fontSize: 13, color: T.textMuted, marginLeft: 4 }}>{sub}</span>}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { data, isLoading, isError, refetch } = useStudentMe();
  const { data: rankings } = useStudentRankings();
  const { data: achievements } = useAchievements();

  const pieData = useMemo(() => {
    if (!data) return [];
    const bd = data.breakdown;
    return PIE_ITEMS.map(item => ({ ...item, value: (bd as any)[item.key] ?? 0 }));
  }, [data]);

  const growthData = useMemo(() => {
    if (!data) return [];
    return buildGrowthData(data.breakdown.total, data.student.gpa);
  }, [data]);

  const recentActivity = useMemo(() => {
    const items: { iconType: 'award' | 'bolt'; color: string; title: string; sub: string; date: string }[] = [];
    if (achievements) {
      achievements.forEach(a => {
        items.push({
          iconType: 'award',
          color: a.status === 'APPROVED' ? T.emerald : a.status === 'REJECTED' ? T.red : T.amber,
          title: a.title,
          sub: a.status === 'APPROVED' ? `Tasdiqlandi · +${a.ball} ball`
             : a.status === 'REJECTED' ? 'Rad etildi'
             : "Ko'rib chiqilmoqda",
          date: a.createdAt,
        });
      });
    }
    if (data?.student.penalties) {
      data.student.penalties.forEach(p => {
        items.push({
          iconType: 'bolt',
          color: T.red,
          title: `Jarima: ${p.reason}`,
          sub: `−${p.ball} ball${p.recovered > 0 ? ` · +${p.recovered} qaytarildi` : ''}`,
          date: p.createdAt,
        });
      });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [achievements, data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  const { student, breakdown } = data;
  const status = student.grantStatus;
  const sc = STATUS_CFG[status];
  const totalBase = breakdown.base;
  const rankStr = rankings ? `#${rankings.university.rank}` : '—';

  const conditions = [
    { label: 'Ball ≥ 80',     value: `${breakdown.total.toFixed(1)}`,       ok: breakdown.total >= 80 },
    { label: 'GPA ≥ 80%',     value: `${student.gpa.toFixed(1)}%`,           ok: student.gpa >= 80 },
    { label: 'Davomat ≥ 75%', value: `${student.attendance.toFixed(1)}%`,    ok: student.attendance >= 75 },
    { label: 'Intizom',       value: breakdown.penalty === 0 ? 'Toza' : `−${breakdown.penalty}`, ok: breakdown.penalty < 10 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
            Salom, {student.fullName.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
            Sizning grant holatingiz va ko'rsatkichlaringiz — 2026 bahor semestri
          </p>
        </div>
        <span style={{
          padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          background: sc.bg, color: sc.fg, border: `1px solid ${sc.border}`,
          flexShrink: 0,
        }}>
          {sc.label}
        </span>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Grant ball"     value={breakdown.total.toFixed(1)} sub="/ 100"
          accent={T.emerald} icon={Icons.trophy} />
        <KpiCard label="GPA"             value={`${student.gpa.toFixed(1)}%`} icon={Icons.graduation} />
        <KpiCard label="Davomat"         value={`${student.attendance.toFixed(1)}%`} icon={Icons.cal} />
        <KpiCard label="Reytingda o'rin" value={rankStr}
          sub={rankings ? `/ ${rankings.university.total}` : ''} icon={Icons.bar} />
      </div>

      {/* Donut chart + grant status card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        <Card padding={20}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Grant ball — taqsimot</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
              Har bir mezon bo'yicha ulush — kursor olib boring batafsil ma'lumot uchun
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 200, height: 200, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={62} outerRadius={92}
                       paddingAngle={2} stroke="none" animationDuration={800}>
                    {pieData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                    {totalBase.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>/ 100 ball</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, columnGap: 22 }}>
              {pieData.map((item, i) => (
                <Tooltip key={i} content={item.desc}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: item.color }} />
                        <span>{item.label}</span>
                      </span>
                      <span style={{ color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                        <span style={{ color: T.text, fontWeight: 500 }}>{item.value.toFixed(1)}</span> / {item.max}
                      </span>
                    </div>
                    <ProgressBar value={item.value} max={item.max} color={item.color} height={4} />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </Card>

        {/* Grant status */}
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '18px 20px',
            background: `linear-gradient(180deg, ${sc.bg} 0%, #ffffff 100%)`,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: sc.dot,
                boxShadow: `0 0 0 4px ${sc.dot}33` }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: sc.fg, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                {sc.label}
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>2026 bahor semestri</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>
              {status === 'GRANTED'
                ? 'Avtomatik qaror · Barcha shartlar bajarildi'
                : student.grantReason
                  ? (GRANT_REASON_LABEL_SHORT[student.grantReason] ?? student.grantReason)
                  : 'Grant holati aniqlanmoqda'}
            </div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: T.textMuted,
              textTransform: 'uppercase', letterSpacing: '.06em' }}>Shartlar</div>
            {conditions.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 12.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.text }}>
                  {row.ok
                    ? Icons.check({ size: 13, stroke: T.emerald, strokeWidth: 2.5 })
                    : Icons.x({ size: 13, stroke: T.red, strokeWidth: 2.5 })}
                  {row.label}
                </span>
                <span style={{ color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Growth chart + activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                6 oylik o'sish dinamikasi
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: T.amberBg, color: T.amberText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Demo</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>Tarixiy ma'lumot mavjud bo'lganda almashtiriladi</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: T.textMuted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 2.5, background: T.emerald, borderRadius: 999 }} /> Grant ball
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 2.5, background: T.slate900, borderRadius: 999 }} /> GPA %
              </span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke={T.textSubtle} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textSubtle} fontSize={11.5} tickLine={false} axisLine={false} domain={[60, 100]} />
                <ReTooltip
                  contentStyle={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, padding: '8px 10px' }}
                  formatter={(v: number, name: string) => [v, name === 'ball' ? 'Grant ball' : 'GPA %']}
                />
                <Line type="monotone" dataKey="ball" stroke={T.emerald} strokeWidth={2.5}
                  dot={{ r: 4, fill: T.emerald, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={900} />
                <Line type="monotone" dataKey="gpa" stroke={T.slate900} strokeWidth={2}
                  dot={{ r: 3, fill: T.white, stroke: T.slate900, strokeWidth: 1.5 }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity feed */}
        <Card padding={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>So'nggi faollik</div>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: T.textSubtle, fontSize: 13 }}>
              Hali faollik yo'q
            </div>
          ) : (
            <div>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 10,
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: T.bg, display: 'grid',
                    placeItems: 'center', flexShrink: 0, border: `1px solid ${T.border}` }}>
                    {a.iconType === 'bolt'
                      ? Icons.bolt({ size: 14, stroke: a.color })
                      : Icons.award({ size: 14, stroke: a.color })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSubtle, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {fmtRelative(a.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <LmsAttendanceSection />

    </div>
  );
}

// ── LMS Attendance ─────────────────────────────────────────────────────────

type SubjectLogEntry = { date: string; status: 'present' | 'absent' | 'late' };
type LmsSubject = { id: string; name: string; pct: number; total: number; present: number; absent: number; late?: number; log?: SubjectLogEntry[] };
type LmsAttendance = { overall: number; subjects: LmsSubject[] };

function LmsAttendanceSection() {
  const [selected, setSelected] = useState<LmsSubject | null>(null);

  const { data } = useQuery<LmsAttendance>({
    queryKey: ['student-lms-attendance'],
    queryFn: async () => (await api.get<LmsAttendance>('/students/me/lms-attendance')).data,
  });

  if (!data) return null;

  const pct = data.overall;
  const R = 52, CX = 64, CY = 64, STROKE = 9;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - pct / 100);
  const ringColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <Card padding={20}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>LMS Davomat (joriy semestr)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'start' }}>
          <div style={{ position: 'relative', width: CX * 2, height: CY * 2, flexShrink: 0 }}>
            <svg width={CX * 2} height={CY * 2}>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
              <circle cx={CX} cy={CY} r={R} fill="none" stroke={ringColor} strokeWidth={STROKE}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: 'stroke-dashoffset .5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: T.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              <span style={{ fontSize: 10.5, color: T.textMuted, marginTop: 3 }}>umumiy</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {data.subjects.map(sub => {
              const subColor = sub.pct >= 80 ? '#10b981' : sub.pct >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={sub.id} onClick={() => setSelected(sub)} style={{
                  padding: '10px 12px', borderRadius: 10, border: `1px solid ${T.border}`,
                  background: T.white, cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = subColor; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 7, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                  <ProgressBar value={sub.pct} max={100} color={subColor} height={5} />
                  <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted }}>
                    <span>{sub.present}/{sub.total}</span>
                    <span style={{ fontWeight: 600, color: subColor }}>{sub.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} size="sm">
        {selected && (
          <>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, marginBottom: 14 }}>
              <span style={{ color: T.textMuted }}>Jami: <b style={{ color: T.text }}>{selected.total}</b></span>
              <span style={{ color: '#059669' }}>Keldi: <b>{selected.present}</b></span>
              <span style={{ color: '#dc2626' }}>Kelmadi: <b>{selected.absent}</b></span>
              {!!selected.late && <span style={{ color: '#d97706' }}>Kech: <b>{selected.late}</b></span>}
            </div>
            {selected.log && selected.log.length > 0 ? (
              <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: T.bg, position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>Sana</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.log.map((entry, i) => (
                      <tr key={i} style={{ borderBottom: i < selected.log!.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <td style={{ padding: '8px 14px', color: T.text }}>{entry.date}</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{
                            display: 'inline-flex', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            background: entry.status === 'present' ? '#ecfdf5' : entry.status === 'late' ? '#fef3c7' : '#fef2f2',
                            color:      entry.status === 'present' ? '#065f46' : entry.status === 'late' ? '#92400e' : '#991b1b',
                          }}>
                            {entry.status === 'present' ? 'Keldi' : entry.status === 'late' ? 'Kech keldi' : 'Kelmadi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: T.textMuted, fontSize: 13, padding: '16px 0' }}>Darslik jurnali mavjud emas</div>
            )}
          </>
        )}
      </Dialog>
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><Skeleton h={28} w={200} r={8} /><Skeleton h={16} w={300} r={6} style={{ marginTop: 8 }} /></div>
        <Skeleton h={32} w={180} r={8} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} h={96} r={12} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        <Skeleton h={280} r={12} />
        <Skeleton h={280} r={12} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        <Skeleton h={300} r={12} />
        <Skeleton h={300} r={12} />
      </div>
    </div>
  );
}
