import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import './Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: 'Administrator',
      donor: 'Donor',
      volunteer: 'Volunteer',
      school: 'School',
    }
    return roleMap[role] || role
  }

  const getWelcomeMessage = (role) => {
    const messages = {
      admin: 'Manage events, volunteers, and donations',
      donor: 'Track your contributions and impact',
      volunteer: 'Discover events and track your participation',
      school: 'Request workshops and manage your events',
    }
    return messages[role] || 'Welcome to your dashboard'
  }

  return (
    <div className="dashboard-page">
      <Navigation />

      <main className="dashboard-content">
        <div className="container">
          <div className="dashboard-header">
            <h2>Welcome, {user?.name}!</h2>
            <p className="dashboard-subtitle">{getWelcomeMessage(user?.role)}</p>
          </div>

          <div className="dashboard-card">
            <h3>Your Profile</h3>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{user?.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{getRoleDisplayName(user?.role)}</span>
              </div>
              {user?.schoolName && (
                <div className="info-row">
                  <span className="info-label">School Name:</span>
                  <span className="info-value">{user.schoolName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Coming Soon</h3>
            <p>Role-specific features will be available here based on your account type.</p>
            <ul className="coming-soon-list">
              {user?.role === 'admin' && (
                <>
                  <li>Event Management</li>
                  <li>Volunteer Management</li>
                  <li>Donation Oversight</li>
                  <li>User Management</li>
                </>
              )}
              {user?.role === 'school' && (
                <>
                  <li>Event Request Submission</li>
                  <li>Event Status Tracking</li>
                </>
              )}
              {user?.role === 'volunteer' && (
                <>
                  <li>Event Browsing</li>
                  <li>Event Participation</li>
                  <li>Participation History</li>
                </>
              )}
              {user?.role === 'donor' && (
                <>
                  <li>Donation Submission</li>
                  <li>Donation History</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

