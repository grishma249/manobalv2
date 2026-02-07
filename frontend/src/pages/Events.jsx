import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Events.css'

const Events = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({})
  const [registering, setRegistering] = useState(null)

  const isVolunteer = user?.role === 'volunteer'
  const isSchool = user?.role === 'school'

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/events', { replace: true })
      return
    }

    if (isVolunteer) {
      fetchVolunteerEvents()
    } else if (isSchool) {
      fetchSchoolEvents()
    }
  }, [user, navigate, isVolunteer, isSchool])

  const fetchVolunteerEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/volunteers/events')
      setEvents(response.data.events)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/schools/events')
      setEvents(response.data.events)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      setRegistering(eventId)
      await axios.post(`/api/volunteers/events/${eventId}/register`)
      alert('Successfully registered for this event!')
      fetchVolunteerEvents() // Refresh to update registration status
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register for event')
    } finally {
      setRegistering(null)
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
    <div className="events-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>{isVolunteer ? 'Event Opportunities' : 'My Event Requests'}</h1>
            <p>
              {isVolunteer
                ? 'Browse and register for upcoming events that match your interests.'
                : 'View the status of your event requests and assigned volunteers.'}
            </p>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : events.length > 0 ? (
              <>
                <div className="events-grid">
                  {events.map((event) => (
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
                          <strong>Type:</strong> {getEventTypeDisplay(event.eventType)}
                        </div>
                        <div className="detail-item">
                          <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="detail-item">
                          <strong>Location:</strong> {event.location}
                        </div>
                        {event.numberOfStudents && (
                          <div className="detail-item">
                            <strong>Students:</strong> {event.numberOfStudents}
                          </div>
                        )}
                        {isSchool && event.assignedVolunteers?.length > 0 && (
                          <div className="detail-item">
                            <strong>Assigned Volunteers:</strong>{' '}
                            {event.assignedVolunteers.map((v) => v.name).join(', ')}
                          </div>
                        )}
                        {isSchool && event.approvedBy && (
                          <div className="detail-item">
                            <strong>Approved by:</strong> {event.approvedBy.name}
                          </div>
                        )}
                      </div>
                      {isVolunteer && (
                        <div className="event-actions">
                          {event.isRegistered ? (
                            <div className="registered-badge">
                              ✓ Registered ({event.registrationStatus})
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRegister(event._id)}
                              disabled={registering === event._id}
                              className="btn btn-primary btn-full"
                            >
                              {registering === event._id ? 'Registering...' : 'Register for Event'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => {
                        // Add pagination logic if needed
                      }}
                      className="btn btn-outline"
                      disabled
                    >
                      Previous
                    </button>
                    <span>
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => {
                        // Add pagination logic if needed
                      }}
                      className="btn btn-outline"
                      disabled
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No events found</h3>
                <p>
                  {isVolunteer
                    ? 'There are no available events at the moment. Check back later!'
                    : 'You have not requested any events yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default Events
