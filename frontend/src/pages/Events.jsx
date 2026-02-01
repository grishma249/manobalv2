import React from 'react'
import Navigation from '../components/Navigation'
import { useAuth } from '../context/AuthContext'
import './Events.css'

const Events = () => {
  const { user } = useAuth()

  return (
    <div className="events-page">
      <Navigation />
      <div className="page-header">
        <div className="container">
          <h1>Events</h1>
          <p>Manage and participate in events</p>
        </div>
      </div>
      <div className="page-content">
        <div className="container">
          <div className="coming-soon-card">
            <div className="coming-soon-icon">📅</div>
            <h2>Events Management</h2>
            <p>
              {user?.role === 'admin'
                ? 'Manage all events, approve requests, and track participation.'
                : user?.role === 'school'
                ? 'Submit event requests and track their status.'
                : 'Browse and register for upcoming events.'}
            </p>
            <p className="coming-soon-text">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Events

