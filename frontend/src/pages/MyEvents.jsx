import React from 'react'
import AppShell from '../components/AppShell'
import './MyEvents.css'

const MyEvents = () => {
  return (
    <div className="my-events-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>My Events</h1>
            <p>View the events you have registered for and track attendance.</p>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="coming-soon-card">
              <div className="coming-soon-icon">🗂️</div>
              <h2>Registered Events</h2>
              <p>
                In the full version, this page will show your upcoming and past events,
                including attendance status and feedback options.
              </p>
              <p className="coming-soon-text">This feature is coming soon!</p>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default MyEvents


