const rateLimit = require('express-rate-limit');
const config = require('../config/environment.config');

/**
 * API rate limiter
 * Uses in-memory store for MVP (can be upgraded to Redis later)
 */
const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  },
});

/**
 * Webhook rate limiter (more lenient)
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Webhook rate limit exceeded.',
    });
  },
});

module.exports = {
  apiRateLimiter,
  webhookRateLimiter,
};

