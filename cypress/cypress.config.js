const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001', // Frontend URL on port 3001
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:3000/api/v1' // Backend API URL
  }
});