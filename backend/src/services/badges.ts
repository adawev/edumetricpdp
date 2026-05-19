import { prisma } from '../lib/prisma.js';

export type BadgeSlug =
  | 'champion' | 'top3' | 'top10'
  | 'academic_star' | 'perfect_attendance'
  | 'polyglot' | 'founder' | 'mentor' | 'employed'
  | 'grant_keeper' | 'collector' | 'streak';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeDef = {
  slug: BadgeSlug;
  name: string;
  icon: string;
  category: 'compete' | 'academic' | 'activity' | 'aggregate';
  rarity: BadgeRarity;
  color: string;
  description: string;
  howToEarn: string;
};

export const BADGE_CATALOG: BadgeDef[] = [
  // ===== LEGENDARY (eng noyob — 4 ta) =====
  { slug: 'champion',           name: 'Champion',           icon: '🏆', category: 'compete',   rarity: 'legendary', color: '#f59e0b',
    description: 'Nufuzli musobaqada sovrinli o\'rinni egallagan talaba.',
    howToEarn: 'Hackathon yoki musobaqada 1, 2 yoki 3-o\'rin (yutug\'ingiz uchun admin ≥ 5 ball berishi kerak).' },
  { slug: 'top3',               name: 'Top 3',              icon: '🥇', category: 'compete',   rarity: 'legendary', color: '#eab308',
    description: 'Universitet reytingida birinchi uchlikda.',
    howToEarn: 'Umumiy reytingda #1, #2 yoki #3 o\'rinni egallang.' },
  { slug: 'grant_keeper',       name: 'Grant Saqlovchi',    icon: '🎓', category: 'aggregate', rarity: 'legendary', color: '#059669',
    description: 'Joriy semestrda grant olgan talaba.',
    howToEarn: 'Status\'ingiz GRANTED bo\'lsin (komissiya tasdiqlagan).' },
  { slug: 'founder',            name: 'Founder',            icon: '🚀', category: 'activity',  rarity: 'legendary', color: '#ec4899',
    description: 'Real ishlovchi startup ishlab chiqqan va himoya qilgan.',
    howToEarn: 'Startup loyiha uchun admin ≥ 6 ball berishi kerak (real prototip + prezentatsiya).' },

  // ===== EPIC (kam uchraydigan — 4 ta) =====
  { slug: 'academic_star',      name: 'Akademik Yulduz',    icon: '📚', category: 'academic',  rarity: 'epic',      color: '#2563eb',
    description: 'GPA 96% va undan yuqori — eng yaxshi o\'quvchilardan biri.',
    howToEarn: 'Semestr GPA\'ngiz 96% va undan yuqori bo\'lsin.' },
  { slug: 'polyglot',           name: 'Polyglot',           icon: '🌍', category: 'activity',  rarity: 'epic',      color: '#06b6d4',
    description: 'Yuqori darajadagi xalqaro til sertifikatiga ega.',
    howToEarn: 'IELTS 7.0+ yoki shunga teng sertifikat (admin ≥ 4 ball berishi kerak).' },
  { slug: 'top10',              name: 'Top 10',             icon: '⭐', category: 'compete',   rarity: 'epic',      color: '#8b5cf6',
    description: 'Universitet reytingida birinchi o\'nlikda.',
    howToEarn: 'Umumiy reytingda #4–#10 o\'rinni egallang.' },
  { slug: 'streak',             name: 'Yutuvchi seriya',    icon: '🔥', category: 'aggregate', rarity: 'epic',      color: '#ef4444',
    description: 'Oxirgi 3 oyda 5+ tasdiqlangan yutuq.',
    howToEarn: 'So\'nggi 3 oy ichida kamida 5 ta yutuqni admin tasdiqlasin.' },

  // ===== RARE (o'rta — 2 ta) =====
  { slug: 'collector',          name: 'Kolleksioner',       icon: '📜', category: 'aggregate', rarity: 'rare',      color: '#d97706',
    description: '8 va undan ko\'p tasdiqlangan yutuq.',
    howToEarn: 'Kamida 8 ta yutuqni admin tasdiqlasin.' },
  { slug: 'mentor',             name: 'Mentor',             icon: '🤝', category: 'activity',  rarity: 'rare',      color: '#7c3aed',
    description: 'Boshqa talabalarga ustozlik qilgan.',
    howToEarn: 'Mentorlik yutug\'ingiz uchun admin ≥ 3 ball berishi kerak (kamida 3 talabaga ustozlik).' },

  // ===== COMMON (osonroq — 2 ta) =====
  { slug: 'employed',           name: 'Ishchi',             icon: '💼', category: 'activity',  rarity: 'common',    color: '#0891b2',
    description: 'IT sohada part-time yoki full-time ish.',
    howToEarn: 'Employment bonus 5 va undan yuqori bo\'lsin (internship emas, real ish).' },
  { slug: 'perfect_attendance', name: '100% Davomat',       icon: '🎯', category: 'academic',  rarity: 'common',    color: '#10b981',
    description: 'Hech qaysi darsni qoldirmagan talaba.',
    howToEarn: 'Bir semestr davomida 100% davomat ko\'rsating.' },
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

  // LEGENDARY
  if (approved.some(a => a.type === 'HACKATHON' && a.ball >= 5)) earned.push({ slug: 'champion', at: now });
  if (rank >= 1 && rank <= 3)                                    earned.push({ slug: 'top3', at: now });
  if (student.grantStatus === 'GRANTED')                         earned.push({ slug: 'grant_keeper', at: now });
  if (approved.some(a => a.type === 'STARTUP' && a.ball >= 6))   earned.push({ slug: 'founder', at: now });

  // EPIC
  if (student.gpa >= 96)                                         earned.push({ slug: 'academic_star', at: now });
  if (approved.some(a => a.type === 'LANGUAGE' && a.ball >= 4))  earned.push({ slug: 'polyglot', at: now });
  if (rank >= 4 && rank <= 10)                                   earned.push({ slug: 'top10', at: now });
  if (recentApproved.length >= 5)                                earned.push({ slug: 'streak', at: now });

  // RARE
  if (approved.length >= 8)                                      earned.push({ slug: 'collector', at: now });
  if (approved.some(a => a.type === 'MENTORING' && a.ball >= 3)) earned.push({ slug: 'mentor', at: now });

  // COMMON
  if (student.employmentBonus >= 5)                              earned.push({ slug: 'employed', at: now });
  if (student.attendance >= 100)                                 earned.push({ slug: 'perfect_attendance', at: now });

  return earned.map(e => {
    const def = BADGE_CATALOG.find(b => b.slug === e.slug)!;
    return { ...def, earnedAt: e.at.toISOString() };
  });
}
