# Detailed Implementation Plan: Start to Finish

> **Note**: This is a comprehensive implementation guide. The MVP has been completed. See `MVP_IMPLEMENTATION_STATUS.md` for current status. This document serves as a reference for understanding the complete implementation approach.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Database & Infrastructure](#phase-2-database--infrastructure)
5. [Phase 3: External API Integrations](#phase-3-external-api-integrations)
6. [Phase 4: Core Business Services](#phase-4-core-business-services)
7. [Phase 5: Communication Services](#phase-5-communication-services)
8. [Phase 6: AI & NLP Services](#phase-6-ai--nlp-services)
9. [Phase 7: Business Logic Services](#phase-7-business-logic-services)
10. [Phase 8: Security & API Gateway](#phase-8-security--api-gateway)
11. [Phase 9: Message Routing & Orchestration](#phase-9-message-routing--orchestration)
12. [Phase 10: Testing](#phase-10-testing)
13. [Phase 11: Deployment](#phase-11-deployment)
14. [Timeline & Milestones](#timeline--milestones)

---

## Project Overview

**Goal**: Build a cloud-agnostic, containerized multi-platform messaging service for fact-checking, cultural education, and emergency support.

**Key Features**:
- Multi-platform messaging (WhatsApp, Telegram, SMS, Voice)
- Google Fact Check API integration
- AI-powered cultural education
- Emergency SOS handling
- Multi-language support (Twi, Dagbani, Hausa, Dagaare, Waali, English)
- Analytics and reporting

**Technology Stack**:
- Backend: Node.js 18+, Express.js
- Database: MongoDB (Mongoose)
- Cache: Redis
- Containerization: Docker, Docker Compose
- Testing: Jest, Supertest

---

## Prerequisites & Setup

### Required Tools

```bash
# Verify installations
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
docker --version
docker-compose --version
git --version
```

### Initial Setup

```bash
# 1. Clone/navigate to project
cd walansi-kontonbile

# 2. Install dependencies
npm install

# 3. Set up environment
cp env.example .env

# 4. Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to .env as JWT_SECRET

# 5. Start infrastructure services
docker-compose up -d mongodb redis

# 6. Verify services are running
docker-compose ps
curl http://localhost:3000/health
```

---

## Phase 1: Foundation ✅

**Status**: COMPLETED

**What's Done**:
- ✅ Project structure
- ✅ Docker containerization
- ✅ Environment configuration
- ✅ Express server setup
- ✅ Logging system
- ✅ Health check endpoint
- ✅ Database connection utilities
- ✅ Redis connection utilities

**Validation**:
```bash
# Test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"healthy","service":"walansi-kontonbile",...}
```

---

## Phase 2: Database & Infrastructure

### Step 2.1: Cache Manager Utility

**File**: `src/utils/cache-manager.js`

**Implementation**:

```javascript
const redisConnection = require('../config/redis.config');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
  }

  async initialize() {
    this.client = await redisConnection.getClient();
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
    const hash = require('crypto')
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
}

module.exports = new CacheManager();
```

### Step 2.2: Database Models

**Files Created**:

#### `src/models/user.model.js`

```javascript
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
    user.lastActive = new Date();
    await user.save();
    return user;
  }

  const userId = require('uuid').v4();
  return this.create({
    userId,
    platformType,
    platformUserId,
    metadata,
  });
};

module.exports = mongoose.model('User', userSchema);
```

**All other models follow similar patterns** - see `src/models/` for complete implementations.

**Checkpoint**: All models created, database connection working, can create/read records.

---

## Phase 3: External API Integrations

### Step 3.1: Google Fact Check API Client

**File**: `src/services/external/google-fact-check.client.js`

**Implementation**:

```javascript
const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class GoogleFactCheckClient {
  constructor() {
    this.apiKey = config.googleFactCheck.apiKey;
    this.baseUrl = config.googleFactCheck.apiUrl;
    this.timeout = 10000; // 10 seconds
  }

  async searchClaims(query, languageCode = 'en') {
    if (!this.apiKey) {
      throw new Error('Google Fact Check API key not configured');
    }

    try {
      const url = `${this.baseUrl}/claims:search`;
      const params = {
        key: this.apiKey,
        query: query.substring(0, 500),
        languageCode,
        pageSize: 10,
      };

      logger.info('Google Fact Check API request', { 
        query: query.substring(0, 100), 
        languageCode 
      });

      const response = await axios.get(url, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
        },
      });

      return this.formatResponse(response.data);
    } catch (error) {
      logger.error('Google Fact Check API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 403) {
        throw new Error('API key invalid or quota exceeded');
      }

      throw new Error(`Fact-check API error: ${error.message}`);
    }
  }

  formatResponse(data) {
    if (!data.claims || data.claims.length === 0) {
      return {
        found: false,
        claims: [],
      };
    }

    const claims = data.claims.map((claim) => ({
      claimText: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      review: claim.claimReview?.map((review) => ({
        publisher: review.publisher?.name,
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode,
      })) || [],
    }));

    const ratings = claims.flatMap(c => c.review.map(r => r.textualRating?.toLowerCase() || ''));
    const overallRating = this.determineOverallRating(ratings);

    return {
      found: true,
      overallRating,
      claims,
      totalResults: data.claims.length,
    };
  }

  determineOverallRating(ratings) {
    if (ratings.length === 0) return 'unverified';

    const falseKeywords = ['false', 'incorrect', 'misleading', 'pants on fire'];
    const trueKeywords = ['true', 'correct', 'accurate'];
    const misleadingKeywords = ['misleading', 'mostly false', 'half true'];

    const lowerRatings = ratings.map(r => r.toLowerCase());

    if (lowerRatings.some(r => falseKeywords.some(k => r.includes(k)))) {
      return 'false';
    }
    if (lowerRatings.some(r => misleadingKeywords.some(k => r.includes(k)))) {
      return 'misleading';
    }
    if (lowerRatings.some(r => trueKeywords.some(k => r.includes(k)))) {
      return 'true';
    }

    return 'unverified';
  }
}

module.exports = new GoogleFactCheckClient();
```

**Checkpoint**: Google Fact Check API client working, provider abstraction pattern established.

---

## Phase 4: Core Business Services

### Step 4.1: Fact-Check Service

**File**: `src/services/business/fact-check-service.js`

**Implementation**:

```javascript
const { v4: uuidv4 } = require('uuid');
const googleFactCheckClient = require('../external/google-fact-check.client');
const cacheManager = require('../../utils/cache-manager');
const FactCheck = require('../../models/fact-check.model');
const logger = require('../../utils/logger');

class FactCheckService {
  async verifyClaim(claimText, language = 'en', userId = null) {
    if (!claimText || claimText.trim().length === 0) {
      throw new Error('Claim text is required');
    }

    const normalizedClaim = this.normalizeClaim(claimText);
    const cacheKey = cacheManager.constructor.factCheckKey(normalizedClaim);

    // Check cache first
    const cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
      logger.info('Fact-check cache hit', { claim: normalizedClaim.substring(0, 50) });
      return cachedResult;
    }

    // Query Google Fact Check API
    logger.info('Fact-check cache miss, querying API', { claim: normalizedClaim.substring(0, 50) });
    const apiResult = await googleFactCheckClient.searchClaims(normalizedClaim, language);

    // Create fact-check record
    const factCheck = await this.createFactCheckRecord({
      claimText: normalizedClaim,
      apiResult,
      language,
      userId,
    });

    // Format response
    const response = this.formatResponse(factCheck, apiResult);

    // Cache result (24 hours)
    await cacheManager.set(cacheKey, response, 86400);

    return response;
  }

  normalizeClaim(claimText) {
    return claimText
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 500);
  }

  async createFactCheckRecord({ claimText, apiResult, language, userId }) {
    const factId = uuidv4();
    const verificationStatus = apiResult.found
      ? apiResult.overallRating
      : 'unverified';

    const factCheck = new FactCheck({
      factId,
      claimText,
      verificationStatus,
      explanation: this.generateExplanation(apiResult),
      language,
      sourceUrl: apiResult.claims?.[0]?.review?.[0]?.url,
      evidenceLinks: this.extractEvidenceLinks(apiResult),
      googleFactCheckData: apiResult,
    });

    await factCheck.save();
    logger.info('Fact-check record created', { factId, verificationStatus });

    return factCheck;
  }

  generateExplanation(apiResult) {
    if (!apiResult.found) {
      return 'No fact-check information found for this claim.';
    }

    const firstReview = apiResult.claims?.[0]?.review?.[0];
    if (firstReview) {
      return `According to ${firstReview.publisher || 'fact-checkers'}, this claim is ${apiResult.overallRating}.`;
    }

    return `Fact-check status: ${apiResult.overallRating}`;
  }

  extractEvidenceLinks(apiResult) {
    if (!apiResult.claims) return [];

    return apiResult.claims
      .flatMap(claim => claim.review || [])
      .map(review => review.url)
      .filter(url => url);
  }

  formatResponse(factCheck, apiResult) {
    return {
      factId: factCheck.factId,
      claimText: factCheck.claimText,
      verificationStatus: factCheck.verificationStatus,
      explanation: factCheck.explanation,
      sourceUrl: factCheck.sourceUrl,
      evidenceLinks: factCheck.evidenceLinks,
      verifiedAt: factCheck.verifiedAt,
      found: apiResult.found,
    };
  }

  async getFactCheckById(factId) {
    const factCheck = await FactCheck.findOne({ factId });
    if (!factCheck) {
      throw new Error('Fact-check not found');
    }
    return factCheck;
  }

  async searchFactChecks(query, limit = 10) {
    return FactCheck.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
  }
}

module.exports = new FactCheckService();
```

### Step 4.2: Fact-Check Controller & Routes

**Files**: 
- `src/controllers/fact-check.controller.js`
- `src/routes/fact-check.routes.js`

**Checkpoint**: Fact-check service working end-to-end, can verify claims via API.

---

## Phase 5: Communication Services

### Step 5.1: Telegram Service

**File**: `src/services/communication/telegram-service.js`

**Implementation**:

```javascript
const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.apiUrl = `${config.telegram.apiUrl}${this.botToken}`;
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const url = `${this.apiUrl}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        reply_markup: options.replyMarkup,
        ...options,
      };

      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      logger.error('Telegram send message error:', error.response?.data || error.message);
      throw new Error(`Failed to send Telegram message: ${error.message}`);
    }
  }

  async sendMessageWithKeyboard(chatId, text, buttons) {
    const keyboard = {
      inline_keyboard: buttons.map(row =>
        row.map(btn => ({
          text: btn.text,
          callback_data: btn.callbackData,
        }))
      ),
    };

    return this.sendMessage(chatId, text, {
      reply_markup: keyboard,
    });
  }

  async getMe() {
    try {
      const url = `${this.apiUrl}/getMe`;
      const response = await axios.get(url);
      return response.data.result;
    } catch (error) {
      logger.error('Telegram getMe error:', error);
      throw error;
    }
  }

  async setWebhook(url) {
    try {
      const webhookUrl = `${this.apiUrl}/setWebhook`;
      const response = await axios.post(webhookUrl, { url });
      return response.data;
    } catch (error) {
      logger.error('Telegram setWebhook error:', error);
      throw error;
    }
  }
}

module.exports = new TelegramService();
```

### Step 5.2: Telegram Webhook Controller

**File**: `src/controllers/webhook/telegram.controller.js`

**Checkpoint**: Telegram bot receiving messages and responding.

### Step 5.3: WhatsApp Service

**File**: `src/services/communication/whatsapp-service.js`

**Implementation**:

```javascript
const axios = require('axios');
const config = require('../../config/external-apis.config');
const logger = require('../../utils/logger');

class WhatsAppService {
  constructor() {
    this.token = config.whatsapp.token;
    this.apiUrl = config.whatsapp.apiUrl;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.verifyToken = config.whatsapp.verifyToken;
  }

  async sendMessage(to, text) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('WhatsApp send message error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  async markAsRead(messageId) {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('WhatsApp mark as read error:', error);
      return null;
    }
  }
}

module.exports = new WhatsAppService();
```

---

## Phase 6: AI & NLP Services

### Step 6.1: Language Detection Service

**File**: `src/services/ai-nlp/language-detector.js`

**Implementation** (Ready for future):

```javascript
const TranslationFactory = require('../external/providers/translation/translation-factory');
const cacheManager = require('../../utils/cache-manager');
const logger = require('../../utils/logger');

class LanguageDetector {
  constructor() {
    this.provider = TranslationFactory.createProvider();
    this.supportedLanguages = {
      'en': 'English',
      'tw': 'Twi',
      'dag': 'Dagbani',
      'hausa': 'Hausa',
      'dagaare': 'Dagaare',
      'waali': 'Waali',
    };
  }

  async detect(text) {
    if (!text || text.trim().length < 3) {
      return { language: 'en', confidence: 0.5 };
    }

    const cacheKey = `lang:detect:${require('crypto').createHash('md5').update(text).digest('hex')}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const detected = await this.provider.detectLanguage(text);
      const result = {
        language: this.mapToInternalCode(detected),
        confidence: 0.9,
        originalCode: detected,
      };

      await cacheManager.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      logger.error('Language detection error:', error);
      return this.fallbackDetection(text);
    }
  }

  mapToInternalCode(googleCode) {
    const mapping = {
      'en': 'en',
      'ak': 'tw',
      'ha': 'hausa',
    };
    return mapping[googleCode] || 'en';
  }

  fallbackDetection(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('help') || lowerText.includes('sos')) {
      return { language: 'en', confidence: 0.6 };
    }
    return { language: 'en', confidence: 0.5 };
  }
}

module.exports = new LanguageDetector();
```

### Step 6.2: Translation Service

**File**: `src/services/ai-nlp/translation-service.js`

**Implementation** (Ready for future):

```javascript
const TranslationFactory = require('../external/providers/translation/translation-factory');
const cacheManager = require('../../utils/cache-manager');
const logger = require('../../utils/logger');

class TranslationService {
  constructor() {
    this.provider = TranslationFactory.createProvider();
  }

  async translate(text, targetLanguage, sourceLanguage = null) {
    if (!text) return text;
    if (targetLanguage === sourceLanguage) return text;

    const cacheKey = `trans:${sourceLanguage || 'auto'}:${targetLanguage}:${require('crypto').createHash('md5').update(text).digest('hex')}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.provider.translate(text, targetLanguage, sourceLanguage);
      await cacheManager.set(cacheKey, result.translatedText, 86400);
      return result.translatedText;
    } catch (error) {
      logger.error('Translation error:', error);
      return text;
    }
  }
}

module.exports = new TranslationService();
```

### Step 6.3: Intent Classification

**File**: `src/services/ai-nlp/intent-classifier.js`

**Current MVP**: Keyword-based (see `message-router.js`)
**Future**: AI-powered classification

---

## Phase 7: Business Logic Services

### Step 7.1: SOS Handler

**File**: `src/services/business/sos-handler.js`

**Current MVP**: Basic response in message router
**Future**: Full implementation with NGO integration

### Step 7.2: Campaign Generator

**Status**: Not implemented in MVP
**Future**: Content generation with media creation

### Step 7.3: Analytics Service

**Status**: Database model ready
**Future**: Event tracking and insights

---

## Phase 8: Security & API Gateway

### Step 8.1: Authentication Middleware

**File**: `src/middleware/auth.middleware.js`

**Implementation**:

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/environment.config');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

module.exports = { authenticate };
```

### Step 8.2: Rate Limiting Middleware

**File**: `src/middleware/rate-limit.middleware.js`

**Implementation**:

```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config/environment.config');

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  },
});

const webhookRateLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Webhook rate limit exceeded.',
    });
  },
});

module.exports = {
  apiRateLimiter,
  webhookRateLimiter,
};
```

### Step 8.3: Validation Middleware

**File**: `src/middleware/validation.middleware.js`

**Implementation**:

```javascript
const Joi = require('joi');
const logger = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', { errors, body: req.body });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

const schemas = {
  factCheck: Joi.object({
    claimText: Joi.string().required().min(3).max(1000).trim(),
    language: Joi.string().optional().length(2).default('en'),
  }),
};

module.exports = {
  validate,
  schemas,
};
```

---

## Phase 9: Message Routing

### Step 9.1: Message Router

**File**: `src/services/gateway/message-router.js`

**Current MVP**: Keyword-based intent detection
**Future**: AI-powered intent classification

**Implementation**:

```javascript
const factCheckService = require('../business/fact-check-service');
const logger = require('../../utils/logger');

class MessageRouter {
  constructor() {
    this.intentKeywords = {
      'fact-check': ['verify', 'check', 'true', 'false', 'fact', 'claim', 'news'],
      'sos': ['help', 'emergency', 'sos', 'danger', 'harassment', 'abuse', 'violence'],
      'question': ['how', 'what', 'why', 'when', 'where', 'explain', 'tell me'],
    };
  }

  async routeMessage({ platform, userId, chatId, messageText, metadata = {} }) {
    try {
      if (!messageText || messageText.trim().length === 0) {
        return {
          text: 'Please send a message. I can help you with fact-checking and more!',
          options: {},
        };
      }

      const intent = this.detectIntent(messageText);
      const language = 'en'; // Default for MVP

      logger.info('Message routed', {
        platform,
        userId,
        intent,
        language,
      });

      switch (intent) {
        case 'fact-check':
          return await this.handleFactCheck(messageText, language);
        case 'sos':
          return await this.handleSOS(messageText);
        case 'question':
          return await this.handleQuestion(messageText);
        default:
          return await this.handleDefault(messageText);
      }
    } catch (error) {
      logger.error('Message routing error:', error);
      return {
        text: 'Sorry, I encountered an error. Please try again.',
        options: {},
      };
    }
  }

  detectIntent(text) {
    const lowerText = text.toLowerCase();
    
    if (this.intentKeywords.sos.some(keyword => lowerText.includes(keyword))) {
      return 'sos';
    }
    if (this.intentKeywords['fact-check'].some(keyword => lowerText.includes(keyword))) {
      return 'fact-check';
    }
    if (this.intentKeywords.question.some(keyword => lowerText.includes(keyword))) {
      return 'question';
    }
    return 'unknown';
  }

  async handleFactCheck(messageText, language) {
    try {
      const result = await factCheckService.verifyClaim(messageText, language);
      const statusEmoji = {
        'false': '❌',
        'true': '✅',
        'misleading': '⚠️',
        'unverified': '❓',
      };
      const emoji = statusEmoji[result.verificationStatus] || '❓';

      let responseText = `${emoji} <b>Fact-Check Result</b>\n\n`;
      responseText += `Status: <b>${result.verificationStatus.toUpperCase()}</b>\n`;
      responseText += `\n${result.explanation}`;
      
      if (result.sourceUrl) {
        responseText += `\n\nSource: ${result.sourceUrl}`;
      }

      return {
        text: responseText,
        options: { parseMode: 'HTML' },
      };
    } catch (error) {
      logger.error('Fact-check routing error:', error);
      return {
        text: 'Sorry, I could not verify that claim. Please try again.',
        options: {},
      };
    }
  }

  async handleSOS(messageText) {
    return {
      text: `🚨 <b>Emergency Support</b>\n\n` +
            `If you're in immediate danger, please:\n` +
            `1. Call emergency services: 911\n` +
            `2. Get to a safe location\n` +
            `3. Contact trusted friends or family`,
      options: { parseMode: 'HTML' },
    };
  }

  async handleQuestion(messageText) {
    return {
      text: 'I understand you have a question. The AI-powered cultural education feature is coming soon!',
      options: {},
    };
  }

  async handleDefault(messageText) {
    return {
      text: '👋 <b>Hello! I\'m Walansi Kontonbile</b>\n\n' +
            'I can help you with:\n' +
            '• <b>Fact-checking</b> - Send me a claim to verify\n' +
            '• <b>Emergency support</b> - Type "help" or "sos"\n\n' +
            'How can I assist you?',
      options: { parseMode: 'HTML' },
    };
  }
}

module.exports = new MessageRouter();
```

---

## Phase 10: Testing

### Step 10.1: Test Setup

**File**: `tests/setup.js`

```javascript
const databaseConnection = require('../src/config/database.config');
const redisConnection = require('../src/config/redis.config');

beforeAll(async () => {
  await databaseConnection.connect();
  await redisConnection.connect();
});

afterAll(async () => {
  await databaseConnection.disconnect();
  await redisConnection.disconnect();
});
```

### Step 10.2: Unit Tests

**Example**: `tests/unit/services/business/fact-check-service.test.js`

```javascript
const factCheckService = require('../../../../src/services/business/fact-check-service');
const cacheManager = require('../../../../src/utils/cache-manager');

jest.mock('../../../../src/services/external/google-fact-check.client');
jest.mock('../../../../src/utils/cache-manager');

describe('FactCheckService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return cached result if available', async () => {
    const mockCachedResult = { factId: 'test-id', verificationStatus: 'false' };
    cacheManager.get.mockResolvedValue(mockCachedResult);

    const result = await factCheckService.verifyClaim('test claim');

    expect(cacheManager.get).toHaveBeenCalled();
    expect(result).toEqual(mockCachedResult);
  });

  test('should throw error for empty claim', async () => {
    await expect(factCheckService.verifyClaim('')).rejects.toThrow('Claim text is required');
  });
});
```

---

## Phase 11: Deployment

### Step 11.1: CI/CD Pipeline

**File**: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t walansi-kontonbile:latest .
```

