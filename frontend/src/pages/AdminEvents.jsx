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
  const [eventImageFile, setEventImageFile] = useState(null)
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    eventType: 'workshop',
    date: '',
    location: '',
    latitude: '',
    longitude: '',
    targetAudience: '',
    numberOfStudents: '',
    notes: '',
    allowedParticipationTypes: ['VOLUNTEER'],
    isPaid: false,
    price: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false)
  const [eventParticipations, setEventParticipations] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loadingParticipations, setLoadingParticipations] = useState(false)

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

  const openRegistrationsModal = async (event) => {
    setSelectedEvent(event)
    setShowRegistrationsModal(true)
    setLoadingParticipations(true)
    try {
      const response = await axios.get(`/api/admin/events/${event._id}/participations`)
      setEventParticipations(response.data.participations)
      setPendingCount(response.data.pendingCount || 0)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load registrations')
      setEventParticipations([])
    } finally {
      setLoadingParticipations(false)
    }
  }

  const handleApproveParticipation = async (participationId) => {
    try {
      await axios.patch(`/api/admin/participations/${participationId}/approve`)
      if (selectedEvent) {
        const response = await axios.get(`/api/admin/events/${selectedEvent._id}/participations`)
        setEventParticipations(response.data.participations)
        setPendingCount(response.data.pendingCount || 0)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve registration')
    }
  }

  const handleRejectParticipation = async (participationId) => {
    try {
      await axios.patch(`/api/admin/participations/${participationId}/reject`)
      if (selectedEvent) {
        const response = await axios.get(`/api/admin/events/${selectedEvent._id}/participations`)
        setEventParticipations(response.data.participations)
        setPendingCount(response.data.pendingCount || 0)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration')
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setCreateError('')

      const hasLatitude = String(createFormData.latitude || '').trim() !== ''
      const hasLongitude = String(createFormData.longitude || '').trim() !== ''
      if (hasLatitude !== hasLongitude) {
        setCreateError('Please provide both latitude and longitude for map location.')
        setSubmitting(false)
        return
      }

      const formPayload = new FormData()
      formPayload.append('title', createFormData.title)
      formPayload.append('description', createFormData.description)
      formPayload.append('eventType', createFormData.eventType)
      formPayload.append('date', createFormData.date)
      formPayload.append('location', createFormData.location)
      formPayload.append('latitude', createFormData.latitude || '')
      formPayload.append('longitude', createFormData.longitude || '')
      formPayload.append('targetAudience', createFormData.targetAudience || '')
      formPayload.append(
        'numberOfStudents',
        createFormData.numberOfStudents ? String(parseInt(createFormData.numberOfStudents)) : ''
      )
      formPayload.append('notes', createFormData.notes || '')

      formPayload.append(
        'allowedParticipationTypes',
        JSON.stringify(createFormData.allowedParticipationTypes || ['VOLUNTEER'])
      )
      formPayload.append('isPaid', createFormData.isPaid ? 'true' : 'false')
      formPayload.append('price', createFormData.price ? String(createFormData.price) : '0')

      if (eventImageFile) {
        formPayload.append('image', eventImageFile)
      }

      await axios.post('/api/admin/events', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setShowCreateModal(false)
      setEventImageFile(null)
      setCreateFormData({
        title: '',
        description: '',
        eventType: 'workshop',
        date: '',
        location: '',
        latitude: '',
        longitude: '',
        targetAudience: '',
        numberOfStudents: '',
        notes: '',
        allowedParticipationTypes: ['VOLUNTEER'],
        isPaid: false,
        price: '',
      })
      fetchEvents()
      alert('Event created successfully! It is now visible to volunteers.')
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.map((e) => e.msg).join(', ')
        : err.response?.data?.message || 'Failed to create event'
      setCreateError(errorMsg)
    } finally {
      setSubmitting(false)
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
                            onClick={() => openRegistrationsModal(event)}
                            className="btn btn-outline btn-sm"
                          >
                            Manage Registrations
                          </button>
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

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Event</h2>
              <p className="modal-subtitle">
                Events created here will be automatically approved and visible to volunteers.
              </p>
              {createError && <div className="alert alert-error">{createError}</div>}
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label htmlFor="title">Event Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={createFormData.title}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, title: e.target.value })
                    }
                    placeholder="e.g., Mental Health Awareness Workshop"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    rows="4"
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, description: e.target.value })
                    }
                    placeholder="Describe the event, its objectives, and what participants will learn."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="eventType">Event Type *</label>
                    <select
                      id="eventType"
                      value={createFormData.eventType}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, eventType: e.target.value })
                      }
                      required
                    >
                      <option value="workshop">Workshop</option>
                      <option value="awareness">Awareness Program</option>
                      <option value="training">Training</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="date">Event Date *</label>
                    <input
                      type="datetime-local"
                      id="date"
                      value={createFormData.date}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    value={createFormData.location}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, location: e.target.value })
                    }
                    placeholder="Event venue or address"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="number"
                      id="latitude"
                      value={createFormData.latitude}
                      step="any"
                      min="-90"
                      max="90"
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, latitude: e.target.value })
                      }
                      placeholder="e.g., 27.7172"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      type="number"
                      id="longitude"
                      value={createFormData.longitude}
                      step="any"
                      min="-180"
                      max="180"
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, longitude: e.target.value })
                      }
                      placeholder="e.g., 85.3240"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="eventImage">Event Image (JPG/JPEG/PNG, max 2MB)</label>
                  <input
                    type="file"
                    id="eventImage"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setEventImageFile(file || null)
                    }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Paid for Public Attendees</label>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={createFormData.isPaid}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setCreateFormData({
                            ...createFormData,
                            isPaid: checked,
                            price: checked ? createFormData.price || '' : '',
                          })
                        }}
                      />
                      <span>Enable payment (ATTENDEE only)</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">Price (NPR)</label>
                    <input
                      type="number"
                      id="price"
                      value={createFormData.price}
                      min="0"
                      step="1"
                      disabled={!createFormData.isPaid}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, price: e.target.value })
                      }
                      placeholder={createFormData.isPaid ? 'e.g., 500' : 'Enable payment to set a price'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Allowed Participation</label>
                  <div className="participation-options">
                    <label>
                      <input
                        type="checkbox"
                        checked={createFormData.allowedParticipationTypes.includes('VOLUNTEER')}
                        onChange={(e) => {
                          const current = createFormData.allowedParticipationTypes || []
                          const next = e.target.checked
                            ? Array.from(new Set([...current, 'VOLUNTEER']))
                            : current.filter((t) => t !== 'VOLUNTEER')
                          setCreateFormData({ ...createFormData, allowedParticipationTypes: next })
                        }}
                      />
                      <span>Volunteers</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={createFormData.allowedParticipationTypes.includes('DONOR')}
                        onChange={(e) => {
                          const current = createFormData.allowedParticipationTypes || []
                          const next = e.target.checked
                            ? Array.from(new Set([...current, 'DONOR']))
                            : current.filter((t) => t !== 'DONOR')
                          setCreateFormData({ ...createFormData, allowedParticipationTypes: next })
                        }}
                      />
                      <span>Donors</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={createFormData.allowedParticipationTypes.includes('ATTENDEE')}
                        onChange={(e) => {
                          const current = createFormData.allowedParticipationTypes || []
                          const next = e.target.checked
                            ? Array.from(new Set([...current, 'ATTENDEE']))
                            : current.filter((t) => t !== 'ATTENDEE')
                          setCreateFormData({ ...createFormData, allowedParticipationTypes: next })
                        }}
                      />
                      <span>Public Attendees</span>
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="targetAudience">Target Audience</label>
                    <input
                      type="text"
                      id="targetAudience"
                      value={createFormData.targetAudience}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, targetAudience: e.target.value })
                      }
                      placeholder="e.g., Grade 9-10 students"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="numberOfStudents">Number of Students</label>
                    <input
                      type="number"
                      id="numberOfStudents"
                      value={createFormData.numberOfStudents}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, numberOfStudents: e.target.value })
                      }
                      placeholder="e.g., 80"
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    rows="3"
                    value={createFormData.notes}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, notes: e.target.value })
                    }
                    placeholder="Any additional information or special requirements"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateError('')
                      setCreateFormData({
                        title: '',
                        description: '',
                        eventType: 'workshop',
                        date: '',
                        location: '',
                        latitude: '',
                        longitude: '',
                        targetAudience: '',
                        numberOfStudents: '',
                        notes: '',
                        allowedParticipationTypes: ['VOLUNTEER'],
                        isPaid: false,
                        price: '',
                      })
                      setEventImageFile(null)
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Registrations Modal */}
        {showRegistrationsModal && selectedEvent && (
          <div className="modal-overlay" onClick={() => setShowRegistrationsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Manage Registrations - {selectedEvent.title}</h2>
              <p className="modal-subtitle">
                Volunteers who self-register appear below. Approve or reject pending requests.
              </p>
              {loadingParticipations ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading registrations...</p>
                </div>
              ) : eventParticipations.length === 0 ? (
                <p className="empty-state">No volunteer registrations for this event yet.</p>
              ) : (
                <div className="registrations-list">
                  {eventParticipations.map((p) => (
                    <div key={p._id} className="registration-item">
                      <div>
                        <strong>{p.volunteer?.name}</strong>
                        <span className="registration-email"> ({p.volunteer?.email})</span>
                      </div>
                      <div className="registration-meta">
                        <span
                          className={`status-badge status-${p.status}`}
                          style={{
                            backgroundColor:
                              p.status === 'pending'
                                ? '#ffc107'
                                : p.status === 'registered' || p.status === 'confirmed'
                                ? '#17a2b8'
                                : p.status === 'attended'
                                ? '#28a745'
                                : '#6c757d',
                          }}
                        >
                          {p.status}
                        </span>
                        {p.status === 'pending' && (
                          <span className="registration-actions">
                            <button
                              onClick={() => handleApproveParticipation(p._id)}
                              className="btn btn-success btn-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectParticipation(p._id)}
                              className="btn btn-danger btn-sm"
                            >
                              Reject
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setShowRegistrationsModal(false)
                    setSelectedEvent(null)
                  }}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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

