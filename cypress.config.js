const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: '.env.test' });

module.exports = defineConfig({
  // Project ID for Cypress Cloud
  projectId: 'du54m2',
  
  // Default timeout for commands and assertions
  defaultCommandTimeout: 10000,
  
  // Timeout for page load
  pageLoadTimeout: 60000,
  
  // Timeout for request responses
  requestTimeout: 10000,
  
  // Timeout for response after a request
  responseTimeout: 30000,
  
  // Number of times to retry a failing test
  retries: {
    runMode: 2,    // Retry failing tests up to 2 times in CI
    openMode: 0    // No retries in interactive mode
  },
  
  // Viewport settings
  viewportWidth: 1920,
  viewportHeight: 1080,
  
  // Screenshots and videos
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  video: true,
  videoCompression: 32,
  videosFolder: 'cypress/videos',
  videoUploadOnPasses: false,
  
  // Environment variables
  env: {
    // Base URL for the application
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // API configuration
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    
    // Authentication
    auth: {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'test1234',
    },
    
    // Feature flags
    featureFlags: {
      newUI: process.env.FEATURE_FLAG_NEW_UI === 'true',
    },
  },
  
  e2e: {
    // Base URL for all tests
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    
    // File pattern for test files
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      'cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    ],
    
    // Exclude test files
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
      '**/examples/*',
    ],
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Plugins file
    setupNodeEvents(on, config) {
      // Load environment variables from cypress.env.json
      const env = config.env || {};
      
      // Load environment specific config
      const envFile = path.resolve('cypress', 'config', `${config.env.environment || 'local'}.json`);
      if (fs.existsSync(envFile)) {
        const envConfig = require(envFile);
        config.env = { ...env, ...envConfig };
      }
      
      // Add terminal output for better debugging
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });
      
      // Generate JUnit report for CI
      if (process.env.CI) {
        require('cypress-mochawesome-reporter/plugin')(on);
      }
      
      // Return the config object
      return config;
    },
  },
  
  // Component testing configuration
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
