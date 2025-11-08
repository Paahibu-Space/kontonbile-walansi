const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Walansi Kontonbile API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      factCheck: '/api/fact-check',
      webhooks: '/webhooks',
    },
  });
});

// Fact-check routes
router.use('/fact-check', require('./fact-check.routes'));

module.exports = router;

