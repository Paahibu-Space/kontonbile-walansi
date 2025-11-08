const config = require('./environment.config');

/**
 * External APIs Configuration
 * Centralized configuration for all external API integrations
 */
module.exports = {
  googleFactCheck: config.externalApis.googleFactCheck,
  whatsapp: config.externalApis.whatsapp,
  telegram: config.externalApis.telegram,
  sms: config.externalApis.sms,
  translation: config.externalApis.translation,
  languageDetection: config.externalApis.languageDetection,
  speechToText: config.externalApis.speechToText,
  ai: config.externalApis.ai,
  mediaGeneration: config.externalApis.mediaGeneration,
};