### Step 11.2: Deployment Script

**File**: `infrastructure/scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "Deploying Walansi Kontonbile..."

# Build image
docker build -t walansi-kontonbile:latest .

# Tag for registry
docker tag walansi-kontonbile:latest your-registry/walansi-kontonbile:latest

# Push to registry
docker push your-registry/walansi-kontonbile:latest

# Deploy (example for Kubernetes)
kubectl set image deployment/walansi-kontonbile \
  app=your-registry/walansi-kontonbile:latest

echo "Deployment complete!"
```

---

## Timeline & Milestones

### Week 1: Foundation & Database
- ✅ Phase 1: Foundation (DONE)
- ✅ Phase 2: Database models, cache manager
- **Milestone**: Can store and retrieve data

### Week 2: Fact-Checking
- ✅ Phase 3: Google Fact Check API
- ✅ Phase 4: Fact-check service
- **Milestone**: Can verify claims via API

### Week 3: Communication (Telegram)
- ✅ Phase 5: Telegram service
- ✅ Integration with fact-check
- **Milestone**: Telegram bot working end-to-end

### Week 4: Communication (WhatsApp)
- ✅ WhatsApp service
- **Milestone**: Multi-platform messaging

### Week 5-6: Security & Routing
- ✅ Phase 8: Security middleware
- ✅ Phase 9: Message routing
- **Milestone**: Production-ready security

### Future: AI/NLP & Additional Features
- Phase 6: AI & NLP Services
- Phase 7: Enhanced Business Logic
- Phase 10: Comprehensive Testing
- Phase 11: Full Deployment

---

## Validation Checklist

After each phase, verify:

- [ ] Code follows project structure
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Tests written (unit/integration)
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] No hardcoded values
- [ ] Cloud-agnostic patterns followed

---

## Common Pitfalls & Solutions

1. **API Rate Limiting**: Implement retry logic with exponential backoff
2. **Database Connection Issues**: Use connection pooling, handle reconnections
3. **Cache Invalidation**: Set appropriate TTLs, implement cache warming
4. **Error Handling**: Always catch and log errors, return user-friendly messages
5. **Security**: Never log sensitive data, validate all inputs, use HTTPS

---

## Notes

- This plan covers the complete implementation approach
- MVP phases (1-5, 8-9) are completed
- Future phases (6-7, 10-11) are documented for reference
- All code follows cloud-agnostic principles
- Architecture supports horizontal scaling

