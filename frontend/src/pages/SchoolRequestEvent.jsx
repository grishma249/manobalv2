import React from 'react'
import AppShell from '../components/AppShell'
import './SchoolRequestEvent.css'

const SchoolRequestEvent = () => {
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
                <p className="help-text">
                  This is a UI-only form for the MVP. Requests will be wired to the backend
                  later.
                </p>
                <div className="form-group">
                  <label htmlFor="workshopType">Workshop Type</label>
                  <select id="workshopType">
                    <option>Mental Health Awareness</option>
                    <option>Anti-Bullying Program</option>
                    <option>Life Skills Workshop</option>
                    <option>Teacher Sensitization</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="preferredDate">Preferred Date</label>
                  <input type="date" id="preferredDate" />
                </div>
                <div className="form-group">
                  <label htmlFor="students">Number of Students</label>
                  <input type="number" id="students" placeholder="e.g., 80" min="1" />
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    rows="4"
                    placeholder="Share any specific needs, timings, or constraints."
                  ></textarea>
                </div>
                <button className="btn btn-primary btn-full" disabled>
                  Submit Request (Mock)
                </button>
              </div>

              <div className="request-status-card">
                <h2>Event Status (Preview)</h2>
                <p className="help-text">
                  Once connected to the backend, this section will show your requested
                  events and their status.
                </p>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Requested Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>
                          No event requests yet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default SchoolRequestEvent


