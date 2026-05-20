import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, RefreshCw, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/States';

type Student = {
  id: string;
  fullName: string;
  gpa: number;
  attendance: number;
  grantScore: number;
  disciplineScore: number;
};

type Group = {
  id: string;
  name: string;
  course: number;
  students: Student[];
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
];
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
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

// ── Score color helpers ───────────────────────────────────────────────────────
function scoreTone(v: number) {
  if (v >= 9) return { text: 'text-emerald-700', bg: 'bg-emerald-50', accent: '#10b981' };
  if (v >= 7) return { text: 'text-amber-700',   bg: 'bg-amber-50',   accent: '#f59e0b' };
  return           { text: 'text-red-700',       bg: 'bg-red-50',     accent: '#ef4444' };
}

const GRID = '32px 1fr 130px 360px';

// ─────────────────────────────────────────────────────────────────────────────
export default function MentorDiscipline() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => (await api.get<Group[]>('/mentor/students')).data,
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [scores, setScores]   = useState<Record<string, number>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 15;

  // Init scores when data loads
  useEffect(() => {
    if (!data) return;
    if (!selectedGroupId && data.length > 0) setSelectedGroupId(data[0].id);
    setScores(prev => {
      const next = { ...prev };
      data.flatMap(g => g.students).forEach(s => {
        if (next[s.id] == null) next[s.id] = s.disciplineScore;
      });
      return next;
    });
  }, [data]);

  const selectedGroup = data?.find(g => g.id === selectedGroupId);
  const groupStudents = selectedGroup?.students ?? [];

  const pageCount = Math.max(1, Math.ceil(groupStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedStudents = groupStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [selectedGroupId]);

  const setOne = (id: string, v: number) => {
    setScores(p => ({ ...p, [id]: Math.max(0, Math.min(10, v)) }));
  };
  const setAll = (v: number) => {
    setScores(p => {
      const next = { ...p };
      groupStudents.forEach(s => { next[s.id] = v; });
      return next;
    });
  };

  // Save individual student
  const saveOne = async (studentId: string) => {
    setSaving(studentId);
    try {
      await api.post('/mentor/discipline', { studentId, score: scores[studentId] ?? 0 });
      await qc.invalidateQueries({ queryKey: ['mentor-students'] });
      toast.success('Saqlandi');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Xato');
    } finally {
      setSaving(null);
    }
  };

  // Save all
  const saveAll = async () => {
    setSaving('all');
    try {
      await Promise.all(
        groupStudents.map(s =>
          api.post('/mentor/discipline', { studentId: s.id, score: scores[s.id] ?? 0 })
        )
      );
      await qc.invalidateQueries({ queryKey: ['mentor-students'] });
      toast.success(`${selectedGroup?.name} guruhi · ${groupStudents.length} ta talaba saqlandi`);
    } catch {
      toast.error('Saqlashda xato');
    } finally {
      setSaving(null);
    }
  };

  // Reset to original (server) values
  const resetScores = () => {
    if (!data) return;
    const next: Record<string, number> = {};
    data.flatMap(g => g.students).forEach(s => { next[s.id] = s.disciplineScore; });
    setScores(next);
  };

  const avg = groupStudents.length
    ? (groupStudents.reduce((a, s) => a + (scores[s.id] ?? 0), 0) / groupStudents.length)
    : 0;

  const avgTone = scoreTone(avg);

  // Dirty — joriy ballar serverdagi qiymatdan farq qiladimi (hisoblanadi, state emas)
  const dirty = useMemo(() => {
    if (!data) return false;
    const orig = new Map<string, number>();
    data.flatMap(g => g.students).forEach(s => orig.set(s.id, s.disciplineScore));
    return Object.entries(scores).some(([id, v]) => orig.has(id) && orig.get(id) !== v);
  }, [scores, data]);

  return (
    <div className="p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Intizom bahosi
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 cursor-help"
              title="Korporativ madaniyat va intizom — akademik halollik, dars intizomi, dress code, yotoqxona tartibi. Nizom 2026.1 mezon 6 · max 10 ball"
            >
              <Info className="w-3 h-3" />
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Har talaba uchun intizom darajasini 0–10 ball bilan baholang · max 10 ball grant nizomida
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAll(8)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-white text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Hammasi 8.0
          </button>
          <button
            onClick={() => setAll(10)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border bg-white text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Hammasi 10
          </button>
        </div>
      </div>

      {isError && <ErrorState onRetry={() => refetch()} />}

      {/* Toolbar */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-4">
          {/* Group selector */}
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {(data ?? []).map(g => (
              <option key={g.id} value={g.id}>{g.name} · {g.course}-kurs</option>
            ))}
          </select>

          {/* Avg badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Guruh o'rtacha:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-[13px] ${avgTone.bg} ${avgTone.text}`}>
              {avg.toFixed(1)} / 10
            </span>
          </div>

          {/* LMS notice */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3 h-3" />
            Davomat va GPA — LMS'dan keladi, qo'lda kiritilmaydi
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !isError && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Table header */}
          <div className="grid items-center border-b bg-slate-50 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: GRID }}
          >
            <span>#</span>
            <span>Talaba</span>
            <span className="text-right">LMS davomat</span>
            <span className="text-center">Intizom (0–10)</span>
          </div>

          {groupStudents.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Bu guruhda talaba yo'q
            </div>
          )}

          {paginatedStudents.map((stu, i) => {
            const cur   = scores[stu.id] ?? 0;
            const tone  = scoreTone(cur);
            const isSaving = saving === stu.id || saving === 'all';

            return (
              <div
                key={stu.id}
                className="grid items-center px-5 py-3 border-b"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="text-xs text-slate-400 tabular-nums">{(currentPage - 1) * PAGE_SIZE + i + 1}</span>

                {/* Student */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={stu.fullName} size={32} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[13.5px] font-medium truncate">{stu.fullName}</div>
                      {stu.disciplineScore > 0 ? (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-px rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Baholangan
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-px rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                          Yangi
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      GPA <span className={`font-medium ${stu.gpa < 80 ? 'text-red-600' : ''}`}>{Math.round(stu.gpa)}%</span>
                      {' · '}Ball <span className="font-medium">{Math.round(stu.grantScore)}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance (from LMS, read-only) */}
                <div className={`text-right tabular-nums text-[13px] font-medium ${stu.attendance < 75 ? 'text-red-600' : 'text-slate-700'}`}>
                  {Math.round(stu.attendance)}%
                </div>

                {/* Slider */}
                <div className="flex items-center gap-2.5 px-3">
                  <input
                    type="range" min={0} max={10} step={0.5}
                    value={cur}
                    onChange={e => setOne(stu.id, parseFloat(e.target.value))}
                    style={{ accentColor: tone.accent }}
                    className="flex-1 h-1.5 cursor-pointer"
                  />
                  <button
                    onClick={() => saveOne(stu.id)}
                    disabled={isSaving}
                    className={`min-w-[52px] text-center px-2 py-1 rounded-md text-[13px] font-bold tabular-nums ${tone.bg} ${tone.text} disabled:opacity-60`}
                    title="Saqlash"
                  >
                    {isSaving ? '...' : cur.toFixed(1)}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-t bg-white">
              <div className="text-xs text-muted-foreground tabular-nums">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, groupStudents.length)} / {groupStudents.length}
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

          {/* Save bar — card ichida, pastda */}
          {groupStudents.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50">
              <div className="text-sm text-muted-foreground">
                {dirty ? (
                  <span className="text-amber-600 font-medium">● Saqlanmagan o'zgarishlar bor</span>
                ) : (
                  <span>Barcha o'zgarishlar saqlangan</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetScores}
                  disabled={!dirty}
                  className="h-9 px-4 rounded-md border bg-white text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Bekor qilish
                </button>
                <button
                  disabled={!dirty || saving === 'all'}
                  onClick={saveAll}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-4 h-4" />
                  {saving === 'all' ? 'Saqlanmoqda...' : 'Barchasini saqlash'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
