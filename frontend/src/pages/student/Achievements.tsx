import { useState } from 'react';
import { T } from '@/lib/theme';
import { Card, Button, Input, Select, Field, Dialog, Skeleton, Tooltip, Pagination, usePagination } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useAchievements, useCreateAchievement } from '@/hooks/useStudent';
import { ErrorState } from '@/components/em/ErrorState';
import type { AchievementType, AchievementStatus } from '@/types/student';
import { toast } from 'sonner';

// ── constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: AchievementType; label: string }[] = [
  { value: 'CERTIFICATE',  label: 'Sertifikat' },
  { value: 'HACKATHON',    label: 'Xakaton' },
  { value: 'STARTUP',      label: 'Startap' },
  { value: 'EMPLOYMENT',   label: 'Ish' },
  { value: 'MENTORING',    label: 'Mentoring' },
  { value: 'LANGUAGE',     label: 'Til' },
  { value: 'COURSE',       label: 'Kurs' },
  { value: 'VOLUNTEER',    label: 'Volontyorlik' },
  { value: 'OTHER',        label: 'Boshqa' },
];

const TYPE_LABELS: Record<AchievementType, string> = Object.fromEntries(
  TYPE_OPTIONS.map(o => [o.value, o.label])
) as Record<AchievementType, string>;

const STATUS_CONFIG: Record<AchievementStatus, { label: string; bg: string; fg: string }> = {
  PENDING:  { label: 'Kutilmoqda',    bg: T.amberBg,   fg: T.amberText },
  APPROVED: { label: 'Tasdiqlangan',  bg: T.emeraldBg, fg: T.emeraldText },
  REJECTED: { label: 'Rad etilgan',   bg: T.redBg,     fg: T.redText },
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  const m = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
};

// ── Add achievement form ────────────────────────────────────────────────────

interface FormState {
  type: AchievementType;
  title: string;
  description: string;
  file: File | null;
  fileUrl: string;
}

const EMPTY_FORM: FormState = { type: 'CERTIFICATE', title: '', description: '', file: null, fileUrl: '' };

function AddAchievementDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateAchievement();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleClose = () => {
    if (isPending) return;
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim() || form.title.trim().length < 2) e.title = "Kamida 2 ta belgi kiritish kerak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await mutateAsync({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        file: form.file ?? undefined,
        fileUrl: !form.file && form.fileUrl.trim() ? form.fileUrl.trim() : undefined,
      });
      toast.success("Yutuq qo'shildi — admin ko'rib chiqadi");
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Yangi yutuq qo'shish"
      description="Yutuqingizni kiriting — admin tasdiqlashini kuting"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Bekor qilish</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Yuborish"}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Field label="Yutuq turi" htmlFor="ach-type">
          <Select
            value={form.type}
            onChange={v => set('type', v as AchievementType)}
            options={TYPE_OPTIONS}
          />
        </Field>

        <Field label="Nomi" htmlFor="ach-title" hint={<span style={{ color: errors.title ? T.red : T.textSubtle }}>{form.title.length} / 100</span>}>
          <Input
            id="ach-title"
            value={form.title}
            onChange={e => set('title', e.target.value.slice(0, 100))}
            placeholder="Masalan: Google Cloud sertifikati"
            error={!!errors.title}
          />
          {errors.title && <div style={{ fontSize: 12, color: T.red, marginTop: 4 }}>{errors.title}</div>}
        </Field>

        <Field label="Tavsif (ixtiyoriy)" htmlFor="ach-desc">
          <textarea
            id="ach-desc"
            value={form.description}
            onChange={e => set('description', e.target.value.slice(0, 500))}
            placeholder="Qisqacha tavsif..."
            rows={3}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, resize: 'vertical',
              border: `1px solid ${T.border}`, fontSize: 13.5, fontFamily: 'inherit',
              outline: 'none', color: T.text, background: T.white, boxSizing: 'border-box',
            }}
          />
        </Field>

        <Field label="Fayl yuklash (ixtiyoriy)" htmlFor="ach-file">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              border: `1px dashed ${T.border}`, borderRadius: 8, cursor: 'pointer',
              fontSize: 13.5, color: T.textMuted, background: T.bgSubtle,
            }}>
              {Icons.fileText({ size: 15, stroke: T.textMuted })}
              {form.file ? form.file.name : 'Fayl tanlang (PDF, rasm)'}
              <input
                type="file"
                id="ach-file"
                accept=".pdf,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={e => set('file', e.target.files?.[0] ?? null)}
              />
            </label>
            {!form.file && (
              <Input
                value={form.fileUrl}
                onChange={e => set('fileUrl', e.target.value)}
                placeholder="Yoki URL kiriting (https://...)"
                icon={Icons.link({ size: 14, stroke: T.textSubtle })}
              />
            )}
          </div>
        </Field>
      </div>
    </Dialog>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function StudentAchievements() {
  const { data: achievements, isLoading, isError, refetch } = useAchievements();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AchievementStatus | 'ALL'>('ALL');

  const filtered = achievements?.filter(a =>
    statusFilter === 'ALL' ? true : a.status === statusFilter
  ) ?? [];

  const pag = usePagination(filtered, 10, [statusFilter, filtered.length]);

  const counts = {
    ALL: achievements?.length ?? 0,
    PENDING: achievements?.filter(a => a.status === 'PENDING').length ?? 0,
    APPROVED: achievements?.filter(a => a.status === 'APPROVED').length ?? 0,
    REJECTED: achievements?.filter(a => a.status === 'REJECTED').length ?? 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', margin: 0 }}>
            Yutuqlarim
          </h1>
          <p style={{ fontSize: 13.5, color: T.textMuted, marginTop: 4 }}>
            Yutuqlaringizni qo'shing — admin tasdiqlashidan so'ng ball qo'shiladi
          </p>
        </div>
        <Button
          variant="primary"
          icon={Icons.sparkles({ size: 14, stroke: '#fff' })}
          onClick={() => setDialogOpen(true)}
        >
          Yutuq qo'shish
        </Button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => {
          const active = statusFilter === s;
          const labels: Record<string, string> = {
            ALL: 'Hammasi', PENDING: 'Kutilmoqda', APPROVED: 'Tasdiqlangan', REJECTED: 'Rad etilgan',
          };
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${active ? T.slate900 : T.border}`,
              background: active ? T.slate900 : T.white,
              color: active ? '#fff' : T.textMuted,
              fontSize: 12.5, fontWeight: active ? 500 : 400,
              cursor: 'pointer', transition: 'all .12s', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              {labels[s]}
              <span style={{
                fontSize: 10.5, padding: '0 5px', borderRadius: 999,
                background: active ? 'rgba(255,255,255,.2)' : T.bgSubtle,
                color: active ? '#fff' : T.textMuted, minWidth: 16, height: 16,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <AchievementsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => setDialogOpen(true)} filtered={statusFilter !== 'ALL'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pag.pageItems.map(a => {
            const sc = STATUS_CONFIG[a.status];
            return (
              <Card key={a.id} padding={18}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Type icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: T.bgSubtle, display: 'grid', placeItems: 'center',
                  }}>
                    {Icons.award({ size: 18, stroke: T.textMuted })}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{a.title}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: T.bgSubtle, color: T.textMuted, fontWeight: 500,
                      }}>{TYPE_LABELS[a.type]}</span>
                    </div>

                    {a.description && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
                        {a.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: T.textSubtle }}>
                        {Icons.cal({ size: 12, stroke: T.textSubtle })} {' '}
                        {fmtDate(a.createdAt)}
                      </span>
                      {a.fileUrl && (
                        <a href={a.fileUrl} target="_blank" rel="noreferrer" style={{
                          fontSize: 12, color: T.blue, display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {Icons.link({ size: 12, stroke: T.blue })} Fayl
                        </a>
                      )}
                    </div>

                    {a.status === 'REJECTED' && a.rejectReason && (
                      <div style={{
                        marginTop: 8, padding: '6px 10px', borderRadius: 6,
                        background: T.redBg, border: `1px solid #fecaca`,
                        fontSize: 12.5, color: T.redText,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {Icons.alert({ size: 13, stroke: T.red })}
                        Rad sababi: {a.rejectReason}
                      </div>
                    )}
                  </div>

                  {/* Status + ball */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {a.status === 'REJECTED' && a.rejectReason ? (
                      <Tooltip content={`Rad sababi: ${a.rejectReason}`}>
                        <span style={{
                          fontSize: 11.5, padding: '3px 10px', borderRadius: 999,
                          background: sc.bg, color: sc.fg, fontWeight: 500, cursor: 'help',
                        }}>{sc.label}</span>
                      </Tooltip>
                    ) : (
                      <span style={{
                        fontSize: 11.5, padding: '3px 10px', borderRadius: 999,
                        background: sc.bg, color: sc.fg, fontWeight: 500,
                      }}>{sc.label}</span>
                    )}
                    {a.status === 'APPROVED' && a.ball > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.emerald }}>
                        +{a.ball} ball
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          <Pagination page={pag.page} pageCount={pag.pageCount} onChange={pag.setPage} total={pag.total} pageSize={pag.pageSize} style={{ borderTop: 0, padding: '4px 0 0', background: 'transparent' }} />
        </div>
      )}

      <AddAchievementDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

// ── sub components ──────────────────────────────────────────────────────────

function EmptyState({ onAdd, filtered }: { onAdd: () => void; filtered: boolean }) {
  return (
    <div style={{
      padding: '60px 24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 12, textAlign: 'center',
    }}>
      {Icons.award({ size: 48, stroke: T.border })}
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
        {filtered ? "Bu kategoriyada yutuq yo'q" : "Hozircha yutuq yo'q"}
      </div>
      <div style={{ fontSize: 13.5, color: T.textMuted, maxWidth: 320, lineHeight: 1.6 }}>
        {filtered
          ? "Boshqa toifani tanlang yoki yangi yutuq qo'shing"
          : "Sertifikat, xakaton, startap va boshqa yutuqlaringizni kiriting. Admin tasdiqlashidan so'ng ball qo'shiladi."}
      </div>
      {!filtered && (
        <Button variant="primary" onClick={onAdd} style={{ marginTop: 4 }}>
          Birinchi yutuqni qo'shish
        </Button>
      )}
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <Skeleton h={40} w={40} r={10} />
            <div style={{ flex: 1 }}>
              <Skeleton h={18} w={200} r={6} />
              <Skeleton h={14} w={300} r={4} style={{ marginTop: 8 }} />
              <Skeleton h={12} w={120} r={4} style={{ marginTop: 8 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
