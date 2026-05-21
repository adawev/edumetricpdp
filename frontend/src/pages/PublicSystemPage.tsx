import { T } from '@/lib/theme';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Card } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';

const mono = 'JetBrains Mono, monospace';

export default function PublicSystemPage() {
  const stack = [
    { layer: 'Frontend', tech: 'React + TypeScript + Vite',
      icon: <Icons.bolt size={22} stroke="#2563eb" strokeWidth={2} />, color: '#2563eb', bg: '#eff6ff',
      why: 'Vite — tezkor build va HHR. TypeScript xatolarni kompilyatsiyada tutadi. Hakatonda tezkor ishlash uchun ideal.' },
    { layer: 'UI kutubxonasi', tech: 'shadcn/ui + Tailwind + Recharts',
      icon: <Icons.sparkles size={22} stroke="#7c3aed" strokeWidth={2} />, color: '#7c3aed', bg: '#f5f3ff',
      why: 'Tayyor, qayta ishlatiladigan komponentlar — dizaynga vaqt ketmaydi. Recharts reyting grafiklari uchun.' },
    { layer: 'Backend', tech: 'Node.js + Express + TypeScript',
      icon: <Icons.globe size={22} stroke="#059669" strokeWidth={2} />, color: '#059669', bg: '#ecfdf5',
      why: 'Frontend bilan bitta til (TS) — kontekst almashinuvi yo‘q. Express yengil, REST API uchun yetarli.' },
    { layer: 'Baza', tech: 'PostgreSQL + Prisma ORM',
      icon: <Icons.files size={22} stroke="#d97706" strokeWidth={2} />, color: '#d97706', bg: '#fffbeb',
      why: 'Grant ma’lumotlari bog‘langan (talaba ↔ guruh ↔ yutuq). Prisma type-safe so‘rovlar va migratsiya beradi.' },
    { layer: 'Auth', tech: 'JWT + bcrypt',
      icon: <Icons.lock size={22} stroke="#db2777" strokeWidth={2} />, color: '#db2777', bg: '#fdf2f8',
      why: 'JWT — server holatsiz (stateless), 3 rol token ichida. Parollar bcrypt bilan hash qilinadi.' },
    { layer: 'Deploy', tech: 'Docker Compose + Nginx',
      icon: <Icons.rocket size={22} stroke="#475569" strokeWidth={2} />, color: '#475569', bg: '#f1f5f9',
      why: 'Bitta buyruq bilan butun tizim ko‘tariladi. Nginx reverse proxy + Certbot HTTPS.' },
  ];

  const flow = [
    { n: 1, title: 'LMS ma’lumot yuboradi', desc: 'Tashqi LMS davomat va baholarni API key bilan EduMetric’ga jo‘natadi.' },
    { n: 2, title: 'Talaba yutuq kiritadi', desc: 'Sertifikat yoki loyiha qo‘shiladi — status PENDING bo‘ladi.' },
    { n: 3, title: 'Admin approve qiladi', desc: 'Admin yutuqni tasdiqlaydi yoki rad etadi.' },
    { n: 4, title: 'Grant Engine hisoblaydi', desc: '6 mezon + bonus/jarima → umumiy ball va grant status avtomatik.' },
    { n: 5, title: 'Reytingda ko‘rinadi', desc: 'Yangi ball public reyting va talaba panelida darhol aks etadi.' },
  ];

  const decisions = [
    { title: 'LMS ajratilgan', icon: <Icons.link size={18} stroke={T.blue} />,
      desc: 'Davomat va baho EduMetric’da kiritilmaydi — faqat LMS’dan API orqali keladi. Bu manbani bitta joyda saqlaydi va xatoni kamaytiradi.' },
    { title: 'Markazlashgan Grant Engine', icon: <Icons.bolt size={18} stroke={T.amber} />,
      desc: 'Ball formulasi bitta servisda. Har talabaga bir xil qoida — qo‘lda aralashuv yo‘q, natija adolatli.' },
    { title: 'Rolga asoslangan kirish', icon: <Icons.shield size={18} stroke={T.emerald} />,
      desc: 'Student / Mentor / Admin har biri faqat o‘z ma’lumotini ko‘radi. JWT token rolni middleware’da tekshiradi.' },
    { title: 'To‘liq audit jurnali', icon: <Icons.fileText size={18} stroke="#7c3aed" />,
      desc: 'Har bir harakat ActivityLog’ga yoziladi — kim, nima, qachon. Shaffoflik va nizolarni hal qilish uchun.' },
  ];

  return (
    <PublicChrome>
      <div className="px-4 pt-8 sm:px-8 sm:pt-11">
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Hero */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: T.textSubtle, marginBottom: 8 }}>
              Texnik ko‘rinish
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.05, color: T.text }}>
              EduMetric qanday qurilgan
            </h1>
            <p style={{ margin: '12px 0 0', color: T.textMuted, fontSize: 15.5, maxWidth: 720, lineHeight: 1.6 }}>
              Tizim arxitekturasi, tanlangan texnologiyalar va asosiy texnik qarorlar — bitta sahifada
              umumiy manzara (big picture).
            </p>
          </div>

          {/* Architecture diagram */}
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 14px', letterSpacing: '-0.02em' }}>Tizim arxitekturasi</h2>
          <Card padding={28} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

              {/* External LMS */}
              <ArchBox label="Tashqi LMS" sub="Davomat · Baholar · GPA"
                bg="#f1f5f9" bd="#cbd5e1" fg={T.textMuted} icon={<Icons.globe size={18} stroke={T.textMuted} />} />
              <Arrow label="API key + bulk JSON" />

              {/* Backend */}
              <ArchBox label="Backend — Express + TypeScript" sub="REST API · 6 marshrut guruhi (auth, student, mentor, admin, integrations, public)"
                bg={T.slate900} bd={T.slate900} fg="#fff" wide
                icon={<Icons.globe size={18} stroke="#fff" />} />

              {/* Engine highlight */}
              <div style={{ width: '100%', maxWidth: 520, margin: '10px 0',
                padding: '12px 16px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #f59e0b',
                display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icons.bolt size={18} stroke="#d97706" strokeWidth={2.2} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#78350f' }}>Grant Engine</div>
                  <div style={{ fontSize: 12, color: '#92400e' }}>Ball formulasi + grant status logikasi (markazlashgan)</div>
                </div>
              </div>

              <Arrow label="Prisma ORM" />

              {/* DB */}
              <ArchBox label="PostgreSQL" sub="11 model: User · Student · Group · Achievement · Penalty · ScoreSnapshot · ActivityLog · …"
                bg="#ecfdf5" bd="#6ee7b7" fg={T.emeraldText} wide
                icon={<Icons.files size={18} stroke={T.emeraldDeep} />} />

              <Arrow label="JWT auth · rolga qarab" up />

              {/* Frontend roles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" style={{ width: '100%', marginTop: 4 }}>
                {[
                  { l: 'Student', d: 'Profil · yutuq · feedback', i: <Icons.user size={16} stroke="#2563eb" />, c: '#2563eb', b: '#eff6ff' },
                  { l: 'Mentor', d: 'Guruh · feedback · intizom', i: <Icons.users size={16} stroke="#7c3aed" />, c: '#7c3aed', b: '#f5f3ff' },
                  { l: 'Admin', d: 'Approve · jarima · grant', i: <Icons.shield size={16} stroke="#d97706" />, c: '#d97706', b: '#fffbeb' },
                  { l: 'Guest', d: 'Public reyting (loginsiz)', i: <Icons.globe size={16} stroke="#475569" />, c: '#475569', b: '#f1f5f9' },
                ].map(r => (
                  <div key={r.l} style={{ padding: 12, borderRadius: 10, background: r.b, border: `1px solid ${r.c}22`, textAlign: 'center' }}>
                    <div style={{ display: 'grid', placeItems: 'center', marginBottom: 6 }}>{r.i}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.c }}>{r.l}</div>
                    <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>{r.d}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: T.textSubtle, marginTop: 10 }}>
                Frontend — React SPA, 4 rol bir kod bazasida
              </div>
            </div>
          </Card>

          {/* Tech stack */}
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Texnologiyalar — nega tanlandi</h2>
            <span style={{ fontSize: 13, color: T.textMuted }}>Butun stack — TypeScript</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5" style={{ marginBottom: 40 }}>
            {stack.map((s, i) => (
              <Card key={i} padding={20}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 11, background: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: T.textSubtle }}>{s.layer}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: '2px 0 8px', color: s.color }}>{s.tech}</div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: T.textMuted }}>{s.why}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Data flow */}
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Ma’lumot oqimi — golden path</h2>
          <p style={{ margin: '0 0 16px', fontSize: 13.5, color: T.textMuted }}>Ball qanday hisoblanib reytingga chiqishi — 5 qadam.</p>
          <Card padding={24} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {flow.map((f, i) => (
                <div key={f.n}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999, background: T.slate900, color: '#fff',
                      display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
                      fontFamily: mono,
                    }}>{f.n}</div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                  {i < flow.length - 1 && (
                    <div style={{ width: 2, height: 16, background: T.border, marginLeft: 14 }} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Design decisions */}
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 14px', letterSpacing: '-0.02em' }}>Asosiy texnik qarorlar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ marginBottom: 32 }}>
            {decisions.map((d, i) => (
              <Card key={i} padding={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.bgSubtle, display: 'grid', placeItems: 'center' }}>
                    {d.icon}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{d.title}</div>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.textMuted }}>{d.desc}</p>
              </Card>
            ))}
          </div>

          {/* Closing */}
          <Card padding={0} style={{ overflow: 'hidden', background: T.slate900, border: 'none' }}>
            <div style={{ padding: '22px 24px', color: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>
                Qisqacha
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,.85)' }}>
                EduMetric — <strong style={{ color: '#fff' }}>faqat grant CRM</strong>. Davomat va baho LMS’dan keladi,
                yutuqlar talabadan, tasdiq admindan. Markaziy Grant Engine hammasini bitta adolatli formula
                bo‘yicha hisoblaydi. To‘liq stack TypeScript, Docker bilan bir buyruqda deploy.
              </div>
            </div>
          </Card>

        </div>
      </div>
    </PublicChrome>
  );
}

function ArchBox({ label, sub, bg, bd, fg, icon, wide }: {
  label: string; sub: string; bg: string; bd: string; fg: string; icon: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      width: '100%', maxWidth: wide ? '100%' : 520,
      padding: '14px 18px', borderRadius: 11, background: bg, border: `1.5px solid ${bd}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: fg }}>{label}</div>
        <div style={{ fontSize: 12, color: fg, opacity: .75, marginTop: 2, lineHeight: 1.45 }}>{sub}</div>
      </div>
    </div>
  );
}

function Arrow({ label, up }: { label: string; up?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
      <div style={{ width: 2, height: 14, background: T.borderStrong }} />
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: T.textMuted, fontFamily: mono,
        padding: '2px 8px', background: T.bgSubtle, borderRadius: 999, margin: '2px 0',
      }}>{up ? '↑ ' : '↓ '}{label}</div>
      <div style={{ width: 2, height: 14, background: T.borderStrong }} />
    </div>
  );
}
