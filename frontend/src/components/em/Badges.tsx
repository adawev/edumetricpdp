import { T } from '@/lib/theme';
import { Card, Tooltip } from './Primitives';

export type BadgeDef = {
  slug: string;
  name: string;
  icon: string;
  category: 'compete' | 'academic' | 'activity' | 'aggregate';
  color: string;
  description: string;
  howToEarn: string;
};

export type EarnedBadge = BadgeDef & { earnedAt?: string };

export type BadgeMini = { slug: string; name: string; icon: string; color: string };

const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const BADGE_CATEGORY_LABEL: Record<string, string> = {
  compete: 'Musobaqa', academic: 'Akademik', activity: 'Faollik', aggregate: 'Jamlovchi',
};

// ===== Compact chips for rating table =====
export function BadgeChips({ badges, max = 3 }: { badges: BadgeMini[]; max?: number }) {
  if (!badges?.length) return null;
  const visible = badges.slice(0, max);
  const rest = badges.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 8 }}>
      {visible.map(b => (
        <Tooltip key={b.slug} content={b.name}>
          <span style={{ fontSize: 14, lineHeight: 1, cursor: 'help' }}>{b.icon}</span>
        </Tooltip>
      ))}
      {rest > 0 && (
        <Tooltip content={badges.slice(max).map(b => b.name).join(', ')}>
          <span style={{
            fontSize: 10.5, fontWeight: 600, color: T.textMuted,
            padding: '1px 5px', background: T.bgSubtle, borderRadius: 999,
            cursor: 'help', minWidth: 22, textAlign: 'center',
          }}>+{rest}</span>
        </Tooltip>
      )}
    </span>
  );
}

// ===== Catalog card (one entry in /public/badges) =====
export function BadgeCatalogCard({ badge }: { badge: BadgeDef }) {
  const tintBg = badge.color + '1a';
  return (
    <Card padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 14, background: tintBg,
          display: 'grid', placeItems: 'center', fontSize: 30, flexShrink: 0,
          border: `1px solid ${badge.color}33`,
        }}>{badge.icon}</div>
        <span style={{
          fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
          background: T.bgSubtle, color: T.textMuted,
          textTransform: 'uppercase', letterSpacing: '.05em',
        }}>{BADGE_CATEGORY_LABEL[badge.category]}</span>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: T.text }}>{badge.name}</div>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.55, color: T.textMuted }}>{badge.description}</p>
      </div>
      <div style={{ marginTop: 'auto', padding: '10px 12px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
          Qanday olinadi
        </div>
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{badge.howToEarn}</div>
      </div>
    </Card>
  );
}

// ===== Full badge grid (profile / public profile) =====
// catalog = all 12 badges, earned = subset student has (with earnedAt)
export function BadgeGrid({ catalog, earned, columns = 4 }: { catalog: BadgeDef[]; earned: EarnedBadge[]; columns?: number }) {
  const earnedMap = Object.fromEntries(earned.map(b => [b.slug, b]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
      {catalog.map(b => {
        const e = earnedMap[b.slug];
        const isEarned = !!e;
        const tintBg = (isEarned ? b.color : '#94a3b8') + '1a';
        return (
          <Tooltip key={b.slug} content={isEarned ? `${b.name} · ${fmtDate(e.earnedAt)}` : `${b.name} · Hali olinmagan`}>
            <div style={{
              padding: 14, border: `1px solid ${T.border}`, borderRadius: 12,
              background: T.white, display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', gap: 8,
              opacity: isEarned ? 1 : 0.3, filter: isEarned ? 'none' : 'grayscale(.6)',
              transition: 'opacity .15s, transform .15s', cursor: 'help', width: '100%',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: tintBg,
                display: 'grid', placeItems: 'center', fontSize: 28,
                border: `1px solid ${(isEarned ? b.color : '#94a3b8')}33`,
              }}>{b.icon}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{b.name}</div>
              <div style={{ fontSize: 10.5, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {isEarned ? fmtDate(e.earnedAt) : 'Hali olinmagan'}
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
