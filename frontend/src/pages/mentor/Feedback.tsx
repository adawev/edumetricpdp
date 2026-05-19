import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Star, Send, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/States';

type Student = { id: string; fullName: string; groupId: string };
type Group = { id: string; name: string; course: number; students: Student[] };

type FeedbackItem = {
  id: string;
  text: string;
  score: number;
  createdAt: string;
  mentorName: string;
  isMine: boolean;
};

const MAX_LEN = 500;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors"
          aria-label={`${n} yulduz`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-3 text-sm text-muted-foreground tabular-nums">
        {value > 0 ? `${value} / 5` : 'Baho tanlang'}
      </span>
    </div>
  );
}

function StarsDisplay({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MentorFeedback() {
  const location = useLocation();
  const preselectedId = (location.state as { studentId?: string } | null)?.studentId ?? null;
  const qc = useQueryClient();

  const [studentId, setStudentId] = useState<string>('');
  const [score, setScore] = useState(0);
  const [text, setText] = useState('');

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

  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['mentor-feedbacks', studentId],
    queryFn: async () =>
      (await api.get<FeedbackItem[]>('/mentor/feedbacks', { params: { studentId } })).data,
    enabled: !!studentId,
  });

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/mentor/feedback', { studentId, text: text.trim(), score });
    },
    onSuccess: () => {
      toast.success('Feedback yuborildi');
      setText('');
      setScore(0);
      qc.invalidateQueries({ queryKey: ['mentor-feedbacks', studentId] });
      qc.invalidateQueries({ queryKey: ['mentor-students'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Yuborishda xato');
    },
  });

  const canSubmit = studentId && score >= 1 && score <= 5 && text.trim().length >= 3 && text.length <= MAX_LEN && !submit.isPending;
  const selectedStudent = allStudents.find(s => s.id === studentId) ?? null;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">Talabaga yozma fikr va 1-5 ball</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Talaba</label>
          <select
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Talabani tanlang...</option>
            {(groups ?? []).map(g => (
              <optgroup key={g.id} label={`${g.name} (${g.course}-kurs)`}>
                {g.students.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedStudent && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <User className="w-3 h-3" />
              <span>{selectedStudent.fullName} · {groupNameById.get(selectedStudent.groupId)}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Baho (1-5)</label>
          <StarPicker value={score} onChange={setScore} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Matn
            <span className="text-muted-foreground font-normal ml-2 tabular-nums">
              {text.length} / {MAX_LEN}
            </span>
          </label>
          <textarea
            rows={5}
            maxLength={MAX_LEN}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Talabaning kuchli va kuchsiz tomonlari, e'tibor talab qiladigan jihatlar..."
            className="w-full px-3 py-2 rounded-md border bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {text.length > 0 && text.trim().length < 3 && (
            <p className="text-xs text-red-600">Matn kamida 3 belgi bo'lishi kerak</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            disabled={!canSubmit}
            onClick={() => submit.mutate()}
            className="inline-flex items-center gap-2 h-10 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submit.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </div>
      </div>

      {studentId && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Feedback tarixi</h3>
            {history && (
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                {history.length} ta
              </span>
            )}
          </div>

          {historyLoading && (
            <div className="p-6 space-y-3">
              {[0, 1].map(i => <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          )}

          {historyError && (
            <div className="p-4">
              <ErrorState onRetry={() => refetchHistory()} />
            </div>
          )}

          {!historyLoading && !historyError && history && history.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Hozircha feedback yo'q</p>
            </div>
          )}

          {!historyLoading && !historyError && history && history.length > 0 && (
            <div className="divide-y">
              {history.map(item => (
                <div key={item.id} className="p-5 flex gap-4">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                    {item.mentorName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.mentorName}</span>
                      {item.isMine && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          siz
                        </span>
                      )}
                      <StarsDisplay score={item.score} />
                      <span className="text-xs text-muted-foreground ml-auto">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-wrap">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
