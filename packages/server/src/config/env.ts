import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { cleanEnv, str, port, bool } from 'envalid';

const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  JWT_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  PORT: port({ default: 5000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
  TWILIO_ACCOUNT_SID: str({ default: '' }),
  TWILIO_AUTH_TOKEN: str({ default: '' }),
  TWILIO_PHONE_NUMBER: str({ default: '' }),
  TWILIO_WHATSAPP_NUMBER: str({ default: '' }),
  ENABLE_CRON_JOBS: bool({ default: false }),
});

export default env;
