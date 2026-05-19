import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { LayoutDashboard, Users, MessageSquare, LogOut, GraduationCap, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mentor/students', label: 'Talabalar', icon: Users },
  { to: '/mentor/feedback', label: 'Feedback', icon: MessageSquare },
];

function SidebarContent({ onNavigate, onLogout, mentorName, initials }: {
  onNavigate?: () => void;
  onLogout: () => void;
  mentorName: string;
  initials: string;
}) {
  return (
    <>
      <div className="h-14 flex items-center gap-2 px-5 border-b">
        <GraduationCap className="w-5 h-5 text-slate-900" />
        <span className="font-semibold tracking-tight">EduMetric</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{mentorName}</div>
            <div className="text-xs text-muted-foreground truncate">Mentor</div>
          </div>
          <button
            onClick={onLogout}
            title="Chiqish"
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function MentorLayout() {
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
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 bg-white border-r flex-col shrink-0">
        <SidebarContent onLogout={logout} mentorName={mentorName} initials={initials} />
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
          <Dialog.Content
            className="md:hidden fixed top-0 left-0 z-50 h-full w-64 max-w-[80%] bg-white border-r shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200"
          >
            <Dialog.Title className="sr-only">Navigatsiya</Dialog.Title>
            <SidebarContent onLogout={logout} mentorName={mentorName} initials={initials} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden h-14 bg-white border-b flex items-center px-4 gap-3 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-900" />
            <span className="font-semibold tracking-tight">{pageTitle}</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
