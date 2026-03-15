import { Link } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react'
import {
  MdMenu, MdClose, MdChat, MdLocationOn,
  MdShield, MdSos, MdArrowForward, MdCheck, MdStar,
  MdKeyboardArrowRight, MdPlayArrow
} from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import ConnectSphereLogo from '../components/ConnectSphereLogo'
import './LandingPage.css'

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────── */
function Navbar() {
  const { user } = useContext(AuthContext)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#howitworks' },
    { label: 'Safety', href: '#safety' },
  ]

  return (
    <header className={`lp-navbar ${scrolled ? 'scrolled' : ''}`} role="banner">
      <div className="lp-navbar-inner">
        {/* Logo */}
        <Link to="/" className="lp-logo" aria-label="ConnectSphere home">
          <div className="lp-logo-icon">
            <ConnectSphereLogo size={24} />
          </div>
          <span className="lp-logo-text">ConnectSphere</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="lp-nav-links" aria-label="Primary navigation">
          {navLinks.map(l => (
            <a key={l.label} href={l.href} className="lp-nav-link">{l.label}</a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="lp-nav-cta">
          {user ? (
            <Link to="/dashboard" className="btn-primary lp-btn-sm">
              Open App <MdArrowForward size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login"    className="btn-ghost  lp-btn-sm">Login</Link>
              <Link to="/register" className="btn-primary lp-btn-sm">
                Get Started <MdArrowForward size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lp-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lp-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <nav>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="lp-mobile-link" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="lp-mobile-cta">
            {user ? (
              <Link to="/dashboard" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                Open App
              </Link>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>Login</Link>
                <Link to="/register" className="btn-primary"   style={{ justifyContent: 'center', width: '100%' }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

/* ─────────────────────────────────────────
   Hero Illustration (pure CSS)
───────────────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="hero-illustration" aria-hidden="true">
      {/* Glow rings */}
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      {/* Phone mockup */}
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          {/* Chat UI inside phone */}
          <div className="phone-header">
            <div className="phone-avatar" />
            <div className="phone-header-text">
              <div className="phone-line phone-line-name" />
              <div className="phone-line phone-line-status" />
            </div>
            <div className="phone-status-dot" />
          </div>
          <div className="phone-messages">
            <div className="phone-msg phone-msg-received">
              <div className="phone-bubble phone-bubble-r">Hey! Sharing my location 📍</div>
            </div>
            <div className="phone-msg phone-msg-sent">
              <div className="phone-bubble phone-bubble-s">Got it! I can see you 🗺️</div>
            </div>
            <div className="phone-msg phone-msg-received">
              <div className="phone-location-card">
                <div className="phone-map-mini">
                  <div className="map-grid" />
                  <div className="map-pin">📍</div>
                </div>
                <p className="phone-loc-label">Live Location · 30 min</p>
              </div>
            </div>
            <div className="phone-msg phone-msg-sent">
              <div className="phone-bubble phone-bubble-s">On my way! ✈️</div>
            </div>
          </div>
          <div className="phone-input-bar">
            <div className="phone-input-field" />
            <div className="phone-send-btn" />
          </div>
        </div>
      </div>

      {/* Floating map card */}
      <div className="map-card float-in-right card">
        <div className="map-card-header">
          <MdLocationOn size={14} color="var(--accent)" />
          <span>3 contacts nearby</span>
        </div>
        <div className="map-preview-mini">
          <div className="map-grid-large" />
          <div className="map-marker map-marker-1">
            <div className="marker-dot" />
            <div className="marker-ring" />
          </div>
          <div className="map-marker map-marker-2">
            <div className="marker-dot marker-dot-secondary" />
          </div>
          <div className="map-marker map-marker-3">
            <div className="marker-dot marker-dot-accent" />
          </div>
        </div>
      </div>

      {/* Floating SOS badge */}
      <div className="sos-badge float-in-bottom">
        <div className="sos-badge-dot" />
        Safety Mode Active
      </div>

      {/* Floating notification */}
      <div className="notif-badge float-in-top">
        <span>💬</span>
        <div>
          <p className="notif-name">Sarah Chen</p>
          <p className="notif-text">Shared live location</p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Hero Section
───────────────────────────────────────── */
function HeroSection() {
  const { user } = useContext(AuthContext)

  const highlights = ['No signup required for demo', 'Works on all devices', 'End-to-end encrypted']

  return (
    <section className="lp-hero" id="hero" aria-labelledby="hero-headline">
      {/* Background decoration */}
      <div className="hero-bg-decoration" aria-hidden>
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-grid" />
      </div>

      <div className="lp-container hero-inner">
        {/* Left – copy */}
        <div className="hero-copy animate-fadeInUp">
          <div className="hero-badge">
            <MdStar size={14} />
            <span>Trusted by 50,000+ users</span>
          </div>

          <h1 id="hero-headline" className="hero-headline">
            Stay Connected.<br />
            <span className="gradient-text">Stay Safe.</span>
          </h1>

          <p className="hero-subheadline">
            ConnectSphere combines real‑time chat, live location sharing,
            and emergency SOS into one seamless app — so you're always
            reachable and always protected.
          </p>

          {/* Highlights */}
          <ul className="hero-highlights" aria-label="Key benefits">
            {highlights.map(h => (
              <li key={h} className="hero-highlight-item">
                <MdCheck size={16} className="hero-check" />
                {h}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="hero-cta-row">
            {user ? (
              <Link to="/dashboard" className="btn-primary hero-cta-primary">
                Go to Dashboard <MdArrowForward size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary hero-cta-primary" id="hero-get-started">
                  Get Started — Free <MdArrowForward size={18} />
                </Link>
                <Link to="/login" className="hero-login-link">
                  <MdPlayArrow size={16} />
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Social proof pill */}
          <div className="hero-social-proof" aria-label="Social proof">
            <div className="avatar-stack">
              {['#3A6FF7','#7A5AF8','#22D3EE','#10B981'].map((c, i) => (
                <div key={i} className="mini-avatar" style={{ background: c, zIndex: 4 - i }} />
              ))}
            </div>
            <p>Join <strong>50k+</strong> people already connected</p>
          </div>
        </div>

        {/* Right – illustration */}
        <div className="hero-visual">
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Features Section
───────────────────────────────────────── */
const FEATURES = [
  {
    icon: MdChat,
    title: 'Real-time Messaging',
    desc: 'Instant delivery with read receipts, typing indicators, and media sharing. Works even on slow connections.',
    color: 'var(--primary)',
    bg: 'rgba(58,111,247,0.1)',
    tag: 'Chat',
    bullets: ['Group & direct chats', 'Offline message queue', 'Media & location sharing'],
  },
  {
    icon: MdLocationOn,
    title: 'Live Location Sharing',
    desc: 'Share your live GPS location with friends and family for a set duration. See everyone on a single map.',
    color: 'var(--accent)',
    bg: 'rgba(34,211,238,0.1)',
    tag: 'Maps',
    bullets: ['Set expiration timers', 'Real-time map view', 'Geofence notifications'],
  },
  {
    icon: MdSos,
    title: 'Emergency SOS',
    desc: 'Hold the SOS button for 2 seconds to instantly alert your emergency contacts with your exact location.',
    color: 'var(--danger)',
    bg: 'rgba(244,63,94,0.1)',
    tag: 'Safety',
    bullets: ['One-tap emergency send', 'GPS location pinned', 'Custom contact list'],
  },
  {
    icon: MdShield,
    title: 'Privacy Control',
    desc: 'You decide who sees what. Granular controls for every share — pause, stop, or revoke access any time.',
    color: 'var(--secondary)',
    bg: 'rgba(122,90,248,0.1)',
    tag: 'Privacy',
    bullets: ['End-to-end encrypted', 'Per-contact permissions', 'Auto-expiring shares'],
  },
]

function FeatureCard({ feature, index }) {
  const { icon: Icon, title, desc, color, bg, tag, bullets } = feature
  const learnMoreTo = {
    'Real-time Messaging': '/login',
    'Live Location Sharing': '/map',
    'Emergency SOS': '/sos',
    'Privacy Control': '/privacy',
  }[title] || '/login'
  return (
    <article
      className="feature-card card animate-fadeInUp"
      style={{ animationDelay: `${index * 0.1}s` }}
      aria-label={title}
    >
      <div className="feature-tag" style={{ color, background: bg }}>
        <Icon size={14} /> {tag}
      </div>
      <div className="feature-icon-wrap" style={{ background: bg }}>
        <Icon size={26} style={{ color }} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
      <ul className="feature-bullets" aria-label={`${title} features`}>
        {bullets.map(b => (
          <li key={b} className="feature-bullet">
            <MdCheck size={14} style={{ color }} />
            {b}
          </li>
        ))}
      </ul>
      <Link to={learnMoreTo} className="feature-learn-more" style={{ color }} aria-label={`Learn more about ${title}`}>
        Learn more <MdKeyboardArrowRight size={18} />
      </Link>
    </article>
  )
}

function FeaturesSection() {
  return (
    <section className="lp-features" id="features" aria-labelledby="features-heading">
      <div className="lp-container">
        <div className="section-intro">
          <div className="section-eyebrow">Everything you need</div>
          <h2 id="features-heading" className="section-title">
            One app, every connection
          </h2>
          <p className="section-subtitle">
            Powerful features thoughtfully designed to keep you and your people
            connected, safe, and in control.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   How It Works Section
───────────────────────────────────────── */
const STEPS = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds with email. No credit card required.' },
  { num: '02', title: 'Add your contacts',  desc: 'Import from your phonebook or invite via a link.' },
  { num: '03', title: 'Start chatting',      desc: 'Send messages, share location, and stay in sync.' },
  { num: '04', title: 'Enable SOS safety',   desc: 'Set emergency contacts and activate safety mode.' },
]

function HowItWorksSection() {
  return (
    <section className="lp-howitworks" id="howitworks" aria-labelledby="how-heading">
      <div className="lp-container">
        <div className="section-intro">
          <div className="section-eyebrow">Simple setup</div>
          <h2 id="how-heading" className="section-title">Up and running in minutes</h2>
        </div>
        <ol className="steps-list" aria-label="Setup steps">
          {STEPS.map((s, i) => (
            <li key={s.num} className="step-item animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="step-number" aria-hidden>{s.num}</div>
              <div className="step-connector" aria-hidden />
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   Footer
───────────────────────────────────────── */
function Footer() {
  const year = 2026

  const links = {
    Product: [
      { label: 'Features', to: '/#features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Changelog', to: '/status' },
      { label: 'Roadmap', to: '/about' },
    ],
    Company: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/about' },
      { label: 'Careers', to: '/about' },
      { label: 'Press', to: '/about' },
    ],
    Legal: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Cookies', to: '/privacy' },
      { label: 'Security', to: '/privacy' },
    ],
    Support: [
      { label: 'Help Center', to: '/help' },
      { label: 'Contact', to: 'mailto:support@connectsphere.app' },
      { label: 'Status', to: '/status' },
      { label: 'Community', to: '/about' },
    ],
  }

  const socialLinks = [
    { icon: '𝕏', href: 'https://x.com' },
    { icon: 'in', href: 'https://linkedin.com' },
    { icon: 'f', href: 'https://facebook.com' },
    { icon: '▶', href: 'https://youtube.com' },
  ]

  return (
    <footer className="lp-footer" role="contentinfo">
      <div className="lp-container">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <div className="lp-logo">
              <div className="lp-logo-icon">
                <ConnectSphereLogo size={22} />
              </div>
              <span className="lp-logo-text">ConnectSphere</span>
            </div>
            <p className="footer-tagline">
              Connecting people with privacy<br />and safety built in.
            </p>
            <div className="footer-social" aria-label="Social media links">
              {socialLinks.map(({ icon, href }, i) => (
                <a key={icon} href={href} target="_blank" rel="noreferrer" className="social-icon" aria-label={`Social link ${i + 1}`}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="footer-col">
              <h4 className="footer-col-title">{group}</h4>
              <ul role="list">
                {items.map(item => (
                  <li key={item.label}>
                    {item.to.startsWith('mailto:')
                      ? <a href={item.to} className="footer-link">{item.label}</a>
                      : <Link to={item.to} className="footer-link">{item.label}</Link>
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© {year} ConnectSphere. All rights reserved.</p>
          <p className="footer-made-with">Built with ❤️ on the MERN Stack</p>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────
   Landing Page (root export)
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />

        {/* CTA Banner */}
        <section className="lp-cta-banner" aria-labelledby="cta-heading">
          <div className="lp-container cta-inner">
            <div className="cta-text">
              <h2 id="cta-heading">Ready to stay connected?</h2>
              <p>Join 50,000+ users who trust ConnectSphere every day.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary cta-primary-btn">
                Get Started Free <MdArrowForward size={18} />
              </Link>
              <Link to="/login" className="cta-login-link">Already have an account →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
