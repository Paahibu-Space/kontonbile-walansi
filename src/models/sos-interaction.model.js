const mongoose = require('mongoose');

const sosInteractionSchema = new mongoose.Schema({
  sosId: {
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
  triggerKeyword: {
    type: String,
    required: true,
    index: true,
  },
  supportType: {
    type: String,
    required: true,
    enum: ['harassment', 'violence', 'abuse', 'mental-health', 'other'],
    index: true,
  },
  responseProvided: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  escalated: {
    type: Boolean,
    default: false,
    index: true,
  },
  ngoContact: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SOSInteraction', sosInteractionSchema);

