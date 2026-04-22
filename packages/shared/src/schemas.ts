import { z } from 'zod';
import { UserRole, ServiceStatus, PaymentType, PaymentMethod, NotificationChannel, NotificationType } from './enums';

// ─── Auth ───
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── User ───
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

// ─── Customer ───
const customerBaseFields = {
  name: z.string().min(2, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  whatsappNumber: z.string().max(15).optional().nullable(),
  alternatePhone: z.string().max(15).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  pincode: z.string().max(6).optional().nullable(),
  vehicleNumber: z.string().max(20).optional().nullable(),
  vehicleType: z.string().max(100).optional().nullable(),
  vehicleCategory: z.string().max(100).optional().nullable(),
  vehicleBrand: z.string().max(50).optional().nullable(),
  vehicleModel: z.string().max(50).optional().nullable(),
  manufacturingYear: z.number().int().min(1900).max(2030).optional().nullable(),
  fuelType: z.string().max(30).optional().nullable(),
  engineNumber: z.string().max(50).optional().nullable(),
  chassisNumber: z.string().max(50).optional().nullable(),
  vehicleColour: z.string().max(30).optional().nullable(),
  dlNumber: z.string().max(30).optional().nullable(),
  aadharNumber: z.string().max(12).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
};

// Optional service assignment during customer creation
const serviceAssignmentSchema = z.object({
  serviceId: z.string().uuid(),
  agreedFee: z.number().int().min(0, 'Fee must be non-negative'),
  startDate: z.string(),
  expiryDate: z.string().optional().nullable(),
  reminderDays: z.number().int().min(1).max(90).optional().default(30),
  dueDate: z.string().optional().nullable(),
  documentNumber: z.string().max(100).optional().nullable(),
  issuingAuthority: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// Optional initial payment during customer creation
const initialPaymentSchema = z.object({
  amount: z.number().int().min(1, 'Amount must be positive'),
  paymentType: z.nativeEnum(PaymentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createCustomerSchema = z.object({
  ...customerBaseFields,
  // Optional: assign a service during creation
  service: serviceAssignmentSchema.optional().nullable(),
  // Optional: record initial payment (requires service)
  payment: initialPaymentSchema.optional().nullable(),
});

export const updateCustomerSchema = z.object(customerBaseFields).partial();

// ─── Service (Master) ───
export const createServiceSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  defaultFee: z.number().int().min(0, 'Fee must be non-negative'),
  hasExpiry: z.boolean(),
  defaultValidityDays: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// ─── Customer Service ───
export const createCustomerServiceSchema = z.object({
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  agreedFee: z.number().int().min(0, 'Fee must be non-negative'),
  startDate: z.string(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateCustomerServiceSchema = z.object({
  status: z.nativeEnum(ServiceStatus).optional(),
  agreedFee: z.number().int().min(0).optional(),
  completionDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// ─── Payment ───
export const createPaymentSchema = z.object({
  customerServiceId: z.string().uuid(),
  amount: z.number().int().min(1, 'Amount must be positive'),
  paymentType: z.nativeEnum(PaymentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string(),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ─── Notification ───
export const sendNotificationSchema = z.object({
  customerId: z.string().uuid(),
  customerServiceId: z.string().uuid().optional().nullable(),
  channel: z.nativeEnum(NotificationChannel),
  type: z.nativeEnum(NotificationType),
  messageBody: z.string().min(1, 'Message is required').max(1000),
});

// ─── Query Filters ───
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

export const customerFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'phone']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const paymentFilterSchema = paginationSchema.extend({
  customerId: z.string().uuid().optional(),
  customerServiceId: z.string().uuid().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const customerServiceFilterSchema = paginationSchema.extend({
  customerId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  assignedToId: z.string().uuid().optional(),
  expiringWithinDays: z.coerce.number().int().min(1).optional(),
});
