import { useAuth } from '@/lib/auth';

export default function AdminDashboard() {
  const { user, clear } = useAuth();
  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Admin paneli</h1>
        <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">Chiqish</button>
      </div>
      <div className="text-muted-foreground">TODO: stats, students, achievements, penalties, grants, rating.</div>
      <div className="mt-4 text-sm">Salom, <b>{user?.email}</b></div>
    </div>
  );
}
