import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, File, Flame, Zap, Briefcase, Users, Globe, BookOpen,
  Heart, Award, FileText, Eye, Check, X, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

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
  PENDING:  { bg: '#fffbeb', fg: '#92400e', dot: '#f59e0b' },
  APPROVED: { bg: '#ecfdf5', fg: '#065f46', dot: '#10b981' },
  REJECTED: { bg: '#fef2f2', fg: '#991b1b', dot: '#ef4444' },
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

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 12px', height: 32, borderRadius: 8,
        background: hov ? '#f8fafc' : 'transparent',
        color: '#0f172a', border: '1px solid transparent',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'background .12s',
      }}
    >
      {children}
    </button>
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

  const pag = usePagination(activeList, 12, [tab]);

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

          {/* Tab bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{
              display: 'inline-flex', padding: 3, borderRadius: 9,
              background: '#f1f5f9', gap: 2,
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
            <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
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
            <>
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {pag.pageItems.map(a => (
                  <AchCard
                    key={a.id}
                    a={a}
                    ball={ballMap[a.id] ?? ''}
                    onBallChange={v => setBallMap(m => ({ ...m, [a.id]: v }))}
                    onApprove={() => handleApprove(a)}
                    onReject={() => { setRejectTarget(a); setRejectReason(''); }}
                    onReopen={() => {}}
                    loading={reviewMutation.isPending}
                  />
                ))}
              </div>
              <Pagination
                page={pag.page}
                pageCount={pag.pageCount}
                onChange={pag.setPage}
                total={pag.total}
                pageSize={pag.pageSize}
              />
            </>
          )}
        </div>
      </div>

      {/* Reject dialog */}
      {rejectTarget && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setRejectTarget(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 520, maxWidth: 'calc(100vw - 40px)', background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(15,23,42,.25)', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div style={{ padding: '18px 22px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Yutuqni rad etish</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  "{rejectTarget.title}" — sababni kiriting, talaba ko'radi.
                </div>
              </div>
              <button onClick={() => setRejectTarget(null)} style={{ width: 28, height: 28, border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer', borderRadius: 6, display: 'grid', placeItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Rad etish sababi</div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Masalan: Sertifikat oxirgi 6 oydan eski yoki tasdiqlovchi havola yo'q"
                style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: 13, color: '#0f172a', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 8, borderRadius: '0 0 12px 12px' }}>
              <button onClick={() => setRejectTarget(null)} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: '#0f172a' }}>
                Bekor qilish
              </button>
              <button onClick={handleRejectConfirm} disabled={reviewMutation.isPending} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: 0, background: '#ef4444', color: '#fff', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: reviewMutation.isPending ? 0.6 : 1 }}>
                <X size={13} /> Rad etish
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/* ── Achievement Card ── */
function AchCard({
  a, ball, onBallChange, onApprove, onReject, onReopen, loading,
}: {
  a: Achievement;
  ball: string;
  onBallChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onReopen: () => void;
  loading: boolean;
}) {
  const Icon = TYPE_ICON[a.type] ?? Award;

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', padding: 16 }}>

      {/* Top row: icon + title + date + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color: '#64748b' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{a.title}</p>
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>{TYPE_LABEL[a.type] ?? a.type}</span>
            <span style={{ color: '#94a3b8' }}>·</span>
            <span>{fmt(a.createdAt)}</span>
          </div>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {/* Student row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #e2e8f0', fontSize: 12.5 }}>
        <Avatar name={a.student.fullName} size={22} />
        <span style={{ fontWeight: 500, color: '#0f172a' }}>{a.student.fullName}</span>
        <span style={{ color: '#64748b' }}>·</span>
        <span style={{ color: '#64748b' }}>{a.student.group?.name}</span>
      </div>

      {/* Description */}
      {a.description && (
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>{a.description}</p>
      )}

      {/* File preview */}
      {a.fileUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#f8fafc', borderRadius: 8, marginBottom: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 32, height: 32, borderRadius: 5, background: '#fef2f2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FileText style={{ width: 14, height: 14, color: '#ef4444' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
            <p style={{ fontWeight: 500, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.fileUrl.split('/').pop() ?? 'hujjat.pdf'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 11, margin: 0 }}>PDF · 1.2 MB</p>
          </div>
          <a
            href={a.fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', fontSize: 12.5, color: '#0f172a', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Eye style={{ width: 13, height: 13 }} /> Ko'rish
          </a>
        </div>
      )}

      {/* Reject reason */}
      {a.status === 'REJECTED' && a.rejectReason && (
        <div style={{ padding: '8px 10px', background: '#fef2f2', borderRadius: 6, fontSize: 12, color: '#991b1b', marginBottom: 10, display: 'flex', gap: 6 }}>
          <AlertCircle style={{ width: 13, height: 13, color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
          <div><strong>Sabab:</strong> {a.rejectReason}</div>
        </div>
      )}

      {/* Action row */}
      {a.status === 'PENDING' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Ball:</span>
            <input
              type="number"
              min={0}
              max={15}
              value={ball}
              onChange={e => onBallChange(e.target.value)}
              placeholder="0–15"
              style={{ width: 70, height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, textAlign: 'center', outline: 'none', fontVariantNumeric: 'tabular-nums' }}
            />
          </div>
          <button
            onClick={onReject}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            <X style={{ width: 13, height: 13 }} /> Rad etish
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            <Check style={{ width: 13, height: 13 }} /> Tasdiqlash
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#64748b' }}>
          <span>
            {a.status === 'APPROVED'
              ? <span style={{ color: '#059669', fontWeight: 600 }}>+{a.ball} ball qo'shildi</span>
              : 'Rad etildi'}
          </span>
          <GhostButton onClick={onReopen}>Qaytadan ko'rib chiqish</GhostButton>
        </div>
      )}
    </div>
  );
}
