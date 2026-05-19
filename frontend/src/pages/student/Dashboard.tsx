import { useMemo } from 'react';
import {
  RadialBarChart, RadialBar, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { T, GRANT_REASON_LABEL_SHORT } from '@/lib/theme';
import { Card, Skeleton } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useStudentMe, useStudentRankings } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { GrantStatus } from '@/types/student';

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<GrantStatus, { bg: string; fg: string; border: string }> = {
  GRANTED:     { bg: T.emeraldBg,  fg: T.emeraldText, border: T.emerald },
  PENDING:     { bg: T.amberBg,    fg: T.amberText,   border: T.amber },
  NOT_GRANTED: { bg: T.redBg,      fg: T.redText,     border: T.red },
  UNKNOWN:     { bg: T.bgSubtle,   fg: T.textMuted,   border: T.border },
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  GRANTED:     'Grant berildi',
  PENDING:     'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q",
  UNKNOWN:     'Aniqlanmagan',
};

const STATUS_ICON: Record<GrantStatus, (p: any) => JSX.Element> = {
  GRANTED:     Icons.checkCircle,
  PENDING:     Icons.clock,
  NOT_GRANTED: Icons.alert,
  UNKNOWN:     Icons.refresh,
};

// Stable pseudo-random using lcg seeded by total score (no Math.random — no flicker on re-render)
function buildGrowthData(total: number) {
  const now = new Date();
  const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  const DELTAS = [0.31, 0.67, 0.19, 0.53, 0.42]; // stable offsets, multiplied by score context
  const points: { month: string; ball: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const delta = i === 0 ? 0 : -(i * (2 + DELTAS[5 - i - 1] * 3));
    points.push({
      month: months[d.getMonth()],
      ball: Math.max(0, Math.round((total + delta) * 10) / 10),
    });
  }
  return points;
}

// ── Score Donut ────────────────────────────────────────────────────────────

const DONUT_ITEMS = [
  { key: 'academic',    label: 'Akademik',    max: 40, color: '#3b82f6' },
  { key: 'attendance',  label: 'Davomat',     max: 20, color: '#10b981' },
  { key: 'projects',    label: 'Loyihalar',   max: 15, color: '#8b5cf6' },
  { key: 'activity',    label: 'Faollik',     max: 10, color: '#f59e0b' },
  { key: 'tutor',       label: 'Tyutor',      max: 5,  color: '#ec4899' },
  { key: 'discipline',  label: 'Intizom',     max: 10, color: '#64748b' },
];

