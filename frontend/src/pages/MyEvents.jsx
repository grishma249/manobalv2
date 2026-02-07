import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './MyEvents.css'

const MyEvents = () => {
  const { user } = useAuth()
  const [participations, setParticipations] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', page: 1 })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchParticipations()
  }, [filters])

  const fetchParticipations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      params.append('page', filters.page)
      params.append('limit', '20')

      const response = await axios.get(`/api/volunteers/participations?${params.toString()}`)
      setParticipations(response.data.participations)
      setSummary(response.data.summary)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load participations')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      registered: '#ffc107',
      confirmed: '#17a2b8',
      attended: '#28a745',
      absent: '#dc3545',
      cancelled: '#6c757d',
    }
    return colors[status] || '#6c757d'
  }

  const getEventTypeDisplay = (type) => {
    const types = {
      workshop: 'Workshop',
      awareness: 'Awareness Program',
      training: 'Training',
      other: 'Other',
    }
    return types[type] || type
  }

  return (
    <div className="my-events-page">
      <AppShell>
        <div className="page-header">
          <h1>My Events</h1>
          <p>View the events you have registered for and track your participation.</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>{summary.total || 0}</h3>
              <p>Total Events</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>{summary.attended || 0}</h3>
              <p>Attended</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✓</div>
            <div className="summary-content">
              <h3>{summary.confirmed || 0}</h3>
              <p>Confirmed</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📝</div>
            <div className="summary-content">
              <h3>{summary.registered || 0}</h3>
              <p>Registered</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="registered">Registered</option>
              <option value="confirmed">Confirmed</option>
              <option value="attended">Attended</option>
              <option value="absent">Absent</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your events...</p>
          </div>
        ) : participations.length > 0 ? (
          <>
            <div className="participations-list">
              {participations.map((participation) => (
                <div key={participation._id} className="participation-card">
                  <div className="participation-header">
                    <h3>{participation.event?.title || 'Event'}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(participation.status) }}
                    >
                      {participation.status}
                    </span>
                  </div>
                  <div className="participation-details">
                    <div className="detail-item">
                      <strong>Type:</strong> {getEventTypeDisplay(participation.event?.eventType)}
                    </div>
                    <div className="detail-item">
                      <strong>Date:</strong>{' '}
                      {participation.event?.date
                        ? new Date(participation.event.date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Location:</strong> {participation.event?.location || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Registered:</strong>{' '}
                      {new Date(participation.registeredAt).toLocaleDateString()}
                    </div>
                    {participation.attendedAt && (
                      <div className="detail-item">
                        <strong>Attended:</strong>{' '}
                        {new Date(participation.attendedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="btn btn-outline"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.pages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <h3>No events registered</h3>
            <p>You haven't registered for any events yet. Browse available events to get started!</p>
          </div>
        )}
      </AppShell>
    </div>
  )
}

export default MyEvents
