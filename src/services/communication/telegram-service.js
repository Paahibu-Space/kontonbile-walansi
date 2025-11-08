const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.apiUrl = `${config.telegram.apiUrl}${this.botToken}`;
  }

  /**
   * Send text message
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const url = `${this.apiUrl}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        reply_markup: options.replyMarkup,
        ...options,
      };

      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      logger.error('Telegram send message error:', error.response?.data || error.message);
      throw new Error(`Failed to send Telegram message: ${error.message}`);
    }
  }

  /**
   * Send message with inline keyboard
   */
  async sendMessageWithKeyboard(chatId, text, buttons) {
    const keyboard = {
      inline_keyboard: buttons.map(row =>
        row.map(btn => ({
          text: btn.text,
          callback_data: btn.callbackData,
        }))
      ),
    };

    return this.sendMessage(chatId, text, {
      reply_markup: keyboard,
    });
  }

  /**
   * Get bot info
   */
  async getMe() {
    try {
      const url = `${this.apiUrl}/getMe`;
      const response = await axios.get(url);
      return response.data.result;
    } catch (error) {
      logger.error('Telegram getMe error:', error);
      throw error;
    }
  }

  /**
   * Set webhook
   */
  async setWebhook(url) {
    try {
      const webhookUrl = `${this.apiUrl}/setWebhook`;
      const response = await axios.post(webhookUrl, { url });
      return response.data;
    } catch (error) {
      logger.error('Telegram setWebhook error:', error);
      throw error;
    }
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    try {
      const url = `${this.apiUrl}/answerCallbackQuery`;
      const response = await axios.post(url, {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      });
      return response.data;
    } catch (error) {
      logger.error('Telegram answerCallbackQuery error:', error);
      throw error;
    }
  }
}

module.exports = new TelegramService();

