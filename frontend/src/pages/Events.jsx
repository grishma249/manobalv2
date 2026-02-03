import React from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import './Events.css'

const Events = () => {
  const { user } = useAuth()

  const isVolunteer = user?.role === 'volunteer'
  const isSchool = user?.role === 'school'

  return (
    <div className="events-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>{isVolunteer ? 'Event Opportunities' : 'Events'}</h1>
            <p>
              {isVolunteer
                ? 'Browse and register for upcoming events that match your interests.'
                : isSchool
                ? 'View workshops and programs relevant to your school.'
                : 'Overview of events across the organization.'}
            </p>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="coming-soon-card">
              <div className="coming-soon-icon">📅</div>
              <h2>Events</h2>
              <p>
                Detailed event listing, filtering, and registration workflows will be
                implemented here.
              </p>
              <p className="coming-soon-text">This feature is coming soon!</p>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default Events

