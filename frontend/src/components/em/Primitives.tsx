import { useEffect, useMemo, useState, forwardRef } from 'react';
import type { CSSProperties, ReactNode, InputHTMLAttributes } from 'react';
import { T } from '@/lib/theme';
import { Icons } from './Icons';

// ===== usePagination hook =====
export function usePagination<T>(items: T[], pageSize: number, deps: unknown[] = []) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => { setPage(1); /* reset on filter change */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return {
    page, setPage, pageCount, pageSize, total,
    pageItems,
    startIndex: (page - 1) * pageSize,
  };
}

// ===== Pagination component =====
type PaginationProps = {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  total?: number;
  pageSize?: number;
  style?: CSSProperties;
};
export const Pagination = ({ page, pageCount, onChange, total, pageSize, style }: PaginationProps) => {
  if (pageCount <= 1) return null;

  const go = (p: number) => onChange(Math.max(1, Math.min(pageCount, p)));

  // Build compact page list: 1 … p-1 p p+1 … last
  const pages: (number | '…')[] = [];
  const push = (v: number | '…') => { if (pages[pages.length - 1] !== v) pages.push(v); };
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || (i >= page - 1 && i <= page + 1)) push(i);
    else if (i < page - 1 || i > page + 1) push('…');
  }

  const btn = (active: boolean, disabled: boolean): CSSProperties => ({
    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8,
    border: `1px solid ${active ? T.slate900 : T.border}`,
    background: active ? T.slate900 : T.white,
    color: active ? '#fff' : (disabled ? T.textSubtle : T.text),
    fontSize: 12.5, fontWeight: active ? 600 : 500,
    fontVariantNumeric: 'tabular-nums',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontFamily: 'inherit', transition: 'background .12s, border-color .12s',
  });

  const showSummary = typeof total === 'number' && typeof pageSize === 'number';
  const from = showSummary ? (total === 0 ? 0 : (page - 1) * pageSize! + 1) : 0;
  const to = showSummary ? Math.min(total!, page * pageSize!) : 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap', padding: '12px 16px',
      borderTop: `1px solid ${T.border}`, background: T.white,
      ...style,
    }}>
      {showSummary ? (
        <div style={{ fontSize: 12, color: T.textMuted, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 600, color: T.text }}>{from}–{to}</span> / {total}
        </div>
      ) : <span />}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => go(page - 1)} disabled={page <= 1} style={btn(false, page <= 1)} aria-label="Oldingi">
          <Icons.chevronLeft size={14} />
        </button>
        {pages.map((p, i) => p === '…' ? (
          <span key={`e${i}`} style={{ padding: '0 4px', color: T.textSubtle, fontSize: 13 }}>…</span>
        ) : (
          <button key={p} onClick={() => go(p)} style={btn(p === page, false)}>{p}</button>
        ))}
        <button onClick={() => go(page + 1)} disabled={page >= pageCount} style={btn(false, page >= pageCount)} aria-label="Keyingi">
          <Icons.chevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ===== BrandMark + BrandWord =====
export const BrandMark = ({ size = 28 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.25),
    background: T.slate900, color: '#fff', display: 'grid', placeItems: 'center',
    fontWeight: 700, fontSize: Math.round(size * 0.46), letterSpacing: '-0.04em',
  }}>E</div>
);

export const BrandWord = ({ size = 'md' as 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: { fs: 14, sub: 9.5 }, md: { fs: 15.5, sub: 10 }, lg: { fs: 20, sub: 11 } };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontWeight: 600, letterSpacing: '-0.015em', fontSize: s.fs, lineHeight: 1 }}>EduMetric</span>
      <span style={{ fontSize: s.sub, color: T.textSubtle, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 2, fontWeight: 500 }}>PDP University</span>
    </div>
  );
};

