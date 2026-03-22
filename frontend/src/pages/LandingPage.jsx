import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <h1 className="logo">Manobal Nepal</h1>
            <div className="nav-links">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="landing-content">
        <div className="container">
          <section className="hero">
            <h2>Welcome to Manobal Nepal</h2>
            <p className="tagline">Empowering Communities Through Education and Support</p>
            <p className="description">
              Manobal Nepal is dedicated to improving organizational efficiency, transparency, and outreach
              by connecting donors, volunteers, partner schools, and administrators through our digital platform.
            </p>
            {!isAuthenticated && (
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In
                </Link>
              </div>
            )}
          </section>

          <section className="features">
            <h3>Our Mission</h3>
            <div className="feature-grid">
              <div className="feature-card">
                <h4>Event Coordination</h4>
                <p>Streamlined event management for workshops and awareness programs</p>
              </div>
              <div className="feature-card">
                <h4>Donation Tracking</h4>
                <p>Transparent tracking of monetary and physical donations</p>
              </div>
              <div className="feature-card">
                <h4>Volunteer Management</h4>
                <p>Efficient coordination of volunteer participation and activities</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Manobal Nepal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

