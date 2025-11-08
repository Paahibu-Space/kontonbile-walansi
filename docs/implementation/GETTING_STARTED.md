# Getting Started

## Overview

This guide will help you get started with the Walansi Kontonbile system. The system is **cloud-agnostic** and **containerized**, allowing deployment to any cloud provider (AWS, Azure, GCP, etc.) without code changes.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Basic understanding of:
  - Node.js/Express
  - MongoDB
  - Redis
  - REST APIs
  - Webhooks

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Edit .env with your configuration
# At minimum, set:
# - JWT_SECRET (generate a secure random string)
# - MONGODB_URI (or use local MongoDB from docker-compose)
# - REDIS_HOST (or use local Redis from docker-compose)
```

### 2. Start with Docker Compose (Development)

```bash
# Start all services (app, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 3. Start Locally (Development)

```bash
# Start MongoDB and Redis separately, or use docker-compose for just those:
docker-compose up -d mongodb redis

# Start the application
npm run dev
```

The application will be available at `http://localhost:3000`

## Current Status

The MVP is complete and ready for use. See `MVP_IMPLEMENTATION_STATUS.md` for details on what's been implemented.

### Available Features

- ✅ Fact-checking via REST API
- ✅ Telegram bot integration
- ✅ WhatsApp bot integration
- ✅ User and conversation tracking
- ✅ Rate limiting and validation

## Cloud-Agnostic Architecture

### Key Principles

1. **Environment Variables**: All cloud-specific settings use environment variables
2. **Provider Abstraction**: Services use provider abstractions (e.g., `translation-provider`, `storage-provider`)
3. **No Hardcoded URLs**: All endpoints and credentials come from environment variables
4. **Standard Protocols**: Use standard protocols (MongoDB wire protocol, Redis protocol, HTTP/REST)

### Example: Switching Cloud Providers

**Database:**
```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/walansi

# MongoDB Atlas (GCP)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/walansi

# AWS DocumentDB
MONGODB_URI=mongodb://user:pass@docdb-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com:27017/walansi?tls=true

# Azure Cosmos DB
MONGODB_URI=mongodb://user:pass@account.mongo.cosmos.azure.com:10255/walansi?ssl=true
```

**Storage:**
```bash
# Local
STORAGE_PROVIDER=local

# AWS S3
STORAGE_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Azure Blob
STORAGE_PROVIDER=azure-blob
AZURE_STORAGE_CONNECTION_STRING=...

# Google Cloud Storage
STORAGE_PROVIDER=gcs
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/fact-check-service
   ```

2. **Implement Feature**
   - Write service/controller
   - Add tests
   - Update documentation

3. **Test Locally**
   ```bash
   npm test
   docker-compose up -d
   npm run dev
   ```

4. **Test in Container**
   ```bash
   docker-compose build
   docker-compose up
   ```

5. **Deploy to Cloud**
   - Update environment variables
   - Deploy container (ECS, AKS, GKE, etc.)
   - Configure managed services (MongoDB Atlas, ElastiCache, etc.)

## Testing Strategy

1. **Unit Tests**: Test individual services and utilities
2. **Integration Tests**: Test service interactions
3. **E2E Tests**: Test complete workflows
4. **Load Tests**: Test under production-like load

## Next Steps

1. Review the architecture documents in `docs/architecture/`
2. Review the sequence diagrams in `docs/workflows/sequence-diagrams/`
3. Configure environment variables (see `env.example`)
4. Set up webhooks for Telegram and WhatsApp
5. Test the API endpoints and bot integrations

## Getting Help

- Review existing documentation in `docs/`
- Check code comments in service files
- Review architecture diagrams
- Follow the established patterns in existing code

## Important Notes

- **Never commit `.env` files** - use `env.example` as template
- **Always use environment variables** for configuration
- **Follow the cloud-agnostic patterns** - no hardcoded cloud-specific code
- **Write tests** for new features
- **Update documentation** when adding features

