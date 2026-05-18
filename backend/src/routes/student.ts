import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';
import { calculateGrantScore } from '../services/grantEngine.js';

export const studentRouter = Router();

studentRouter.use(requireAuth);

async function getMyStudentId(userId: string) {
  const s = await prisma.student.findUnique({ where: { userId } });
  return s?.id ?? null;
}

studentRouter.get('/me', requireRole('STUDENT'), async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user!.userId },
    include: { group: { include: { mentor: true } }, penalties: true },
  });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const penaltyTotal = student.penalties.reduce((s, p) => s + p.ball, 0);
  const recoveryTotal = student.penalties.reduce((s, p) => s + p.recovered, 0);
  const breakdown = calculateGrantScore({
    gpa: student.gpa,
    attendance: student.attendance,
    projectScore: student.projectScore,
    activityScore: student.activityScore,
    tutorScore: student.tutorScore,
    disciplineScore: student.disciplineScore,
    penaltyTotal,
    recoveryTotal,
    employmentBonus: student.employmentBonus,
  });

  res.json({ student, breakdown });
});

studentRouter.get('/me/achievements', requireRole('STUDENT'), async (req, res) => {
  const id = await getMyStudentId(req.user!.userId);
  if (!id) return res.status(404).json({ error: 'Student not found' });
  res.json(await prisma.achievement.findMany({ where: { studentId: id }, orderBy: { createdAt: 'desc' } }));
});

const achievementSchema = z.object({
  type: z.enum(['CERTIFICATE', 'HACKATHON', 'STARTUP', 'EMPLOYMENT', 'MENTORING', 'LANGUAGE', 'COURSE', 'VOLUNTEER', 'OTHER']),
  title: z.string().min(2),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
});

studentRouter.post('/me/achievements', requireRole('STUDENT'), async (req, res) => {
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const id = await getMyStudentId(req.user!.userId);
  if (!id) return res.status(404).json({ error: 'Student not found' });

  const achievement = await prisma.achievement.create({
    data: { ...parsed.data, studentId: id },
  });
  await prisma.activityLog.create({
    data: { studentId: id, action: 'achievement.created', meta: { id: achievement.id, type: achievement.type } },
  });
  res.status(201).json(achievement);
});

studentRouter.get('/me/feedbacks', requireRole('STUDENT'), async (req, res) => {
  const id = await getMyStudentId(req.user!.userId);
  if (!id) return res.status(404).json({ error: 'Student not found' });
  res.json(await prisma.feedback.findMany({
    where: { studentId: id },
    include: { mentor: true },
    orderBy: { createdAt: 'desc' },
  }));
});

studentRouter.get('/:id/score', async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: { penalties: true },
  });
  if (!student) return res.status(404).json({ error: 'Not found' });
  const penaltyTotal = student.penalties.reduce((s, p) => s + p.ball, 0);
  const recoveryTotal = student.penalties.reduce((s, p) => s + p.recovered, 0);
  const breakdown = calculateGrantScore({
    gpa: student.gpa,
    attendance: student.attendance,
    projectScore: student.projectScore,
    activityScore: student.activityScore,
    tutorScore: student.tutorScore,
    disciplineScore: student.disciplineScore,
    penaltyTotal,
    recoveryTotal,
    employmentBonus: student.employmentBonus,
  });
  res.json({ grantScore: student.grantScore, grantStatus: student.grantStatus, breakdown });
});

export { recalcStudent };
