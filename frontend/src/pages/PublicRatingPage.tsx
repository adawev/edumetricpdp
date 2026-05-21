import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { T } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Card, Input, Select, Skeleton, Avatar, Tabs, Pagination, usePagination } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { BadgeRowMark, type BadgeMini } from '@/components/em/Badges';

type Period = 'week' | 'month' | 'all';
const PERIOD_LABEL: Record<Period, string> = {
  week: 'Bu hafta',
  month: 'Bu oy',
  all: 'Hammasi',
};

function fmtRelative(s?: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  const diff = Math.round((Date.now() - d.getTime()) / 60000); // daqiqa
  if (diff < 1) return 'hozir';
  if (diff < 60) return `${diff} daqiqa oldin`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} soat oldin`;
  return `${Math.round(diff / (60 * 24))} kun oldin`;
}

type Row = {
  rank: number; id: string; fullName: string; group: string;
  grantScore: number; periodBall?: number;
  grantStatus: string; grantReason: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  weeklyActivity?: number;
  lastRecalc?: string;
  isAnonymized?: boolean;
  badge: BadgeMini | null;
  badgeCount: number;
};
type Group = { id: string; name: string; course: number };

export default function PublicRatingPage() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [course, setCourse] = useState('all');
  const [period, setPeriod] = useState<Period>('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [skeletonDelay, setSkeletonDelay] = useState(true);
  const navigate = useNavigate();
  const user = useAuth(s => s.user);

  // Row click: login bo'lsa → public profil sahifasi; mehmon esa login modal
  const handleRowClick = (id?: string) => {
    if (user && id) navigate(`/student/${id}`);
    else setShowLoginModal(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setSkeletonDelay(false), 500);
    return () => clearTimeout(t);
  }, []);

  const { data: groups } = useQuery({
    queryKey: ['public-groups'],
    queryFn: async () => (await api.get<Group[]>('/public/groups')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-rating', period],
    queryFn: async () => (await api.get<Row[]>('/public/rating', { params: { period } })).data,
  });

  const courses = useMemo(() => Array.from(new Set(groups?.map(g => String(g.course)) || [])).sort(), [groups]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(s =>
      (group === 'all' || s.group === groups?.find(g => g.id === group)?.name) &&
      (course === 'all' || groups?.find(g => g.name === s.group)?.course === Number(course)) &&
      (s.fullName.toLowerCase().includes(q.toLowerCase()) || s.group.toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, q, group, course, groups]);

  const hasGroupFilter = group !== 'all' || course !== 'all';
  const loading = isLoading || skeletonDelay;

  const pag = usePagination(filtered, 20, [q, group, course]);

  return (
    <PublicChrome loginModal={{ open: showLoginModal, onClose: () => setShowLoginModal(false) }}>
      <div className="px-4 pt-8 sm:px-8 sm:pt-11">
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.05, color: T.text }}>
                Talabalar reytingi
              </h1>
              <p style={{ margin: '10px 0 0', color: T.textMuted, fontSize: 15, maxWidth: 620, lineHeight: 1.55 }}>
                PDP University grant nizomi asosida shaffof ball tizimi
              </p>
            </div>
            <Tabs
              value={period}
              onChange={(v) => setPeriod(v as Period)}
              items={[
                { id: 'week',  label: 'Bu hafta' },
                { id: 'month', label: 'Bu oy' },
                { id: 'all',   label: 'Hammasi' },
              ]}
            />
          </div>

          <Card padding={12} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Talaba yoki guruh nomi..." icon={<Icons.search size={14} />} />
              </div>
              <div style={{ flex: '0 0 180px', minWidth: 150 }}>
                <Select value={group} onChange={(v) => { setGroup(v); if (v !== 'all') { const c = groups?.find(g => g.id === v)?.course; if (c !== undefined) setCourse(String(c)); } }}
                  options={[{ value: 'all', label: 'Barcha guruhlar' }, ...((groups || []).filter(g => course === 'all' || String(g.course) === course).map(g => ({ value: g.id, label: g.name })))]} />
              </div>
              <div style={{ flex: '0 0 150px', minWidth: 130 }}>
                <Select value={course} onChange={(v) => { setCourse(v); if (group !== 'all' && v !== 'all' && String(groups?.find(g => g.id === group)?.course) !== v) setGroup('all'); }}
                  options={[{ value: 'all', label: 'Barcha kurslar' }, ...courses.map(c => ({ value: c, label: `${c}-kurs` }))]} />
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 500, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{filtered.length}</span> ta talaba
              </div>
            </div>
          </Card>

          {loading ? (
            <Skeleton h={400} r={12} />
          ) : filtered.length === 0 ? <PublicEmptyState /> : (
            <Card padding={0}>
              <RatingTable rows={pag.pageItems} startIndex={1 + pag.startIndex} useLocalRank={hasGroupFilter} period={period} onRowClick={handleRowClick} />
              <Pagination page={pag.page} pageCount={pag.pageCount} onChange={pag.setPage} total={pag.total} pageSize={pag.pageSize} />
            </Card>
          )}

          <div style={{ marginTop: 24, marginBottom: 24, fontSize: 12, color: T.textSubtle, textAlign: 'center' }}>
            {(() => {
              const lastUpdated = filtered[0]?.lastRecalc;
              return lastUpdated
                ? `Oxirgi yangilanish: ${fmtRelative(lastUpdated)} · Avtomatik hisoblash`
                : 'Reyting har o\'zgarishda avtomatik yangilanadi';
            })()}
          </div>
        </div>
      </div>
    </PublicChrome>
  );
}


// Faollik chizig'i — oxirgi 7 kunda olingan ballarning vizual ko'rsatkichi
function ActivityBar({ value, max }: { value: number; max: number }) {
  if (!value) return <span style={{ color: T.textSubtle, fontSize: 11.5 }}>—</span>;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: T.bgSubtle, borderRadius: 999,
        overflow: 'hidden', minWidth: 60, maxWidth: 90,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          borderRadius: 999, transition: 'width .3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 11.5, fontWeight: 600, color: T.emeraldText,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>+{value.toFixed(1)}</span>
    </div>
  );
}

function RatingTable({ rows, startIndex, useLocalRank, period, onRowClick }: { rows: Row[]; startIndex: number; useLocalRank?: boolean; period: Period; onRowClick: (id?: string) => void }) {
  const maxActivity = Math.max(1, ...rows.map(r => r.weeklyActivity ?? 0));
  const showPeriodBall = period !== 'all';
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
        <thead>
          <tr style={{ background: T.bg }}>
            {[
              { l: '#',       a: 'center', w: 56 },
              { l: 'Ism',     a: 'left' },
              { l: 'Guruh',   a: 'left',   w: 130 },
              { l: 'Faollik', a: 'left',   w: 120 },
              { l: 'Ball',    a: 'right',  w: 90 },
            ].map((h, i) => (
              <th key={i} style={{
                textAlign: h.a as any, padding: '11px 16px', fontSize: 11.5,
                fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.04em',
                width: h.w, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
              }}>{h.l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((stu, i) => {
            const rank = useLocalRank ? (startIndex + i) : (stu.rank ?? startIndex + i);
            return (
              <tr key={stu.id} onClick={() => onRowClick(stu.id)}
                title={stu.lastRecalc ? `Yangilangan: ${fmtRelative(stu.lastRecalc)}` : ''}
                style={{
                  borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
                  transition: 'background .12s', cursor: 'pointer',
                }}
              onMouseEnter={(e) => { e.currentTarget.querySelectorAll<HTMLTableCellElement>('td.em-hov').forEach(td => td.style.background = T.bgSubtle); }}
              onMouseLeave={(e) => { e.currentTarget.querySelectorAll<HTMLTableCellElement>('td.em-hov').forEach(td => td.style.background = ''); }}>
                <td className="em-hov" style={{ padding: '12px 16px', textAlign: 'center', color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{rank}</td>
                <td className="em-hov" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                      <BadgeRowMark badge={stu.badge} count={stu.badgeCount} size={22} />
                    </span>
                    <Avatar name={stu.fullName} size={30} />
                    <span style={{
                      fontWeight: 500,
                      color: stu.isAnonymized ? T.textMuted : T.text,
                      fontStyle: stu.isAnonymized ? 'italic' : 'normal',
                    }}>{stu.fullName}</span>
                    {stu.isAnonymized && (
                      <span title="Talaba o'z profilini yopiq qilgan" style={{
                        fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: T.bgSubtle, color: T.textSubtle, letterSpacing: '.05em',
                      }}>ANONIM</span>
                    )}
                  </div>
                </td>
                <td className="em-hov" style={{ padding: '12px 16px', color: T.textMuted }}>{stu.group}</td>
                <td className="em-hov" style={{ padding: '12px 16px' }}>
                  <ActivityBar value={stu.weeklyActivity ?? 0} max={maxActivity} />
                </td>
                <td className="em-hov" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 14, letterSpacing: '-0.01em' }}>
                  {(showPeriodBall ? (stu.periodBall ?? 0) : stu.grantScore).toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PublicEmptyState() {
  return (
    <div style={{
      padding: 56, textAlign: 'center', border: `1.5px dashed ${T.borderStrong}`, borderRadius: 12, background: T.white,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: T.bgSubtle, display: 'grid', placeItems: 'center', marginBottom: 10 }}>
        <Icons.search size={22} stroke={T.textSubtle} />
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: T.text }}>Talaba topilmadi</div>
      <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 320 }}>Boshqa nom yoki guruh sinab ko'ring</div>
    </div>
  );
}
