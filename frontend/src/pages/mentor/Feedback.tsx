import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Star, Send, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/States';

type Student = { id: string; fullName: string; groupId: string; tutorScore: number };
type Group   = { id: string; name: string; course: number; students: Student[] };

type FeedbackItem = {
  id: string;
  text: string;
  score: number;
  createdAt: string;
  mentorName: string;
  isMine: boolean;
};

const MAX_LEN = 500;

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500',
];
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
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

// ── Score input/display ───────────────────────────────────────────────────────
// 1.0 – 5.0, 0.1 qadam. Yulduzcha emas — kasr qiymat (4.3 kabi) kiritish uchun.
function ScorePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={5}
          step={0.1}
          value={value || 1}
          onChange={e => onChange(clamp(Number(e.target.value)))}
          className="flex-1 accent-slate-900"
          aria-label="Baho"
        />
        <input
          type="number"
          min={1}
          max={5}
          step={0.1}
          value={value || ''}
          placeholder="0.0"
          onChange={e => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? clamp(n) : 0);
          }}
          className="w-20 h-9 px-2 rounded-md border bg-white text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="text-sm text-muted-foreground tabular-nums w-8">/ 5</span>
      </div>
      <p className="text-[11.5px] text-muted-foreground">
        Diapazon: 1.0 – 5.0 (masalan, 4.3)
      </p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium tabular-nums">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      {score.toFixed(1)} / 5
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MentorFeedback() {
  const location = useLocation();
  const preselectedId = (location.state as { studentId?: string } | null)?.studentId ?? null;
  const qc = useQueryClient();

  const [studentId, setStudentId] = useState<string>('');
  const [score, setScore]         = useState(0);
  const [text, setText]           = useState('');
  const [listSearch, setListSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  const { data: groups } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => (await api.get<Group[]>('/mentor/students')).data,
  });

  const allStudents = useMemo(() => (groups ?? []).flatMap(g => g.students), [groups]);

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    (groups ?? []).forEach(g => m.set(g.id, g.name));
    return m;
  }, [groups]);

  useEffect(() => {
    if (preselectedId && !studentId) setStudentId(preselectedId);
  }, [preselectedId]);

  const { data: history, isLoading: histLoading, isError: histError, refetch: refetchHist } = useQuery({
    queryKey: ['mentor-feedbacks', studentId],
    queryFn: async () =>
      (await api.get<FeedbackItem[]>('/mentor/feedbacks', { params: { studentId } })).data,
    enabled: !!studentId,
  });

  // Bitta mentor → bitta talaba uchun bitta feedback. Avval yozilgan bo'lsa — tahrirlanadi.
  const myFeedback = useMemo(() => history?.find(f => f.isMine) ?? null, [history]);
  const isEditing = !!myFeedback;

  // Talaba almashganda yoki feedback ID o'zgarganda formani to'ldiradi.
  // Deps'da `myFeedback` obyekti emas, faqat `id` — refetch'da forma reset bo'lmasin.
  useEffect(() => {
    if (myFeedback) {
      setText(myFeedback.text);
      setScore(myFeedback.score);
    } else {
      setText('');
      setScore(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myFeedback?.id, studentId]);

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/mentor/feedback', { studentId, text: text.trim(), score });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Feedback yangilandi' : 'Feedback yuborildi');
      qc.invalidateQueries({ queryKey: ['mentor-feedbacks', studentId] });
      qc.invalidateQueries({ queryKey: ['mentor-students'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Yuborishda xato');
    },
  });

  const canSubmit = studentId && score >= 1 && score <= 5
    && text.trim().length >= 3 && text.length <= MAX_LEN && !submit.isPending;

  const selectedStudent = allStudents.find(s => s.id === studentId) ?? null;

  const filteredList = useMemo(() =>
    allStudents.filter(s =>
      (groupFilter === 'ALL' || s.groupId === groupFilter) &&
      s.fullName.toLowerCase().includes(listSearch.toLowerCase())
    ),
    [allStudents, listSearch, groupFilter],
  );

  return (
    <div className="p-4 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feedback yozish</h1>
        <p className="text-sm text-muted-foreground mt-1">Talaba bo'yicha qisqacha baho — admin va talabaning o'zi ko'radi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

        {/* ─── Left: student list ─── */}
        <div className="bg-white rounded-xl border overflow-hidden self-start">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Talaba qidirish..."
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            {groups && groups.length > 1 && (
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Barcha guruhlar</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} · {g.course}-kurs</option>
                ))}
              </select>
            )}
          </div>
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)', minHeight: 520 }}>
            {filteredList.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Talaba topilmadi</div>
            ) : filteredList.map(stu => {
              const isActive = stu.id === studentId;
              return (
                <div
                  key={stu.id}
                  onClick={() => setStudentId(stu.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b cursor-pointer transition-colors ${
                    isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                  style={{
                    borderLeft: isActive ? '3px solid #0f172a' : '3px solid transparent',
                    paddingLeft: isActive ? 11 : 14,
                  }}
                >
                  <Avatar name={stu.fullName} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[13px] font-medium truncate">{stu.fullName}</div>
                      {stu.tutorScore > 0 && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-px rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{groupNameById.get(stu.groupId)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right: composer + history ─── */}
        <div className="space-y-4">

          {/* Composer */}
          <div className="bg-white rounded-xl border p-6 space-y-5">
            {selectedStudent ? (
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar name={selectedStudent.fullName} size={42} />
                <div>
                  <div className="text-[15px] font-semibold">{selectedStudent.fullName}</div>
                  <div className="text-[12px] text-muted-foreground">
                    {groupNameById.get(selectedStudent.groupId)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-4 border-b text-sm text-muted-foreground">
                Chap ro'yxatdan talabani tanlang
              </div>
            )}

            {isEditing && (
              <div className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Siz bu talabaga avval feedback yozgansiz — har talabaga bittadan feedback.
                Saqlasangiz eski yozuv yangilanadi.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mentor bahosi (1.0–5.0)</label>
              <ScorePicker value={score} onChange={setScore} />
              <p className="text-[11.5px] text-muted-foreground">
                Bu baho grant ballidagi "Mentor bahosi" mezoni — max 5 ball
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-baseline gap-2">
                Matn
                <span className="text-muted-foreground font-normal text-xs tabular-nums">
                  {text.length} / {MAX_LEN}
                </span>
              </label>
              <textarea
                rows={5}
                maxLength={MAX_LEN}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Talabaning bu davrdagi faolligi, kuchli va zaif tomonlari, tavsiyalar..."
                className="w-full px-3 py-2 rounded-md border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {text.length > 0 && text.trim().length < 3 && (
                <p className="text-xs text-red-600">Kamida 3 belgi kiriting</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setScore(0); setText(''); }}
                className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Tozalash
              </button>
              <button
                disabled={!canSubmit}
                onClick={() => submit.mutate()}
                className="inline-flex items-center gap-2 h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {submit.isPending
                  ? 'Saqlanmoqda...'
                  : isEditing ? 'Yangilash' : 'Yuborish'}
              </button>
            </div>
          </div>

          {/* History */}
          {studentId && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  {selectedStudent?.fullName ?? 'Talaba'} uchun feedback tarixi
                </h3>
                {history && (
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {history.length} ta yozuv
                  </span>
                )}
              </div>

              {histLoading && (
                <div className="p-5 space-y-3">
                  {[0, 1].map(i => <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />)}
                </div>
              )}

              {histError && (
                <div className="p-4"><ErrorState onRetry={() => refetchHist()} /></div>
              )}

              {!histLoading && !histError && history?.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Hali feedback yozilmagan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Yuqoridagi forma orqali birinchisini yozing</p>
                </div>
              )}

              {!histLoading && !histError && history && history.length > 0 && (
                <div className="divide-y">
                  {history.map(item => (
                    <div key={item.id} className="p-5 flex gap-4">
                      <Avatar name={item.mentorName} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[13px]">{item.mentorName}</span>
                          {item.isMine && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              siz
                            </span>
                          )}
                          <ScoreBadge score={item.score} />
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
