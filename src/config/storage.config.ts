import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  path: process.env.FILE_STORAGE_PATH || './storage',
}));