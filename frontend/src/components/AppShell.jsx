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
      icon: '🏠',
    },
    {
      path: '/admin/users',
      label: 'User Management',
      roles: ['admin'],
      icon: '👥',
    },
    {
      path: role === 'admin' ? '/admin/events' : '/events',
      label: role === 'volunteer' ? 'Event Opportunities' : 'Events',
      roles: ['admin', 'volunteer', 'school'],
      icon: '📅',
    },
    {
      path: '/my-events',
      label: 'My Events',
      roles: ['volunteer'],
      icon: '🗂️',
    },
    {
      path: '/school/request-event',
      label: 'Request Event',
      roles: ['school'],
      icon: '📝',
    },
    {
      path: '/donations',
      label: 'Donations',
      roles: ['admin', 'donor'],
      icon: '💰',
    },
    {
      path: '/volunteers',
      label: 'Volunteers',
      roles: ['admin'],
      icon: '👥',
    },
    {
      path: '/profile',
      label: 'Profile',
      roles: ['admin', 'donor', 'volunteer', 'school'],
      icon: '🙍',
    },
    {
      path: '/contact',
      label: 'Help / Contact',
      roles: ['admin', 'donor', 'volunteer', 'school'],
      icon: '❓',
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
                  <span className="sidebar-icon">{link.icon}</span>
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


