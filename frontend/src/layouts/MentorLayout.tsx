import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mentor/students', label: 'Talabalar', icon: Users },
  { to: '/mentor/feedback', label: 'Feedback', icon: MessageSquare },
];

export default function MentorLayout() {
  const { user, clear } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
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
              onClick={logout}
              title="Chiqish"
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
