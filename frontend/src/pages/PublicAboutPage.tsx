import { T } from '@/lib/theme';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Card } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';

export default function PublicAboutPage() {
  const criteria = [
    { name: 'Akademik',      max: 40, color: '#2563eb', bg: '#eff6ff',
      icon: <Icons.graduation size={28} stroke="#2563eb" strokeWidth={2} />,
      desc: "Semestr davomidagi GPA bo'yicha hisoblanadi. Yuqori o'zlashtirish — ko'p ball.",
      formula: 'Akademik = (GPA / 100) × 40' },
    { name: 'Davomat',       max: 20, color: '#059669', bg: '#ecfdf5',
      icon: <Icons.cal size={28} stroke="#059669" strokeWidth={2} />,
      desc: 'LMS tizimidan kelgan real davomat foizi. Hech qaysi darsni qoldirmaslik muhim.',
      formula: 'Davomat = (foiz / 100) × 20' },
    { name: 'Loyihalar',     max: 15, color: '#7c3aed', bg: '#f5f3ff',
      icon: <Icons.bolt size={28} stroke="#7c3aed" strokeWidth={2} />,
      desc: "Topshirilgan amaliy loyihalar va vazifalar bo'yicha umumiy baho.",
      formula: "Loyihalar = (o'rtacha / 100) × 15" },
    { name: 'Faollik',       max: 10, color: '#d97706', bg: '#fffbeb',
      icon: <Icons.award size={28} stroke="#d97706" strokeWidth={2} />,
      desc: 'Hakaton, konferensiya, klublar va boshqa universitet tadbirlaridagi ishtirok.',
      formula: 'Faollik = (ishtirok foizi / 100) × 10' },
    { name: 'Tyutor bahosi', max: 5,  color: '#db2777', bg: '#fdf2f8',
      icon: <Icons.checkCircle size={28} stroke="#db2777" strokeWidth={2} />,
      desc: 'Mentoringizning shaxsiy bahosi — har semestr oxirida qo\'yiladi.',
      formula: 'Tyutor = mentor balli (0-5)' },
    { name: 'Intizom',       max: 10, color: '#475569', bg: '#f1f5f9',
      icon: <Icons.shield size={28} stroke="#475569" strokeWidth={2} />,
      desc: 'Korporativ madaniyat, akademik halollik, dress code va yotoqxona tartibi.',
      formula: 'Intizom = mentor balli (0-10)' },
  ];

  const bonuses = [
    { name: 'Penalty',    range: '−20 ball gacha', color: T.redDeep, bg: T.redBg, bd: '#fecaca',
      desc: 'Akademik halollik buzilishi, plagiat, dars qoldirish va boshqa jiddiy intizom buzilishlari.',
      icon: <Icons.minus size={20} stroke={T.red} /> },
    { name: 'Recovery',   range: '+10 ball gacha', color: T.amberDeep, bg: T.amberBg, bd: '#fde68a',
      desc: 'Berilgan jarima vazifalarini muvaffaqiyatli bajarib, ballni qisman tiklash imkoniyati.',
      icon: <Icons.refresh size={20} stroke={T.amber} /> },
    { name: 'Employment', range: '+10 ball gacha', color: T.emeraldDeep, bg: T.emeraldBg, bd: '#a7f3d0',
      desc: "IT kompaniyada rasmiy ish bilan ta'minlanganlik — kontrakt yoki offer letter tasdiqlanishi.",
      icon: <Icons.briefcase size={20} stroke={T.emerald} /> },
  ];

  return (
    <PublicChrome>
      <div className="px-4 pt-8 sm:px-8 sm:pt-11">
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.05, color: T.text }}>
              Grant qanday hisoblanadi?
            </h1>
            <p style={{ margin: '12px 0 0', color: T.textMuted, fontSize: 15.5, maxWidth: 680, lineHeight: 1.6 }}>
              Har talaba 100 balgacha to'play oladi. Grant olish uchun{' '}
              <strong style={{ color: T.text, fontWeight: 600 }}>≥80 ball</strong> va{' '}
              <strong style={{ color: T.text, fontWeight: 600 }}>GPA ≥80%</strong> kerak.
            </p>
          </div>

          <Card padding={0} style={{ marginBottom: 36, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1.5px solid #f59e0b', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.7)',
                display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid rgba(180,83,9,.25)',
              }}>
                <Icons.alert size={22} stroke="#a16207" strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#78350f', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 }}>Qattiq qoidalar</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#451a03' }}>
                  GPA <strong>80%</strong>'dan past bo'lsa, umumiy ball yetarli bo'lsa ham grant{' '}
                  <strong>BERILMAYDI</strong>.
                  <span style={{ marginLeft: 6 }}>80+ ball ham kafolat emas — grant slot soni cheklangan, raqobatli saralash o'tkaziladi.</span>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>6 ta asosiy mezon</h2>
            <span style={{ fontSize: 13, color: T.textMuted }}>Jami: <strong style={{ color: T.text }}>100 ball</strong></span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5" style={{ marginBottom: 40 }}>
            {criteria.map((c, i) => (
              <Card key={i} padding={20}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: c.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: c.color, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                        max {c.max}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.55, color: T.textMuted }}>{c.desc}</p>
                    <code style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 5,
                      background: T.bg, border: `1px solid ${T.border}`,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: T.text,
                    }}>{c.formula}</code>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Bonus va jarima</h2>
            <span style={{ fontSize: 13, color: T.textMuted }}>Asosiy 100 balga qo'shimcha</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: 24 }}>
            {bonuses.map((b, i) => (
              <div key={i} style={{ padding: 18, background: b.bg, border: `1px solid ${b.bd}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.55)', display: 'grid', placeItems: 'center' }}>
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: b.color, lineHeight: 1.1 }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: b.color, opacity: .75, marginTop: 2, fontWeight: 600 }}>{b.range}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.55, opacity: .85 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          <Card padding={0} style={{ overflow: 'hidden', background: T.slate900, border: 'none' }}>
            <div style={{ padding: '22px 24px', color: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>
                Yakuniy formula
              </div>
              <code style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, lineHeight: 1.75, color: '#a7f3d0', letterSpacing: '.01em', overflowX: 'auto' }}>
                final_score = (Akademik + Davomat + Loyihalar + Activity + Tyutor + Intizom)<br />
                {'                '} − Penalty + Recovery + Employment
              </code>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.12)', fontSize: 12.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.55 }}>
                Hisoblash <strong style={{ color: '#fff' }}>avtomatik</strong> — har talabaga teng qoidalar qo'llanadi. Reyting har 24 soatda yangilanadi.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PublicChrome>
  );
}
