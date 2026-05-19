import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Star, ExternalLink, X, CheckCircle, XCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

type Achievement = {
  id: string;
  type: string;
  title: string;
  description: string;
  fileUrl: string | null;
  ball: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  student: { id: string; fullName: string };
};

const TYPE_LABEL: Record<string, string> = {
  CERTIFICATE: 'Sertifikat',
  HACKATHON:   'Hackathon',
  STARTUP:     'Startup',
  EMPLOYMENT:  'Ish joyi',
  MENTORING:   'Mentorlik',
  LANGUAGE:    'Til sertifikati',
  COURSE:      'Kurs',
  VOLUNTEER:   'Volontyor',
  OTHER:       'Boshqa',
};

const TYPE_CLS: Record<string, string> = {
  CERTIFICATE: 'bg-blue-100 text-blue-700',
  HACKATHON:   'bg-purple-100 text-purple-700',
  STARTUP:     'bg-emerald-100 text-emerald-700',
  EMPLOYMENT:  'bg-teal-100 text-teal-700',
  MENTORING:   'bg-indigo-100 text-indigo-700',
  LANGUAGE:    'bg-orange-100 text-orange-700',
  COURSE:      'bg-cyan-100 text-cyan-700',
  VOLUNTEER:   'bg-pink-100 text-pink-700',
  OTHER:       'bg-slate-100 text-slate-600',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function useAchievements(status: string) {
  return useQuery({
    queryKey: ['admin-achievements', status],
    queryFn: async () =>
      (await api.get<Achievement[]>('/admin/achievements', { params: { status } })).data,
  });
}

export default function AdminAchievements() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<Achievement | null>(null);
  const [rejectReason, setRejectReason]  = useState('');
  const [ballMap, setBallMap] = useState<Record<string, number>>({});

  const { data: pending  = [], isLoading: lPending  } = useAchievements('PENDING');
  const { data: approved = [], isLoading: lApproved } = useAchievements('APPROVED');
  const { data: rejected = [], isLoading: lRejected } = useAchievements('REJECTED');

  const reviewMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: object }) =>
      (await api.patch(`/admin/achievements/${id}`, body)).data,
    onSuccess: (_data, { body }: { id: string; body: any }) => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      if (body.status === 'APPROVED') toast.success('Yutuq tasdiqlandi');
      else toast.success('Yutuq rad etildi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  function handleApprove(a: Achievement) {
    const ball = ballMap[a.id] ?? 0;
    reviewMutation.mutate({ id: a.id, body: { status: 'APPROVED', ball } });
  }

  function handleRejectConfirm() {
    if (!rejectTarget) return;
    reviewMutation.mutate({
      id: rejectTarget.id,
      body: { status: 'REJECTED', rejectReason: rejectReason.trim() || 'Sabab ko\'rsatilmadi' },
    });
    setRejectTarget(null);
    setRejectReason('');
  }

  function setBall(id: string, val: number) {
    setBallMap(m => ({ ...m, [id]: Math.max(0, Math.min(15, val)) }));
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Yutuqlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Talabalar yuborgan yutuqlarni ko'rib chiqish</p>
        </div>

        <Tabs.Root defaultValue="PENDING" className="space-y-5">
          <Tabs.List className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            <TabTrigger value="PENDING" label="Kutilayotgan" count={pending.length} />
            <TabTrigger value="APPROVED" label="Tasdiqlangan" count={approved.length} />
            <TabTrigger value="REJECTED" label="Rad etilgan"  count={rejected.length} />
          </Tabs.List>

          {/* PENDING */}
          <Tabs.Content value="PENDING">
            <AchievementList
              items={pending}
              isLoading={lPending}
              emptyText="Kutilayotgan yutuq yo'q"
              renderCard={a => (
                <PendingCard
                  key={a.id}
                  achievement={a}
                  ball={ballMap[a.id] ?? 0}
                  onBallChange={v => setBall(a.id, v)}
                  onApprove={() => handleApprove(a)}
                  onReject={() => setRejectTarget(a)}
                  loading={reviewMutation.isPending}
                />
              )}
            />
          </Tabs.Content>

          {/* APPROVED */}
          <Tabs.Content value="APPROVED">
            <AchievementList
              items={approved}
              isLoading={lApproved}
              emptyText="Tasdiqlangan yutuq yo'q"
              renderCard={a => <ReviewedCard key={a.id} achievement={a} variant="approved" />}
            />
          </Tabs.Content>

          {/* REJECTED */}
          <Tabs.Content value="REJECTED">
            <AchievementList
              items={rejected}
              isLoading={lRejected}
              emptyText="Rad etilgan yutuq yo'q"
              renderCard={a => <ReviewedCard key={a.id} achievement={a} variant="rejected" />}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Reject Dialog */}
      <Dialog.Root open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="font-semibold text-slate-900">Yutuqni rad etish</Dialog.Title>
              <button onClick={() => setRejectTarget(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {rejectTarget && (
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-slate-700">{rejectTarget.student.fullName}</span>
                {' — '}
                {rejectTarget.title}
              </p>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rad etish sababi
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Sabab kiriting..."
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={reviewMutation.isPending}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Rad etish
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
}

/* ── Tab trigger ─────────────────────────────────────────── */
function TabTrigger({ value, label, count }: { value: string; label: string; count: number }) {
  return (
    <Tabs.Trigger
      value={value}
      className="group flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
    >
      {label}
      {count > 0 && (
        <span className="bg-slate-200 group-data-[state=active]:bg-slate-900 group-data-[state=active]:text-white text-xs font-semibold px-1.5 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      )}
    </Tabs.Trigger>
  );
}

/* ── Achievement list wrapper ────────────────────────────── */
function AchievementList({
  items, isLoading, emptyText, renderCard,
}: {
  items: Achievement[];
  isLoading: boolean;
  emptyText: string;
  renderCard: (a: Achievement) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-xl">
        <Star className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(renderCard)}
    </div>
  );
}

/* ── Pending card ────────────────────────────────────────── */
function PendingCard({
  achievement: a, ball, onBallChange, onApprove, onReject, loading,
}: {
  achievement: Achievement;
  ball: number;
  onBallChange: (v: number) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border flex flex-col">
      <div className="p-4 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_CLS[a.type] ?? TYPE_CLS.OTHER}`}>
            {TYPE_LABEL[a.type] ?? a.type}
          </span>
          <span className="text-xs text-muted-foreground">{fmt(a.createdAt)}</span>
        </div>

        <p className="font-semibold text-slate-900 text-sm leading-snug">{a.title}</p>
        <p className="text-xs text-muted-foreground">{a.student.fullName}</p>

        {a.description && (
          <p className="text-xs text-slate-600 line-clamp-2">{a.description}</p>
        )}

        {a.fileUrl && (
          <a
            href={a.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
          >
            <FileText className="w-3.5 h-3.5" />
            Fayl ko'rish
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 shrink-0">Ball (0–15):</label>
          <input
            type="number"
            min={0}
            max={15}
            value={ball}
            onChange={e => onBallChange(Number(e.target.value))}
            className="w-20 h-8 px-2 rounded-md border text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlash
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Rad etish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reviewed card (approved / rejected) ─────────────────── */
function ReviewedCard({
  achievement: a, variant,
}: {
  achievement: Achievement;
  variant: 'approved' | 'rejected';
}) {
  return (
    <div className={`bg-white rounded-xl border flex flex-col ${variant === 'rejected' ? 'border-red-100' : ''}`}>
      <div className="p-4 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_CLS[a.type] ?? TYPE_CLS.OTHER}`}>
            {TYPE_LABEL[a.type] ?? a.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {a.reviewedAt ? fmt(a.reviewedAt) : fmt(a.createdAt)}
          </span>
        </div>

        <p className="font-semibold text-slate-900 text-sm leading-snug">{a.title}</p>
        <p className="text-xs text-muted-foreground">{a.student.fullName}</p>

        {a.description && (
          <p className="text-xs text-slate-600 line-clamp-2">{a.description}</p>
        )}

        {a.fileUrl && (
          <a
            href={a.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            Fayl ko'rish <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="border-t px-4 py-3">
        {variant === 'approved' ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Tasdiqlangan
            </span>
            <span className="text-sm font-bold text-emerald-700">+{a.ball} ball</span>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Rad etilgan
            </span>
            {a.rejectReason && (
              <p className="text-xs text-slate-500 italic">"{a.rejectReason}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
