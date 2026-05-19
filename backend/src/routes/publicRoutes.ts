import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { BADGE_CATALOG, computeBadgesForStudent } from '../services/badges.js';
import { verifyToken } from '../lib/auth.js';

export const publicRouter = Router();

// Token bor-yo'qligini optional tekshirish
function isAuthed(req: any): boolean {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return false;
  try { verifyToken(h.slice(7)); return true; }
  catch { return false; }
}

// Ismni anonimlash: "Akmal Karimov" → "A. K."
function anonymize(fullName: string, rank: number): string {
  const parts = fullName.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}. ${parts[1][0]}.`;
  return `Talaba #${rank}`;
}

// Badge katalogi — loginsiz ochiq, talabalar qanday qilib olishni ko'radi
publicRouter.get('/badges/catalog', (_req, res) => {
  res.json(BADGE_CATALOG);
});

publicRouter.get('/rating', async (req, res) => {
  const groupId = req.query.groupId as string | undefined;
  const period = (req.query.period as string | undefined) ?? 'all'; // 'week' | 'month' | 'all'
  const authed = isAuthed(req);
  const students = await prisma.student.findMany({
    where: groupId ? { groupId } : undefined,
    include: {
      group: true,
      achievements: { where: { status: 'APPROVED', reviewedAt: { not: null } } },
    },
    orderBy: { grantScore: 'desc' },
  });

  const now = Date.now();
  const weekAgo  = new Date(now - 7  * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);
  const periodCutoff = period === 'week' ? weekAgo : period === 'month' ? monthAgo : null;

  const rarityRank: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
  let rows = await Promise.all(students.map(async (s) => {
    const earned = await computeBadgesForStudent(s.id);
    let pinned = s.pinnedBadge ? earned.find(b => b.slug === s.pinnedBadge) : undefined;
    if (!pinned && earned.length) {
      pinned = [...earned].sort((a, b) => rarityRank[a.rarity] - rarityRank[b.rarity])[0];
    }
    const weeklyActivity = s.achievements
      .filter(a => a.reviewedAt && a.reviewedAt > weekAgo)
      .reduce((sum, a) => sum + a.ball, 0);

    // Period-bo'yicha ball (so'nggi 7 yoki 30 kun) — yutuqlar yig'indisi
    const periodBall = periodCutoff
      ? s.achievements.filter(a => a.reviewedAt && a.reviewedAt > periodCutoff).reduce((sum, a) => sum + a.ball, 0)
      : s.grantScore;

    const isAnonymized = !authed && !s.profilePublic;
    return {
      id: s.id,
      fullName: isAnonymized ? anonymize(s.fullName, 0) : s.fullName,
      isAnonymized,
      group: s.group.name,
      grantScore: Math.round(s.grantScore * 10) / 10,
      periodBall: Math.round(periodBall * 10) / 10,
      grantStatus: s.grantStatus,
      grantReason: s.grantReason,
      riskLevel: s.riskLevel,
      weeklyActivity: Math.round(weeklyActivity * 10) / 10,
      lastRecalc: s.lastRecalc,
      badge: pinned ? {
        slug: pinned.slug, name: pinned.name, icon: pinned.icon, color: pinned.color, rarity: pinned.rarity,
      } : null,
      badgeCount: earned.length,
    };
  }));

  // Period bo'yicha qayta saralash
  rows.sort((a, b) => b.periodBall - a.periodBall);
  const withRank = rows.map((r, i) => ({ rank: i + 1, ...r }));
  res.json(withRank);
});

publicRouter.get('/groups', async (_req, res) => {
  res.json(await prisma.group.findMany({ select: { id: true, name: true, course: true } }));
});
