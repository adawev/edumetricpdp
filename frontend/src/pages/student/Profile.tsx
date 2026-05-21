import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { T } from '@/lib/theme';
import { Card, Avatar, Button, Skeleton, Dialog, Field, Input, Select, Tooltip } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useStudentMe, useAchievements, useCreateAchievement, useStudentBadges, useBadgeCatalog, useUpdateProfilePublic } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { GrantStatus, AchievementType, Achievement } from '@/types/student';
import { api } from '@/lib/api';
import { BadgeMedal, BADGE_RARITY_LABEL, type BadgeDef, type EarnedBadge, type BadgeRarity } from '@/components/em/Badges';

const RARITY_COLOR: Record<BadgeRarity, string> = {
  legendary: '#a16207', epic: '#6d28d9', rare: '#1d4ed8', common: '#475569',
};

// ── constants ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<GrantStatus, { bg: string; fg: string; label: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, label: 'Grant berildi' },
  PENDING:     { bg: T.amberBg,   fg: T.amberText,   label: 'Kutilmoqda' },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText,     label: "Grant yo'q" },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted,   label: 'Aniqlanmagan' },
};

const CRITERIA = [
  { key: 'academic',   label: 'Akademik',  max: 40, color: '#10b981', desc: 'GPA asosida hisoblangan' },
  { key: 'attendance', label: 'Davomat',   max: 20, color: '#34d399', desc: 'LMS darslar qatnashuvi' },
  { key: 'projects',   label: 'Loyihalar', max: 15, color: '#6ee7b7', desc: 'Loyiha topshiriqlar natijasi' },
  { key: 'activity',   label: 'Faollik',   max: 10, color: '#a7f3d0', desc: 'Sertifikat, tadbir ishtirok' },
  { key: 'tutor',      label: 'Tyutor',    max: 5,  color: '#fbbf24', desc: 'Mentor baholagan ball' },
  { key: 'discipline', label: 'Intizom',   max: 10, color: '#f59e0b', desc: "Intizom va xulq ko'rsatkichi" },
];

const PENALTY_LABEL: Record<string, string> = {
  LIGHT: 'Engil', MEDIUM: "O'rta", HEAVY: "Og'ir",
};

const CERT_TYPE_OPTIONS: { value: AchievementType; label: string }[] = [
  { value: 'CERTIFICATE', label: 'Sertifikat' },
  { value: 'LANGUAGE',    label: 'Til sertifikati' },
  { value: 'COURSE',      label: 'Kurs sertifikati' },
  { value: 'OTHER',       label: 'Boshqa' },
];

