import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Demo uchun har xil senariy: yuqori ball + GPA OK → kandidat; yuqori ball lekin GPA past → ACADEMIC_FAIL;
// to'lov muddati o'tgan; allaqachon grant berilgan; penalty + recovery
type Scenario =
  | 'TOP_GRANTED'        // GPA 90+, ball 90+, allaqachon GRANTED
  | 'CANDIDATE'          // GPA 80+, ball 80+, PENDING
  | 'ACADEMIC_FAIL'      // GPA < 80, ball baribir baland
  | 'LOW_SCORE'          // GPA 80+, lekin ball < 80
  | 'PAYMENT_OVERDUE'    // to'lov kechikkan
  | 'WITH_PENALTY'       // jarima + reabilitatsiya
  | 'RANDOM';            // qolganlari random

type StudentSpec = { name: string; scenario: Scenario };

const STUDENTS: StudentSpec[] = [
  { name: 'Madina Yusupova',        scenario: 'TOP_GRANTED' },
  { name: 'Diyorbek Adashev',       scenario: 'TOP_GRANTED' },
  { name: 'Sardorbek Tursunov',     scenario: 'CANDIDATE' },
  { name: 'Asilbek Karimov',        scenario: 'CANDIDATE' },
  { name: 'Aziza Karimova',         scenario: 'CANDIDATE' },
  { name: 'Jasur Rasulov',          scenario: 'ACADEMIC_FAIL' },
  { name: 'Bekzod Yusupov',         scenario: 'ACADEMIC_FAIL' },
  { name: 'Otabek Saidov',          scenario: 'LOW_SCORE' },
  { name: 'Nodirbek Aliyev',        scenario: 'LOW_SCORE' },
  { name: 'Ulug\'bek Mirzayev',     scenario: 'PAYMENT_OVERDUE' },
  { name: 'Sherzod Nazarov',        scenario: 'WITH_PENALTY' },
  { name: 'Akmaljon Toirov',        scenario: 'WITH_PENALTY' },
  { name: 'Doniyor Egamberdiyev',   scenario: 'RANDOM' },
  { name: 'Murodjon Xolmatov',      scenario: 'RANDOM' },
  { name: 'Shaxnoza Aliyeva',       scenario: 'RANDOM' },
  { name: 'Dilnoza Tursunova',      scenario: 'RANDOM' },
];

// --- Katta hajmli talabalar generatori (har xil statistikali ~200 ta) ---
const FIRST_M = [
  'Diyor','Akmal','Bekzod','Sardor','Asilbek','Otabek','Nodir','Jasur','Sherzod','Doniyor',
  'Murod','Ulug\'bek','Javohir','Ibrohim','Shoxruh','Aziz','Olim','Bahodir','Rustam','Davron',
  'Farrux','Anvar','Komil','Mansur','Nurbek','Oybek','Qaxramon','Sanjar','Shavkat','Sirojiddin',
  'Temur','Umid','Xurshid','Yusuf','Zafar','Ali','Vali','Hasan','Husan','Ravshan',
  'Bobur','Eldor','Erkin','Islom','Karim','Lochin','Mirjalol','Sherali','Toxir','Zoxid',
];
const FIRST_F = [
  'Madina','Aziza','Shaxnoza','Dilnoza','Nilufar','Gulnoza','Mohira','Sevinch','Zarina','Malika',
  'Marjona','Feruza','Lola','Mehribon','Munisa','Sabina','Saodat','Yulduz','Charos','Diyora',
  'Nargiza','Komila','Shahzoda','Robiya','Iroda','Dilfuza','Maftuna','Nodira','Aygul','Mavluda',
];
const LAST = [
  'Karimov','Tursunov','Yusupov','Aliyev','Saidov','Nazarov','Rasulov','Mirzayev','Toirov','Aliev',
  'Egamberdiyev','Xolmatov','Adashev','Sodiqov','Ergashev','Ismoilov','Jabborov','Qodirov','Mamatov','Otaboev',
  'Rahimov','Salimov','Tashkentov','Umarov','Xudayberganov','Yo\'ldoshev','Zokirov','Bobomurodov','Choriyev','Davlatov',
];

