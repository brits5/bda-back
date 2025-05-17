import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  adminFrontendUrl: process.env.ADMIN_FRONTEND_URL || 'http://localhost:4201',
}));