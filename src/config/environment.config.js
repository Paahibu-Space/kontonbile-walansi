require('dotenv').config();

/**
 * Cloud-agnostic environment configuration
 * All cloud-specific settings are configured via environment variables
 */
const config = {
  app: {
    name: process.env.APP_NAME || 'walansi-kontonbile',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
  },

  database: {
    // MongoDB - works with MongoDB Atlas, AWS DocumentDB, Azure Cosmos DB, etc.
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/walansi',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
  },

  cache: {
    // Redis - works with AWS ElastiCache, Azure Cache, Google Cloud Memorystore, etc.
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === 'true',
      db: parseInt(process.env.REDIS_DB, 10) || 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  externalApis: {
    googleFactCheck: {
      apiKey: process.env.GOOGLE_FACT_CHECK_API_KEY,
      apiUrl: process.env.GOOGLE_FACT_CHECK_API_URL || 'https://factchecktools.googleapis.com/v1alpha1',
    },

    whatsapp: {
      token: process.env.WHATSAPP_API_TOKEN,
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    },

    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      apiUrl: process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot',
    },

    sms: {
      provider: process.env.SMS_PROVIDER || 'twilio',
      apiKey: process.env.SMS_PROVIDER_API_KEY,
      apiSecret: process.env.SMS_PROVIDER_API_SECRET,
      fromNumber: process.env.SMS_PROVIDER_FROM_NUMBER,
      // Cloud-specific configs handled by provider abstraction
    },

    translation: {
      provider: process.env.TRANSLATION_PROVIDER || 'google',
      apiKey: process.env.TRANSLATION_API_KEY,
      apiSecret: process.env.TRANSLATION_API_SECRET,
      // Cloud-specific configs handled by provider abstraction
    },

    languageDetection: {
      provider: process.env.LANGUAGE_DETECTION_PROVIDER || 'google',
    },

    speechToText: {
      provider: process.env.SPEECH_TO_TEXT_PROVIDER || 'google',
      apiKey: process.env.SPEECH_TO_TEXT_API_KEY,
      apiSecret: process.env.SPEECH_TO_TEXT_API_SECRET,
    },

    ai: {
      provider: process.env.AI_PROVIDER || 'openai',
      apiKey: process.env.AI_API_KEY,
      apiSecret: process.env.AI_API_SECRET,
      apiUrl: process.env.AI_API_URL,
      model: process.env.AI_MODEL || 'gpt-4',
    },

    mediaGeneration: {
      provider: process.env.MEDIA_GENERATION_PROVIDER || 'openai',
      apiKey: process.env.MEDIA_GENERATION_API_KEY,
    },
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    bucket: process.env.STORAGE_BUCKET || 'walansi-media',
    // Cloud-specific credentials handled by provider abstraction
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    },
    azure: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    },
    gcs: {
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
  },
};

// Validate required environment variables
const validateConfig = () => {
  const required = [
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.app.env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

validateConfig();

module.exports = config;

