import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import axios from 'axios'
import './Volunteers.css'

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ page: 1 })
  const [pagination, setPagination] = useState({})
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [participationData, setParticipationData] = useState(null)

  useEffect(() => {
    fetchVolunteers()
  }, [filters])

  const fetchVolunteers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', filters.page)
      params.append('limit', '20')

      const response = await axios.get(`/api/admin/volunteers?${params.toString()}`)
      setVolunteers(response.data.volunteers)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load volunteers')
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipation = async (volunteerId) => {
    try {
      const response = await axios.get(`/api/admin/volunteers/${volunteerId}/participation`)
      setParticipationData(response.data)
      setSelectedVolunteer(volunteerId)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load participation data')
    }
  }

  return (
    <div className="volunteers-page">
      <AppShell>
        <div className="page-header">
          <h1>Volunteer Oversight</h1>
          <p>Monitor volunteer participation and track engagement</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading volunteers...</p>
          </div>
        ) : (
          <>
            <div className="volunteers-grid">
              {volunteers.length > 0 ? (
                volunteers.map((volunteer) => (
                  <div key={volunteer._id} className="volunteer-card">
                    <div className="volunteer-header">
                      <div className="volunteer-avatar">
                        {volunteer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="volunteer-info">
                        <h3>{volunteer.name}</h3>
                        <p>{volunteer.email}</p>
                        <span
                          className={`status-badge ${volunteer.isActive ? 'status-active' : 'status-inactive'}`}
                        >
                          {volunteer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="volunteer-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Events</span>
                        <span className="stat-value">{volunteer.participation?.total || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Attended</span>
                        <span className="stat-value">{volunteer.participation?.attended || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Confirmed</span>
                        <span className="stat-value">{volunteer.participation?.confirmed || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchParticipation(volunteer._id)}
                      className="btn btn-primary btn-full"
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No volunteers found</p>
                </div>
              )}
            </div>

            {/* Participation Details Modal */}
            {selectedVolunteer && participationData && (
              <div className="modal-overlay" onClick={() => setSelectedVolunteer(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>
                    Participation Details - {participationData.volunteer.name}
                  </h2>
                  <div className="participation-summary">
                    <div className="summary-item">
                      <strong>Total:</strong> {participationData.summary.total}
                    </div>
                    <div className="summary-item">
                      <strong>Attended:</strong> {participationData.summary.attended}
                    </div>
                    <div className="summary-item">
                      <strong>Confirmed:</strong> {participationData.summary.confirmed}
                    </div>
                    <div className="summary-item">
                      <strong>Registered:</strong> {participationData.summary.registered}
                    </div>
                  </div>
                  <div className="participation-list">
                    <h3>Event Participation</h3>
                    {participationData.participations.length > 0 ? (
                      <table className="participation-table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participationData.participations.map((participation) => (
                            <tr key={participation._id}>
                              <td>{participation.event?.title || 'N/A'}</td>
                              <td>
                                {participation.event?.date
                                  ? new Date(participation.event.date).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                              <td>
                                <span className={`status-badge status-${participation.status}`}>
                                  {participation.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="empty-state">No participation records</p>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={() => {
                        setSelectedVolunteer(null)
                        setParticipationData(null)
                      }}
                      className="btn btn-outline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="btn btn-outline"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page === pagination.pages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </AppShell>
    </div>
  )
}

export default Volunteers

