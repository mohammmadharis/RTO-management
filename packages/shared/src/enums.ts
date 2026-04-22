// ─── User Roles ───
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

// ─── Customer Service Status ───
export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ─── Payment Types ───
export enum PaymentType {
  ADVANCE = 'ADVANCE',
  PARTIAL = 'PARTIAL',
  FINAL = 'FINAL',
  REFUND = 'REFUND',
}

// ─── Payment Methods ───
export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

// ─── Computed Payment Status ───
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  ADVANCE_PAID = 'ADVANCE_PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FULLY_PAID = 'FULLY_PAID',
  OVERPAID = 'OVERPAID',
}

// ─── Notification Channels ───
export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  BOTH = 'BOTH',
}

// ─── Notification Types ───
export enum NotificationType {
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_CLEARED = 'PAYMENT_CLEARED',
  EXPIRY_REMINDER = 'EXPIRY_REMINDER',
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  REGISTRATION_CONFIRMATION = 'REGISTRATION_CONFIRMATION',
  CUSTOM = 'CUSTOM',
}

// ─── Notification Delivery Status ───
export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

// ─── Reminder Types ───
export enum ReminderType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_DUE_WEEKLY = 'PAYMENT_DUE_WEEKLY',
  EXPIRY_30_DAY = 'EXPIRY_30_DAY',
  EXPIRY_15_DAY = 'EXPIRY_15_DAY',
  EXPIRY_7_DAY = 'EXPIRY_7_DAY',
  CUSTOM = 'CUSTOM',
}

// ─── Audit Actions ───
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