// ===== Button =====
type ButtonProps = {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconRight?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
};
export const Button = ({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, disabled, style, type, fullWidth }: ButtonProps) => {
  const sizes: Record<string, any> = {
    xs: { p: '4px 8px',  fs: 11.5, h: 26, gap: 4 },
    sm: { p: '6px 12px', fs: 12.5, h: 32, gap: 6 },
    md: { p: '8px 16px', fs: 13.5, h: 38, gap: 7 },
    lg: { p: '10px 20px', fs: 14.5, h: 44, gap: 8 },
  };
  const s = sizes[size];
  const variants: Record<string, any> = {
    primary:  { bg: T.slate900,    fg: '#fff',     bd: T.slate900,    hov: T.slate800 },
    secondary:{ bg: T.bgSubtle,    fg: T.text,     bd: T.bgSubtle,    hov: '#e2e8f0' },
    outline:  { bg: T.white,       fg: T.text,     bd: T.border,      hov: T.bgSubtle },
    ghost:    { bg: 'transparent', fg: T.text,     bd: 'transparent', hov: T.bgSubtle },
    success:  { bg: T.emerald,     fg: '#fff',     bd: T.emerald,     hov: T.emeraldDeep },
    danger:   { bg: T.red,         fg: '#fff',     bd: T.red,         hov: T.redDeep },
  };
  const v = variants[variant];
  const [hov, setHov] = useState(false);
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        padding: s.p, height: s.h, width: fullWidth ? '100%' : undefined,
        background: disabled ? T.bgSubtle : (hov ? v.hov : v.bg),
        color: disabled ? T.textSubtle : v.fg,
        border: `1px solid ${disabled ? T.border : (hov ? v.hov : v.bd)}`,
        borderRadius: 8, fontSize: s.fs, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', transition: 'all .12s', fontFamily: 'inherit',
        ...style,
      }}>
      {icon}{children}{iconRight}
    </button>
  );
};

// ===== Card =====
export const Card = ({ children, style, padding, hoverable }: { children: ReactNode; style?: CSSProperties; padding?: number; hoverable?: boolean }) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: 12, display: 'flex', flexDirection: 'column',
    transition: 'border-color .15s, box-shadow .15s',
    cursor: hoverable ? 'pointer' : undefined,
    ...style,
  }}>
    <div style={{ padding: padding ?? 18, flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);

// ===== Input =====
export const Input = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { icon?: ReactNode; iconRight?: ReactNode; size?: 'sm' | 'md' | 'lg'; error?: boolean }>(
  ({ icon, iconRight, error, style, size: inputSize = 'md', ...rest }, ref) => {
    const sizes: Record<string, any> = { sm: { h: 30, fs: 12.5 }, md: { h: 36, fs: 13.5 }, lg: { h: 42, fs: 14 } };
    const sz = sizes[inputSize];
    return (
      <div style={{ position: 'relative', width: '100%', ...style }}>
        {icon && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textSubtle, pointerEvents: 'none' }}>{icon}</span>}
        <input ref={ref} {...rest} style={{
          width: '100%', height: sz.h,
          padding: `0 ${iconRight ? 32 : 12}px 0 ${icon ? 32 : 12}px`,
          border: `1px solid ${error ? T.red : T.border}`,
          borderRadius: 8, fontSize: sz.fs,
          background: T.white, color: T.text, outline: 'none',
          fontFamily: 'inherit', transition: 'border-color .12s, box-shadow .12s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = T.slate900; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,23,42,.06)'; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? T.red : T.border; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {iconRight && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T.textSubtle }}>{iconRight}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ===== Select =====
export const Select = ({ value, onChange, options, size = 'md' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; size?: 'sm' | 'md' }) => {
  const sizes: Record<string, any> = { sm: { h: 30, fs: 12.5 }, md: { h: 36, fs: 13.5 } };
  const sz = sizes[size];
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: '100%', height: sz.h, padding: '0 32px 0 12px',
        border: `1px solid ${T.border}`, borderRadius: 8, fontSize: sz.fs,
        background: T.white, color: T.text, appearance: 'none', WebkitAppearance: 'none',
        cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icons.chevdown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: T.textSubtle, pointerEvents: 'none' }} />
    </div>
  );
};

