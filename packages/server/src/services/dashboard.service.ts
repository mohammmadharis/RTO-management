import { prisma } from '../config';
import { Prisma } from '@prisma/client';

export class DashboardService {
  static async getSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    // Start of today for notification queries
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalCustomers,
      activeServices,
      monthlyRevenueResult,
      outstandingResult,
      expiringServices,
      recentPayments,
      recentServiceUpdates,
      revenueChart,
      serviceDistribution,
      todaysNotifications,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),

      // Active services
      prisma.customerService.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),

      // Monthly revenue
      prisma.payment.aggregate({
        where: { paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),

      // Outstanding dues — raw query for performance
      prisma.$queryRaw<[{ total_due: bigint }]>`
        SELECT COALESCE(SUM(cs.agreed_fee) - COALESCE(SUM(p.amount), 0), 0) as total_due
        FROM customer_services cs
        LEFT JOIN payments p ON p.customer_service_id = cs.id
        WHERE cs.status IN ('PENDING', 'IN_PROGRESS')
      `,

      // Expiring services (next 30 days) — include payments and reminders/notifications count
      prisma.customerService.findMany({
        where: {
          expiryDate: { lte: futureDate, gte: now },
          status: 'COMPLETED',
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, vehicleNumber: true, customerCode: true } },
          service: { select: { id: true, name: true } },
          payments: { select: { amount: true } },
          notifications: { where: { type: 'EXPIRY_REMINDER' }, select: { id: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 20,
      }),

      // Recent payments (last 15)
      prisma.payment.findMany({
        include: {
          customerService: {
            include: {
              customer: { select: { name: true, customerCode: true } },
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),

      // Recent service updates (last 15)
      prisma.customerService.findMany({
        include: {
          customer: { select: { name: true, customerCode: true } },
          service: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      }),

      // Revenue chart (last 12 months)
      prisma.$queryRaw<{ month: Date; revenue: bigint }[]>`
        SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as revenue
        FROM payments
        WHERE payment_date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', payment_date)
        ORDER BY month
      `,

      // Service distribution
      prisma.$queryRaw<{ name: string; count: bigint }[]>`
        SELECT s.name, COUNT(cs.id)::int as count
        FROM customer_services cs
        JOIN services s ON cs.service_id = s.id
        WHERE cs.created_at >= DATE_TRUNC('year', CURRENT_DATE)
        GROUP BY s.name
        ORDER BY count DESC
      `,

      // Today's notifications (messages sent today)
      prisma.notification.findMany({
        where: {
          sentAt: { gte: todayStart },
          status: 'SENT',
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          customerService: {
            include: { service: { select: { name: true } } },
          },
        },
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    // Build recent activity feed
    const recentActivity = [
      ...recentPayments.map((p) => ({
        type: 'PAYMENT' as const,
        timestamp: p.createdAt.toISOString(),
        customerName: p.customerService.customer.name,
        customerCode: (p.customerService.customer as any).customerCode || null,
        detail: `${p.customerService.service.name} — ${p.paymentType}`,
        amount: p.amount,
      })),
      ...recentServiceUpdates.map((cs) => ({
        type: 'SERVICE' as const,
        timestamp: cs.updatedAt.toISOString(),
        customerName: cs.customer.name,
        customerCode: (cs.customer as any).customerCode || null,
        detail: `${cs.service.name} — ${cs.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);

    // Enrich expiring services with days remaining, reminder count, and payment status
    const enrichedExpiring = expiringServices.map((cs) => {
      const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = cs.agreedFee - totalPaid;
      let paymentStatus = 'UNPAID';
      if (totalPaid === 0) paymentStatus = 'UNPAID';
      else if (totalPaid >= cs.agreedFee) paymentStatus = 'CLEARED';
      else paymentStatus = 'PARTIALLY_PAID';

      return {
        ...cs,
        daysRemaining: Math.ceil(
          (new Date(cs.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
        remindersSent: cs.notifications.length,
        totalPaid,
        dueAmount,
        paymentStatus,
      };
    });

    // Format today's notifications
    const todaysMessages = todaysNotifications.map((n) => ({
      id: n.id,
      customerName: n.customer.name,
      customerPhone: n.customer.phone,
      customerId: n.customer.id,
      serviceName: n.customerService?.service?.name || null,
      channel: n.channel,
      type: n.type,
      messageBody: n.messageBody,
      sentAt: n.sentAt?.toISOString() || null,
    }));

    return {
      totalCustomers,
      activeServices,
      monthlyRevenue: monthlyRevenueResult._sum.amount || 0,
      outstandingDues: Number(outstandingResult[0]?.total_due || 0),
      expiringServices: enrichedExpiring,
      recentActivity,
      revenueChart: revenueChart.map((r) => ({
        month: r.month.toISOString(),
        revenue: Number(r.revenue),
      })),
      serviceDistribution: serviceDistribution.map((s) => ({
        name: s.name,
        count: Number(s.count),
      })),
      todaysMessages,
      todaysMessageCount: todaysMessages.length,
    };
  }
}
