import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import EventLocationMap from '../components/EventLocationMap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './PublicEvents.css'

const PublicEvents = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registeringId, setRegisteringId] = useState(null)
  const [attendingEventIds, setAttendingEventIds] = useState([])
  const [showParticipateModal, setShowParticipateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participateType, setParticipateType] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentPayload, setPaymentPayload] = useState(null) // {name,email,phone} for public flows
  const [paymentMethod, setPaymentMethod] = useState('ESEWA')

  const submitEsewaForm = (gatewayUrl, formData) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = gatewayUrl
    Object.entries(formData || {}).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = String(value ?? '')
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
  }

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

  // If the user is logged in, mark events they're already attending
  useEffect(() => {
    const fetchMyAttendances = async () => {
      if (!user) return
      try {
        const res = await axios.get('/api/events/participations/me')
        const ids =
          res.data?.participations
            ?.filter((p) => p.participationType === 'ATTENDEE')
            .map((p) => p.event?._id?.toString())
            .filter(Boolean) || []
        setAttendingEventIds(ids)
      } catch (_e) {
        setAttendingEventIds([])
      }
    }

    fetchMyAttendances()
  }, [user])

  const fallbackImage = '/img1.jpeg'

  const isAlreadyAttending = (event) =>
    attendingEventIds.includes(event?._id?.toString())

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

      // Paid attendee (public): collect details first, then simulate payment in a separate step.
      if (participateType === 'ATTENDEE' && selectedEvent.isPaid) {
        setPaymentPayload({
          name: formData.name?.trim(),
          email: formData.email?.trim(),
          phone: formData.phone?.trim(),
        })
        setShowParticipateModal(false)
        setShowPaymentModal(true)
        return
      }

      {
        const payload = {
          participationType: participateType,
          name: formData.name?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
        }
        await axios.post(`/api/events/${selectedEvent._id}/participate`, payload)
        setAttendingEventIds((prev) =>
          prev.includes(selectedEvent._id.toString()) ? prev : [...prev, selectedEvent._id.toString()]
        )
        alert('Registration Confirmed')
        setShowParticipateModal(false)
        setSelectedEvent(null)
        setParticipateType(null)
        setFormData({ name: '', email: '', phone: '' })
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register for event')
    } finally {
      setRegisteringId(null)
    }
  }

  const handlePay = async () => {
    if (!selectedEvent) return
    try {
      setPaymentProcessing(true)
      setPaymentError('')
      const startPayload = user ? {} : paymentPayload || {}
      const startRes = await axios.post(`/api/events/${selectedEvent._id}/attend/start`, {
        ...startPayload,
        paymentMethod,
      })

      if (paymentMethod === 'ESEWA') {
        const gatewayUrl = startRes.data?.gatewayUrl
        const formData = startRes.data?.formData
        if (!gatewayUrl || !formData) throw new Error('Failed to initialize eSewa payment.')
        submitEsewaForm(gatewayUrl, formData)
        return
      }

      const paymentSessionId = startRes.data?.paymentSessionId
      if (!paymentSessionId) throw new Error('Card payment session could not be created.')

      await axios.post(`/api/events/${selectedEvent._id}/participate`, {
        participationType: 'ATTENDEE',
        paymentSessionId,
        ...(user ? {} : paymentPayload || {}),
      })

      setAttendingEventIds((prev) =>
        prev.includes(selectedEvent._id.toString()) ? prev : [...prev, selectedEvent._id.toString()]
      )
      alert('Registration Confirmed')
      setShowPaymentModal(false)
      setSelectedEvent(null)
      setParticipateType(null)
      setPaymentPayload(null)
      setPaymentMethod('ESEWA')
      setFormData({ name: '', email: '', phone: '' })
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setPaymentProcessing(false)
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
    if (type === 'ATTENDEE') {
      if (isAlreadyAttending(event)) return

      if (user && event.isPaid) {
        setSelectedEvent(event)
        setParticipateType('ATTENDEE')
        setPaymentPayload(null)
        setPaymentError('')
        setShowPaymentModal(true)
        return
      }

      if (user && !event.isPaid) {
        handleParticipateDirect(event, type)
        return
      }

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
      if (type === 'ATTENDEE') {
        setAttendingEventIds((prev) =>
          prev.includes(event._id.toString()) ? prev : [...prev, event._id.toString()]
        )
      }
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
                    <img
                      className="event-card-image"
                      src={event.imageUrl || fallbackImage}
                      alt={event.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = fallbackImage
                      }}
                    />
                    <h2>{event.title}</h2>
                    <p className="event-meta">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{event.location}</span>
                    </p>
                    {allowsType(event, 'ATTENDEE') && (
                      <div className="event-price">
                        {event.isPaid ? `Paid Event: NPR ${event.price || 0}` : 'Free Event'}
                      </div>
                    )}
                    <p className="event-description">{event.description}</p>
                    <EventLocationMap
                      latitude={event.latitude}
                      longitude={event.longitude}
                      locationName={event.location}
                      height={170}
                      className="event-map-inline"
                    />

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
                            disabled={registeringId === event._id || isAlreadyAttending(event)}
                          >
                            {isAlreadyAttending(event)
                              ? 'Registered'
                              : registeringId === event._id
                              ? 'Processing...'
                              : event.isPaid
                              ? 'Pay & Attend'
                              : 'Attend Event'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="event-details-row">
                      <Link to={`/events/public/${event._id}`} className="event-details-link">
                        View Details
                      </Link>
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
              {selectedEvent?.isPaid ? 'Pay & Attend' : 'Attend Event'} —{' '}
              {selectedEvent?.title}
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
                  {registeringId
                    ? 'Processing...'
                    : selectedEvent?.isPaid
                    ? 'Pay & Attend'
                    : 'Register'}
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

      {/* Payment Modal (eSewa) */}
      {showPaymentModal && selectedEvent && selectedEvent.isPaid && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!paymentProcessing) {
              setShowPaymentModal(false)
              setSelectedEvent(null)
              setParticipateType(null)
              setPaymentPayload(null)
              setPaymentMethod('ESEWA')
              setPaymentError('')
            }
          }}
        >
          <div className="modal-content participate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pay & Attend — {selectedEvent.title}</h3>
            <p className="modal-subtitle">
              Paid Event: NPR {selectedEvent.price || 0}
            </p>

            {paymentError && <div className="alert-error payment-alert">{paymentError}</div>}

            <div className="payment-section">
              <div className="form-group payment-method-group">
                <label>Select Method</label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethodPublicEvents"
                    value="ESEWA"
                    checked={paymentMethod === 'ESEWA'}
                    onChange={() => setPaymentMethod('ESEWA')}
                    disabled={paymentProcessing}
                  />
                  <span>Pay with eSewa (Recommended)</span>
                </label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethodPublicEvents"
                    value="CARD_MOCK"
                    checked={paymentMethod === 'CARD_MOCK'}
                    onChange={() => setPaymentMethod('CARD_MOCK')}
                    disabled={paymentProcessing}
                  />
                  <span>Pay with Card (Mock)</span>
                </label>
              </div>

              {paymentMethod === 'CARD_MOCK' && (
                <>
                  <div className="form-group payment-field-group">
                    <label>Card Number (dummy)</label>
                    <input type="text" placeholder="4242 4242 4242 4242" disabled={paymentProcessing} />
                  </div>
                  <div className="form-row payment-card-row">
                    <div className="form-group payment-card-col">
                      <label>Expiry</label>
                      <input type="text" placeholder="MM/YY" disabled={paymentProcessing} />
                    </div>
                    <div className="form-group payment-card-col">
                      <label>CVC</label>
                      <input type="password" placeholder="123" disabled={paymentProcessing} />
                    </div>
                  </div>
                </>
              )}
              {paymentMethod === 'ESEWA' && (
                <p className="modal-subtitle payment-note">
                  You will be redirected to the official eSewa sandbox gateway to complete payment.
                </p>
              )}
            </div>

            <div className="modal-actions payment-actions">
              <button
                type="button"
                className="btn btn-primary payment-btn-primary"
                disabled={paymentProcessing}
                onClick={handlePay}
              >
                {paymentProcessing
                  ? 'Processing...'
                  : paymentMethod === 'ESEWA'
                  ? 'Proceed to eSewa'
                  : 'Confirm Card Payment'}
              </button>
              <button
                type="button"
                className="btn btn-outline payment-btn-secondary"
                disabled={paymentProcessing}
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedEvent(null)
                  setParticipateType(null)
                  setPaymentPayload(null)
                  setPaymentMethod('ESEWA')
                  setPaymentError('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicEvents


