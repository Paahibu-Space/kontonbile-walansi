const whatsappService = require('../../services/communication/whatsapp-service');
const messageRouter = require('../../services/gateway/message-router');
const User = require('../../models/user.model');
const Conversation = require('../../models/conversation.model');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

class WhatsAppWebhookController {
  /**
   * GET /webhooks/whatsapp
   * Webhook verification (required by WhatsApp)
   */
  handleVerification(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verified = whatsappService.verifyWebhook(mode, token, challenge);

    if (verified) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed');
      res.status(403).send('Forbidden');
    }
  }

  /**
   * POST /webhooks/whatsapp
   * Handle WhatsApp webhook
   */
  async handleWebhook(req, res) {
    try {
      const body = req.body;

      // WhatsApp sends a challenge on verification
      if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry[0]?.changes) {
          const change = body.entry[0].changes[0];
          
          if (change.value?.messages) {
            for (const message of change.value.messages) {
              await this.handleMessage(message, change.value);
            }
          }
        }

        // Always respond 200
        res.status(200).send('OK');
      } else {
        res.status(200).send('OK');
      }
    } catch (error) {
      logger.error('WhatsApp webhook error:', error);
      // Still respond 200 to prevent retries
      res.status(200).send('OK');
    }
  }

  async handleMessage(message, metadata) {
    const from = message.from;
    const text = message.text?.body || '';
    const messageId = message.id;

    logger.info('WhatsApp message received', { 
      from, 
      messageId,
      text: text.substring(0, 50) 
    });

    if (!text || text.trim().length === 0) {
      // Mark as read even if no text
      await whatsappService.markAsRead(messageId);
      return;
    }

    try {
      // Mark message as read
      await whatsappService.markAsRead(messageId);

      // Find or create user
      const user = await User.findOrCreate('whatsapp', from, {
        phoneNumber: from,
      });

      // Create conversation record
      const conversationId = uuidv4();
      const conversation = new Conversation({
        conversationId,
        userId: user._id,
        platform: 'whatsapp',
        messageContent: text,
        intentType: 'unknown',
        metadata: {
          from,
          messageId,
        },
      });

      // Route message through message router
      const response = await messageRouter.routeMessage({
        platform: 'whatsapp',
        userId: user.userId,
        chatId: from,
        messageText: text,
        metadata: message,
      });

      // Update conversation with intent and response
      conversation.intentType = messageRouter.detectIntent(text);
      conversation.responseContent = response.text;
      await conversation.save();

      // Send response
      await whatsappService.sendMessage(from, response.text);

      logger.info('WhatsApp message processed', { 
        conversationId, 
        intent: conversation.intentType 
      });
    } catch (error) {
      logger.error('Error processing WhatsApp message:', error);
      try {
        await whatsappService.sendMessage(
          from, 
          'Sorry, I encountered an error processing your message. Please try again.'
        );
      } catch (sendError) {
        logger.error('Failed to send error message:', sendError);
      }
    }
  }
}

module.exports = new WhatsAppWebhookController();

