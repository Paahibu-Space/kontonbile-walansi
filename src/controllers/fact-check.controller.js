const factCheckService = require('../services/business/fact-check-service');
const logger = require('../utils/logger');

class FactCheckController {
  /**
   * POST /api/fact-check
   * Verify a claim
   */
  async verifyClaim(req, res, next) {
    try {
      const { claimText, language } = req.body;
      const userId = req.user?.userId || null;

      if (!claimText) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'claimText is required',
        });
      }

      const result = await factCheckService.verifyClaim(claimText, language || 'en', userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Fact-check controller error:', error);
      next(error);
    }
  }

  /**
   * GET /api/fact-check/:id
   * Get fact-check by ID
   */
  async getFactCheck(req, res, next) {
    try {
      const { id } = req.params;
      const factCheck = await factCheckService.getFactCheckById(id);

      res.json({
        success: true,
        data: factCheck,
      });
    } catch (error) {
      if (error.message === 'Fact-check not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/fact-check/search?q=query
   * Search fact-checks
   */
  async searchFactChecks(req, res, next) {
    try {
      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Query parameter "q" is required',
        });
      }

      const results = await factCheckService.searchFactChecks(q, parseInt(limit, 10) || 10);

      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FactCheckController();

