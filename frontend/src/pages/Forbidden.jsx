import React from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import './Forbidden.css'

const Forbidden = () => {
  return (
    <div className="forbidden-page">
      <Navigation />
      <div className="forbidden-content">
        <div className="container">
          <div className="forbidden-card">
            <div className="forbidden-icon">🚫</div>
            <h1>403 - Access Restricted</h1>
            <p>
              You do not have permission to access this page. If you think this is a
              mistake, please contact the administrator.
            </p>
            <div className="forbidden-actions">
              <Link to="/" className="btn btn-secondary">
                Go to Home
              </Link>
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forbidden


