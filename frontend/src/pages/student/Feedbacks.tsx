import { useMemo, useState } from 'react';
import { T } from '@/lib/theme';
import { Card, Avatar, Select, Skeleton } from '@/components/em/Primitives';
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

function Stars({ score, size = 16 }: { score: number; size?: number }) {
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

function avgScore(feedbacks: Feedback[]): number {
  if (!feedbacks.length) return 0;
  return feedbacks.reduce((s, f) => s + f.score, 0) / feedbacks.length;
}

type Period = 'all' | 'month' | 'semester';

function filterByPeriod(feedbacks: Feedback[], period: Period): Feedback[] {
  if (period === 'all') return feedbacks;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
  if (period === 'semester') cutoff.setMonth(now.getMonth() - 6);
  return feedbacks.filter(f => new Date(f.createdAt) >= cutoff);
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function StudentFeedbacks() {
  const { data: feedbacks, isLoading, isError, refetch } = useFeedbacks();
  const [period, setPeriod] = useState<Period>('all');

  const filtered = useMemo(
    () => filterByPeriod(feedbacks ?? [], period),
    [feedbacks, period]
  );

  const avg = useMemo(() => avgScore(filtered), [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
            Mentor Feedbacklari
          </h1>
          <p style={{ fontSize: 13.5, color: T.textMuted, marginTop: 4 }}>
            Mentorlaringiz sizga qoldirgan izohlar
          </p>
        </div>
        <div style={{ width: 180 }}>
          <Select
            value={period}
            onChange={v => setPeriod(v as Period)}
            options={[
              { value: 'all',      label: 'Hammasi' },
              { value: 'month',    label: 'Oxirgi oy' },
              { value: 'semester', label: 'Oxirgi semestr' },
            ]}
          />
        </div>
      </div>

      {/* Summary card */}
      {!isLoading && filtered.length > 0 && (
        <Card padding={20}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                O'rtacha baho
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {avg.toFixed(1)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Stars score={Math.round(avg)} size={14} />
                  <span style={{ fontSize: 11.5, color: T.textMuted }}>{filtered.length} ta feedback</span>
                </div>
              </div>
            </div>

            {/* Score distribution mini bars */}
            <div style={{ flex: 1, minWidth: 180 }}>
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
        </Card>
      )}

      {/* Feedback list */}
      {isLoading ? (
        <FeedbacksSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState period={period} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(f => (
            <FeedbackCard key={f.id} feedback={f} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── FeedbackCard ───────────────────────────────────────────────────────────

function FeedbackCard({ feedback: f }: { feedback: Feedback }) {
  return (
    <Card padding={20} hoverable>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Avatar name={f.mentor.fullName} size={40} color="#ddd6fe" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{f.mentor.fullName}</div>
              <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 1 }}>{fmtDate(f.createdAt)}</div>
            </div>
            <Stars score={f.score} size={15} />
          </div>
          {f.text && (
            <p style={{
              margin: '10px 0 0', fontSize: 13.5, color: T.textMuted,
              lineHeight: 1.65, background: T.bgSubtle,
              padding: '10px 12px', borderRadius: 8,
            }}>
              "{f.text}"
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── sub components ─────────────────────────────────────────────────────────

function EmptyState({ period }: { period: Period }) {
  const msg: Record<Period, string> = {
    all:      "Mentor hali feedback yozmagan",
    month:    "Bu oyda feedback yo'q",
    semester: "Bu semestrda feedback yo'q",
  };
  return (
    <div style={{
      padding: '60px 24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 12, textAlign: 'center',
    }}>
      {Icons.fileText({ size: 48, stroke: T.border })}
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{msg[period]}</div>
      <div style={{ fontSize: 13.5, color: T.textMuted, maxWidth: 320, lineHeight: 1.6 }}>
        Mentor feedback yozganda bu yerda ko'rinadi
      </div>
    </div>
  );
}

function FeedbacksSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <Skeleton h={40} w={40} r={999} />
            <div style={{ flex: 1 }}>
              <Skeleton h={16} w={140} r={6} />
              <Skeleton h={12} w={90} r={4} style={{ marginTop: 6 }} />
              <Skeleton h={60} r={8} style={{ marginTop: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
