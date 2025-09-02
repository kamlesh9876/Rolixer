/// <reference types="cypress" />

describe('Store Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin()
    cy.visit('/dashboard/stores')
  })

  it('should display stores list', () => {
    // Mock the API response for stores
    cy.intercept('GET', '/api/stores*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 1,
            name: 'Test Store 1',
            description: 'Test description 1',
            averageRating: 4.5,
            reviewCount: 10,
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Test Store 2',
            description: 'Test description 2',
            averageRating: 3.8,
            reviewCount: 5,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      }
    }).as('getStores')

    // Check if stores are loaded
    cy.wait('@getStores')
    cy.get('[data-cy=store-card]').should('have.length', 2)
    cy.contains('Test Store 1').should('be.visible')
    cy.contains('Test Store 2').should('be.visible')
  })

  it('should open create store modal', () => {
    cy.get('[data-cy=create-store-button]').click()
    cy.get('[data-cy=store-form]').should('be.visible')
  })

  it('should validate store form', () => {
    cy.get('[data-cy=create-store-button]').click()
    cy.get('[data-cy=submit-button]').click()
    
    // Check for validation errors
    cy.contains('Name is required').should('be.visible')
    cy.contains('Category is required').should('be.visible')
    
    // Test URL validation
    cy.get('[data-cy=website]').type('invalid-url')
    cy.contains('Please enter a valid URL').should('be.visible')
  })

  it('should create a new store', () => {
    const storeData = {
      name: 'New Test Store',
      description: 'This is a test store',
      category: 'Electronics',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      phone: '1234567890',
      email: 'store@example.com',
      website: 'https://example.com'
    }

    // Mock the create store API
    cy.intercept('POST', '/api/stores', {
      statusCode: 201,
      body: {
        ...storeData,
        id: 3,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    }).as('createStore')

    // Mock the updated stores list
    cy.intercept('GET', '/api/stores*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 3,
            ...storeData,
            status: 'pending',
            averageRating: 0,
            reviewCount: 0,
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }
    }).as('getStoresAfterCreate')

    // Fill out the form
    cy.get('[data-cy=create-store-button]').click()
    
    // Fill in form fields
    cy.get('[data-cy=name]').type(storeData.name)
    cy.get('[data-cy=description]').type(storeData.description)
    cy.get('[data-cy=category]').click()
    cy.get(`[data-cy=category-${storeData.category.toLowerCase()}]`).click()
    cy.get('[data-cy=address]').type(storeData.address)
    cy.get('[data-cy=city]').type(storeData.city)
    cy.get('[data-cy=country]').type(storeData.country)
    cy.get('[data-cy=phone]').type(storeData.phone)
    cy.get('[data-cy=email]').type(storeData.email)
    cy.get('[data-cy=website]').type(storeData.website)
    
    // Submit the form
    cy.get('[data-cy=submit-button]').click()
    
    // Verify API call and UI update
    cy.wait('@createStore')
    cy.wait('@getStoresAfterCreate')
    
    // Verify success message and store is in the list
    cy.contains('Store created successfully').should('be.visible')
    cy.contains(storeData.name).should('be.visible')
  })

  it('should update an existing store', () => {
    const updatedName = 'Updated Store Name'
    
    // Mock the get store by ID
    cy.intercept('GET', '/api/stores/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test Store 1',
        description: 'Test description',
        category: 'Electronics',
        status: 'active',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        phone: '1234567890',
        email: 'store@example.com',
        website: 'https://example.com',
        averageRating: 4.5,
        reviewCount: 10,
        createdAt: new Date().toISOString()
      }
    }).as('getStore')

    // Mock the update API
    cy.intercept('PUT', '/api/stores/1', {
      statusCode: 200,
      body: {
        id: 1,
        name: updatedName,
        description: 'Updated description',
        category: 'Electronics',
        status: 'active',
        address: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        phone: '1234567890',
        email: 'store@example.com',
        website: 'https://example.com',
        averageRating: 4.5,
        reviewCount: 10,
        updatedAt: new Date().toISOString()
      }
    }).as('updateStore')

    // Click edit button on first store
    cy.get('[data-cy=store-card]').first().find('[data-cy=edit-button]').click()
    
    // Wait for store data to load
    cy.wait('@getStore')
    
    // Update the name
    cy.get('[data-cy=name]').clear().type(updatedName)
    cy.get('[data-cy=description]').clear().type('Updated description')
    
    // Submit the form
    cy.get('[data-cy=submit-button]').click()
    
    // Verify API call and UI update
    cy.wait('@updateStore')
    cy.contains('Store updated successfully').should('be.visible')
    cy.contains(updatedName).should('be.visible')
  })

  it('should delete a store', () => {
    // Mock the delete API
    cy.intercept('DELETE', '/api/stores/1', {
      statusCode: 200,
      body: { success: true }
    }).as('deleteStore')

    // Mock the updated stores list
    cy.intercept('GET', '/api/stores*', {
      statusCode: 200,
      body: {
        data: [],
        total: 0,
        page: 1,
        limit: 10
      }
    }).as('getStoresAfterDelete')

    // Click delete button on first store
    cy.get('[data-cy=store-card]').first().find('[data-cy=delete-button]').click()
    
    // Confirm deletion
    cy.get('[data-cy=confirm-dialog-confirm]').click()
    
    // Verify API call and UI update
    cy.wait('@deleteStore')
    cy.wait('@getStoresAfterDelete')
    cy.contains('Store deleted successfully').should('be.visible')
    cy.contains('No stores found').should('be.visible')
  })
})
