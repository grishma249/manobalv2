import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import AppShell from '../components/AppShell'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [donationSummary, setDonationSummary] = useState(null)
  const [donationLoading, setDonationLoading] = useState(false)
  const [volunteerSummary, setVolunteerSummary] = useState(null)
  const [volunteerLoading, setVolunteerLoading] = useState(false)
  const [schoolSummary, setSchoolSummary] = useState(null)
  const [schoolLoading, setSchoolLoading] = useState(false)

  useEffect(() => {
    // Redirect admin users to admin dashboard
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchDonationSummary = async () => {
      try {
        setDonationLoading(true)
        const response = await axios.get('/api/donations/me')
        setDonationSummary(response.data.summary || null)
      } catch (error) {
        console.error('Failed to load donation summary:', error)
      } finally {
        setDonationLoading(false)
      }
    }

    const fetchVolunteerSummary = async () => {
      try {
        setVolunteerLoading(true)
        const response = await axios.get('/api/volunteers/participations?limit=1')
        setVolunteerSummary(response.data.summary || null)
      } catch (error) {
        console.error('Failed to load volunteer summary:', error)
      } finally {
        setVolunteerLoading(false)
      }
    }

    const fetchSchoolSummary = async () => {
      try {
        setSchoolLoading(true)
        const response = await axios.get('/api/schools/events?limit=1')
        setSchoolSummary(response.data.summary || null)
      } catch (error) {
        console.error('Failed to load school summary:', error)
      } finally {
        setSchoolLoading(false)
      }
    }

    if (user?.role === 'donor') {
      fetchDonationSummary()
    } else if (user?.role === 'volunteer') {
      fetchVolunteerSummary()
    } else if (user?.role === 'school') {
      fetchSchoolSummary()
    }
  }, [user])

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
      <AppShell>
        <div className="dashboard-content container">
          <div className="dashboard-header">
            <h2>Welcome, {user?.name}!</h2>
            <p className="dashboard-subtitle">{getWelcomeMessage(user?.role)}</p>
          </div>

          {user?.role === 'donor' && donationSummary && (
            <div className="dashboard-card">
              <h3>Your Donation Summary</h3>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Total Donated Amount:</span>
                  <span className="info-value">
                    NPR {donationSummary.totalMonetary.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Items Donated:</span>
                  <span className="info-value">
                    {donationSummary.totalItems} items
                  </span>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'volunteer' && volunteerSummary && (
            <div className="dashboard-card">
              <h3>Your Participation Summary</h3>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Total Events:</span>
                  <span className="info-value">{volunteerSummary.total || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Attended:</span>
                  <span className="info-value">{volunteerSummary.attended || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Confirmed:</span>
                  <span className="info-value">{volunteerSummary.confirmed || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Registered:</span>
                  <span className="info-value">{volunteerSummary.registered || 0}</span>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'school' && schoolSummary && (
            <div className="dashboard-card">
              <h3>Your Event Requests Summary</h3>
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Total Requests:</span>
                  <span className="info-value">{schoolSummary.total || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Pending:</span>
                  <span className="info-value">{schoolSummary.pending || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Approved:</span>
                  <span className="info-value">{schoolSummary.approved || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Completed:</span>
                  <span className="info-value">{schoolSummary.completed || 0}</span>
                </div>
              </div>
            </div>
          )}

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
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              {user?.role === 'volunteer' && (
                <>
                  <a href="/events" className="action-link">
                    📅 Browse Available Events
                  </a>
                  <a href="/my-events" className="action-link">
                    🗂️ View My Registered Events
                  </a>
                </>
              )}
              {user?.role === 'school' && (
                <>
                  <a href="/school/request-event" className="action-link">
                    📝 Request a New Event
                  </a>
                  <a href="/events" className="action-link">
                    📅 View My Event Requests
                  </a>
                </>
              )}
              {user?.role === 'donor' && (
                <>
                  <a href="/donations" className="action-link">
                    💰 Make a Donation
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default Dashboard

