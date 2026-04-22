import dayjs from 'dayjs';

const PAISE_MULTIPLIER = 100;

/**
 * Convert paise to rupees display format: ₹1,234.56
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / PAISE_MULTIPLIER;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert rupees input (number) to paise for storage.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_MULTIPLIER);
}

/**
 * Convert paise to rupees number.
 */
export function paiseToRupees(paise: number): number {
  return paise / PAISE_MULTIPLIER;
}

/**
 * Format date for display: 16/04/2026
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format datetime for display: 16/04/2026 02:30 PM
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return dayjs(date).format('DD/MM/YYYY hh:mm A');
}

/**
 * Get days remaining until a date. Negative means expired.
 */
export function daysUntil(date: string | Date): number {
  return dayjs(date).diff(dayjs(), 'day');
}

/**
 * Get status color for Ant Design tags.
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'orange',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
    UNPAID: 'default',
    ADVANCE_PAID: 'cyan',
    PARTIALLY_PAID: 'blue',
    FULLY_PAID: 'green',
    OVERDUE: 'red',
    SENT: 'green',
    FAILED: 'red',
    QUEUED: 'orange',
    DELIVERED: 'green',
  };
  return map[status] || 'default';
}

/**
 * Readable status label.
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Compute payment status from agreed fee and total paid.
 */
export function computePaymentStatus(agreedFee: number, totalPaid: number): string {
  if (totalPaid === 0) return 'UNPAID';
  if (totalPaid >= agreedFee) return 'FULLY_PAID';
  if (totalPaid > 0) return 'PARTIALLY_PAID';
  return 'UNPAID';
}
