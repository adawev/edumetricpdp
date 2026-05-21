import { prisma } from '../lib/prisma.js';
import { calculateGrantScore, getGrantDecision } from './grantEngine.js';

export async function recalcStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { penalties: true, achievements: { where: { status: 'APPROVED' } } },
  });
  if (!student) return null;

  const penaltyTotal = student.penalties.reduce((s, p) => s + p.ball, 0);
  const recoveryTotal = student.penalties.reduce((s, p) => s + p.recovered, 0);

  const input = {
    gpa: student.gpa,
    attendance: student.attendance,
    projectScore: student.projectScore,
    activityScore: student.activityScore,
    tutorScore: student.tutorScore,
    disciplineScore: student.disciplineScore,
    penaltyTotal,
    recoveryTotal,
    employmentBonus: student.employmentBonus,
    paymentOverdue: student.paymentOverdue,
  };

  const breakdown = calculateGrantScore(input);
  const decision = getGrantDecision(input, student.grantStatus);

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: {
      grantScore: breakdown.total,
      grantStatus: decision.status,
      grantReason: decision.reason,
      riskLevel: decision.risk,
      lastRecalc: new Date(),
    },
  });

  // Kuniga bir marta snapshot saqlash (growth chart uchun)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.scoreSnapshot.findFirst({
    where: { studentId, createdAt: { gte: today } },
  });
  if (!existing) {
    await prisma.scoreSnapshot.create({
      data: { studentId, score: breakdown.total, gpa: student.gpa },
    });
  }

  return updated;
}
