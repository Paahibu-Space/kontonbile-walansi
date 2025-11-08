const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class GoogleFactCheckClient {
  constructor() {
    this.apiKey = config.googleFactCheck.apiKey;
    this.baseUrl = config.googleFactCheck.apiUrl;
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Search for fact-check claims
   * @param {string} query - The claim text to verify
   * @param {string} languageCode - ISO 639-1 language code (optional)
   * @returns {Promise<Object>} Fact-check results
   */
  async searchClaims(query, languageCode = 'en') {
    if (!this.apiKey) {
      throw new Error('Google Fact Check API key not configured');
    }

    try {
      const url = `${this.baseUrl}/claims:search`;
      const params = {
        key: this.apiKey,
        query: query.substring(0, 500), // Limit query length
        languageCode,
        pageSize: 10,
      };

      logger.info('Google Fact Check API request', { 
        query: query.substring(0, 100), 
        languageCode 
      });

      const response = await axios.get(url, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
        },
      });

      logger.info('Google Fact Check API response', {
        status: response.status,
        resultsCount: response.data?.claims?.length || 0,
      });

      return this.formatResponse(response.data);
    } catch (error) {
      logger.error('Google Fact Check API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 403) {
        throw new Error('API key invalid or quota exceeded');
      }

      throw new Error(`Fact-check API error: ${error.message}`);
    }
  }

  /**
   * Format API response to standard structure
   */
  formatResponse(data) {
    if (!data.claims || data.claims.length === 0) {
      return {
        found: false,
        claims: [],
      };
    }

    const claims = data.claims.map((claim) => ({
      claimText: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      review: claim.claimReview?.map((review) => ({
        publisher: review.publisher?.name,
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode,
      })) || [],
    }));

    // Determine overall rating
    const ratings = claims.flatMap(c => c.review.map(r => r.textualRating?.toLowerCase() || ''));
    const overallRating = this.determineOverallRating(ratings);

    return {
      found: true,
      overallRating,
      claims,
      totalResults: data.claims.length,
    };
  }

  /**
   * Determine overall rating from multiple reviews
   */
  determineOverallRating(ratings) {
    if (ratings.length === 0) return 'unverified';

    const falseKeywords = ['false', 'incorrect', 'misleading', 'pants on fire'];
    const trueKeywords = ['true', 'correct', 'accurate'];
    const misleadingKeywords = ['misleading', 'mostly false', 'half true'];

    const lowerRatings = ratings.map(r => r.toLowerCase());

    if (lowerRatings.some(r => falseKeywords.some(k => r.includes(k)))) {
      return 'false';
    }
    if (lowerRatings.some(r => misleadingKeywords.some(k => r.includes(k)))) {
      return 'misleading';
    }
    if (lowerRatings.some(r => trueKeywords.some(k => r.includes(k)))) {
      return 'true';
    }

    return 'unverified';
  }
}

module.exports = new GoogleFactCheckClient();

