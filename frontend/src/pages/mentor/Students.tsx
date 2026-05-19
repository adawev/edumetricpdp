import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronRight, MessageSquare, Save, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Sheet } from '@/components/Sheet';
import { TableSkeleton, ErrorState } from '@/components/States';

type Student = {
  id: string;
  fullName: string;
  groupId: string;
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  employmentBonus: number;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};

type Group = {
  id: string;
  name: string;
  course: number;
  students: Student[];
};

const statusBadge: Record<string, string> = {
  GRANTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  NOT_GRANTED: 'bg-red-100 text-red-700 border-red-200',
  UNKNOWN: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusText: Record<string, string> = {
  GRANTED: 'Grant berildi',
  PENDING: 'Kutilmoqda',
  NOT_GRANTED: 'Grant yo\'q',
  UNKNOWN: 'Aniqlanmagan',
};

const riskBadge: Record<string, string> = {
  LOW: 'bg-emerald-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  HIGH: 'bg-red-500 text-white',
};

const riskText: Record<string, string> = {
  LOW: 'Past',
  MEDIUM: 'O\'rta',
  HIGH: 'Yuqori',
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Barcha holatlar' },
  { value: 'GRANTED', label: 'Grant berildi' },
  { value: 'PENDING', label: 'Kutilmoqda' },
  { value: 'NOT_GRANTED', label: 'Grant yo\'q' },
];

type ScoreBreakdown = { label: string; value: number; max: number; cls: string };

function buildBreakdown(s: Student): ScoreBreakdown[] {
  return [
    { label: 'Akademik (GPA)', value: (s.gpa / 100) * 40, max: 40, cls: 'bg-slate-900' },
    { label: 'Davomat', value: (s.attendance / 100) * 20, max: 20, cls: 'bg-slate-900' },
    { label: 'Loyihalar', value: s.projectScore, max: 15, cls: 'bg-slate-900' },
    { label: 'Faollik', value: s.activityScore, max: 10, cls: 'bg-slate-900' },
    { label: 'Tyutor bahosi', value: s.tutorScore, max: 5, cls: 'bg-emerald-500' },
    { label: 'Intizom', value: s.disciplineScore, max: 10, cls: 'bg-emerald-500' },
  ];
}

function ScoreRow({ item }: { item: ScoreBreakdown }) {
  const pct = Math.min((item.value / item.max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{item.label}</span>
        <span className="tabular-nums font-medium">
          {item.value.toFixed(1)}<span className="text-muted-foreground"> / {item.max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${item.cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StudentDetailSheet({
  student,
  groupName,
  open,
  onClose,
}: {
  student: Student | null;
  groupName: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [discipline, setDiscipline] = useState<string>('');

  useEffect(() => {
    if (student) setDiscipline(student.disciplineScore.toFixed(1));
  }, [student?.id]);

  const mutation = useMutation({
    mutationFn: async (score: number) => {
      await api.post('/mentor/discipline', { studentId: student!.id, score });
    },
    onSuccess: () => {
      toast.success('Intizom bahosi saqlandi');
      qc.invalidateQueries({ queryKey: ['mentor-students'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Saqlashda xato');
    },
  });

  if (!student) return null;

  const breakdown = buildBreakdown(student);
  const baseTotal = breakdown.reduce((s, x) => s + x.value, 0);
  const parsed = parseFloat(discipline);
  const isValid = !isNaN(parsed) && parsed >= 0 && parsed <= 10;
  const isDirty = isValid && parsed.toFixed(1) !== student.disciplineScore.toFixed(1);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()} title={student.fullName} description={`${groupName} · ${statusText[student.grantStatus]}`}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="text-xs text-muted-foreground">Umumiy ball</div>
            <div className="text-2xl font-bold tabular-nums mt-1">{student.grantScore.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="text-xs text-muted-foreground">GPA</div>
            <div className="text-2xl font-bold tabular-nums mt-1">{student.gpa.toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="text-xs text-muted-foreground">Davomat</div>
            <div className="text-2xl font-bold tabular-nums mt-1">{student.attendance.toFixed(0)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${statusBadge[student.grantStatus]}`}>
            {statusText[student.grantStatus]}
          </span>
          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${riskBadge[student.riskLevel]}`}>
            Risk: {riskText[student.riskLevel]}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Ball taqsimoti</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              Baza: <span className="font-medium tabular-nums">{baseTotal.toFixed(1)} / 100</span>
            </span>
          </div>
          <div className="space-y-3">
            {breakdown.map(item => <ScoreRow key={item.label} item={item} />)}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />
            Mentor kiritadigan mezonlar
          </p>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm">Intizom bahosi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">0 dan 10 gacha, max 10 ball grant ballga qo'shiladi</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              className="w-24 h-10 px-3 rounded-md border bg-white text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-sm text-muted-foreground">/ 10</span>
            <button
              disabled={!isDirty || mutation.isPending}
              onClick={() => mutation.mutate(parsed)}
              className="ml-auto inline-flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
          {!isValid && discipline !== '' && (
            <p className="text-xs text-red-600">0 dan 10 gacha qiymat kiriting</p>
          )}
        </div>

        <button
          onClick={() => navigate('/mentor/feedback', { state: { studentId: student.id } })}
          className="w-full inline-flex items-center justify-center gap-2 h-10 border bg-white text-sm font-medium rounded-md hover:bg-slate-50"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback yozish
        </button>
      </div>
    </Sheet>
  );
}

export default function MentorStudents() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => (await api.get<Group[]>('/mentor/students')).data,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('student');
    if (id) setSelectedId(id);
  }, [searchParams]);

  function closeSheet() {
    setSelectedId(null);
    if (searchParams.has('student')) {
      searchParams.delete('student');
      setSearchParams(searchParams, { replace: true });
    }
  }

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    (data ?? []).forEach(g => m.set(g.id, g.name));
    return m;
  }, [data]);

  const allStudents = useMemo(() => (data ?? []).flatMap(g => g.students), [data]);

  const filtered = useMemo(() => {
    let list = allStudents;
    if (groupFilter !== 'ALL') list = list.filter(s => s.groupId === groupFilter);
    if (statusFilter !== 'ALL') list = list.filter(s => s.grantStatus === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s => s.fullName.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.grantScore - a.grantScore);
  }, [allStudents, query, statusFilter, groupFilter]);

  const selected = useMemo(
    () => allStudents.find(s => s.id === selectedId) ?? null,
    [allStudents, selectedId],
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Talabalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? 'Yuklanmoqda...' : `${filtered.length} ta ${allStudents.length} dan`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Talaba ismi..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 pl-9 pr-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {data && data.length > 1 && (
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">Barcha guruhlar</option>
            {data.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </div>

      {isLoading && <TableSkeleton rows={8} cols={7} />}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-white">
          <Search className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">Talaba topilmadi</p>
          <p className="text-sm text-muted-foreground">Filter va qidiruvni o'zgartiring</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium w-12">#</th>
                  <th className="px-4 py-3 font-medium">Ism</th>
                  <th className="px-4 py-3 font-medium">Guruh</th>
                  <th className="px-4 py-3 font-medium text-right">GPA</th>
                  <th className="px-4 py-3 font-medium text-right">Davomat</th>
                  <th className="px-4 py-3 font-medium text-right">Ball</th>
                  <th className="px-4 py-3 font-medium">Holat</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="border-t hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{groupNameById.get(s.groupId) ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.gpa.toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.attendance.toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{s.grantScore.toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${statusBadge[s.grantStatus]}`}>
                        {statusText[s.grantStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${riskBadge[s.riskLevel]}`}>
                        {riskText[s.riskLevel]}
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

      <StudentDetailSheet
        student={selected}
        groupName={selected ? (groupNameById.get(selected.groupId) ?? '') : ''}
        open={!!selectedId}
        onClose={closeSheet}
      />
    </div>
  );
}
