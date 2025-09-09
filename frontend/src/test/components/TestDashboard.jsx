import React from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

const TestDashboard = () => {
  const { isAuthenticated, isLoading, user, error } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!isAuthenticated) {
    return <div>Please login to access the dashboard</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username || 'User'}!</p>
      <div data-testid="dashboard-content">
        Dashboard content loaded successfully
      </div>
    </div>
  )
}

export default TestDashboard