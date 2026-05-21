import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Star, AlertTriangle, BadgeCheck,
  Trophy, Key, LogOut, BarChart2, PanelLeftClose, Menu,
  Search, Bell,
} from 'lucide-react';

const PAGE_LABELS: Record<string, string> = {
  '/admin/dashboard':    'Statistika',
  '/admin/rating':       'Reyting',
  '/admin/achievements': 'Yutuqlar',
  '/admin/penalties':    'Jarimalar',
  '/admin/grants':       'Grant qarori',
  '/admin/integrations': 'API kalitlar',
};

// Section 1: main views
const NAV_S1 = [
  { to: '/admin/dashboard',    label: 'Statistika',   icon: LayoutDashboard },
  { to: '/admin/rating',       label: 'Reyting',      icon: BarChart2 },
];

// Section 2: actions
const NAV_S2 = [
  { to: '/admin/achievements', label: 'Yutuqlar',     icon: Star },
  { to: '/admin/penalties',    label: 'Jarimalar',    icon: AlertTriangle },
  { to: '/admin/grants',       label: 'Grant qarori', icon: BadgeCheck },
];

// Section 3: system
const NAV_S3 = [
  { to: '/admin/integrations', label: 'API kalitlar', icon: Key },
];

function NavItem({
  to, label, icon: Icon, collapsed, active,
}: {
  to: string; label: string; icon: React.ElementType;
  collapsed: boolean; active: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2.5 rounded-lg text-sm transition-colors duration-100 ${
        collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2'
      } ${
        active
          ? 'bg-slate-100 text-slate-900 font-medium'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function NavSection({
  items, collapsed, pathname,
}: {
  items: typeof NAV_S1; collapsed: boolean; pathname: string;
}) {
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <NavItem
          key={item.to}
          {...item}
          collapsed={collapsed}
          active={pathname === item.to}
        />
      ))}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, clear } = useAuth();
  const location = useLocation();

  const initials = user?.email?.[0]?.toUpperCase() ?? 'A';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-slate-200 shrink-0 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-[244px]'
        }`}
      >
        {/* Brand header */}
        <div
          className={`flex items-center h-[60px] border-b border-slate-200 shrink-0 ${
            collapsed ? 'justify-center px-0' : 'justify-between px-[18px]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {/* E mark */}
            <div className="w-7 h-7 rounded-[7px] bg-slate-900 text-white flex items-center justify-center font-bold text-[13px] tracking-tight shrink-0">
              E
            </div>
            {!collapsed && (
              <div className="flex flex-col justify-center leading-none">
                <span className="font-semibold text-[15px] tracking-tight text-slate-900">EduMetric</span>
                <span className="text-[9.5px] font-medium text-slate-400 tracking-widest uppercase mt-0.5">PDP University</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              title="Yig'ish"
              className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsed expand button */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Kengaytirish"
            className="mx-auto mt-2 w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-2">
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[.08em]">
              Admin
            </p>
          )}

          <NavSection items={NAV_S1} collapsed={collapsed} pathname={location.pathname} />

          {/* separator */}
          <div className="h-px bg-slate-100 mx-2" />

          <NavSection items={NAV_S2} collapsed={collapsed} pathname={location.pathname} />

          {/* separator */}
          <div className="h-px bg-slate-100 mx-2" />

          <NavSection items={NAV_S3} collapsed={collapsed} pathname={location.pathname} />
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-2 shrink-0 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{user?.email}</p>
                <p className="text-[10.5px] text-slate-400">Admin</p>
              </div>
            </div>
          )}

          <button
            onClick={clear}
            title="Chiqish"
            className={`flex items-center gap-2.5 w-full rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-5 gap-3.5">
          {/* Breadcrumb */}
          <div className="text-[13px] text-slate-400 flex items-center gap-1">
            <span>Admin</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="text-slate-800 font-medium">
              {PAGE_LABELS[location.pathname] ?? 'Statistika'}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 flex justify-end" style={{ maxWidth: 360, marginLeft: 'auto' }}>
            <div className="relative w-full max-w-[360px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Qidiruv... (talaba, yutuq, hujjat)"
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-[12.5px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Bell */}
          <button
            title="Bildirishnomalar"
            className="relative w-[34px] h-[34px] shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-[15px] h-[15px]" />
            <span className="absolute top-[6px] right-[7px] w-[7px] h-[7px] rounded-full bg-red-500 border-2 border-white" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
