import {
  UserRole,
  ServiceStatus,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  ReminderType,
} from './enums';

// ─── User ───
export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Customer ───
export interface ICustomer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  dlNumber?: string | null;
  aadharNumber?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: IUser;
  services?: ICustomerService[];
  createdAt: string;
  updatedAt: string;
}

// ─── Service (Master Catalog) ───
export interface IService {
  id: string;
  name: string;
  description?: string | null;
  defaultFee: number; // in paise
  hasExpiry: boolean;
  defaultValidityDays?: number | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Customer Service (Instance) ───
export interface ICustomerService {
  id: string;
  customerId: string;
  customer?: ICustomer;
  serviceId: string;
  service?: IService;
  status: ServiceStatus;
  agreedFee: number; // in paise
  startDate: string;
  completionDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: IUser;
  createdById: string;
  createdBy?: IUser;
  payments?: IPayment[];
  totalPaid?: number;
  dueAmount?: number;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ───
export interface IPayment {
  id: string;
  customerServiceId: string;
  customerService?: ICustomerService;
  amount: number; // in paise
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string | null;
  receivedById: string;
  receivedBy?: IUser;
  notes?: string | null;
  createdAt: string;
}

// ─── Notification ───
export interface INotification {
  id: string;
  customerId: string;
  customer?: ICustomer;
  customerServiceId?: string | null;
  customerService?: ICustomerService;
  channel: NotificationChannel;
  type: NotificationType;
  templateName?: string | null;
  messageBody: string;
  status: NotificationStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

// ─── Reminder ───
export interface IReminder {
  id: string;
  customerServiceId: string;
  customerService?: ICustomerService;
  reminderType: ReminderType;
  scheduledDate: string;
  isSent: boolean;
  sentAt?: string | null;
  notificationId?: string | null;
  notification?: INotification;
  createdAt: string;
}

// ─── Dashboard Summary ───
export interface IDashboardSummary {
  totalCustomers: number;
  activeServices: number;
  monthlyRevenue: number;
  outstandingDues: number;
  expiringServices: ICustomerService[];
  overduePayments: ICustomerService[];
  recentActivity: IActivityItem[];
  revenueChart: IRevenueChartItem[];
  serviceDistribution: IServiceDistItem[];
}

export interface IActivityItem {
  type: 'PAYMENT' | 'SERVICE';
  timestamp: string;
  customerName: string;
  detail: string;
  amount?: number;
}

export interface IRevenueChartItem {
  month: string;
  revenue: number;
}

export interface IServiceDistItem {
  name: string;
  count: number;
}

// ─── API Response Wrappers ───
export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Auth ───
export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: IUser;
  accessToken: string;
}
