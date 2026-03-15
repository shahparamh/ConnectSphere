import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { LocationProvider } from './context/LocationContext'
import './index.css'

/* ── Error Boundary to surface silent crashes ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('ConnectSphere crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', padding: '2rem',
          background: 'linear-gradient(135deg,#f0f4ff,#f5f0ff)'
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: '2.5rem',
            maxWidth: 540, width: '100%', boxShadow: '0 8px 32px rgba(58,111,247,0.18)',
            border: '1.5px solid rgba(244,63,94,0.2)'
          }}>
            <h1 style={{ color: '#F43F5E', fontSize: '1.4rem', marginBottom: 12 }}>
              ⚠️ ConnectSphere crashed
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
              Something went wrong during startup. Here's the error:
            </p>
            <pre style={{
              background: '#1a1f36', color: '#f8faff',
              borderRadius: 12, padding: '1rem',
              fontSize: '0.78rem', overflowX: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack?.split('\n').slice(0, 6).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20, padding: '10px 24px',
                background: 'linear-gradient(135deg,#3A6FF7,#7A5AF8)',
                color: 'white', border: 'none', borderRadius: 999,
                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ChatProvider>
        <LocationProvider>
          <App />
        </LocationProvider>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
)
