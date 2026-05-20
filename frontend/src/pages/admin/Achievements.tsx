import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, File, Flame, Zap, Briefcase, Users, Globe, BookOpen,
  Heart, Award, FileText, Eye, Check, X, AlertCircle,
} from 'lucide-react';
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
  student: { id: string; fullName: string; group: { name: string } };
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

const TYPE_ICON: Record<string, React.ElementType> = {
  CERTIFICATE: File,
  HACKATHON:   Flame,
  STARTUP:     Zap,
  EMPLOYMENT:  Briefcase,
  MENTORING:   Users,
  LANGUAGE:    Globe,
  COURSE:      BookOpen,
  VOLUNTEER:   Heart,
  OTHER:       Award,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:  'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
};
const STATUS_DOT: Record<string, { bg: string; fg: string; dot: string }> = {
  PENDING:  { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  APPROVED: { bg: '#d1fae5', fg: '#065f46', dot: '#10b981' },
  REJECTED: { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_DOT[status] ?? { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 999,
      background: c.bg, color: c.fg,
      fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot, flexShrink: 0 }} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
function nameToColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: nameToColor(name), color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600,
    }}>{initials}</div>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function useAchievements(status: string) {
  return useQuery({
    queryKey: ['admin-achievements', status],
    queryFn: async () => (await api.get<Achievement[]>('/admin/achievements', { params: { status } })).data,
  });
}

export default function AdminAchievements() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectTarget, setRejectTarget] = useState<Achievement | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ballMap, setBallMap] = useState<Record<string, string>>({});

  const { data: pending  = [], isLoading: lPending  } = useAchievements('PENDING');
  const { data: approved = [], isLoading: lApproved } = useAchievements('APPROVED');
  const { data: rejected = [], isLoading: lRejected } = useAchievements('REJECTED');

  const reviewMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: object }) =>
      (await api.patch(`/admin/achievements/${id}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-achievements'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });

  function handleApprove(a: Achievement) {
    const ball = parseInt(ballMap[a.id] ?? '0') || 0;
    reviewMutation.mutate({ id: a.id, body: { status: 'APPROVED', ball } });
  }

  function handleRejectConfirm() {
    if (!rejectTarget) return;
    reviewMutation.mutate({
      id: rejectTarget.id,
      body: { status: 'REJECTED', rejectReason: rejectReason.trim() || "Sabab ko'rsatilmadi" },
    });
    setRejectTarget(null);
    setRejectReason('');
  }

  const tabs = [
    { id: 'PENDING'  as const, label: 'Kutilmoqda',   count: pending.length },
    { id: 'APPROVED' as const, label: 'Tasdiqlangan', count: approved.length },
    { id: 'REJECTED' as const, label: 'Rad etilgan',  count: rejected.length },
  ];

  const activeList = tab === 'PENDING' ? pending : tab === 'APPROVED' ? approved : rejected;
  const isLoading  = tab === 'PENDING' ? lPending : tab === 'APPROVED' ? lApproved : lRejected;

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">

        {/* Page header */}
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Yutuqlarni tasdiqlash</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Talabalar tomonidan kiritilgan sertifikat, hakaton, ish va boshqa yutuqlar
          </p>
        </div>

        {/* Tabs + content card */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Tab bar — pill container (design-exact) */}
          <div className="px-4 py-3 border-b border-slate-200">
            <div style={{
              display: 'inline-flex', padding: 3, borderRadius: 9,
              background: '#f8fafc', gap: 2,
            }}>
              {tabs.map(t => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 7, border: 0,
                      background: active ? '#fff' : 'transparent',
                      color: active ? '#0f172a' : '#64748b',
                      fontWeight: active ? 500 : 400, fontSize: 12.5,
                      cursor: 'pointer', transition: 'background .12s, color .12s',
                      boxShadow: active ? '0 1px 2px rgba(15,23,42,.04)' : 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {t.label}
                    {t.count != null && (
                      <span style={{
                        fontSize: 10.5, padding: '0 5px', borderRadius: 999,
                        background: '#f8fafc', color: '#64748b',
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 16, height: 16,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>{t.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-52 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-20 text-center">
              <Award className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-[13px] text-slate-400">Bu bo'limda yutuq yo'q</p>
            </div>
          ) : (
            <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {activeList.map(a => (
                <AchCard
                  key={a.id}
                  a={a}
                  ball={ballMap[a.id] ?? ''}
                  onBallChange={v => setBallMap(m => ({ ...m, [a.id]: v }))}
                  onApprove={() => handleApprove(a)}
                  onReject={() => { setRejectTarget(a); setRejectReason(''); }}
                  loading={reviewMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject dialog */}
      {rejectTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setRejectTarget(null)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Yutuqni rad etish</h2>
              <button onClick={() => setRejectTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-slate-500 mb-4">
              <span className="font-medium text-slate-800">{rejectTarget.title}</span>
              {' — sababni kiriting, talaba ko\'radi.'}
            </p>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">Rad etish sababi</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Masalan: Sertifikat oxirgi 6 oydan eski yoki tasdiqlovchi havola yo'q"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-slate-400 resize-none"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="h-8 px-4 rounded-lg border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={reviewMutation.isPending}
                className="h-8 px-4 rounded-lg bg-red-600 text-white text-[12.5px] font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Rad etish
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

/* ── Achievement Card ── */
function AchCard({
  a, ball, onBallChange, onApprove, onReject, loading,
}: {
  a: Achievement;
  ball: string;
  onBallChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const Icon = TYPE_ICON[a.type] ?? Award;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">

        {/* Top row: icon + title + date + status */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-900 leading-snug">{a.title}</p>
            <div className="flex items-center gap-2 mt-1 text-[11.5px] text-slate-400">
              <span>{TYPE_LABEL[a.type] ?? a.type}</span>
              <span className="text-slate-300">·</span>
              <span>{fmt(a.createdAt)}</span>
            </div>
          </div>
          <StatusBadge status={a.status} />
        </div>

        {/* Student row */}
        <div className="flex items-center gap-2 py-2.5 border-y border-slate-100 text-[12.5px]">
          <Avatar name={a.student.fullName} size={22} />
          <span className="font-medium text-slate-800">{a.student.fullName}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">{a.student.group?.name}</span>
        </div>

        {/* Description */}
        {a.description && (
          <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-2">{a.description}</p>
        )}

        {/* File preview */}
        {a.fileUrl && (
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-8 h-8 rounded-md bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0 text-[12px]">
              <p className="font-medium text-slate-700 truncate">
                {a.fileUrl.split('/').pop() ?? 'hujjat.pdf'}
              </p>
              <p className="text-slate-400 text-[11px]">PDF</p>
            </div>
            <a
              href={a.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 h-7 px-2.5 rounded-md border border-slate-200 text-[11.5px] text-slate-600 hover:bg-white transition-colors shrink-0"
            >
              <Eye className="w-3 h-3" /> Ko'rish
            </a>
          </div>
        )}

        {/* Reject reason */}
        {a.status === 'REJECTED' && a.rejectReason && (
          <div className="flex gap-2 p-2.5 bg-red-50 rounded-lg text-[12px] text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
            <div><strong>Sabab:</strong> {a.rejectReason}</div>
          </div>
        )}
      {/* Action row — no border-top, just padding inside card */}
      {a.status === 'PENDING' ? (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[12px] text-slate-500 whitespace-nowrap">Ball:</span>
            <input
              type="number"
              min={0}
              max={15}
              value={ball}
              onChange={e => onBallChange(e.target.value)}
              placeholder="0–15"
              className="w-[70px] h-7 px-2 rounded-lg border border-slate-200 text-[12.5px] text-center outline-none focus:border-slate-400 tabular-nums"
            />
          </div>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex items-center gap-1 h-7 px-3 rounded-lg border border-red-200 text-red-600 bg-red-50 text-[12px] font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-3 h-3" /> Rad etish
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex items-center gap-1 h-7 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3 h-3" /> Tasdiqlash
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-3">
          {a.status === 'APPROVED' ? (
            <span className="text-[12.5px] font-semibold text-emerald-700">
              +{a.ball} ball qo'shildi
            </span>
          ) : (
            <span className="text-[12.5px] text-slate-400">Rad etildi</span>
          )}
          <button className="text-[12px] text-slate-500 hover:text-slate-800 transition-colors">
            Qaytadan ko'rib chiqish
          </button>
        </div>
      )}
    </div>
  );
}
