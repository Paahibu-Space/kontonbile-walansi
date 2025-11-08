const express = require('express');
const factCheckController = require('../controllers/fact-check.controller');
const { validate, schemas } = require('../middleware/validation.middleware');
const { apiRateLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiRateLimiter);

// Validate and verify claim
router.post('/', validate(schemas.factCheck), factCheckController.verifyClaim.bind(factCheckController));
router.get('/:id', factCheckController.getFactCheck.bind(factCheckController));
router.get('/search', factCheckController.searchFactChecks.bind(factCheckController));

module.exports = router;

