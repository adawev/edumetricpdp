import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { T } from '@/lib/theme';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Skeleton, Tabs } from '@/components/em/Primitives';
import { BadgeCatalogCard, BADGE_CATEGORY_LABEL, type BadgeDef } from '@/components/em/Badges';

const CATEGORY_TABS = [
  { id: 'all',       label: 'Hammasi' },
  { id: 'compete',   label: 'Musobaqa' },
  { id: 'academic',  label: 'Akademik' },
  { id: 'activity',  label: 'Faollik' },
  { id: 'aggregate', label: 'Jamlovchi' },
];

export default function PublicBadgesPage() {
  const [tab, setTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['public-badges-catalog'],
    queryFn: async () => (await api.get<BadgeDef[]>('/public/badges/catalog')).data,
  });

  const all = data ?? [];
  const filtered = tab === 'all' ? all : all.filter(b => b.category === tab);

  const tabsWithCounts = CATEGORY_TABS.map(t => ({
    ...t,
    count: t.id === 'all' ? all.length : all.filter(b => b.category === t.id).length,
  }));

  return (
    <PublicChrome>
      <div style={{ padding: '44px 32px 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.05, color: T.text }}>
              Badge'lar
            </h1>
            <p style={{ margin: '10px 0 0', color: T.textMuted, fontSize: 15, maxWidth: 640, lineHeight: 1.55 }}>
              Yutuq, faollik va akademik natijalar uchun avtomatik beriladi
            </p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <Tabs value={tab} onChange={setTab} items={tabsWithCounts} />
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} h={260} r={14} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: 56, textAlign: 'center', border: `1.5px dashed ${T.borderStrong}`,
              borderRadius: 12, background: T.white,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏅</div>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: T.text }}>Badge topilmadi</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>
                {BADGE_CATEGORY_LABEL[tab] ?? 'Bu'} kategoriyasida hali badge yo'q
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
              {filtered.map(badge => <BadgeCatalogCard key={badge.slug} badge={badge} />)}
            </div>
          )}

        </div>
      </div>
    </PublicChrome>
  );
}