// ── Main component ─────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { data, isLoading, isError, refetch } = useStudentMe();
  const { data: rankings } = useStudentRankings();

  const donutData = useMemo(() => {
    if (!data) return [];
    const bd = data.breakdown;
    return DONUT_ITEMS.map(item => ({
      ...item,
      value: (bd as any)[item.key] ?? 0,
    }));
  }, [data]);

  const growthData = useMemo(() => {
    if (!data) return [];
    return buildGrowthData(data.breakdown.total);
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  const { student, breakdown } = data;
  const status = student.grantStatus;
  const sc = STATUS_COLOR[status];
  const StatusIcon = STATUS_ICON[status];

  const rankStr = rankings
    ? `#${rankings.university.rank} / ${rankings.university.total}`
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page title */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
          Salom, {student.fullName.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 13.5, color: T.textMuted, marginTop: 4 }}>
          {student.group.name} · {student.group.course}-kurs
          {student.group.mentor && ` · Mentor: ${student.group.mentor.fullName}`}
        </p>
      </div>

      {/* Grant status banner */}
      <div style={{
        padding: '14px 18px', borderRadius: 12, border: `1px solid ${sc.border}`,
        background: sc.bg, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <StatusIcon size={20} stroke={sc.fg} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, color: sc.fg, fontSize: 14 }}>
            {STATUS_LABEL[status]}
          </span>
          {student.grantReason && status !== 'GRANTED' && (
            <span style={{ fontSize: 13, color: sc.fg, opacity: 0.8, marginLeft: 10 }}>
              — {GRANT_REASON_LABEL_SHORT[student.grantReason] ?? student.grantReason}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: sc.fg,
          letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
        }}>
          {breakdown.total.toFixed(1)} ball
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard2
          label="Grant Ball"
          value={breakdown.total.toFixed(1)}
          sub="Maksimal: 100"
          icon={Icons.award}
          accent={status === 'GRANTED' ? T.emerald : status === 'NOT_GRANTED' ? T.red : T.amber}
        />
        <KpiCard2
          label="GPA"
          value={`${student.gpa.toFixed(1)}%`}
          sub={student.gpa >= 80 ? 'Shart bajarildi' : '< 80% — grant yo\'q'}
          icon={Icons.graduation}
          accent={student.gpa >= 80 ? T.emerald : T.red}
        />
        <KpiCard2
          label="Davomat"
          value={`${student.attendance.toFixed(1)}%`}
          sub={`${breakdown.attendance.toFixed(1)} / 20 ball`}
          icon={Icons.cal}
          accent={T.blue}
        />
        <KpiCard2
          label="Reyting"
          value={rankStr}
          sub={rankings ? `Guruh: #${rankings.group.rank}/${rankings.group.total}` : ''}
          icon={Icons.trophy}
          accent="#8b5cf6"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Donut breakdown */}
        <Card padding={20} style={{ flex: '0 0 320px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>
            Ball taqsimoti
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <ResponsiveContainer width={120} height={120}>
                <RadialBarChart
                  innerRadius={30} outerRadius={55}
                  data={donutData} startAngle={90} endAngle={-270}
                  cx="50%" cy="50%"
                >
                  <RadialBar dataKey="value" cornerRadius={3} background={{ fill: T.bgSubtle }}>
                    {donutData.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, lineHeight: 1 }}>
                  {breakdown.base.toFixed(0)}
                </div>
                <div style={{ fontSize: 9.5, color: T.textSubtle, marginTop: 2 }}>asosiy</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {donutData.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: T.textMuted, flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {item.value.toFixed(1)}<span style={{ color: T.textSubtle, fontWeight: 400 }}>/{item.max}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Penalties/bonuses row */}
          {(breakdown.penalty > 0 || breakdown.recovery > 0 || breakdown.employment > 0) && (
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`,
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              {breakdown.penalty > 0 && (
                <span style={{ fontSize: 11.5, color: T.redText, fontWeight: 500 }}>
                  Jarima: −{breakdown.penalty.toFixed(1)}
                </span>
              )}
              {breakdown.recovery > 0 && (
                <span style={{ fontSize: 11.5, color: T.emeraldText, fontWeight: 500 }}>
                  Reabilitatsiya: +{breakdown.recovery.toFixed(1)}
                </span>
              )}
              {breakdown.employment > 0 && (
                <span style={{ fontSize: 11.5, color: T.blueText, fontWeight: 500 }}>
                  Ish: +{breakdown.employment.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Line chart — growth */}
        <Card padding={20} style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>6 oylik dinamika</span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 999,
              background: T.amberBg, color: T.amberText, fontWeight: 500,
            }}>Demo</span>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>
            Haqiqiy tarix mavjud bo'lganda almashtiriladi
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={growthData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <ReTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                formatter={(v: number) => [`${v} ball`, 'Ball']}
              />
              <Line
                type="monotone" dataKey="ball" stroke={T.emerald} strokeWidth={2.5}
                dot={{ r: 3.5, fill: T.emerald, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: T.emerald }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ── KpiCard2 (inline icon render) ──────────────────────────────────────────

function KpiCard2({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: (p: any) => JSX.Element; accent: string;
}) {
  return (
    <Card padding={20} style={{ flex: '1 1 160px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
            {label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: accent + '18', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          {icon({ size: 17, stroke: accent })}
        </div>
      </div>
    </Card>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Skeleton h={28} w={200} r={8} />
        <Skeleton h={16} w={280} r={6} style={{ marginTop: 8 }} />
      </div>
      <Skeleton h={56} r={12} />
      <div style={{ display: 'flex', gap: 16 }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} h={100} r={12} style={{ flex: 1 }} />)}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <Skeleton h={240} w={320} r={12} />
        <Skeleton h={240} r={12} style={{ flex: 1 }} />
      </div>
    </div>
  );
}
