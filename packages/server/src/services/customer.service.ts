import { Prisma } from '@prisma/client';
import { prisma } from '../config';
import { AppError } from '../middleware';
import { logger } from '../config';

interface CreateCustomerInput {
  name: string;
  phone: string;
  whatsappNumber?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  vehicleCategory?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  manufacturingYear?: number | null;
  fuelType?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  vehicleColour?: string | null;
  dlNumber?: string | null;
  aadharNumber?: string | null;
  notes?: string | null;
  createdById: string;
  // Optional service assignment
  service?: {
    serviceId: string;
    agreedFee: number;
    startDate: string;
    expiryDate?: string | null;
    reminderDays?: number;
    dueDate?: string | null;
    documentNumber?: string | null;
    issuingAuthority?: string | null;
    notes?: string | null;
    assignedToId?: string | null;
  } | null;
  // Optional initial payment (requires service)
  payment?: {
    amount: number;
    paymentType: string;
    paymentMethod: string;
    paymentDate: string;
    referenceNumber?: string | null;
    notes?: string | null;
  } | null;
}

// ─── WhatsApp message templates ───
function buildConfirmationMessage(data: {
  customerName: string;
  serviceName: string;
  vehicleNumber?: string | null;
  expiryDate?: string | null;
  agreedFee: number;
  advancePaid: number;
}) {
  const balance = data.agreedFee - data.advancePaid;
  const lines = [
    `Dear ${data.customerName},`,
    ``,
    `Your ${data.serviceName} service has been registered with us.`,
    ``,
  ];
  if (data.vehicleNumber) lines.push(`Vehicle  : ${data.vehicleNumber}`);
  lines.push(`Service  : ${data.serviceName}`);
  if (data.expiryDate) lines.push(`Expiry   : ${data.expiryDate}`);
  lines.push(`Amount   : ₹${(data.agreedFee / 100).toLocaleString('en-IN')}`);
  if (data.advancePaid > 0) {
    lines.push(`Paid     : ₹${(data.advancePaid / 100).toLocaleString('en-IN')}`);
    lines.push(`Balance  : ₹${(balance / 100).toLocaleString('en-IN')}`);
  }
  lines.push(``);
  lines.push(`Thank you!`);
  lines.push(`— RTO Patel Service`);
  return lines.join('\n');
}

