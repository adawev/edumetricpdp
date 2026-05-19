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
    include: { group: true },
    orderBy: { grantScore: 'desc' },
  });

  // Har talaba uchun badge'larni hisoblash (kichik ro'yxat)
  const rows = await Promise.all(students.map(async (s, i) => {
    const badges = await computeBadgesForStudent(s.id);
    return {
      rank: i + 1,
      id: s.id,
      fullName: s.fullName,
      group: s.group.name,
      grantScore: Math.round(s.grantScore * 10) / 10,
      grantStatus: s.grantStatus,
      grantReason: s.grantReason,
      riskLevel: s.riskLevel,
      badges: badges.map(b => ({ slug: b.slug, name: b.name, icon: b.icon, color: b.color })),
    };
  }));
  res.json(rows);
});

publicRouter.get('/groups', async (_req, res) => {
  res.json(await prisma.group.findMany({ select: { id: true, name: true, course: true } }));
});
