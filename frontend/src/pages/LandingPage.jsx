import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import './LandingPage.css'

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth()

  const roleFeatures = {
    donor: {
      title: 'For Donors',
      description: 'Make a meaningful impact with transparent donation tracking',
      features: [
        'Log monetary and physical donations',
        'Track your contribution history',
        'See the impact of your generosity',
        'Transparent donation records',
      ],
      icon: '💝',
      color: '#FF6B6B',
    },
    volunteer: {
      title: 'For Volunteers',
      description: 'Join events and make a difference in your community',
      features: [
        'Browse upcoming events',
        'Register for workshops and programs',
        'Track your participation history',
        'Build your volunteer portfolio',
      ],
      icon: '🤝',
      color: '#4ECDC4',
    },
    school: {
      title: 'For Schools',
      description: 'Request workshops and awareness programs for your students',
      features: [
        'Submit event requests easily',
        'Track request status in real-time',
        'Coordinate with Manobal Nepal',
        'Access educational resources',
      ],
      icon: '🏫',
      color: '#95E1D3',
    },
    admin: {
      title: 'For Administrators',
      description: 'Manage all operations from a centralized dashboard',
      features: [
        'Oversee all events and requests',
        'Manage volunteers and donations',
        'Track organizational metrics',
        'Coordinate all activities',
      ],
      icon: '⚙️',
      color: '#F38181',
    },
  }

  return (
    <div className="landing-page">
      <Navigation />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>🌱 Empowering Communities</span>
          </div>
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Manobal Nepal</span>
          </h1>
          <p className="hero-subtitle">
            Connecting donors, volunteers, schools, and administrators through our
            digital platform to create lasting positive change.
          </p>
          {!isAuthenticated && (
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-hero">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-hero">
                Sign In
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <div className="hero-cta">
              <Link to="/dashboard" className="btn btn-primary btn-hero">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
        <div className="hero-scroll">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-description">
              We are dedicated to improving organizational efficiency, transparency,
              and outreach by digitizing core NGO operations.
            </p>
          </div>

          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">📅</div>
              <h3>Event Coordination</h3>
              <p>
                Streamlined event management system for workshops, awareness programs,
                and community activities.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">💰</div>
              <h3>Donation Tracking</h3>
              <p>
                Transparent and secure tracking of monetary contributions and
                physical goods donations.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">👥</div>
              <h3>Volunteer Management</h3>
              <p>
                Efficient coordination of volunteer participation, attendance, and
                impact tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Specific Sections */}
      <section className="roles-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built for Everyone</h2>
            <p className="section-description">
              Our platform serves different stakeholders with tailored features
              and experiences.
            </p>
          </div>

          <div className="roles-grid">
            {Object.entries(roleFeatures).map(([role, data]) => (
              <div key={role} className="role-card" style={{ '--role-color': data.color }}>
                <div className="role-icon">{data.icon}</div>
                <h3>{data.title}</h3>
                <p className="role-description">{data.description}</p>
                <ul className="role-features">
                  {data.features.map((feature, index) => (
                    <li key={index}>
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {!isAuthenticated && (
                  <Link to="/register" className="role-cta">
                    Get Started as {role === 'admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Events Organized</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Volunteers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Partner Schools</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Lives Impacted</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Make a Difference?</h2>
              <p>Join Manobal Nepal today and be part of the change</p>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Register Now
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Manobal Nepal</h3>
              <p>Empowering communities through education and support.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link to="/dashboard">Dashboard</Link>
                  </li>
                )}
              </ul>
            </div>
            <div className="footer-section">
              <h4>Get Involved</h4>
              <ul>
                <li>
                  <Link to="/register">Become a Volunteer</Link>
                </li>
                <li>
                  <Link to="/register">Make a Donation</Link>
                </li>
                <li>
                  <Link to="/register">Partner with Us</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Manobal Nepal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
