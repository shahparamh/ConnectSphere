import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdWifiTethering } from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const { register, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [formErrors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim())   errs.name     = 'Name is required'
    if (!form.email)         errs.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.password)      errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Min 6 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const result = await register(form.name, form.email, form.password)
    if (result.success) navigate('/')
  }

  return (
    <div className="auth-root">
      <div className="auth-bg-blobs" aria-hidden>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="auth-container animate-fadeInUp">
        <div className="auth-logo">
          <div className="auth-logo-icon"><MdWifiTethering size={28} /></div>
          <span className="auth-logo-text">ConnectSphere</span>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">Create account 🚀</h1>
          <p className="auth-subtitle">Join thousands of connected people</p>

          {error && <div className="auth-error-banner" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Name */}
            <div className="input-group">
              <label htmlFor="reg-name" className="input-label">Full Name</label>
              <div className={`input-wrapper ${formErrors.name ? 'error' : ''}`}>
                <MdPerson className="input-icon" size={18} />
                <input id="reg-name" type="text" className="auth-input" placeholder="Your name"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name" aria-required="true" />
              </div>
              {formErrors.name && <p className="field-error" role="alert">{formErrors.name}</p>}
            </div>

            {/* Email */}
            <div className="input-group">
              <label htmlFor="reg-email" className="input-label">Email</label>
              <div className={`input-wrapper ${formErrors.email ? 'error' : ''}`}>
                <MdEmail className="input-icon" size={18} />
                <input id="reg-email" type="email" className="auth-input" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email" aria-required="true" />
              </div>
              {formErrors.email && <p className="field-error" role="alert">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="input-group">
              <label htmlFor="reg-password" className="input-label">Password</label>
              <div className={`input-wrapper ${formErrors.password ? 'error' : ''}`}>
                <MdLock className="input-icon" size={18} />
                <input id="reg-password" type={showPass ? 'text' : 'password'} className="auth-input" placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password" aria-required="true" />
                <button type="button" className="input-eye" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {formErrors.password && <p className="field-error" role="alert">{formErrors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="input-group">
              <label htmlFor="reg-confirm" className="input-label">Confirm Password</label>
              <div className={`input-wrapper ${formErrors.confirm ? 'error' : ''}`}>
                <MdLock className="input-icon" size={18} />
                <input id="reg-confirm" type="password" className="auth-input" placeholder="Repeat password"
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password" aria-required="true" />
              </div>
              {formErrors.confirm && <p className="field-error" role="alert">{formErrors.confirm}</p>}
            </div>

            <button type="submit" className="btn-primary auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
