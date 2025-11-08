const telegramService = require('../../services/communication/telegram-service');
const messageRouter = require('../../services/gateway/message-router');
const User = require('../../models/user.model');
const Conversation = require('../../models/conversation.model');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class TelegramWebhookController {
  /**
   * POST /webhooks/telegram
   * Handle Telegram webhook
   */
  async handleWebhook(req, res) {
    try {
      const update = req.body;

      // Telegram sends updates for messages, callbacks, etc.
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallback(update.callback_query);
      }

      // Always respond 200 to acknowledge receipt
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error('Telegram webhook error:', error);
      // Still acknowledge to prevent Telegram from retrying
      res.status(200).json({ ok: true });
    }
  }

  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from.id.toString();
    const username = message.from.username || message.from.first_name || 'User';

    logger.info('Telegram message received', { 
      chatId, 
      userId, 
      username,
      text: text?.substring(0, 50) 
    });

    if (!text) {
      await telegramService.sendMessage(chatId, 'Please send a text message.');
      return;
    }

    try {
      // Find or create user
      const user = await User.findOrCreate('telegram', userId, {
        username,
        firstName: message.from.first_name,
        lastName: message.from.last_name,
      });

      // Create conversation record
      const conversationId = uuidv4();
      const conversation = new Conversation({
        conversationId,
        userId: user._id,
        platform: 'telegram',
        messageContent: text,
        intentType: 'unknown', // Will be updated after routing
        metadata: {
          chatId,
          messageId: message.message_id,
        },
      });

      // Route message through message router
      const response = await messageRouter.routeMessage({
        platform: 'telegram',
        userId: user.userId,
        chatId,
        messageText: text,
        metadata: message,
      });

      // Update conversation with intent and response
      conversation.intentType = messageRouter.detectIntent(text);
      conversation.responseContent = response.text;
      await conversation.save();

      // Send response
      await telegramService.sendMessage(chatId, response.text, response.options);

      logger.info('Telegram message processed', { 
        conversationId, 
        intent: conversation.intentType 
      });
    } catch (error) {
      logger.error('Error processing Telegram message:', error);
      await telegramService.sendMessage(
        chatId, 
        'Sorry, I encountered an error processing your message. Please try again.'
      );
    }
  }

  async handleCallback(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const callbackQueryId = callbackQuery.id;

    logger.info('Telegram callback received', { chatId, data });

    try {
      // Acknowledge callback
      await telegramService.answerCallbackQuery(callbackQueryId, 'Processing...', false);

      // Handle callback data (e.g., fact-check buttons)
      // For MVP, we'll just acknowledge
      // Full callback handling will be implemented later

      await telegramService.sendMessage(chatId, 'Callback received. Feature coming soon!');
    } catch (error) {
      logger.error('Error handling Telegram callback:', error);
    }
  }
}

module.exports = new TelegramWebhookController();

