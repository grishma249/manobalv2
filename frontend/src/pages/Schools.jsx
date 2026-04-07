import React, { useEffect, useState } from 'react'
import axios from 'axios'
import AppShell from '../components/AppShell'
import './Schools.css'

const Schools = () => {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ page: 1 })
  const [pagination, setPagination] = useState({})
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [schoolEventsData, setSchoolEventsData] = useState(null)

  useEffect(() => {
    fetchSchools()
  }, [filters])

  const fetchSchools = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', filters.page)
      params.append('limit', '20')

      const response = await axios.get(`/api/admin/schools?${params.toString()}`)
      setSchools(response.data.schools)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchoolEvents = async (schoolId) => {
    try {
      const response = await axios.get(`/api/admin/schools/${schoolId}/events`)
      setSchoolEventsData(response.data)
      setSelectedSchool(schoolId)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load school events')
    }
  }

  return (
    <div className="schools-page">
      <AppShell>
        <div className="page-header">
          <h1>School Oversight</h1>
          <p>Monitor school requests and track event activity</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading schools...</p>
          </div>
        ) : (
          <>
            <div className="schools-grid">
              {schools.length > 0 ? (
                schools.map((school) => (
                  <div key={school._id} className="school-card">
                    <div className="school-header">
                      <div className="school-avatar">{school.name?.charAt(0).toUpperCase()}</div>
                      <div className="school-info">
                        <h3>{school.schoolName || school.name}</h3>
                        <p>{school.email}</p>
                        <span className={`status-badge ${school.isActive ? 'status-active' : 'status-inactive'}`}>
                          {school.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="school-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Requests</span>
                        <span className="stat-value">{school.requests?.total || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Approved</span>
                        <span className="stat-value">{school.requests?.approved || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Pending</span>
                        <span className="stat-value">{school.requests?.pending || 0}</span>
                      </div>
                    </div>
                    <button onClick={() => fetchSchoolEvents(school._id)} className="btn btn-primary btn-full">
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No schools found</p>
                </div>
              )}
            </div>

            {selectedSchool && schoolEventsData && (
              <div className="modal-overlay" onClick={() => setSelectedSchool(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>School Requests - {schoolEventsData.school.schoolName || schoolEventsData.school.name}</h2>
                  <div className="participation-summary">
                    <div className="summary-item">
                      <strong>Total</strong> {schoolEventsData.summary.total}
                    </div>
                    <div className="summary-item">
                      <strong>Approved</strong> {schoolEventsData.summary.approved}
                    </div>
                    <div className="summary-item">
                      <strong>Pending</strong> {schoolEventsData.summary.pending}
                    </div>
                    <div className="summary-item">
                      <strong>Rejected</strong> {schoolEventsData.summary.rejected}
                    </div>
                  </div>
                  <div className="participation-list">
                    <h3>Requested Events</h3>
                    {schoolEventsData.events.length > 0 ? (
                      <table className="participation-table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolEventsData.events.map((event) => (
                            <tr key={event._id}>
                              <td>{event.title}</td>
                              <td>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</td>
                              <td>{event.eventType || 'N/A'}</td>
                              <td>
                                <span className={`status-badge status-${event.status}`}>{event.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="empty-state">No request records</p>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={() => {
                        setSelectedSchool(null)
                        setSchoolEventsData(null)
                      }}
                      className="btn btn-outline"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

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

export default Schools

