import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Users, Star, AlertTriangle, BadgeCheck,
  Trophy, Key, GraduationCap, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/admin/students',      label: 'Talabalar',    icon: Users },
  { to: '/admin/achievements',  label: 'Yutuqlar',     icon: Star },
  { to: '/admin/penalties',     label: 'Jarimalar',    icon: AlertTriangle },
  { to: '/admin/grants',        label: 'Grant qaror',  icon: BadgeCheck },
  { to: '/admin/rating',        label: 'Reyting',      icon: Trophy },
  { to: '/admin/integrations',  label: 'API kalitlar', icon: Key },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, clear } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`flex flex-col bg-white border-r transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b gap-2 shrink-0">
          <GraduationCap className="w-5 h-5 text-slate-900 shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-slate-900 truncate">EduMetric</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-2 space-y-0.5 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700">
                {user?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{user?.email}</p>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
            </div>
          )}

          <button
            onClick={clear}
            title={collapsed ? 'Chiqish' : undefined}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Chiqish</span>}
          </button>

          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Kengaytirish' : 'Yig\'ish'}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 shrink-0" />
              : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!collapsed && <span className="text-xs">Yig'ish</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
