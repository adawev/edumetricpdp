import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import {
  Key, Plus, Copy, ExternalLink, X, ShieldOff,
  CheckCircle, Clock, Code2,
} from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';

type ApiKey = {
  id: string;
  name: string;
  key: string;
  active: boolean;
  createdAt: string;
  lastUsed: string | null;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function copyText(text: string, label = 'Nusxalandi') {
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error('Nusxa olishda xatolik'),
  );
}

export default function AdminApiKeys() {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['admin-api-keys'],
    queryFn: async () => (await api.get<ApiKey[]>('/admin/api-keys')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) =>
      (await api.post<ApiKey>('/admin/api-keys', { name })).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setNewOpen(false);
      setNewName('');
      setCreatedKey(data);
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`/admin/api-keys/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
      toast.success('Kalit deaktivatsiya qilindi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  function handleCreate() {
    if (!newName.trim()) return toast.error('Kalit nomi kiriting');
    createMutation.mutate(newName.trim());
  }

  const active   = keys.filter(k => k.active);
  const inactive = keys.filter(k => !k.active);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">API Kalitlar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              LMS integratsiyasi uchun API kalitlarni boshqaring
            </p>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Yangi kalit
          </button>
        </div>

        {/* Aktiv kalitlar */}
        <Section title="Aktiv kalitlar" count={active.length}>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : active.length === 0 ? (
            <EmptyKeys text="Aktiv kalit yo'q" />
          ) : (
            <div className="space-y-3">
              {active.map(k => (
                <KeyCard
                  key={k.id}
                  apiKey={k}
                  onDeactivate={() => deactivateMutation.mutate(k.id)}
                  loading={deactivateMutation.isPending}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Nofaol kalitlar */}
        {inactive.length > 0 && (
          <Section title="Nofaol kalitlar" count={inactive.length} muted>
            <div className="space-y-3">
              {inactive.map(k => (
                <KeyCard key={k.id} apiKey={k} disabled />
              ))}
            </div>
          </Section>
        )}

        {/* Swagger va namunalar */}
        <Section title="Integratsiya ma'lumotlari">
          <div className="space-y-4">
            {/* Swagger link */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Swagger API hujjati</p>
                <p className="text-xs text-muted-foreground mt-0.5">Barcha endpointlar batafsil tavsifi</p>
              </div>
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ochish
              </a>
            </div>

            {/* Endpoint namunalar */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Endpoint namunalar
              </p>
              <EndpointExample
                method="POST"
                path="/api/integrations/attendance"
                desc="Davomat ma'lumotlarini yuklash"
                body={`{
  "records": [
    {
      "studentId": "uuid",
      "date": "2026-05-19",
      "status": "PRESENT"
    }
  ]
}`}
              />
              <EndpointExample
                method="POST"
                path="/api/integrations/grades"
                desc="Baholar va GPA yuklash"
                body={`{
  "records": [
    {
      "studentId": "uuid",
      "gpa": 92.5,
      "projectScore": 13.0
    }
  ]
}`}
              />
            </div>

            {/* Auth header namuna */}
            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-200 space-y-1">
              <p className="text-slate-400"># So'rovga qo'shish kerak bo'lgan header:</p>
              <p>
                <span className="text-amber-400">X-API-Key</span>
                <span className="text-slate-400">: </span>
                <span className="text-emerald-400">em_your_api_key_here</span>
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── New Key Dialog ── */}
      <Dialog.Root open={newOpen} onOpenChange={o => { setNewOpen(o); if (!o) setNewName(''); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 focus:outline-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="font-semibold text-slate-900">Yangi API kalit</Dialog.Title>
              <button onClick={() => setNewOpen(false)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kalit nomi</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Masalan: LMS Production"
              className="w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Kalit faqat bir marta to'liq ko'rsatiladi — nusxa olib saqlang.
            </p>
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => setNewOpen(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                Yaratish
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Created Key Dialog (show once) ── */}
      <Dialog.Root open={!!createdKey} onOpenChange={o => !o && setCreatedKey(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 focus:outline-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="font-semibold text-slate-900">Kalit yaratildi</Dialog.Title>
              <button onClick={() => setCreatedKey(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800 font-medium">
                Ushbu kalit faqat bir marta ko'rsatiladi. Hozir nusxa olib xavfsiz joyga saqlang!
              </p>
            </div>
            {createdKey && (
              <>
                <p className="text-xs text-muted-foreground mb-1">Kalit nomi: <span className="font-medium text-slate-700">{createdKey.name}</span></p>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-4 py-3">
                  <code className="flex-1 text-xs text-emerald-400 font-mono break-all">{createdKey.key}</code>
                  <button
                    onClick={() => copyText(createdKey.key, 'Kalit nusxalandi!')}
                    className="shrink-0 p-1.5 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setCreatedKey(null)}
              className="w-full mt-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Tushundim, yopish
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminLayout>
  );
}

/* ── Section wrapper ─────────────────────────────────────── */
function Section({
  title, count, muted = false, children,
}: {
  title: string;
  count?: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className={`font-semibold text-sm ${muted ? 'text-muted-foreground' : 'text-slate-900'}`}>
          {title}
        </h2>
        {count !== undefined && (
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Key card ────────────────────────────────────────────── */
function KeyCard({
  apiKey: k, onDeactivate, loading = false, disabled = false,
}: {
  apiKey: ApiKey;
  onDeactivate?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const masked = k.key.slice(0, 10) + '••••••••••••••••••••' + k.key.slice(-6);

  return (
    <div className={`bg-white rounded-xl border p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${k.active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Key className={`w-4 h-4 ${k.active ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm">{k.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {k.active ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Aktiv
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <ShieldOff className="w-3 h-3" /> Nofaol
                </span>
              )}
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Yaratildi: {fmt(k.createdAt)}</span>
              {k.lastUsed && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {fmt(k.lastUsed)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {!disabled && k.active && onDeactivate && (
          <button
            onClick={onDeactivate}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <ShieldOff className="w-3.5 h-3.5" /> O'chirish
          </button>
        )}
      </div>

      {/* Key value */}
      <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
        <code className="flex-1 text-xs text-slate-600 font-mono truncate">{masked}</code>
        {k.active && (
          <button
            onClick={() => copyText(k.key, 'API kalit nusxalandi')}
            className="shrink-0 p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
            title="Nusxa olish"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Endpoint example ────────────────────────────────────── */
function EndpointExample({
  method, path, desc, body,
}: {
  method: string;
  path: string;
  desc: string;
  body: string;
}) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
          {method}
        </span>
        <code className="text-xs font-mono text-slate-700">{path}</code>
        <span className="text-xs text-muted-foreground ml-auto">{desc}</span>
        <button
          onClick={() => copyText(`${method} ${path}`, 'Nusxalandi')}
          className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-slate-600 bg-white overflow-x-auto">{body}</pre>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyKeys({ text }: { text: string }) {
  return (
    <div className="text-center py-10 border-2 border-dashed rounded-xl">
      <Key className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
