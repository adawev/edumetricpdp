import type { GrantStatus, GrantReason, RiskLevel } from '@prisma/client';

export type StudentScoreInput = {
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  penaltyTotal: number;
  recoveryTotal: number;
  employmentBonus: number;
  paymentOverdue?: boolean;
};

export type ScoreBreakdown = {
  // % qiymatlar (UI uchun)
  academicPct: number;
  attendancePct: number;
  projectPct: number;
  activityPct: number;
  tutorPct: number;
  disciplinePct: number;
  // Ball qiymatlar
  academic: number;
  attendance: number;
  projects: number;
  activity: number;
  tutor: number;
  discipline: number;
  base: number;
  penalty: number;
  recovery: number;
  employment: number;
  total: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function calculateGrantScore(s: StudentScoreInput): ScoreBreakdown {
  const academic = (s.gpa / 100) * 40;
  const attendance = (s.attendance / 100) * 20;
  const projects = clamp(s.projectScore, 0, 15);
  const activity = clamp(s.activityScore, 0, 10);
  const tutor = clamp(s.tutorScore, 0, 5);
  const discipline = clamp(s.disciplineScore, 0, 10);

  const base = academic + attendance + projects + activity + tutor + discipline;
  const penalty = clamp(s.penaltyTotal, 0, 20);
  const recovery = clamp(s.recoveryTotal, 0, Math.min(penalty * 0.5, 10));
  const employment = clamp(s.employmentBonus, 0, 10);

  const total = base - penalty + recovery + employment;

  return {
    academicPct: round1(s.gpa),
    attendancePct: round1(s.attendance),
    projectPct: round1((projects / 15) * 100),
    activityPct: round1((activity / 10) * 100),
    tutorPct: round1((tutor / 5) * 100),
    disciplinePct: round1((discipline / 10) * 100),
    academic: round1(academic),
    attendance: round1(attendance),
    projects: round1(projects),
    activity: round1(activity),
    tutor: round1(tutor),
    discipline: round1(discipline),
    base: round1(base),
    penalty: round1(penalty),
    recovery: round1(recovery),
    employment: round1(employment),
    total: round1(total),
  };
}

export function getGrantDecision(s: StudentScoreInput, currentStatus?: GrantStatus):
  { status: GrantStatus; reason: GrantReason; risk: RiskLevel } {

  const { total } = calculateGrantScore(s);

  // Risk darajasi
  let risk: RiskLevel = 'LOW';
  if (s.gpa < 80 || total < 60) risk = 'HIGH';
  else if (total < 80) risk = 'MEDIUM';

  // To'lov muddati o'tgan
  if (s.paymentOverdue) {
    return { status: 'NOT_GRANTED', reason: 'PAYMENT_OVERDUE', risk: 'HIGH' };
  }

  // Akademik filtr (qattiq)
  if (s.gpa < 80) {
    return { status: 'NOT_GRANTED', reason: 'ACADEMIC_FAIL', risk: 'HIGH' };
  }

  // Past ball
  if (total < 80) {
    return { status: 'NOT_GRANTED', reason: 'LOW_SCORE', risk };
  }

  // Admin allaqachon grant bergan bo'lsa, saqlab qolamiz
  if (currentStatus === 'GRANTED') {
    return { status: 'GRANTED', reason: 'GRANTED_OK', risk };
  }

  return { status: 'PENDING', reason: 'OK', risk };
}

// Backwards-compat
export function getGrantStatus(s: StudentScoreInput): GrantStatus {
  return getGrantDecision(s).status;
}
