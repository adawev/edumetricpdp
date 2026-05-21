import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, ChevronRight, MessageSquare, Save, BookOpen, Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Sheet } from '@/components/Sheet';
import { TableSkeleton, ErrorState } from '@/components/States';
import { statusBadge, riskBadge, type GrantStatus, type GrantReason, type RiskLevel } from '@/lib/grantLabels';
import { T } from '@/lib/theme';
import { StudentsTable, NameCell, StatusPill, ScoreCell, RankCell, type Column } from '@/components/em/StudentsTable';

type Student = {
  id: string;
  fullName: string;
  email: string;
  groupId: string;
  gpa: number;
  attendance: number;
  projectScore: number;
  activityScore: number;
  tutorScore: number;
  disciplineScore: number;
  employmentBonus: number;
  grantScore: number;
  grantStatus: GrantStatus;
  grantReason: GrantReason;
  riskLevel: RiskLevel;
};

type Group = {
  id: string;
  name: string;
  course: number;
  students: Student[];
};

type SortKey = 'fullName' | 'gpa' | 'attendance' | 'grantScore';
type SortDir = 'asc' | 'desc';

const STATUS_TABS = [
  { value: 'ALL',         label: 'Hammasi' },
  { value: 'GRANTED',     label: 'Grant' },
  { value: 'PENDING',     label: 'Kutilmoqda' },
  { value: 'NOT_GRANTED', label: "Grant yo'q" },
];

const STATUS_THEME: Record<GrantStatus, { bg: string; fg: string }> = {
  GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText },
  PENDING:     { bg: T.amberBg,   fg: T.amberText },
  NOT_GRANTED: { bg: T.redBg,     fg: T.redText },
  UNKNOWN:     { bg: T.bgSubtle,  fg: T.textMuted },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
];
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const sz = `${size}px`;
  return (
    <div
      className={`${AVATAR_COLORS[idx]} text-white flex items-center justify-center rounded-full shrink-0 font-semibold`}
      style={{ width: sz, height: sz, fontSize: size * 0.37 }}
    >
      {initials}
    </div>
  );
}

// ── Score breakdown ───────────────────────────────────────────────────────────
type ScoreItem = { label: string; value: number; max: number; mentor?: boolean };

function buildBreakdown(s: Student): ScoreItem[] {
  return [
    { label: 'Akademik (GPA)',  value: (s.gpa / 100) * 40,       max: 40 },
    { label: 'Davomat',        value: (s.attendance / 100) * 20, max: 20 },
    { label: 'Loyihalar',      value: s.projectScore,             max: 15 },
    { label: 'Faollik',        value: s.activityScore,            max: 10 },
    { label: 'Tyutor bahosi',  value: s.tutorScore,               max: 5,  mentor: true },
    { label: 'Intizom',        value: s.disciplineScore,          max: 10, mentor: true },
  ];
}

