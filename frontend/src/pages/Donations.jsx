import React from 'react'
import Navigation from '../components/Navigation'
import { useAuth } from '../context/AuthContext'
import './Donations.css'

const Donations = () => {
  const { user } = useAuth()

  return (
    <div className="donations-page">
      <Navigation />
      <div className="page-header">
        <div className="container">
          <h1>Donations</h1>
          <p>
            {user?.role === 'admin'
              ? 'Oversee all donations and track impact'
              : 'Track your contributions and their impact'}
          </p>
        </div>
      </div>
      <div className="page-content">
        <div className="container">
          <div className="coming-soon-card">
            <div className="coming-soon-icon">💰</div>
            <h2>Donation Management</h2>
            <p>
              {user?.role === 'admin'
                ? 'View all donations, filter by type and date, and generate reports.'
                : 'Log your donations and view your contribution history.'}
            </p>
            <p className="coming-soon-text">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Donations

