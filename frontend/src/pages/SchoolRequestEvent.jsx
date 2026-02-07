import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import axios from 'axios'
import './SchoolRequestEvent.css'

const SchoolRequestEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'workshop',
    date: '',
    location: '',
    numberOfStudents: '',
    targetAudience: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [events, setEvents] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSchoolEvents()
  }, [])

  const fetchSchoolEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/schools/events')
      setEvents(response.data.events)
      setSummary(response.data.summary)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      await axios.post('/api/schools/events/request', formData)
      setSuccess('Event request submitted successfully!')
      setFormData({
        title: '',
        description: '',
        eventType: 'workshop',
        date: '',
        location: '',
        numberOfStudents: '',
        targetAudience: '',
        notes: '',
      })
      fetchSchoolEvents() // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.map((e) => e.msg).join(', ')
        : err.response?.data?.message || 'Failed to submit request'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545',
      completed: '#17a2b8',
      cancelled: '#6c757d',
    }
    return colors[status] || '#6c757d'
  }

  const getEventTypeDisplay = (type) => {
    const types = {
      workshop: 'Workshop',
      awareness: 'Awareness Program',
      training: 'Training',
      other: 'Other',
    }
    return types[type] || type
  }

  return (
    <div className="school-request-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>Request an Event</h1>
            <p>Submit a workshop or awareness program request for your school.</p>
          </div>
        </div>
        <div className="page-content">
          <div className="container">
            <div className="request-layout">
              <div className="request-form-card">
                <h2>Event Request Form</h2>
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Event Title *</label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Mental Health Awareness Workshop"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the event, its objectives, and what you hope to achieve."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventType">Event Type *</label>
                    <select
                      id="eventType"
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      required
                    >
                      <option value="workshop">Workshop</option>
                      <option value="awareness">Awareness Program</option>
                      <option value="training">Training</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Preferred Date *</label>
                      <input
                        type="date"
                        id="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="location">Location *</label>
                      <input
                        type="text"
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="School address or venue"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="numberOfStudents">Number of Students</label>
                    <input
                      type="number"
                      id="numberOfStudents"
                      value={formData.numberOfStudents}
                      onChange={(e) =>
                        setFormData({ ...formData, numberOfStudents: e.target.value })
                      }
                      placeholder="e.g., 80"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="targetAudience">Target Audience</label>
                    <input
                      type="text"
                      id="targetAudience"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      placeholder="e.g., Grade 9-10 students"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notes">Additional Notes</label>
                    <textarea
                      id="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Share any specific needs, timings, or constraints."
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </div>

              <div className="request-status-card">
                <h2>Your Event Requests</h2>
                {loading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                  </div>
                ) : (
                  <>
                    {summary && (
                      <div className="summary-stats">
                        <div className="stat-item">
                          <strong>Total:</strong> {summary.total || 0}
                        </div>
                        <div className="stat-item">
                          <strong>Pending:</strong> {summary.pending || 0}
                        </div>
                        <div className="stat-item">
                          <strong>Approved:</strong> {summary.approved || 0}
                        </div>
                        <div className="stat-item">
                          <strong>Completed:</strong> {summary.completed || 0}
                        </div>
                      </div>
                    )}
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Volunteers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.length > 0 ? (
                            events.map((event) => (
                              <tr key={event._id}>
                                <td>
                                  <strong>{event.title}</strong>
                                  <br />
                                  <small>{getEventTypeDisplay(event.eventType)}</small>
                                </td>
                                <td>{new Date(event.date).toLocaleDateString()}</td>
                                <td>
                                  <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(event.status) }}
                                  >
                                    {event.status}
                                  </span>
                                </td>
                                <td>
                                  {event.assignedVolunteers?.length > 0
                                    ? event.assignedVolunteers.map((v) => v.name).join(', ')
                                    : 'Not assigned'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>
                                No event requests yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default SchoolRequestEvent
