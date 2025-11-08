const factCheckService = require('../business/fact-check-service');
const logger = require('../../utils/logger');

/**
 * Simplified message router for MVP
 * Uses keyword-based intent detection (AI/NLP will be added later)
 */
class MessageRouter {
  constructor() {
    // Keyword-based intent detection (will be replaced with AI later)
    this.intentKeywords = {
      'fact-check': ['verify', 'check', 'true', 'false', 'fact', 'claim', 'news', 'real', 'fake'],
      'sos': ['help', 'emergency', 'sos', 'danger', 'harassment', 'abuse', 'violence', 'hurt'],
      'question': ['how', 'what', 'why', 'when', 'where', 'explain', 'tell me'],
    };
  }

  /**
   * Route message based on intent
   * @param {Object} params - { platform, userId, chatId, messageText, metadata }
   * @returns {Promise<Object>} Response with text and options
   */
  async routeMessage({ platform, userId, chatId, messageText, metadata = {} }) {
    try {
      if (!messageText || messageText.trim().length === 0) {
        return {
          text: 'Please send a message. I can help you with fact-checking and more!',
          options: {},
        };
      }

      // Simple keyword-based intent detection (MVP - will use AI later)
      const intent = this.detectIntent(messageText);
      const language = 'en'; // Default for MVP, will detect later

      logger.info('Message routed', {
        platform,
        userId,
        intent,
        language,
        messageLength: messageText.length,
      });

      // Route based on intent
      switch (intent) {
        case 'fact-check':
          return await this.handleFactCheck(messageText, language);

        case 'sos':
          return await this.handleSOS(messageText);

        case 'question':
          return await this.handleQuestion(messageText);

        default:
          return await this.handleDefault(messageText);
      }
    } catch (error) {
      logger.error('Message routing error:', error);
      return {
        text: 'Sorry, I encountered an error. Please try again.',
        options: {},
      };
    }
  }

  /**
   * Simple keyword-based intent detection (MVP)
   * Will be replaced with AI-based classification later
   */
  detectIntent(text) {
    const lowerText = text.toLowerCase();
    
    // Check for SOS first (highest priority)
    if (this.intentKeywords.sos.some(keyword => lowerText.includes(keyword))) {
      return 'sos';
    }

    // Check for fact-check
    if (this.intentKeywords['fact-check'].some(keyword => lowerText.includes(keyword))) {
      return 'fact-check';
    }

    // Check for question
    if (this.intentKeywords.question.some(keyword => lowerText.includes(keyword))) {
      return 'question';
    }

    return 'unknown';
  }

  /**
   * Handle fact-check intent
   */
  async handleFactCheck(messageText, language) {
    try {
      const result = await factCheckService.verifyClaim(messageText, language);

      const statusEmoji = {
        'false': '❌',
        'true': '✅',
        'misleading': '⚠️',
        'unverified': '❓',
      };

      const emoji = statusEmoji[result.verificationStatus] || '❓';

      let responseText = `${emoji} <b>Fact-Check Result</b>\n\n`;
      responseText += `Status: <b>${result.verificationStatus.toUpperCase()}</b>\n`;
      responseText += `\n${result.explanation}`;
      
      if (result.sourceUrl) {
        responseText += `\n\nSource: ${result.sourceUrl}`;
      }

      if (result.evidenceLinks && result.evidenceLinks.length > 0) {
        responseText += `\n\nEvidence: ${result.evidenceLinks[0]}`;
      }

      return {
        text: responseText,
        options: {
          parseMode: 'HTML',
        },
      };
    } catch (error) {
      logger.error('Fact-check routing error:', error);
      return {
        text: 'Sorry, I could not verify that claim. Please try again with a different query.',
        options: {},
      };
    }
  }

  /**
   * Handle SOS intent (simplified for MVP)
   */
  async handleSOS(messageText) {
    // For MVP, provide basic guidance
    // Full SOS handler will be implemented later
    const responseText = `🚨 <b>Emergency Support</b>\n\n` +
      `If you're in immediate danger, please:\n` +
      `1. Call emergency services: 911 (or your local emergency number)\n` +
      `2. Get to a safe location\n` +
      `3. Contact trusted friends or family\n\n` +
      `For support resources, please contact local authorities or support organizations.`;

    return {
      text: responseText,
      options: {
        parseMode: 'HTML',
      },
    };
  }

  /**
   * Handle question intent (simplified for MVP)
   */
  async handleQuestion(messageText) {
    // For MVP, provide basic response
    // AI story teacher will be implemented later
    return {
      text: 'I understand you have a question. The AI-powered cultural education feature is coming soon!\n\n' +
            'For now, I can help you with:\n' +
            '• Fact-checking claims\n' +
            '• Emergency support (type "help" or "sos")',
      options: {},
    };
  }

  /**
   * Handle default/unknown intent
   */
  async handleDefault(messageText) {
    return {
      text: '👋 <b>Hello! I\'m Walansi Kontonbile</b>\n\n' +
            'I can help you with:\n' +
            '• <b>Fact-checking</b> - Send me a claim to verify\n' +
            '• <b>Emergency support</b> - Type "help" or "sos"\n' +
            '• <b>Questions</b> - Ask me anything (coming soon)\n\n' +
            'How can I assist you?',
      options: {
        parseMode: 'HTML',
      },
    };
  }
}

module.exports = new MessageRouter();

