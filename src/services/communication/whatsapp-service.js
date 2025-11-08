const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class WhatsAppService {
  constructor() {
    this.token = config.whatsapp.token;
    this.apiUrl = config.whatsapp.apiUrl;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.verifyToken = config.whatsapp.verifyToken;
  }

  /**
   * Send text message
   */
  async sendMessage(to, text) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('WhatsApp send message error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Verify webhook (for WhatsApp webhook setup)
   */
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('WhatsApp mark as read error:', error);
      // Don't throw - this is not critical
      return null;
    }
  }
}

module.exports = new WhatsAppService();

