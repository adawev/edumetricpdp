export const T = {
  white:       '#ffffff',
  bg:          '#f8fafc',
  bgSubtle:    '#f1f5f9',
  border:      '#e2e8f0',
  borderStrong:'#cbd5e1',
  text:        '#0f172a',
  textMuted:   '#64748b',
  textSubtle:  '#94a3b8',
  emerald:     '#10b981',
  emeraldDeep: '#059669',
  emeraldBg:   '#ecfdf5',
  emeraldText: '#065f46',
  amber:       '#f59e0b',
  amberDeep:   '#d97706',
  amberBg:     '#fffbeb',
  amberText:   '#92400e',
  red:         '#ef4444',
  redDeep:     '#dc2626',
  redBg:       '#fef2f2',
  redText:     '#991b1b',
  blue:        '#3b82f6',
  blueBg:      '#eff6ff',
  blueText:    '#1e40af',
  slate900:    '#0f172a',
  slate800:    '#1e293b',
  slate100:    '#f1f5f9',
};

export const GRANT_REASON_LABEL_SHORT: Record<string, string> = {
  OK:               'Kutilmoqda',
  GRANTED_OK:       'Grant berildi',
  PENDING:          'Kutilmoqda',
  ACADEMIC_FAIL:    'Akademik past',
  LOW_SCORE:        'Ball past',
  PAYMENT_OVERDUE:  "To'lov muddati",
};

export const RISK_LABEL_SHORT: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori',
};

export const RISK_COLOR: Record<string, { bg: string; fg: string }> = {
  LOW:    { bg: '#10b981', fg: '#ffffff' },
  MEDIUM: { bg: '#f59e0b', fg: '#ffffff' },
  HIGH:   { bg: '#ef4444', fg: '#ffffff' },
};
