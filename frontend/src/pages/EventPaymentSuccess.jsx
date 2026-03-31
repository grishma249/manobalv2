import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'

const EventPaymentSuccess = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const data = searchParams.get('data')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState(null)

  useEffect(() => {
    const confirm = async () => {
      try {
        if (!data) {
          setError('Missing payment confirmation data from eSewa.')
          return
        }
        const res = await axios.post('/api/events/payments/esewa/confirm', { data })
        setEventId(res.data?.eventId || null)
      } catch (err) {
        setError(err.response?.data?.message || 'Payment verification failed.')
      } finally {
        setLoading(false)
      }
    }
    confirm()
  }, [data])

  const content = (
    <div className="container" style={{ padding: '40px 0 80px' }}>
      <div className="dashboard-section" style={{ maxWidth: 760, margin: '0 auto' }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Verifying payment and finalizing registration...</p>
          </div>
        ) : error ? (
          <div>
            <h2 style={{ color: '#d32f2f', marginBottom: 8 }}>Payment Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>{error}</p>
            <Link to="/events/public" className="btn btn-primary">
              Back to Events
            </Link>
          </div>
        ) : (
          <div>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: 8 }}>Registration Confirmed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
              Your eSewa payment was verified and your attendance is confirmed.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {eventId && (
                <Link to={`/events/public/${eventId}`} className="btn btn-outline">
                  View Event
                </Link>
              )}
              <Link to="/events/public" className="btn btn-primary">
                Back to Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (!user) {
    return (
      <div>
        <Navigation />
        {content}
      </div>
    )
  }

  return <AppShell>{content}</AppShell>
}

export default EventPaymentSuccess

