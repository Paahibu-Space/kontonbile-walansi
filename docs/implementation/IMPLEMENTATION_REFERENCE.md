# Implementation Reference Guide

> **Note**: This document is for reference purposes. The MVP has been completed. See `MVP_IMPLEMENTATION_STATUS.md` for current status.

This document provides a comprehensive reference for the implementation architecture, patterns, and code examples used in the Walansi Kontonbile system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Patterns](#implementation-patterns)
3. [Code Examples](#code-examples)
4. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  (WhatsApp, Telegram, SMS, Voice)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  Gateway Layer                          │
│  (API Gateway, Rate Limiting, Validation)              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                 Services Layer                           │
│  (Message Router, Fact-Check, Communication)           │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  Data Layer                             │
│  (MongoDB, Redis Cache)                                 │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Cloud-Agnostic**: All cloud-specific settings via environment variables
2. **Provider Abstraction**: Services use provider patterns for flexibility
3. **Scalable**: Stateless services, horizontal scaling ready
4. **Containerized**: Docker-based deployment
5. **Extensible**: Ready for AI/NLP integration

---

## Implementation Patterns

### 1. Service Pattern

Services are singleton instances that encapsulate business logic:

```javascript
class FactCheckService {
  async verifyClaim(claimText, language, userId) {
    // 1. Normalize input
    // 2. Check cache
    // 3. Call external API
    // 4. Store in database
    // 5. Cache result
    // 6. Return formatted response
  }
}

module.exports = new FactCheckService();
```

### 2. Provider Abstraction Pattern

For cloud-agnostic external services:

```javascript
// Base provider
class BaseProvider {
  async execute(params) {
    throw new Error('Must implement');
  }
}

// Concrete implementations
class GoogleTranslateProvider extends BaseProvider { }
class AWSTranslateProvider extends BaseProvider { }

// Factory
class TranslationFactory {
  static createProvider() {
    const provider = config.translation.provider;
    switch (provider) {
      case 'google': return new GoogleTranslateProvider();
      case 'aws': return new AWSTranslateProvider();
    }
  }
}
```

### 3. Cache-First Pattern

Always check cache before external calls:

```javascript
async verifyClaim(claimText) {
  const cacheKey = CacheManager.factCheckKey(claimText);
  
  // Check cache first
  const cached = await cacheManager.get(cacheKey);
  if (cached) return cached;
  
  // External API call
  const result = await externalAPI.call();
  
  // Cache result
  await cacheManager.set(cacheKey, result, 86400);
  
  return result;
}
```

### 4. Message Routing Pattern

Centralized message routing with intent detection:

```javascript
class MessageRouter {
  async routeMessage({ platform, userId, messageText }) {
    // 1. Detect intent (keyword-based for MVP, AI-ready)
    const intent = this.detectIntent(messageText);
    
    // 2. Route to appropriate handler
    switch (intent) {
      case 'fact-check': return this.handleFactCheck();
      case 'sos': return this.handleSOS();
      default: return this.handleDefault();
    }
  }
}
```

---

## Code Examples

### Database Model Example

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
  // ... more fields
}, {
  timestamps: true,
});

// Static method for find or create
userSchema.statics.findOrCreate = async function(platformType, platformUserId) {
  let user = await this.findOne({ platformType, platformUserId });
  if (!user) {
    user = await this.create({ userId: uuidv4(), platformType, platformUserId });
  }
  return user;
};

module.exports = mongoose.model('User', userSchema);
```

### Service Example

```javascript
const cacheManager = require('../../utils/cache-manager');
const FactCheck = require('../../models/fact-check.model');

