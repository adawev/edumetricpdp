import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus, MoreVertical, Eye, Trophy, AlertTriangle, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

type Student = {
  id: string;
  fullName: string;
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  employmentBonus: number;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  grantReason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  paymentOverdue: boolean;
  group: { id: string; name: string; course: number; mentor: { fullName: string } | null };
  user: { email: string };
};

const STATUS_LABEL: Record<string, string> = {
  GRANTED:     'Grant berildi',
  PENDING:     'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q",
  UNKNOWN:     'Aniqlanmagan',
};
const STATUS_CLS: Record<string, string> = {
  GRANTED:     'bg-emerald-100 text-emerald-700',
  PENDING:     'bg-amber-100 text-amber-700',
  NOT_GRANTED: 'bg-red-100 text-red-700',
  UNKNOWN:     'bg-slate-100 text-slate-600',
};
const RISK_LABEL: Record<string, string> = { LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori' };
const RISK_CLS: Record<string, string> = {
  LOW:    'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH:   'bg-red-100 text-red-600',
};
const REASON_LABEL: Record<string, string> = {
  OK:              'Ball yetarli',
  GRANTED_OK:      'Grant tasdiqlangan',
  ACADEMIC_FAIL:   'GPA past (< 80%)',
  LOW_SCORE:       'Ball past (< 80)',
  PAYMENT_OVERDUE: "To'lov muddati o'tgan",
};

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
function nameToColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: nameToColor(name), color: '#fff', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600,
    }}>
      {initials}
    </div>
  );
}

function r1(n: number) { return Math.round(n * 10) / 10; }

function calcBreakdown(s: Student) {
  return {
    academic:   Math.min((s.gpa / 100) * 40, 40),
    attendance: Math.min((s.attendance / 100) * 20, 20),
    projects:   Math.min(s.projectScore, 15),
    activity:   Math.min(s.activityScore, 10),
    tutor:      Math.min(s.tutorScore, 5),
    discipline: Math.min(s.disciplineScore, 10),
  };
}

