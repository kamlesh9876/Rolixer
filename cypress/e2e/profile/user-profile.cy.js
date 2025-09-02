/// <reference types="cypress" />

describe('User Profile', () => {
  const userData = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    bio: 'Test bio',
    avatar: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const userReviews = [
    {
      id: 1,
      rating: 5,
      comment: 'Great store!',
      store: {
        id: 1,
        name: 'Test Store',
        category: 'Electronics'
      },
      createdAt: new Date().toISOString(),
      helpfulCount: 2
    },
    {
      id: 2,
      rating: 4,
      comment: 'Good experience',
      store: {
        id: 2,
        name: 'Another Store',
        category: 'Fashion'
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      helpfulCount: 0
    }
  ]

  beforeEach(() => {
    // Login as a user
    cy.loginAsUser()
    
    // Mock the user profile API
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: userData
    }).as('getUserProfile')

    // Mock the user's reviews API
    cy.intercept('GET', '/api/users/me/reviews*', {
      statusCode: 200,
      body: {
        data: userReviews,
        total: userReviews.length,
        page: 1,
        limit: 10
      }
    }).as('getUserReviews')

    // Visit the profile page
    cy.visit('/profile')
    
    // Wait for data to load
    cy.wait(['@getUserProfile', '@getUserReviews'])
  })

  it('should display user profile information', () => {
    // Verify basic info
    cy.get('[data-cy=user-name]').should('contain', userData.name)
    cy.get('[data-cy=user-email]').should('contain', userData.email)
    cy.get('[data-cy=user-phone]').should('contain', userData.phone)
    cy.get('[data-cy=user-bio]').should('contain', userData.bio)
    
    // Verify address
    cy.get('[data-cy=user-address]').should('contain', userData.address)
    cy.get('[data-cy=user-city]').should('contain', userData.city)
    cy.get('[data-cy=user-country]').should('contain', userData.country)
    
    // Verify avatar
    cy.get('[data-cy=user-avatar]').should('have.attr', 'src', userData.avatar)
  })

  it('should display user reviews', () => {
    // Verify reviews are displayed
    cy.get('[data-cy=user-review]').should('have.length', userReviews.length)
    
    // Verify review content
    userReviews.forEach((review, index) => {
      cy.get(`[data-cy=user-review-${review.id}]`).within(() => {
        cy.get('[data-cy=store-name]').should('contain', review.store.name)
        cy.get('[data-cy=review-rating]').should('contain', review.rating)
        cy.get('[data-cy=review-comment]').should('contain', review.comment)
        cy.get('[data-cy=helpful-count]').should('contain', review.helpfulCount)
      })
    })
  })

  it('should allow editing profile', () => {
    const updatedName = 'Updated Test User'
    const updatedBio = 'Updated bio'
    
    // Mock the update API
    cy.intercept('PUT', '/api/users/me', {
      statusCode: 200,
      body: {
        ...userData,
        name: updatedName,
        bio: updatedBio,
        updatedAt: new Date().toISOString()
      }
    }).as('updateProfile')

    // Click edit button
    cy.get('[data-cy=edit-profile-button]').click()
    
    // Update fields
    cy.get('[data-cy=name-input]').clear().type(updatedName)
    cy.get('[data-cy=bio-textarea]').clear().type(updatedBio)
    
    // Submit the form
    cy.get('[data-cy=save-profile-button]').click()
    
    // Verify API call and UI update
    cy.wait('@updateProfile')
    cy.contains('Profile updated successfully').should('be.visible')
    cy.get('[data-cy=user-name]').should('contain', updatedName)
    cy.get('[data-cy=user-bio]').should('contain', updatedBio)
  })

  it('should allow changing password', () => {
    const newPassword = 'NewSecurePassword123!'
    
    // Mock the password change API
    cy.intercept('PUT', '/api/users/me/password', {
      statusCode: 200,
      body: { success: true }
    }).as('changePassword')

    // Open change password modal
    cy.get('[data-cy=change-password-button]').click()
    
    // Fill out the form
    cy.get('[data-cy=current-password]').type('CurrentPassword123!')
    cy.get('[data-cy=new-password]').type(newPassword)
    cy.get('[data-cy=confirm-password]').type(newPassword)
    
    // Submit the form
    cy.get('[data-cy=submit-password-change]').click()
    
    // Verify API call and success message
    cy.wait('@changePassword')
    cy.contains('Password changed successfully').should('be.visible')
  })

  it('should validate profile form', () => {
    // Open edit mode
    cy.get('[data-cy=edit-profile-button]').click()
    
    // Clear required fields
    cy.get('[data-cy=name-input]').clear()
    cy.get('[data-cy=email-input]').clear()
    
    // Try to submit
    cy.get('[data-cy=save-profile-button]').click()
    
    // Check for validation errors
    cy.contains('Name is required').should('be.visible')
    cy.contains('Email is required').should('be.visible')
    
    // Test invalid email format
    cy.get('[data-cy=email-input]').type('invalid-email')
    cy.contains('Please enter a valid email').should('be.visible')
    
    // Test phone number validation
    cy.get('[data-cy=phone-input]').type('abc')
    cy.contains('Please enter a valid phone number').should('be.visible')
  })

  it('should handle profile picture upload', () => {
    // Mock the file upload API
    cy.intercept('POST', '/api/users/me/avatar', {
      statusCode: 200,
      body: {
        success: true,
        avatar: 'https://i.pravatar.cc/150?img=2'
      }
    }).as('uploadAvatar')
    
    // Upload a test image
    cy.fixture('test-avatar.jpg', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then(fileContent => {
        cy.get('[data-cy=avatar-upload-input]').attachFile({
          fileContent,
          fileName: 'test-avatar.jpg',
          mimeType: 'image/jpeg'
        })
      })
    
    // Verify upload and UI update
    cy.wait('@uploadAvatar')
    cy.contains('Profile picture updated successfully').should('be.visible')
  })
})