class FactCheckService {
  async verifyClaim(claimText, language = 'en') {
    // Normalize
    const normalized = this.normalizeClaim(claimText);
    const cacheKey = CacheManager.factCheckKey(normalized);
    
    // Cache check
    const cached = await cacheManager.get(cacheKey);
    if (cached) return cached;
    
    // API call
    const apiResult = await googleFactCheckClient.searchClaims(normalized, language);
    
    // Store
    const factCheck = await this.createFactCheckRecord({ claimText: normalized, apiResult });
    
    // Format and cache
    const response = this.formatResponse(factCheck, apiResult);
    await cacheManager.set(cacheKey, response, 86400);
    
    return response;
  }
}
```

### Controller Example

```javascript
class FactCheckController {
  async verifyClaim(req, res, next) {
    try {
      const { claimText, language } = req.body;
      const result = await factCheckService.verifyClaim(claimText, language);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

### Webhook Handler Example

```javascript
class TelegramWebhookController {
  async handleWebhook(req, res) {
    try {
      const update = req.body;
      
      if (update.message) {
        await this.handleMessage(update.message);
      }
      
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(200).json({ ok: true }); // Always acknowledge
    }
  }
  
  async handleMessage(message) {
    // 1. Find or create user
    const user = await User.findOrCreate('telegram', message.from.id);
    
    // 2. Route message
    const response = await messageRouter.routeMessage({
      platform: 'telegram',
      userId: user.userId,
      messageText: message.text,
    });
    
    // 3. Send response
    await telegramService.sendMessage(message.chat.id, response.text);
  }
}
```

### Middleware Example

```javascript
// Rate Limiting
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too Many Requests' });
  },
});

// Validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation Error', errors: error.details });
    }
    req.body = value;
    next();
  };
};
```

---

## Future Enhancements

### AI & NLP Integration (Phase 6)

**Language Detection**:
```javascript
// Current: Keyword-based (MVP)
// Future: AI-powered detection
const langResult = await languageDetector.detect(text);
// Returns: { language: 'en', confidence: 0.95 }
```

**Translation Service**:
```javascript
// Provider abstraction ready
const translation = await translationService.translate(
  text, 
  targetLanguage, 
  sourceLanguage
);
```

**Intent Classification**:
```javascript
// Current: Keyword-based (MVP)
// Future: AI-based classification
const intent = await intentClassifier.classify(text);
// Returns: { intent: 'fact-check', confidence: 0.92 }
```

### Additional Communication Channels

**SMS Service**:
```javascript
// Structure ready, implement provider abstraction
class SMSService {
  async sendMessage(to, text) {
    const provider = SMSFactory.createProvider();
    return provider.send(to, text);
  }
}
```

**Voice Service**:
```javascript
// Speech-to-text integration
class VoiceService {
  async transcribe(audioFile) {
    const provider = SpeechToTextFactory.createProvider();
    return provider.transcribe(audioFile);
  }
}
```

### Enhanced Business Logic

**SOS Handler**:
```javascript
// Full implementation with NGO integration
class SOSHandler {
  async handleSOSRequest(userId, messageText) {
    // 1. Detect emergency type
    // 2. Get support resources
    // 3. Escalate if needed
    // 4. Provide guidance
  }
}
```

**Analytics Service**:
```javascript
// Event tracking and insights
class AnalyticsService {
  async trackEvent(eventType, eventData) {
    // Store in database
    // Generate insights
    // Update dashboards
  }
}
```

---

## File Structure Reference

```
src/
├── config/              # Configuration files
│   ├── database.config.js
│   ├── redis.config.js
│   ├── environment.config.js
│   └── external-apis.config.js
│
├── controllers/         # Request handlers
│   ├── fact-check.controller.js
│   └── webhook/
│       ├── telegram.controller.js
│       └── whatsapp.controller.js
│
├── middleware/          # Express middleware
│   ├── rate-limit.middleware.js
│   └── validation.middleware.js
│
├── models/             # Database models
│   ├── user.model.js
│   ├── conversation.model.js
│   ├── fact-check.model.js
│   └── ...
│
├── routes/             # API routes
│   ├── api.routes.js
│   ├── fact-check.routes.js
│   └── webhook.routes.js
│
├── services/           # Business logic
│   ├── business/
│   │   └── fact-check-service.js
│   ├── communication/
│   │   ├── telegram-service.js
│   │   └── whatsapp-service.js
│   ├── external/
│   │   └── google-fact-check.client.js
│   └── gateway/
│       └── message-router.js
│
└── utils/              # Utilities
    ├── cache-manager.js
    └── logger.js
```

---

## Key Patterns Summary

1. **Singleton Services**: Services exported as instances
2. **Provider Abstraction**: Factory pattern for cloud services
3. **Cache-First**: Always check cache before external calls
4. **Error Handling**: Try-catch with logging and graceful degradation
5. **Validation**: Joi schemas for request validation
6. **Rate Limiting**: Applied to all public endpoints
7. **Logging**: Winston with file rotation
8. **Database**: Mongoose with findOrCreate patterns
9. **Webhooks**: Always acknowledge (200 OK) to prevent retries

---

## Environment Variables Reference

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/walansi

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
GOOGLE_FACT_CHECK_API_KEY=your-key
TELEGRAM_BOT_TOKEN=your-token
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id
WHATSAPP_VERIFY_TOKEN=your-token

# Security
JWT_SECRET=your-secret
```

---

## Testing Patterns

### Unit Test Example

```javascript
describe('FactCheckService', () => {
  test('should return cached result', async () => {
    cacheManager.get.mockResolvedValue(mockResult);
    const result = await factCheckService.verifyClaim('test');
    expect(result).toEqual(mockResult);
  });
});
```

### Integration Test Example

```javascript
describe('Fact-Check API', () => {
  test('POST /api/fact-check', async () => {
    const response = await request(app)
      .post('/api/fact-check')
      .send({ claimText: 'test claim' });
    expect(response.status).toBe(200);
  });
});
```

---

## Deployment Patterns

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER nodejs
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### Environment Configuration

All configuration via environment variables - no hardcoded values. Works with:
- AWS (DocumentDB, ElastiCache, S3)
- Azure (Cosmos DB, Azure Cache, Blob Storage)
- GCP (Cloud MongoDB, Memorystore, Cloud Storage)
- MongoDB Atlas

---

## Notes

- This is a reference document for understanding the implementation
- The MVP is complete and functional
- Future enhancements can follow these patterns
- All code follows cloud-agnostic principles
- Architecture supports horizontal scaling

