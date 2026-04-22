import { Prisma, PaymentType, PaymentMethod } from '@prisma/client';
import { prisma, logger } from '../config';
import { AppError } from '../middleware';
import { addNotificationJob } from '../queues';

interface CreatePaymentInput {
  customerServiceId: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string | null;
  notes?: string | null;
  receivedById: string;
}

interface PaymentFilters {
  customerId?: string;
  customerServiceId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export class PaymentService {
  static async list(filters: PaymentFilters) {
    const { page, limit, customerId, customerServiceId, paymentMethod, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (customerServiceId) where.customerServiceId = customerServiceId;
    if (customerId) where.customerService = { customerId };
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customerService: {
            include: {
              customer: { select: { id: true, name: true, phone: true } },
              service: { select: { id: true, name: true } },
            },
          },
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async create(data: CreatePaymentInput) {
    // Validate customer service exists
    const cs = await prisma.customerService.findUnique({
      where: { id: data.customerServiceId },
      include: { payments: { select: { amount: true } } },
    });

    if (!cs) throw new AppError('Customer service not found', 404);

    if (cs.status === 'CANCELLED') {
      throw new AppError('Cannot add payment to a cancelled service', 400);
    }

    const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
    if (data.paymentType !== 'REFUND' && totalPaid + data.amount > cs.agreedFee * 1.1) {
      throw new AppError(
        'Payment amount would exceed agreed fee by more than 10%. Please verify.',
        400,
      );
    }

    const payment = await prisma.payment.create({
      data: {
        customerServiceId: data.customerServiceId,
        amount: data.amount,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        receivedById: data.receivedById,
      },
      include: {
        customerService: {
          include: {
            customer: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
        receivedBy: { select: { id: true, name: true } },
      },
    });

    // Auto-update status to COMPLETED if fully paid and still IN_PROGRESS
    const newTotal = totalPaid + data.amount;
    if (newTotal >= cs.agreedFee && cs.status === 'IN_PROGRESS') {
      await prisma.customerService.update({
        where: { id: data.customerServiceId },
        data: { status: 'COMPLETED', completionDate: new Date() },
      });

      // Send payment cleared notification via queue
      try {
        const customer = payment.customerService.customer;
        const serviceName = payment.customerService.service.name;
        const paidRupees = (newTotal / 100).toLocaleString('en-IN');
        const message =
          `Dear ${customer.name}, your full payment of ₹${paidRupees} for ${serviceName} ` +
          `has been received. Your account is now clear. Thank you! - RTO Patel Service`;
        await addNotificationJob({
          customerId: cs.customerId,
          customerServiceId: cs.id,
          channel: 'BOTH',
          type: 'PAYMENT_CLEARED',
          messageBody: message,
        });
        logger.info(`[PAYMENT] Payment cleared job queued: ${customer.name} — ${serviceName}`);
      } catch (err) {
        logger.error('[PAYMENT] Failed to enqueue payment cleared notification', err);
      }
    }

    // Auto-update status from PENDING to IN_PROGRESS on first payment
    if (cs.status === 'PENDING' && data.paymentType !== 'REFUND') {
      await prisma.customerService.update({
        where: { id: data.customerServiceId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return payment;
  }

  static async getOverdue() {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 30);

    const items = await prisma.customerService.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        startDate: { lte: overdueDate },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, vehicleNumber: true } },
        service: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return items
      .map((cs) => {
        const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
        const dueAmount = cs.agreedFee - totalPaid;
        return { ...cs, totalPaid, dueAmount };
      })
      .filter((cs) => cs.dueAmount > 0);
  }

  static async getSummary(dateFrom?: string, dateTo?: string) {
    const where: Prisma.PaymentWhereInput = {};
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = new Date(dateFrom);
      if (dateTo) where.paymentDate.lte = new Date(dateTo);
    }

    const result = await prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      totalCollected: result._sum.amount || 0,
      totalTransactions: result._count,
    };
  }
}
