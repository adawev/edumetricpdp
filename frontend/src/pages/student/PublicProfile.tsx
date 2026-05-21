import { useParams, useNavigate } from 'react-router-dom';
import { T } from '@/lib/theme';
import { Card, Avatar, Skeleton, Tooltip } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { ErrorState } from '@/components/em/ErrorState';
import { BadgeMedal, BADGE_RARITY_LABEL, type BadgeRarity } from '@/components/em/Badges';
import { useStudentPublic } from '@/hooks/useStudent';
import type { AchievementType, GrantStatus, PublicAchievement, StudentBadge } from '@/types/student';
import { useAuth } from '@/lib/auth';
import StudentLayout from '@/components/layout/StudentLayout';
import MentorLayout from '@/layouts/MentorLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

// ── constants ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<GrantStatus, { bg: string; fg: string; label: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, label: 'Grant berildi' },
  PENDING:     { bg: T.amberBg,   fg: T.amberText,   label: 'Kutilmoqda' },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText,     label: "Grant yo'q" },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted,   label: 'Aniqlanmagan' },
};

const TYPE_LABEL: Record<AchievementType, string> = {
  CERTIFICATE: 'Sertifikat', HACKATHON: 'Xakaton', STARTUP: 'Startap',
  EMPLOYMENT: 'Ish', MENTORING: 'Mentoring', LANGUAGE: 'Til',
  COURSE: 'Kurs', VOLUNTEER: 'Volontyorlik', OTHER: 'Boshqa',
};

const TYPE_ICON: Record<AchievementType, (p: any) => JSX.Element> = {
  CERTIFICATE: Icons.file, HACKATHON: Icons.flame, STARTUP: Icons.rocket,
  EMPLOYMENT: Icons.briefcase, MENTORING: Icons.users, LANGUAGE: Icons.globe,
  COURSE: Icons.files, VOLUNTEER: Icons.sparkles, OTHER: Icons.star,
};

const TYPE_COLOR: Record<AchievementType, string> = {
  CERTIFICATE: '#0891b2', HACKATHON: '#dc2626', STARTUP: '#ec4899',
  EMPLOYMENT: '#2563eb', MENTORING: '#7c3aed', LANGUAGE: '#06b6d4',
  COURSE: '#0d9488', VOLUNTEER: '#059669', OTHER: '#64748b',
};

