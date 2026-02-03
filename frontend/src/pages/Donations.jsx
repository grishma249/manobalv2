import React from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import './Donations.css'

const Donations = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="donations-page">
      <AppShell>
        <div className="page-header">
          <div className="container">
            <h1>{isAdmin ? 'Donations Overview' : 'Donate'}</h1>
            <p>
              {isAdmin
                ? 'Oversee all donations and track their impact across programs.'
                : 'Log your monetary and physical donations and track their impact.'}
            </p>
          </div>
        </div>
        <div className="page-content">
          <div className="container donations-layout">
            {!isAdmin && (
              <div className="donation-forms">
                <div className="donation-card">
                  <h2>Monetary Donation</h2>
                  <p className="donation-help">
                    This is a mock form for the MVP. Payments are handled externally.
                  </p>
                  <div className="form-group">
                    <label htmlFor="amount">Amount (NPR)</label>
                    <input type="number" id="amount" placeholder="Enter amount" min="0" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="purpose">Purpose (optional)</label>
                    <input
                      type="text"
                      id="purpose"
                      placeholder="e.g., School workshops, Mental health programs"
                    />
                  </div>
                  <button className="btn btn-primary btn-full" disabled>
                    Submit Donation (Mock)
                  </button>
                </div>

                <div className="donation-card">
                  <h2>Physical Goods Donation</h2>
                  <div className="form-group">
                    <label htmlFor="category">Item Category</label>
                    <select id="category">
                      <option>Books & Stationery</option>
                      <option>Sports Equipment</option>
                      <option>Clothing</option>
                      <option>Other Supplies</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input type="number" id="quantity" placeholder="Enter quantity" min="1" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dropoff">Drop-off Details</label>
                    <input
                      type="text"
                      id="dropoff"
                      placeholder="Preferred date/time or courier details"
                    />
                  </div>
                  <button className="btn btn-primary btn-full" disabled>
                    Log Physical Donation (Mock)
                  </button>
                </div>
              </div>
            )}

            <div className="donation-history">
              <div className="donation-card">
                <h2>{isAdmin ? 'All Donations (Preview)' : 'Donation History (Preview)'}</h2>
                <p className="donation-help">
                  This is a placeholder table. In the full version, data will come from the
                  backend.
                </p>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount / Items</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>
                          No donations logged yet.
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

export default Donations

