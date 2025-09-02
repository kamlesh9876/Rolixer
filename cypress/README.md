# Cypress End-to-End Testing

This directory contains all the end-to-end tests for the Store Rating System application.

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Cypress 10+
- A running instance of the application
- Test database (see `.env.test` for configuration)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

3. Update the environment variables in `.env.test` as needed.

## Running Tests

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open Cypress in interactive mode:
   ```bash
   npx cypress open
   ```

### Headless Mode

Run all tests in headless mode:
```bash
npx cypress run
```

### Specific Test Files

Run a specific test file:
```bash
npx cypress run --spec "cypress/e2e/login.cy.js"
```

### Test Environment

Set a specific environment (defaults to 'test'):
```bash
CYPRESS_ENV=staging npx cypress open
```

## Test Structure

```
cypress/
├── e2e/                # Test files
│   ├── auth/           # Authentication tests
│   ├── dashboard/      # Dashboard tests
│   ├── stores/         # Store management tests
│   └── reviews/        # Review management tests
├── fixtures/           # Test data
├── pages/              # Page object models
├── plugins/            # Cypress plugins
├── support/            # Custom commands and utilities
└── utils/              # Helper functions
```

## Writing Tests

### Best Practices

1. **Use Page Object Model (POM)**: Keep selectors and page interactions in page objects.
2. **Use Custom Commands**: For common actions like login/logout.
3. **Use Fixtures**: For test data.
4. **Use Environment Variables**: For configuration.
5. **Write Atomic Tests**: Each test should be independent.

### Example Test

```javascript
// cypress/e2e/login.cy.js
describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should log in with valid credentials', () => {
    cy.get('[data-cy=email]').type(Cypress.env('auth').email);
    cy.get('[data-cy=password]').type(Cypress.env('auth').password);
    cy.get('[data-cy=submit]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-menu]').should('be.visible');
  });
});
```

## CI/CD Integration

Tests run automatically on push to `main` and `develop` branches via GitHub Actions. See `.github/workflows/cypress.yml` for configuration.

## Debugging

1. Use `cy.log()` for custom logging.
2. Use `cy.pause()` to pause test execution.
3. Use Chrome DevTools (F12) with `cypress open`.
4. Check `cypress/screenshots` and `cypress/videos` after test failures.

## Code Coverage

To generate code coverage reports:

1. Instrument your code:
   ```bash
   npx nyc instrument --compact=false src instrumented-src
   ```

2. Run tests with coverage:
   ```bash
   npx cypress run --env coverage=true
   ```

3. Generate report:
   ```bash
   npx nyc report --reporter=lcov --reporter=text
   ```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
