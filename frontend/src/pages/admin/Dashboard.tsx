import AdminLayout from './AdminLayout';
import { useAuth } from '@/lib/auth';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Salom, <b>{user?.email}</b></p>
        <p className="text-muted-foreground mt-4 text-sm">Phase 2 da to'liq implement qilinadi.</p>
      </div>
    </AdminLayout>
  );
}
