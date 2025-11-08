const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  platformType: {
    type: String,
    required: true,
    enum: ['whatsapp', 'telegram', 'sms', 'voice'],
    index: true,
  },
  platformUserId: {
    type: String,
    required: true,
    index: true,
  },
  preferredLanguage: {
    type: String,
    default: 'en',
    enum: ['en', 'tw', 'dag', 'hausa', 'dagaare', 'waali'],
  },
  anonymousMode: {
    type: Boolean,
    default: false,
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
  lastActive: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for platform lookups
userSchema.index({ platformType: 1, platformUserId: 1 }, { unique: true });

// Update lastActive on save
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Static method to find or create user
userSchema.statics.findOrCreate = async function(platformType, platformUserId, metadata = {}) {
  const user = await this.findOne({ platformType, platformUserId });
  if (user) {
    // Update lastActive
    user.lastActive = new Date();
    await user.save();
    return user;
  }

  // Create new user
  const userId = require('uuid').v4();
  return this.create({
    userId,
    platformType,
    platformUserId,
    metadata,
  });
};

module.exports = mongoose.model('User', userSchema);

