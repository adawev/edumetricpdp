import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Download, Zap, ArrowRight, Check, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { api } from '@/lib/api';
import AdminLayout from './AdminLayout';
import { Pagination, usePagination } from '@/components/em/Primitives';

type Breakdown = {
  academicPct: number; academic: number;
  attendancePct: number; attendance: number;
  projectPct: number; projects: number;
  activityPct: number; activity: number;
  tutorPct: number; tutor: number;
  disciplinePct: number; discipline: number;
  base: number; penalty: number; recovery: number; employment: number; total: number;
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
  GRANTED: 'Grant berildi', PENDING: 'Kutilmoqda',
  NOT_GRANTED: "Grant yo'q", UNKNOWN: 'Aniqlanmagan',
};
const STATUS_CLS: Record<string, string> = {
  GRANTED:     'bg-emerald-100 text-emerald-700',
  PENDING:     'bg-amber-100 text-amber-700',
  NOT_GRANTED: 'bg-red-100 text-red-700',
  UNKNOWN:     'bg-slate-100 text-slate-600',
};
const RISK_LABEL: Record<string, string> = { LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori' };
const RISK_SOLID: Record<string, string> = {
  LOW:    '#10b981',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
};

// Section tone colors
const TONE_AC = '#f5f3ff';
const TONE_AT = '#ecfeff';
const TONE_AS = '#f0fdf4';
const TONE_AV = '#fff7ed';
const TONE_TU = '#fef3c7';
const TONE_DI = '#fdf2f8';
const TONE_TT = '#f1f5f9';
const TONE_BN = '#fefce8';

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899'];

function r1(n: number) { return Math.round(n * 10) / 10; }

function pctColor(pct: number): string {
  return pct >= 85 ? '#059669' : pct >= 70 ? '#0f172a' : pct >= 55 ? '#d97706' : '#dc2626';
}

function nameToColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 999,
        background: nameToColor(name), color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
        letterSpacing: '-0.01em',
      }}
    >
      {initials}
    </div>
  );
}

const thBase: React.CSSProperties = {
  padding: '6px 8px', fontSize: 11, fontWeight: 600,
  color: '#94a3b8', background: '#f8fafc',
  borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap', textAlign: 'center',
};

function thGroup(tone: string): React.CSSProperties {
  return {
    ...thBase,
    background: tone,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    position: 'sticky',
    top: 0,
    zIndex: 3,
  };
}

function thSticky(extra: React.CSSProperties = {}): React.CSSProperties {
  return { ...thBase, position: 'sticky', top: 0, zIndex: 5, ...extra };
}

