import { useParams, useNavigate } from 'react-router-dom';
import { T } from '@/lib/theme';
import { Card, Avatar, Button, Skeleton } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { ErrorState } from '@/components/em/ErrorState';
import { BadgeMedal, BADGE_RARITY_LABEL } from '@/components/em/Badges';
import { useStudentPublic } from '@/hooks/useStudent';
import type { GrantStatus, PublicAchievement, StudentBadge } from '@/types/student';

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<GrantStatus, { bg: string; fg: string; border: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, border: T.emerald },
  PENDING:     { bg: T.amberBg,   fg: T.amberText,   border: T.amber },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText,     border: T.red },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted,   border: T.border },
};

const STATUS_LABEL: Record<GrantStatus, string> = {
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q", UNKNOWN: 'Aniqlanmagan',
};

const ACH_TYPE_LABEL: Record<string, string> = {
  CERTIFICATE: 'Sertifikat', HACKATHON: 'Xakaton', STARTUP: 'Startap',
  EMPLOYMENT: 'Ish', MENTORING: 'Mentoring', LANGUAGE: 'Til',
  COURSE: 'Kurs', VOLUNTEER: 'Volontyorlik', OTHER: 'Boshqa',
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

// ── Achievement card ───────────────────────────────────────────────────────

function AchievementItem({ a }: { a: PublicAchievement }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 8,
      background: T.bgSubtle, border: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, background: T.white,
        display: 'grid', placeItems: 'center', flexShrink: 0,
        border: `1px solid ${T.border}`,
      }}>
        {Icons.award({ size: 16, stroke: T.textMuted })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: T.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.title}
        </div>
        <div style={{ fontSize: 12, color: T.textSubtle, marginTop: 2 }}>
          {ACH_TYPE_LABEL[a.type] ?? a.type} · {fmtDate(a.createdAt)}
        </div>
      </div>
      {a.ball > 0 && (
        <span style={{ fontSize: 13, fontWeight: 700, color: T.emerald, flexShrink: 0 }}>
          +{a.ball}
        </span>
      )}
    </div>
  );
}

// ── Badge section ──────────────────────────────────────────────────────────

function BadgeSection({ badges }: { badges: StudentBadge[] }) {
  if (!badges.length) return null;
  return (
    <Card padding={20}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>
        Badge'lar ({badges.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {badges.map(b => (
          <div key={b.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64 }}>
            <BadgeMedal badge={b as any} size={52} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{b.name}</div>
              <div style={{ fontSize: 9.5, color: T.textSubtle, marginTop: 2 }}>
                {BADGE_RARITY_LABEL[b.rarity] ?? b.rarity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function StudentPublicProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useStudentPublic(studentId ?? '');

  if (isLoading) return <PublicProfileSkeleton />;
  if (isError) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Button variant="ghost" size="sm" icon={Icons.arrowRight({ size: 14, stroke: T.textMuted, style: { transform: 'rotate(180deg)' } })}
        onClick={() => navigate(-1)}>
        Orqaga
      </Button>
      <ErrorState onRetry={refetch} />
    </div>
  );
  if (!data) return null;

  const sc = STATUS_COLORS[data.grantStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: T.textMuted, background: 'none', border: 0,
        cursor: 'pointer', padding: 0, fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = T.text)}
      onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
      >
        {Icons.arrowRight({ size: 14, stroke: 'currentColor', style: { transform: 'rotate(180deg)' } })}
        Orqaga
      </button>

      {/* Identity card */}
      <Card padding={24}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar name={data.fullName} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
              {data.fullName}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.textMuted }}>
                {Icons.graduation({ size: 13, stroke: T.textMuted })}
                {data.group} · {data.course}-kurs
              </span>
            </div>
            {/* Grant status inline */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '5px 12px', borderRadius: 999,
              background: sc.bg, border: `1px solid ${sc.border}`,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: sc.fg }}>
                {STATUS_LABEL[data.grantStatus]}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 0, marginTop: 20, paddingTop: 20,
          borderTop: `1px solid ${T.border}`,
        }}>
          <StatCell label="Grant ball" value={`${data.grantScore}`} accent={T.text} border />
          <StatCell label="Universitetda" value={`#${data.rank.university}`}
            sub={`/ ${data.rank.total} talaba`} border />
          <StatCell label="Davomat bonusi" value="—" />
        </div>
      </Card>

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <Card padding={20}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>
            Tasdiqlangan yutuqlar ({data.achievements.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.achievements.map(a => (
              <AchievementItem key={a.id} a={a} />
            ))}
          </div>
        </Card>
      )}

      {/* Badges */}
      <BadgeSection badges={data.badges} />

      {/* Empty state for both */}
      {data.achievements.length === 0 && data.badges.length === 0 && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, color: T.textMuted }}>
            Hali tasdiqlangan yutuq yoki badge yo'q
          </div>
        </div>
      )}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function StatCell({ label, value, sub, accent, border }: {
  label: string; value: string; sub?: string; accent?: string; border?: boolean;
}) {
  return (
    <div style={{
      flex: 1, paddingRight: border ? 20 : 0, marginRight: border ? 20 : 0,
      borderRight: border ? `1px solid ${T.border}` : 'none',
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textTransform: 'uppercase',
        letterSpacing: '.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? T.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.textSubtle, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <Skeleton h={20} w={80} r={6} />
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton h={64} w={64} r={999} />
          <div style={{ flex: 1 }}>
            <Skeleton h={24} w={220} r={6} />
            <Skeleton h={16} w={180} r={4} style={{ marginTop: 10 }} />
            <Skeleton h={28} w={140} r={999} style={{ marginTop: 12 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ flex: 1 }}>
              <Skeleton h={12} w={60} r={4} />
              <Skeleton h={22} w={50} r={4} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
      <Skeleton h={160} r={12} />
    </div>
  );
}
