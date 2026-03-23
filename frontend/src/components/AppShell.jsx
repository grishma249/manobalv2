import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from './Navigation'
import './AppShell.css'

const AppShell = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => (location.pathname === path ? 'active' : '')

  const role = user?.role

  const sidebarLinks = [
    {
      path: role === 'admin' ? '/admin/dashboard' : '/dashboard',
      label: 'Dashboard',
      roles: ['admin', 'donor', 'volunteer', 'school'],
    },
    {
      path: '/admin/users',
      label: 'User Management',
      roles: ['admin'],
    },
    {
      path:
        role === 'admin'
          ? '/admin/events'
          : role === 'donor'
          ? '/events/public'
          : '/events',
      label: role === 'volunteer' ? 'Event Opportunities' : 'Events',
      roles: ['admin', 'volunteer', 'school', 'donor'],
    },
    {
      path: '/my-events',
      label: 'My Events',
      roles: ['volunteer'],
    },
    {
      path: '/school/request-event',
      label: 'Request Event',
      roles: ['school'],
    },
    {
      path: '/donations',
      label: 'Donations',
      roles: ['admin', 'donor'],
    },
    {
      path: '/volunteers',
      label: 'Volunteers',
      roles: ['admin'],
    },
    {
      path: '/profile',
      label: 'Profile',
      roles: ['admin', 'donor', 'volunteer', 'school'],
    },
    {
      path: '/contact',
      label: 'Help / Contact',
      roles: ['admin', 'donor', 'volunteer', 'school'],
    },
  ]

  const visibleLinks = sidebarLinks.filter(
    (link) => role && link.roles.includes(role)
  )

  return (
    <div className="app-shell">
      <Navigation />
      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-section">
            <p className="sidebar-section-title">Navigation</p>
            <nav className="sidebar-nav">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`sidebar-link ${isActive(link.path)}`}
                >
                  <span className="sidebar-icon" aria-hidden="true"></span>
                  <span className="sidebar-label">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}

export default AppShell


