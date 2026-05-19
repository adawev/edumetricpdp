import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { T } from '@/lib/theme';
import { BrandMark, BrandWord, Avatar, Button, Tooltip } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useAuth } from '@/lib/auth';

type NavItem = {
  label: string;
  path: string;
  icon: (p: { size: number; stroke: string }) => JSX.Element;
};

const NAV: NavItem[] = [
  { label: 'Dashboard',    path: '/student/dashboard',    icon: Icons.bolt },
  { label: 'Profil',       path: '/student/profile',      icon: Icons.user },
  { label: 'Yutuqlar',     path: '/student/achievements', icon: Icons.award },
  { label: 'Feedbacklar',  path: '/student/feedbacks',    icon: Icons.fileText },
  { label: 'Reyting',      path: '/student/rating',       icon: Icons.trophy },
];

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard':    'Dashboard',
  '/student/profile':      'Profilim',
  '/student/achievements': 'Yutuqlarim',
  '/student/feedbacks':    'Mentor Feedbacklari',
  '/student/rating':       'Mening reytingim',
};

export default function StudentLayout() {
  const { user, clear } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { clear(); navigate('/login'); };

  const sidebarW = collapsed ? 64 : 240;
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Student Panel';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'inherit' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minHeight: '100vh', flexShrink: 0,
        background: T.white, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .2s ease',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          gap: 10, padding: collapsed ? '0 18px' : '0 16px',
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          overflow: 'hidden',
        }}>
          <BrandMark size={28} />
          {!collapsed && <BrandWord size="md" />}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            const btn = (
              <button key={item.path} onClick={() => navigate(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '9px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8, border: 0, cursor: 'pointer',
                background: active ? T.bgSubtle : 'transparent',
                color: active ? T.text : T.textMuted,
                fontWeight: active ? 500 : 400,
                fontSize: 13.5, transition: 'background .12s',
                textAlign: 'left', width: '100%', fontFamily: 'inherit',
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <item.icon size={17} stroke={active ? T.text : T.textMuted} />
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <span style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: 999,
                    background: T.slate900, flexShrink: 0,
                  }} />
                )}
              </button>
            );
            return collapsed
              ? <Tooltip key={item.path} content={item.label}>{btn}</Tooltip>
              : btn;
          })}
        </nav>

        {/* User + logout */}
        <div style={{
          borderTop: `1px solid ${T.border}`, padding: collapsed ? '12px 16px' : '12px',
          display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
        }}>
          {!collapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px' }}>
              <Avatar name={user.profile?.fullName || user.email} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.profile?.fullName || 'Talaba'}
                </div>
                <div style={{ fontSize: 11, color: T.textSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" icon={<Icons.x size={14} stroke={T.textMuted} />}
            onClick={handleLogout}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', color: T.textMuted, fontSize: 12.5 }}
          >
            {!collapsed && 'Chiqish'}
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          height: 56, borderBottom: `1px solid ${T.border}`,
          background: T.white, display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12, flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setCollapsed(c => !c)} style={{
            border: 0, background: 'transparent', cursor: 'pointer',
            color: T.textMuted, padding: 4, borderRadius: 6, display: 'flex',
          }}>
            <Icons.menu size={16} stroke={T.textMuted} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: '-0.01em' }}>
            {pageTitle}
          </span>
          <div style={{ flex: 1 }} />
          {user && (
            <Tooltip content={user.profile?.fullName || user.email}>
              <Avatar name={user.profile?.fullName || user.email} size={28} />
            </Tooltip>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
