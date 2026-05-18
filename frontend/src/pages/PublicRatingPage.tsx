import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type RatingRow = {
  rank: number;
  id: string;
  fullName: string;
  group: string;
  grantScore: number;
  grantStatus: 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
};

const statusLabel: Record<RatingRow['grantStatus'], { text: string; cls: string }> = {
  GRANTED: { text: 'Grant berildi', cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { text: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700' },
  NOT_GRANTED: { text: 'Grant yo\'q', cls: 'bg-red-100 text-red-700' },
  UNKNOWN: { text: 'Aniqlanmagan', cls: 'bg-slate-100 text-slate-700' },
};

export default function PublicRatingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-rating'],
    queryFn: async () => (await api.get<RatingRow[]>('/public/rating')).data,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container flex items-center justify-between h-14">
          <div>
            <h1 className="text-lg font-semibold">EduMetric</h1>
          </div>
          <a href="/login" className="text-sm font-medium hover:text-primary">Kirish →</a>
        </div>
      </header>

      <main className="container py-10 space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PDP University talabalar reytingi</h2>
          <p className="text-muted-foreground mt-2">Grant nizomi asosida shaffof ball tizimi</p>
        </div>

        {isLoading && <div className="text-muted-foreground">Yuklanmoqda...</div>}

        {data && data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.slice(0, 3).map((s, i) => (
                <div
                  key={s.id}
                  className={`rounded-xl p-6 border-2 ${
                    i === 0 ? 'border-amber-400 bg-amber-50' :
                    i === 1 ? 'border-slate-300 bg-slate-50' :
                    'border-orange-300 bg-orange-50'
                  }`}
                >
                  <div className="text-3xl font-bold">#{s.rank}</div>
                  <div className="mt-2 font-semibold">{s.fullName}</div>
                  <div className="text-sm text-muted-foreground">{s.group}</div>
                  <div className="text-2xl font-bold mt-3">{s.grantScore} ball</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Ism</th>
                    <th className="px-4 py-3 font-medium">Guruh</th>
                    <th className="px-4 py-3 font-medium text-right">Ball</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(s => (
                    <tr key={s.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.rank}</td>
                      <td className="px-4 py-3">{s.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.group}</td>
                      <td className="px-4 py-3 text-right font-semibold">{s.grantScore}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusLabel[s.grantStatus].cls}`}>
                          {statusLabel[s.grantStatus].text}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Hozircha talabalar yo'q</div>
        )}
      </main>
    </div>
  );
}
