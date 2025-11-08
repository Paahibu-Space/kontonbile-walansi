const { v4: uuidv4 } = require('uuid');
const googleFactCheckClient = require('../external/google-fact-check.client');
const cacheManager = require('../../utils/cache-manager');
const FactCheck = require('../../models/fact-check.model');
const logger = require('../../utils/logger');

class FactCheckService {
  /**
   * Verify a claim using Google Fact Check API
   * @param {string} claimText - The claim to verify
   * @param {string} language - Language code
   * @param {string} userId - Optional user ID for tracking
   * @returns {Promise<Object>} Verification result
   */
  async verifyClaim(claimText, language = 'en', userId = null) {
    if (!claimText || claimText.trim().length === 0) {
      throw new Error('Claim text is required');
    }

    const normalizedClaim = this.normalizeClaim(claimText);
    const cacheKey = cacheManager.constructor.factCheckKey(normalizedClaim);

    // Check cache first
    const cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
      logger.info('Fact-check cache hit', { claim: normalizedClaim.substring(0, 50) });
      return cachedResult;
    }

    // Query Google Fact Check API
    logger.info('Fact-check cache miss, querying API', { claim: normalizedClaim.substring(0, 50) });
    const apiResult = await googleFactCheckClient.searchClaims(normalizedClaim, language);

    // Create fact-check record
    const factCheck = await this.createFactCheckRecord({
      claimText: normalizedClaim,
      apiResult,
      language,
      userId,
    });

    // Format response
    const response = this.formatResponse(factCheck, apiResult);

    // Cache result (24 hours)
    await cacheManager.set(cacheKey, response, 86400);

    return response;
  }

  /**
   * Normalize claim text for consistent caching
   */
  normalizeClaim(claimText) {
    return claimText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 500); // Limit length
  }

  /**
   * Create fact-check record in database
   */
  async createFactCheckRecord({ claimText, apiResult, language, userId }) {
    const factId = uuidv4();
    const verificationStatus = apiResult.found
      ? apiResult.overallRating
      : 'unverified';

    const factCheck = new FactCheck({
      factId,
      claimText,
      verificationStatus,
      explanation: this.generateExplanation(apiResult),
      language,
      sourceUrl: apiResult.claims?.[0]?.review?.[0]?.url,
      evidenceLinks: this.extractEvidenceLinks(apiResult),
      googleFactCheckData: apiResult,
    });

    await factCheck.save();
    logger.info('Fact-check record created', { factId, verificationStatus });

    return factCheck;
  }

  /**
   * Generate explanation from API result
   */
  generateExplanation(apiResult) {
    if (!apiResult.found) {
      return 'No fact-check information found for this claim.';
    }

    const firstReview = apiResult.claims?.[0]?.review?.[0];
    if (firstReview) {
      return `According to ${firstReview.publisher || 'fact-checkers'}, this claim is ${apiResult.overallRating}.`;
    }

    return `Fact-check status: ${apiResult.overallRating}`;
  }

  /**
   * Extract evidence links from API result
   */
  extractEvidenceLinks(apiResult) {
    if (!apiResult.claims) return [];

    return apiResult.claims
      .flatMap(claim => claim.review || [])
      .map(review => review.url)
      .filter(url => url);
  }

  /**
   * Format response for API
   */
  formatResponse(factCheck, apiResult) {
    return {
      factId: factCheck.factId,
      claimText: factCheck.claimText,
      verificationStatus: factCheck.verificationStatus,
      explanation: factCheck.explanation,
      sourceUrl: factCheck.sourceUrl,
      evidenceLinks: factCheck.evidenceLinks,
      verifiedAt: factCheck.verifiedAt,
      found: apiResult.found,
    };
  }

  /**
   * Get fact-check by ID
   */
  async getFactCheckById(factId) {
    const factCheck = await FactCheck.findOne({ factId });
    if (!factCheck) {
      throw new Error('Fact-check not found');
    }
    return factCheck;
  }

  /**
   * Search fact-checks
   */
  async searchFactChecks(query, limit = 10) {
    return FactCheck.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
  }
}

module.exports = new FactCheckService();

