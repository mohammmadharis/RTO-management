// ─── Pagination Defaults ───
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Reminder Thresholds (days before expiry) ───
export const EXPIRY_REMINDER_DAYS = [30, 15, 7] as const;

// ─── Payment Reminder Cooldown (days between reminders) ───
export const PAYMENT_REMINDER_COOLDOWN_DAYS = 7;

// ─── Overdue Threshold (days after start with outstanding balance) ───
export const OVERDUE_THRESHOLD_DAYS = 30;

// ─── Notification Retry ───
export const MAX_NOTIFICATION_RETRIES = 3;

// ─── Currency ───
export const CURRENCY_SYMBOL = '₹';
export const PAISE_MULTIPLIER = 100;

// ─── Format Helpers ───
export function paiseToRupees(paise: number): number {
  return paise / PAISE_MULTIPLIER;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_MULTIPLIER);
}

export function formatCurrency(paise: number): string {
  const rupees = paiseToRupees(paise);
  return `${CURRENCY_SYMBOL}${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ─── Date Format ───
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY hh:mm A';
