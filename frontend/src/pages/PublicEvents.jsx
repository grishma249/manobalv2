import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './PublicEvents.css'

const PublicEvents = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registeringId, setRegisteringId] = useState(null)
  const [showParticipateModal, setShowParticipateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participateType, setParticipateType] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const res = await axios.get('/api/events/public')
        setEvents(res.data.events || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const needsForm = (type) => {
    if (user) return false
    return true
  }

  const openParticipateModal = (event, type) => {
    setSelectedEvent(event)
    setParticipateType(type)
    setFormData({ name: '', email: '', phone: '' })
    setShowParticipateModal(true)
  }

  const handleParticipate = async (e) => {
    e?.preventDefault()
    if (!selectedEvent) return
    if (needsForm(participateType) && (!formData.name?.trim() || !formData.email?.trim())) {
      alert('Name and email are required.')
      return
    }
    try {
      setRegisteringId(selectedEvent._id)
      const payload = {
        participationType: participateType,
        name: formData.name?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      }
      await axios.post(`/api/events/${selectedEvent._id}/participate`, payload)
      alert(
        participateType === 'ATTENDEE'
          ? 'Thank you for registering to attend this event!'
          : 'Thank you for joining as a supporter!'
      )
      setShowParticipateModal(false)
      setSelectedEvent(null)
      setParticipateType(null)
      setFormData({ name: '', email: '', phone: '' })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register for event')
    } finally {
      setRegisteringId(null)
    }
  }

  const handleAttendOrDonorClick = (event, type) => {
    if (type === 'DONOR') {
      if (!user) {
        navigate('/login')
        return
      }
      // Structured flow: donor donation linked to event
      navigate(`/donations?eventId=${event._id}`)
      return
    }

    // ATTENDEE flow stays as participation (public allowed)
    if (user && type === 'ATTENDEE') {
      handleParticipateDirect(event, type)
    } else {
      openParticipateModal(event, type)
    }
  }

  const handleParticipateDirect = async (event, type) => {
    if (!event) return
    try {
      setRegisteringId(event._id)
      await axios.post(`/api/events/${event._id}/participate`, {
        participationType: type,
      })
      alert(
        type === 'ATTENDEE'
          ? 'Thank you for registering to attend this event!'
          : 'Thank you for joining as a supporter!'
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register for event')
    } finally {
      setRegisteringId(null)
    }
  }

  const allowsType = (event, type) =>
    Array.isArray(event.allowedParticipationTypes) &&
    event.allowedParticipationTypes.includes(type)

  const content = (
    <>
      <div className="public-events-hero">
        <div className="container">
          <h1>Upcoming Events</h1>
          <p>Explore upcoming programs and workshops organized by Manobal Nepal.</p>
        </div>
      </div>
      <div className="public-events-content">
        <div className="container">
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event._id} className="event-card">
                    <h2>{event.title}</h2>
                    <p className="event-meta">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{event.location}</span>
                    </p>
                    <p className="event-description">{event.description}</p>

                    <div className="participation-section">
                      <h3>Participate</h3>
                      <div className="participation-buttons">
                        {allowsType(event, 'VOLUNTEER') && (
                          <a href="/events" className="btn btn-outline btn-sm">
                            Volunteer
                          </a>
                        )}
                        {allowsType(event, 'DONOR') && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleAttendOrDonorClick(event, 'DONOR')}
                            disabled={registeringId === event._id}
                          >
                            {registeringId === event._id ? 'Registering...' : 'Support as Donor'}
                          </button>
                        )}
                        {allowsType(event, 'ATTENDEE') && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAttendOrDonorClick(event, 'ATTENDEE')}
                            disabled={registeringId === event._id}
                          >
                            {registeringId === event._id ? 'Registering...' : 'Attend Event'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="public-events-note">
                To volunteer for events, please{' '}
                <strong>create a Volunteer account and log in.</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )

  // Unauthenticated users use the simple top nav layout
  if (!user) {
    return (
      <div className="public-events-page">
        <Navigation />
        {content}
      </div>
    )
  }

  // Authenticated users (donor/volunteer/school) see AppShell with sidebar
  return (
    <div className="public-events-page">
      <AppShell>{content}</AppShell>

      {/* Participation Modal (for public users) */}
      {showParticipateModal && selectedEvent && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowParticipateModal(false)
            setSelectedEvent(null)
          }}
        >
          <div className="modal-content participate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {participateType === 'ATTENDEE' ? 'Attend Event' : 'Join as Supporter'} —{' '}
              {selectedEvent.title}
            </h3>
            <p className="modal-subtitle">
              Please enter your details to register for this event.
            </p>
            <form onSubmit={handleParticipate}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={registeringId}>
                  {registeringId ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowParticipateModal(false)
                    setSelectedEvent(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicEvents


