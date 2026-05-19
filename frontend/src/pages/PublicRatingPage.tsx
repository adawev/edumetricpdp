import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { T } from '@/lib/theme';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Card, Input, Select, Skeleton, Avatar } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { BadgeRowMark, type BadgeMini, type BadgeRarity } from '@/components/em/Badges';

type Row = {
  rank: number; id: string; fullName: string; group: string;
  grantScore: number; grantStatus: string; grantReason: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  badge: BadgeMini | null;
  badgeCount: number;
};
type Group = { id: string; name: string; course: number };

export default function PublicRatingPage() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [course, setCourse] = useState('all');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [skeletonDelay, setSkeletonDelay] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSkeletonDelay(false), 500);
    return () => clearTimeout(t);
  }, []);

  const { data: groups } = useQuery({
    queryKey: ['public-groups'],
    queryFn: async () => (await api.get<Group[]>('/public/groups')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-rating'],
    queryFn: async () => (await api.get<Row[]>('/public/rating')).data,
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

  const hasFilter = q.trim() !== '' || group !== 'all' || course !== 'all';
  const top3 = filtered.slice(0, 3);
  const rest = hasFilter ? filtered : filtered.slice(3);
  const startIdx = hasFilter ? 1 : 4;
  const loading = isLoading || skeletonDelay;

  return (
    <PublicChrome loginModal={{ open: showLoginModal, onClose: () => setShowLoginModal(false) }}>
      <div style={{ padding: '44px 32px 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.05, color: T.text }}>
              Talabalar reytingi
            </h1>
            <p style={{ margin: '10px 0 0', color: T.textMuted, fontSize: 15, maxWidth: 620, lineHeight: 1.55 }}>
              PDP University grant nizomi asosida shaffof ball tizimi
            </p>
          </div>

          <Card padding={12} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Talaba yoki guruh nomi..." icon={<Icons.search size={14} />} />
              </div>
              <div style={{ flex: '0 0 180px', minWidth: 150 }}>
                <Select value={group} onChange={setGroup}
                  options={[{ value: 'all', label: 'Barcha guruhlar' }, ...(groups?.map(g => ({ value: g.id, label: g.name })) || [])]} />
              </div>
              <div style={{ flex: '0 0 150px', minWidth: 130 }}>
                <Select value={course} onChange={setCourse}
                  options={[{ value: 'all', label: 'Barcha kurslar' }, ...courses.map(c => ({ value: c, label: `${c}-kurs` }))]} />
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 500, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{filtered.length}</span> ta talaba
              </div>
            </div>
          </Card>

          {loading ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
                {[0, 1, 2].map(i => <Skeleton key={i} h={170} r={14} />)}
              </div>
              <Skeleton h={400} r={12} />
            </>
          ) : (
            <>
              {!hasFilter && top3.length === 3 && <Top3Podium rows={top3} onClick={() => setShowLoginModal(true)} />}
              {rest.length === 0 ? <PublicEmptyState /> : (
                <Card padding={0}>
                  <RatingTable rows={rest} startIndex={startIdx} onRowClick={() => setShowLoginModal(true)} />
                </Card>
              )}
            </>
          )}

          <div style={{ marginTop: 24, marginBottom: 24, fontSize: 12, color: T.textSubtle, textAlign: 'center' }}>
            Reyting har 24 soatda yangilanadi · Avtomatik hisoblash
          </div>
        </div>
      </div>
    </PublicChrome>
  );
}

function Top3Podium({ rows, onClick }: { rows: Row[]; onClick: () => void }) {
  // Olympic podium order: #2 chap, #1 markaz (katta), #3 o'ng
  const order: { stu: Row; place: 1 | 2 | 3 }[] = [
    { stu: rows[1], place: 2 },
    { stu: rows[0], place: 1 },
    { stu: rows[2], place: 3 },
  ];
  const styles: Record<1 | 2 | 3, { bg: string; border: string; placeColor: string; iconBg: string; icon: JSX.Element; ribbon: string }> = {
    1: {
      bg: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
      border: '#f59e0b', placeColor: '#a16207',
      iconBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
      icon: <Icons.trophy size={28} stroke="#fff" strokeWidth={2.4} />,
      ribbon: '#a16207',
    },
    2: {
      bg: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
      border: '#94a3b8', placeColor: '#475569',
      iconBg: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
      icon: <Icons.medal size={24} stroke="#fff" strokeWidth={2.4} />,
      ribbon: '#475569',
    },
    3: {
      bg: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)',
      border: '#ea580c', placeColor: '#9a3412',
      iconBg: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
      icon: <Icons.award size={24} stroke="#fff" strokeWidth={2.4} />,
      ribbon: '#9a3412',
    },
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 14, marginBottom: 28,
      alignItems: 'end',
    }}>
      {order.map(({ stu, place }, i) => {
        const st = styles[place];
        const isCenter = place === 1;
        const padding = isCenter ? 26 : 20;
        const placeFontSize = isCenter ? 52 : 38;
        const nameFontSize = isCenter ? 19 : 16;
        const scoreFontSize = isCenter ? 42 : 30;
        const iconSize = isCenter ? 54 : 44;

        return (
          <div key={stu.id} onClick={onClick} style={{
            background: st.bg, border: `2px solid ${st.border}`, borderRadius: 16,
            padding, position: 'relative', overflow: 'hidden',
            transform: isCenter ? 'translateY(-12px)' : 'none',
            boxShadow: isCenter
              ? `0 16px 40px ${st.border}55, 0 2px 8px rgba(15,23,42,.06)`
              : '0 4px 12px rgba(15,23,42,.06)',
            animation: 'em-slide-up 0.55s cubic-bezier(.2,.7,.3,1) backwards',
            animationDelay: `${0.06 + i * 0.09}s`, cursor: 'pointer',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isCenter ? 'translateY(-18px)' : 'translateY(-6px)';
            e.currentTarget.style.boxShadow = isCenter
              ? `0 24px 50px ${st.border}77, 0 2px 8px rgba(15,23,42,.08)`
              : '0 12px 28px rgba(15,23,42,.14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isCenter ? 'translateY(-12px)' : 'none';
            e.currentTarget.style.boxShadow = isCenter
              ? `0 16px 40px ${st.border}55, 0 2px 8px rgba(15,23,42,.06)`
              : '0 4px 12px rgba(15,23,42,.06)';
          }}>
            {/* Crown ribbon for #1 */}
            {isCenter && (
              <span style={{
                position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                background: st.ribbon, color: '#fff', fontSize: 10, fontWeight: 800,
                padding: '4px 14px 5px', borderRadius: '0 0 8px 8px',
                letterSpacing: '.12em', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
              }}>👑 GRAND PRIX</span>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isCenter ? 12 : 0 }}>
              <div style={{
                fontSize: placeFontSize, fontWeight: 800, letterSpacing: '-0.05em',
                color: st.placeColor, lineHeight: 0.85, fontVariantNumeric: 'tabular-nums',
              }}>#{place}</div>
              <div style={{
                width: iconSize, height: iconSize, borderRadius: 14,
                background: st.iconBg,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 6px 16px ${st.border}88, inset 0 -2px 5px rgba(0,0,0,.15), inset 0 2px 5px rgba(255,255,255,.4)`,
              }}>{st.icon}</div>
            </div>

            <div style={{ marginTop: isCenter ? 22 : 18 }}>
              <div style={{ fontSize: nameFontSize, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, lineHeight: 1.25 }}>
                {stu.fullName}
              </div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4 }}>{stu.group}</div>
            </div>

            <div style={{ marginTop: isCenter ? 20 : 16, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{
                fontSize: scoreFontSize, fontWeight: 800, letterSpacing: '-0.04em',
                color: T.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{stu.grantScore.toFixed(1)}</div>
              <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>ball</div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <HolatBadge status={stu.grantStatus} />
              <BadgeRowMark badge={stu.badge} count={stu.badgeCount} size={isCenter ? 32 : 26} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HolatBadge({ status }: { status: string }) {
  // Mehmon ko'rinishi: faqat 3 ta yorqin holat — sabab YO'Q
  const map: Record<string, { bg: string; fg: string; bd: string; label: string }> = {
    GRANTED:     { bg: T.emeraldBg, fg: T.emeraldText, bd: '#a7f3d0', label: 'Grant' },
    PENDING:     { bg: T.amberBg,   fg: T.amberText,   bd: '#fde68a', label: 'Kutilmoqda' },
    NOT_GRANTED: { bg: T.bgSubtle,  fg: T.text,        bd: T.border,  label: 'Kontrakt' },
  };
  const c = map[status] || map.NOT_GRANTED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '.01em',
    }}>{c.label}</span>
  );
}

function RatingTable({ rows, startIndex, onRowClick }: { rows: Row[]; startIndex: number; onRowClick: () => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
        <thead>
          <tr style={{ background: T.bg }}>
            {[
              { l: '#', a: 'center', w: 56 },
              { l: 'Ism', a: 'left' },
              { l: 'Guruh', a: 'left', w: 140 },
              { l: 'Ball', a: 'right', w: 110 },
              { l: 'Holat', a: 'left', w: 160 },
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
            const rank = startIndex + i;
            return (
              <tr key={stu.id} onClick={onRowClick} style={{
                borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
                transition: 'background .12s', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.querySelectorAll<HTMLTableCellElement>('td.em-hov').forEach(td => td.style.background = T.bgSubtle); }}
              onMouseLeave={(e) => { e.currentTarget.querySelectorAll<HTMLTableCellElement>('td.em-hov').forEach(td => td.style.background = ''); }}>
                <td className="em-hov" style={{ padding: '12px 16px', textAlign: 'center', color: T.textMuted, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{rank}</td>
                <td className="em-hov" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Badge: avatardan oldin, kichik */}
                    <span style={{ width: 22, display: 'inline-flex', justifyContent: 'center' }}>
                      <BadgeRowMark badge={stu.badge} count={stu.badgeCount} size={22} />
                    </span>
                    <Avatar name={stu.fullName} size={30} />
                    <span style={{ fontWeight: 500 }}>{stu.fullName}</span>
                  </div>
                </td>
                <td className="em-hov" style={{ padding: '12px 16px', color: T.textMuted }}>{stu.group}</td>
                <td className="em-hov" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 14, letterSpacing: '-0.01em' }}>
                  {stu.grantScore.toFixed(1)}
                </td>
                <td className="em-hov" style={{ padding: '12px 16px' }}>
                  <HolatBadge status={stu.grantStatus} />
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
