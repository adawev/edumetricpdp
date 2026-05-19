import { prisma } from '../lib/prisma.js';

// 6 ta badge — universitet uchun soddalashtirilgan ro'yxat
export type BadgeSlug =
  | 'champion' | 'top3' | 'grant_keeper'
  | 'founder' | 'polyglot' | 'mentor';

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
  { slug: 'champion',     name: 'Champion',        icon: '🏆', category: 'compete',   rarity: 'legendary', color: '#f59e0b',
    description: 'Nufuzli musobaqada sovrinli o\'rinni egallagan talaba.',
    howToEarn: 'Hackathon yoki musobaqada 1, 2 yoki 3-o\'rin (yutuq uchun admin ≥ 5 ball berishi kerak).' },
  { slug: 'top3',         name: 'Top 3',           icon: '🥇', category: 'compete',   rarity: 'legendary', color: '#eab308',
    description: 'Universitet reytingida birinchi uchlikda.',
    howToEarn: 'Umumiy reytingda #1, #2 yoki #3 o\'rinni egallang.' },
  { slug: 'grant_keeper', name: 'Grant Saqlovchi', icon: '🎓', category: 'aggregate', rarity: 'legendary', color: '#059669',
    description: 'Joriy semestrda grant olgan talaba.',
    howToEarn: 'Komissiya grant qarorini tasdiqlasin (GPA ≥ 80, ball ≥ 80).' },
  { slug: 'founder',      name: 'Founder',         icon: '🚀', category: 'activity',  rarity: 'epic',      color: '#ec4899',
    description: 'Real ishlovchi startup ishlab chiqqan va himoya qilgan.',
    howToEarn: 'Startup yutuq uchun admin ≥ 6 ball berishi kerak (prototip + prezentatsiya).' },
  { slug: 'polyglot',     name: 'Polyglot',        icon: '🌍', category: 'activity',  rarity: 'epic',      color: '#06b6d4',
    description: 'Yuqori darajadagi xalqaro til sertifikatiga ega.',
    howToEarn: 'IELTS 7.0+ yoki shunga teng sertifikat (admin ≥ 4 ball).' },
  { slug: 'mentor',       name: 'Mentor',          icon: '🤝', category: 'activity',  rarity: 'rare',      color: '#7c3aed',
    description: 'Boshqa talabalarga ustozlik qilgan.',
    howToEarn: 'Mentorlik yutuq uchun admin ≥ 3 ball berishi kerak (kamida 3 talabaga).' },
];

// Audit trail — har badge nima sababli berildi
export type EarnedBadge = BadgeDef & { earnedAt: string; evidence?: string };

export async function computeBadgesForStudent(studentId: string): Promise<EarnedBadge[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { achievements: true },
  });
  if (!student) return [];

  const all = await prisma.student.findMany({ orderBy: { grantScore: 'desc' }, select: { id: true } });
  const rank = all.findIndex(s => s.id === studentId) + 1;
  const approved = student.achievements.filter(a => a.status === 'APPROVED');
  const now = new Date();
  const result: EarnedBadge[] = [];

  const find = (type: string, minBall: number) =>
    approved.find(a => a.type === type && a.ball >= minBall);

  const champA = find('HACKATHON', 5);
  if (champA) result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'champion')!,
    earnedAt: (champA.reviewedAt ?? champA.createdAt).toISOString(),
    evidence: `${champA.title} (${champA.ball} ball)`,
  });

  if (rank >= 1 && rank <= 3) result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'top3')!,
    earnedAt: now.toISOString(),
    evidence: `Reyting: #${rank} / ${all.length}`,
  });

  if (student.grantStatus === 'GRANTED') result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'grant_keeper')!,
    earnedAt: now.toISOString(),
    evidence: `Joriy semestr granti, ball: ${Math.round(student.grantScore * 10) / 10}`,
  });

  const foundA = find('STARTUP', 6);
  if (foundA) result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'founder')!,
    earnedAt: (foundA.reviewedAt ?? foundA.createdAt).toISOString(),
    evidence: `${foundA.title} (${foundA.ball} ball)`,
  });

  const polyA = find('LANGUAGE', 4);
  if (polyA) result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'polyglot')!,
    earnedAt: (polyA.reviewedAt ?? polyA.createdAt).toISOString(),
    evidence: `${polyA.title} (${polyA.ball} ball)`,
  });

  const mentA = find('MENTORING', 3);
  if (mentA) result.push({
    ...BADGE_CATALOG.find(b => b.slug === 'mentor')!,
    earnedAt: (mentA.reviewedAt ?? mentA.createdAt).toISOString(),
    evidence: `${mentA.title} (${mentA.ball} ball)`,
  });

  return result;
}
