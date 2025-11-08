const express = require('express');
const router = express.Router();
const { webhookRateLimiter } = require('../middleware/rate-limit.middleware');

router.get('/', (req, res) => {
  res.json({
    message: 'Webhook endpoints',
    endpoints: {
      telegram: '/webhooks/telegram',
      whatsapp: '/webhooks/whatsapp',
    },
  });
});

// Telegram webhook
const telegramController = require('../controllers/webhook/telegram.controller');
router.post('/telegram', webhookRateLimiter, telegramController.handleWebhook.bind(telegramController));

// WhatsApp webhook
const whatsappController = require('../controllers/webhook/whatsapp.controller');
router.get('/whatsapp', whatsappController.handleVerification.bind(whatsappController));
router.post('/whatsapp', webhookRateLimiter, whatsappController.handleWebhook.bind(whatsappController));

module.exports = router;

