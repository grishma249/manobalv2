import React from 'react'
import Navigation from '../components/Navigation'
import './Volunteers.css'

const Volunteers = () => {
  return (
    <div className="volunteers-page">
      <Navigation />
      <div className="page-header">
        <div className="container">
          <h1>Volunteers</h1>
          <p>Manage volunteers and track participation</p>
        </div>
      </div>
      <div className="page-content">
        <div className="container">
          <div className="coming-soon-card">
            <div className="coming-soon-icon">👥</div>
            <h2>Volunteer Management</h2>
            <p>
              View registered volunteers, assign participation, and mark attendance
              after event completion.
            </p>
            <p className="coming-soon-text">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Volunteers