function ScoreRow({ item }: { item: ScoreItem }) {
  const pct = Math.min((item.value / item.max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-muted-foreground">{item.label}</span>
        <span className="tabular-nums font-medium">
          {item.value.toFixed(1)}<span className="text-muted-foreground text-xs"> / {item.max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${item.mentor ? 'bg-emerald-500' : 'bg-slate-800'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Student sheet ─────────────────────────────────────────────────────────────
function StudentDetailSheet({ student, groupName, open, onClose }: {
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
  const status = statusBadge(student.grantStatus, student.grantReason);
  const risk   = riskBadge(student.riskLevel);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}
      title={student.fullName}
      description={`${groupName} · ${status.text}`}
    >
      <div className="p-6 space-y-5 overflow-y-auto">

        {/* Header: avatar + status */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Avatar name={student.fullName} size={52} />
          <div className="flex-1 min-w-0">
            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${status.cls}`}>
              {status.text}
            </span>
            <div className="text-xs text-muted-foreground mt-1.5">{groupName}</div>
          </div>
          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${risk.cls}`}>
            {risk.text}
          </span>
        </div>

        {/* 3 KPI mini cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { l: 'Umumiy ball', v: student.grantScore.toFixed(1) },
            { l: 'GPA',         v: `${student.gpa.toFixed(0)}%`, danger: student.gpa < 80 },
            { l: 'Davomat',     v: `${student.attendance.toFixed(0)}%`, danger: student.attendance < 75 },
          ].map((m, i) => (
            <div key={i} className="rounded-lg border bg-slate-50 p-3">
              <div className="text-[10.5px] text-muted-foreground font-semibold uppercase tracking-wide">{m.l}</div>
              <div className={`text-xl font-bold tabular-nums mt-1 ${m.danger ? 'text-red-600' : ''}`}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Score breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Ball taqsimoti</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              Baza: <span className="font-medium tabular-nums">{baseTotal.toFixed(1)} / 100</span>
            </span>
          </div>
          <div className="space-y-3">
            {breakdown.map(item => <ScoreRow key={item.label} item={item} />)}
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Mentor kiritadigan mezonlar
          </p>
        </div>

        {/* Intizom input */}
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <h3 className="text-[13px] font-semibold">Intizom bahosi</h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">0 dan 10 gacha</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} max={10} step={0.5}
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              className="w-20 h-9 px-3 rounded-md border bg-white text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-sm text-muted-foreground">/ 10</span>
            <button
              disabled={!isDirty || mutation.isPending}
              onClick={() => mutation.mutate(parsed)}
              className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 bg-slate-900 text-white text-[13px] font-medium rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
          {!isValid && discipline !== '' && (
            <p className="text-xs text-red-600">0 dan 10 gacha qiymat kiriting</p>
          )}
        </div>

        {/* Feedback button */}
        <button
          onClick={() => navigate('/mentor/feedback', { state: { studentId: student.id } })}
          className="w-full inline-flex items-center justify-center gap-2 h-10 border bg-white text-[13px] font-medium rounded-md hover:bg-slate-50 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback yozish
        </button>
      </div>
    </Sheet>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MentorStudents() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => (await api.get<Group[]>('/mentor/students')).data,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey]     = useState<SortKey>('grantScore');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [page, setPage]           = useState(1);
  const PAGE_SIZE = 15;

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

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
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
    return list.sort((a, b) => {
      const va = a[sortKey] as string | number;
      const vb = b[sortKey] as string | number;
      const cmp = typeof va === 'string' && typeof vb === 'string'
        ? va.localeCompare(vb)
        : (va as number) - (vb as number);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [allStudents, query, statusFilter, groupFilter, sortKey, sortDir]);

  const selected = useMemo(
    () => allStudents.find(s => s.id === selectedId) ?? null,
    [allStudents, selectedId],
  );

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  useEffect(() => { setPage(1); }, [query, statusFilter, groupFilter]);

  const tableColumns: Column<Student>[] = [
    { key: 'rank', label: '#', align: 'center', width: 56,
      render: (_r, { index }) => <RankCell rank={(currentPage - 1) * PAGE_SIZE + index + 1} /> },
    { key: 'fullName', label: 'Talaba', sortable: true,
      render: r => <NameCell name={r.fullName} email={r.email} /> },
    { key: 'group', label: 'Guruh', width: 120,
      render: r => <span style={{ color: T.textMuted }}>{groupNameById.get(r.groupId) ?? '—'}</span> },
    { key: 'gpa', label: 'GPA', align: 'right', sortable: true, width: 80,
      render: r => <ScoreCell value={`${r.gpa.toFixed(0)}%`} danger={r.gpa < 80} /> },
    { key: 'attendance', label: 'Davomat', align: 'right', sortable: true, width: 100,
      render: r => <ScoreCell value={`${r.attendance.toFixed(0)}%`} danger={r.attendance < 75} muted={!(r.attendance < 75)} /> },
    { key: 'grantScore', label: 'Ball', align: 'right', sortable: true, width: 80,
      render: r => <ScoreCell value={r.grantScore.toFixed(0)} /> },
    { key: 'status', label: 'Status', width: 160,
      render: r => {
        const st = statusBadge(r.grantStatus, r.grantReason);
        const sc = STATUS_THEME[r.grantStatus];
        return <StatusPill bg={sc.bg} fg={sc.fg} label={st.text} />;
      } },
    { key: '_chev', label: '', width: 32,
      render: () => <ChevronRight className="w-4 h-4" style={{ color: T.textSubtle }} /> },
  ];

  const counts = {
    ALL:         allStudents.length,
    GRANTED:     allStudents.filter(s => s.grantStatus === 'GRANTED').length,
    PENDING:     allStudents.filter(s => s.grantStatus === 'PENDING').length,
    NOT_GRANTED: allStudents.filter(s => s.grantStatus === 'NOT_GRANTED').length,
  };

  return (
    <div className="p-4 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Talabalar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading
            ? 'Yuklanmoqda...'
            : `Sizning ${allStudents.length} ta talabangiz — qatorga bosing batafsil ko'rish uchun`}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text" placeholder="Ism bo'yicha qidirish..."
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-md border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                className={`h-7 px-3 rounded-md text-[12.5px] font-medium transition-colors ${
                  statusFilter === t.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
                <span className="ml-1.5 tabular-nums text-[11px] text-slate-400">
                  {counts[t.value as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>

          {/* Group filter */}
          {data && data.length > 1 && (
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Barcha guruhlar</option>
              {data.map(g => (
                <option key={g.id} value={g.id}>{g.name} · {g.course}-kurs</option>
              ))}
            </select>
          )}
        </div>
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
          <StudentsTable
            columns={tableColumns}
            rows={paginated}
            onRowClick={s => setSelectedId(s.id)}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={k => toggleSort(k as SortKey)}
          />

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
              <div className="text-xs text-muted-foreground tabular-nums">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-md border bg-white text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Oldingi
                </button>
                <span className="px-3 text-xs text-muted-foreground tabular-nums">
                  {currentPage} / {pageCount}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="h-8 px-3 rounded-md border bg-white text-xs font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Keyingi
                </button>
              </div>
            </div>
          )}
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
