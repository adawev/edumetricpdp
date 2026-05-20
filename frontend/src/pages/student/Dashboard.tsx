import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { T, GRANT_REASON_LABEL_SHORT } from '@/lib/theme';
import { Card, Button, Skeleton, Dialog, Tooltip } from '@/components/em/Primitives';
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

// ── LMS static demo data ─────────────────────────────────────────────────

type LmsLog = { date: string; time: string; status: 'attended' | 'absent'; reason: string | null };
type LmsSubject = { name: string; teacher: string; total: number; attended: number; absent: number; pct: number; logs: LmsLog[] };

const LMS_SUBJECTS: LmsSubject[] = [
  {
    name: "Ma'lumotlar strukturasi",
    teacher: 'D. Eshmuradov',
    total: 30, attended: 28, absent: 2, pct: 93.3,
    logs: [
      { date: '2026-05-14', time: '09:00', status: 'attended', reason: null },
      { date: '2026-05-12', time: '09:00', status: 'attended', reason: null },
      { date: '2026-05-09', time: '09:00', status: 'absent',   reason: 'Kasalligi sababli' },
      { date: '2026-05-07', time: '09:00', status: 'attended', reason: null },
      { date: '2026-05-05', time: '09:00', status: 'attended', reason: null },
      { date: '2026-05-02', time: '09:00', status: 'absent',   reason: 'Sertifikat imtihoni' },
      { date: '2026-04-30', time: '09:00', status: 'attended', reason: null },
    ],
  },
  {
    name: 'Web dasturlash (JavaScript)',
    teacher: 'A. Saidov',
    total: 25, attended: 24, absent: 1, pct: 96.0,
    logs: [
      { date: '2026-05-13', time: '11:00', status: 'attended', reason: null },
      { date: '2026-05-11', time: '11:00', status: 'attended', reason: null },
      { date: '2026-05-08', time: '11:00', status: 'attended', reason: null },
      { date: '2026-05-06', time: '11:00', status: 'absent',   reason: 'Universitet tadbiri' },
      { date: '2026-05-04', time: '11:00', status: 'attended', reason: null },
      { date: '2026-05-01', time: '11:00', status: 'attended', reason: null },
    ],
  },
  {
    name: 'Frontend frameworks (React)',
    teacher: 'A. Saidov',
    total: 25, attended: 23, absent: 2, pct: 92.0,
    logs: [
      { date: '2026-05-15', time: '14:00', status: 'attended', reason: null },
      { date: '2026-05-13', time: '14:00', status: 'attended', reason: null },
      { date: '2026-05-10', time: '14:00', status: 'absent',   reason: 'Kasalligi sababli' },
      { date: '2026-05-08', time: '14:00', status: 'attended', reason: null },
      { date: '2026-05-06', time: '14:00', status: 'absent',   reason: 'Kasalligi sababli' },
      { date: '2026-05-03', time: '14:00', status: 'attended', reason: null },
    ],
  },
  {
    name: "Ma'lumotlar bazasi (PostgreSQL)",
    teacher: 'D. Rahmatova',
    total: 20, attended: 19, absent: 1, pct: 95.0,
    logs: [
      { date: '2026-05-14', time: '15:30', status: 'attended', reason: null },
      { date: '2026-05-12', time: '15:30', status: 'attended', reason: null },
      { date: '2026-05-07', time: '15:30', status: 'attended', reason: null },
      { date: '2026-05-05', time: '15:30', status: 'absent',   reason: 'Sabab ko\'rsatilmagan' },
      { date: '2026-05-02', time: '15:30', status: 'attended', reason: null },
    ],
  },
  {
    name: 'Soft skills va loyiha menejmenti',
    teacher: 'N. Qodirova',
    total: 20, attended: 20, absent: 0, pct: 100.0,
    logs: [
      { date: '2026-05-15', time: '10:00', status: 'attended', reason: null },
      { date: '2026-05-13', time: '10:00', status: 'attended', reason: null },
      { date: '2026-05-08', time: '10:00', status: 'attended', reason: null },
      { date: '2026-05-06', time: '10:00', status: 'attended', reason: null },
      { date: '2026-05-01', time: '10:00', status: 'attended', reason: null },
    ],
  },
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

function KpiCard({ label, value, sub, trend, trendUp, accent, icon }: {
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean | null;
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
      {trend && (
        <div style={{ marginTop: 6, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4,
          color: trendUp === true ? T.emeraldText : trendUp === false ? T.redText : T.textMuted }}>
          {trendUp === true && Icons.trending({ size: 11, stroke: T.emerald })}
          {trendUp === false && Icons.trending({ size: 11, stroke: T.red, style: { transform: 'scaleY(-1)' } })}
          {trend}
        </div>
      )}
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
    const items: { iconType: 'award' | 'message' | 'bolt'; color: string; title: string; sub: string; date: string }[] = [];
    if (achievements) {
      achievements.slice(0, 3).forEach(a => {
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
    items.push(
      { iconType: 'message', color: T.textMuted, title: 'Mentor feedback olindi', sub: 'Akbar Saidov · 5/5', date: new Date(Date.now() - 15 * 86400000).toISOString() },
      { iconType: 'bolt',    color: T.amber,     title: 'Jarima qaydi: Yengil',   sub: 'Kechikish · −1 ball',  date: new Date(Date.now() - 35 * 86400000).toISOString() },
    );
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [achievements]);

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
    { label: 'Intizom',       value: breakdown.penalty === 0 ? 'Toza ✓' : `−${breakdown.penalty}`, ok: breakdown.penalty < 10 },
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Button variant="outline" size="sm" icon={Icons.download({ size: 13, stroke: T.textMuted })}>
            Hisobotni yuklab olish
          </Button>
          <span style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
            background: sc.bg, color: sc.fg, border: `1px solid ${sc.border}`,
          }}>
            {sc.label}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Grant ball"     value={breakdown.total.toFixed(1)} sub="/ 100"
          trend="+4 oxirgi oyda" trendUp accent={T.emerald} icon={Icons.trophy} />
        <KpiCard label="GPA"             value={`${student.gpa.toFixed(1)}%`}
          trend="+2% oxirgi oyda" trendUp icon={Icons.graduation} />
        <KpiCard label="Davomat"         value={`${student.attendance.toFixed(1)}%`}
          trend="Barqaror" trendUp={null} icon={Icons.cal} />
        <KpiCard label="Reytingda o'rin" value={rankStr}
          sub={rankings ? `/ ${rankings.university.total}` : ''} trend="↑ 2 pog'ona" trendUp icon={Icons.bar} />
      </div>

      {/* Donut chart + grant status card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        <Card padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Grant ball — taqsimot</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>Har bir mezon bo'yicha ulush · Nizom 2026.1</div>
            </div>
            <Button variant="ghost" size="sm" icon={Icons.info({ size: 13, stroke: T.textMuted })}>Mezon ta'rifi</Button>
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
                  {row.value} {row.ok ? '✓' : '✗'}
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>6 oylik o'sish dinamikasi</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>Grant ball va GPA bo'yicha</div>
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
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>So'nggi faollik</div>
            <Button size="sm" variant="ghost">Hammasi</Button>
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
                    {a.iconType === 'message'
                      ? Icons.message({ size: 14, stroke: a.color })
                      : a.iconType === 'bolt'
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

      {/* LMS attendance by subject */}
      <LmsAttendanceSection attendance={student.attendance} />
    </div>
  );
}

// ── LMS Attendance by subject ─────────────────────────────────────────────

function LmsAttendanceSection({ attendance }: { attendance: number }) {
  const [openSubject, setOpenSubject] = useState<LmsSubject | null>(null);
  const overall = attendance;
  const totalLessons = LMS_SUBJECTS.reduce((s, sub) => s + sub.total, 0);
  const attendedLessons = Math.round(totalLessons * attendance / 100);
  const tone = (p: number) => p >= 90 ? T.emerald : p >= 75 ? T.amber : T.red;
  const toneText = (p: number) => p >= 90 ? T.emeraldDeep : p >= 75 ? T.amberDeep : T.redDeep;
  const toneBg = (p: number) => p >= 90 ? T.emeraldBg : p >= 75 ? T.amberBg : T.redBg;
  const r = 38;
  const circ = Math.PI * 2 * r;

  return (
    <Card padding={0}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            {Icons.cal({ size: 14, stroke: T.textMuted })} Fanlar bo'yicha davomat
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
            LMS tizimidan kelgan ma'lumotlar · oxirgi yangilanish bugun
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Umumiy</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: toneText(overall), letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {overall.toFixed(1)}%
            </div>
          </div>
          <div style={{ width: 92, height: 92, position: 'relative', flexShrink: 0 }}>
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r={r} fill="none" stroke={T.bgSubtle} strokeWidth="8" />
              <circle cx="46" cy="46" r={r} fill="none" stroke={tone(overall)} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circ * overall / 100} ${circ}`}
                transform="rotate(-90 46 46)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{attendedLessons}</div>
                <div style={{ fontSize: 10, color: T.textSubtle }}>/ {totalLessons}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {LMS_SUBJECTS.map((sub, i) => {
          const p = sub.pct;
          return (
            <div key={i}
              onClick={() => setOpenSubject(sub)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.borderStrong; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              style={{ padding: 14, border: `1px solid ${T.border}`, borderRadius: 10, background: T.white, transition: 'border-color .15s, box-shadow .15s', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{sub.name}</div>
                  <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {Icons.user({ size: 11, stroke: T.textMuted })} {sub.teacher}
                  </div>
                </div>
                <div style={{ padding: '3px 8px', borderRadius: 999, background: toneBg(p), color: toneText(p), fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {p.toFixed(1)}%
                </div>
              </div>
              <ProgressBar value={Math.min(p, 100)} max={100} color={tone(p)} height={4} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: T.textMuted, marginTop: 8 }}>
                <span>
                  <span style={{ color: T.text, fontWeight: 500 }}>{sub.attended}</span>
                  {' / '}{sub.total} dars
                  {sub.absent > 0 && <span style={{ color: T.redDeep, marginLeft: 8 }}>{sub.absent} ta qoldirgan</span>}
                </span>
                <span style={{ color: T.text, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  Tafsilot {Icons.arrowRight({ size: 11, stroke: T.text })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <SubjectDetailDialog subject={openSubject} onClose={() => setOpenSubject(null)} />
    </Card>
  );
}

function SubjectDetailDialog({ subject, onClose }: { subject: LmsSubject | null; onClose: () => void }) {
  if (!subject) return null;
  const fmtD = (s: string) => {
    const d = new Date(s);
    const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };
  return (
    <Dialog open={!!subject} onClose={onClose} size="lg"
      title={subject.name}
      description={`${subject.teacher} · ${subject.attended}/${subject.total} dars · ${subject.pct.toFixed(1)}% davomat`}
      footer={<Button variant="primary" onClick={onClose}>Yopish</Button>}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, padding: 12, background: T.emeraldBg, borderRadius: 8 }}>
          <div style={{ fontSize: 10.5, color: T.emeraldText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Qatnashgan</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.emeraldText, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{subject.attended}</div>
        </div>
        <div style={{ flex: 1, padding: 12, background: T.redBg, borderRadius: 8 }}>
          <div style={{ fontSize: 10.5, color: T.redText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Qoldirgan</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.redText, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{subject.absent}</div>
        </div>
        <div style={{ flex: 1, padding: 12, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Jami</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{subject.total}</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 16, marginBottom: 6 }}>
        Dars qaydlari ({subject.logs.length} ta)
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {['Sana', 'Vaqt', 'Holat', 'Sabab'].map((h, j) => (
                <th key={j} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subject.logs.map((log, j) => (
              <tr key={j} style={{ borderBottom: j < subject.logs.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <td style={{ padding: '8px 12px' }}>{fmtD(log.date)}</td>
                <td style={{ padding: '8px 12px', color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>{log.time}</td>
                <td style={{ padding: '8px 12px' }}>
                  {log.status === 'attended' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.emeraldText, fontWeight: 500 }}>
                      {Icons.check({ size: 13, stroke: T.emerald, strokeWidth: 2.5 })} Qatnashgan
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.redText, fontWeight: 500 }}>
                      {Icons.x({ size: 13, stroke: T.red, strokeWidth: 2.5 })} Qoldirgan
                    </span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', color: T.textMuted }}>
                  {log.reason ?? (log.status === 'attended' ? '—' : "Sabab ko'rsatilmagan")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dialog>
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
