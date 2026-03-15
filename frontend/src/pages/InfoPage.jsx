import { Link, useLocation } from 'react-router-dom'

const PAGE_CONTENT = {
  '/privacy': {
    title: 'Privacy Policy',
    body: 'ConnectSphere stores only the data needed to power messaging, location sharing, and safety features. Demo mode keeps everything local to your browser session.',
  },
  '/terms': {
    title: 'Terms of Service',
    body: 'Use ConnectSphere responsibly. Emergency tools are meant for real safety scenarios, and you are responsible for the contacts and data you share through the app.',
  },
  '/help': {
    title: 'Help & Support',
    body: 'Need help? Start the backend on port 5000 for full auth, or use Demo Mode to explore the UI. For support, contact support@connectsphere.app.',
  },
  '/pricing': {
    title: 'Pricing',
    body: 'ConnectSphere is currently presented as a demo app, so all core features shown here are free to explore.',
  },
  '/about': {
    title: 'About ConnectSphere',
    body: 'ConnectSphere combines chat, live location sharing, and SOS features into one safety-focused communication experience.',
  },
  '/status': {
    title: 'System Status',
    body: 'Frontend demo mode is available locally. Real-time backend features require the backend server and MongoDB connection.',
  },
  '/alerts': {
    title: 'Alerts & Notifications',
    body: 'Here you can review emergency alerts, message notifications, and recent safety activity. In the local demo, this screen stands in for the full notifications center.',
  },
  '/settings': {
    title: 'Settings',
    body: 'Manage app preferences, privacy controls, appearance, and notification behavior here. In the local demo, advanced settings are represented by this overview screen and the profile settings page.',
  },
}

export default function InfoPage() {
  const { pathname } = useLocation()
  const page = PAGE_CONTENT[pathname] || {
    title: 'Information',
    body: 'This section is available in the full ConnectSphere experience. The local demo focuses on the primary product flows.',
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px' }}>
      <section className="card" style={{ maxWidth: 720, width: '100%', padding: '32px' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 8 }}>ConnectSphere</p>
        <h1 style={{ marginBottom: 12 }}>{page.title}</h1>
        <p style={{ marginBottom: 24 }}>{page.body}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/" className="btn-secondary">Back Home</Link>
          <Link to="/login" className="btn-primary">Open App</Link>
        </div>
      </section>
    </main>
  )
}