function exportCsv(rows: RatingRow[]) {
  const headers = ['#','Ism','Guruh','Holat','Risk',
    'Akad%','Akad','Davom%','Davom','Loyiha%','Loyiha',
    'Faol%','Faol','Tyutor%','Tyutor','Intizom%','Intizom',
    'Asosiy','Jarima','Recovery','Ish','Final'];
  const csvRows = rows.map(r => {
    const b = r.breakdown;
    return [r.rank, r.fullName, r.group,
      STATUS_LABEL[r.grantStatus] ?? r.grantStatus, RISK_LABEL[r.riskLevel] ?? r.riskLevel,
      b.academicPct, r1(b.academic), b.attendancePct, r1(b.attendance),
      b.projectPct, r1(b.projects), b.activityPct, r1(b.activity),
      b.tutorPct, r1(b.tutor), b.disciplinePct, r1(b.discipline),
      r1(b.base), r1(b.penalty), r1(b.recovery), r1(b.employment), r1(b.total)];
  });
  const csv = [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `edumetric-reyting-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminRating() {
  const navigate = useNavigate();
  const [q,       setQ]       = useState('');
  const [group,   setGroup]   = useState('all');
  const [course,  setCourse]  = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [riskF,   setRiskF]   = useState('all');
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-rating'],
    queryFn: async () => (await api.get<RatingRow[]>('/admin/rating')).data,
  });

  const groups  = useMemo(() => [...new Set(rows.map(r => r.group))].sort(), [rows]);
  const courses = useMemo(() =>
    [...new Set(rows.map(r => r.group.split('-')[1]).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (q.trim()) list = list.filter(r => r.fullName.toLowerCase().includes(q.toLowerCase()));
    if (group   !== 'all') list = list.filter(r => r.group === group);
    if (course  !== 'all') list = list.filter(r => r.group.split('-')[1] === course);
    if (statusF !== 'all') list = list.filter(r => r.grantStatus === statusF || r.grantReason === statusF);
    if (riskF   !== 'all') list = list.filter(r => r.riskLevel === riskF);
    return list;
  }, [rows, q, group, course, statusF, riskF]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const get = (x: RatingRow): number | string => {
        if (sortKey === 'name')  return x.fullName;
        if (sortKey === 'group') return x.group;
        const bd = x.breakdown as unknown as Record<string, number>;
        if (sortKey in bd) return bd[sortKey];
        return (x as unknown as Record<string, number>)[sortKey] ?? 0;
      };
      const va = get(a), vb = get(b);
      const cmp = typeof va === 'string'
        ? (va as string).localeCompare(vb as string)
        : (va as number) - (vb as number);
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const setSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const selectCandidates = () => {
    const next: Record<string, boolean> = {};
    sorted.forEach(x => {
      if (x.grantStatus === 'PENDING' && x.breakdown.total >= 80) next[x.id] = true;
    });
    setSelected(next);
  };

  const allSelected   = sorted.length > 0 && sorted.every(x => selected[x.id]);
  const someSelected  = sorted.some(x => selected[x.id]) && !allSelected;
  const selectedCount = sorted.filter(x => selected[x.id]).length;

  const toggleOne = (id: string) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => {
    if (allSelected) { setSelected({}); return; }
    const next: Record<string, boolean> = {};
    sorted.forEach(x => { next[x.id] = true; });
    setSelected(next);
  };

  const masterRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someSelected;
  }, [someSelected]);

  // Clear selection when page is restored from bfcache (browser back button)
  useEffect(() => {
    const fn = (e: PageTransitionEvent) => { if (e.persisted) setSelected({}); };
    window.addEventListener('pageshow', fn);
    return () => window.removeEventListener('pageshow', fn);
  }, []);

  const lowCount  = sorted.filter(x => x.riskLevel === 'LOW').length;
  const midCount  = sorted.filter(x => x.riskLevel === 'MEDIUM').length;
  const highCount = sorted.filter(x => x.riskLevel === 'HIGH').length;

  const pag = usePagination(sorted, 25, [q, group, course, statusF, riskF, sortKey, sortDir]);

  const SH = ({ k, children, align = 'right', tone, width }: {
    k: string; children: React.ReactNode; align?: string; tone?: string; width?: number;
  }) => {
    const active = sortKey === k;
    return (
      <th
        onClick={() => setSort(k)}
        style={{
          textAlign: align as 'left' | 'right' | 'center',
          padding: '4px 8px', fontSize: 10.5, fontWeight: 600,
          color: active ? '#0f172a' : '#94a3b8',
          cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
          background: tone ?? '#f8fafc',
          borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
          width, position: 'sticky', top: 32, zIndex: 2,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {children}
          {active && (sortDir === 'desc'
            ? <ChevronDown className="w-2.5 h-2.5" />
            : <ChevronUp className="w-2.5 h-2.5" />)}
        </span>
      </th>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">

        {/* Page header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Talabalar reytingi</h1>
            <p className="text-[13.5px] text-slate-500 mt-1">
              Grant nizomi 2026.1 asosida hisoblangan barcha mezonlar · {sorted.length} ta talaba · checkbox bilan kandidatlarni tanlang
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectCandidates}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Kandidatlarni tanlash
            </button>
            <button
              onClick={() => exportCsv(sorted)}
              disabled={sorted.length === 0}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV eksport
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="grid gap-2.5" style={{ gridTemplateColumns: '1.5fr 0.9fr 0.9fr 1fr 1fr' }}>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Ism..."
              className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
            <select
              value={group}
              onChange={e => setGroup(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha guruhlar</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={course}
              onChange={e => setCourse(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha kurslar</option>
              {courses.map(c => <option key={c} value={c}>Kurs {c}</option>)}
            </select>
            <select
              value={statusF}
              onChange={e => setStatusF(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha holat</option>
              <option value="GRANTED">Grant berildi</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="NOT_GRANTED">Grant yo'q</option>
              <option value="ACADEMIC_FAIL">Akademik fail</option>
              <option value="LOW_SCORE">Ball past</option>
            </select>
            <select
              value={riskF}
              onChange={e => setRiskF(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="all">Barcha risk</option>
              <option value="LOW">Past (Low)</option>
              <option value="MEDIUM">O'rta (Medium)</option>
              <option value="HIGH">Yuqori (High)</option>
            </select>
          </div>
        </div>

        {/* Color summary strip */}
        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap text-[11.5px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 inline-block" />
              {lowCount} ta past xavf
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 inline-block" />
              {midCount} ta o'rta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-red-500 inline-block" />
              {highCount} ta yuqori xavf
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Ustun nomiga bosib tartiblang · gorizontal scroll faollashgan
            </span>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">Talaba topilmadi</p>
          </div>
        ) : (
          <div
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            style={{ paddingBottom: selectedCount > 0 ? 72 : 0 }}
          >
            <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              <table style={{
                borderCollapse: 'separate', borderSpacing: 0,
                fontSize: 12, width: '100%', fontVariantNumeric: 'tabular-nums',
              }}>
                <thead>
                  {/* Group header row */}
                  <tr style={{ position: 'sticky', top: 0, zIndex: 4 }}>
                    <th rowSpan={2} style={{ ...thSticky({ width: 38, zIndex: 7, left: 0, textAlign: 'center', padding: '6px' }) }}>
                      <input
                        ref={masterRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f172a', verticalAlign: 'middle' }}
                      />
                    </th>
                    <th rowSpan={2} style={thSticky({ width: 44, left: 38, zIndex: 6, textAlign: 'center' })}>#</th>
                    <th rowSpan={2} style={thSticky({ minWidth: 200, left: 82, zIndex: 6, textAlign: 'left', cursor: 'pointer' })}
                      onClick={() => setSort('name')}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        Talaba
                        {sortKey === 'name' && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                      </span>
                    </th>
                    <th rowSpan={2} style={thSticky({ width: 100, textAlign: 'left', cursor: 'pointer' })}
                      onClick={() => setSort('group')}
                    >Guruh</th>
                    <th rowSpan={2} style={thSticky({ width: 110, textAlign: 'left' })}>Status</th>
                    <th colSpan={2} style={thGroup(TONE_AC)}>Academic <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 40</span></th>
                    <th colSpan={2} style={thGroup(TONE_AT)}>Attendance <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 20</span></th>
                    <th colSpan={2} style={thGroup(TONE_AS)}>Assignment <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 15</span></th>
                    <th colSpan={2} style={thGroup(TONE_AV)}>Activity <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 10</span></th>
                    <th colSpan={2} style={thGroup(TONE_TU)}>Tyutor <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 5</span></th>
                    <th colSpan={2} style={thGroup(TONE_DI)}>Discipline <span style={{ color: '#94a3b8', fontWeight: 500 }}>· max 10</span></th>
                    <th rowSpan={2} style={thSticky({ width: 70, background: TONE_TT, top: 0 })}>Total</th>
                    <th rowSpan={2} style={thSticky({ width: 76, background: TONE_BN, top: 0, color: '#dc2626' })}>Penalty<br /><span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>min −20</span></th>
                    <th rowSpan={2} style={thSticky({ width: 80, background: TONE_BN, top: 0 })}>Recovery<br /><span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>max +10</span></th>
                    <th rowSpan={2} style={thSticky({ width: 86, background: TONE_BN, top: 0 })}>Employment<br /><span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>max +10</span></th>
                    <th rowSpan={2} style={thSticky({ width: 80, background: '#0f172a', color: '#fff', top: 0, cursor: 'pointer' })}
                      onClick={() => setSort('total')}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        Final
                        {sortKey === 'total' && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                      </span>
                      <br /><span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>score</span>
                    </th>
                    <th rowSpan={2} style={thSticky({ width: 100, textAlign: 'left' })}>Risk</th>
                  </tr>
                  {/* Sub-header row */}
                  <tr>
                    <SH k="academicPct"   tone={TONE_AC} width={48}>%</SH>
                    <SH k="academic"      tone={TONE_AC} width={54}>Ball</SH>
                    <SH k="attendancePct" tone={TONE_AT} width={48}>%</SH>
                    <SH k="attendance"    tone={TONE_AT} width={54}>Ball</SH>
                    <SH k="projectPct"    tone={TONE_AS} width={48}>%</SH>
                    <SH k="projects"      tone={TONE_AS} width={54}>Ball</SH>
                    <SH k="activityPct"   tone={TONE_AV} width={48}>%</SH>
                    <SH k="activity"      tone={TONE_AV} width={54}>Ball</SH>
                    <SH k="tutorPct"      tone={TONE_TU} width={48}>%</SH>
                    <SH k="tutor"         tone={TONE_TU} width={54}>Ball</SH>
                    <SH k="disciplinePct" tone={TONE_DI} width={48}>%</SH>
                    <SH k="discipline"    tone={TONE_DI} width={54}>Ball</SH>
                  </tr>
                </thead>
                <tbody>
                  {pag.pageItems.map((x, i) => {
                    const b = x.breakdown;
                    const isSelected = !!selected[x.id];
                    const rowBg = isSelected ? '#fffbe6' : i % 2 === 0 ? '#fff' : '#fbfcfd';
                    const td: React.CSSProperties = {
                      padding: '7px 8px', borderBottom: '1px solid #f1f5f9',
                      borderRight: '1px solid #f1f5f9', background: rowBg,
                    };
                    const tdSticky = (left: number): React.CSSProperties => ({
                      ...td, position: 'sticky', left, zIndex: 1,
                      borderRight: '1px solid #e2e8f0',
                    });
                    return (
                      <tr key={x.id} style={{ transition: 'background .1s' }}>
                        {/* Checkbox */}
                        <td style={{ ...tdSticky(0), textAlign: 'center', width: 38 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(x.id)}
                            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f172a', verticalAlign: 'middle' }}
                          />
                        </td>
                        {/* Rank */}
                        <td style={{ ...tdSticky(38), width: 44, textAlign: 'center', fontWeight: 600,
                          color: x.rank === 1 ? '#f59e0b' : x.rank === 2 ? '#94a3b8' : x.rank === 3 ? '#f97316' : '#64748b' }}>
                          {x.rank}
                        </td>
                        {/* Name with avatar */}
                        <td style={{ ...tdSticky(82), minWidth: 200, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={x.fullName} size={24} />
                            <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 12.5 }}>{x.fullName}</span>
                          </div>
                        </td>
                        {/* Group */}
                        <td style={{ ...td, width: 100, textAlign: 'left', color: '#64748b' }}>{x.group}</td>
                        {/* Status */}
                        <td style={{ ...td, width: 110, textAlign: 'left' }}>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_CLS[x.grantStatus] ?? STATUS_CLS.UNKNOWN}`}>
                            {STATUS_LABEL[x.grantStatus] ?? x.grantStatus}
                          </span>
                        </td>
                        {/* Academic */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_AC, textAlign: 'right', color: pctColor(b.academicPct) }}>{b.academicPct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_AC, textAlign: 'right', fontWeight: 600, color: pctColor(b.academicPct) }}>{r1(b.academic)}</td>
                        {/* Attendance */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_AT, textAlign: 'right', color: pctColor(b.attendancePct) }}>{b.attendancePct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_AT, textAlign: 'right', fontWeight: 600, color: pctColor(b.attendancePct) }}>{r1(b.attendance)}</td>
                        {/* Projects */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_AS, textAlign: 'right', color: pctColor(b.projectPct) }}>{b.projectPct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_AS, textAlign: 'right', fontWeight: 600, color: pctColor(b.projectPct) }}>{r1(b.projects)}</td>
                        {/* Activity */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_AV, textAlign: 'right', color: pctColor(b.activityPct) }}>{b.activityPct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_AV, textAlign: 'right', fontWeight: 600, color: pctColor(b.activityPct) }}>{r1(b.activity)}</td>
                        {/* Tutor */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_TU, textAlign: 'right', color: pctColor(b.tutorPct) }}>{b.tutorPct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_TU, textAlign: 'right', fontWeight: 600, color: pctColor(b.tutorPct) }}>{r1(b.tutor)}</td>
                        {/* Discipline */}
                        <td style={{ ...td, width: 48, background: isSelected ? '#fffbe6' : TONE_DI, textAlign: 'right', color: pctColor(b.disciplinePct) }}>{b.disciplinePct}%</td>
                        <td style={{ ...td, width: 54, background: isSelected ? '#fffbe6' : TONE_DI, textAlign: 'right', fontWeight: 600, color: pctColor(b.disciplinePct) }}>{r1(b.discipline)}</td>
                        {/* Total base */}
                        <td style={{ ...td, width: 70, background: isSelected ? '#fffbe6' : TONE_TT, textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{r1(b.base)}</td>
                        {/* Penalty */}
                        <td style={{ ...td, width: 76, background: isSelected ? '#fffbe6' : TONE_BN, textAlign: 'right', color: b.penalty > 0 ? '#dc2626' : '#94a3b8' }}>
                          {b.penalty > 0 ? `−${r1(b.penalty)}` : '—'}
                        </td>
                        {/* Recovery */}
                        <td style={{ ...td, width: 80, background: isSelected ? '#fffbe6' : TONE_BN, textAlign: 'right', color: b.recovery > 0 ? '#059669' : '#94a3b8' }}>
                          {b.recovery > 0 ? `+${r1(b.recovery)}` : '—'}
                        </td>
                        {/* Employment */}
                        <td style={{ ...td, width: 86, background: isSelected ? '#fffbe6' : TONE_BN, textAlign: 'right', color: b.employment > 0 ? '#2563eb' : '#94a3b8' }}>
                          {b.employment > 0 ? `+${r1(b.employment)}` : '—'}
                        </td>
                        {/* Final score */}
                        <td style={{ ...td, width: 80, background: isSelected ? '#fffbe6' : '#0f172a', textAlign: 'right', fontWeight: 700, fontSize: 13,
                          color: b.total >= 80 ? '#10b981' : b.total >= 70 ? '#f59e0b' : '#ef4444' }}>
                          {r1(b.total)}
                        </td>
                        {/* Risk */}
                        <td style={{ ...td, width: 100, textAlign: 'left' }}>
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px', borderRadius: 4,
                            background: RISK_SOLID[x.riskLevel] ?? '#94a3b8', color: '#fff',
                            fontSize: 11, fontWeight: 600, letterSpacing: '.01em',
                          }}>
                            {RISK_LABEL[x.riskLevel] ?? x.riskLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pag.page}
              pageCount={pag.pageCount}
              onChange={pag.setPage}
              total={pag.total}
              pageSize={pag.pageSize}
            />
          </div>
        )}

        {/* Fixed bottom action bar */}
        {selectedCount > 0 && (
          <>
            <style>{`
              @keyframes em-slide-up {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              minWidth: 520,
              maxWidth: 'calc(100vw - 320px)',
              zIndex: 50,
              background: '#0f172a',
              color: '#fff',
              borderRadius: 14,
              padding: '11px 16px 11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              boxShadow: '0 8px 40px rgba(15,23,42,.35), 0 2px 8px rgba(15,23,42,.15)',
              animation: 'em-slide-up .22s cubic-bezier(.2,.7,.3,1)',
            }}>
              {/* Left: count + desc */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999,
                  background: 'rgba(255,255,255,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Check style={{ width: 14, height: 14 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedCount}</span>
                    {' '}ta talaba tanlandi
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 1 }}>
                    Grant qarori sahifasidan har biriga qaror qabul qiling
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { setSelected({}); sessionStorage.removeItem('em_grant_session'); }}
                  style={{
                    height: 32, padding: '0 14px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,.15)',
                    background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)',
                    fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}
                >
                  Tozalash
                </button>
                <button
                  onClick={() => {
                    const newIds = Object.keys(selected).filter(id => selected[id]);
                    const stored = sessionStorage.getItem('em_grant_session');
                    const existing = stored ? stored.split(',').filter(Boolean) : [];
                    const merged = [...new Set([...existing, ...newIds])];
                    sessionStorage.setItem('em_grant_session', merged.join(','));
                    setSelected({});
                    navigate(`/admin/grants?selected=${merged.join(',')}`);
                  }}
                  style={{
                    height: 32, padding: '0 16px', borderRadius: 8,
                    border: 0,
                    background: '#10b981', color: '#fff',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#059669')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#10b981')}
                >
                  Grant berishga o'tish
                  <ArrowRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
