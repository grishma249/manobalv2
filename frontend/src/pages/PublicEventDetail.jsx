import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import Navigation from '../components/Navigation'
import './PublicEventDetail.css'

const PublicEventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [attendingEventIds, setAttendingEventIds] = useState([])
  const [registering, setRegistering] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentPayload, setPaymentPayload] = useState(null)

  const fallbackImage = '/img1.jpeg'

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/api/events/${id}`)
        setEvent(res.data.event || null)
        setError('')
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

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

  const allowsType = (type) =>
    event?.allowedParticipationTypes?.includes(type) || false

  const isAlreadyAttending = event
    ? attendingEventIds.includes(event._id.toString())
    : false

  const handleMockPay = async (payload) => {
    if (!event) return
    try {
      setPaymentProcessing(true)
      setPaymentError('')

      const startRes = await axios.post(`/api/events/${event._id}/attend/start`, payload || {})
      const paymentSessionId = startRes.data?.paymentSessionId
      if (!paymentSessionId) throw new Error('Payment session not created.')

      await axios.post(`/api/events/${event._id}/participate`, {
        participationType: 'ATTENDEE',
        paymentSessionId,
        ...((user ? {} : payload) || {}),
      })

      setAttendingEventIds((prev) =>
        prev.includes(event._id.toString()) ? prev : [...prev, event._id.toString()]
      )

      alert('Registration Confirmed')
      setShowPaymentModal(false)
      setShowModal(false)
      setFormData({ name: '', email: '', phone: '' })
      setPaymentPayload(null)
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setPaymentProcessing(false)
      setRegistering(false)
    }
  }

  const handleAttend = async () => {
    if (!event) return
    if (isAlreadyAttending) return

    try {
      setRegistering(true)
      // Free attendee: direct participation
      if (!event.isPaid) {
        if (!user) {
          setShowModal(true)
          return
        }
        await axios.post(`/api/events/${event._id}/participate`, {
          participationType: 'ATTENDEE',
        })
        setAttendingEventIds((prev) => [...prev, event._id.toString()])
        alert('Registration Confirmed')
        return
      }

      // Paid attendee
      if (!user) {
        setShowModal(true)
        return
      }

      // Logged-in paid attendee: open mock payment modal.
      setPaymentPayload(null)
      setShowPaymentModal(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Payment/registration failed')
    } finally {
      setRegistering(false)
    }
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    if (!event) return
    try {
      setRegistering(true)
      const payload = {
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
      }

      if (event.isPaid) {
        // For paid attendees, proceed to mock payment modal after collecting details.
        setPaymentPayload(payload)
        setShowModal(false)
        setShowPaymentModal(true)
        return
      } else {
        await axios.post(`/api/events/${event._id}/participate`, {
          participationType: 'ATTENDEE',
          ...payload,
        })
        setAttendingEventIds((prev) =>
          prev.includes(event._id.toString()) ? prev : [...prev, event._id.toString()]
        )
      }

      setShowModal(false)
      setFormData({ name: '', email: '', phone: '' })
      alert('Registration Confirmed')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="public-event-detail-page">
        <AppShell>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading event...</p>
          </div>
        </AppShell>
      </div>
    )
  }

  const content = (
    <>
      <div className="public-event-hero">
        <div className="container">
          <h1>{event?.title}</h1>
          <p>{event?.description}</p>
        </div>
      </div>

      <div className="public-event-content">
        <div className="container">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="event-detail-layout">
            <div className="event-detail-media">
              <img
                src={event?.imageUrl || fallbackImage}
                alt={event?.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = fallbackImage
                }}
              />
            </div>

            <div className="event-detail-info">
              <div className="detail-line">
                <strong>Date:</strong> {event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
              </div>
              <div className="detail-line">
                <strong>Location:</strong> {event?.location || 'N/A'}
              </div>
              {allowsType('ATTENDEE') && (
                <div className="detail-line">
                  <strong>{event?.isPaid ? 'Price:' : 'Admission:'}</strong>{' '}
                  {event?.isPaid ? `NPR ${event?.price || 0}` : 'Free Event'}
                </div>
              )}

              <div className="detail-cta">
                <div className="detail-cta-title">Participate</div>
                <div className="detail-cta-buttons">
                  {allowsType('VOLUNTEER') && (
                    <Link to="/events" className="btn btn-outline btn-full">
                      Volunteer
                    </Link>
                  )}
                  {allowsType('DONOR') && (
                    <button
                      className="btn btn-outline btn-full"
                      type="button"
                      onClick={() => navigate(`/donations?eventId=${event._id}`)}
                    >
                      Support as Donor
                    </button>
                  )}
                  {allowsType('ATTENDEE') && (
                    <button
                      className="btn btn-primary btn-full"
                      type="button"
                      onClick={handleAttend}
                      disabled={registering || paymentProcessing || isAlreadyAttending}
                    >
                      {isAlreadyAttending
                        ? 'Registered'
                        : registering
                        ? 'Processing...'
                        : event?.isPaid
                        ? 'Pay & Attend'
                        : 'Attend Event'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content participate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{event?.isPaid ? 'Pay & Attend' : 'Attend Event'}</h3>
            <p className="modal-subtitle">Please enter your details to register for this event.</p>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" disabled={registering} type="submit">
                  {registering ? 'Registering...' : 'Register'}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && event?.isPaid && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!paymentProcessing) {
              setShowPaymentModal(false)
              setPaymentPayload(null)
              setPaymentError('')
            }
          }}
        >
          <div className="modal-content participate-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pay & Attend — {event.title}</h3>
            <p className="modal-subtitle">
              Paid Event: NPR {event.price || 0}. This is a simulated payment flow.
            </p>

            {paymentError && (
              <div className="alert-error" style={{ marginBottom: 12 }}>
                {paymentError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Card Number (dummy)</label>
                <input type="text" placeholder="4242 4242 4242 4242" disabled={paymentProcessing} />
              </div>
              <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 14 }}>
                  <label>Expiry</label>
                  <input type="text" placeholder="MM/YY" disabled={paymentProcessing} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 14 }}>
                  <label>CVC</label>
                  <input type="password" placeholder="123" disabled={paymentProcessing} />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={paymentProcessing}
                onClick={() => handleMockPay(user ? {} : paymentPayload)}
              >
                {paymentProcessing ? 'Processing...' : 'Pay'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={paymentProcessing}
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentPayload(null)
                  setPaymentError('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="public-event-detail-page">
      {user ? <AppShell>{content}</AppShell> : <><Navigation />{content}</>}
    </div>
  )
}

export default PublicEventDetail

