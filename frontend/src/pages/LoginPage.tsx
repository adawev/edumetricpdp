import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { T } from '@/lib/theme';
import { BrandMark, BrandWord, Field, Input, Button } from '@/components/em/Primitives';
import { Icons } from '@/components/em/Icons';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@pdp.uz');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const setAuth = useAuth(s => s.setAuth);
  const user = useAuth(s => s.user);
  const navigate = useNavigate();

  // Allaqachon login bo'lgan bo'lsa, panelga yo'naltirish (back tugmasi orqali qaytib kelganda ham)
  useEffect(() => {
    if (user) {
      const path = user.role === 'STUDENT' ? '/student/dashboard'
                 : user.role === 'MENTOR'  ? '/mentor/dashboard'
                 : '/admin/dashboard';
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('Email va parolni kiriting'); return; }
    if (password.length < 6) { setErr("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.token, data.user);
      toast.success('Tizimga kirildi', { description: 'Xush kelibsiz!' });
      navigate('/');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Kirishda xato');
    } finally {
      setLoading(false);
    }
  }

  const demoLogins = [
    { email: 'admin@pdp.uz',   role: 'Admin' },
    { email: 'mentor1@pdp.uz', role: 'Mentor' },
    { email: 'student1@pdp.uz', role: 'Talaba' },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: T.white }}>
      {/* LEFT FORM */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 60px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={32} />
          <BrandWord size="md" />
        </div>

        <div style={{ maxWidth: 380, width: '100%', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>Tizimga kirish</h1>
          <p style={{ margin: '6px 0 26px', color: T.textMuted, fontSize: 13.5 }}>PDP University grant tizimiga xush kelibsiz</p>

          <form onSubmit={submit}>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ism.familiya@pdp.uz" icon={<Icons.mail size={14} />} size="lg" />
            </Field>
            <Field label="Parol" htmlFor="pass" hint={<a href="#" onClick={e => e.preventDefault()} style={{ color: T.text, textDecoration: 'underline', textUnderlineOffset: 2 }}>unutdingizmi?</a>}>
              <Input id="pass" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                icon={<Icons.lock size={14} />} size="lg"
                iconRight={
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ background: 'transparent', border: 0, cursor: 'pointer', color: T.textMuted, padding: 4 }}>
                    {showPass ? <Icons.eyeOff size={14} /> : <Icons.eye size={14} />}
                  </button>
                } />
            </Field>
            {err && (
              <div style={{ background: T.redBg, border: '1px solid #fecaca', color: T.redText, padding: '8px 12px', borderRadius: 8, fontSize: 12.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.alert size={14} stroke={T.red} />{err}
              </div>
            )}
            <Button type="submit" size="lg" variant="primary" fullWidth disabled={loading}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: 999, animation: 'em-spin 0.7s linear infinite' }} />
                  Kirilmoqda...
                </span>
              ) : 'Kirish'}
            </Button>
          </form>

          <div style={{ marginTop: 18, padding: 12, background: T.bg, borderRadius: 8, border: `1px dashed ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6 }}>Demo hisoblar</div>
            <div style={{ fontSize: 12, color: T.textMuted, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {demoLogins.map(d => (
                <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword('password123'); }} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', color: T.text, fontSize: 12 }}>
                  <code style={{ background: T.white, padding: '1px 5px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 11 }}>{d.email}</code> — {d.role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: T.textSubtle, display: 'flex', justifyContent: 'space-between' }}>
          <span>© PDP University 2026</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link to="/public/rating" style={{ color: T.textSubtle, textDecoration: 'none' }}>Reyting</Link>
            <Link to="/public/about" style={{ color: T.textSubtle, textDecoration: 'none' }}>Grant haqida</Link>
          </span>
        </div>
      </div>

      {/* RIGHT BRAND PANEL */}
      <div style={{ background: T.slate900, color: '#fff', padding: '40px 50px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', border: '1px solid rgba(255,255,255,.18)', borderRadius: 999, alignSelf: 'flex-start', fontSize: 11.5, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: T.emerald, boxShadow: '0 0 0 4px rgba(16,185,129,.2)' }} />
            Grant tizimi · bahor 2026 ochiq
          </div>
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <h2 style={{ fontSize: 38, fontWeight: 600, margin: 0, letterSpacing: '-0.035em', lineHeight: 1.1, maxWidth: 460 }}>
              Adolatli, shaffof va avtomatik grant qarori.
            </h2>
            <p style={{ marginTop: 16, color: 'rgba(255,255,255,.7)', fontSize: 14.5, lineHeight: 1.6, maxWidth: 440 }}>
              Akademik ko'rsatkichlar, davomat, loyihalar, hakatonlar va tyutor bahosi — barchasi bitta nizom asosida hisoblanadi.
            </p>
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 480 }}>
              {[{ k: '248', l: 'Talaba' }, { k: '12', l: 'Mentor' }, { k: '6', l: 'Mezon' }].map((it, i) => (
                <div key={i} style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.12)' }}>
                  <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{it.k}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4, fontWeight: 600 }}>{it.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', display: 'flex', justifyContent: 'space-between' }}>
            <span>edumetric.pdp.uz</span>
            <span>v1.0 · build 2026.05</span>
          </div>
        </div>
      </div>
    </div>
  );
}
