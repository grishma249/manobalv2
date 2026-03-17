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
          <section className="about-split">
            <div className="about-section">
              <h2>Our Story</h2>
              <p>
                Manobal Nepal was founded with a vision to create lasting positive change in
                communities across Nepal. We believe in the power of education, collaboration,
                and transparent operations to drive meaningful impact.
              </p>
              <p>
                Our platform connects donors, volunteers, partner schools, and administrators in a
                single ecosystem. By digitizing core processes, we improve efficiency, accountability,
                and outreach—so more support reaches the communities that need it.
              </p>
            </div>
            <div className="about-media" aria-hidden="true">
              <img src="/img8.jpeg" alt="" />
            </div>
          </section>

          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <h3>Transparency</h3>
                <p>We believe in open and honest operations at every level.</p>
              </div>
              <div className="value-card">
                <h3>Collaboration</h3>
                <p>Working together to achieve greater impact.</p>
              </div>
              <div className="value-card">
                <h3>Innovation</h3>
                <p>Using technology to solve real-world problems.</p>
              </div>
              <div className="value-card">
                <h3>Compassion</h3>
                <p>Putting people and communities at the heart of everything we do.</p>
              </div>
            </div>
          </section>

          <section className="about-gallery">
            <div className="gallery-card">
              <img src="/img9.jpeg" alt="Community learning and outreach" loading="lazy" />
            </div>
            <div className="gallery-card">
              <img src="/img10.jpeg" alt="Programs and community support" loading="lazy" />
            </div>
            <div className="gallery-card">
              <img src="/img3.jpeg" alt="Education and engagement" loading="lazy" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About

