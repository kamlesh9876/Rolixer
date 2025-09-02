# Testing Guide

This guide provides instructions for running end-to-end (E2E) tests using Cypress in the Store Rating System.

## Prerequisites

- Node.js 16+ and npm 8+
- Chrome, Firefox, or Edge browser
- Running instance of the application
- Test database (configured in `.env.test`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the test database:
   ```bash
   npx prisma migrate deploy
   ```

3. Configure environment variables in `.env.test`:
   ```
   NODE_ENV=test
   PORT=3001
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/store_rating_test
   JWT_SECRET=test-secret-key
   ```

## Running Tests

### Interactive Mode (GUI)

1. Start the application in test mode:
   ```bash
   npm run start:test
   ```

2. Open Cypress Test Runner:
   ```bash
   npx cypress open
   ```

3. Click on the test file you want to run from the Cypress Test Runner.

### Headless Mode (CI/CD)

Run all tests in headless mode:
```bash
npm test
```

### Run Specific Test File

```bash
npx cypress run --spec "cypress/e2e/auth/login.cy.js"
```

### Run in Specific Browser

```bash
# Chrome (default)
npm run cy:run:chrome

# Firefox
npm run cy:run:firefox

# Edge
npm run cy:run:edge
```

## Test Structure

- `cypress/e2e/` - Contains all test files
  - `auth/` - Authentication tests
  - `admin/` - Admin panel tests
  - `stores/` - Store management tests
  - `reviews/` - Review system tests
  - `profile/` - User profile tests

## Best Practices

1. **Test Data Management**:
   - Use fixtures for test data
   - Clean up test data after each test

2. **Selectors**:
   - Use `data-cy` attributes for element selection
   - Avoid using CSS classes or IDs that might change

3. **Page Objects**:
   - Create page objects for complex pages
   - Keep selectors and helper methods in page objects

4. **Assertions**:
   - Use meaningful assertions
   - Test one thing per test case

## Debugging

1. **Cypress Dashboard**:
   - Use `cy.log()` for debugging
   - Take screenshots on test failure

2. **Time Travel**:
   - Use `.pause()` to pause test execution
   - Check the Command Log in the Test Runner

3. **Chrome DevTools**:
   - Open DevTools with `F12` during test execution
   - Use `debugger` statements in your test code

## CI/CD Integration

Add this to your CI/CD pipeline:

```yaml
steps:
  - name: Run Cypress Tests
    run: |
      npm install
      npm run test:ci
```

## Common Issues

1. **Element Not Found**:
   - Ensure the application is running
   - Check for dynamic content loading
   - Add explicit waits if needed

2. **Test Flakiness**:
   - Use `cy.wait()` for API calls
   - Add retry logic for flaky tests

3. **Environment Issues**:
   - Verify `.env.test` configuration
   - Check database connection

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