const RARITY_COLOR: Record<BadgeRarity, string> = {
  legendary: '#a16207', epic: '#6d28d9', rare: '#1d4ed8', common: '#475569',
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  const m = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

// ── Sub-components ─────────────────────────────────────────────────────────

function AchievementCard({ a }: { a: PublicAchievement }) {
  const Icon = TYPE_ICON[a.type] ?? Icons.award;
  const color = TYPE_COLOR[a.type] ?? T.textMuted;
  const isImg = a.fileUrl && /\.(png|jpe?g|webp|gif)$/i.test(a.fileUrl);

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${T.border}`, background: T.white,
    }}>
      {/* Preview / icon block */}
      {isImg ? (
        <a href={a.fileUrl!} target="_blank" rel="noreferrer"
           style={{ width: 88, flexShrink: 0, background: T.bg, display: 'block' }}>
          <img src={a.fileUrl!} alt={a.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </a>
      ) : (
        <div style={{ width: 56, flexShrink: 0, background: color + '12',
          display: 'grid', placeItems: 'center', borderRight: `1px solid ${T.border}` }}>
          <Icon size={20} stroke={color} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
              background: color + '15', color, textTransform: 'uppercase', letterSpacing: '.05em',
            }}>{TYPE_LABEL[a.type]}</span>
            <span style={{ fontSize: 11.5, color: T.textSubtle }}>{fmtDate(a.createdAt)}</span>
            {a.fileUrl && !isImg && (
              <a href={a.fileUrl} target="_blank" rel="noreferrer"
                 style={{ fontSize: 11.5, color: T.blue, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {Icons.link({ size: 11, stroke: T.blue })} Fayl
              </a>
            )}
          </div>
          {a.description && (
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 5, lineHeight: 1.45,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {a.description}
            </div>
          )}
        </div>
        {a.ball > 0 && (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.emerald, lineHeight: 1 }}>+{a.ball}</div>
            <div style={{ fontSize: 10, color: T.textSubtle, marginTop: 2 }}>ball</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeTile({ b }: { b: StudentBadge }) {
  const rc = RARITY_COLOR[b.rarity as BadgeRarity];
  return (
    <Tooltip content={`${b.name} · ${BADGE_RARITY_LABEL[b.rarity as BadgeRarity]}${b.description ? ' — ' + b.description : ''}`}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10,
        border: `1px solid ${T.border}`, background: T.white,
        cursor: 'help', minWidth: 0,
      }}>
        <BadgeMedal badge={b as any} size={44} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: rc, marginTop: 3, letterSpacing: '.08em' }}>
            {BADGE_RARITY_LABEL[b.rarity as BadgeRarity].toUpperCase()}
          </div>
        </div>
      </div>
    </Tooltip>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function StudentPublicProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useStudentPublic(studentId ?? '');

  const Chrome: React.ComponentType<{ children: React.ReactNode }> =
    user?.role === 'MENTOR' ? MentorLayout
    : user?.role === 'ADMIN' ? AdminLayout
    : StudentLayout;

  if (isLoading) return <Chrome><PublicProfileSkeleton /></Chrome>;
  if (isError) return (
    <Chrome>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BackButton onClick={() => navigate(-1)} />
        <ErrorState onRetry={refetch} />
      </div>
    </Chrome>
  );
  if (!data) return null;

  const sc = STATUS_CFG[data.grantStatus];

  return (
    <Chrome>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
      <BackButton onClick={() => navigate(-1)} />

      {/* Identity card with banner */}
      <Card padding={0} style={{ overflow: 'hidden' }}>
        {/* Banner */}
        <div style={{ height: 80, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px' }} />
          <div style={{ position: 'absolute', top: 14, right: 18 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: sc.bg, color: sc.fg,
            }}>{sc.label}</span>
          </div>
        </div>

        <div style={{ padding: '0 28px 22px' }}>
          <Avatar name={data.fullName} size={84}
            style={{ border: `4px solid ${T.white}`, fontSize: 28, marginTop: -42,
              boxShadow: '0 4px 12px rgba(15,23,42,.08)', position: 'relative', zIndex: 2 }} />
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', color: T.text }}>
                {data.fullName}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <InfoTag icon={Icons.users} label="Guruh" value={data.group} />
                <InfoTag icon={Icons.cal} label="Kurs" value={`${data.course}-kurs`} />
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 10 }}>
              <StatTile label="Ball" value={String(data.grantScore)} accent={T.text} />
              <StatTile label="Reyting" value={`#${data.rank.university}`}
                sub={`/ ${data.rank.total}`} accent={T.blue} />
              <StatTile label="Badge" value={String(data.badges.length)} accent="#7c3aed" />
            </div>
          </div>
        </div>
      </Card>

      {/* Badges */}
      {data.badges.length > 0 && (
        <Card padding={0}>
          <SectionHeader title="Badge'lar" sub={`${data.badges.length} ta tasdiqlangan`} />
          <div style={{ padding: 14, display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {data.badges.map(b => <BadgeTile key={b.slug} b={b} />)}
          </div>
        </Card>
      )}

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <Card padding={0}>
          <SectionHeader title="Tasdiqlangan yutuqlar" sub={`${data.achievements.length} ta`} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.achievements.map(a => <AchievementCard key={a.id} a={a} />)}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {data.achievements.length === 0 && data.badges.length === 0 && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 12, background: T.white,
        }}>
          {Icons.award({ size: 36, stroke: T.border })}
          <div style={{ fontSize: 14, color: T.textMuted, marginTop: 10 }}>
            Hali tasdiqlangan yutuq yoki badge yo'q
          </div>
        </div>
      )}
    </div>
    </Chrome>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 13, color: T.textMuted, background: 'none', border: 0,
      cursor: 'pointer', padding: 0, fontFamily: 'inherit', alignSelf: 'flex-start',
    }}
    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
    onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
    >
      {Icons.arrowRight({ size: 14, stroke: 'currentColor', style: { transform: 'rotate(180deg)' } })}
      Orqaga
    </button>
  );
}

function InfoTag({ icon, label, value }: { icon: (p: any) => JSX.Element; label: string; value: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: T.bg, borderRadius: 7, fontSize: 12.5, color: T.text, border: `1px solid ${T.border}` }}>
      {icon({ size: 12, stroke: T.textMuted })}
      <span style={{ color: T.textMuted }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StatTile({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, background: T.white,
      border: `1px solid ${T.border}`, minWidth: 76, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent ?? T.text,
        letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: T.textSubtle, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
      <Skeleton h={20} w={80} r={6} />
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <Skeleton h={80} r={0} style={{ width: '100%' }} />
        <div style={{ padding: '16px 28px 22px' }}>
          <Skeleton h={84} w={84} r={999} style={{ marginTop: -42 }} />
          <Skeleton h={24} w={260} r={8} style={{ marginTop: 14 }} />
          <Skeleton h={16} w={380} r={6} style={{ marginTop: 10 }} />
        </div>
      </div>
      <Skeleton h={160} r={12} />
      <Skeleton h={200} r={12} />
    </div>
  );
}
