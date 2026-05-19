import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { BADGE_CATALOG, computeBadgesForStudent } from '../services/badges.js';

export const publicRouter = Router();

// Badge katalogi — loginsiz ochiq, talabalar qanday qilib olishni ko'radi
publicRouter.get('/badges/catalog', (_req, res) => {
  res.json(BADGE_CATALOG);
});

publicRouter.get('/rating', async (req, res) => {
  const groupId = req.query.groupId as string | undefined;
  const students = await prisma.student.findMany({
    where: groupId ? { groupId } : undefined,
    include: {
      group: true,
      achievements: { where: { status: 'APPROVED', reviewedAt: { not: null } } },
    },
    orderBy: { grantScore: 'desc' },
  });

  // So'nggi 7 kunda olingan ball — faollik chizig'i uchun
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const rarityRank: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const rows = await Promise.all(students.map(async (s, i) => {
    const earned = await computeBadgesForStudent(s.id);
    let pinned = s.pinnedBadge ? earned.find(b => b.slug === s.pinnedBadge) : undefined;
    if (!pinned && earned.length) {
      pinned = [...earned].sort((a, b) => rarityRank[a.rarity] - rarityRank[b.rarity])[0];
    }
    const weeklyActivity = s.achievements
      .filter(a => a.reviewedAt && a.reviewedAt > weekAgo)
      .reduce((sum, a) => sum + a.ball, 0);

    return {
      rank: i + 1,
      id: s.id,
      fullName: s.fullName,
      group: s.group.name,
      grantScore: Math.round(s.grantScore * 10) / 10,
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
  res.json(rows);
});

publicRouter.get('/groups', async (_req, res) => {
  res.json(await prisma.group.findMany({ select: { id: true, name: true, course: true } }));
});
