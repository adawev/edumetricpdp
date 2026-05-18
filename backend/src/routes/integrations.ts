import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireApiKey } from '../middleware/auth.js';
import { recalcStudent } from '../services/studentScore.js';

export const integrationsRouter = Router();
integrationsRouter.use(requireApiKey);

/**
 * Davomat qabul qilish. Ikki format qo'llab-quvvatlanadi:
 *
 * 1) Flat bulk (oddiy):
 *    { records: [{ studentId, date, status }] }
 *
 * 2) LMS nested (Asilbek sample'idek):
 *    { student: { id }, attendance_summary: { attendance_percentage },
 *      subjects: [{ subject_id, subject_name, subject_summary, logs }] }
 *
 *    Bu holda umumiy % bevosita olinadi (yoki summary'dan, yoki log'lardan hisoblanadi),
 *    raw payload to'liq holicha lmsData ustuniga saqlanadi.
 */

const flatSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    date: z.string().datetime(),
    status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
  })).min(1),
});

const lmsLogSchema = z.object({
  date: z.string(),
  time: z.string().optional(),
  status: z.string(),
  reason: z.string().nullable().optional(),
});

const lmsSubjectSchema = z.object({
  subject_id: z.string().optional(),
  subject_name: z.string().optional(),
  teacher: z.string().optional(),
  subject_summary: z.object({
    total: z.number(),
    attended: z.number(),
    absent: z.number().optional(),
    percentage: z.number(),
  }).optional(),
  logs: z.array(lmsLogSchema).optional(),
});

const lmsAttendanceSchema = z.object({
  student: z.object({
    id: z.string(),
  }).passthrough(),
  attendance_summary: z.object({
    total_lessons: z.number().optional(),
    attended: z.number().optional(),
    absent: z.number().optional(),
    attendance_percentage: z.number(),
  }),
  subjects: z.array(lmsSubjectSchema).optional(),
}).passthrough();

integrationsRouter.post('/attendance', async (req, res) => {
  // 1) Flat format
  const flat = flatSchema.safeParse(req.body);
  if (flat.success) {
    const touched = new Set<string>();
    for (const r of flat.data.records) {
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
      const pct = all.length ? (present / all.length) * 100 : 0;
      await prisma.student.update({ where: { id: studentId }, data: { attendance: pct } });
      await recalcStudent(studentId);
    }
    return res.json({ ok: true, format: 'flat', processed: flat.data.records.length });
  }

  // 2) LMS nested format
  const lms = lmsAttendanceSchema.safeParse(req.body);
  if (lms.success) {
    const studentId = lms.data.student.id;
    const exists = await prisma.student.findUnique({ where: { id: studentId } });
    if (!exists) return res.status(404).json({ error: `Student not found: ${studentId}` });

    await prisma.student.update({
      where: { id: studentId },
      data: {
        attendance: lms.data.attendance_summary.attendance_percentage,
        lmsData: req.body as any,
      },
    });

    // Log'larni AttendanceRecord'ga ham yozamiz (subject yo'q, oddiy)
    if (lms.data.subjects) {
      for (const subj of lms.data.subjects) {
        for (const log of subj.logs ?? []) {
          const date = new Date(log.date);
          if (isNaN(date.getTime())) continue;
          const status = log.status === 'attended' ? 'PRESENT'
                       : log.reason && /Kasalligi|sababli|ma'lumotnoma/i.test(log.reason) ? 'EXCUSED'
                       : 'ABSENT';
          await prisma.attendanceRecord.upsert({
            where: { studentId_date: { studentId, date } },
            update: { status },
            create: { studentId, date, status },
          });
        }
      }
    }

    await recalcStudent(studentId);
    return res.json({ ok: true, format: 'lms', studentId });
  }

  res.status(400).json({
    error: 'Invalid payload. Qabul qilinadi: flat {records:[...]} yoki LMS {student, attendance_summary, subjects}',
    flatIssues: flat.error.issues.slice(0, 3),
    lmsIssues: lms.error.issues.slice(0, 3),
  });
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
