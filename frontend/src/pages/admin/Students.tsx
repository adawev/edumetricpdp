import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, ChevronRight, X, Users } from 'lucide-react';
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
  createdAt: string;
  group: { id: string; name: string; course: number };
};

const STATUS_LABEL: Record<string, string> = {
  GRANTED:     "Grant berildi",
  PENDING:     "Kutilmoqda",
  NOT_GRANTED: "Grant yo'q",
  UNKNOWN:     "Aniqlanmagan",
};
const STATUS_CLS: Record<string, string> = {
  GRANTED:     'bg-emerald-100 text-emerald-700',
  PENDING:     'bg-amber-100 text-amber-700',
  NOT_GRANTED: 'bg-red-100 text-red-700',
  UNKNOWN:     'bg-slate-100 text-slate-600',
};
const RISK_LABEL: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori',
};
const RISK_CLS: Record<string, string> = {
  LOW:    'bg-emerald-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  HIGH:   'bg-red-500 text-white',
};
const REASON_LABEL: Record<string, string> = {
  OK:              "Ball yetarli",
  GRANTED_OK:      "Grant tasdiqlangan",
  ACADEMIC_FAIL:   "GPA past (< 80%)",
  LOW_SCORE:       "Ball past (< 80)",
  PAYMENT_OVERDUE: "To'lov muddati o'tgan",
};

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

export default function AdminStudents() {
  const [search, setSearch]       = useState('');
  const [groupId, setGroupId]     = useState('');
  const [status, setStatus]       = useState('');
  const [selected, setSelected]   = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<Student[]>('/admin/students')).data,
  });

  const groups = useMemo(() => {
    const seen = new Set<string>();
    return students
      .filter(s => s.group && !seen.has(s.group.id) && seen.add(s.group.id))
      .map(s => s.group);
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.group?.name.toLowerCase().includes(q)
      );
    }
    if (groupId) list = list.filter(s => s.group?.id === groupId);
    if (status)  list = list.filter(s => s.grantStatus === status);
    return list;
  }, [students, search, groupId, status]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Talabalar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Jami {students.length} ta talaba
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ism yoki guruh..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Barcha holatlar</option>
            <option value="GRANTED">Grant berildi</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="NOT_GRANTED">Grant yo'q</option>
          </select>
          {(search || groupId || status) && (
            <button
              onClick={() => { setSearch(''); setGroupId(''); setStatus(''); }}
              className="h-9 px-3 rounded-md border bg-white text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Tozalash
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Talaba topilmadi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b text-muted-foreground text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">#</th>
                    <th className="px-4 py-3 font-medium">Ism</th>
                    <th className="px-4 py-3 font-medium">Guruh</th>
                    <th className="px-4 py-3 font-medium text-right">GPA</th>
                    <th className="px-4 py-3 font-medium text-right">Ball</th>
                    <th className="px-4 py-3 font-medium">Holat</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="border-t hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{s.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.group?.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={s.gpa < 80 ? 'text-red-600 font-semibold' : ''}>
                          {s.gpa.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {Math.round(s.grantScore * 10) / 10}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_CLS[s.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
                          {STATUS_LABEL[s.grantStatus] ?? s.grantStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${RISK_CLS[s.riskLevel] ?? ''}`}>
                          {RISK_LABEL[s.riskLevel] ?? s.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog.Root open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto focus:outline-none">
            {selected && <StudentDetail student={selected} onClose={() => setSelected(null)} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
}

function StudentDetail({ student: s, onClose }: { student: Student; onClose: () => void }) {
  const bd = calcBreakdown(s);
  const breakdownRows = [
    { label: 'Akademik (GPA)',   value: bd.academic,   max: 40,  raw: `${s.gpa.toFixed(1)}%` },
    { label: 'Davomat',          value: bd.attendance, max: 20,  raw: `${s.attendance.toFixed(1)}%` },
    { label: 'Loyihalar',        value: bd.projects,   max: 15,  raw: String(s.projectScore) },
    { label: 'Faollik',          value: bd.activity,   max: 10,  raw: String(s.activityScore) },
    { label: 'Tyutor bahosi',    value: bd.tutor,      max: 5,   raw: String(s.tutorScore) },
    { label: 'Intizom',          value: bd.discipline, max: 10,  raw: String(s.disciplineScore) },
  ];
  const base = Object.values(bd).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="font-semibold text-slate-900">{s.fullName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{s.group?.name} · {s.group?.course}-kurs</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Status & Risk */}
        <div className="flex gap-3">
          <span className={`px-3 py-1 rounded-md text-sm font-medium ${STATUS_CLS[s.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
            {STATUS_LABEL[s.grantStatus] ?? s.grantStatus}
          </span>
          <span className={`px-3 py-1 rounded-md text-sm font-medium ${RISK_CLS[s.riskLevel] ?? ''}`}>
            Risk: {RISK_LABEL[s.riskLevel] ?? s.riskLevel}
          </span>
        </div>

        {/* Sabab */}
        {s.grantReason && (
          <p className="text-sm text-muted-foreground">
            Sabab: <span className="text-slate-700 font-medium">{REASON_LABEL[s.grantReason] ?? s.grantReason}</span>
          </p>
        )}

        {/* Jami ball */}
        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Jami grant ball</span>
          <span className="text-3xl font-bold text-slate-900 tabular-nums">
            {Math.round(s.grantScore * 10) / 10}
          </span>
        </div>

        {/* Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Ball taqsimoti</h3>
          <div className="space-y-3">
            {breakdownRows.map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-medium tabular-nums">
                    {Math.round(row.value * 10) / 10} / {row.max}
                    <span className="text-muted-foreground ml-1">({row.raw})</span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full"
                    style={{ width: `${(row.value / row.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Base sum */}
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
            <span className="text-slate-600">Asosiy ball jami</span>
            <span className="font-semibold">{Math.round(base * 10) / 10} / 100</span>
          </div>
          {s.employmentBonus > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-emerald-600">Ish bonus</span>
              <span className="font-semibold text-emerald-600">+{s.employmentBonus}</span>
            </div>
          )}
          {(() => {
            const penaltyNet = Math.round((base + Math.min(s.employmentBonus, 10) - s.grantScore) * 10) / 10;
            return penaltyNet > 0.05 ? (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-red-600">Net jarima</span>
                <span className="font-semibold text-red-600">−{penaltyNet}</span>
              </div>
            ) : null;
          })()}
          {s.paymentOverdue && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
              To'lov muddati o'tgan — grant berilmaydi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
