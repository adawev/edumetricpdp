import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { AlertTriangle, Plus, X, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

type Group = { id: string; name: string; course: number };
type StudentBasic = { id: string; fullName: string; group: Group };

type Penalty = {
  id: string;
  studentId: string;
  type: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  ball: number;
  reason: string;
  recovered: number;
  recoveryTask: string | null;
  recoveryDone: boolean;
  createdAt: string;
  student: StudentBasic;
};

type StudentFull = StudentBasic & { grantScore: number; grantStatus: string };

const TYPE_LABEL: Record<string, string> = {
  LIGHT:  'Yengil',
  MEDIUM: "O'rtacha",
  HEAVY:  'Og\'ir',
};
const TYPE_CLS: Record<string, string> = {
  LIGHT:  'bg-amber-100 text-amber-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HEAVY:  'bg-red-100 text-red-700',
};
const TYPE_DEFAULT_BALL: Record<string, number> = {
  LIGHT: 1, MEDIUM: 3, HEAVY: 5,
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPenalties() {
  const qc = useQueryClient();

  /* ── New penalty dialog state ── */
  const [newOpen, setNewOpen]         = useState(false);
  const [nStudentId, setNStudentId]   = useState('');
  const [nType, setNType]             = useState<'LIGHT' | 'MEDIUM' | 'HEAVY'>('LIGHT');
  const [nBall, setNBall]             = useState(1);
  const [nReason, setNReason]         = useState('');

  /* ── Recovery dialog state ── */
  const [recTarget, setRecTarget]     = useState<Penalty | null>(null);
  const [recAmount, setRecAmount]     = useState(0);

  /* ── Queries ── */
  const { data: penalties = [], isLoading } = useQuery({
    queryKey: ['admin-penalties'],
    queryFn: async () => (await api.get<Penalty[]>('/admin/penalties')).data,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => (await api.get<StudentFull[]>('/admin/students')).data,
  });

  const studentMap = useMemo(() => {
    const m: Record<string, StudentFull> = {};
    for (const s of students) m[s.id] = s;
    return m;
  }, [students]);

  /* ── Create penalty ── */
  const createMutation = useMutation({
    mutationFn: async (body: object) => (await api.post('/admin/penalties', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-penalties'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Jarima qo\'shildi');
      setNewOpen(false);
      setNStudentId(''); setNType('LIGHT'); setNBall(1); setNReason('');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  /* ── Recovery ── */
  const recoverMutation = useMutation({
    mutationFn: async ({ id, recovered }: { id: string; recovered: number }) =>
      (await api.post(`/admin/penalties/${id}/recover`, { recovered })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-penalties'] });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Reabilitatsiya tasdiqlandi');
      setRecTarget(null); setRecAmount(0);
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  function handleTypeChange(t: 'LIGHT' | 'MEDIUM' | 'HEAVY') {
    setNType(t);
    setNBall(TYPE_DEFAULT_BALL[t]);
  }

  function handleCreate() {
    if (!nStudentId) return toast.error('Talabani tanlang');
    if (!nReason.trim()) return toast.error('Sabab kiriting');
    createMutation.mutate({ studentId: nStudentId, type: nType, ball: nBall, reason: nReason.trim() });
  }

  function openRecovery(p: Penalty) {
    setRecTarget(p);
    setRecAmount(Math.floor(p.ball * 0.5));
  }

  const maxRecovery = recTarget ? Math.min(Math.floor(recTarget.ball * 0.5), 10) : 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Jarimalar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Jami {penalties.length} ta jarima
            </p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Yangi jarima
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : penalties.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <AlertTriangle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Hozircha jarima yo'q</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b text-muted-foreground text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Talaba</th>
                    <th className="px-4 py-3 font-medium">Guruh</th>
                    <th className="px-4 py-3 font-medium">Tur</th>
                    <th className="px-4 py-3 font-medium text-right">Ball</th>
                    <th className="px-4 py-3 font-medium">Sabab</th>
                    <th className="px-4 py-3 font-medium">Holat</th>
                    <th className="px-4 py-3 font-medium">Sana</th>
                    <th className="px-4 py-3 font-medium w-36" />
                  </tr>
                </thead>
                <tbody>
                  {penalties.map(p => (
                    <tr key={p.id} className="border-t hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.student.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.student.group?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TYPE_CLS[p.type]}`}>
                          {TYPE_LABEL[p.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 tabular-nums">
                        −{p.ball}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={p.reason}>
                        {p.reason}
                      </td>
                      <td className="px-4 py-3">
                        {p.recoveryDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            <ShieldCheck className="w-3 h-3" />
                            +{p.recovered} ball
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                            Reabilitatsiya yo'q
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        {!p.recoveryDone && (
                          <button
                            onClick={() => openRecovery(p)}
                            className="text-xs px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
                          >
                            Reabilitatsiya
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── New Penalty Dialog ── */}
      <Dialog.Root open={newOpen} onOpenChange={open => { setNewOpen(open); if (!open) { setNStudentId(''); setNType('LIGHT'); setNBall(1); setNReason(''); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 focus:outline-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="font-semibold text-slate-900">Yangi jarima</Dialog.Title>
              <button onClick={() => setNewOpen(false)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Student */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Talaba</label>
                <select
                  value={nStudentId}
                  onChange={e => setNStudentId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">— Tanlang —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.group?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jarima turi</label>
                <div className="flex gap-2">
                  {(['LIGHT', 'MEDIUM', 'HEAVY'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => handleTypeChange(t)}
                      className={`flex-1 py-2 rounded-md border text-xs font-semibold transition-colors ${
                        nType === t
                          ? TYPE_CLS[t] + ' border-transparent'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ball */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ball miqdori
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (Yengil: 1, O'rtacha: 3, Og'ir: 5/10/15)
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={nBall}
                  onChange={e => setNBall(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sabab</label>
                <textarea
                  value={nReason}
                  onChange={e => setNReason(e.target.value)}
                  placeholder="Jarima sababi..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setNewOpen(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Jarima qo'shish
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Recovery Dialog ── */}
      <Dialog.Root open={!!recTarget} onOpenChange={open => { if (!open) { setRecTarget(null); setRecAmount(0); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 focus:outline-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="font-semibold text-slate-900">Reabilitatsiya</Dialog.Title>
              <button onClick={() => setRecTarget(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {recTarget && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Talaba:</span> <span className="font-medium">{recTarget.student.fullName}</span></p>
                  <p><span className="text-muted-foreground">Jarima:</span> <span className="font-medium text-red-600">−{recTarget.ball} ball</span></p>
                  <p><span className="text-muted-foreground">Sabab:</span> {recTarget.reason}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Qaytariladigan ball
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      (max {maxRecovery} ball — jarima ning 50%)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxRecovery}
                    value={recAmount}
                    onChange={e => setRecAmount(Math.min(maxRecovery, Math.max(0, Number(e.target.value))))}
                    className="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nizom bo'yicha jarima ballining 50% gacha, maksimal 10 ball qaytariladi
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setRecTarget(null)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => recTarget && recoverMutation.mutate({ id: recTarget.id, recovered: recAmount })}
                disabled={recoverMutation.isPending}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Tasdiqlash
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
}
