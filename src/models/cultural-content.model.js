const mongoose = require('mongoose');

const culturalContentSchema = new mongoose.Schema({
  contentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  contentType: {
    type: String,
    required: true,
    enum: ['proverb', 'story', 'saying'],
    index: true,
  },
  language: {
    type: String,
    required: true,
    enum: ['tw', 'dag', 'hausa', 'dagaare', 'waali', 'en'],
    index: true,
  },
  proverbText: {
    type: String,
  },
  storyText: {
    type: String,
  },
  topicCategory: {
    type: String,
    required: true,
    index: true,
  },
  culturalContext: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for queries
culturalContentSchema.index({ language: 1, topicCategory: 1, isActive: 1 });

module.exports = mongoose.model('CulturalContent', culturalContentSchema);

