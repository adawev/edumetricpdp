import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireApiKey } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';

export const integrationsRouter = Router();
integrationsRouter.use(requireApiKey);

const attendanceSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    date: z.string().datetime(),
    status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
  })).min(1),
});

integrationsRouter.post('/attendance', async (req, res) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', detail: parsed.error.issues });

  const touched = new Set<string>();
  for (const r of parsed.data.records) {
    const date = new Date(r.date);
    await prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId: r.studentId, date } },
      update: { status: r.status },
      create: { studentId: r.studentId, date, status: r.status },
    });
    touched.add(r.studentId);
  }

  for (const studentId of touched) {
    const all = await prisma.attendanceRecord.findMany({ where: { studentId } });
    const present = all.filter(a => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
    const attendancePct = all.length ? (present / all.length) * 100 : 0;
    await prisma.student.update({ where: { id: studentId }, data: { attendance: attendancePct } });
    await recalcStudent(studentId);
  }

  res.json({ ok: true, processed: parsed.data.records.length });
});

const gradesSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    gpa: z.number().min(0).max(100).optional(),
    projectScore: z.number().min(0).max(15).optional(),
  })).min(1),
});

integrationsRouter.post('/grades', async (req, res) => {
  const parsed = gradesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', detail: parsed.error.issues });

  for (const r of parsed.data.records) {
    await prisma.student.update({
      where: { id: r.studentId },
      data: {
        ...(r.gpa !== undefined && { gpa: r.gpa }),
        ...(r.projectScore !== undefined && { projectScore: r.projectScore }),
      },
    });
    await recalcStudent(r.studentId);
  }

  res.json({ ok: true, processed: parsed.data.records.length });
});
