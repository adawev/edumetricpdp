import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';
import { calculateGrantScore } from '../services/grantEngine.js';
import { upload } from '../lib/upload.js';
import { computeBadgesForStudent } from '../services/badges.js';

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
  fileUrl: z.string().optional(),  // /uploads/... yoki https://... ham bo'lishi mumkin
});

// Achievement yaratish — JSON yoki multipart/form-data (fayl bilan)
studentRouter.post(
  '/me/achievements',
  requireRole('STUDENT'),
  upload.single('file'),
  async (req, res) => {
    // Form-data bo'lsa, body string sifatida keladi; JSON bo'lsa parse qilingan
    const body = req.body ?? {};
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : body.fileUrl;

    const parsed = achievementSchema.safeParse({
      type: body.type,
      title: body.title,
      description: body.description,
      fileUrl,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', detail: parsed.error.issues });
    }

    const id = await getMyStudentId(req.user!.userId);
    if (!id) return res.status(404).json({ error: 'Student not found' });

    const achievement = await prisma.achievement.create({
      data: { ...parsed.data, studentId: id },
    });
    await prisma.activityLog.create({
      data: { studentId: id, action: 'achievement.created', meta: { id: achievement.id, type: achievement.type } },
    });
    res.status(201).json(achievement);
  },
);

// Talabaning o'z reytingi (guruh / kurs / universitet)
studentRouter.get('/me/rankings', requireRole('STUDENT'), async (req, res) => {
  const me = await prisma.student.findUnique({
    where: { userId: req.user!.userId },
    include: { group: true },
  });
  if (!me) return res.status(404).json({ error: 'Student not found' });

  const [groupList, courseList, universityList] = await Promise.all([
    prisma.student.findMany({ where: { groupId: me.groupId }, orderBy: { grantScore: 'desc' }, select: { id: true } }),
    prisma.student.findMany({ where: { group: { course: me.group.course } }, orderBy: { grantScore: 'desc' }, select: { id: true } }),
    prisma.student.findMany({ orderBy: { grantScore: 'desc' }, select: { id: true } }),
  ]);

  const rank = (list: { id: string }[]) => list.findIndex(s => s.id === me.id) + 1;
  res.json({
    group:      { rank: rank(groupList),      total: groupList.length,      name: me.group.name },
    course:     { rank: rank(courseList),     total: courseList.length,     course: me.group.course },
    university: { rank: rank(universityList), total: universityList.length },
  });
});

// Public profile (login bo'lgan har kim ko'ra oladi)
studentRouter.get('/:id/public', async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      group: true,
      achievements: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!student) return res.status(404).json({ error: 'Not found' });

  // Universitet reytingidagi o'rin
  const all = await prisma.student.findMany({ orderBy: { grantScore: 'desc' }, select: { id: true } });
  const rank = all.findIndex(s => s.id === student.id) + 1;

  res.json({
    id: student.id,
    fullName: student.fullName,
    group: student.group.name,
    course: student.group.course,
    grantScore: Math.round(student.grantScore * 10) / 10,
    grantStatus: student.grantStatus,
    grantReason: student.grantReason,
    riskLevel: student.riskLevel,
    rank: { university: rank, total: all.length },
    achievements: student.achievements.map(a => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      fileUrl: a.fileUrl,
      ball: a.ball,
      createdAt: a.createdAt,
    })),
    badges: await computeBadgesForStudent(student.id),
  });
});

// Talabaning shaxsiy badge'lari + pinned
studentRouter.get('/me/badges', requireRole('STUDENT'), async (req, res) => {
  const me = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  if (!me) return res.status(404).json({ error: 'Student not found' });
  const badges = await computeBadgesForStudent(me.id);
  res.json({ earned: badges, pinnedSlug: me.pinnedBadge });
});

// Reytingda ko'rinadigan badge'ni tanlash
studentRouter.put('/me/pinned-badge', requireRole('STUDENT'), async (req, res) => {
  const schema = z.object({ slug: z.string().nullable() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const me = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  if (!me) return res.status(404).json({ error: 'Student not found' });

  // Tanlangan badge talabaning haqiqatan olganmi tekshirish
  if (parsed.data.slug) {
    const earned = await computeBadgesForStudent(me.id);
    if (!earned.some(b => b.slug === parsed.data.slug)) {
      return res.status(400).json({ error: 'Bu badge sizda yo\'q' });
    }
  }

  await prisma.student.update({ where: { id: me.id }, data: { pinnedBadge: parsed.data.slug } });
  res.json({ ok: true, pinnedBadge: parsed.data.slug });
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

studentRouter.get('/:id/score', requireRole('ADMIN', 'MENTOR'), async (req, res) => {
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
