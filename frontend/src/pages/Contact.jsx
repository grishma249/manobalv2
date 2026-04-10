import React, { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Contact.css'

const Contact = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inboxError, setInboxError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const fetchAdminMessages = async (status = statusFilter) => {
    try {
      setLoadingMessages(true)
      const params = new URLSearchParams()
      if (status && status !== 'all') params.append('status', status)
      params.append('limit', '100')
      const response = await axios.get(`/api/contact/admin/messages?${params.toString()}`)
      setMessages(response.data.messages || [])
      setInboxError('')
    } catch (err) {
      setInboxError(err.response?.data?.message || 'Failed to load contact messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminMessages()
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      setSubmitError('')
      await axios.post('/api/contact', formData)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) {
      const validationErrors = err.response?.data?.errors
      if (validationErrors?.length) {
        setSubmitError(validationErrors[0].msg)
      } else {
        setSubmitError(err.response?.data?.message || 'Failed to send message')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateMessageStatus = async (messageId, status) => {
    try {
      await axios.patch(`/api/contact/admin/messages/${messageId}/status`, { status })
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status } : m))
      )
      if (selectedMessage?._id === messageId) {
        setSelectedMessage((prev) => ({ ...prev, status }))
      }
    } catch (err) {
      setInboxError(err.response?.data?.message || 'Failed to update message status')
    }
  }

  const openMessage = (message) => {
    setSelectedMessage(message)
    if (message.status === 'unread') {
      void updateMessageStatus(message._id, 'read')
    }
  }

  if (user?.role === 'admin') {
    return (
      <div className="contact-page">
        <AppShell>
          <div className="contact-hero admin-inbox-hero">
            <div className="container">
              <h1>Help & Contact Inbox</h1>
              <p className="hero-subtitle">Review and manage public inquiries</p>
            </div>
          </div>
          <div className="contact-content">
            <div className="container">
              <div className="inbox-controls">
                <label htmlFor="statusFilter">Filter by status</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => {
                    const next = e.target.value
                    setStatusFilter(next)
                    fetchAdminMessages(next)
                  }}
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              {inboxError && <div className="alert alert-error">{inboxError}</div>}
              {loadingMessages ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading inbox...</p>
                </div>
              ) : (
                <div className="admin-inbox-layout">
                  <div className="messages-panel">
                    {messages.length === 0 ? (
                      <div className="empty-state">No contact messages yet.</div>
                    ) : (
                      messages.map((message) => (
                        <button
                          key={message._id}
                          className={`message-row ${selectedMessage?._id === message._id ? 'active' : ''}`}
                          onClick={() => openMessage(message)}
                        >
                          <div className="message-row-head">
                            <strong>{message.subject}</strong>
                            <span className={`status-badge status-${message.status}`}>{message.status}</span>
                          </div>
                          <p>{message.name} • {message.email}</p>
                          <small>{new Date(message.createdAt).toLocaleString()}</small>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="message-detail">
                    {selectedMessage ? (
                      <>
                        <h3>{selectedMessage.subject}</h3>
                        <p className="message-meta">
                          From {selectedMessage.name} ({selectedMessage.email})
                        </p>
                        <p className="message-date">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                        <div className="message-body">{selectedMessage.message}</div>
                        <div className="message-actions">
                          <button
                            className="btn btn-outline"
                            onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                          >
                            Mark Read
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => updateMessageStatus(selectedMessage._id, 'resolved')}
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="empty-state">Select a message to read details.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </AppShell>
      </div>
    )
  }

  const content = (
    <>
      <div className="contact-hero">
        <div className="container">
          <h1>Get in Touch</h1>
          <p className="hero-subtitle">We'd love to hear from you</p>
        </div>
      </div>

      <div className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Contact Information</h2>
              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16v12H4z" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </div>
                <div>
                  <h3>Email</h3>
                  <p>contact@manobalnepal.org</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 2h10v20H7z" />
                    <path d="M11 19h2" />
                  </svg>
                </div>
                <div>
                  <h3>Phone</h3>
                  <p>+977-1-XXXXXXX</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div>
                  <h3>Address</h3>
                  <p>Kathmandu, Nepal</p>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <h2>Send us a Message</h2>
              {submitted ? (
                <div className="alert alert-success">
                  Thank you for your message! We'll get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  {submitError && <div className="alert alert-error">{submitError}</div>}
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Public users keep the simple nav-only layout
  if (!user) {
    return (
      <div className="contact-page">
        <Navigation />
        {content}
      </div>
    )
  }

  // Logged-in users see the AppShell with sidebar + contact content
  return (
    <div className="contact-page">
      <AppShell>{content}</AppShell>
    </div>
  )
}

export default Contact