/* ── Row dropdown menu ── */
function RowMenu({ onView, onDelete }: { onView: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 32, zIndex: 50,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(15,23,42,.1)', minWidth: 168, padding: 4,
        }}>
          {[
            { icon: <Eye className="w-3.5 h-3.5" />, label: 'Batafsil', onClick: () => { onView(); setOpen(false); } },
            { icon: <Trophy className="w-3.5 h-3.5" />, label: 'Grant berish', onClick: () => setOpen(false) },
            { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Jarima belgilash', onClick: () => setOpen(false) },
          ].map((item, i) => (
            <button key={i} onClick={item.onClick} className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[12.5px] text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="text-slate-400">{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="my-1 h-px bg-slate-100 mx-2" />
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-[12.5px] text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />O'chirish
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminStudents() {
  const [q,        setQ]        = useState('');
  const [group,    setGroup]    = useState('all');
  const [status,   setStatus]   = useState('all');
  const [gpaMin,   setGpaMin]   = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [openStu,  setOpenStu]  = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
  });

  const groups = useMemo(() => [...new Set(students.map(s => s.group?.name).filter(Boolean))].sort(), [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (q.trim()) list = list.filter(s => s.fullName.toLowerCase().includes(q.toLowerCase()));
    if (group  !== 'all') list = list.filter(s => s.group?.name === group);
    if (status !== 'all') list = list.filter(s => s.grantStatus === status);
    list = list.filter(s => s.gpa >= gpaMin);
    return list;
  }, [students, q, group, status, gpaMin]);

  const allSelected  = filtered.length > 0 && filtered.every(s => selected[s.id]);
  const someSelected = filtered.some(s => selected[s.id]) && !allSelected;
  const selectedCount = filtered.filter(s => selected[s.id]).length;

  const masterRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (masterRef.current) masterRef.current.indeterminate = someSelected; }, [someSelected]);

  const toggleOne = (id: string) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => {
    if (allSelected) { setSelected({}); return; }
    const next: Record<string, boolean> = {};
    filtered.forEach(s => { next[s.id] = true; });
    setSelected(next);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">

        {/* Page header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Barcha talabalar</h1>
            <p className="text-[13.5px] text-slate-500 mt-1">
              {students.length} ta talaba · Filter bo'yicha {filtered.length} ta
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-[12.5px] font-medium text-white hover:bg-slate-800 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Talaba qo'shish
            </button>
          </div>
        </div>

        {/* Filter panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="grid gap-2.5" style={{ gridTemplateColumns: '2fr 1fr 1fr 1.4fr' }}>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Ism yoki email..."
              className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
            <select
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha statuslar</option>
              <option value="GRANTED">Grant berildi</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="NOT_GRANTED">Grant yo'q</option>
            </select>
            {/* GPA range slider */}
            <div className="flex items-center gap-2.5 text-[12.5px] text-slate-500">
              <span className="whitespace-nowrap">GPA ≥</span>
              <input
                type="range" min={0} max={100} value={gpaMin}
                onChange={e => setGpaMin(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#0f172a' }}
              />
              <span className="font-semibold text-slate-900 tabular-nums min-w-[36px] text-right">{gpaMin}%</span>
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <div style={{
            padding: '10px 14px', background: '#0f172a', color: '#fff',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span className="text-[13px]"><strong>{selectedCount}</strong> talaba tanlandi</span>
            <button style={{
              height: 28, padding: '0 10px', borderRadius: 7, border: 0,
              background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Trophy className="w-3 h-3" /> Grant berish
            </button>
            <button style={{
              height: 28, padding: '0 10px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,.2)', background: 'transparent',
              color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Download className="w-3 h-3" /> Eksport
            </button>
            <button
              onClick={() => setSelected({})}
              style={{
                height: 28, padding: '0 10px', borderRadius: 7, border: 0,
                background: 'transparent', color: 'rgba(255,255,255,.7)',
                fontSize: 12, cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              Tozalash
            </button>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">Talaba topilmadi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: 40, padding: '11px 12px' }}>
                      <input
                        ref={masterRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f172a', verticalAlign: 'middle' }}
                      />
                    </th>
                    {['Talaba','Guruh','Mentor','GPA','Davomat','Ball','Status'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i >= 3 && i <= 5 ? 'right' : 'left',
                        padding: '11px 16px', fontSize: 11.5, fontWeight: 600,
                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em',
                      }}>{h}</th>
                    ))}
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((stu, i) => (
                    <tr
                      key={stu.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: selected[stu.id] ? '#f8fafc' : 'transparent',
                        transition: 'background .1s',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '11px 12px', width: 40 }}>
                        <input
                          type="checkbox"
                          checked={!!selected[stu.id]}
                          onChange={() => toggleOne(stu.id)}
                          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f172a', verticalAlign: 'middle' }}
                        />
                      </td>
                      {/* Talaba */}
                      <td
                        style={{ padding: '11px 16px', cursor: 'pointer' }}
                        onClick={() => setOpenStu(stu)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={stu.fullName} size={30} />
                          <div>
                            <div style={{ fontWeight: 500, color: '#0f172a' }}>{stu.fullName}</div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{stu.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      {/* Guruh */}
                      <td style={{ padding: '11px 16px', color: '#64748b' }}>{stu.group?.name}</td>
                      {/* Mentor */}
                      <td style={{ padding: '11px 16px', color: '#64748b' }}>
                        {stu.group?.mentor?.fullName ?? '—'}
                      </td>
                      {/* GPA */}
                      <td style={{
                        padding: '11px 16px', textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: stu.gpa < 80 ? '#dc2626' : '#0f172a',
                        fontWeight: stu.gpa < 80 ? 600 : 400,
                      }}>
                        {stu.gpa.toFixed(1)}%
                      </td>
                      {/* Davomat */}
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>
                        {stu.attendance.toFixed(1)}%
                      </td>
                      {/* Ball */}
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>
                        {r1(stu.grantScore)}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '11px 16px' }}>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11.5px] font-medium ${STATUS_CLS[stu.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
                          {STATUS_LABEL[stu.grantStatus] ?? stu.grantStatus}
                        </span>
                      </td>
                      {/* 3-dot menu */}
                      <td style={{ padding: '11px 12px', width: 48 }}>
                        <RowMenu onView={() => setOpenStu(stu)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Side Sheet */}
      {openStu && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(15,23,42,.35)' }}
          onClick={() => setOpenStu(null)}
        />
      )}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 520,
        background: '#fff', zIndex: 50,
        boxShadow: '-12px 0 40px rgba(15,23,42,.12)',
        transform: openStu ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s cubic-bezier(.2,.7,.3,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {openStu && <StudentSheet student={openStu} onClose={() => setOpenStu(null)} />}
      </div>
    </AdminLayout>
  );
}

/* ── Student Sheet (slide-in panel) ── */
function StudentSheet({ student: s, onClose }: { student: Student; onClose: () => void }) {
  const bd = calcBreakdown(s);
  const base = Object.values(bd).reduce((a, b) => a + b, 0);
  const breakdownRows = [
    { label: 'Akademik (GPA)',  value: bd.academic,   max: 40,  raw: `${s.gpa.toFixed(1)}%` },
    { label: 'Davomat',         value: bd.attendance, max: 20,  raw: `${s.attendance.toFixed(1)}%` },
    { label: 'Loyihalar',       value: bd.projects,   max: 15,  raw: String(s.projectScore) },
    { label: 'Faollik',         value: bd.activity,   max: 10,  raw: String(s.activityScore) },
    { label: 'Tyutor bahosi',   value: bd.tutor,      max: 5,   raw: String(s.tutorScore) },
    { label: 'Intizom',         value: bd.discipline, max: 10,  raw: String(s.disciplineScore) },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar name={s.fullName} size={36} />
          <div>
            <h2 className="font-semibold text-[15px] text-slate-900">{s.fullName}</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">{s.user?.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Group / status / risk */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[12px] font-medium">
            {s.group?.name} · {s.group?.course}-kurs
          </span>
          <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium ${STATUS_CLS[s.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
            {STATUS_LABEL[s.grantStatus] ?? s.grantStatus}
          </span>
          <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium ${RISK_CLS[s.riskLevel] ?? ''}`}>
            Risk: {RISK_LABEL[s.riskLevel] ?? s.riskLevel}
          </span>
        </div>

        {/* Sabab */}
        {s.grantReason && s.grantReason !== 'OK' && (
          <p className="text-[12.5px] text-slate-500">
            Sabab: <span className="text-slate-800 font-medium">{REASON_LABEL[s.grantReason] ?? s.grantReason}</span>
          </p>
        )}

        {/* Jami ball */}
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-600">Jami grant ball</span>
          <span className="text-[32px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
            {r1(s.grantScore)}
          </span>
        </div>

        {/* Breakdown bars */}
        <div>
          <h3 className="text-[12.5px] font-semibold text-slate-700 mb-3">Ball taqsimoti</h3>
          <div className="space-y-3">
            {breakdownRows.map(row => {
              const pct = row.value / row.max;
              const barColor = pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#ef4444';
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {r1(row.value)} / {row.max}
                      <span className="text-slate-400 ml-1">({row.raw})</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(row.value / row.max) * 100}%`, background: barColor, transition: 'width .3s' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-500">Asosiy ball</span>
              <span className="font-semibold">{r1(base)} / 100</span>
            </div>
            {s.employmentBonus > 0 && (
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-emerald-600">Ish bonus</span>
                <span className="font-semibold text-emerald-600">+{s.employmentBonus}</span>
              </div>
            )}
            {s.paymentOverdue && (
              <div className="mt-2 text-[11.5px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                To'lov muddati o'tgan — grant berilmaydi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2 shrink-0">
        <button className="h-8 px-4 rounded-lg border border-red-200 text-[12.5px] font-medium text-red-600 hover:bg-red-50 transition-colors">
          Grant rad etish
        </button>
        <button className="h-8 px-4 rounded-lg bg-slate-900 text-[12.5px] font-medium text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" /> Grant berish
        </button>
      </div>
    </div>
  );
}
