import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '@/lib/theme';
import { Card, Avatar, Skeleton, Tabs } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { ErrorState } from '@/components/em/ErrorState';
import { useStudentMe, useStudentRankings, usePublicRating } from '@/hooks/useStudent';
import type { GrantStatus, PublicRatingRow } from '@/types/student';

// ── constants ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<GrantStatus, { bg: string; fg: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText },
  PENDING:     { bg: T.amberBg,   fg: T.amberText },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted },
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q",  UNKNOWN: 'Aniqlanmagan',
};

// ── RankCard ──────────────────────────────────────────────────────────────

function RankCard({ label, rank, total, accent, icon, sub }: {
  label: string; rank: number; total: number;
  accent: string; icon: (p: any) => JSX.Element; sub?: string;
}) {
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.bgSubtle, display: 'grid', placeItems: 'center' }}>
          {icon({ size: 14, stroke: accent })}
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.035em', color: accent,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>#{rank}</span>
        <span style={{ fontSize: 13, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>/ {total} talaba</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11.5, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ padding: '2px 6px', background: T.bgSubtle, borderRadius: 4, fontWeight: 500, color: T.text }}>siz</span>
        {sub}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function StudentRating() {
  const { data: me, isLoading: meLoading, isError: meError, refetch: meRefetch } = useStudentMe();
  const { data: rankings, isLoading: rankLoading } = useStudentRankings();
  const { data: allStudents } = usePublicRating();
  const navigate = useNavigate();
  const [tab, setTab] = useState('uni');

  const groupRows = useMemo(() => {
    if (!allStudents || !me) return [];
    return allStudents.filter(s => s.group === me.student.group.name);
  }, [allStudents, me]);

  const courseDirection = me?.student.group.name.split('-')[0] ?? '';
  const courseRows = useMemo(() => {
    if (!allStudents || !courseDirection) return [];
    return allStudents.filter(s => s.group.startsWith(courseDirection + '-'));
  }, [allStudents, courseDirection]);

  const tabConfig = useMemo(() => [
    { id: 'group',  label: 'Guruhim',      rows: groupRows,   title: 'Guruh',            sub: me?.student.group.name ?? '' },
    { id: 'course', label: 'Kursim',       rows: courseRows,  title: `${courseDirection} yo’nalishi`, sub: `${courseRows.length} ta talaba` },
    { id: 'uni',    label: 'Universitet',  rows: allStudents ?? [], title: 'PDP University', sub: 'barcha talabalar' },
  ], [groupRows, courseRows, allStudents, me, courseDirection]);

  const activeTab = tabConfig.find(t => t.id === tab) ?? tabConfig[2];
  const activeRows: PublicRatingRow[] = activeTab.rows;

  const isLoading = meLoading || rankLoading;

  if (isLoading) return <RatingSkeleton />;
  if (meError) return <ErrorState onRetry={meRefetch} />;
  if (!me || !rankings) return null;

  const myId = me.student.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
          Mening reytingim
        </h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
          Sinfingiz, kursingiz va universitet bo&apos;yicha o&apos;rningiz
        </p>
      </div>

      {/* Rank KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <RankCard label="Guruh ichida"  rank={rankings.group.rank}      total={rankings.group.total}
          accent={T.blue}     icon={Icons.users}     sub={rankings.group.name ?? me.student.group.name} />
        <RankCard label="Kursda"         rank={rankings.course.rank}     total={rankings.course.total}
          accent="#7c3aed"   icon={Icons.graduation} sub={`${courseDirection} yo'nalishi`} />
        <RankCard label="Universitetda" rank={rankings.university.rank} total={rankings.university.total}
          accent={T.slate900} icon={Icons.trophy}    sub="412 ta talaba" />
      </div>

      {/* Table card */}
      <Card padding={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{activeTab.title}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              {activeTab.sub} · ball bo'yicha tartiblangan
            </div>
          </div>
          <Tabs value={tab} onChange={setTab}
            items={tabConfig.map(t => ({ id: t.id, label: t.label, count: t.rows.length }))} />
        </div>

        {activeRows.length === 0 ? (
          <div style={{ padding: '40px 18px', textAlign: 'center', color: T.textSubtle, fontSize: 13 }}>
            Ma'lumot yuklanmoqda...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {[
                  { l: '#',      a: 'center', w: 56 },
                  { l: 'Talaba', a: 'left' },
                  { l: 'Guruh',  a: 'left',   w: 110 },
                  { l: 'Ball',   a: 'right',  w: 80 },
                  { l: 'Status', a: 'left',   w: 160 },
                ].map((h, i) => (
                  <th key={i} style={{ textAlign: h.a as any, padding: '11px 16px', fontSize: 11.5, fontWeight: 600,
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', width: h.w }}>
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((stu, i) => {
                const isMe = stu.id === myId;
                const sc = STATUS_COLORS[stu.grantStatus];
                return (
                  <tr key={stu.id}
                    onClick={() => navigate(`/student/${stu.id}`)}
                    style={{
                      borderBottom: i < activeRows.length - 1 ? `1px solid ${T.border}` : 'none',
                      background: isMe ? T.bgSubtle : 'transparent',
                      cursor: 'pointer', transition: 'background .12s', position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLTableRowElement).style.background = T.bg; }}
                    onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: isMe ? T.text : T.textMuted,
                      fontVariantNumeric: 'tabular-nums', fontWeight: isMe ? 700 : 500, position: 'relative' }}>
                      {isMe && (
                        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: T.slate900 }} />
                      )}
                      {stu.rank}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={stu.fullName} size={30} />
                        <span style={{ fontWeight: isMe ? 600 : 500 }}>{stu.fullName}</span>
                        {isMe && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999,
                            background: T.slate900, color: '#fff', fontWeight: 500 }}>Sen</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: T.textMuted }}>{stu.group}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{stu.grantScore}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 999,
                        background: sc.bg, color: sc.fg, fontWeight: 500 }}>
                        {STATUS_LABEL[stu.grantStatus]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function RatingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><Skeleton h={28} w={200} r={8} /><Skeleton h={16} w={260} r={6} style={{ marginTop: 8 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} h={110} r={12} />)}
      </div>
      <Skeleton h={400} r={12} />
    </div>
  );
}
