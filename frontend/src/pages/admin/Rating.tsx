import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, Trophy, X } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

type Breakdown = {
  academic: number;
  attendance: number;
  projects: number;
  activity: number;
  tutor: number;
  discipline: number;
  base: number;
  penalty: number;
  recovery: number;
  employment: number;
  total: number;
};

type RatingRow = {
  rank: number;
  id: string;
  fullName: string;
  group: string;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
  grantReason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: Breakdown;
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
const RISK_LABEL: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori',
};
const RISK_CLS: Record<string, string> = {
  LOW:    'bg-emerald-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  HIGH:   'bg-red-500 text-white',
};

function r1(n: number) { return Math.round(n * 10) / 10; }

function exportCsv(rows: RatingRow[]) {
  const headers = [
    '#', 'Ism', 'Guruh', 'Holat', 'Risk',
    'Akademik(/40)', 'Davomat(/20)', 'Loyiha(/15)',
    'Faollik(/10)', 'Tyutor(/5)', 'Intizom(/10)',
    'Asosiy ball', 'Jarima', 'Recovery', 'Ish bonus', 'Jami ball',
  ];
  const csvRows = rows.map(r => [
    r.rank, r.fullName, r.group,
    STATUS_LABEL[r.grantStatus] ?? r.grantStatus,
    RISK_LABEL[r.riskLevel] ?? r.riskLevel,
    r1(r.breakdown.academic), r1(r.breakdown.attendance),
    r1(r.breakdown.projects), r1(r.breakdown.activity),
    r1(r.breakdown.tutor), r1(r.breakdown.discipline),
    r1(r.breakdown.base), r.breakdown.penalty,
    r.breakdown.recovery, r.breakdown.employment,
    r1(r.breakdown.total),
  ]);
  const csv = [headers, ...csvRows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `edumetric-reyting-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRating() {
  const [search,  setSearch]  = useState('');
  const [group,   setGroup]   = useState('');
  const [status,  setStatus]  = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-rating'],
    queryFn: async () => (await api.get<RatingRow[]>('/admin/rating')).data,
  });

  const groups = useMemo(() => [...new Set(rows.map(r => r.group))].sort(), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.fullName.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)
      );
    }
    if (group)  list = list.filter(r => r.group === group);
    if (status) list = list.filter(r => r.grantStatus === status);
    return list;
  }, [rows, search, group, status]);

  const hasFilter = search || group || status;
  const pag = usePagination(filtered, 25, [search, group, status]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reyting</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} / {rows.length} talaba ko'rsatilmoqda
            </p>
          </div>
          <button
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV yuklab olish
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
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
            value={group}
            onChange={e => setGroup(e.target.value)}
            className="h-9 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
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
          {hasFilter && (
            <button
              onClick={() => { setSearch(''); setGroup(''); setStatus(''); }}
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
              <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Talaba topilmadi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b text-muted-foreground text-left">
                  <tr>
                    <th className="px-3 py-3 font-medium w-10">#</th>
                    <th className="px-3 py-3 font-medium min-w-[160px]">Ism</th>
                    <th className="px-3 py-3 font-medium">Guruh</th>
                    <th className="px-3 py-3 font-medium">Holat</th>
                    <th className="px-3 py-3 font-medium">Risk</th>
                    {/* Breakdown */}
                    <th className="px-3 py-3 font-medium text-right text-xs">Akad<br/>/40</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Davom<br/>/20</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Loyiha<br/>/15</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Faol<br/>/10</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Tyutor<br/>/5</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Intizom<br/>/10</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Jarima</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Recov.</th>
                    <th className="px-3 py-3 font-medium text-right text-xs">Ish</th>
                    <th className="px-3 py-3 font-medium text-right min-w-[64px]">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {pag.pageItems.map(row => {
                    const bd = row.breakdown;
                    return (
                      <tr key={row.id} className="border-t hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 text-muted-foreground tabular-nums font-medium">
                          {row.rank <= 3 ? (
                            <span className={`font-bold ${row.rank === 1 ? 'text-amber-500' : row.rank === 2 ? 'text-slate-400' : 'text-orange-400'}`}>
                              {row.rank}
                            </span>
                          ) : row.rank}
                        </td>
                        <td className="px-3 py-2.5 font-medium">{row.fullName}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.group}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLS[row.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
                            {STATUS_LABEL[row.grantStatus] ?? row.grantStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${RISK_CLS[row.riskLevel] ?? ''}`}>
                            {RISK_LABEL[row.riskLevel] ?? row.riskLevel}
                          </span>
                        </td>
                        <Bd value={bd.academic}    max={40} />
                        <Bd value={bd.attendance}  max={20} />
                        <Bd value={bd.projects}    max={15} />
                        <Bd value={bd.activity}    max={10} />
                        <Bd value={bd.tutor}       max={5}  />
                        <Bd value={bd.discipline}  max={10} />
                        <td className="px-3 py-2.5 text-right tabular-nums text-red-600 text-xs">
                          {bd.penalty > 0 ? `−${r1(bd.penalty)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600 text-xs">
                          {bd.recovery > 0 ? `+${r1(bd.recovery)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-blue-600 text-xs">
                          {bd.employment > 0 ? `+${r1(bd.employment)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">
                          {r1(bd.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={pag.page} pageCount={pag.pageCount} onChange={pag.setPage} total={pag.total} pageSize={pag.pageSize} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* Breakdown cell — rangi max ga nisbatan */
function Bd({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const cls = pct >= 0.8 ? 'text-emerald-700' : pct >= 0.5 ? 'text-amber-700' : 'text-red-600';
  return (
    <td className={`px-3 py-2.5 text-right tabular-nums text-xs ${cls}`}>
      {r1(value)}
    </td>
  );
}
