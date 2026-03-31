import React from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'

const EventPaymentFailure = () => {
  const { user } = useAuth()

  const content = (
    <div className="container" style={{ padding: '40px 0 80px' }}>
      <div className="dashboard-section" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ color: '#d97706', marginBottom: 8 }}>Payment Not Completed</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>
          Your payment was cancelled or failed. No registration was created.
        </p>
        <Link to="/events/public" className="btn btn-primary">
          Back to Events
        </Link>
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

export default EventPaymentFailure

