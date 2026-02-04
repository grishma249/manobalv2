import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import axios from 'axios'
import './AdminEvents.css'

const AdminEvents = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', page: 1 })
  const [pagination, setPagination] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [volunteers, setVolunteers] = useState([])

  useEffect(() => {
    fetchEvents()
    if (showAssignModal) {
      fetchVolunteers()
    }
  }, [filters, showAssignModal])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      params.append('page', filters.page)
      params.append('limit', '20')

      const response = await axios.get(`/api/admin/events?${params.toString()}`)
      setEvents(response.data.events)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchVolunteers = async () => {
    try {
      const response = await axios.get('/api/admin/volunteers?limit=100')
      setVolunteers(response.data.volunteers)
    } catch (err) {
      console.error('Failed to load volunteers:', err)
    }
  }

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await axios.patch(`/api/admin/events/${eventId}/status`, { status: newStatus })
      fetchEvents()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update event status')
    }
  }

  const handleAssignVolunteers = async (eventId, volunteerIds) => {
    try {
      await axios.patch(`/api/admin/events/${eventId}/volunteers`, { volunteerIds })
      setShowAssignModal(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign volunteers')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545',
      completed: '#17a2b8',
      cancelled: '#6c757d',
    }
    return colors[status] || '#6c757d'
  }

  return (
    <AppShell>
      <div className="admin-events">
        <div className="page-header">
          <div className="header-content">
            <div>
              <h1>Event Management</h1>
              <p>Review, approve, and manage all events</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              + Create Event
            </button>
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : (
          <>
            <div className="events-grid">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(event.status) }}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <div className="detail-item">
                        <strong>Type:</strong> {event.eventType}
                      </div>
                      <div className="detail-item">
                        <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="detail-item">
                        <strong>Location:</strong> {event.location}
                      </div>
                      <div className="detail-item">
                        <strong>Requested by:</strong> {event.requestedBy?.name || 'Admin'}
                      </div>
                      {event.assignedVolunteers?.length > 0 && (
                        <div className="detail-item">
                          <strong>Volunteers:</strong> {event.assignedVolunteers.length} assigned
                        </div>
                      )}
                    </div>
                    <div className="event-actions">
                      {event.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(event._id, 'approved')}
                            className="btn btn-success btn-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(event._id, 'rejected')}
                            className="btn btn-danger btn-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {event.status === 'approved' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowAssignModal(true)
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            Assign Volunteers
                          </button>
                          <button
                            onClick={() => handleStatusChange(event._id, 'completed')}
                            className="btn btn-info btn-sm"
                          >
                            Mark Completed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No events found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
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
        )}

        {/* Assign Volunteers Modal */}
        {showAssignModal && selectedEvent && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Assign Volunteers to {selectedEvent.title}</h2>
              <div className="volunteers-list">
                {volunteers.map((volunteer) => (
                  <label key={volunteer._id} className="volunteer-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        selectedEvent.assignedVolunteers?.some(
                          (v) => v._id === volunteer._id
                        ) || false
                      }
                      onChange={(e) => {
                        const currentIds = selectedEvent.assignedVolunteers?.map((v) =>
                          v._id?.toString ? v._id.toString() : v._id
                        ) || []
                        const volunteerId = volunteer._id.toString()
                        const newIds = e.target.checked
                          ? [...currentIds, volunteerId]
                          : currentIds.filter((id) => id !== volunteerId)
                        setSelectedEvent({
                          ...selectedEvent,
                          assignedVolunteers: newIds.map((id) => ({ _id: id })),
                        })
                      }}
                    />
                    <span>{volunteer.name} ({volunteer.email})</span>
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    const volunteerIds = selectedEvent.assignedVolunteers?.map((v) =>
                      v._id?.toString ? v._id.toString() : v._id
                    ) || []
                    handleAssignVolunteers(selectedEvent._id, volunteerIds)
                  }}
                  className="btn btn-primary"
                >
                  Save Assignments
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedEvent(null)
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default AdminEvents

