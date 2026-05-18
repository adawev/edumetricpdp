import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award, Search, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';

type RatingRow = {
  rank: number;
  id: string;
  fullName: string;
  group: string;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  grantReason: 'OK' | 'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE' | 'GRANTED_OK';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};

type Group = { id: string; name: string; course: number };

const statusInfo: Record<string, { text: string; cls: string }> = {
  GRANTED_OK: { text: 'Grant berildi', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  OK: { text: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACADEMIC_FAIL: { text: 'Akademik past', cls: 'bg-red-100 text-red-700 border-red-200' },
  LOW_SCORE: { text: 'Ball past', cls: 'bg-red-100 text-red-700 border-red-200' },
  PAYMENT_OVERDUE: { text: 'To\'lov muddati', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const riskInfo: Record<string, { text: string; cls: string }> = {
  LOW: { text: 'Past', cls: 'bg-emerald-500 text-white' },
  MEDIUM: { text: 'O\'rta', cls: 'bg-amber-500 text-white' },
  HIGH: { text: 'Yuqori', cls: 'bg-red-500 text-white' },
};

const podiumStyles = [
  { border: 'border-amber-400', bg: 'bg-gradient-to-br from-amber-50 to-amber-100', icon: Trophy, iconCls: 'text-amber-500' },
  { border: 'border-slate-300', bg: 'bg-gradient-to-br from-slate-50 to-slate-100', icon: Medal, iconCls: 'text-slate-400' },
  { border: 'border-orange-300', bg: 'bg-gradient-to-br from-orange-50 to-orange-100', icon: Award, iconCls: 'text-orange-500' },
];

export default function PublicRatingPage() {
  const [groupId, setGroupId] = useState('');
  const [query, setQuery] = useState('');

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => (await api.get<Group[]>('/public/groups')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-rating', groupId],
    queryFn: async () => {
      const params = groupId ? { groupId } : {};
      return (await api.get<RatingRow[]>('/public/rating', { params })).data;
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(s => s.fullName.toLowerCase().includes(q) || s.group.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <h1 className="text-lg font-semibold">EduMetric</h1>
          </div>
          <a href="/login" className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-slate-100">
            Kirish →
          </a>
        </div>
      </header>

      <main className="container py-10 space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Talabalar reytingi</h2>
          <p className="text-muted-foreground mt-2 text-base">
            PDP University grant nizomi asosida shaffof ball tizimi
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Talaba yoki guruh nomi..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Barcha guruhlar</option>
            {groups?.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.course}-kurs)</option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        )}

        {filtered.length > 0 && !groupId && !query && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.slice(0, 3).map((s, i) => {
              const p = podiumStyles[i];
              const Icon = p.icon;
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl p-6 border-2 ${p.border} ${p.bg} transition-all hover:shadow-md`}
                  style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-4xl font-bold tracking-tight">#{s.rank}</div>
                    <Icon className={`w-8 h-8 ${p.iconCls}`} />
                  </div>
                  <div className="mt-3 font-semibold text-lg">{s.fullName}</div>
                  <div className="text-sm text-muted-foreground">{s.group}</div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{s.grantScore}</span>
                    <span className="text-sm text-muted-foreground">ball</span>
                  </div>
                </div>
              );
            })}
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
                    <th className="px-4 py-3 font-medium text-right">Ball</th>
                    <th className="px-4 py-3 font-medium">Holat</th>
                    <th className="px-4 py-3 font-medium w-24">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const status = statusInfo[s.grantReason] ?? statusInfo.OK;
                    const risk = riskInfo[s.riskLevel];
                    return (
                      <tr key={s.id} className="border-t hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium tabular-nums">{s.rank}</td>
                        <td className="px-4 py-3 font-medium">{s.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.group}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{s.grantScore}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${status.cls}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${risk.cls}`}>
                            {risk.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Search className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Talaba topilmadi</p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
