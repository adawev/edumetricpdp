import { useMemo, useState } from 'react';
import { T } from '@/lib/theme';
import { Card, Avatar, Skeleton, Tabs, Pagination, usePagination } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useFeedbacks } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { Feedback } from '@/types/student';

// ── helpers ────────────────────────────────────────────────────────────────

const fmtDate = (s: string) => {
  const d = new Date(s);
  const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

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

function Stars({ score, size = 15 }: { score: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}>
          {Icons.star({
            size,
            stroke: i <= score ? '#f59e0b' : T.border,
            fill: i <= score ? '#fbbf24' : 'none',
          })}
        </span>
      ))}
    </div>
  );
}

type Period = 'all' | 'month' | 'semester';

function filterByPeriod(feedbacks: Feedback[], period: Period): Feedback[] {
  if (period === 'all') return feedbacks;
  const cutoff = new Date();
  if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
  if (period === 'semester') cutoff.setMonth(cutoff.getMonth() - 6);
  return feedbacks.filter(f => new Date(f.createdAt) >= cutoff);
}

// ── KpiCard ───────────────────────────────────────────────────────────────

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

// ── Main ───────────────────────────────────────────────────────────────────

export default function StudentFeedbacks() {
  const { data: feedbacks, isLoading, isError, refetch } = useFeedbacks();
  const [period, setPeriod] = useState<Period>('all');

  const filtered = useMemo(() => filterByPeriod(feedbacks ?? [], period), [feedbacks, period]);
  const avg = useMemo(() => filtered.length ? filtered.reduce((s, f) => s + f.score, 0) / filtered.length : 0, [filtered]);
  const lastFeedback = feedbacks?.[0];

  const pag = usePagination(filtered, 10, [period, filtered.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
          Mentor feedback&apos;lari
        </h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
          Tyutoringizdan kelgan baholar va izohlar
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <KpiCard label="Jami feedback"  value={feedbacks?.length ?? 0}
          icon={Icons.message} />
        <KpiCard label="O'rtacha baho"  value={avg.toFixed(1)}  sub="/ 5"
          accent={T.amberDeep} icon={Icons.star} />
        <KpiCard label="So'nggi"
          value={lastFeedback ? fmtRelative(lastFeedback.createdAt) : '—'}
          icon={Icons.clock} />
      </div>

      {/* List */}
      <Card padding={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs
            value={period}
            onChange={v => setPeriod(v as Period)}
            items={[
              { id: 'all',      label: 'Hammasi' },
              { id: 'semester', label: 'Bu semestr' },
              { id: 'month',    label: 'Oxirgi oy' },
            ]}
          />
        </div>

        {isLoading ? (
          <FeedbacksSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState period={period} />
        ) : (
          <>
            {/* Rating summary bar */}
            <div style={{ padding: '14px 18px 0', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  O'rtacha baho
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {avg.toFixed(1)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Stars score={Math.round(avg)} size={13} />
                    <span style={{ fontSize: 11.5, color: T.textMuted }}>{filtered.length} ta feedback</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180, paddingBottom: 14 }}>
                {[5, 4, 3, 2, 1].map(s => {
                  const cnt = filtered.filter(f => f.score === s).length;
                  const pct = filtered.length ? (cnt / filtered.length) * 100 : 0;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, color: T.textMuted, width: 14, textAlign: 'right' }}>{s}</span>
                      {Icons.star({ size: 11, stroke: '#f59e0b', fill: '#fbbf24' })}
                      <div style={{ flex: 1, height: 5, background: T.bgSubtle, borderRadius: 999 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#fbbf24', borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, color: T.textSubtle, width: 16, textAlign: 'right' }}>{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {pag.pageItems.map((f, i) => (
                <div key={f.id} style={{ padding: '16px 18px',
                  borderBottom: i < pag.pageItems.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Avatar name={f.mentor.fullName} size={36} color="#bfdbfe" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.mentor.fullName}</div>
                      <div style={{ fontSize: 11.5, color: T.textMuted }}>
                        {fmtDate(f.createdAt)} · {fmtRelative(f.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stars score={f.score} size={15} />
                      <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                        {f.score}/5
                      </span>
                    </div>
                  </div>
                  {f.text && (
                    <p style={{ margin: '4px 0 0 48px', fontSize: 13.5, lineHeight: 1.65, color: T.text }}>
                      {f.text}
                    </p>
                  )}
                </div>
              ))}
              <Pagination page={pag.page} pageCount={pag.pageCount} onChange={pag.setPage}
                total={pag.total} pageSize={pag.pageSize}
                style={{ borderTop: 0, padding: '4px 0 0', background: 'transparent' }} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function EmptyState({ period }: { period: Period }) {
  const msg: Record<Period, string> = {
    all:      'Mentor hali feedback yozmagan',
    month:    "Bu oyda feedback yo'q",
    semester: "Bu semestrda feedback yo'q",
  };
  return (
    <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
      {Icons.message({ size: 48, stroke: T.border })}
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{msg[period]}</div>
      <div style={{ fontSize: 13.5, color: T.textMuted, maxWidth: 320, lineHeight: 1.6 }}>
        Mentor feedback yozganda bu yerda ko'rinadi
      </div>
    </div>
  );
}

function FeedbacksSkeleton() {
  return (
    <div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ padding: 18, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton h={36} w={36} r={999} />
            <div style={{ flex: 1 }}>
              <Skeleton h={16} w={140} r={6} />
              <Skeleton h={12} w={100} r={4} style={{ marginTop: 6 }} />
              <Skeleton h={56} r={8} style={{ marginTop: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
