import { registerAs } from '@nestjs/config';

export default registerAs('plux', () => ({
  apiKey: process.env.PLUX_API_KEY || 'your_plux_api_key_here',
  merchantId: process.env.PLUX_MERCHANT_ID || 'your_plux_merchant_id_here',
  apiUrl: process.env.PLUX_API_URL || 'https://api.plux.info',
  webhookSecret: process.env.PLUX_WEBHOOK_SECRET || 'your_plux_webhook_secret',
}));