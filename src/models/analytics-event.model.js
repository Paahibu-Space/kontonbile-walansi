const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['message_received', 'fact_check_requested', 'sos_triggered', 'campaign_generated', 'user_registered'],
    index: true,
  },
  userSegment: {
    type: String,
    index: true,
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  language: {
    type: String,
    index: true,
  },
  geographicRegion: {
    type: String,
    index: true,
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for analytics queries
analyticsEventSchema.index({ eventType: 1, occurredAt: -1 });
analyticsEventSchema.index({ language: 1, occurredAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

