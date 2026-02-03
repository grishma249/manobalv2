import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Role-aware protected route
// If allowedRoles is provided, only those roles (plus admin) can access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user?.role) {
    const isAdmin = user.role === 'admin'
    const isAllowed = allowedRoles.includes(user.role)

    if (!isAllowed && !isAdmin) {
      return <Navigate to="/403" replace />
    }
  }

  return children
}

export default ProtectedRoute

