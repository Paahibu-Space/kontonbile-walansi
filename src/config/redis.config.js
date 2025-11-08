const redis = require('redis');
const config = require('./environment.config');
const logger = require('../utils/logger');

/**
 * Redis Cache Connection
 * Cloud-agnostic - works with AWS ElastiCache, Azure Cache, Google Cloud Memorystore, etc.
 */
class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return this.client;
    }

    try {
      const redisConfig = {
        socket: {
          host: config.cache.redis.host,
          port: config.cache.redis.port,
          ...(config.cache.redis.tls && { tls: true }),
        },
        ...(config.cache.redis.password && { password: config.cache.redis.password }),
        database: config.cache.redis.db,
      };

      this.client = redis.createClient(redisConfig);

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      client: this.client ? 'initialized' : 'not initialized',
    };
  }
}

// Singleton instance
const redisConnection = new RedisConnection();

module.exports = redisConnection;