function makeRandomStudents(n: number): StudentSpec[] {
  const out: StudentSpec[] = [];
  const scenarios: Scenario[] = [
    'TOP_GRANTED','TOP_GRANTED',
    'CANDIDATE','CANDIDATE','CANDIDATE','CANDIDATE','CANDIDATE',
    'ACADEMIC_FAIL','ACADEMIC_FAIL',
    'LOW_SCORE','LOW_SCORE',
    'PAYMENT_OVERDUE',
    'WITH_PENALTY','WITH_PENALTY',
    'RANDOM','RANDOM','RANDOM','RANDOM','RANDOM','RANDOM',
  ];
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    const female = Math.random() < 0.35;
    const first = female ? FIRST_F[Math.floor(Math.random()*FIRST_F.length)] : FIRST_M[Math.floor(Math.random()*FIRST_M.length)];
    const last = LAST[Math.floor(Math.random()*LAST.length)] + (female ? 'a' : '');
    let name = `${first} ${last}`;
    let suffix = 2;
    while (used.has(name)) { name = `${first} ${last} ${suffix++}`; }
    used.add(name);
    const sc = scenarios[Math.floor(Math.random()*scenarios.length)];
    out.push({ name, scenario: sc });
  }
  return out;
}

STUDENTS.push(...makeRandomStudents(200));

