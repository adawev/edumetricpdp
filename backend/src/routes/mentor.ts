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

/**
 * Talaba mentor o'zining guruhiga tegishliligini tekshiradi.
 * Topilmasa null, mentorga tegishli bo'lmasa false, aks holda true.
 */
async function studentBelongsToMentor(studentId: string, mentorId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });
  if (!student) return null;
  if (!student.group) return false;
  return student.group.mentorId === mentorId;
}

mentorRouter.get('/students', async (req, res) => {
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });
  const groups = await prisma.group.findMany({
    where: { mentorId },
    include: {
      students: {
        orderBy: { grantScore: 'desc' },
        include: { user: { select: { email: true } } },
      },
    },
  });
  // Flatten email into student object
  const result = groups.map(g => ({
    ...g,
    students: g.students.map(({ user, ...s }) => ({ ...s, email: user?.email ?? '' })),
  }));
  res.json(result);
});

mentorRouter.get('/feedbacks', async (req, res) => {
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : null;
  if (!studentId) return res.status(400).json({ error: 'studentId is required' });

  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });

  const owned = await studentBelongsToMentor(studentId, mentorId);
  if (owned === null) return res.status(404).json({ error: 'Student not found' });
  if (!owned) return res.status(403).json({ error: 'Forbidden' });

  const feedbacks = await prisma.feedback.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: { mentor: { select: { fullName: true } } },
  });

  res.json(
    feedbacks.map(f => ({
      id: f.id,
      text: f.text,
      score: f.score,
      createdAt: f.createdAt,
      mentorName: f.mentor.fullName,
      isMine: f.mentorId === mentorId,
    })),
  );
});

const feedbackSchema = z.object({
  studentId: z.string().uuid(),
  text: z.string().min(3).max(500),
  score: z.number().int().min(1).max(5),
});

// Feedback = text comment + mentor bahosi (1-5).
// Feedback bahosi = tutorScore (grant nizomi "Mentor bahosi" mezoni, max 5 ball).
// Qoida: bitta mentor → bitta talaba uchun bitta feedback. Mavjud bo'lsa yangilanadi.
mentorRouter.post('/feedback', async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });
  const owned = await studentBelongsToMentor(parsed.data.studentId, mentorId);
  if (owned === null) return res.status(404).json({ error: 'Student not found' });
  if (!owned) return res.status(403).json({ error: 'Forbidden' });

  // Atomic upsert — race condition'siz. @@unique([studentId, mentorId]) kafolat beradi.
  const existing = await prisma.feedback.findUnique({
    where: { studentId_mentorId: { studentId: parsed.data.studentId, mentorId } },
    select: { id: true },
  });

  const fb = await prisma.feedback.upsert({
    where: { studentId_mentorId: { studentId: parsed.data.studentId, mentorId } },
    update: { text: parsed.data.text, score: parsed.data.score },
    create: { studentId: parsed.data.studentId, mentorId, text: parsed.data.text, score: parsed.data.score },
  });

  // Feedback bahosi (1-5) → tutorScore. Grant ballini qayta hisoblaydi.
  await prisma.student.update({
    where: { id: parsed.data.studentId },
    data: { tutorScore: parsed.data.score },
  });
  await recalcStudent(parsed.data.studentId);

  // Feedback bahosi (1-5) → tutorScore. Grant ballini qayta hisoblaydi.
  await prisma.student.update({
    where: { id: parsed.data.studentId },
    data: { tutorScore: parsed.data.score },
  });
  await recalcStudent(parsed.data.studentId);

  await prisma.activityLog.create({
    data: {
      studentId: parsed.data.studentId,
      action: 'MENTOR_FEEDBACK',
      meta: { mentorId, score: parsed.data.score, updated: !!existing },
    },
  });

  res.status(existing ? 200 : 201).json(fb);
});

// NOTE: tutorScore (grant nizomi "Mentor bahosi", max 5) endi feedback
// bahosidan keladi — yuqoridagi POST /feedback'ga qarang. Eski 5-yo'nalishli
// /tutor-evaluation endpoint olib tashlandi (feedback bilan birlashtirildi).

const disciplineSchema = z.object({ studentId: z.string().uuid(), score: z.number().min(0).max(10) });

mentorRouter.post('/discipline', async (req, res) => {
  const parsed = disciplineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const mentorId = await getMentorId(req.user!.userId);
  if (!mentorId) return res.status(404).json({ error: 'Mentor not found' });

  const owned = await studentBelongsToMentor(parsed.data.studentId, mentorId);
  if (owned === null) return res.status(404).json({ error: 'Student not found' });
  if (!owned) return res.status(403).json({ error: 'Forbidden' });

  await prisma.student.update({ where: { id: parsed.data.studentId }, data: { disciplineScore: parsed.data.score } });
  await recalcStudent(parsed.data.studentId);

  await prisma.activityLog.create({
    data: {
      studentId: parsed.data.studentId,
      action: 'MENTOR_DISCIPLINE',
      meta: { mentorId, score: parsed.data.score },
    },
  });

  res.json({ ok: true });
});
