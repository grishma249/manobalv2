import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navigation.css'

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: 'Administrator',
      donor: 'Donor',
      volunteer: 'Volunteer',
      school: 'School',
    }
    return roleMap[role] || role
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  // When authenticated, main page navigation is handled by the sidebar (AppShell).
  // Top bar shows only branding, user info and logout.

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">Manobal Nepal</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu">
          {isAuthenticated ? (
            <>
              <div className="nav-user">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{getRoleDisplayName(user?.role)}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/about" className={`nav-link ${isActive('/about')}`}>
                About
              </Link>
              <Link to="/events/public" className={`nav-link ${isActive('/events/public')}`}>
                Events
              </Link>
              <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>
                Contact
              </Link>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={mobileMenuOpen ? 'hamburger open' : 'hamburger'}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                <p className="mobile-user-name">{user?.name}</p>
                <p className="mobile-user-role">{getRoleDisplayName(user?.role)}</p>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-full">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/about"
                className={`mobile-nav-link ${isActive('/about')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/events/public"
                className={`mobile-nav-link ${isActive('/events/public')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                to="/contact"
                className={`mobile-nav-link ${isActive('/contact')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navigation

