import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';

export const mentorRouter = Router();
mentorRouter.use(requireAuth, requireRole('MENTOR'));

// NOTE: davomat va baholar mentor tomonidan kiritilmaydi —
// ular LMS'dan /api/integrations/{attendance,grades} orqali keladi.
// Mentor faqat feedback + intizom bahosini kiritadi.

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

const feedbackSchema = z.object({
  studentId: z.string().uuid(),
  text: z.string().min(3),
  score: z.number().int().min(1).max(5),
});

// Feedback = text comment + personal rating (1-5). tutorScore'ga ta'sir qilmaydi.
mentorRouter.post('/feedback', async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });

  const fb = await prisma.feedback.create({ data: { ...parsed.data, mentorId } });
  res.status(201).json(fb);
});

// Tyutor bahosi — nizom bo'yicha 5 yo'nalish, har biri 0-1, sum = tutorScore (max 5)
const tutorEvalSchema = z.object({
  studentId: z.string().uuid(),
  culture:    z.number().min(0).max(1),  // Korporativ madaniyat va Etika
  activity:   z.number().min(0).max(1),  // Ijtimoiy va Ma'naviy-ma'rifiy faollik
  softSkills: z.number().min(0).max(1),  // Soft Skills va Shaxsiy rivojlanish
  discipline: z.number().min(0).max(1),  // Intizom va Mas'uliyat (Tyutor bilan aloqa)
  dormitory:  z.number().min(0).max(1),  // Yotoqxona va Universitet hayotidagi faollik
});

mentorRouter.post('/tutor-evaluation', async (req, res) => {
  const parsed = tutorEvalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', detail: parsed.error.issues });
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });

  const { studentId, culture, activity, softSkills, discipline, dormitory } = parsed.data;
  const tutorScore = culture + activity + softSkills + discipline + dormitory; // max 5

  await prisma.student.update({
    where: { id: studentId },
    data: {
      tutorScore,
      tutorEval: { culture, activity, softSkills, discipline, dormitory, by: mentorId, at: new Date().toISOString() } as any,
    },
  });
  await recalcStudent(studentId);

  res.json({ ok: true, tutorScore, breakdown: { culture, activity, softSkills, discipline, dormitory } });
});

const disciplineSchema = z.object({ studentId: z.string().uuid(), score: z.number().min(0).max(10) });

mentorRouter.post('/discipline', async (req, res) => {
  const parsed = disciplineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  await prisma.student.update({ where: { id: parsed.data.studentId }, data: { disciplineScore: parsed.data.score } });
  await recalcStudent(parsed.data.studentId);
  res.json({ ok: true });
});
