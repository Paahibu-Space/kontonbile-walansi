# General Guidelines

1. Use kebab-case for directories: ai-nlp, fact-check
2. Use kebab-case for files: whatsapp-service.js, cultural-content.model.js
3. Be descriptive but concise
4. Include file type suffix: .service.js, .model.js, .controller.js

walansi-kontonbile/
├── docs/
│   ├── architecture/
│   │   ├── 01-system-architecture.md
│   │   ├── 02-microservices-design.md
│   │   ├── 03-data-architecture.md
│   │   ├── 04-security-architecture.md
│   │   └── 05-deployment-architecture.md
│   ├── requirements/
│   │   ├── business-requirements.md
│   │   ├── functional-requirements.md
│   │   ├── non-functional-requirements.md
│   │   └── technical-requirements.md
│   ├── design/
│   │   ├── api-specifications.md
│   │   ├── database-schema.md
│   │   ├── ui-ux-guidelines.md
│   │   └── cultural-context-guide.md
│   └── workflows/
│       ├── user-journeys.md
│       ├── sequence-diagrams.md
│       └── deployment-process.md
├── src/
│   ├── services/
│   │   ├── communication/
│   │   │   ├── whatsapp-service.js
│   │   │   ├── telegram-service.js
│   │   │   ├── sms-service.js
│   │   │   └── voice-service.js
│   │   ├── ai-nlp/
│   │   │   ├── language-detector.js
│   │   │   ├── translation-service.js
│   │   │   ├── cultural-context.js
│   │   │   └── story-teacher.js
│   │   ├── business/
│   │   │   ├── fact-check-service.js
│   │   │   ├── sos-handler.js
│   │   │   ├── campaign-generator.js
│   │   │   └── analytics-service.js
│   │   └── gateway/
│   │       ├── api-gateway.js
│   │       ├── auth-service.js
│   │       ├── rate-limiter.js
│   │       └── load-balancer.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── conversation.model.js
│   │   ├── cultural-content.model.js
│   │   ├── fact-check.model.js
│   │   └── analytics.model.js
│   ├── controllers/
│   │   ├── message.controller.js
│   │   ├── fact-check.controller.js
│   │   ├── sos.controller.js
│   │   └── analytics.controller.js
│   ├── routes/
│   │   ├── api.routes.js
│   │   ├── webhook.routes.js
│   │   └── admin.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   └── error-handler.middleware.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── cache-manager.js
│   │   ├── encryption.js
│   │   └── validators.js
│   └── config/
│       ├── database.config.js
│       ├── redis.config.js
│       ├── external-apis.config.js
│       └── environment.config.js
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── integration/
│   │   ├── api-tests/
│   │   └── database-tests/
│   └── e2e/
│       ├── user-workflows/
│       └── platform-tests/
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── modules/
│   └── scripts/
│       ├── setup.sh
│       ├── deploy.sh
│       └── backup.sh
├── data/
│   ├── cultural-content/
│   │   ├── proverbs-twi.json
│   │   ├── proverbs-dagbani.json
│   │   ├── proverbs-hausa.json
│   │   └── stories-waali.json
│   ├── translations/
│   │   ├── en-translations.json
│   │   ├── twi-translations.json
│   │   └── dagbani-translations.json
│   └── seed-data/
│       ├── initial-users.json
│       └── support-directory.json
└── monitoring/
    ├── prometheus/
    │   └── prometheus.yml
    ├── grafana/
    │   └── dashboards/
    └── elk/
        ├── logstash.conf
        └── elasticsearch.yml