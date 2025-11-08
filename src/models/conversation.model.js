const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ['whatsapp', 'telegram', 'sms', 'voice'],
    index: true,
  },
  messageContent: {
    type: String,
    required: true,
  },
  intentType: {
    type: String,
    enum: ['question', 'fact-check', 'sos', 'campaign', 'unknown'],
    default: 'unknown',
    index: true,
  },
  languageDetected: {
    type: String,
    index: true,
  },
  responseContent: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Index for user conversations
conversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

