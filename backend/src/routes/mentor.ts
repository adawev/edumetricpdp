import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';

export const mentorRouter = Router();
mentorRouter.use(requireAuth, requireRole('MENTOR'));

async function getMentorId(userId: string) {
  const m = await prisma.mentor.findUnique({ where: { userId } });
  return m?.id ?? null;
}

mentorRouter.get('/students', async (req, res) => {
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });
  const groups = await prisma.group.findMany({
    where: { mentorId },
    include: { students: { orderBy: { grantScore: 'desc' } } },
  });
  res.json(groups);
});

const attendanceSchema = z.object({
  date: z.string().datetime(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
  })),
});

mentorRouter.post('/attendance', async (req, res) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', detail: parsed.error });

  const date = new Date(parsed.data.date);
  for (const r of parsed.data.records) {
    await prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId: r.studentId, date } },
      update: { status: r.status },
      create: { studentId: r.studentId, date, status: r.status },
    });

    const all = await prisma.attendanceRecord.findMany({ where: { studentId: r.studentId } });
    const present = all.filter(a => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
    const attendancePct = all.length ? (present / all.length) * 100 : 0;
    await prisma.student.update({ where: { id: r.studentId }, data: { attendance: attendancePct } });
    await recalcStudent(r.studentId);
  }
  res.json({ ok: true });
});

const feedbackSchema = z.object({
  studentId: z.string().uuid(),
  text: z.string().min(3),
  score: z.number().int().min(1).max(5),
});

mentorRouter.post('/feedback', async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });

  const fb = await prisma.feedback.create({ data: { ...parsed.data, mentorId } });

  const fbs = await prisma.feedback.findMany({ where: { studentId: parsed.data.studentId } });
  const avg = fbs.reduce((s, f) => s + f.score, 0) / fbs.length;
  await prisma.student.update({ where: { id: parsed.data.studentId }, data: { tutorScore: avg } });
  await recalcStudent(parsed.data.studentId);

  res.status(201).json(fb);
});

const disciplineSchema = z.object({ studentId: z.string().uuid(), score: z.number().min(0).max(10) });

mentorRouter.post('/discipline', async (req, res) => {
  const parsed = disciplineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  await prisma.student.update({ where: { id: parsed.data.studentId }, data: { disciplineScore: parsed.data.score } });
  await recalcStudent(parsed.data.studentId);
  res.json({ ok: true });
});
