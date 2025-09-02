/// <reference types="cypress" />

describe('Admin Dashboard', () => {
  const adminData = {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  }

  const usersData = [
    {
      id: 1,
      name: 'User One',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user',
      status: 'suspended',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]

  const storesData = [
    {
      id: 1,
      name: 'Test Store 1',
      owner: {
        id: 1,
        name: 'User One'
      },
      status: 'active',
      averageRating: 4.5,
      reviewCount: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Test Store 2',
      owner: {
        id: 2,
        name: 'User Two'
      },
      status: 'pending',
      averageRating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    }
  ]

  const statsData = {
    totalUsers: 150,
    activeUsers: 120,
    totalStores: 45,
    pendingStores: 5,
    totalReviews: 1250,
    averageRating: 4.2,
    newUsers: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [10, 15, 8, 22, 18, 25]
    },
    storeGrowth: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [5, 8, 12, 15, 20, 25]
    }
  }

  beforeEach(() => {
    // Login as admin
    cy.loginAsAdmin()
    
    // Mock the admin data
    cy.intercept('GET', '/api/admin/dashboard/stats', {
      statusCode: 200,
      body: statsData
    }).as('getDashboardStats')

    // Mock users list
    cy.intercept('GET', '/api/admin/users*', {
      statusCode: 200,
      body: {
        data: usersData,
        total: usersData.length,
        page: 1,
        limit: 10
      }
    }).as('getUsers')

    // Mock stores list
    cy.intercept('GET', '/api/admin/stores*', {
      statusCode: 200,
      body: {
        data: storesData,
        total: storesData.length,
        page: 1,
        limit: 10
      }
    }).as('getStores')

    // Visit the admin dashboard
    cy.visit('/admin/dashboard')
    
    // Wait for data to load
    cy.wait(['@getDashboardStats', '@getUsers', '@getStores'])
  })

  it('should display admin dashboard with statistics', () => {
    // Verify dashboard title and welcome message
    cy.get('[data-cy=admin-dashboard-title]').should('be.visible')
    cy.contains(`Welcome back, ${adminData.name}`).should('be.visible')
    
    // Verify stats cards
    cy.get('[data-cy=stat-card]').should('have.length', 6)
    cy.contains('Total Users').should('be.visible')
    cy.contains('Active Users').should('be.visible')
    cy.contains('Total Stores').should('be.visible')
    cy.contains('Pending Stores').should('be.visible')
    cy.contains('Total Reviews').should('be.visible')
    cy.contains('Average Rating').should('be.visible')
    
    // Verify charts are rendered
    cy.get('[data-cy=user-growth-chart]').should('be.visible')
    cy.get('[data-cy=store-growth-chart]').should('be.visible')
  })

  it('should display and manage users', () => {
    // Navigate to users page
    cy.get('[data-cy=admin-nav-users]').click()
    cy.url().should('include', '/admin/users')
    
    // Verify users table
    cy.get('[data-cy=users-table]').should('be.visible')
    cy.get('[data-cy=user-row]').should('have.length', usersData.length)
    
    // Verify user data in table
    usersData.forEach((user, index) => {
      cy.get(`[data-cy=user-${user.id}-name]`).should('contain', user.name)
      cy.get(`[data-cy=user-${user.id}-email]`).should('contain', user.email)
      cy.get(`[data-cy=user-${user.id}-status]`).should('contain', user.status)
    })
    
    // Test user search
    const searchTerm = 'User One'
    cy.intercept('GET', `/api/admin/users*search=${encodeURIComponent(searchTerm)}*`, {
      statusCode: 200,
      body: {
        data: [usersData[0]],
        total: 1,
        page: 1,
        limit: 10
      }
    }).as('searchUsers')
    
    cy.get('[data-cy=user-search]').type(searchTerm)
    cy.wait('@searchUsers')
    cy.get('[data-cy=user-row]').should('have.length', 1)
    cy.contains(searchTerm).should('be.visible')
  })

  it('should allow managing user status', () => {
    const userId = usersData[0].id
    const newStatus = 'suspended'
    
    // Mock the update status API
    cy.intercept('PATCH', `/api/admin/users/${userId}/status`, {
      statusCode: 200,
      body: {
        ...usersData[0],
        status: newStatus
      }
    }).as('updateUserStatus')
    
    // Navigate to users page
    cy.get('[data-cy=admin-nav-users]').click()
    
    // Open status dropdown and select new status
    cy.get(`[data-cy=user-${userId}-status-dropdown]`).click()
    cy.get(`[data-cy=status-option-${newStatus}]`).click()
    
    // Confirm the action
    cy.get('[data-cy=confirm-dialog-confirm]').click()
    
    // Verify API call and UI update
    cy.wait('@updateUserStatus')
    cy.get(`[data-cy=user-${userId}-status]`).should('contain', newStatus)
    cy.contains('User status updated successfully').should('be.visible')
  })

  it('should display and manage stores', () => {
    // Navigate to stores page
    cy.get('[data-cy=admin-nav-stores]').click()
    cy.url().should('include', '/admin/stores')
    
    // Verify stores table
    cy.get('[data-cy=stores-table]').should('be.visible')
    cy.get('[data-cy=store-row]').should('have.length', storesData.length)
    
    // Verify store data in table
    storesData.forEach((store, index) => {
      cy.get(`[data-cy=store-${store.id}-name]`).should('contain', store.name)
      cy.get(`[data-cy=store-${store.id}-owner]`).should('contain', store.owner.name)
      cy.get(`[data-cy=store-${store.id}-status]`).should('contain', store.status)
    })
    
    // Test store filtering
    const statusFilter = 'pending'
    cy.intercept('GET', `/api/admin/stores*status=${statusFilter}*`, {
      statusCode: 200,
      body: {
        data: [storesData[1]],
        total: 1,
        page: 1,
        limit: 10
      }
    }).as('filterStores')
    
    cy.get('[data-cy=store-status-filter]').click()
    cy.get(`[data-cy=status-option-${statusFilter}]`).click()
    cy.wait('@filterStores')
    cy.get('[data-cy=store-row]').should('have.length', 1)
    cy.contains(storesData[1].name).should('be.visible')
  })

  it('should approve a pending store', () => {
    const storeId = storesData[1].id
    
    // Mock the approve store API
    cy.intercept('PATCH', `/api/admin/stores/${storeId}/approve`, {
      statusCode: 200,
      body: {
        ...storesData[1],
        status: 'active',
        updatedAt: new Date().toISOString()
      }
    }).as('approveStore')
    
    // Navigate to stores page
    cy.get('[data-cy=admin-nav-stores]').click()
    
    // Click approve button on pending store
    cy.get(`[data-cy=store-${storeId}-approve]`).click()
    
    // Confirm the action
    cy.get('[data-cy=confirm-dialog-confirm]').click()
    
    // Verify API call and UI update
    cy.wait('@approveStore')
    cy.get(`[data-cy=store-${storeId}-status]`).should('contain', 'active')
    cy.contains('Store approved successfully').should('be.visible')
  })

  it('should export data', () => {
    // Mock the export API
    cy.intercept('GET', '/api/admin/export/users', {
      statusCode: 200,
      body: 'id,name,email,status\n1,User One,user1@example.com,active\n2,User Two,user2@example.com,suspended',
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=users-export.csv'
      }
    }).as('exportUsers')
    
    // Click export button
    cy.get('[data-cy=export-data-button]').click()
    cy.get('[data-cy=export-users-option]').click()
    
    // Verify export was triggered
    cy.wait('@exportUsers')
  })

  it('should display admin activity log', () => {
    const activityLog = [
      {
        id: 1,
        action: 'User status updated',
        user: {
          id: 1,
          name: 'Admin User'
        },
        targetType: 'user',
        targetId: 2,
        details: 'Status changed from active to suspended',
        ipAddress: '192.168.1.1',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        action: 'Store approved',
        user: {
          id: 1,
          name: 'Admin User'
        },
        targetType: 'store',
        targetId: 2,
        details: 'Store "Test Store 2" was approved',
        ipAddress: '192.168.1.1',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
    
    // Mock activity log API
    cy.intercept('GET', '/api/admin/activity*', {
      statusCode: 200,
      body: {
        data: activityLog,
        total: activityLog.length,
        page: 1,
        limit: 10
      }
    }).as('getActivityLog')
    
    // Navigate to activity log
    cy.get('[data-cy=admin-nav-activity]').click()
    cy.url().should('include', '/admin/activity')
    
    // Verify activity log
    cy.wait('@getActivityLog')
    cy.get('[data-cy=activity-log]').should('be.visible')
    cy.get('[data-cy=activity-item]').should('have.length', activityLog.length)
    
    // Verify activity details
    activityLog.forEach((activity, index) => {
      cy.get(`[data-cy=activity-${activity.id}]`).within(() => {
        cy.contains(activity.action).should('be.visible')
        cy.contains(activity.user.name).should('be.visible')
        cy.contains(activity.details).should('be.visible')
      })
    })
  })
})
