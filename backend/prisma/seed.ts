import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const UZB_NAMES = [
  'Diyorbek Adashev', 'Sardorbek Tursunov', 'Asilbek Karimov', 'Jasur Rasulov',
  'Bekzod Yusupov', 'Ulug\'bek Mirzayev', 'Otabek Saidov', 'Nodirbek Aliyev',
  'Sherzod Nazarov', 'Akmaljon Toirov', 'Doniyor Egamberdiyev', 'Murodjon Xolmatov',
  'Aziza Karimova', 'Madina Yusupova', 'Shaxnoza Aliyeva', 'Dilnoza Tursunova',
];

async function main() {
  console.log('🌱 Seeding...');

  await prisma.activityLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.apiKey.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin
  await prisma.user.create({
    data: { email: 'admin@pdp.uz', password: passwordHash, role: 'ADMIN' },
  });

  // Mentors
  const mentor1User = await prisma.user.create({
    data: { email: 'mentor1@pdp.uz', password: passwordHash, role: 'MENTOR' },
  });
  const mentor1 = await prisma.mentor.create({
    data: { userId: mentor1User.id, fullName: 'Akmal Karimov' },
  });

  const mentor2User = await prisma.user.create({
    data: { email: 'mentor2@pdp.uz', password: passwordHash, role: 'MENTOR' },
  });
  const mentor2 = await prisma.mentor.create({
    data: { userId: mentor2User.id, fullName: 'Dilshod Tursunov' },
  });

  // Groups
  const g1 = await prisma.group.create({ data: { name: 'SE-101', course: 1, mentorId: mentor1.id } });
  const g2 = await prisma.group.create({ data: { name: 'SE-102', course: 1, mentorId: mentor1.id } });
  const g3 = await prisma.group.create({ data: { name: 'IT-201', course: 2, mentorId: mentor2.id } });

  const groups = [g1, g2, g3];

  // Students
  for (let i = 0; i < UZB_NAMES.length; i++) {
    const name = UZB_NAMES[i];
    const user = await prisma.user.create({
      data: {
        email: `student${i + 1}@pdp.uz`,
        password: passwordHash,
        role: 'STUDENT',
      },
    });

    const gpa = 60 + Math.random() * 40;
    const attendance = 70 + Math.random() * 30;
    const projectScore = Math.random() * 15;
    const activityScore = Math.random() * 10;
    const tutorScore = Math.random() * 5;
    const disciplineScore = Math.random() * 10;
    const employmentBonus = Math.random() < 0.3 ? Math.random() * 10 : 0;

    const academic = (gpa / 100) * 40;
    const att = (attendance / 100) * 20;
    const base = academic + att + projectScore + activityScore + tutorScore + disciplineScore;
    const total = Math.min(base + employmentBonus, 110);
    const status = gpa < 80 ? 'NOT_GRANTED' : total >= 80 ? 'PENDING' : 'NOT_GRANTED';

    await prisma.student.create({
      data: {
        userId: user.id,
        fullName: name,
        groupId: groups[i % groups.length].id,
        gpa,
        attendance,
        projectScore,
        activityScore,
        tutorScore,
        disciplineScore,
        employmentBonus,
        grantScore: total,
        grantStatus: status,
      },
    });
  }

  // API key
  const apiKey = await prisma.apiKey.create({
    data: { name: 'Demo Integration', key: 'em_' + randomBytes(24).toString('hex') },
  });

  console.log('✅ Seed done');
  console.log('   Admin:   admin@pdp.uz / password123');
  console.log('   Mentor:  mentor1@pdp.uz / password123');
  console.log('   Student: student1@pdp.uz / password123');
  console.log('   API key:', apiKey.key);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
