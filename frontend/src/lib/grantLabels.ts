export type GrantStatus = 'GRANTED' | 'NOT_GRANTED' | 'PENDING' | 'UNKNOWN';
export type GrantReason = 'OK' | 'ACADEMIC_FAIL' | 'LOW_SCORE' | 'PAYMENT_OVERDUE' | 'GRANTED_OK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

const reasonLabels: Record<GrantReason, { text: string; cls: string }> = {
  GRANTED_OK: { text: 'Grant berildi', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  OK: { text: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACADEMIC_FAIL: { text: 'Akademik past', cls: 'bg-red-100 text-red-700 border-red-200' },
  LOW_SCORE: { text: 'Ball past', cls: 'bg-red-100 text-red-700 border-red-200' },
  PAYMENT_OVERDUE: { text: "To'lov muddati", cls: 'bg-red-100 text-red-700 border-red-200' },
};

const statusFallback: Record<GrantStatus, { text: string; cls: string }> = {
  GRANTED: { text: 'Grant berildi', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PENDING: { text: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  NOT_GRANTED: { text: "Grant yo'q", cls: 'bg-red-100 text-red-700 border-red-200' },
  UNKNOWN: { text: 'Aniqlanmagan', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

/** Aniq sabab bilan badge: reason birinchi, bo'lmasa status'ga qaytamiz. */
export function statusBadge(status: GrantStatus, reason?: GrantReason | null) {
  if (reason && reasonLabels[reason]) return reasonLabels[reason];
  return statusFallback[status];
}

const riskMap: Record<RiskLevel, { text: string; cls: string }> = {
  LOW: { text: 'Past', cls: 'bg-emerald-500 text-white' },
  MEDIUM: { text: "O'rta", cls: 'bg-amber-500 text-white' },
  HIGH: { text: 'Yuqori', cls: 'bg-red-500 text-white' },
};

export function riskBadge(risk: RiskLevel) {
  return riskMap[risk];
}