// ── helpers ───────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, height = 5 }: { value: number; max: number; color: string; height?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height, background: T.bgSubtle, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s ease' }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function StudentProfile() {
  const { data, isLoading, isError, refetch } = useStudentMe();
  const { data: achievements } = useAchievements();

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  const { student, breakdown } = data;
  const sc = STATUS_CFG[student.grantStatus];
  const penaltyTotal = student.penalties.reduce((s, p) => s + p.ball, 0);
  const finalScore = breakdown.total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Page title */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>Mening profilim</h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Shaxsiy ma&apos;lumotlar va batafsil ball ko&apos;rsatkichlari</p>
      </div>

      {/* Profile header card */}
      <Card padding={0} style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Dark banner */}
        <div style={{ height: 76, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)`,
            backgroundSize: '24px 24px' }} />
          <div style={{ position: 'absolute', top: 14, right: 18 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: sc.bg, color: sc.fg,
            }}>{sc.label}</span>
          </div>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: '0 28px 22px' }}>
          <Avatar name={student.fullName} size={84}
            style={{ border: `4px solid ${T.white}`, fontSize: 28, marginTop: -42,
              boxShadow: '0 4px 12px rgba(15,23,42,.08)', position: 'relative', zIndex: 2 }} />
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', color: T.text }}>{student.fullName}</div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <InfoTag icon={Icons.mail} label="Email" value={student.email ?? `${student.fullName.toLowerCase().replace(/\s+/g, '.')}@student.pdp.uz`} />
              <InfoTag icon={Icons.users} label="Guruh" value={student.group.name} />
              <InfoTag icon={Icons.cal} label="Kurs" value={`${student.group.course}-kurs`} />
              {student.group.mentor && (
                <InfoTag icon={Icons.graduation} label="Mentor" value={student.group.mentor.fullName} />
              )}
            </div>
          </div>

          {/* Visibility row */}
          <VisibilityRow initial={!!student.profilePublic} />
        </div>
      </Card>

      {/* Criteria breakdown + side cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 14 }}>

        {/* Criteria */}
        <Card padding={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Mening ko'rsatkichlarim</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>Grant nizomi 2026.1 — 6 mezon, 100 ballik shkala</div>
          </div>
          <div style={{ padding: '4px 18px 14px' }}>
            {CRITERIA.map((c, i) => {
              const val = (breakdown as any)[c.key] ?? 0;
              const pct = Math.round((val / c.max) * 100);
              const grade = pct >= 90 ? { l: "A'lo", color: T.emerald }
                          : pct >= 75 ? { l: 'Yaxshi', color: T.amber }
                          :             { l: 'Past',   color: T.red };
              return (
                <div key={c.key} style={{ padding: '14px 0', borderBottom: i < CRITERIA.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: c.color + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: c.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
                        <span style={{ fontSize: 12.5, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{val.toFixed(1)}</span>
                          {' / '}{c.max}
                          <span style={{ marginLeft: 8, color: grade.color, fontWeight: 500 }}>{grade.l}</span>
                        </span>
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={val} max={c.max} color={c.color} height={5} /></div>
                        <span style={{ fontSize: 11, color: T.textSubtle, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ marginTop: 3, fontSize: 11.5, color: T.textSubtle }}>{c.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Side: bonus/penalty + final score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Bonus va jarima</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>Asosiy mezonlarga qo&apos;shimcha</div>
            </div>
            <div style={{ padding: '12px 18px' }}>
              {[
                {
                  icon: Icons.minus,
                  label: 'Jarima',
                  value: breakdown.penalty > 0 ? `−${breakdown.penalty.toFixed(1)} ball` : '0 ball',
                  desc: breakdown.penalty > 0
                    ? student.penalties.map(p => PENALTY_LABEL[p.type] ?? p.type).join(', ')
                    : "Hozircha jarima yo'q",
                  color: breakdown.penalty > 0 ? T.red : T.textMuted,
                },
                {
                  icon: Icons.refresh,
                  label: 'Reabilitatsiya',
                  value: breakdown.recovery > 0 ? `+${breakdown.recovery.toFixed(1)} ball` : '+0 ball',
                  desc: breakdown.recovery > 0 ? 'Bajarildi' : 'Hozircha tayinlanmagan',
                  color: breakdown.recovery > 0 ? T.emerald : T.textMuted,
                },
                {
                  icon: Icons.briefcase,
                  label: 'Ish bonusi',
                  value: breakdown.employment > 0 ? `+${breakdown.employment.toFixed(1)} ball` : '+0 ball',
                  desc: student.employmentBonus > 0 ? 'Ishga qabul qilindi' : "Hali ish bonusi yo'q",
                  color: breakdown.employment > 0 ? T.blue : T.textMuted,
                },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: T.bg, display: 'grid',
                    placeItems: 'center', border: `1px solid ${T.border}` }}>
                    {item.icon({ size: 14, stroke: item.color })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 1 }}>{item.desc}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Final score dark card */}
          <Card padding={0} style={{ background: T.slate900, border: 'none' }}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)', fontWeight: 600,
                letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Yakuniy ball</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1,
                  color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  {finalScore.toFixed(1)}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>/ 100 + bonuslar</div>
              </div>
              <div style={{ marginTop: 10, padding: '10px 0 0', borderTop: '1px solid rgba(255,255,255,.12)',
                fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                Asos: {breakdown.base.toFixed(1)} − Jarima: {breakdown.penalty.toFixed(1)} + Recovery: {breakdown.recovery.toFixed(1)} + Ish: {breakdown.employment.toFixed(1)}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Penalties detail */}
      {student.penalties.length > 0 && (
        <Card padding={0}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Jarimalar</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
              Jami: −{penaltyTotal.toFixed(1)} ball
            </div>
          </div>
          <div style={{ padding: '0 18px 8px' }}>
            {student.penalties.map((p, i) => (
              <div key={p.id} style={{ padding: '12px 0',
                borderBottom: i < student.penalties.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.redText }}>
                      {PENALTY_LABEL[p.type] ?? p.type} jarima
                    </div>
                    <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>{p.reason}</div>
                    {p.recoveryTask && (
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                        Vazifa: {p.recoveryTask}
                        {p.recoveryDone && <span style={{ marginLeft: 8, color: T.emeraldText, fontWeight: 500 }}>✓ Bajarildi</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>−{p.ball}</span>
                    {p.recovered > 0 && (
                      <div style={{ fontSize: 11.5, color: T.emeraldText, marginTop: 2 }}>+{p.recovered} qaytarildi</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Certificates section */}
      <CertificatesSection
        certs={(achievements ?? []).filter(a => ['CERTIFICATE','LANGUAGE','COURSE'].includes(a.type))}
      />

      {/* Badges section */}
      <BadgesSection />
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────

function InfoTag({ icon, label, value }: { icon: (p: any) => JSX.Element; label: string; value: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: T.bg, borderRadius: 7, fontSize: 12.5, color: T.text, border: `1px solid ${T.border}` }}>
      {icon({ size: 12, stroke: T.textMuted })}
      <span style={{ color: T.textMuted }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── VisibilityRow ──────────────────────────────────────────────────────────

function VisibilityRow({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const { mutateAsync, isPending } = useUpdateProfilePublic();

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      await mutateAsync(next);
      toast.success(next ? "Mehmonlarga ochiq" : "Mehmonlardan yashirildi");
    } catch (err: any) {
      setOn(on);
      toast.error(err?.response?.data?.error ?? 'Xatolik');
    }
  };

  return (
    <div style={{
      marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5,
    }}>
      {(on ? Icons.eye : Icons.eyeOff)({ size: 13, stroke: on ? T.emerald : T.textMuted })}
      <span style={{ color: T.textMuted }}>
        {on
          ? "Mehmon reytingida to'liq ism va guruh ochiq"
          : "Mehmon reytingida anonim (faqat bosh harflar)"}
      </span>
      <Button variant="ghost" size="sm" onClick={toggle} disabled={isPending}
        style={{ marginLeft: 'auto', color: on ? T.red : T.emerald }}>
        {on ? "Yashirish" : "Ochish"}
      </Button>
    </div>
  );
}

// ── CertificatesSection ────────────────────────────────────────────────────

function CertificatesSection({ certs }: { certs: Achievement[] }) {
  const { mutateAsync, isPending } = useCreateAchievement();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ type: AchievementType; title: string; description: string; file: File | null }>(
    { type: 'CERTIFICATE', title: '', description: '', file: null }
  );

  const fmtDate = (s: string) => {
    const d = new Date(s);
    const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Sertifikat nomini kiriting'); return; }
    try {
      await mutateAsync({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        file: form.file ?? undefined,
      });
      toast.success("Sertifikat yuborildi — admin tasdiqlashini kuting");
      setForm({ type: 'CERTIFICATE', title: '', description: '', file: null });
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Xatolik yuz berdi');
    }
  };

  const SC: Record<string, { bg: string; fg: string; label: string }> = {
    PENDING:  { bg: T.amberBg,   fg: T.amberText,   label: 'Kutilmoqda' },
    APPROVED: { bg: T.emeraldBg, fg: T.emeraldText, label: 'Tasdiqlangan' },
    REJECTED: { bg: T.redBg,     fg: T.redText,     label: 'Rad etilgan' },
  };

  return (
    <Card padding={0}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Mening sertifikatlarim</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            {certs.length} ta sertifikat · tasdiqlangani grant ballingizga qo'shiladi
          </div>
        </div>
        <Button variant="primary" size="sm" icon={Icons.plus({ size: 13, stroke: '#fff' })} onClick={() => setOpen(true)}>
          Yangi sertifikat
        </Button>
      </div>

      {certs.length === 0 ? (
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          {Icons.award({ size: 40, stroke: T.border })}
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Hozircha sertifikat yo'q</div>
          <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 300, lineHeight: 1.6 }}>
            Til, kurs yoki professional sertifikatlaringizni qo'shing
          </div>
          <Button variant="primary" size="sm" icon={Icons.plus({ size: 13, stroke: '#fff' })} onClick={() => setOpen(true)}
            style={{ marginTop: 4 }}>
            Sertifikat qo'shish
          </Button>
        </div>
      ) : (
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {certs.map(c => {
            const sc = SC[c.status] ?? SC.PENDING;
            return (
              <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.white, display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.borderStrong; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,23,42,.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                {(() => {
                  const isImg = c.fileUrl && /\.(png|jpe?g|webp|gif)$/i.test(c.fileUrl);
                  if (isImg) {
                    return (
                      <a href={c.fileUrl!} target="_blank" rel="noreferrer"
                         style={{ display: 'block', height: 80, borderRadius: 8, marginBottom: 10,
                           border: `1px solid ${T.border}`, overflow: 'hidden', background: T.bg }}>
                        <img src={c.fileUrl!} alt={c.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </a>
                    );
                  }
                  const inner = (
                    <div style={{ height: 80, borderRadius: 8, marginBottom: 10, background: '#eff6ff',
                      border: `1px solid ${T.border}`, display: 'grid', placeItems: 'center' }}>
                      {Icons.fileText({ size: 28, stroke: T.blue })}
                    </div>
                  );
                  return c.fileUrl ? (
                    <a href={c.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>{inner}</a>
                  ) : inner;
                })()}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{c.title}</div>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, background: sc.bg, color: sc.fg, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 6 }}>
                  {fmtDate(c.createdAt)}
                </div>
                {c.status === 'APPROVED' && c.ball && c.ball > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.emeraldDeep }}>+{c.ball} ball</div>
                )}
                {c.status === 'REJECTED' && c.rejectReason && (
                  <div style={{ fontSize: 11.5, color: T.redText, marginTop: 4 }}>
                    {Icons.alert({ size: 12, stroke: T.red })} {c.rejectReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}
        title="Yangi sertifikat qo'shish"
        description="Sertifikat ma'lumotlarini kiriting. Admin tasdiqlagandan keyin ball qo'shiladi."
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Bekor qilish</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saqlanmoqda...' : 'Yuborish'}
          </Button>
        </>}
      >
        <Field label="Tur">
          <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v as AchievementType }))}
            options={CERT_TYPE_OPTIONS} />
        </Field>
        <Field label="Sertifikat nomi">
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Masalan: IELTS 7.5, AWS Cloud Practitioner" />
        </Field>
        <Field label="Tavsif (ixtiyoriy)">
          <textarea value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Qachon, qayerda, qanday natija"
            rows={3}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, resize: 'vertical',
              border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: 'inherit',
              outline: 'none', color: T.text, background: T.white, boxSizing: 'border-box' }} />
        </Field>
        <Field label="Sertifikat fayli (PDF yoki rasm)">
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            border: `1.5px dashed ${form.file ? T.emerald : T.border}`,
            borderRadius: 8, cursor: 'pointer', fontSize: 13.5,
            color: form.file ? T.emeraldText : T.textMuted,
            background: form.file ? T.emeraldBg : T.bgSubtle,
          }}>
            {Icons.upload({ size: 15, stroke: form.file ? T.emerald : T.textMuted })}
            {form.file ? form.file.name : 'Fayl tanlang (PDF, PNG, JPG, WEBP — max 5 MB)'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }}
              onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} />
          </label>
        </Field>
      </Dialog>
    </Card>
  );
}

// ── BadgesSection ──────────────────────────────────────────────────────────
// Unified catalog (same 6 badges as guest /public/rating). Earned set
// computed by backend — no hardcoded data.

function BadgesSection() {
  const { data: catalog } = useBadgeCatalog();
  const { data: badgesData } = useStudentBadges();
  const earned = (badgesData?.earned ?? []) as EarnedBadge[];
  const earnedMap = Object.fromEntries(earned.map(b => [b.slug, b]));
  const earnedCount = earned.length;
  const total = catalog?.length ?? 0;

  return (
    <Card padding={0}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Mening badge'larim</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            <span style={{ color: T.text, fontWeight: 600 }}>{earnedCount}</span>
            {' / '}{total} ta badge olingan · avtomatik beriladi
          </div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {catalog && catalog.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {catalog.map(b => {
              const e = earnedMap[b.slug];
              const isEarned = !!e;
              const rc = RARITY_COLOR[b.rarity];
              return (
                <Tooltip key={b.slug} content={isEarned ? `${b.name} · Olingan` : `${b.name} · ${b.howToEarn}`}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12,
                    border: `1px solid ${isEarned ? b.color + '55' : T.border}`,
                    background: isEarned ? `linear-gradient(135deg, ${b.color}10 0%, ${T.white} 60%)` : T.white,
                    minHeight: 92, cursor: 'help',
                    opacity: isEarned ? 1 : 0.55,
                  }}>
                    <BadgeMedal badge={b} size={56} earned={isEarned} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{b.name}</span>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: rc + (isEarned ? '15' : '10'), color: rc,
                          border: `1px solid ${rc}33`, letterSpacing: '.08em', whiteSpace: 'nowrap',
                        }}>{BADGE_RARITY_LABEL[b.rarity].toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.45,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {isEarned ? b.description : b.howToEarn}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          <Skeleton h={200} r={12} />
        )}
      </div>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <Skeleton h={80} r={0} style={{ width: '100%' }} />
        <div style={{ padding: '16px 28px 22px' }}>
          <Skeleton h={84} w={84} r={999} style={{ marginTop: -42 }} />
          <Skeleton h={24} w={240} r={8} style={{ marginTop: 14 }} />
          <Skeleton h={16} w={380} r={6} style={{ marginTop: 10 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 14 }}>
        <Skeleton h={500} r={12} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton h={220} r={12} />
          <Skeleton h={140} r={12} />
        </div>
      </div>
    </div>
  );
}
