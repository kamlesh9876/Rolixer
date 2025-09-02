const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'du54m2',
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