// Generate next customer code: CUS-001, CUS-002, etc.
async function generateCustomerCode(tx: any): Promise<string> {
  const lastCustomer = await tx.customer.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { customerCode: true },
  });
  let nextNum = 1;
  if (lastCustomer?.customerCode) {
    const match = lastCustomer.customerCode.match(/CUS-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `CUS-${String(nextNum).padStart(3, '0')}`;
}

interface CustomerFilters {
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}

export class CustomerService {
  static async list(filters: CustomerFilters) {
    const { search, page, limit, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerCode: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          services: {
            include: {
              service: { select: { id: true, name: true } },
              payments: { select: { amount: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Compute payment status for each customer service
    const enriched = customers.map((c) => ({
      ...c,
      services: c.services.map((cs) => {
        const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
        return {
          ...cs,
          totalPaid,
          dueAmount: cs.agreedFee - totalPaid,
        };
      }),
    }));

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        services: {
          include: {
            service: true,
            assignedTo: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            payments: {
              include: { receivedBy: { select: { id: true, name: true } } },
              orderBy: { paymentDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);

    // Enrich with computed payment data
    const enriched = {
      ...customer,
      services: customer.services.map((cs) => {
        const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
        const dueAmount = cs.agreedFee - totalPaid;
        let paymentStatus = 'UNPAID';
        if (totalPaid === 0) paymentStatus = 'UNPAID';
        else if (totalPaid >= cs.agreedFee) paymentStatus = 'FULLY_PAID';
        else if (cs.payments.some((p) => p.paymentType === 'ADVANCE'))
          paymentStatus = 'ADVANCE_PAID';
        else paymentStatus = 'PARTIALLY_PAID';

        return { ...cs, totalPaid, dueAmount, paymentStatus };
      }),
    };

    return enriched;
  }

  static async create(data: CreateCustomerInput) {
    const { service: serviceData, payment: paymentData, ...customerData } = data;

    // If payment is provided, service must also be provided
    if (paymentData && !serviceData) {
      throw new AppError('Cannot record payment without assigning a service', 400);
    }

    return prisma.$transaction(async (tx: any) => {
      // 1. Generate customer code
      const customerCode = await generateCustomerCode(tx);

      // Use phone as whatsapp if not provided
      const whatsappNumber = customerData.whatsappNumber || customerData.phone;

      // 2. Create the customer
      const customer = await tx.customer.create({
        data: {
          customerCode,
          name: customerData.name,
          phone: customerData.phone,
          whatsappNumber,
          alternatePhone: customerData.alternatePhone,
          email: customerData.email,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          pincode: customerData.pincode,
          vehicleNumber: customerData.vehicleNumber,
          vehicleType: customerData.vehicleType,
          vehicleCategory: customerData.vehicleCategory,
          vehicleBrand: customerData.vehicleBrand,
          vehicleModel: customerData.vehicleModel,
          manufacturingYear: customerData.manufacturingYear,
          fuelType: customerData.fuelType,
          engineNumber: customerData.engineNumber,
          chassisNumber: customerData.chassisNumber,
          vehicleColour: customerData.vehicleColour,
          dlNumber: customerData.dlNumber,
          aadharNumber: customerData.aadharNumber,
          notes: customerData.notes,
          createdById: customerData.createdById,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      let customerService: any = null;
      let payment: any = null;
      let confirmationNotification: any = null;

      // 3. Assign service if provided
      if (serviceData) {
        const service = await tx.service.findUnique({ where: { id: serviceData.serviceId } });
        if (!service) throw new AppError('Service not found', 404);

        // Compute expiry date from service defaults if not provided
        let expiryDate = serviceData.expiryDate ? new Date(serviceData.expiryDate) : null;
        if (!expiryDate && service.hasExpiry && service.defaultValidityDays) {
          expiryDate = new Date(serviceData.startDate);
          expiryDate.setDate(expiryDate.getDate() + service.defaultValidityDays);
        }

        const reminderDays = serviceData.reminderDays || 30;
        const dueDate = serviceData.dueDate ? new Date(serviceData.dueDate) : null;

        customerService = await tx.customerService.create({
          data: {
            customerId: customer.id,
            serviceId: serviceData.serviceId,
            agreedFee: serviceData.agreedFee,
            startDate: new Date(serviceData.startDate),
            expiryDate,
            reminderDays,
            dueDate,
            documentNumber: serviceData.documentNumber,
            issuingAuthority: serviceData.issuingAuthority,
            notes: serviceData.notes,
            assignedToId: serviceData.assignedToId,
            createdById: customerData.createdById,
          },
          include: {
            service: { select: { id: true, name: true } },
          },
        });

        // 4. Record initial payment if provided
        let advancePaid = 0;
        if (paymentData) {
          payment = await tx.payment.create({
            data: {
              customerServiceId: customerService.id,
              amount: paymentData.amount,
              paymentType: paymentData.paymentType as any,
              paymentMethod: paymentData.paymentMethod as any,
              paymentDate: new Date(paymentData.paymentDate),
              referenceNumber: paymentData.referenceNumber,
              notes: paymentData.notes,
              receivedById: customerData.createdById,
            },
          });
          advancePaid = paymentData.amount;

          // Auto-update status based on payment
          if (paymentData.amount >= serviceData.agreedFee) {
            await tx.customerService.update({
              where: { id: customerService.id },
              data: { status: 'COMPLETED', completionDate: new Date() },
            });
          } else {
            await tx.customerService.update({
              where: { id: customerService.id },
              data: { status: 'IN_PROGRESS' },
            });
          }
        }

        // 5. Auto-send WhatsApp confirmation message
        const expiryStr = expiryDate
          ? expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          : null;

        const messageBody = buildConfirmationMessage({
          customerName: customer.name,
          serviceName: service.name,
          vehicleNumber: customer.vehicleNumber,
          expiryDate: expiryStr,
          agreedFee: serviceData.agreedFee,
          advancePaid,
        });

        confirmationNotification = await tx.notification.create({
          data: {
            customerId: customer.id,
            customerServiceId: customerService.id,
            channel: 'WHATSAPP',
            type: 'REGISTRATION_CONFIRMATION',
            messageBody,
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        logger.info(`Registration confirmation sent to ${customer.name} (${customerCode})`);

        // 6. Auto-schedule expiry reminders
        if (expiryDate) {
          const remindersToCreate: any[] = [];

          // Based on reminderDays setting
          if (reminderDays >= 30) {
            const d30 = new Date(expiryDate);
            d30.setDate(d30.getDate() - 30);
            if (d30 > new Date()) {
              remindersToCreate.push({
                customerServiceId: customerService.id,
                reminderType: 'EXPIRY_30_DAY',
                scheduledDate: d30,
              });
            }
          }
          if (reminderDays >= 15 || reminderDays === 15) {
            const d15 = new Date(expiryDate);
            d15.setDate(d15.getDate() - 15);
            if (d15 > new Date()) {
              remindersToCreate.push({
                customerServiceId: customerService.id,
                reminderType: 'EXPIRY_15_DAY',
                scheduledDate: d15,
              });
            }
          }
          if (reminderDays >= 7 || reminderDays === 7) {
            const d7 = new Date(expiryDate);
            d7.setDate(d7.getDate() - 7);
            if (d7 > new Date()) {
              remindersToCreate.push({
                customerServiceId: customerService.id,
                reminderType: 'EXPIRY_7_DAY',
                scheduledDate: d7,
              });
            }
          }

          if (remindersToCreate.length > 0) {
            await tx.reminder.createMany({ data: remindersToCreate });
            logger.info(`${remindersToCreate.length} expiry reminder(s) scheduled for ${customer.name}`);
          }
        }

        // 7. Auto-schedule weekly due reminders if balance remaining
        if (advancePaid < serviceData.agreedFee) {
          const weeklyReminders: any[] = [];
          const startReminder = new Date();
          startReminder.setDate(startReminder.getDate() + 7);

          // Schedule up to 8 weekly reminders (2 months)
          for (let i = 0; i < 8; i++) {
            const reminderDate = new Date(startReminder);
            reminderDate.setDate(reminderDate.getDate() + (i * 7));
            weeklyReminders.push({
              customerServiceId: customerService.id,
              reminderType: 'PAYMENT_DUE_WEEKLY',
              scheduledDate: reminderDate,
            });
          }

          await tx.reminder.createMany({ data: weeklyReminders });
          logger.info(`${weeklyReminders.length} weekly due reminder(s) scheduled for ${customer.name}`);
        }
      }

      // Compute payment status
      let paymentStatus = 'UNPAID';
      if (paymentData && serviceData) {
        if (paymentData.amount >= serviceData.agreedFee) paymentStatus = 'PAID';
        else if (paymentData.amount > 0) paymentStatus = 'DUE';
      } else if (!serviceData) {
        paymentStatus = 'PENDING';
      } else {
        paymentStatus = 'PENDING';
      }

      return {
        ...customer,
        customerService,
        payment,
        confirmationNotification,
        paymentStatus,
      };
    });
  }

  static async update(id: string, data: Partial<CreateCustomerInput>) {
    await this.getById(id);

    const { createdById, ...updateData } = data;
    return prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  static async delete(id: string) {
    await this.getById(id);

    // Check for active services
    const activeServices = await prisma.customerService.count({
      where: {
        customerId: id,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (activeServices > 0) {
      throw new AppError(
        `Cannot delete customer with ${activeServices} active service(s). Cancel or complete them first.`,
        400,
      );
    }

    // Cascade delete — remove related records
    await prisma.$transaction([
      prisma.reminder.deleteMany({
        where: { customerService: { customerId: id } },
      }),
      prisma.notification.deleteMany({ where: { customerId: id } }),
      prisma.payment.deleteMany({
        where: { customerService: { customerId: id } },
      }),
      prisma.customerService.deleteMany({ where: { customerId: id } }),
      prisma.customer.delete({ where: { id } }),
    ]);

    return { message: 'Customer deleted successfully' };
  }

  static async bulkImport(rows: any[], createdById: string) {
    const PHONE_RE = /^[6-9]\d{9}$/;
    const results: { row: number; status: 'success' | 'error'; customerCode?: string; name?: string; error?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      // ── Required field validation ──
      const name = (row.name || '').toString().trim();
      const rawPhone = (row.phone || '').toString().replace(/[\s\-+]/g, '');
      const phone = rawPhone.startsWith('91') && rawPhone.length === 12 ? rawPhone.slice(2) : rawPhone;

      if (!name) {
        results.push({ row: rowNum, status: 'error', error: 'Name is required' });
        continue;
      }
      if (!phone || !PHONE_RE.test(phone)) {
        results.push({ row: rowNum, status: 'error', name, error: `Invalid phone: "${row.phone}"` });
        continue;
      }

      // ── Duplicate check (phone) ──
      const existing = await prisma.customer.findFirst({ where: { phone } });
      if (existing) {
        results.push({ row: rowNum, status: 'error', name, error: `Phone ${phone} already exists (${existing.customerCode})` });
        continue;
      }

      try {
        const customer = await prisma.$transaction(async (tx) => {
          const customerCode = await generateCustomerCode(tx);
          return tx.customer.create({
            data: {
              customerCode,
              name,
              phone,
              whatsappNumber: row.whatsappNumber?.toString().replace(/[\s\-+]/g, '') || phone,
              alternatePhone: row.alternatePhone?.toString().replace(/[\s\-+]/g, '') || null,
              email: row.email?.toString().trim() || null,
              address: row.address?.toString().trim() || null,
              city: row.city?.toString().trim() || null,
              state: row.state?.toString().trim() || null,
              pincode: row.pincode?.toString().trim() || null,
              vehicleNumber: row.vehicleNumber?.toString().toUpperCase().replace(/\s/g, '') || null,
              vehicleType: row.vehicleType?.toString().trim() || null,
              vehicleCategory: row.vehicleCategory?.toString().trim() || null,
              vehicleBrand: row.vehicleBrand?.toString().trim() || null,
              vehicleModel: row.vehicleModel?.toString().trim() || null,
              manufacturingYear: row.manufacturingYear ? parseInt(row.manufacturingYear) : null,
              fuelType: row.fuelType?.toString().trim() || null,
              engineNumber: row.engineNumber?.toString().toUpperCase().trim() || null,
              chassisNumber: row.chassisNumber?.toString().toUpperCase().trim() || null,
              vehicleColour: row.vehicleColour?.toString().trim() || null,
              dlNumber: row.dlNumber?.toString().toUpperCase().replace(/\s/g, '') || null,
              aadharNumber: row.aadharNumber?.toString().replace(/\s/g, '') || null,
              notes: row.notes?.toString().trim() || null,
              createdById,
            },
          });
        });
        results.push({ row: rowNum, status: 'success', customerCode: customer.customerCode, name });
      } catch (err: any) {
        results.push({ row: rowNum, status: 'error', name, error: err.message || 'Unknown error' });
      }
    }

    const succeeded = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'error').length;
    return { succeeded, failed, total: rows.length, results };
  }
}
