import React from 'react'
import Navigation from '../components/Navigation'
import './PublicEvents.css'

const mockEvents = [
  {
    id: 1,
    name: 'Mental Health Awareness Workshop',
    date: '2026-03-15',
    location: 'Kathmandu, Nepal',
    organizer: 'Manobal Nepal',
    description: 'Awareness session on mental health and well-being for high school students.',
  },
  {
    id: 2,
    name: 'Anti-Bullying School Campaign',
    date: '2026-03-28',
    location: 'Lalitpur, Nepal',
    organizer: 'Manobal Nepal',
    description: 'Interactive sessions on bullying prevention and safe school environment.',
  },
  {
    id: 3,
    name: 'Community Support Outreach',
    date: '2026-04-05',
    location: 'Bhaktapur, Nepal',
    organizer: 'Manobal Nepal',
    description: 'Community outreach program focused on family support and counseling.',
  },
]

const PublicEvents = () => {
  return (
    <div className="public-events-page">
      <Navigation />
      <div className="public-events-hero">
        <div className="container">
          <h1>Upcoming Events</h1>
          <p>Explore upcoming programs and workshops organized by Manobal Nepal.</p>
        </div>
      </div>
      <div className="public-events-content">
        <div className="container">
          <div className="events-grid">
            {mockEvents.map((event) => (
              <div key={event.id} className="event-card">
                <h2>{event.name}</h2>
                <p className="event-meta">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                </p>
                <p className="event-organizer">Organized by {event.organizer}</p>
                <p className="event-description">{event.description}</p>
              </div>
            ))}
          </div>
          <p className="public-events-note">
            To participate or request an event for your school, please{' '}
            <strong>register as a Volunteer or School</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicEvents


