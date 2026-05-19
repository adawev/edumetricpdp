import type { CSSProperties } from 'react';
import { T } from '@/lib/theme';
import { Card, Tooltip } from './Primitives';
import { Icons } from './Icons';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeDef = {
  slug: string;
  name: string;
  icon: string;
  category: 'compete' | 'academic' | 'activity' | 'aggregate';
  rarity: BadgeRarity;
  color: string;
  description: string;
  howToEarn: string;
};
export type EarnedBadge = BadgeDef & { earnedAt?: string };
export type BadgeMini = { slug: string; name: string; icon: string; color: string; rarity: BadgeRarity };

const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  const m = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

export const BADGE_CATEGORY_LABEL: Record<string, string> = {
  compete: 'Musobaqa', academic: 'Akademik', activity: 'Faollik', aggregate: 'Jamlovchi',
};

export const BADGE_RARITY_LABEL: Record<BadgeRarity, string> = {
  common: 'Oddiy', rare: 'Noyob', epic: 'Epik', legendary: 'Afsonaviy',
};

// Slug → lucide-style ikon
const ICON_FOR: Record<string, (p: { size: number; stroke: string; strokeWidth?: number }) => JSX.Element> = {
  champion:           Icons.trophy,
  top3:               Icons.medal,
  top10:              Icons.star,
  academic_star:      Icons.graduation,
  perfect_attendance: Icons.cal,
  polyglot:           Icons.globe,
  founder:            Icons.rocket,
  mentor:             Icons.user,
  employed:           Icons.briefcase,
  grant_keeper:       Icons.award,
  collector:          Icons.files,
  streak:             Icons.flame,
};

// Rarity → vizual stillar
type RarityStyle = {
  gradient: (color: string) => string;
  outerRing: string;        // tashqi halqa rangi
  ringWidth: number;
  glowStrength: number;     // shadow uchun
  hasShimmer: boolean;
  hasSparkle: boolean;
  rarityLabel: string;
  rarityColor: string;
};

const RARITY_STYLE: Record<BadgeRarity, RarityStyle> = {
  legendary: {
    gradient: (c) => `conic-gradient(from 220deg, ${c} 0%, #fff7c2 25%, ${c} 50%, #fef3c7 75%, ${c} 100%)`,
    outerRing: '#fbbf24', ringWidth: 3, glowStrength: 28,
    hasShimmer: true, hasSparkle: true,
    rarityLabel: 'AFSONAVIY', rarityColor: '#a16207',
  },
  epic: {
    gradient: (c) => `linear-gradient(135deg, ${c}ff 0%, ${c}cc 50%, ${c}dd 100%)`,
    outerRing: '#a78bfa', ringWidth: 2.5, glowStrength: 20,
    hasShimmer: true, hasSparkle: false,
    rarityLabel: 'EPIK', rarityColor: '#6d28d9',
  },
  rare: {
    gradient: (c) => `linear-gradient(135deg, ${c}ff 0%, ${c}bb 100%)`,
    outerRing: '#60a5fa', ringWidth: 2, glowStrength: 14,
    hasShimmer: false, hasSparkle: false,
    rarityLabel: 'NOYOB', rarityColor: '#1d4ed8',
  },
  common: {
    gradient: (c) => `linear-gradient(135deg, ${c}ee 0%, ${c}aa 100%)`,
    outerRing: '#cbd5e1', ringWidth: 1.5, glowStrength: 8,
    hasShimmer: false, hasSparkle: false,
    rarityLabel: 'ODDIY', rarityColor: '#475569',
  },
};

// =====================================================================
// Visual medallion — rarity'ga qarab style farqlanadi
// =====================================================================
export function BadgeMedal({ badge, size = 56, earned = true, style }: { badge: BadgeDef | BadgeMini; size?: number; earned?: boolean; style?: CSSProperties }) {
  const Icon = ICON_FOR[badge.slug] || Icons.award;
  const iconSize = Math.round(size * 0.48);
  const rs = RARITY_STYLE[badge.rarity];

  if (!earned) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 999,
        background: '#e2e8f0', display: 'grid', placeItems: 'center',
        opacity: 0.5, filter: 'grayscale(.85)', position: 'relative',
        border: '2px solid #cbd5e1',
        ...style,
      }}>
        <Icon size={iconSize} stroke="#94a3b8" />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: rs.gradient(badge.color),
      display: 'grid', placeItems: 'center',
      boxShadow: `0 ${rs.glowStrength / 3}px ${rs.glowStrength}px ${badge.color}66, inset 0 -2px 8px rgba(0,0,0,.22), inset 0 2px 8px rgba(255,255,255,.45)`,
      position: 'relative', overflow: 'visible',
      ...style,
    }}>
      {/* Outer ring */}
      <span style={{
        position: 'absolute', inset: -rs.ringWidth, borderRadius: 999,
        border: `${rs.ringWidth}px solid ${rs.outerRing}`,
        pointerEvents: 'none',
        boxShadow: rs.glowStrength > 18 ? `0 0 ${rs.glowStrength}px ${rs.outerRing}aa` : 'none',
      }} />

      {/* Inner highlight shine */}
      <span style={{
        position: 'absolute', top: '6%', left: '12%', width: '46%', height: '34%',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,.65) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Diagonal shimmer sweep (epic + legendary) */}
      {rs.hasShimmer && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 999, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <span style={{
            position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,.7) 50%, transparent 70%)',
            animation: 'em-shimmer-sweep 3s ease-in-out infinite',
          }} />
        </span>
      )}

      {/* Sparkle particles (legendary only) */}
      {rs.hasSparkle && (
        <>
          <span style={{
            position: 'absolute', top: -4, right: '15%', width: 6, height: 6,
            background: '#fff', borderRadius: '50%',
            boxShadow: '0 0 8px #fff, 0 0 14px #fbbf24',
            animation: 'em-sparkle 2.2s ease-in-out infinite',
          }} />
          <span style={{
            position: 'absolute', bottom: 2, left: -2, width: 4, height: 4,
            background: '#fff', borderRadius: '50%',
            boxShadow: '0 0 6px #fff, 0 0 12px #fbbf24',
            animation: 'em-sparkle 2.2s ease-in-out .8s infinite',
          }} />
        </>
      )}

      {/* Icon */}
      <Icon size={iconSize} stroke="#fff" strokeWidth={2.4} />
    </div>
  );
}

