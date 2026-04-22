import cron from 'node-cron';
import { prisma, logger } from '../config';
import { addNotificationJob } from '../queues';

/**
 * Daily 8:00 AM — Check for services expiring in 30/15/10/7 days
 * and enqueue reminder notifications via BullMQ.
 */
export function startExpiryReminderJob() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Running expiry reminder check...');

    try {
      const thresholds = [
        { days: 30, type: 'EXPIRY_30_DAY' as const },
        { days: 15, type: 'EXPIRY_15_DAY' as const },
        { days: 10, type: 'EXPIRY_10_DAY' as const },
        { days: 7, type: 'EXPIRY_7_DAY' as const },
      ];

      for (const { days, type } of thresholds) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const expiringServices = await prisma.customerService.findMany({
          where: {
            expiryDate: { gte: startOfDay, lte: endOfDay },
            status: 'COMPLETED',
          },
          include: {
            customer: { select: { id: true, name: true } },
            service: { select: { name: true } },
            reminders: { where: { reminderType: type, isSent: true } },
          },
        });

        let queued = 0;
        for (const cs of expiringServices) {
          if (cs.reminders.length > 0) continue; // already sent this threshold

          const message =
            `Dear ${cs.customer.name}, your ${cs.service.name} is expiring on ` +
            `${cs.expiryDate?.toLocaleDateString('en-IN')}. ` +
            `Please contact us for renewal. - RTO Patel Service`;

          await addNotificationJob({
            customerId: cs.customer.id,
            customerServiceId: cs.id,
            channel: 'BOTH',
            type: 'EXPIRY_REMINDER',
            messageBody: message,
            reminderType: type,
          });

          queued++;
        }

        if (queued > 0) {
          logger.info(`[CRON] Queued ${queued} expiry reminder(s) for ${days}-day threshold`);
        }
      }

      logger.info('[CRON] Expiry reminder check completed');
    } catch (err) {
      logger.error('[CRON] Expiry reminder job failed', err);
    }
  });

  logger.info('[CRON] Expiry reminder job scheduled (daily 8:00 AM)');
}

/**
 * Daily 9:00 AM — Enqueue payment due reminders for services with outstanding balances.
 */
export function startPaymentReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON] Running payment due reminder check...');

    try {
      const overdueThreshold = new Date();
      overdueThreshold.setDate(overdueThreshold.getDate() - 7);

      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() - 7);

      const services = await prisma.customerService.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          startDate: { lte: overdueThreshold },
        },
        include: {
          customer: { select: { id: true, name: true } },
          service: { select: { name: true } },
          payments: { select: { amount: true } },
          reminders: {
            where: {
              reminderType: 'PAYMENT_DUE',
              isSent: true,
              sentAt: { gte: cooldownDate },
            },
          },
        },
      });

      let queued = 0;
      for (const cs of services) {
        const totalPaid = cs.payments.reduce((sum, p) => sum + p.amount, 0);
        const dueAmount = cs.agreedFee - totalPaid;

        if (dueAmount <= 0) continue;
        if (cs.reminders.length > 0) continue; // cooldown active

        const dueRupees = (dueAmount / 100).toLocaleString('en-IN');
        const message =
          `Dear ${cs.customer.name}, you have a pending payment of ₹${dueRupees} ` +
          `for ${cs.service.name}. Please clear your dues. - RTO Patel Service`;

        await addNotificationJob({
          customerId: cs.customer.id,
          customerServiceId: cs.id,
          channel: 'BOTH',
          type: 'PAYMENT_REMINDER',
          messageBody: message,
          reminderType: 'PAYMENT_DUE',
        });

        queued++;
      }

      if (queued > 0) {
        logger.info(`[CRON] Queued ${queued} payment due reminder(s)`);
      }

      logger.info('[CRON] Payment due reminder check completed');
    } catch (err) {
      logger.error('[CRON] Payment reminder job failed', err);
    }
  });

  logger.info('[CRON] Payment reminder job scheduled (daily 9:00 AM)');
}

/**
 * Initialize all cron jobs.
 */
export function initCronJobs() {
  startExpiryReminderJob();
  startPaymentReminderJob();
  logger.info('[CRON] All cron jobs initialized');
}
