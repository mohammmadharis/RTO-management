import { Worker, Job } from 'bullmq';
import connection from '../queues/connection';
import { NotificationJobData } from '../queues/notificationQueue';
import { prisma, logger, env } from '../config';

async function processNotification(job: Job<NotificationJobData>): Promise<void> {
  const { customerId, customerServiceId, channel, type, messageBody, reminderType } = job.data;

  logger.info(`[WORKER] Processing notification job ${job.id}`, { type, channel, customerId });

  // 1. Create notification record
  const notification = await prisma.notification.create({
    data: {
      customerId,
      customerServiceId,
      channel,
      type,
      messageBody,
      status: 'QUEUED',
    },
  });

  // 2. Fetch customer phone
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, phone: true, whatsappNumber: true },
  });

  if (!customer?.phone) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'FAILED', errorMessage: 'No phone number on record' },
    });
    logger.warn(`[WORKER] Customer ${customerId} has no phone, skipping notification`);
    return;
  }

  // 3. Send via Twilio (or mock in development)
  try {
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      const twilio = (await import('twilio')).default;
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

      const to = customer.phone.startsWith('+') ? customer.phone : `+91${customer.phone}`;
      const waTo = (customer.whatsappNumber || customer.phone).startsWith('+')
        ? customer.whatsappNumber || customer.phone
        : `+91${customer.whatsappNumber || customer.phone}`;

      if (channel === 'SMS' || channel === 'BOTH') {
        await client.messages.create({
          body: messageBody,
          from: env.TWILIO_PHONE_NUMBER,
          to,
        });
      }

      if (channel === 'WHATSAPP' || channel === 'BOTH') {
        await client.messages.create({
          body: messageBody,
          from: env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${waTo}`,
        });
      }
    } else {
      // Development mode — simulate send
      logger.info(`[WORKER][DEV] Would send to ${customer.phone}: "${messageBody}"`);
    }

    // 4. Mark notification as SENT
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    // 5. Create Reminder record if this is a cron-originated reminder
    if (reminderType && customerServiceId) {
      await prisma.reminder.create({
        data: {
          customerServiceId,
          reminderType,
          scheduledDate: new Date(),
          isSent: true,
          sentAt: new Date(),
          notificationId: notification.id,
        },
      });
    }

    logger.info(`[WORKER] Notification sent: ${customer.name} — ${type} via ${channel}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'FAILED', errorMessage },
    });
    logger.error(`[WORKER] Notification failed for ${customer.name}`, err);
    throw err; // rethrow so BullMQ retries
  }
}

export function startNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>('notifications', processNotification, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info(`[WORKER] Job ${job.id} completed (${job.data.type})`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[WORKER] Job ${job?.id} failed (${job?.data.type}): ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('[WORKER] Worker error', err);
  });

  logger.info('[WORKER] Notification worker started (concurrency: 5)');
  return worker;
}
