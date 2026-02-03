import React from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

const Profile = () => {
  const { user } = useAuth()

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: 'Administrator',
      donor: 'Donor',
      volunteer: 'Volunteer',
      school: 'School',
    }
    return roleMap[role] || role
  }

  return (
    <div className="profile-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>My Profile</h1>
            <p>View and manage your account information</p>
          </div>
        </div>

        <div className="page-content">
          <div className="container">
            <div className="profile-card">

              <div className="profile-avatar">
                <div className="avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>

              <div className="profile-info">
                <div className="info-section">
                  <h3>Personal Information</h3>

                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name</span>
                      <span className="info-value">{user?.name}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user?.email}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Role</span>
                      <span className="info-value role-badge">
                        {getRoleDisplayName(user?.role)}
                      </span>
                    </div>

                    {user?.schoolName && (
                      <div className="info-item">
                        <span className="info-label">School Name</span>
                        <span className="info-value">{user.schoolName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="btn btn-primary" disabled>
                    Edit Profile (Coming Soon)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default Profile
