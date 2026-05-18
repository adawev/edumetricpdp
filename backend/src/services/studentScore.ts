import { prisma } from '../lib/prisma.js';
import { calculateGrantScore, getGrantStatus } from './grantEngine.js';

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
  };

  const breakdown = calculateGrantScore(input);
  const status = getGrantStatus(input);

  return prisma.student.update({
    where: { id: studentId },
    data: { grantScore: breakdown.total, grantStatus: status },
  });
}
