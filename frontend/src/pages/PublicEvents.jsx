import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import EventLocationMap from '../components/EventLocationMap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './PublicEvents.css'

/* ─── Skeleton card ───────────────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="event-skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line short" />
      <div className="skeleton-line medium" style={{ height: 18, marginBottom: 12 }} />
      <div className="skeleton-line long" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </div>
  </div>
)

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
  const [paymentPayload, setPaymentPayload] = useState(null)
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
  const isAlreadyAttending = (event) => attendingEventIds.includes(event?._id?.toString())
  const needsForm = () => !user

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
      if (!user) { navigate('/login'); return }
      navigate(`/donations?eventId=${event._id}`)
      return
    }
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
      await axios.post(`/api/events/${event._id}/participate`, { participationType: type })
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

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const formatDateBadge = (dateStr) => {
    const d = new Date(dateStr)
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
    }
  }

  const closePaymentModal = () => {
    if (paymentProcessing) return
    setShowPaymentModal(false)
    setSelectedEvent(null)
    setParticipateType(null)
    setPaymentPayload(null)
    setPaymentMethod('ESEWA')
    setPaymentError('')
  }

  /* ─── Main content ────────────────────────────────────────────────────── */
  const content = (
    <>
      {/* Hero */}
      <div className="public-events-hero">
        <div className="container">
          <span className="public-events-kicker">Manobal Programs</span>
          <h1>Upcoming Events</h1>
          <p>Discover workshops, awareness drives, and community sessions you can join today.</p>
          {!loading && events.length > 0 && (
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">{events.length}</span>
                <span className="hero-stat-label">Events</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">
                  {events.filter((e) => allowsType(e, 'ATTENDEE') && !e.isPaid).length}
                </span>
                <span className="hero-stat-label">Free</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">
                  {events.filter((e) => allowsType(e, 'VOLUNTEER')).length}
                </span>
                <span className="hero-stat-label">Open to Volunteers</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="public-events-content">
        <div className="container">
          {error && <div className="alert-error-bar">{error}</div>}

          {/* Skeleton loading */}
          {loading ? (
            <div className="events-skeleton-grid">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <>
              {events.length > 0 && (
                <div className="events-section-header">
                  <h2 className="events-section-title">Browse Events</h2>
                  <span className="events-count-badge">{events.length} event{events.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="events-grid">
                {events.length === 0 ? (
                  <div className="events-empty-state">
                    <div className="events-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <h3>No events yet</h3>
                    <p>Check back soon — new community sessions and workshops are being added regularly.</p>
                  </div>
                ) : (
                  events.map((event, idx) => {
                    const { day, month } = formatDateBadge(event.date)
                    const isPaid = event.isPaid
                    const accentClass = isPaid ? 'accent-paid' : 'accent-free'
                    const attending = isAlreadyAttending(event)

                    return (
                      <div
                        key={event._id}
                        className="event-card"
                        style={{ '--card-i': idx }}
                      >
                        {/* Accent bar */}
                        <div className={`event-card-accent ${accentClass}`} />

                        {/* Image + overlay */}
                        <div className="event-card-media">
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
                          <div className="event-card-overlay">
                            {/* Date badge */}
                            <div className="event-date-badge">
                              <span className="event-date-day">{day}</span>
                              <span className="event-date-month">{month}</span>
                            </div>
                            {/* Price chip */}
                            {allowsType(event, 'ATTENDEE') && (
                              <span className={`event-price-chip ${isPaid ? 'chip-paid' : 'chip-free'}`}>
                                {isPaid ? `NPR ${event.price || 0}` : 'Free'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body */}
                        <div className="event-card-body">
                          <p className="event-location-line">{event.location}</p>
                          <h2 className="event-card-title">{event.title}</h2>
                          <p className="event-description">{event.description}</p>
                        </div>

                        {/* Map */}
                        <EventLocationMap
                          latitude={event.latitude}
                          longitude={event.longitude}
                          locationName={event.location}
                          height={200}
                          className="event-map-inline"
                        />

                        {/* Participation */}
                        <div className="participation-section">
                          <div className="participation-label">Join This Event</div>
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
                                disabled={registeringId === event._id || attending}
                              >
                                {attending
                                  ? '✓ Registered'
                                  : registeringId === event._id
                                    ? 'Processing...'
                                    : isPaid
                                      ? 'Pay & Attend'
                                      : 'Attend Event'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="event-card-footer">
                          <Link to={`/events/public/${event._id}`} className="event-details-link">
                            View Details
                          </Link>
                        </div>
                      </div>
                    )
                  })
                )}
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

  if (!user) {
    return (
      <div className="public-events-page">
        <Navigation />
        {content}
      </div>
    )
  }

  return (
    <div className="public-events-page">
      <AppShell>{content}</AppShell>

      {/* ── Participation Modal (public / guest users) ── */}
      {showParticipateModal && selectedEvent && (
        <div
          className="modal-overlay"
          onClick={() => { setShowParticipateModal(false); setSelectedEvent(null) }}
        >
          <div className="participate-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-accent-bar ${selectedEvent?.isPaid ? 'accent-paid' : ''}`} />
            <div className="modal-header">
              <h3>
                {selectedEvent?.isPaid ? 'Pay & Attend' : 'Attend Event'}
              </h3>
              <p className="modal-subtitle">{selectedEvent?.title}</p>
            </div>
            <div className="modal-body">
              <form onSubmit={handleParticipate}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
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
                  <label>Phone <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(optional)</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+977 ..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!!registeringId}>
                    {registeringId
                      ? 'Processing...'
                      : selectedEvent?.isPaid
                        ? 'Continue to Payment'
                        : 'Register Now'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setShowParticipateModal(false); setSelectedEvent(null) }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && selectedEvent && selectedEvent.isPaid && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="participate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-accent-bar accent-paid" />
            <div className="modal-header">
              <h3>Complete Payment</h3>
              <p className="modal-subtitle">{selectedEvent.title}</p>
            </div>
            <div className="modal-body">
              {paymentError && (
                <div className="alert-error payment-alert">{paymentError}</div>
              )}

              <div className="payment-price-display">
                <span className="payment-price-currency">NPR</span>
                <span className="payment-price-amount">{selectedEvent.price || 0}</span>
              </div>

              <div className="payment-section">
                <div className="payment-method-group">
                  <label className="participate-modal .form-group label" style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Payment Method
                  </label>
                  <label className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethodPublicEvents"
                      value="ESEWA"
                      checked={paymentMethod === 'ESEWA'}
                      onChange={() => setPaymentMethod('ESEWA')}
                      disabled={paymentProcessing}
                    />
                    <span>eSewa <span style={{ fontWeight: 400, color: '#94a3b8' }}>(recommended)</span></span>
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
                    <span>Card <span style={{ fontWeight: 400, color: '#94a3b8' }}>(mock / demo)</span></span>
                  </label>
                </div>

                {paymentMethod === 'CARD_MOCK' && (
                  <>
                    <div className="payment-field-group form-group">
                      <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        disabled={paymentProcessing}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde4f0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="payment-card-row">
                      <div className="payment-card-col form-group">
                        <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          disabled={paymentProcessing}
                          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde4f0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div className="payment-card-col form-group">
                        <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          disabled={paymentProcessing}
                          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #dde4f0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'ESEWA' && (
                  <p className="payment-note">
                    You'll be redirected to the official eSewa sandbox gateway to complete your payment securely.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-actions payment-actions">
              <button
                type="button"
                className="btn payment-btn-primary"
                disabled={paymentProcessing}
                onClick={handlePay}
              >
                {paymentProcessing
                  ? 'Processing...'
                  : paymentMethod === 'ESEWA'
                    ? 'Proceed to eSewa →'
                    : 'Confirm Payment'}
              </button>
              <button
                type="button"
                className="btn btn-outline payment-btn-secondary"
                disabled={paymentProcessing}
                onClick={closePaymentModal}
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
