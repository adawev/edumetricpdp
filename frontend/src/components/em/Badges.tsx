import type { CSSProperties } from 'react';
import { T } from '@/lib/theme';
import { Card, Tooltip } from './Primitives';
import { Icons } from './Icons';

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
  const m = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

export const BADGE_CATEGORY_LABEL: Record<string, string> = {
  compete: 'Musobaqa', academic: 'Akademik', activity: 'Faollik', aggregate: 'Jamlovchi',
};

// ===== Slug → lucide-style icon component =====
const ICON_FOR: Record<string, (p: { size: number; stroke: string }) => JSX.Element> = {
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

// Color → light gradient bg (lighter shade to darker shade of same hue)
function gradient(color: string): string {
  return `linear-gradient(135deg, ${color}ee 0%, ${color} 60%, ${color}cc 100%)`;
}

// Slug → lighter accent for ring + tint bg in card
function tint(color: string): string {
  return `${color}1a`; // 10% opacity
}

// =====================================================================
// 1) Visual: circular badge medallion
// =====================================================================
export function BadgeMedal({ badge, size = 56, earned = true, style }: { badge: BadgeDef | BadgeMini; size?: number; earned?: boolean; style?: CSSProperties }) {
  const Icon = ICON_FOR[badge.slug] || Icons.award;
  const iconSize = Math.round(size * 0.5);
  if (!earned) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 999,
        background: '#e2e8f0', display: 'grid', placeItems: 'center',
        opacity: 0.55, filter: 'grayscale(.8)', position: 'relative',
        ...style,
      }}>
        <Icon size={iconSize} stroke="#94a3b8" />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: gradient(badge.color),
      display: 'grid', placeItems: 'center',
      boxShadow: `0 4px 12px ${badge.color}55, inset 0 -2px 6px rgba(0,0,0,.18), inset 0 2px 6px rgba(255,255,255,.35)`,
      position: 'relative',
      ...style,
    }}>
      {/* shine highlight */}
      <span style={{
        position: 'absolute', top: '8%', left: '15%', width: '40%', height: '30%',
        borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,.55) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Icon size={iconSize} stroke="#fff" />
      {/* ring */}
      <span style={{
        position: 'absolute', inset: -2, borderRadius: 999,
        border: `2px solid ${badge.color}66`, pointerEvents: 'none',
      }} />
    </div>
  );
}

// =====================================================================
// 2) Inline chips for rating row
// =====================================================================
export function BadgeChips({ badges, max = 3, size = 22 }: { badges: BadgeMini[]; max?: number; size?: number }) {
  if (!badges?.length) return null;
  const visible = badges.slice(0, max);
  const rest = badges.length - visible.length;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
      {visible.map((b, i) => (
        <Tooltip key={b.slug} content={b.name}>
          <span style={{
            display: 'inline-block', marginLeft: i === 0 ? 0 : -6,
            transition: 'transform .15s', cursor: 'help',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px) scale(1.1)'; (e.currentTarget as HTMLElement).style.zIndex = '5'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.zIndex = '1'; }}>
            <BadgeMedal badge={b} size={size} />
          </span>
        </Tooltip>
      ))}
      {rest > 0 && (
        <Tooltip content={badges.slice(max).map(b => b.name).join(', ')}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: size, height: size, marginLeft: -6,
            fontSize: 10.5, fontWeight: 700, color: T.text,
            background: T.white, border: `2px solid ${T.borderStrong}`, borderRadius: 999,
            cursor: 'help',
          }}>+{rest}</span>
        </Tooltip>
      )}
    </span>
  );
}

// =====================================================================
// 3) Big catalog card (in /public/badges)
// =====================================================================
export function BadgeCatalogCard({ badge }: { badge: BadgeDef }) {
  const tintBg = tint(badge.color);
  return (
    <Card padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      {/* decorative blob */}
      <span aria-hidden style={{
        position: 'absolute', top: -50, right: -50, width: 140, height: 140, borderRadius: 999,
        background: tintBg, filter: 'blur(20px)', pointerEvents: 'none', opacity: .8,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
        <BadgeMedal badge={badge} size={64} />
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999,
          background: T.white, color: badge.color, border: `1px solid ${badge.color}44`,
          textTransform: 'uppercase', letterSpacing: '.05em',
        }}>{BADGE_CATEGORY_LABEL[badge.category]}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', color: T.text }}>{badge.name}</div>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.55, color: T.textMuted }}>{badge.description}</p>
      </div>
      <div style={{
        marginTop: 'auto', padding: '10px 12px',
        background: 'rgba(255,255,255,.6)', backdropFilter: 'blur(4px)',
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
// 4) Grid for profile pages (earned + locked)
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
              background: isEarned ? `linear-gradient(180deg, ${b.color}0d 0%, ${T.white} 100%)` : T.white,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', gap: 8,
              transition: 'transform .15s, box-shadow .15s', cursor: 'help',
            }}
            onMouseEnter={(e2) => { if (isEarned) { (e2.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e2.currentTarget as HTMLElement).style.boxShadow = `0 10px 24px ${b.color}33`; } }}
            onMouseLeave={(e2) => { (e2.currentTarget as HTMLElement).style.transform = 'none'; (e2.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
              <BadgeMedal badge={b} size={56} earned={isEarned} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: isEarned ? T.text : T.textMuted, lineHeight: 1.3 }}>
                {b.name}
              </div>
              <div style={{ fontSize: 10.5, color: T.textSubtle, fontVariantNumeric: 'tabular-nums' }}>
                {isEarned ? fmtDate(e.earnedAt) : 'Hali olinmagan'}
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
