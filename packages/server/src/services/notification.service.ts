import { prisma, logger } from '../config';
import { NotificationChannel, NotificationType, NotificationStatus } from '@prisma/client';

interface SendNotificationInput {
  customerId: string;
  customerServiceId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  messageBody: string;
}

export class NotificationService {
  static async list(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          customerService: {
            include: { service: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count(),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async send(data: SendNotificationInput) {
    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        customerId: data.customerId,
        customerServiceId: data.customerServiceId,
        channel: data.channel,
        type: data.type,
        messageBody: data.messageBody,
        status: 'QUEUED',
      },
    });

    // Attempt to send (placeholder — real Twilio integration)
    try {
      // TODO: Integrate Twilio SMS/WhatsApp here
      // For now, mark as SENT for demo purposes
      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      logger.info(`Notification sent to ${updated.customer.name} via ${data.channel}`);
      return updated;
    } catch (err) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      logger.error('Failed to send notification', err);
      throw err;
    }
  }

  static async getStats() {
    const [total, sent, failed, queued] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({ where: { status: 'QUEUED' } }),
    ]);

    return { total, sent, failed, queued };
  }
}
