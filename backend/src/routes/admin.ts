import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';
import { calculateGrantScore } from '../services/grantEngine.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/groups', async (_req, res) => {
  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(groups);
});

adminRouter.get('/students', async (_req, res) => {
  const students = await prisma.student.findMany({
    include: {
      group: { include: { mentor: true } },
      user: { select: { email: true } },
    },
    orderBy: { grantScore: 'desc' },
  });
  res.json(students);
});

adminRouter.get('/achievements', async (req, res) => {
  const status = (req.query.status as string | undefined)?.toUpperCase();
  res.json(await prisma.achievement.findMany({
    where: status ? { status: status as any } : undefined,
    include: { student: { include: { group: true } } },
    orderBy: { createdAt: 'desc' },
  }));
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  ball: z.number().min(0).max(15).optional(),
  rejectReason: z.string().optional(),
});

adminRouter.patch('/achievements/:id', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const updated = await prisma.achievement.update({
    where: { id: req.params.id },
    data: {
      status: parsed.data.status,
      ball: parsed.data.ball ?? 0,
      rejectReason: parsed.data.rejectReason,
      reviewedAt: new Date(),
    },
  });

  if (parsed.data.status === 'APPROVED') {
    const approved = await prisma.achievement.findMany({
      where: { studentId: updated.studentId, status: 'APPROVED' },
    });
    const activityScore = approved.reduce((s, a) => s + a.ball, 0);
    await prisma.student.update({ where: { id: updated.studentId }, data: { activityScore } });
  }
  await recalcStudent(updated.studentId);

  res.json(updated);
});

adminRouter.get('/penalties', async (_req, res) => {
  const penalties = await prisma.penalty.findMany({
    include: { student: { include: { group: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(penalties);
});

const penaltySchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(['LIGHT', 'MEDIUM', 'HEAVY']),
  ball: z.number().min(0),
  reason: z.string().min(2),
});

adminRouter.post('/penalties', async (req, res) => {
  const parsed = penaltySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const p = await prisma.penalty.create({ data: parsed.data });
  await recalcStudent(parsed.data.studentId);
  res.status(201).json(p);
});

adminRouter.post('/penalties/:id/recover', async (req, res) => {
  const schema = z.object({ recovered: z.number().min(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const penalty = await prisma.penalty.update({
    where: { id: req.params.id },
    data: { recovered: parsed.data.recovered, recoveryDone: true },
  });
  await recalcStudent(penalty.studentId);
  res.json(penalty);
});

adminRouter.get('/grants', async (_req, res) => {
  const pending = await prisma.student.findMany({
    where: { grantStatus: 'PENDING' },
    include: { group: true },
    orderBy: { grantScore: 'desc' },
  });
  const granted = await prisma.student.findMany({
    where: { grantStatus: 'GRANTED' },
    include: { group: true },
    orderBy: { grantScore: 'desc' },
  });
  res.json({ pending, granted });
});

adminRouter.post('/grants/:id/grant', async (req, res) => {
  const s = await prisma.student.update({
    where: { id: req.params.id },
    data: { grantStatus: 'GRANTED' },
  });
  res.json(s);
});

adminRouter.post('/grants/:id/revoke', async (req, res) => {
  const s = await prisma.student.update({
    where: { id: req.params.id },
    data: { grantStatus: 'NOT_GRANTED' },
  });
  res.json(s);
});

adminRouter.get('/rating', async (_req, res) => {
  const students = await prisma.student.findMany({
    include: { group: true, penalties: true },
    orderBy: { grantScore: 'desc' },
  });
  const rows = students.map((s, i) => {
    const penaltyTotal = s.penalties.reduce((a, p) => a + p.ball, 0);
    const recoveryTotal = s.penalties.reduce((a, p) => a + p.recovered, 0);
    const breakdown = calculateGrantScore({
      gpa: s.gpa,
      attendance: s.attendance,
      projectScore: s.projectScore,
      activityScore: s.activityScore,
      tutorScore: s.tutorScore,
      disciplineScore: s.disciplineScore,
      penaltyTotal,
      recoveryTotal,
      employmentBonus: s.employmentBonus,
      paymentOverdue: s.paymentOverdue,
    });
    return {
      rank: i + 1,
      id: s.id,
      fullName: s.fullName,
      group: s.group.name,
      grantStatus: s.grantStatus,
      grantReason: s.grantReason,
      riskLevel: s.riskLevel,
      breakdown,
    };
  });
  res.json(rows);
});

adminRouter.get('/api-keys', async (_req, res) => {
  res.json(await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } }));
});

adminRouter.post('/api-keys', async (req, res) => {
  const schema = z.object({ name: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const key = 'em_' + randomBytes(24).toString('hex');
  const created = await prisma.apiKey.create({ data: { name: parsed.data.name, key } });
  res.status(201).json(created);
});

adminRouter.delete('/api-keys/:id', async (req, res) => {
  await prisma.apiKey.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ ok: true });
});
