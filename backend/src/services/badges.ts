import { prisma } from '../lib/prisma.js';

export type BadgeSlug =
  | 'champion' | 'top3' | 'top10'
  | 'academic_star' | 'perfect_attendance'
  | 'polyglot' | 'founder' | 'mentor' | 'employed'
  | 'grant_keeper' | 'collector' | 'streak';

export type BadgeDef = {
  slug: BadgeSlug;
  name: string;
  icon: string;       // emoji ko'rinishi, frontend o'zining icon'ini ham ishlata oladi
  category: 'compete' | 'academic' | 'activity' | 'aggregate';
  color: string;      // hex
  description: string;
  howToEarn: string;
};

export const BADGE_CATALOG: BadgeDef[] = [
  // Musobaqa
  { slug: 'champion',           name: 'Champion',           icon: '🏆', category: 'compete',  color: '#f59e0b',
    description: 'Hackathon yoki musobaqada g\'olib bo\'lgan talaba.',
    howToEarn: 'Admin tomonidan tasdiqlangan musobaqa yutug\'ida 3+ ball oling.' },
  { slug: 'top3',               name: 'Top 3',              icon: '🥇', category: 'compete',  color: '#eab308',
    description: 'Universitet reytingida birinchi uchlikda.',
    howToEarn: 'Umumiy reytingda #1, #2 yoki #3 o\'rinni egallang.' },
  { slug: 'top10',              name: 'Top 10',             icon: '⭐', category: 'compete',  color: '#8b5cf6',
    description: 'Universitet reytingida birinchi o\'nlikda.',
    howToEarn: 'Umumiy reytingda #4–#10 o\'rinda turing.' },

  // Akademik
  { slug: 'academic_star',      name: 'Akademik Yulduz',    icon: '📚', category: 'academic', color: '#2563eb',
    description: 'GPA 95% va undan yuqori.',
    howToEarn: 'Semestr GPA\'ngizni 95% va undan yuqori darajada saqlang.' },
  { slug: 'perfect_attendance', name: '100% Davomat',       icon: '🎯', category: 'academic', color: '#10b981',
    description: 'Hech qaysi darsni qoldirmagan talaba.',
    howToEarn: 'Bir semestr davomida 100% davomat ko\'rsating.' },

  // Faollik
  { slug: 'polyglot',           name: 'Polyglot',           icon: '🌍', category: 'activity', color: '#06b6d4',
    description: 'Xalqaro til sertifikatiga ega.',
    howToEarn: 'IELTS, CEFR yoki shunga o\'xshash sertifikatni admin tasdiqlagandan keyin.' },
  { slug: 'founder',            name: 'Founder',            icon: '🚀', category: 'activity', color: '#ec4899',
    description: 'O\'z startupini ishlab chiqqan va himoya qilgan.',
    howToEarn: 'Startup yutug\'ingizni admin tasdiqlasin.' },
  { slug: 'mentor',             name: 'Mentor',             icon: '🤝', category: 'activity', color: '#7c3aed',
    description: 'Boshqa talabalarga ustozlik qilgan.',
    howToEarn: 'Mentorlik yutug\'ingizni admin tasdiqlasin.' },
  { slug: 'employed',           name: 'Ishchi',             icon: '💼', category: 'activity', color: '#0891b2',
    description: 'IT sohada rasmiy ishga joylashgan.',
    howToEarn: 'Employment bonus oling (internship, part-time yoki full-time).' },

  // Jamlovchi
  { slug: 'grant_keeper',       name: 'Grant Saqlovchi',    icon: '🎓', category: 'aggregate', color: '#059669',
    description: 'Joriy semestrda grant olgan.',
    howToEarn: 'Status\'ingiz GRANTED bo\'lsin.' },
  { slug: 'collector',          name: 'Sertifikat to\'plovchi', icon: '📜', category: 'aggregate', color: '#d97706',
    description: '5 va undan ko\'p tasdiqlangan yutuq.',
    howToEarn: 'Kamida 5 ta yutuqni admin tasdiqlasin.' },
  { slug: 'streak',             name: 'Yutuvchi seriya',    icon: '🔥', category: 'aggregate', color: '#ef4444',
    description: 'Oxirgi 3 oyda 3+ tasdiqlangan yutuq.',
    howToEarn: 'Oxirgi 3 oy ichida kamida 3 ta yutuqni tasdiqlattiring.' },
];

export type EarnedBadge = BadgeDef & { earnedAt: string };

export async function computeBadgesForStudent(studentId: string): Promise<EarnedBadge[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { achievements: true },
  });
  if (!student) return [];

  // Universitet reytingidagi o'rin
  const all = await prisma.student.findMany({ orderBy: { grantScore: 'desc' }, select: { id: true } });
  const rank = all.findIndex(s => s.id === studentId) + 1;

  const approved = student.achievements.filter(a => a.status === 'APPROVED');
  const hasApproved = (predicate: (t: string) => boolean) =>
    approved.some(a => predicate(a.type));

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000);
  const recentApproved = approved.filter(a => a.reviewedAt && a.reviewedAt > threeMonthsAgo);

  const earned: { slug: BadgeSlug; at: Date }[] = [];

  if (approved.some(a => a.type === 'HACKATHON' && a.ball >= 3)) earned.push({ slug: 'champion', at: now });
  if (rank >= 1 && rank <= 3)                                    earned.push({ slug: 'top3', at: now });
  if (rank >= 4 && rank <= 10)                                   earned.push({ slug: 'top10', at: now });
  if (student.gpa >= 95)                                         earned.push({ slug: 'academic_star', at: now });
  if (student.attendance >= 100)                                 earned.push({ slug: 'perfect_attendance', at: now });
  if (hasApproved(t => t === 'LANGUAGE'))                        earned.push({ slug: 'polyglot', at: now });
  if (hasApproved(t => t === 'STARTUP'))                         earned.push({ slug: 'founder', at: now });
  if (hasApproved(t => t === 'MENTORING'))                       earned.push({ slug: 'mentor', at: now });
  if (student.employmentBonus > 0)                               earned.push({ slug: 'employed', at: now });
  if (student.grantStatus === 'GRANTED')                         earned.push({ slug: 'grant_keeper', at: now });
  if (approved.length >= 5)                                      earned.push({ slug: 'collector', at: now });
  if (recentApproved.length >= 3)                                earned.push({ slug: 'streak', at: now });

  return earned.map(e => {
    const def = BADGE_CATALOG.find(b => b.slug === e.slug)!;
    return { ...def, earnedAt: e.at.toISOString() };
  });
}
