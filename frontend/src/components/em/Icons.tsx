import type { CSSProperties, ReactNode } from 'react';

type P = { size?: number; stroke?: string; strokeWidth?: number; fill?: string; filled?: boolean; style?: CSSProperties };

const Svg = ({ size = 16, stroke = 'currentColor', strokeWidth = 2, fill = 'none', style, children }: P & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);

export const Icons = {
  search:     (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Svg>,
  chevdown:   (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6"/></Svg>,
  check:      (p: P) => <Svg {...p}><path d="M20 6 9 17l-5-5"/></Svg>,
  x:          (p: P) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12"/></Svg>,
  alert:      (p: P) => <Svg {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></Svg>,
  user:       (p: P) => <Svg {...p}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></Svg>,
  award:      (p: P) => <Svg {...p}><circle cx="12" cy="9" r="6"/><path d="m8.5 14-2 8 5.5-3 5.5 3-2-8"/></Svg>,
  trophy:     (p: P) => <Svg {...p}><path d="M6 9H4a2 2 0 0 1-2-2V4h4M18 9h2a2 2 0 0 0 2-2V4h-4M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M9 22h6M12 17v5"/></Svg>,
  medal:      (p: P) => <Svg {...p}><circle cx="12" cy="15" r="6"/><path d="M9.5 11 5.5 3l3.5 1L12 2l3 2 3.5-1L14.5 11"/></Svg>,
  bolt:       (p: P) => <Svg {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></Svg>,
  clock:      (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Svg>,
  shield:     (p: P) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
  graduation: (p: P) => <Svg {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5a8 4 0 0 0 12 0v-5M22 10v6"/></Svg>,
  cal:        (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></Svg>,
  fileText:   (p: P) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></Svg>,
  send:       (p: P) => <Svg {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></Svg>,
  link:       (p: P) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"/></Svg>,
  arrowRight: (p: P) => <Svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Svg>,
  mail:       (p: P) => <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></Svg>,
  lock:       (p: P) => <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></Svg>,
  eye:        (p: P) => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></Svg>,
  eyeOff:     (p: P) => <Svg {...p}><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.05-5.94M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/></Svg>,
  minus:      (p: P) => <Svg {...p}><path d="M5 12h14"/></Svg>,
  refresh:    (p: P) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></Svg>,
  briefcase:  (p: P) => <Svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></Svg>,
  checkCircle:(p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></Svg>,
  globe:      (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></Svg>,
  rocket:     (p: P) => <Svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></Svg>,
  flame:      (p: P) => <Svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c2.5 0 5-2 5-5 0-3-3-5-4-7 0-1 1-3 1-3s-7 2-7 9c0 0-1 0-2-2 0 0-1 4 4 5z"/></Svg>,
  star:       (p: P) => <Svg {...p}><polygon points="12 2 15 9 22 9.5 16.5 14.5 18.5 22 12 18 5.5 22 7.5 14.5 2 9.5 9 9"/></Svg>,
  files:      (p: P) => <Svg {...p}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h6M10 12h4M10 16h4"/></Svg>,
  sparkles:   (p: P) => <Svg {...p}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></Svg>,
};
