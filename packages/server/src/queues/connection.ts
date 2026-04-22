import { ConnectionOptions } from 'bullmq';
import env from '../config/env';

const url = new URL(env.REDIS_URL);

const connection: ConnectionOptions = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  password: url.password || undefined,
  db: url.pathname ? parseInt(url.pathname.replace('/', '')) || 0 : 0,
  maxRetriesPerRequest: null, // required by BullMQ
};

export default connection;
