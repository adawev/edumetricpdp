import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { T } from '@/lib/theme';
import { PublicChrome } from '@/components/em/PublicChrome';
import { Tabs, Skeleton } from '@/components/em/Primitives';
import { BadgeCatalogCard, type BadgeDef } from '@/components/em/Badges';

export default function PublicBadgesPage() {
  const [cat, setCat] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['badge-catalog'],
    queryFn: async () => (await api.get<BadgeDef[]>('/public/badges/catalog')).data,
  });

  const counts = useMemo(() => {
    if (!data) return { all: 0, compete: 0, academic: 0, activity: 0, aggregate: 0 };
    return {
      all: data.length,
      compete: data.filter(b => b.category === 'compete').length,
      academic: data.filter(b => b.category === 'academic').length,
      activity: data.filter(b => b.category === 'activity').length,
      aggregate: data.filter(b => b.category === 'aggregate').length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return cat === 'all' ? data : data.filter(b => b.category === cat);
  }, [data, cat]);

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
            <Tabs value={cat} onChange={setCat} items={[
              { id: 'all',       label: 'Hammasi',   count: counts.all },
              { id: 'compete',   label: 'Musobaqa',  count: counts.compete },
              { id: 'academic',  label: 'Akademik',  count: counts.academic },
              { id: 'activity',  label: 'Faollik',   count: counts.activity },
              { id: 'aggregate', label: 'Jamlovchi', count: counts.aggregate },
            ]} />
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={210} r={12} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {filtered.map(b => <BadgeCatalogCard key={b.slug} badge={b} />)}
            </div>
          )}
        </div>
      </div>
    </PublicChrome>
  );
}
