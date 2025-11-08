const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validate request body against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', { errors, body: req.body });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  factCheck: Joi.object({
    claimText: Joi.string().required().min(3).max(1000).trim(),
    language: Joi.string().optional().length(2).default('en'),
  }),
};

module.exports = {
  validate,
  schemas,
};

