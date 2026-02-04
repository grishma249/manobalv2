import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Donations.css'

const Donations = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(isAdmin)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    if (isAdmin) {
      fetchDonations()
    }
  }, [isAdmin, filters])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      params.append('page', filters.page)
      params.append('limit', '20')

      const response = await axios.get(`/api/admin/donations?${params.toString()}`)
      setDonations(response.data.donations)
      setPagination(response.data.pagination)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (donationId, status) => {
    try {
      await axios.patch(`/api/admin/donations/${donationId}/verify`, { status })
      fetchDonations()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify donation')
    }
  }

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

            {isAdmin && (
              <div className="filters-section">
                <div className="filter-group">
                  <label>Filter by Type:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                  >
                    <option value="">All Types</option>
                    <option value="monetary">Monetary</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Filter by Status:</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="received">Received</option>
                  </select>
                </div>
              </div>
            )}

            <div className="donation-history">
              <div className="donation-card">
                <h2>{isAdmin ? 'All Donations' : 'Donation History (Preview)'}</h2>
                {isAdmin && error && <div className="alert alert-error">{error}</div>}
                {isAdmin && loading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading donations...</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Donor</th>
                          <th>Type</th>
                          <th>Amount / Items</th>
                          <th>Status</th>
                          {isAdmin && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {isAdmin && donations.length > 0 ? (
                          donations.map((donation) => (
                            <tr key={donation._id}>
                              <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                              <td>{donation.donor?.name || 'Unknown'}</td>
                              <td>
                                <span className={`type-badge type-${donation.type}`}>
                                  {donation.type}
                                </span>
                              </td>
                              <td>
                                {donation.type === 'monetary'
                                  ? `NPR ${donation.amount?.toLocaleString()}`
                                  : `${donation.quantity} ${donation.category}`}
                              </td>
                              <td>
                                <span className={`status-badge status-${donation.status}`}>
                                  {donation.status}
                                </span>
                              </td>
                              {isAdmin && (
                                <td>
                                  {donation.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleVerify(donation._id, 'verified')}
                                        className="btn btn-success btn-sm"
                                      >
                                        Verify
                                      </button>
                                      <button
                                        onClick={() => handleVerify(donation._id, 'received')}
                                        className="btn btn-info btn-sm"
                                      >
                                        Mark Received
                                      </button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={isAdmin ? 6 : 4} style={{ textAlign: 'center', color: '#888' }}>
                              {isAdmin ? 'No donations found' : 'No donations logged yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {isAdmin && pagination.pages > 1 && (
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
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

export default Donations

