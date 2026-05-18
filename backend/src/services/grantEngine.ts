import type { GrantStatus } from '@prisma/client';

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
};

export type ScoreBreakdown = {
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

  return { academic, attendance, projects, activity, tutor, discipline, base, penalty, recovery, employment, total };
}

export function getGrantStatus(s: StudentScoreInput): GrantStatus {
  if (s.gpa < 80) return 'NOT_GRANTED';
  const { total } = calculateGrantScore(s);
  if (total >= 80) return 'PENDING';
  return 'NOT_GRANTED';
}
