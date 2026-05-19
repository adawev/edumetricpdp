import { T } from '@/lib/theme';
import { Card, Avatar, Skeleton } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useStudentMe } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { GrantStatus } from '@/types/student';

const STATUS_LABEL: Record<GrantStatus, string> = {
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q", UNKNOWN: 'Aniqlanmagan',
};

const STATUS_COLORS: Record<GrantStatus, { bg: string; fg: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText },
  PENDING:     { bg: T.amberBg,   fg: T.amberText },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted },
};

const CRITERIA = [
  { key: 'academic',   label: 'Akademik (GPA)',   max: 40, color: '#3b82f6' },
  { key: 'attendance', label: 'Davomat',           max: 20, color: '#10b981' },
  { key: 'projects',   label: 'Loyihalar',         max: 15, color: '#8b5cf6' },
  { key: 'activity',   label: 'Faollik',           max: 10, color: '#f59e0b' },
  { key: 'tutor',      label: 'Tyutor bahosi',     max: 5,  color: '#ec4899' },
  { key: 'discipline', label: 'Intizom',           max: 10, color: '#64748b' },
];

const PENALTY_TYPE_LABEL: Record<string, string> = {
  LIGHT: 'Engil', MEDIUM: "O'rta", HEAVY: "Og'ir",
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 6, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s ease' }} />
    </div>
  );
}

export default function StudentProfile() {
  const { data, isLoading, isError, refetch } = useStudentMe();

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  const { student, breakdown } = data;
  const sc = STATUS_COLORS[student.grantStatus];
  const penaltyTotal = student.penalties.reduce((s, p) => s + p.ball, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
        Profilim
      </h1>

      {/* Identity card */}
      <Card padding={24}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar name={student.fullName} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
              {student.fullName}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              <InfoChip icon={Icons.graduation} text={`${student.group.name} · ${student.group.course}-kurs`} />
              {student.group.mentor && (
                <InfoChip icon={Icons.user} text={`Mentor: ${student.group.mentor.fullName}`} />
              )}
            </div>
          </div>
          {/* Grant status badge */}
          <div style={{
            padding: '6px 14px', borderRadius: 999,
            background: sc.bg, color: sc.fg, fontSize: 13, fontWeight: 600,
            flexShrink: 0,
          }}>
            {STATUS_LABEL[student.grantStatus]}
          </div>
        </div>

        {/* Summary row */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 20, paddingTop: 20,
          borderTop: `1px solid ${T.border}`, flexWrap: 'wrap',
        }}>
          <SummaryItem label="Grant ball" value={`${breakdown.total.toFixed(1)} / 100`} />
          <SummaryItem label="GPA" value={`${student.gpa.toFixed(1)}%`} accent={student.gpa < 80 ? T.red : T.emerald} />
          <SummaryItem label="Davomat" value={`${student.attendance.toFixed(1)}%`} />
          <SummaryItem label="Ish bonusi" value={student.employmentBonus > 0 ? `+${student.employmentBonus}` : '—'} />
        </div>
      </Card>

      {/* Score breakdown */}
      <Card padding={24}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 18 }}>
          Ko'rsatkichlar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CRITERIA.map(c => {
            const val = (breakdown as any)[c.key] ?? 0;
            const pct = Math.round((val / c.max) * 100);
            return (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, color: T.text }}>{c.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {val.toFixed(1)}
                    <span style={{ color: T.textSubtle, fontWeight: 400 }}> / {c.max}</span>
                    <span style={{ color: T.textSubtle, fontSize: 11.5, marginLeft: 6 }}>({pct}%)</span>
                  </span>
                </div>
                <ProgressBar value={val} max={c.max} color={c.color} />
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>Asosiy ball</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{breakdown.base.toFixed(1)} / 100</span>
        </div>
      </Card>

      {/* Penalty / Recovery / Employment */}
      {(penaltyTotal > 0 || student.employmentBonus > 0) && (
        <Card padding={24}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 18 }}>
            Jarima va bonuslar
          </div>

          {student.penalties.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                Jarimalar
              </div>
              {student.penalties.map(p => (
                <div key={p.id} style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: T.redBg, border: `1px solid #fecaca`,
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.redText }}>
                        {PENALTY_TYPE_LABEL[p.type] ?? p.type} jarima
                      </span>
                      <p style={{ margin: '3px 0 0', fontSize: 12.5, color: T.textMuted }}>{p.reason}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>−{p.ball}</span>
                      {p.recovered > 0 && (
                        <span style={{ fontSize: 11.5, color: T.emeraldText }}>+{p.recovered} qaytarildi</span>
                      )}
                    </div>
                  </div>
                  {p.recoveryTask && (
                    <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted }}>
                      Vazifa: {p.recoveryTask}
                      {p.recoveryDone && (
                        <span style={{ marginLeft: 8, color: T.emeraldText, fontWeight: 500 }}>✓ Bajarildi</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ fontSize: 13, color: T.text, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Jami jarima:</span>
                <span style={{ fontWeight: 600, color: T.red }}>−{breakdown.penaltyDeducted.toFixed(1)}</span>
              </div>
              {breakdown.recoveryAdded > 0 && (
                <div style={{ fontSize: 13, color: T.text, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Reabilitatsiya qaytarildi:</span>
                  <span style={{ fontWeight: 600, color: T.emerald }}>+{breakdown.recoveryAdded.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {student.employmentBonus > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: T.blueBg, border: `1px solid #bfdbfe`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {Icons.briefcase({ size: 16, stroke: T.blue })}
                <span style={{ fontSize: 13, fontWeight: 500, color: T.blueText }}>Ish bonusi</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.blue }}>+{student.employmentBonus}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function InfoChip({ icon, text }: { icon: (p: any) => JSX.Element; text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: T.textMuted }}>
      {icon({ size: 13, stroke: T.textMuted })}
      {text}
    </span>
  );
}

function SummaryItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: accent ?? T.text }}>{value}</div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <Skeleton h={28} w={120} r={8} />
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Skeleton h={60} w={60} r={999} />
          <div style={{ flex: 1 }}>
            <Skeleton h={22} w={200} r={6} />
            <Skeleton h={14} w={280} r={4} style={{ marginTop: 10 }} />
          </div>
        </div>
      </div>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ marginBottom: 18 }}>
            <Skeleton h={14} r={4} style={{ marginBottom: 8 }} />
            <Skeleton h={6} r={999} />
          </div>
        ))}
      </div>
    </div>
  );
}
