import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { T } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { BrandMark, BrandWord, Button, Dialog } from './Primitives';
import { Icons } from './Icons';

export function PublicChrome({ children, loginModal }: { children: ReactNode; loginModal?: { open: boolean; onClose: () => void } }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const user = useAuth(s => s.user);
  const active = loc.pathname.includes('about') ? 'about' : loc.pathname.includes('badges') ? 'badges' : 'rating';

  // Login bo'lganlar uchun panel marshruti
  const panelPath = user?.role === 'STUDENT' ? '/student/dashboard'
                  : user?.role === 'MENTOR'  ? '/mentor/dashboard'
                  : user?.role === 'ADMIN'   ? '/admin/dashboard'
                  : null;

  // Login bo'lgan foydalanuvchi uchun login modal'ni ko'rsatmaslik
  const effectiveLoginModal = user ? undefined : loginModal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, height: 64, flexShrink: 0,
        background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
          <Link to="/public/rating" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <BrandMark size={28} />
            <BrandWord />
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[{ id: 'rating',  label: 'Reyting',       path: '/public/rating' },
              { id: 'about',   label: 'Grant haqida',   path: '/public/about' }].map(item => {
              const isActive = active === item.id;
              return (
                <Link key={item.id} to={item.path} style={{
                  padding: '6px 12px', borderRadius: 7,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? T.text : T.textMuted,
                  background: isActive ? T.bgSubtle : 'transparent',
                  textDecoration: 'none', transition: 'all .12s',
                }}>{item.label}</Link>
              );
            })}
          </nav>
        </div>
        {user && panelPath ? (
          <Button variant="primary" size="sm" iconRight={<Icons.arrowRight size={13} />} onClick={() => navigate(panelPath)}>
            Mening panelim
          </Button>
        ) : (
          <Button variant="primary" size="sm" iconRight={<Icons.arrowRight size={13} />} onClick={() => navigate('/login')}>
            Kirish
          </Button>
        )}
      </header>

      <main style={{ flex: 1 }}>
        {children}
        <PublicFooter />
      </main>

      {effectiveLoginModal && (
        <Dialog open={effectiveLoginModal.open} onClose={effectiveLoginModal.onClose}
          title="Profilni ko'rish uchun kiring"
          description="Talaba profillari va batafsil ma'lumotlar faqat ro'yxatdan o'tgan foydalanuvchilarga ochiq."
          size="sm"
          footer={<>
            <Button variant="outline" onClick={effectiveLoginModal.onClose}>Bekor qilish</Button>
            <Button variant="primary" onClick={() => { effectiveLoginModal.onClose(); navigate('/login'); }} iconRight={<Icons.arrowRight size={13} />}>
              Kirish sahifasiga o'tish
            </Button>
          </>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: T.bgSubtle, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icons.lock size={20} stroke={T.textMuted} />
            </div>
            <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.5 }}>
              Profilingiz orqali sertifikat, davomat, mentor feedback'lari va shaxsiy ko'rsatkichlaringizni boshqarishingiz mumkin.
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function PublicFooter() {
  return (
    <footer style={{
      borderTop: `1px solid ${T.border}`, marginTop: 48, background: T.white,
      padding: '28px 32px',
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={22} />
          <span style={{ fontSize: 12.5, color: T.textMuted }}>© PDP University 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 12.5 }}>
          {[
            { l: 'Grant nizomi', icon: <Icons.fileText size={12} />, href: 'https://docs.google.com/document/d/e/2PACX-1vQedNX-bqPPlrPgh2IvISdK2mYuNqQ4bYigcorbbwEXU8gJf6osRO4K1DWPjDQGIg/pub' },
            { l: 'Telegram',     icon: <Icons.send size={12} />,     href: '#' },
            { l: 'GitHub',       icon: <Icons.link size={12} />,     href: '#' },
          ].map((it, i) => (
            <a key={i} href={it.href}
              target={it.href !== '#' ? '_blank' : undefined}
              rel={it.href !== '#' ? 'noopener noreferrer' : undefined}
              onClick={it.href === '#' ? (e) => e.preventDefault() : undefined}
              style={{ color: T.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {it.icon}{it.l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
