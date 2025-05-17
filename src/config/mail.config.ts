import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.example.com',
  port: process.env.MAIL_PORT || 587,
  user: process.env.MAIL_USER || 'your-email@example.com',
  password: process.env.MAIL_PASSWORD || 'your-email-password',
  from: process.env.MAIL_FROM || 'no-reply@tuorganizacion.org',
}));