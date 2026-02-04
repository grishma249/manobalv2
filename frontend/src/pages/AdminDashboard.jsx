import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import axios from 'axios'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [recent, setRecent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/dashboard')
      setMetrics(response.data.metrics)
      setRecent(response.data.recent)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="admin-dashboard">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="admin-dashboard">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchDashboardData} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and key metrics</p>
        </div>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3>Total Users</h3>
              <p className="metric-value">{metrics?.users?.total || 0}</p>
              <p className="metric-subtitle">{metrics?.users?.active || 0} active</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📅</div>
            <div className="metric-content">
              <h3>Pending Events</h3>
              <p className="metric-value">{metrics?.events?.pending || 0}</p>
              <p className="metric-subtitle">{metrics?.events?.upcoming || 0} upcoming</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Total Donations</h3>
              <p className="metric-value">
                NPR {metrics?.donations?.monetary?.total?.toLocaleString() || 0}
              </p>
              <p className="metric-subtitle">
                {metrics?.donations?.monetary?.count || 0} monetary,{' '}
                {metrics?.donations?.physical?.count || 0} physical
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🤝</div>
            <div className="metric-content">
              <h3>Active Volunteers</h3>
              <p className="metric-value">{metrics?.volunteers?.active || 0}</p>
              <p className="metric-subtitle">{metrics?.volunteers?.total || 0} total</p>
            </div>
          </div>
        </div>

        {/* User Breakdown */}
        <div className="dashboard-section">
          <h2>Users by Role</h2>
          <div className="role-breakdown">
            <div className="role-item">
              <span className="role-label">Donors:</span>
              <span className="role-value">{metrics?.users?.byRole?.donor || 0}</span>
            </div>
            <div className="role-item">
              <span className="role-label">Volunteers:</span>
              <span className="role-value">{metrics?.users?.byRole?.volunteer || 0}</span>
            </div>
            <div className="role-item">
              <span className="role-label">Schools:</span>
              <span className="role-value">{metrics?.users?.byRole?.school || 0}</span>
            </div>
            <div className="role-item">
              <span className="role-label">Admins:</span>
              <span className="role-value">{metrics?.users?.byRole?.admin || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="activities-grid">
          <div className="activity-section">
            <div className="section-header">
              <h2>Recent Events</h2>
              <Link to="/events" className="view-all-link">
                View All →
              </Link>
            </div>
            <div className="activity-list">
              {recent?.events?.length > 0 ? (
                recent.events.map((event) => (
                  <div key={event._id} className="activity-item">
                    <div className="activity-icon">📅</div>
                    <div className="activity-content">
                      <h4>{event.title}</h4>
                      <p>
                        Requested by: {event.requestedBy?.name || 'Unknown'} • Status:{' '}
                        <span className={`status-badge status-${event.status}`}>
                          {event.status}
                        </span>
                      </p>
                      <p className="activity-date">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent events</p>
              )}
            </div>
          </div>

          <div className="activity-section">
            <div className="section-header">
              <h2>Recent Donations</h2>
              <Link to="/donations" className="view-all-link">
                View All →
              </Link>
            </div>
            <div className="activity-list">
              {recent?.donations?.length > 0 ? (
                recent.donations.map((donation) => (
                  <div key={donation._id} className="activity-item">
                    <div className="activity-icon">
                      {donation.type === 'monetary' ? '💰' : '📦'}
                    </div>
                    <div className="activity-content">
                      <h4>
                        {donation.type === 'monetary'
                          ? `NPR ${donation.amount?.toLocaleString()}`
                          : `${donation.quantity} ${donation.category}`}
                      </h4>
                      <p>
                        Donor: {donation.donor?.name || 'Unknown'} • Status:{' '}
                        <span className={`status-badge status-${donation.status}`}>
                          {donation.status}
                        </span>
                      </p>
                      <p className="activity-date">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent donations</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/users" className="action-card">
              <div className="action-icon">👥</div>
              <h3>Manage Users</h3>
              <p>View and manage all user accounts</p>
            </Link>
            <Link to="/events" className="action-card">
              <div className="action-icon">📅</div>
              <h3>Manage Events</h3>
              <p>Approve requests and create events</p>
            </Link>
            <Link to="/donations" className="action-card">
              <div className="action-icon">💰</div>
              <h3>View Donations</h3>
              <p>Monitor all donations</p>
            </Link>
            <Link to="/volunteers" className="action-card">
              <div className="action-icon">🤝</div>
              <h3>Volunteer Oversight</h3>
              <p>Track volunteer participation</p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default AdminDashboard

