// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-cy=email]').type(email)
    cy.get('[data-cy=password]').type(password, { log: false })
    cy.get('[data-cy=submit]').click()
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-menu]').should('be.visible')
  })
})

Cypress.Commands.add('loginAsAdmin', () => {
  const email = Cypress.env('testAdminEmail') || 'admin@example.com'
  const password = Cypress.env('testAdminPassword') || 'Admin@1234'
  cy.login(email, password)
})

Cypress.Commands.add('loginAsUser', () => {
  const email = Cypress.env('testUserEmail') || 'user@example.com'
  const password = Cypress.env('testUserPassword') || 'User@1234'
  cy.login(email, password)
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click()
  cy.get('[data-cy=logout-button]').click()
  cy.url().should('include', '/login')
})
