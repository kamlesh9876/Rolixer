/**
 * Security configuration for the frontend application
 */

export const SECURITY_CONFIG = {
  // Content Security Policy settings
  CSP: {
    DEFAULT_SRC: "'self'",
    SCRIPT_SRC: "'self' 'unsafe-inline' 'unsafe-eval'",
    STYLE_SRC: "'self' 'unsafe-inline' https://fonts.googleapis.com",
    FONT_SRC: "'self' https://fonts.gstatic.com",
    IMG_SRC: "'self' data: https:",
    CONNECT_SRC: "'self' http://localhost:3001",
    OBJECT_SRC: "'none'",
    BASE_URI: "'self'",
    FORM_ACTION: "'self'",
  },

  // Input validation limits
  INPUT_LIMITS: {
    NAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 100,
    PHONE_MAX_LENGTH: 20,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    TEXT_MAX_LENGTH: 1000,
    STORE_NAME_MAX_LENGTH: 100,
    ADDRESS_MAX_LENGTH: 500,
  },

  // Rate limiting (for future implementation)
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    REGISTRATION_ATTEMPTS: 3,
    PASSWORD_RESET_ATTEMPTS: 3,
  },

  // Session security
  SESSION: {
    TIMEOUT_MINUTES: 30,
    REFRESH_THRESHOLD_MINUTES: 5,
  },

  // API security
  API: {
    TIMEOUT_MS: 10000,
    MAX_RETRIES: 3,
  },
} as const;

/**
 * Security headers that should be set by the server
 * This is for documentation and potential server-side implementation
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;