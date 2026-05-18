import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const publicRouter = Router();

publicRouter.get('/rating', async (req, res) => {
  const groupId = req.query.groupId as string | undefined;
  const students = await prisma.student.findMany({
    where: groupId ? { groupId } : undefined,
    include: { group: true },
    orderBy: { grantScore: 'desc' },
  });
  res.json(students.map((s, i) => ({
    rank: i + 1,
    id: s.id,
    fullName: s.fullName,
    group: s.group.name,
    grantScore: Math.round(s.grantScore * 10) / 10,
    grantStatus: s.grantStatus,
  })));
});

publicRouter.get('/groups', async (_req, res) => {
  res.json(await prisma.group.findMany({ select: { id: true, name: true, course: true } }));
});
