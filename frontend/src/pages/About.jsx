import React from 'react'
import Navigation from '../components/Navigation'
import './About.css'

const About = () => {
  return (
    <div className="about-page">
      <Navigation />
      <div className="about-hero">
        <div className="container">
          <h1>About Manobal Nepal</h1>
          <p className="hero-subtitle">Empowering Communities Through Education and Support</p>
        </div>
      </div>

      <div className="about-content">
        <div className="container">
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              Manobal Nepal was founded with a vision to create lasting positive change in
              communities across Nepal. We believe in the power of education, collaboration,
              and transparent operations to drive meaningful impact.
            </p>
            <p>
              Our digital platform connects donors, volunteers, partner schools, and
              administrators, creating a seamless ecosystem for NGO operations. By digitizing
              core processes, we ensure efficiency, transparency, and greater outreach.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3>Transparency</h3>
                <p>We believe in open and honest operations at every level.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Collaboration</h3>
                <p>Working together to achieve greater impact.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>Innovation</h3>
                <p>Using technology to solve real-world problems.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">❤️</div>
                <h3>Compassion</h3>
                <p>Putting people and communities at the heart of everything we do.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About

