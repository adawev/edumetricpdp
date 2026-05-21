import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Plus, X, ShieldCheck, Check } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6'];
function nameToColor(n: string) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(n: string) {
  const p = n.trim().split(' ');
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

type Group = { id: string; name: string; course: number };
type StudentBasic = { id: string; fullName: string; group: Group };
type Penalty = {
  id: string;
  studentId: string;
  type: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'HEAVY_PLUS' | 'HEAVY_PLUS_PLUS';
  ball: number;
  reason: string;
  recovered: number;
  recoveryTask: string | null;
  recoveryDone: boolean;
  createdAt: string;
  student: StudentBasic;
};
type StudentFull = StudentBasic & { grantScore: number; grantStatus: string };

const TYPE_META = [
  { type: 'LIGHT' as const,           label: 'Yengil',     ball: 1,  desc: 'Kichik tartib buzilishi',    color: '#d97706' },
  { type: 'MEDIUM' as const,          label: "O'rtacha",   ball: 3,  desc: "O'rta darajali buzilish",    color: '#ea580c' },
  { type: 'HEAVY' as const,           label: "Og'ir",      ball: 5,  desc: 'Jiddiy qoidabuzarlik',       color: '#dc2626' },
  { type: 'HEAVY_PLUS' as const,      label: "Og'ir+",     ball: 10, desc: "Og'ir qoidabuzarlik",        color: '#b91c1c' },
  { type: 'HEAVY_PLUS_PLUS' as const, label: "Og'ir++",    ball: 15, desc: 'Eng jiddiy qoidabuzarlik',   color: '#7f1d1d' },
];

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  LIGHT:           { bg: '#fffbeb', color: '#d97706', label: 'Yengil' },
  MEDIUM:          { bg: '#fff7ed', color: '#ea580c', label: "O'rtacha" },
  HEAVY:           { bg: '#fef2f2', color: '#dc2626', label: "Og'ir" },
  HEAVY_PLUS:      { bg: '#fef2f2', color: '#b91c1c', label: "Og'ir+" },
  HEAVY_PLUS_PLUS: { bg: '#fef2f2', color: '#7f1d1d', label: "Og'ir++" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPenalties() {
  const qc = useQueryClient();

  // New penalty form state
  const [newOpen, setNewOpen]       = useState(false);
  const [nStudentId, setNStudentId] = useState('');
  const [nGroup, setNGroup]         = useState('all');
  const [nType, setNType]           = useState<'LIGHT' | 'MEDIUM' | 'HEAVY' | 'HEAVY_PLUS' | 'HEAVY_PLUS_PLUS'>('LIGHT');
  const [nBall, setNBall]           = useState(1);
  const [nReason, setNReason]       = useState('');

  // Assign recovery task dialog
  const [assignTarget, setAssignTarget] = useState<Penalty | null>(null);
  const [assignTask, setAssignTask]     = useState('');



  const { data: penalties = [], isLoading } = useQuery({
    queryKey: ['admin-penalties'],
    queryFn: async () => (await api.get<Penalty[]>('/admin/penalties')).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<StudentFull[]>('/admin/students')).data,
  });

  const groupNames = useMemo(
    () => [...new Set(students.map(s => s.group?.name).filter(Boolean))].sort(),
    [students],
  );
  const formStudents = useMemo(
    () => nGroup === 'all' ? students : students.filter(s => s.group?.name === nGroup),
    [students, nGroup],
  );

  const kpi = useMemo(() => ({
    total:      penalties.length,
    active:     penalties.filter(p => !p.recoveryTask && !p.recoveryDone).length,
    inRecovery: penalties.filter(p => p.recoveryTask && !p.recoveryDone).length,
    closed:     penalties.filter(p => p.recoveryDone).length,
  }), [penalties]);

  const createMutation = useMutation({
    mutationFn: async (body: object) => (await api.post('/admin/penalties', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-penalties'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success("Jarima qo'shildi");
      setNewOpen(false);
      setNGroup('all'); setNStudentId(''); setNType('LIGHT'); setNBall(1); setNReason('');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: string }) =>
      (await api.post(`/admin/penalties/${id}/assign-recovery`, { task })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-penalties'] });
      toast.success('Reabilitatsiya qilindi');
      setAssignTarget(null); setAssignTask('');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: string }) => {
      const target = penalties.find(p => p.id === id)!;
      const recovered = Math.min(Math.ceil(target.ball * 0.5), 10);
      return (await api.post(`/admin/penalties/${id}/recover`, { recovered, task })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-penalties'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success("Reabilitatsiya bajarildi · Recovery ball qo'shildi");
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  function handleTypeChange(t: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'HEAVY_PLUS' | 'HEAVY_PLUS_PLUS') {
    setNType(t);
    setNBall(TYPE_META.find(m => m.type === t)!.ball);
  }

  function handleCreate() {
    if (!nStudentId) return toast.error('Talabani tanlang');
    if (!nReason.trim()) return toast.error('Sabab kiriting');
    createMutation.mutate({ studentId: nStudentId, type: nType, ball: nBall, reason: nReason.trim() });
  }

  function closeNew() {
    setNewOpen(false);
    setNStudentId(''); setNType('LIGHT'); setNBall(1); setNReason('');
  }

  const pag = usePagination(penalties, 25);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: 0 }}>Jarima va reabilitatsiya</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Talabalar jarimalarini boshqaring</p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8,
              background: '#0f172a', color: '#fff',
              fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            Yangi jarima
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Jami */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: '0 0 8px' }}>Jami jarimalar</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>{kpi.total}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Barcha jarimalar</p>
          </div>
          {/* Faol */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: '0 0 8px' }}>Faol (recovery yo'q)</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>{kpi.active}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Reabilitatsiyasiz</p>
          </div>
          {/* Recovery'da */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: '0 0 8px' }}>Recovery'da</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>{kpi.inRecovery}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Vazifa topshirildi</p>
          </div>
          {/* Yopilgan */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: '0 0 8px' }}>Yopilgan</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1 }}>{kpi.closed}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>To'liq tiklanib yopildi</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 48, borderRadius: 8, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : penalties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
            <AlertTriangle style={{ width: 40, height: 40, color: '#94a3b8', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Hozircha jarima yo'q</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Talaba</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Tur</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Ball</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Sabab</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Sana</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Recovery</th>
                    <th style={{ padding: '10px 16px', width: 160 }} />
                  </tr>
                </thead>
                <tbody>
                  {pag.pageItems.map((p, idx) => {
                    const bg = nameToColor(p.student.fullName);
                    const ini = initials(p.student.fullName);
                    const badge = TYPE_BADGE[p.type];
                    const isAssigned = !!p.recoveryTask && !p.recoveryDone;
                    const isDone = p.recoveryDone;
                    return (
                      <tr key={p.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9' }}>
                        {/* Talaba */}
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: bg, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, flexShrink: 0,
                            }}>{ini}</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{p.student.fullName}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1 }}>{p.student.group?.name}</p>
                            </div>
                          </div>
                        </td>
                        {/* Tur */}
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '2px 8px', borderRadius: 999,
                            background: badge.bg, color: badge.color,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.color, flexShrink: 0 }} />
                            {badge.label}
                          </span>
                        </td>
                        {/* Ball */}
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>−{p.ball}</span>
                        </td>
                        {/* Sabab */}
                        <td style={{ padding: '10px 16px', color: '#64748b', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.reason}>
                          {p.reason}
                        </td>
                        {/* Sana */}
                        <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(p.createdAt)}</td>
                        {/* Recovery holat — 3 state */}
                        <td style={{ padding: '10px 16px' }}>
                          {isDone ? (
                            <span title={p.recoveryTask ?? ''} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 999,
                              background: '#f0fdf4', color: '#16a34a',
                              fontSize: 11, fontWeight: 600,
                            }}>
                              <ShieldCheck style={{ width: 11, height: 11 }} />
                              Bajarildi · +{p.recovered}
                            </span>
                          ) : isAssigned ? (
                            <span title={p.recoveryTask ?? ''} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 999,
                              background: '#fffbeb', color: '#d97706',
                              fontSize: 11, fontWeight: 600, cursor: 'help',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                              Topshirildi
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 999,
                              background: '#f1f5f9', color: '#94a3b8',
                              fontSize: 11, fontWeight: 500,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                              Tayinlanmagan
                            </span>
                          )}
                        </td>
                        {/* Action */}
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          {!p.recoveryTask && !p.recoveryDone && (
                            <button
                              onClick={() => { setAssignTarget(p); setAssignTask(''); }}
                              style={{
                                fontSize: 12, padding: '5px 10px', borderRadius: 6,
                                border: '1px solid #e2e8f0', color: '#374151',
                                background: '#fff', fontWeight: 500, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Reabilitatsiya
                            </button>
                          )}
                          {p.recoveryTask && !p.recoveryDone && (
                            <button
                              onClick={() => completeMutation.mutate({ id: p.id, task: p.recoveryTask! })}
                              disabled={completeMutation.isPending}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 12, padding: '5px 10px', borderRadius: 6,
                                border: 'none', background: '#10b981', color: '#fff',
                                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                              }}
                            >
                              <Check style={{ width: 12, height: 12 }} />
                              Yopish
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pag.page}
              pageCount={pag.pageCount}
              onChange={pag.setPage}
              total={pag.total}
              pageSize={pag.pageSize}
            />
          </div>
        )}
      </div>

      {/* ── New Penalty Modal ── */}
      {newOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={closeNew} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 480,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,.15)', padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Yangi jarima</h2>
              <button onClick={closeNew} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Group filter */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Guruh</label>
                <select
                  value={nGroup}
                  onChange={e => { setNGroup(e.target.value); setNStudentId(''); }}
                  style={{
                    width: '100%', height: 36, padding: '0 12px',
                    borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="all">Barcha guruhlar</option>
                  {groupNames.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Student */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Talaba
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {formStudents.length} ta</span>
                </label>
                <select
                  value={nStudentId}
                  onChange={e => setNStudentId(e.target.value)}
                  style={{
                    width: '100%', height: 36, padding: '0 12px',
                    borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">— Tanlang —</option>
                  {formStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}{nGroup === 'all' ? ` (${s.group?.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Penalty type — 2-col card grid */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Jarima turi</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {TYPE_META.map((m, i) => {
                    const isLast = i === TYPE_META.length - 1;
                    const selected = nType === m.type;
                    return (
                      <button
                        key={m.type}
                        onClick={() => handleTypeChange(m.type)}
                        style={{
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          border: selected ? `2px solid ${m.color}` : '1.5px solid #e2e8f0',
                          background: '#fff',
                          transition: 'border-color .15s',
                          gridColumn: isLast ? '1 / -1' : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: selected ? m.color : '#374151' }}>{m.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: selected ? m.color : '#94a3b8' }}>−{m.ball} ball</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Sabab</label>
                <textarea
                  value={nReason}
                  onChange={e => setNReason(e.target.value)}
                  placeholder="Jarima sababi..."
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 12px',
                    borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 13, resize: 'none', outline: 'none',
                    fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={closeNew}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', cursor: 'pointer' }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, color: '#fff', background: '#dc2626', cursor: 'pointer', opacity: createMutation.isPending ? 0.5 : 1 }}
              >
                Jarima qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Recovery Modal ── */}
      {assignTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => { setAssignTarget(null); setAssignTask(''); }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 480,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,.15)', padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Reabilitatsiya vazifasi</h2>
              <button onClick={() => { setAssignTarget(null); setAssignTask(''); }} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Jarima: {assignTarget.reason}</p>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Vazifa matni</label>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Bajargandan keyin recovery ball qo'shiladi</span>
              </div>
              <textarea
                value={assignTask}
                onChange={e => setAssignTask(e.target.value)}
                placeholder="Masalan: Davomatni 90% gacha ko'tarish (2 hafta), barcha qarzlarni topshirish"
                rows={4}
                style={{
                  width: '100%', padding: '8px 12px',
                  borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 13, resize: 'none', outline: 'none',
                  fontFamily: 'inherit', color: '#0f172a', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAssignTarget(null); setAssignTask(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', cursor: 'pointer' }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => assignMutation.mutate({ id: assignTarget.id, task: assignTask })}
                disabled={assignMutation.isPending || assignTask.trim().length < 3}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, color: '#fff', background: '#0f172a', cursor: 'pointer', opacity: (assignMutation.isPending || assignTask.trim().length < 3) ? 0.5 : 1 }}
              >
                Tayinlash
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
