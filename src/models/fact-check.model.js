const mongoose = require('mongoose');

const factCheckSchema = new mongoose.Schema({
  factId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  claimText: {
    type: String,
    required: true,
    index: 'text',
  },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['true', 'false', 'misleading', 'unverified'],
    index: true,
  },
  sourceUrl: {
    type: String,
  },
  explanation: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    index: true,
  },
  evidenceLinks: {
    type: [String],
    default: [],
  },
  googleFactCheckData: {
    type: mongoose.Schema.Types.Mixed,
  },
  verifiedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Text index for search
factCheckSchema.index({ claimText: 'text' });

module.exports = mongoose.model('FactCheck', factCheckSchema);

