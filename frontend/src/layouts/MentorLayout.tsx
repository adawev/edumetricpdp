import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { LayoutDashboard, Users, MessageSquare, LogOut, GraduationCap, Menu, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navSections = [
  {
    items: [
      { to: '/mentor/dashboard', label: "Guruh ko'rinishi", icon: LayoutDashboard },
      { to: '/mentor/students',  label: 'Talabalar',        icon: Users },
    ],
  },
  {
    items: [
      { to: '/mentor/feedback',   label: 'Feedback yozish', icon: MessageSquare },
      { to: '/mentor/discipline', label: 'Intizom bahosi',  icon: Shield },
    ],
  },
];

const navItems = navSections.flatMap(s => s.items);

function SidebarContent({ onNavigate, onLogout, mentorName, initials }: {
  onNavigate?: () => void;
  onLogout: () => void;
  mentorName: string;
  initials: string;
}) {
  return (
    <>
      {/* Brand */}
      <div className="h-[60px] flex items-center gap-2.5 px-5 border-b shrink-0">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
          E
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-semibold tracking-tight text-[15px] leading-none">EduMetric</span>
          <span className="text-[9.5px] text-slate-400 uppercase tracking-widest mt-0.5 font-medium">PDP University</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0 overflow-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="my-2 mx-1 h-px bg-slate-100" />}
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 h-9 px-2.5 rounded-md text-[13px] font-medium transition-colors my-[1px]',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-slate-900' : 'text-slate-400')} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{mentorName}</div>
            <div className="text-[11px] text-slate-400 truncate">Mentor</div>
          </div>
          <button
            onClick={onLogout}
            title="Chiqish"
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function MentorLayout({ children }: { children?: React.ReactNode } = {}) {
  const { user, clear } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function logout() {
    clear();
    navigate('/login');
  }

  const mentorName = user?.profile?.fullName || user?.email || 'Mentor';
  const initials = mentorName
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const pageTitle =
    navItems.find(n => location.pathname.startsWith(n.to))?.label ?? 'Mentor';

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r flex-col shrink-0 h-full overflow-y-auto">
        <SidebarContent onLogout={logout} mentorName={mentorName} initials={initials} />
      </aside>

      {/* Mobile drawer */}
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <Dialog.Content
            className="md:hidden fixed top-0 left-0 z-50 h-full w-60 max-w-[80%] bg-white border-r shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200"
          >
            <Dialog.Title className="sr-only">Navigatsiya</Dialog.Title>
            <SidebarContent onNavigate={() => setMobileOpen(false)} onLogout={logout} mentorName={mentorName} initials={initials} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-white border-b flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-900" />
            <span className="font-semibold tracking-tight text-sm">{pageTitle}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
