const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const config = require('./config/environment.config');
const logger = require('./utils/logger');
const databaseConnection = require('./config/database.config');
const redisConnection = require('./config/redis.config');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.app.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: config.app.name,
    version: config.app.version,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', require('./routes/api.routes'));

// Webhook routes (for WhatsApp, Telegram, etc.)
app.use('/webhooks', require('./routes/webhook.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = config.app.env === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    ...(config.app.env !== 'production' && { stack: err.stack }),
  });
});

// Initialize connections and start server
const startServer = async () => {
  try {
    // Connect to database
    await databaseConnection.connect();
    logger.info('Database connection established');

    // Connect to Redis
    await redisConnection.connect();
    logger.info('Redis connection established');

    // Start HTTP server
    const server = app.listen(config.app.port, () => {
      logger.info(`${config.app.name} v${config.app.version} started`);
      logger.info(`Environment: ${config.app.env}`);
      logger.info(`Server listening on port ${config.app.port}`);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const server = startServer();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const currentServer = await server;

  currentServer.close(async () => {
    logger.info('HTTP server closed');

    // Close database connection
    try {
      await databaseConnection.disconnect();
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }

    // Close Redis connection
    try {
      await redisConnection.disconnect();
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }

    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export app and server promise
module.exports = { app, server };

