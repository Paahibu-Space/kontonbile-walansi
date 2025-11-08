const mongoose = require('mongoose');
const config = require('./environment.config');
const logger = require('../utils/logger');

/**
 * MongoDB Database Connection
 * Cloud-agnostic - works with MongoDB Atlas, AWS DocumentDB, Azure Cosmos DB, etc.
 */
class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      logger.info('Database already connected');
      return this.connection;
    }

    try {
      mongoose.set('strictQuery', false);

      this.connection = await mongoose.connect(
        config.database.mongodb.uri,
        config.database.mongodb.options,
      );

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
    };
  }
}

// Singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;

