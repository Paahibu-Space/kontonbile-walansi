const redisConnection = require('../config/redis.config');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
  }

  async initialize() {
    if (!this.client) {
      this.client = await redisConnection.getClient();
    }
    return this.client;
  }

  async get(key) {
    try {
      if (!this.client) await this.initialize();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      if (!this.client) await this.initialize();
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      if (!this.client) await this.initialize();
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.client) await this.initialize();
      return await this.client.exists(key) === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Generate cache key helpers
  static factCheckKey(claimText) {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('md5')
      .update(claimText.toLowerCase().trim())
      .digest('hex');
    return `factcheck:${hash}`;
  }

  static userKey(userId) {
    return `user:${userId}`;
  }

  static conversationKey(conversationId) {
    return `conversation:${conversationId}`;
  }

  static intentKey(text) {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('md5')
      .update(text.toLowerCase().trim())
      .digest('hex');
    return `intent:${hash}`;
  }
}

module.exports = new CacheManager();

