export type GrantStatus = 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
export type GrantReason = 'OK' | 'GRANTED_OK' | 'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AchievementType =
  | 'CERTIFICATE' | 'HACKATHON' | 'STARTUP' | 'EMPLOYMENT'
  | 'MENTORING' | 'LANGUAGE' | 'COURSE' | 'VOLUNTEER' | 'OTHER';
export type AchievementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ScoreBreakdown {
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
}

export interface Group {
  id: string;
  name: string;
  course: number;
  mentor?: { fullName: string };
}

export interface Penalty {
  id: string;
  type: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  ball: number;
  reason: string;
  recovered: number;
  recoveryTask?: string | null;
  recoveryDone: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  employmentBonus: number;
  grantScore: number;
  grantStatus: GrantStatus;
  grantReason: GrantReason;
  riskLevel: RiskLevel;
  paymentOverdue: boolean;
  pinnedBadge?: string | null;
  profilePublic?: boolean;
  group: Group;
  penalties: Penalty[];
}

export interface StudentMeResponse {
  student: Student;
  breakdown: ScoreBreakdown;
}

export interface Achievement {
  id: string;
  studentId: string;
  type: AchievementType;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  ball: number;
  status: AchievementStatus;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface Feedback {
  id: string;
  studentId: string;
  mentorId: string;
  text: string;
  score: number;
  createdAt: string;
  mentor: { fullName: string };
}

export interface RankInfo {
  rank: number;
  total: number;
  name?: string;
  course?: number;
}

export interface Rankings {
  group: RankInfo;
  course: RankInfo;
  university: RankInfo;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface StudentBadge {
  slug: string;
  name: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
  category: string;
  description: string;
  howToEarn: string;
}

export interface PublicAchievement {
  id: string;
  type: AchievementType;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  ball: number;
  createdAt: string;
}

export interface StudentPublicProfile {
  id: string;
  fullName: string;
  group: string;
  course: number;
  grantScore: number;
  grantStatus: GrantStatus;
  grantReason: GrantReason;
  riskLevel: RiskLevel;
  rank: { university: number; total: number };
  achievements: PublicAchievement[];
  badges: StudentBadge[];
}

export interface PublicRatingRow {
  rank: number;
  id: string;
  fullName: string;
  group: string;
  grantScore: number;
  grantStatus: GrantStatus;
  grantReason: GrantReason;
  riskLevel: RiskLevel;
  badge: { slug: string; name: string; icon: string; color: string; rarity: BadgeRarity } | null;
  badgeCount: number;
}
