import { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { T } from '@/lib/theme';
import { BrandMark, BrandWord, Avatar, Tooltip } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';
import { useAuth } from '@/lib/auth';

type NavItem = {
  label: string;
  path: string;
  icon: (p: { size: number; stroke: string }) => JSX.Element;
};

const NAV_SECTIONS: { items: NavItem[] }[] = [
  {
    items: [
      { label: 'Asosiy',       path: '/student/dashboard',    icon: Icons.home },
      { label: 'Profil',       path: '/student/profile',      icon: Icons.user },
      { label: 'Reyting',      path: '/student/rating',       icon: Icons.trophy },
    ],
  },
  {
    items: [
      { label: 'Yutuqlar',     path: '/student/achievements', icon: Icons.award },
      { label: "Feedback'lar", path: '/student/feedbacks',    icon: Icons.message },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard':    'Asosiy',
  '/student/profile':      'Profil',
  '/student/achievements': 'Yutuqlar',
  '/student/feedbacks':    "Feedback'lar",
  '/student/rating':       'Reyting',
};

export default function StudentLayout() {
  const { user, clear } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = () => { clear(); navigate('/login'); };

  const sidebarW = collapsed ? 64 : 244;
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Student Panel';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'inherit' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW, minHeight: '100vh', flexShrink: 0,
        background: T.white, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .2s ease',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Logo + collapse toggle */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          gap: 10, padding: collapsed ? '0 18px' : '0 12px 0 16px',
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          overflow: 'hidden', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <BrandMark size={28} />
            {!collapsed && <BrandWord size="md" />}
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              color: T.textMuted, padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'background .12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {collapsed
              ? <Icons.chevronRight size={15} stroke={T.textMuted} />
              : <Icons.chevronLeft size={15} stroke={T.textMuted} />}
          </button>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {si > 0 && (
                <div style={{
                  height: 1, background: T.border,
                  margin: collapsed ? '8px 12px' : '8px 4px',
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(item => {
                  const active = location.pathname === item.path;
                  const btn = (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      style={{
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
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          borderTop: `1px solid ${T.border}`,
          padding: collapsed ? '12px 8px' : '12px 12px',
          display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
        }}>
          {!collapsed && user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 8,
              border: `1px solid ${T.border}`,
            }}>
              <Avatar name={user.profile?.fullName || user.email} size={30} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.profile?.fullName || 'Talaba'}
                </div>
                <div style={{ fontSize: 11, color: T.textSubtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          {collapsed && user && (
            <Tooltip content={user.profile?.fullName || user.email}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar name={user.profile?.fullName || user.email} size={30} />
              </div>
            </Tooltip>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: '7px 8px', borderRadius: 8,
              border: 0, background: 'transparent', cursor: 'pointer',
              color: T.textMuted, fontSize: 12.5, fontFamily: 'inherit',
              transition: 'background .12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icons.x size={14} stroke={T.textMuted} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          height: 56, borderBottom: `1px solid ${T.border}`,
          background: T.white, display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12, flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
            <span style={{ color: T.textMuted }}>Talaba</span>
            <Icons.chevronRight size={13} stroke={T.textSubtle} />
            <span style={{ fontWeight: 600, color: T.text }}>{pageTitle}</span>
          </div>

          {/* Search — right-aligned */}
          <div style={{ marginLeft: 'auto', maxWidth: 360, width: '100%' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '6px 12px', background: T.bg, transition: 'border-color .15s',
            }}
            onFocus={() => {}}
            >
              <Icons.search size={14} stroke={T.textSubtle} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish..."
                style={{
                  border: 0, background: 'transparent', outline: 'none',
                  fontSize: 13, color: T.text, fontFamily: 'inherit',
                  width: '100%', minWidth: 0,
                }}
              />
            </div>
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
              transition: 'background .12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bgSubtle; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Icons.bell size={18} stroke={T.textMuted} />
            </button>
            {/* Red notification dot */}
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7, borderRadius: 999,
              background: '#ef4444', border: `1.5px solid ${T.white}`,
              pointerEvents: 'none',
            }} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
