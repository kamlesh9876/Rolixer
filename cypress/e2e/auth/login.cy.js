/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.get('[data-cy=email]').should('be.visible')
    cy.get('[data-cy=password]').should('be.visible')
    cy.get('[data-cy=submit]').should('be.visible')
    cy.get('[data-cy=forgot-password]').should('be.visible')
    cy.get('[data-cy=signup-link]').should('be.visible')
  })

  it('should show validation errors', () => {
    cy.get('[data-cy=submit]').click()
    
    // Check for required field errors
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
    
    // Test invalid email format
    cy.get('[data-cy=email]').type('invalid-email')
    cy.contains('Please enter a valid email').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    const email = 'nonexistent@example.com'
    const password = 'wrongpassword'
    
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('loginRequest')
    
    cy.get('[data-cy=email]').type(email)
    cy.get('[data-cy=password]').type(password)
    cy.get('[data-cy=submit]').click()
    
    cy.wait('@loginRequest')
    cy.contains('Invalid email or password').should('be.visible')
  })

  it('should login successfully with valid credentials', () => {
    const email = Cypress.env('testUserEmail') || 'user@example.com'
    const password = Cypress.env('testUserPassword') || 'User@1234'
    
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          email,
          name: 'Test User',
          role: 'user'
        },
        token: 'test-jwt-token'
      }
    }).as('loginRequest')
    
    cy.get('[data-cy=email]').type(email)
    cy.get('[data-cy=password]').type(password, { log: false })
    cy.get('[data-cy=submit]').click()
    
    cy.wait('@loginRequest')
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-menu]').should('be.visible')
  })

  it('should redirect to dashboard if already logged in', () => {
    // First login
    cy.loginAsUser()
    
    // Visit login page again
    cy.visit('/login')
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard')
  })

  it('should logout successfully', () => {
    cy.loginAsUser()
    
    // Mock logout API call
    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200,
      body: { success: true }
    }).as('logoutRequest')
    
    cy.get('[data-cy=user-menu]').click()
    cy.get('[data-cy=logout-button]').click()
    
    cy.wait('@logoutRequest')
    cy.url().should('include', '/login')
    
    // Verify user is actually logged out
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
  })
})