// ===== Field + Label =====
export const Field = ({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) => (
  <div style={{ marginBottom: 14 }}>
    <label htmlFor={htmlFor} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 500, color: T.text, marginBottom: 6 }}>
      <span>{label}</span>
      {hint && <span style={{ fontSize: 11.5 }}>{hint}</span>}
    </label>
    {children}
  </div>
);

// ===== Avatar =====
export const Avatar = ({ name, color, size = 32, style }: { name: string; color?: string; size?: number; style?: CSSProperties }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: color || '#fde68a',
      display: 'grid', placeItems: 'center', fontWeight: 600,
      fontSize: Math.round(size * 0.38), color: '#7c2d12', flexShrink: 0,
      ...style,
    }}>{initials}</div>
  );
};

// ===== Tabs =====
type TabItem = { id: string; label: string; count?: number };
export const Tabs = ({ value, onChange, items, style }: { value: string; onChange: (v: string) => void; items: TabItem[]; style?: CSSProperties }) => (
  <div role="tablist" style={{
    display: 'inline-flex', padding: 3, borderRadius: 9,
    background: T.bgSubtle, gap: 2, ...style,
  }}>
    {items.map(it => {
      const isActive = it.id === value;
      return (
        <button key={it.id} role="tab" aria-selected={isActive} onClick={() => onChange(it.id)} style={{
          padding: '6px 12px', borderRadius: 7, border: 0,
          background: isActive ? T.white : 'transparent',
          color: isActive ? T.text : T.textMuted,
          fontWeight: isActive ? 500 : 400, fontSize: 12.5,
          cursor: 'pointer', transition: 'all .12s', fontFamily: 'inherit',
          boxShadow: isActive ? '0 1px 2px rgba(15,23,42,.04)' : 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {it.label}
          {it.count != null && (
            <span style={{
              fontSize: 10.5, padding: '0 5px', borderRadius: 999,
              background: T.bgSubtle, color: T.textMuted,
              fontVariantNumeric: 'tabular-nums', minWidth: 16, height: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{it.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

// ===== Tooltip (light, hover only, no portal) =====
export const Tooltip = ({ children, content }: { children: ReactNode; content: string }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, padding: '5px 8px', background: T.slate900, color: '#fff',
          fontSize: 11.5, borderRadius: 6, whiteSpace: 'nowrap', zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(15,23,42,.2)',
        }}>{content}</span>
      )}
    </span>
  );
};

// ===== Skeleton =====
export const Skeleton = ({ h = 14, r = 6, w = '100%' as string | number, style }: { h?: number; r?: number; w?: string | number; style?: CSSProperties }) => (
  <div className="em-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

// ===== Dialog =====
export const Dialog = ({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title?: string; description?: string; children?: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const widths: Record<string, number> = { sm: 380, md: 520, lg: 720 };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      animation: 'em-fade-in .15s ease-out',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: widths[size], maxWidth: 'calc(100% - 32px)',
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        background: T.white, borderRadius: 12,
        boxShadow: '0 20px 60px rgba(15,23,42,.25), 0 0 0 1px rgba(15,23,42,.05)',
        animation: 'em-pop-in .18s ease-out', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>}
            {description && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{description}</div>}
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, border: 0, background: 'transparent',
            color: T.textMuted, cursor: 'pointer', borderRadius: 6, display: 'grid', placeItems: 'center',
          }}><Icons.x size={16} /></button>
        </div>
        <div style={{ padding: '14px 22px 4px' }}>{children}</div>
        {footer && (
          <div style={{ padding: '16px 22px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{footer}</div>
        )}
      </div>
    </div>
  );
};