// =====================================================================
// Single badge chip for rating row — faqat 1 ta, lekin yorqin
// =====================================================================
export function BadgeRowMark({ badge, count, size = 22 }: { badge: BadgeMini | null; count?: number; size?: number }) {
  if (!badge) {
    if (count && count > 0) {
      return (
        <Tooltip content={`${count} ta badge — profilda ko'rsatish uchun tanlang`}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: size, height: size,
            fontSize: 10, fontWeight: 700, color: T.textMuted,
            background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: 999,
          }}>+{count}</span>
        </Tooltip>
      );
    }
    return null;
  }
  return (
    <Tooltip content={`${badge.name} · ${BADGE_RARITY_LABEL[badge.rarity]}${count && count > 1 ? ` · jami ${count} badge` : ''}`}>
      <span style={{ display: 'inline-block', cursor: 'help' }}>
        <BadgeMedal badge={badge} size={size} />
      </span>
    </Tooltip>
  );
}

// =====================================================================
// Catalog card (/public/badges)
// =====================================================================
export function BadgeCatalogCard({ badge }: { badge: BadgeDef }) {
  const rs = RARITY_STYLE[badge.rarity];
  const tintBg = badge.color + '14';
  return (
    <Card padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      <span aria-hidden style={{
        position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 999,
        background: tintBg, filter: 'blur(24px)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
        <BadgeMedal badge={badge} size={68} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
            background: rs.rarityColor + '15', color: rs.rarityColor,
            border: `1px solid ${rs.rarityColor}33`,
            letterSpacing: '.1em',
          }}>{rs.rarityLabel}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
            background: T.white, color: badge.color, border: `1px solid ${badge.color}33`,
            textTransform: 'uppercase', letterSpacing: '.05em',
          }}>{BADGE_CATEGORY_LABEL[badge.category]}</span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', color: T.text }}>{badge.name}</div>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.55, color: T.textMuted }}>{badge.description}</p>
      </div>
      <div style={{
        marginTop: 'auto', padding: '10px 12px',
        background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(4px)',
        border: `1px solid ${T.border}`, borderRadius: 8, position: 'relative',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: badge.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          Qanday olinadi
        </div>
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{badge.howToEarn}</div>
      </div>
    </Card>
  );
}

// =====================================================================
// Grid (profile pages)
// =====================================================================
export function BadgeGrid({ catalog, earned, columns = 4 }: { catalog: BadgeDef[]; earned: EarnedBadge[]; columns?: number }) {
  const earnedMap = Object.fromEntries(earned.map(b => [b.slug, b]));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12 }}>
      {catalog.map(b => {
        const e = earnedMap[b.slug];
        const isEarned = !!e;
        return (
          <Tooltip key={b.slug} content={isEarned ? `${b.name} · ${fmtDate(e.earnedAt)}` : `${b.name} · Hali olinmagan`}>
            <div style={{
              padding: 14, border: `1px solid ${T.border}`, borderRadius: 12,
              background: isEarned ? `linear-gradient(180deg, ${b.color}10 0%, ${T.white} 100%)` : T.white,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', gap: 8,
              transition: 'transform .15s, box-shadow .15s', cursor: 'help',
            }}>
              <BadgeMedal badge={b} size={60} earned={isEarned} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: isEarned ? T.text : T.textMuted, lineHeight: 1.3 }}>
                {b.name}
              </div>
              <div style={{ fontSize: 10, color: isEarned ? RARITY_STYLE[b.rarity].rarityColor : T.textSubtle, fontWeight: 700, letterSpacing: '.08em' }}>
                {RARITY_STYLE[b.rarity].rarityLabel}
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
