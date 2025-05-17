import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));