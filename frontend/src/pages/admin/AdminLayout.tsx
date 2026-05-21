import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Star, AlertTriangle, BadgeCheck,
  Key, LogOut, BarChart2, PanelLeftClose, Menu,
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
  to, label, icon: Icon, collapsed, active, onNavigate,
}: {
  to: string; label: string; icon: React.ElementType;
  collapsed: boolean; active: boolean; onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
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
  items, collapsed, pathname, onNavigate,
}: {
  items: typeof NAV_S1; collapsed: boolean; pathname: string; onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <NavItem
          key={item.to}
          {...item}
          collapsed={collapsed}
          active={pathname === item.to}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function SidebarContent({
  collapsed, pathname, email, onCollapse, onLogout, onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  email?: string;
  onCollapse?: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const initials = email?.[0]?.toUpperCase() ?? 'A';
  return (
    <>
      {/* Brand header */}
      <div
        className={`flex items-center h-[60px] border-b border-slate-200 shrink-0 ${
          collapsed ? 'justify-center px-0' : 'justify-between px-[18px]'
        }`}
      >
        <div className="flex items-center gap-2.5">
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
        {!collapsed && onCollapse && (
          <button
            onClick={onCollapse}
            title="Yig'ish"
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && onCollapse && (
        <button
          onClick={onCollapse}
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

        <NavSection items={NAV_S1} collapsed={collapsed} pathname={pathname} onNavigate={onNavigate} />
        <div className="h-px bg-slate-100 mx-2" />
        <NavSection items={NAV_S2} collapsed={collapsed} pathname={pathname} onNavigate={onNavigate} />
        <div className="h-px bg-slate-100 mx-2" />
        <NavSection items={NAV_S3} collapsed={collapsed} pathname={pathname} onNavigate={onNavigate} />
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-2 shrink-0 space-y-0.5">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{email}</p>
              <p className="text-[10.5px] text-slate-400">Admin</p>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          title="Chiqish"
          className={`flex items-center gap-2.5 w-full rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Chiqish</span>}
        </button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clear } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 h-screen transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-[244px]'
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          pathname={location.pathname}
          email={user?.email}
          onCollapse={() => setCollapsed(c => !c)}
          onLogout={clear}
        />
      </aside>

      {/* Mobile drawer */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <Dialog.Content className="md:hidden fixed top-0 left-0 z-50 h-full w-[244px] max-w-[80%] bg-white border-r shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200">
            <Dialog.Title className="sr-only">Navigatsiya</Dialog.Title>
            <SidebarContent
              collapsed={false}
              pathname={location.pathname}
              email={user?.email}
              onLogout={clear}
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-4 sm:px-5 gap-3 sm:gap-3.5">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="text-[13px] text-slate-400 flex items-center gap-1 min-w-0">
            <span className="hidden sm:inline">Admin</span>
            <span className="hidden sm:inline mx-1 text-slate-300">/</span>
            <span className="text-slate-800 font-medium truncate">
              {PAGE_LABELS[location.pathname] ?? 'Statistika'}
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 hidden sm:flex justify-end" style={{ maxWidth: 360, marginLeft: 'auto' }}>
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
            className="relative w-[34px] h-[34px] shrink-0 ml-auto sm:ml-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
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