type ScoreFields = {
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  employmentBonus: number;
  paymentOverdue: boolean;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function scenarioFields(s: Scenario): ScoreFields {
  switch (s) {
    case 'TOP_GRANTED':
      return { gpa: rand(96, 99), attendance: rand(98, 100), projectScore: rand(13, 15), activityScore: rand(8, 10), tutorScore: rand(4, 5), disciplineScore: rand(9, 10), employmentBonus: rand(7, 10), paymentOverdue: false };
    case 'CANDIDATE':
      return { gpa: rand(82, 90), attendance: rand(85, 95), projectScore: rand(11, 14), activityScore: rand(7, 10), tutorScore: rand(3.5, 5), disciplineScore: rand(8, 10), employmentBonus: rand(0, 5), paymentOverdue: false };
    case 'ACADEMIC_FAIL':
      return { gpa: rand(60, 79), attendance: rand(85, 98), projectScore: rand(12, 15), activityScore: rand(8, 10), tutorScore: rand(4, 5), disciplineScore: rand(8, 10), employmentBonus: rand(5, 10), paymentOverdue: false };
    case 'LOW_SCORE':
      return { gpa: rand(80, 86), attendance: rand(70, 82), projectScore: rand(5, 9), activityScore: rand(2, 5), tutorScore: rand(2, 3.5), disciplineScore: rand(4, 7), employmentBonus: 0, paymentOverdue: false };
    case 'PAYMENT_OVERDUE':
      return { gpa: rand(85, 92), attendance: rand(88, 95), projectScore: rand(11, 14), activityScore: rand(6, 9), tutorScore: rand(3.5, 5), disciplineScore: rand(7, 10), employmentBonus: 0, paymentOverdue: true };
    case 'WITH_PENALTY':
      return { gpa: rand(82, 90), attendance: rand(82, 90), projectScore: rand(10, 13), activityScore: rand(5, 8), tutorScore: rand(3, 4.5), disciplineScore: rand(6, 8), employmentBonus: rand(0, 5), paymentOverdue: false };
    default:
      return { gpa: rand(65, 95), attendance: rand(70, 95), projectScore: rand(5, 14), activityScore: rand(2, 9), tutorScore: rand(2, 5), disciplineScore: rand(5, 10), employmentBonus: rand(0, 8), paymentOverdue: false };
  }
}

function decide(f: ScoreFields, total: number, scenario: Scenario):
  { status: 'GRANTED' | 'PENDING' | 'NOT_GRANTED'; reason: 'OK' | 'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE' | 'GRANTED_OK'; risk: 'LOW' | 'MEDIUM' | 'HIGH' } {
  if (f.paymentOverdue) return { status: 'NOT_GRANTED', reason: 'PAYMENT_OVERDUE', risk: 'HIGH' };
  if (f.gpa < 80) return { status: 'NOT_GRANTED', reason: 'ACADEMIC_FAIL', risk: 'HIGH' };
  if (total < 80) return { status: 'NOT_GRANTED', reason: 'LOW_SCORE', risk: total < 60 ? 'HIGH' : 'MEDIUM' };
  if (scenario === 'TOP_GRANTED') return { status: 'GRANTED', reason: 'GRANTED_OK', risk: 'LOW' };
  return { status: 'PENDING', reason: 'OK', risk: 'LOW' };
}

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

  await prisma.user.create({ data: { email: 'admin@pdp.uz', password: passwordHash, role: 'ADMIN' } });

  const mentor1User = await prisma.user.create({ data: { email: 'mentor1@pdp.uz', password: passwordHash, role: 'MENTOR' } });
  const mentor1 = await prisma.mentor.create({ data: { userId: mentor1User.id, fullName: 'Akmal Karimov' } });
  const mentor2User = await prisma.user.create({ data: { email: 'mentor2@pdp.uz', password: passwordHash, role: 'MENTOR' } });
  const mentor2 = await prisma.mentor.create({ data: { userId: mentor2User.id, fullName: 'Dilshod Tursunov' } });

  const g1 = await prisma.group.create({ data: { name: 'SE-101', course: 1, mentorId: mentor1.id } });
  const g2 = await prisma.group.create({ data: { name: 'SE-102', course: 1, mentorId: mentor1.id } });
  const g3 = await prisma.group.create({ data: { name: 'IT-201', course: 2, mentorId: mentor2.id } });
  const groups = [g1, g2, g3];
  // Qo'shimcha guruhlar — talabalar yetarli bo'lganda taqsimlash uchun
  const extraGroupSpecs = [
    { name: 'SE-103', course: 1, mentorId: mentor1.id },
    { name: 'SE-104', course: 1, mentorId: mentor2.id },
    { name: 'IT-202', course: 2, mentorId: mentor2.id },
    { name: 'IT-203', course: 2, mentorId: mentor1.id },
    { name: 'CS-301', course: 3, mentorId: mentor1.id },
    { name: 'CS-302', course: 3, mentorId: mentor2.id },
    { name: 'DS-401', course: 4, mentorId: mentor2.id },
    { name: 'DS-402', course: 4, mentorId: mentor1.id },
  ];
  for (const spec of extraGroupSpecs) {
    const g = await prisma.group.create({ data: spec });
    groups.push(g);
  }

  for (let i = 0; i < STUDENTS.length; i++) {
    const spec = STUDENTS[i];
    const f = scenarioFields(spec.scenario);

    const user = await prisma.user.create({
      data: { email: `student${i + 1}@pdp.uz`, password: passwordHash, role: 'STUDENT' },
    });

    const academic = (f.gpa / 100) * 40;
    const att = (f.attendance / 100) * 20;
    const base = academic + att + f.projectScore + f.activityScore + f.tutorScore + f.disciplineScore;
    const total = Math.min(base + f.employmentBonus, 110);
    const dec = decide(f, total, spec.scenario);

    // Tyutor bahosi 5 yo'nalish (har biri 0-1)
    const tutorTotal = f.tutorScore; // 0-5
    const each = tutorTotal / 5;     // teng taqsimlangan
    const jitter = () => Math.max(0, Math.min(1, each + (Math.random() - 0.5) * 0.3));
    const tutorEval = {
      culture: jitter(), activity: jitter(), softSkills: jitter(),
      discipline: jitter(), dormitory: jitter(),
      by: 'seed', at: new Date().toISOString(),
    };

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: spec.name,
        groupId: groups[i % groups.length].id,
        gpa: f.gpa,
        attendance: f.attendance,
        projectScore: f.projectScore,
        activityScore: f.activityScore,
        tutorScore: f.tutorScore,
        tutorEval,
        disciplineScore: f.disciplineScore,
        employmentBonus: f.employmentBonus,
        paymentOverdue: f.paymentOverdue,
        grantScore: total,
        grantStatus: dec.status,
        grantReason: dec.reason,
        riskLevel: dec.risk,
        // TOP/CANDIDATE talabalar ismi mehmonga ko'rinadi, qolganlari anonim
        profilePublic: spec.scenario === 'TOP_GRANTED' || spec.scenario === 'CANDIDATE',
      },
    });

    // Penalty/recovery senariysi
    if (spec.scenario === 'WITH_PENALTY') {
      await prisma.penalty.create({
        data: {
          studentId: student.id,
          type: 'MEDIUM',
          ball: 5,
          reason: 'Sababsiz dars qoldirgan',
          recovered: 2.5,
          recoveryTask: 'Ko\'ngillilik tadbirida ishtirok etish',
          recoveryDone: true,
        },
      });
      await prisma.penalty.create({
        data: {
          studentId: student.id,
          type: 'LIGHT',
          ball: 1,
          reason: 'Darsga kechikish',
          recovered: 0,
        },
      });
    }

    // Feedback — har talaba uchun o'z guruhi mentoridan, score = tutorScore.
    // Shu orqali admin va mentor paneldagi tyutor bahosi mos keladi.
    const studentGroup = groups[i % groups.length];
    await prisma.feedback.create({
      data: {
        studentId: student.id,
        mentorId: studentGroup.mentorId,
        text: 'Yaxshi ishlayapti, faollik ko\'rsatsa yana yaxshi natijaga erishadi.',
        score: Math.round(f.tutorScore * 10) / 10,
      },
    });

    // Yutuq namunalari — har xil darajalar
    if (spec.scenario === 'TOP_GRANTED') {
      // TOP'larga ko'p yutuq — Champion + Founder + Polyglot + Collector imkoniyati
      // NB: CERTIFICATE / LANGUAGE / COURSE seed qilinmaydi — ular fayl yuklash
      // talab qiladi, talaba o'zi qo'shadi (admin tasdiqlaydi).
      await prisma.achievement.create({ data: { studentId: student.id, type: 'HACKATHON', title: 'PDP Unicorn Hackathon — 1-o\'rin', ball: 7, status: 'APPROVED', reviewedAt: new Date() } });
      await prisma.achievement.create({ data: { studentId: student.id, type: 'STARTUP',   title: 'EduMetric CRM startup', ball: 6, status: 'APPROVED', reviewedAt: new Date() } });
      await prisma.achievement.create({ data: { studentId: student.id, type: 'MENTORING', title: '3 ta talabaga mentorlik', ball: 3, status: 'APPROVED', reviewedAt: new Date() } });
      await prisma.achievement.create({ data: { studentId: student.id, type: 'VOLUNTEER',  title: 'ICT Week ko\'ngillisi', ball: 2, status: 'APPROVED', reviewedAt: new Date() } });
    } else if (spec.scenario === 'CANDIDATE') {
      await prisma.achievement.create({ data: { studentId: student.id, type: 'HACKATHON', title: 'Ideathon 2026', ball: 3, status: 'APPROVED', reviewedAt: new Date() } });
    } else if (spec.scenario === 'ACADEMIC_FAIL') {
      // Yutuq yo'q — akademik fail
    } else {
      // Qolgan senariylar uchun 0-2 ta tasodifiy non-cert yutuq
      const pool: { type: any; title: string; ball: number }[] = [
        { type: 'HACKATHON', title: 'PDP Hackathon — finalist', ball: 4 },
        { type: 'HACKATHON', title: 'Ideathon ishtirokchi', ball: 2 },
        { type: 'VOLUNTEER', title: 'Open Day ko\'ngillisi', ball: 1 },
        { type: 'MENTORING', title: 'Junior talabaga yordam', ball: 2 },
        { type: 'STARTUP', title: 'Pet-project MVP', ball: 3 },
      ];
      const cnt = Math.floor(Math.random() * 4); // 0..3
      const shuffled = pool.slice().sort(() => Math.random() - 0.5).slice(0, cnt);
      for (const a of shuffled) {
        const approved = Math.random() < 0.7;
        await prisma.achievement.create({
          data: {
            studentId: student.id,
            type: a.type,
            title: a.title,
            ball: a.ball,
            status: approved ? 'APPROVED' : (Math.random() < 0.5 ? 'PENDING' : 'REJECTED'),
            reviewedAt: approved ? new Date() : null,
          },
        });
      }
    }

    // Demo uchun: pinnedBadge'ni har xil qilamiz, reytingda turli ikonalar ko'rinsin.
    // Faqat TOP_GRANTED talabalar barcha 5 turdagi badge'larni topganiga ishonchimiz bor.
    if (spec.scenario === 'TOP_GRANTED') {
      const rotation = ['champion', 'founder', 'polyglot', 'mentor', 'grant_keeper'];
      const pinned = rotation[i % rotation.length];
      await prisma.student.update({ where: { id: student.id }, data: { pinnedBadge: pinned } });
    }
  }

  const apiKey = await prisma.apiKey.create({
    data: { name: 'Demo LMS Integration', key: 'em_' + randomBytes(24).toString('hex') },
  });

  console.log('✅ Seed done');
  console.log('   Admin:   admin@pdp.uz / password123');
  console.log('   Mentor:  mentor1@pdp.uz / password123');
  console.log('   Student: student1@pdp.uz / password123 (Madina, GRANTED)');
  console.log('   Student: student6@pdp.uz / password123 (Jasur, ACADEMIC_FAIL)');
  console.log('   Student: student10@pdp.uz / password123 (Ulug\'bek, PAYMENT_OVERDUE)');
  console.log('   API key:', apiKey.key);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
