import { Prisma, ServiceStatus } from '@prisma/client';
import { prisma } from '../config';
import { AppError } from '../middleware';

interface CreateCustomerServiceInput {
  customerId: string;
  serviceId: string;
  agreedFee: number;
  startDate: string;
  expiryDate?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  createdById: string;
}

interface UpdateCustomerServiceInput {
  status?: ServiceStatus;
  agreedFee?: number;
  completionDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
}

interface CSFilters {
  customerId?: string;
  serviceId?: string;
  status?: ServiceStatus;
  assignedToId?: string;
  expiringWithinDays?: number;
  page: number;
  limit: number;
}

export class CustomerServiceService {
  static async list(filters: CSFilters) {
    const { page, limit, customerId, serviceId, status, assignedToId, expiringWithinDays } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerServiceWhereInput = {};
    if (customerId) where.customerId = customerId;
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      where.expiryDate = { lte: futureDate, gte: new Date() };
      where.status = 'COMPLETED';
    }

    const [items, total] = await Promise.all([
      prisma.customerService.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, vehicleNumber: true } },
          service: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customerService.count({ where }),
    ]);

    const enriched = items.map((cs) => {
      const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...cs, totalPaid, dueAmount: cs.agreedFee - totalPaid };
    });

    return {
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const cs = await prisma.customerService.findUnique({
      where: { id },
      include: {
        customer: true,
        service: true,
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        payments: {
          include: { receivedBy: { select: { id: true, name: true } } },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!cs) throw new AppError('Customer service not found', 404);

    const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
    return { ...cs, totalPaid, dueAmount: cs.agreedFee - totalPaid };
  }

  static async create(data: CreateCustomerServiceInput) {
    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    // Validate service exists
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new AppError('Service not found', 404);

    // Compute expiry date from service defaults if not provided
    let expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (!expiryDate && service.hasExpiry && service.defaultValidityDays) {
      expiryDate = new Date(data.startDate);
      expiryDate.setDate(expiryDate.getDate() + service.defaultValidityDays);
    }

    return prisma.customerService.create({
      data: {
        customerId: data.customerId,
        serviceId: data.serviceId,
        agreedFee: data.agreedFee,
        startDate: new Date(data.startDate),
        expiryDate,
        notes: data.notes,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
      },
    });
  }

  static async update(id: string, data: UpdateCustomerServiceInput) {
    await this.getById(id);

    const updateData: Prisma.CustomerServiceUpdateInput = {};
    if (data.status) updateData.status = data.status;
    if (data.agreedFee !== undefined) updateData.agreedFee = data.agreedFee;
    if (data.completionDate !== undefined)
      updateData.completionDate = data.completionDate ? new Date(data.completionDate) : null;
    if (data.expiryDate !== undefined)
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.assignedToId !== undefined)
      updateData.assignedTo = data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : { disconnect: true };

    return prisma.customerService.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  static async getExpiring(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const items = await prisma.customerService.findMany({
      where: {
        expiryDate: { lte: futureDate, gte: new Date() },
        status: 'COMPLETED',
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, vehicleNumber: true } },
        service: { select: { id: true, name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return items.map((cs) => ({
      ...cs,
      daysRemaining: Math.ceil(
        (new Date(cs.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
