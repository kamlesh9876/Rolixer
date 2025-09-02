/// <reference types="cypress" />

describe('Rating and Reviews', () => {
  const storeData = {
    id: 1,
    name: 'Test Store',
    description: 'Test Store Description',
    averageRating: 4.5,
    reviewCount: 3,
    status: 'active',
    category: 'Electronics',
    address: '123 Test St',
    city: 'Test City',
    country: 'Test Country',
    phone: '1234567890',
    email: 'store@example.com',
    website: 'https://example.com',
    createdAt: new Date().toISOString()
  }

  const reviewsData = [
    {
      id: 1,
      rating: 5,
      comment: 'Excellent service!',
      user: {
        id: 1,
        name: 'Test User 1',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      createdAt: new Date().toISOString(),
      helpfulCount: 2
    },
    {
      id: 2,
      rating: 4,
      comment: 'Good experience overall',
      user: {
        id: 2,
        name: 'Test User 2',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      helpfulCount: 0
    }
  ]

  beforeEach(() => {
    // Login as a regular user
    cy.loginAsUser()
    
    // Mock the store details API
    cy.intercept('GET', `/api/stores/${storeData.id}`, {
      statusCode: 200,
      body: storeData
    }).as('getStore')

    // Mock the reviews API
    cy.intercept('GET', `/api/stores/${storeData.id}/reviews*`, {
      statusCode: 200,
      body: {
        data: reviewsData,
        total: reviewsData.length,
        page: 1,
        limit: 10
      }
    }).as('getReviews')

    // Visit the store details page
    cy.visit(`/stores/${storeData.id}`)
    
    // Wait for data to load
    cy.wait(['@getStore', '@getReviews'])
  })

  it('should display store details and reviews', () => {
    // Verify store details
    cy.get('[data-cy=store-name]').should('contain', storeData.name)
    cy.get('[data-cy=store-rating]').should('contain', storeData.averageRating)
    cy.get('[data-cy=store-review-count]').should('contain', `${storeData.reviewCount} reviews`)
    
    // Verify reviews are displayed
    cy.get('[data-cy=review-card]').should('have.length', reviewsData.length)
    
    // Verify review content
    reviewsData.forEach((review, index) => {
      cy.get(`[data-cy=review-${review.id}]`).within(() => {
        cy.get('[data-cy=user-name]').should('contain', review.user.name)
        cy.get('[data-cy=review-rating]').should('contain', review.rating)
        cy.get('[data-cy=review-comment]').should('contain', review.comment)
      })
    })
  })

  it('should allow submitting a new review', () => {
    const newReview = {
      rating: 5,
      comment: 'Amazing experience! Will definitely come back.',
      storeId: storeData.id,
      userId: 1
    }

    // Mock the create review API
    cy.intercept('POST', '/api/reviews', {
      statusCode: 201,
      body: {
        ...newReview,
        id: 3,
        user: {
          id: 1,
          name: 'Current User',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        createdAt: new Date().toISOString(),
        helpfulCount: 0
      }
    }).as('createReview')

    // Mock the updated reviews list
    const updatedReviews = [
      {
        ...newReview,
        id: 3,
        user: {
          id: 1,
          name: 'Current User',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        createdAt: new Date().toISOString(),
        helpfulCount: 0
      },
      ...reviewsData
    ]

    cy.intercept('GET', `/api/stores/${storeData.id}/reviews*`, {
      statusCode: 200,
      body: {
        data: updatedReviews,
        total: updatedReviews.length,
        page: 1,
        limit: 10
      }
    }).as('getUpdatedReviews')

    // Click the "Write a Review" button
    cy.get('[data-cy=write-review-button]').click()
    
    // Fill out the review form
    cy.get('[data-cy=rating-input]').click()
    cy.get('[data-cy=comment-textarea]').type(newReview.comment)
    
    // Submit the form
    cy.get('[data-cy=submit-review-button]').click()
    
    // Verify the API call and UI update
    cy.wait('@createReview')
    cy.wait('@getUpdatedReviews')
    
    // Verify success message and new review is displayed
    cy.contains('Review submitted successfully').should('be.visible')
    cy.get('[data-cy=review-card]').should('have.length', updatedReviews.length)
    cy.contains(newReview.comment).should('be.visible')
  })

  it('should allow marking a review as helpful', () => {
    const reviewId = reviewsData[0].id
    
    // Mock the helpful API
    cy.intercept('POST', `/api/reviews/${reviewId}/helpful`, {
      statusCode: 200,
      body: {
        success: true,
        helpfulCount: reviewsData[0].helpfulCount + 1
      }
    }).as('markHelpful')

    // Click the helpful button on the first review
    cy.get(`[data-cy=review-${reviewId}]`).within(() => {
      cy.get('[data-cy=helpful-button]').click()
      
      // Verify the helpful count updates
      cy.wait('@markHelpful')
      cy.get('[data-cy=helpful-count]').should('contain', reviewsData[0].helpfulCount + 1)
    })
  })

  it('should allow filtering reviews by rating', () => {
    // Test filtering for 5-star reviews
    cy.intercept('GET', `/api/stores/${storeData.id}/reviews*`, (req) => {
      const filteredReviews = reviewsData.filter(review => review.rating === 5)
      req.reply({
        statusCode: 200,
        body: {
          data: filteredReviews,
          total: filteredReviews.length,
          page: 1,
          limit: 10
        }
      })
    }).as('getFilteredReviews')

    // Click the 5-star filter
    cy.get('[data-cy=rating-filter-5]').click()
    
    // Verify only 5-star reviews are shown
    cy.wait('@getFilteredReviews')
    cy.get('[data-cy=review-card]').should('have.length', 1)
    cy.get('[data-cy=review-rating]').first().should('contain', '5')
  })

  it('should show validation errors for review form', () => {
    // Open the review form
    cy.get('[data-cy=write-review-button]').click()
    
    // Try to submit without filling anything
    cy.get('[data-cy=submit-review-button]').click()
    
    // Check for validation errors
    cy.contains('Please select a rating').should('be.visible')
    cy.contains('Please enter your review').should('be.visible')
    
    // Test minimum length for comment
    cy.get('[data-cy=comment-textarea]').type('Hi')
    cy.contains('Review must be at least 10 characters').should('be.visible')
  })
})
