import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import AppShell from '../components/AppShell'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [donationData, setDonationData] = useState({ summary: null, donations: [] })
  const [donationLoading, setDonationLoading] = useState(false)
  const [volunteerData, setVolunteerData] = useState({ summary: null, participations: [] })
  const [volunteerLoading, setVolunteerLoading] = useState(false)
  const [schoolData, setSchoolData] = useState({ summary: null, events: [] })
  const [schoolLoading, setSchoolLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setDonationLoading(true)
        const response = await axios.get('/api/donations/me')
        setDonationData({
          summary: response.data.summary || null,
          donations: response.data.donations || [],
        })
      } catch (error) {
        console.error('Failed to load donation data:', error)
      } finally {
        setDonationLoading(false)
      }
    }

    const fetchVolunteerData = async () => {
      try {
        setVolunteerLoading(true)
        const response = await axios.get('/api/volunteers/participations?limit=5')
        setVolunteerData({
          summary: response.data.summary || null,
          participations: response.data.participations || [],
        })
      } catch (error) {
        console.error('Failed to load volunteer data:', error)
      } finally {
        setVolunteerLoading(false)
      }
    }

    const fetchSchoolData = async () => {
      try {
        setSchoolLoading(true)
        const response = await axios.get('/api/schools/events?limit=5')
        setSchoolData({
          summary: response.data.summary || null,
          events: response.data.events || [],
        })
      } catch (error) {
        console.error('Failed to load school data:', error)
      } finally {
        setSchoolLoading(false)
      }
    }

    if (user?.role === 'donor') fetchDonationData()
    else if (user?.role === 'volunteer') fetchVolunteerData()
    else if (user?.role === 'school') fetchSchoolData()
  }, [user])

  const getWelcomeMessage = (role) => {
    const messages = {
      donor: 'Track your contributions and impact',
      volunteer: 'Discover events and track your participation',
      school: 'Request workshops and manage your events',
    }
    return messages[role] || 'Welcome to your dashboard'
  }

  const getMissionLine = (role) => {
    const lines = {
      donor: 'Thank you for supporting community education through your generosity.',
      volunteer: 'Thank you for contributing to community education.',
      school: 'Thank you for partnering with us to bring education to your students.',
    }
    return lines[role] || ''
  }

  const getEventTypeDisplay = (type) => {
    const types = { workshop: 'Workshop', awareness: 'Awareness', training: 'Training', other: 'Other' }
    return types[type] || type
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      registered: '#17a2b8',
      confirmed: '#17a2b8',
      attended: '#28a745',
      completed: '#17a2b8',
      rejected: '#dc3545',
      cancelled: '#6c757d',
    }
    return colors[status] || '#6c757d'
  }

  return (
    <div className="dashboard-page">
      <AppShell>
        <div className="dashboard-content container">
          <div className="dashboard-header">
            <h1>Welcome, {user?.name}!</h1>
            <p className="dashboard-subtitle">{getWelcomeMessage(user?.role)}</p>
            {user?.role && getMissionLine(user.role) && (
              <p className="dashboard-mission">{getMissionLine(user.role)}</p>
            )}
          </div>

          {/* DONOR DASHBOARD */}
          {user?.role === 'donor' && (
            <>
              {donationLoading ? (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading your dashboard...</p>
                </div>
              ) : (
                <>
                  <div className="stat-cards">
                    <div className="stat-card stat-card-primary">
                      <div className="stat-icon">💰</div>
                      <div className="stat-content">
                        <span className="stat-value">
                          NPR {(donationData.summary?.totalMonetary || 0).toLocaleString()}
                        </span>
                        <span className="stat-label">Total Donated</span>
                      </div>
                    </div>
                    <div className="stat-card stat-card-accent">
                      <div className="stat-icon">📦</div>
                      <div className="stat-content">
                        <span className="stat-value">{donationData.summary?.totalItems || 0}</span>
                        <span className="stat-label">Items Donated</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📝</div>
                      <div className="stat-content">
                        <span className="stat-value">{donationData.summary?.monetaryCount || 0}</span>
                        <span className="stat-label">Monetary Donations</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">🎁</div>
                      <div className="stat-content">
                        <span className="stat-value">{donationData.summary?.physicalCount || 0}</span>
                        <span className="stat-label">Physical Donations</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3>Recent Donations</h3>
                      <Link to="/donations" className="section-link">View all</Link>
                    </div>
                    {donationData.donations.length > 0 ? (
                      <div className="recent-list">
                        {donationData.donations.slice(0, 5).map((d) => (
                          <div key={d._id} className="recent-item">
                            <div className="recent-item-main">
                              <span className="recent-title">
                                {d.type === 'monetary'
                                  ? `NPR ${(d.amount || 0).toLocaleString()}`
                                  : `${d.quantity || 0} ${d.category || 'items'}`}
                              </span>
                              <span
                                className="recent-badge"
                                style={{ backgroundColor: getStatusColor(d.status || 'pending') }}
                              >
                                {d.status || 'pending'}
                              </span>
                            </div>
                            <span className="recent-meta">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-recent">
                        <p>No donations yet.</p>
                        <Link to="/donations" className="action-link-inline">Make your first donation</Link>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card quick-actions-card">
                    <h3>Quick Actions</h3>
                    <a href="/donations" className="action-link">
                      💰 Make a Donation
                    </a>
                  </div>
                </>
              )}
            </>
          )}

          {/* VOLUNTEER DASHBOARD */}
          {user?.role === 'volunteer' && (
            <>
              {volunteerLoading ? (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading your dashboard...</p>
                </div>
              ) : (
                <>
                  <div className="stat-cards">
                    <div className="stat-card stat-card-primary">
                      <div className="stat-icon">✅</div>
                      <div className="stat-content">
                        <span className="stat-value">{volunteerData.summary?.attended || 0}</span>
                        <span className="stat-label">Attended</span>
                      </div>
                    </div>
                    <div className="stat-card stat-card-accent">
                      <div className="stat-icon">📅</div>
                      <div className="stat-content">
                        <span className="stat-value">{volunteerData.summary?.total || 0}</span>
                        <span className="stat-label">Total Events</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">✓</div>
                      <div className="stat-content">
                        <span className="stat-value">
                          {(volunteerData.summary?.registered || 0) +
                            (volunteerData.summary?.confirmed || 0)}
                        </span>
                        <span className="stat-label">Registered</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-content">
                        <span className="stat-value">{volunteerData.summary?.pending || 0}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3>Recent Events</h3>
                      <Link to="/my-events" className="section-link">View all</Link>
                    </div>
                    {volunteerData.participations.length > 0 ? (
                      <div className="recent-list">
                        {volunteerData.participations.map((p) => (
                          <div key={p._id} className="recent-item">
                            <div className="recent-item-main">
                              <span className="recent-title">{p.event?.title || 'Event'}</span>
                              <span
                                className="recent-badge"
                                style={{ backgroundColor: getStatusColor(p.status) }}
                              >
                                {p.status === 'confirmed' ? 'Registered' : p.status}
                              </span>
                            </div>
                            <span className="recent-meta">
                              {p.event?.date
                                ? new Date(p.event.date).toLocaleDateString()
                                : ''} • {getEventTypeDisplay(p.event?.eventType)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-recent">
                        <p>No events yet.</p>
                        <Link to="/events" className="action-link-inline">Browse available events</Link>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card quick-actions-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <a href="/events" className="action-link">📅 Browse Available Events</a>
                      <a href="/my-events" className="action-link">🗂️ View My Registered Events</a>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* SCHOOL DASHBOARD */}
          {user?.role === 'school' && (
            <>
              {schoolLoading ? (
                <div className="dashboard-loading">
                  <div className="spinner"></div>
                  <p>Loading your dashboard...</p>
                </div>
              ) : (
                <>
                  <div className="stat-cards">
                    <div className="stat-card stat-card-primary">
                      <div className="stat-icon">📋</div>
                      <div className="stat-content">
                        <span className="stat-value">{schoolData.summary?.total || 0}</span>
                        <span className="stat-label">Total Requests</span>
                      </div>
                    </div>
                    <div className="stat-card stat-card-accent">
                      <div className="stat-icon">✅</div>
                      <div className="stat-content">
                        <span className="stat-value">{schoolData.summary?.completed || 0}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">✓</div>
                      <div className="stat-content">
                        <span className="stat-value">{schoolData.summary?.approved || 0}</span>
                        <span className="stat-label">Approved</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-content">
                        <span className="stat-value">{schoolData.summary?.pending || 0}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-section">
                    <div className="section-header">
                      <h3>Recent Event Requests</h3>
                      <Link to="/events" className="section-link">View all</Link>
                    </div>
                    {schoolData.events.length > 0 ? (
                      <div className="recent-list">
                        {schoolData.events.map((e) => (
                          <div key={e._id} className="recent-item">
                            <div className="recent-item-main">
                              <span className="recent-title">{e.title}</span>
                              <span
                                className="recent-badge"
                                style={{ backgroundColor: getStatusColor(e.status) }}
                              >
                                {e.status}
                              </span>
                            </div>
                            <span className="recent-meta">
                              {e.date ? new Date(e.date).toLocaleDateString() : ''} •{' '}
                              {getEventTypeDisplay(e.eventType)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-recent">
                        <p>No event requests yet.</p>
                        <Link to="/school/request-event" className="action-link-inline">
                          Request your first event
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card quick-actions-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <a href="/school/request-event" className="action-link">📝 Request a New Event</a>
                      <a href="/events" className="action-link">📅 View My Event Requests</a>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </AppShell>
    </div>
  )
}

export default Dashboard

