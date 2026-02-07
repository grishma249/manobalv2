import React, { useState, useEffect } from 'react'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Donations.css'

const Donations = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 })
  const [pagination, setPagination] = useState({})
  const [summary, setSummary] = useState(null)
  const [monetaryForm, setMonetaryForm] = useState({
    amount: '',
    purpose: '',
    transactionRef: '',
  })
  const [goodsForm, setGoodsForm] = useState({
    category: 'Books & Stationery',
    quantity: '',
    unit: 'pieces',
    dropoffDetails: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchAdminDonations()
    } else if (user?.role === 'donor') {
      fetchDonorDonations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user, filters])

  const fetchAdminDonations = async () => {
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

  const fetchDonorDonations = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/donations/me')
      setDonations(response.data.donations || [])
      setSummary(response.data.summary || null)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your donations')
    } finally {
      setLoading(false)
    }
  }

  const handleMonetarySubmit = async (e) => {
    e.preventDefault()
    if (!monetaryForm.amount || Number(monetaryForm.amount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      await axios.post('/api/donations', {
        type: 'monetary',
        amount: Number(monetaryForm.amount),
        purpose: monetaryForm.purpose,
        description: monetaryForm.purpose,
        transactionRef: monetaryForm.transactionRef,
      })
      setMonetaryForm({ amount: '', purpose: '', transactionRef: '' })
      await fetchDonorDonations()
      alert('Thank you! Your monetary donation has been recorded.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit donation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoodsSubmit = async (e) => {
    e.preventDefault()
    if (!goodsForm.quantity || Number(goodsForm.quantity) <= 0) {
      setError('Please enter a valid quantity greater than 0')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      await axios.post('/api/donations', {
        type: 'physical',
        category: goodsForm.category,
        quantity: Number(goodsForm.quantity),
        unit: goodsForm.unit,
        description: goodsForm.description,
        dropoffDetails: goodsForm.dropoffDetails,
      })
      setGoodsForm({
        category: 'Books & Stationery',
        quantity: '',
        unit: 'pieces',
        dropoffDetails: '',
        description: '',
      })
      await fetchDonorDonations()
      alert('Thank you! Your physical donation has been recorded.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit donation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (donationId, status) => {
    try {
      await axios.patch(`/api/admin/donations/${donationId}/status`, { status })
      fetchAdminDonations()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update donation status')
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
                    Payments are handled externally. Use this form to log your contribution.
                  </p>
                  <form onSubmit={handleMonetarySubmit}>
                    <div className="form-group">
                      <label htmlFor="amount">Amount (NPR)</label>
                      <input
                        type="number"
                        id="amount"
                        placeholder="Enter amount"
                        min="0"
                        value={monetaryForm.amount}
                        onChange={(e) =>
                          setMonetaryForm({ ...monetaryForm, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="purpose">Purpose (optional)</label>
                      <input
                        type="text"
                        id="purpose"
                        placeholder="e.g., School workshops, Mental health programs"
                        value={monetaryForm.purpose}
                        onChange={(e) =>
                          setMonetaryForm({ ...monetaryForm, purpose: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="transactionRef">Transaction Reference (optional)</label>
                      <input
                        type="text"
                        id="transactionRef"
                        placeholder="e.g., Bank/Wallet reference"
                        value={monetaryForm.transactionRef}
                        onChange={(e) =>
                          setMonetaryForm({
                            ...monetaryForm,
                            transactionRef: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button className="btn btn-primary btn-full" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Donation'}
                    </button>
                  </form>
                </div>

                <div className="donation-card">
                  <h2>Physical Goods Donation</h2>
                  <form onSubmit={handleGoodsSubmit}>
                    <div className="form-group">
                      <label htmlFor="category">Item Category</label>
                      <select
                        id="category"
                        value={goodsForm.category}
                        onChange={(e) =>
                          setGoodsForm({ ...goodsForm, category: e.target.value })
                        }
                      >
                        <option>Books & Stationery</option>
                        <option>Sports Equipment</option>
                        <option>Clothing</option>
                        <option>Other Supplies</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="quantity">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        placeholder="Enter quantity"
                        min="1"
                        value={goodsForm.quantity}
                        onChange={(e) =>
                          setGoodsForm({ ...goodsForm, quantity: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="unit">Unit</label>
                      <input
                        type="text"
                        id="unit"
                        placeholder="e.g., pieces, sets"
                        value={goodsForm.unit}
                        onChange={(e) =>
                          setGoodsForm({ ...goodsForm, unit: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dropoff">Drop-off Details</label>
                      <input
                        type="text"
                        id="dropoff"
                        placeholder="Preferred date/time or courier details"
                        value={goodsForm.dropoffDetails}
                        onChange={(e) =>
                          setGoodsForm({
                            ...goodsForm,
                            dropoffDetails: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="description">Description (optional)</label>
                      <input
                        type="text"
                        id="description"
                        placeholder="Short description of items"
                        value={goodsForm.description}
                        onChange={(e) =>
                          setGoodsForm({
                            ...goodsForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button className="btn btn-primary btn-full" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Log Physical Donation'}
                    </button>
                  </form>
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
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            <div className="donation-history">
              <div className="donation-card">
                <h2>{isAdmin ? 'All Donations' : 'Your Donation History'}</h2>
                {error && <div className="alert alert-error">{error}</div>}
                {loading ? (
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
                          {isAdmin && <th>Donor</th>}
                          <th>Type</th>
                          <th>Amount / Items</th>
                          <th>Status</th>
                          {isAdmin && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {donations.length > 0 ? (
                          donations.map((donation) => (
                            <tr key={donation._id}>
                              <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                              {isAdmin && <td>{donation.donor?.name || 'Unknown'}</td>}
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
                                  <div className="status-actions">
                                    <select
                                      value={donation.status}
                                      onChange={(e) => handleStatusChange(donation._id, e.target.value)}
                                      className="status-select"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="completed">Completed</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
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

