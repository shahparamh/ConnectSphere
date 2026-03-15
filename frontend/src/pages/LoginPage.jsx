import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdWifiTethering } from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const { login, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPass, setShowPass]   = useState(false)
  const [formErrors, setErrors]   = useState({})

  const validate = () => {
    const errs = {}
    if (!form.email)    errs.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const result = await login(form.email, form.password)
    if (result.success) navigate('/')
  }

  // Allow demo login
  const demoLogin = () => {
    setForm({ email: 'demo@connectsphere.app', password: 'demo1234' })
  }

  return (
    <div className="auth-root">
      <div className="auth-bg-blobs" aria-hidden>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="auth-container animate-fadeInUp">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon"><MdWifiTethering size={28} /></div>
          <span className="auth-logo-text">ConnectSphere</span>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">Welcome back 👋</h1>
          <p className="auth-subtitle">Sign in to continue</p>

          {/* Server error */}
          {error && (
            <div className="auth-error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Email */}
            <div className="input-group">
              <label htmlFor="login-email" className="input-label">Email</label>
              <div className={`input-wrapper ${formErrors.email ? 'error' : ''}`}>
                <MdEmail className="input-icon" size={18} />
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                />
              </div>
              {formErrors.email && <p id="email-error" className="field-error" role="alert">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="login-password" className="input-label">Password</label>
              <div className={`input-wrapper ${formErrors.password ? 'error' : ''}`}>
                <MdLock className="input-icon" size={18} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!formErrors.password}
                  aria-describedby={formErrors.password ? 'pass-error' : undefined}
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {formErrors.password && <p id="pass-error" className="field-error" role="alert">{formErrors.password}</p>}
            </div>

            <div className="auth-row">
              <label className="remember-label">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/help" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-primary auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <button type="button" className="btn-secondary demo-btn" onClick={demoLogin}>
              Try Demo Account
            </button>
          </form>

          <p className="auth-switch">
            No account? <Link to="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
