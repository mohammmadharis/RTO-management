import { Queue } from 'bullmq';
import connection from './connection';
import { NotificationChannel, NotificationType, ReminderType } from '@prisma/client';

export interface NotificationJobData {
  customerId: string;
  customerServiceId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  messageBody: string;
  /** Present for cron-originated jobs so the worker can create a Reminder record */
  reminderType?: ReminderType;
}

const QUEUE_NAME = 'notifications';

export const notificationQueue = new Queue<NotificationJobData>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }, // retry after 5s, 25s, 125s
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

/** Enqueue a single notification job */
export async function addNotificationJob(data: NotificationJobData): Promise<void> {
  await notificationQueue.add(`${data.type}:${data.customerId}`, data, {
    jobId: data.reminderType
      ? `${data.reminderType}:${data.customerServiceId}`
      : undefined, // deduplication key for reminders
  });
}
