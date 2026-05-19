import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '@/lib/theme';
import { Card, Avatar, Skeleton } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { ErrorState } from '@/components/em/ErrorState';
import { BadgeRowMark } from '@/components/em/Badges';
import { useStudentMe, useStudentRankings, usePublicRating } from '@/hooks/useStudent';
import type { GrantStatus, PublicRatingRow } from '@/types/student';

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<GrantStatus, { bg: string; fg: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText },
  PENDING:     { bg: T.amberBg,   fg: T.amberText },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted },
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q", UNKNOWN: 'Aniqlanmagan',
};

// ── Rank card ──────────────────────────────────────────────────────────────

function RankCard({ label, rank, total, sub, icon, accent }: {
  label: string; rank: number; total: number; sub?: string;
  icon: (p: any) => JSX.Element; accent: string;
}) {
  const pct = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;
  return (
    <Card padding={20} style={{ flex: '1 1 180px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, marginBottom: 8,
            letterSpacing: '.04em', textTransform: 'uppercase' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
              #{rank}
            </span>
            <span style={{ fontSize: 13.5, color: T.textMuted }}>/ {total}</span>
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{sub}</div>
          )}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: accent + '15', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          {icon({ size: 18, stroke: accent })}
        </div>
      </div>
      {/* Progress bar — percentage rank */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: T.textSubtle }}>Yuqori {pct}%</span>
          <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', background: accent,
            borderRadius: 999, transition: 'width .5s ease',
          }} />
        </div>
      </div>
    </Card>
  );
}

// ── Nearby row ─────────────────────────────────────────────────────────────

function NearbyRow({ row, isMe }: { row: PublicRatingRow; isMe: boolean }) {
  const navigate = useNavigate();
  const sc = STATUS_COLORS[row.grantStatus];

  return (
    <div
      onClick={() => navigate(`/student/${row.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px', borderRadius: 10, cursor: 'pointer',
        background: isMe ? T.slate900 : T.white,
        border: `1px solid ${isMe ? T.slate900 : T.border}`,
        transition: 'border-color .12s, background .12s',
      }}
      onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLDivElement).style.borderColor = T.borderStrong; }}
      onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
    >
      {/* Rank */}
      <span style={{
        fontSize: 13, fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0,
        color: isMe ? 'rgba(255,255,255,.6)' : T.textSubtle,
        fontVariantNumeric: 'tabular-nums',
      }}>#{row.rank}</span>

      <Avatar name={row.fullName} size={30} color={isMe ? '#4b5563' : undefined} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: isMe ? 600 : 400,
          color: isMe ? '#fff' : T.text,
          display: 'flex', alignItems: 'center', gap: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {row.fullName}
          {isMe && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 999,
              background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)',
              fontWeight: 500,
            }}>SEN</span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: isMe ? 'rgba(255,255,255,.5)' : T.textSubtle, marginTop: 1 }}>
          {row.group}
        </div>
      </div>

      {/* Badge */}
      <BadgeRowMark badge={row.badge} count={row.badgeCount} size={22} />

      {/* Status */}
      <span style={{
        fontSize: 11, padding: '3px 8px', borderRadius: 999,
        background: isMe ? 'rgba(255,255,255,.12)' : sc.bg,
        color: isMe ? 'rgba(255,255,255,.85)' : sc.fg,
        fontWeight: 500, flexShrink: 0,
      }}>
        {STATUS_LABEL[row.grantStatus]}
      </span>

      {/* Score */}
      <span style={{
        fontSize: 14, fontWeight: 700,
        color: isMe ? '#fff' : T.text,
        fontVariantNumeric: 'tabular-nums', flexShrink: 0, width: 44, textAlign: 'right',
      }}>
        {row.grantScore}
      </span>

      {Icons.arrowRight({ size: 14, stroke: isMe ? 'rgba(255,255,255,.4)' : T.border })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function StudentRating() {
  const { data: me, isLoading: meLoading, isError: meError, refetch: meRefetch } = useStudentMe();
  const { data: rankings, isLoading: rankLoading } = useStudentRankings();
  const { data: allStudents } = usePublicRating();

  // Find surrounding 2 above + me + 2 below (by university rank)
  const nearbyRows = useMemo(() => {
    if (!me || !allStudents) return [];
    const myIdx = allStudents.findIndex(s => s.id === me.student.id);
    if (myIdx === -1) return allStudents.slice(0, 5);
    const start = Math.max(0, myIdx - 2);
    const end = Math.min(allStudents.length, myIdx + 3);
    return allStudents.slice(start, end);
  }, [me, allStudents]);

  const isLoading = meLoading || rankLoading;

  if (isLoading) return <RatingSkeleton />;
  if (meError) return <ErrorState onRetry={meRefetch} />;
  if (!me || !rankings) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
          Mening reytingim
        </h1>
        <p style={{ fontSize: 13.5, color: T.textMuted, marginTop: 4 }}>
          Ball: <strong>{me.breakdown.total.toFixed(1)}</strong> · {me.student.group.name}
        </p>
      </div>

      {/* Rank cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <RankCard
          label="Universitetda"
          rank={rankings.university.rank}
          total={rankings.university.total}
          sub="Barcha talabalar orasida"
          icon={Icons.graduation}
          accent={T.slate900}
        />
        <RankCard
          label="Kursda"
          rank={rankings.course.rank}
          total={rankings.course.total}
          sub={`${rankings.course.course ?? me.student.group.course}-kurs talabalari`}
          icon={Icons.cal}
          accent={T.blue}
        />
        <RankCard
          label="Guruhda"
          rank={rankings.group.rank}
          total={rankings.group.total}
          sub={rankings.group.name ?? me.student.group.name}
          icon={Icons.user}
          accent={T.emerald}
        />
      </div>

      {/* Nearby students */}
      {nearbyRows.length > 0 && (
        <Card padding={20}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
              Universitetdagi atrofdagilar
            </div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
              Sizning o'rningiz va yaqin talabalar — bosing va profilini ko'ring
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nearbyRows.map(row => (
              <NearbyRow key={row.id} row={row} isMe={row.id === me.student.id} />
            ))}
          </div>
          {allStudents && allStudents.length > 5 && (
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: T.textSubtle }}>
              Jami {allStudents.length} talaba ·{' '}
              <a href="/public/rating" style={{ color: T.blue, textDecoration: 'none' }}>
                To'liq reyting →
              </a>
            </div>
          )}
        </Card>
      )}

      {!allStudents && (
        <div style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: 20 }}>
          Atrofdagilar yuklanmoqda...
        </div>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function RatingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Skeleton h={28} w={200} r={8} />
        <Skeleton h={16} w={260} r={6} style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} h={130} r={12} style={{ flex: 1 }} />)}
      </div>
      <Skeleton h={280} r={12} />
    </div>
  );
}
