import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff,
  MdArrowForward, MdCheck, MdLocationOn,
  MdChat, MdShield, MdSos, MdClose
} from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import ConnectSphereLogo from '../components/ConnectSphereLogo'
import { GoogleLogin } from '@react-oauth/google'
import './AuthPage.css'

/* ──────────────────────────────────────
   Shared Input Component
────────────────────────────────────── */
function FormInput({ id, label, type = 'text', icon: Icon, value, onChange, error, placeholder, autoComplete, suffix }) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field-label">{label}</label>
      <div className={`auth-field-wrap ${error ? 'has-error' : value ? 'has-value' : ''}`}>
        <span className="auth-field-icon"><Icon size={18} /></span>
        <input
          id={id}
          type={type}
          className="auth-field-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {suffix}
      </div>
      {error && (
        <p id={`${id}-err`} className="auth-field-error" role="alert">
          <MdClose size={13} /> {error}
        </p>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Google OAuth Button
 ────────────────────────────────────── */
function GoogleButton({ label, onSuccess }) {
  return (
    <div className="google-login-row">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => console.log('Login Failed')}
        useOneTap
        theme="filled_blue"
        shape="pill"
        width="101%"
        text="continue_with"
      />
    </div>
  )
}

/* ──────────────────────────────────────
   Divider
────────────────────────────────────── */
const Divider = () => (
  <div className="auth-divider" aria-hidden>
    <span className="auth-divider-line" />
    <span className="auth-divider-text">or</span>
    <span className="auth-divider-line" />
  </div>
)

/* ──────────────────────────────────────
   Login Form
────────────────────────────────────── */
function LoginForm({ onSwitch }) {
  const { login, loginDemo, loginGoogle, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()

  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [showPass, setShow]   = useState(false)
  const [errors, setErrors]   = useState({})
  const [remember, setRemember] = useState(false)
  const [authNotice, setAuthNotice] = useState('')

  const validate = () => {
    const e = {}
    if (!email.trim())        e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password)            e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setAuthNotice('')
    const res = await login(email, password)
    if (res.success) navigate('/dashboard')
  }


  return (
    <div className="auth-form-section animate-fadeInUp">
      <div className="auth-form-header">
        <h1 className="auth-form-title">Welcome back</h1>
        <p className="auth-form-subtitle">Sign in to your ConnectSphere account</p>
      </div>

      {/* Server error banner */}
      {error && (
        <div className="auth-server-error" role="alert" aria-live="assertive">
          <MdClose size={16} /> {error}
        </div>
      )}

      {authNotice && (
        <div className="auth-inline-notice" role="status" aria-live="polite">
          <MdCheck size={16} /> {authNotice}
        </div>
      )}

      <GoogleButton onSuccess={(credentialResponse) => {
        loginGoogle(credentialResponse.credential).then(res => {
          if (res.success) navigate('/dashboard')
        })
      }} />
      <Divider />

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <FormInput
          id="login-email" label="Email address" type="email"
          icon={MdEmail} value={email} onChange={e => setEmail(e.target.value)}
          error={errors.email} placeholder="you@example.com" autoComplete="email"
        />
        <FormInput
          id="login-password" label="Password"
          type={showPass ? 'text' : 'password'}
          icon={MdLock} value={password} onChange={e => setPass(e.target.value)}
          error={errors.password} placeholder="••••••••" autoComplete="current-password"
          suffix={
            <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          }
        />

        <div className="auth-row">
          <label className="remember-check">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/help" className="forgot-link">Forgot password?</Link>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading} aria-busy={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Signing in…' : 'Sign In'}
          {!loading && <MdArrowForward size={18} />}
        </button>

      </form>

      <p className="auth-switch-text">
        Don't have an account?{' '}
        <button className="auth-switch-link" onClick={onSwitch}>Create one →</button>
      </p>
    </div>
  )
}

/* ──────────────────────────────────────
   Signup Form
────────────────────────────────────── */
function SignupForm({ onSwitch }) {
  const { register, loginDemo, loginGoogle, loading, error } = useContext(AuthContext)
  const navigate = useNavigate()

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState(false)
  const [authNotice, setAuthNotice] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name     = 'Full name is required'
    if (!form.email)         e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)      e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    if (!agreed)             e.agree    = 'You must accept the terms'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setAuthNotice('')
    const res = await register(form.name, form.email, form.password)
    if (res.success) navigate('/dashboard')
  }


  // Password strength
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLevels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#3A6FF7', '#7A5AF8']

  return (
    <div className="auth-form-section animate-fadeInUp">
      <div className="auth-form-header">
        <h1 className="auth-form-title">Create account</h1>
        <p className="auth-form-subtitle">Join ConnectSphere for free</p>
      </div>

      {error && (
        <div className="auth-server-error" role="alert" aria-live="assertive">
          <MdClose size={16} /> {error}
        </div>
      )}

      {authNotice && (
        <div className="auth-inline-notice" role="status" aria-live="polite">
          <MdCheck size={16} /> {authNotice}
        </div>
      )}

      <GoogleButton onSuccess={(credentialResponse) => {
        loginGoogle(credentialResponse.credential).then(res => {
          if (res.success) navigate('/dashboard')
        })
      }} />
      <Divider />

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <FormInput
          id="reg-name" label="Full name" type="text"
          icon={MdPerson} value={form.name} onChange={set('name')}
          error={errors.name} placeholder="Your full name" autoComplete="name"
        />
        <FormInput
          id="reg-email" label="Email address" type="email"
          icon={MdEmail} value={form.email} onChange={set('email')}
          error={errors.email} placeholder="you@example.com" autoComplete="email"
        />
        <FormInput
          id="reg-password" label="Password"
          type={showPass ? 'text' : 'password'}
          icon={MdLock} value={form.password} onChange={set('password')}
          error={errors.password} placeholder="Min 6 characters" autoComplete="new-password"
          suffix={
            <button type="button" className="eye-btn" onClick={() => setShow(s => !s)}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          }
        />

        {/* Strength bar */}
        {form.password && (
          <div className="strength-wrapper" aria-label={`Password strength: ${strengthLevels[strength]}`}>
            <div className="strength-bars">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="strength-bar" style={{
                  background: i <= strength ? strengthColors[strength] : 'var(--border)'
                }} />
              ))}
            </div>
            <span className="strength-label" style={{ color: strengthColors[strength] }}>
              {strengthLevels[strength]}
            </span>
          </div>
        )}

        <FormInput
          id="reg-confirm" label="Confirm password"
          type="password"
          icon={MdLock} value={form.confirm} onChange={set('confirm')}
          error={errors.confirm} placeholder="Repeat your password" autoComplete="new-password"
          suffix={form.confirm && form.confirm === form.password
            ? <span className="confirm-ok" aria-label="Passwords match"><MdCheck size={18} /></span>
            : null
          }
        />

        {/* Terms */}
        <label className={`terms-check ${errors.agree ? 'terms-error' : ''}`}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} aria-required="true" />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="terms-link">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="terms-link">Privacy Policy</Link>
          </span>
        </label>
        {errors.agree && <p className="auth-field-error" role="alert"><MdClose size={13} /> {errors.agree}</p>}

        <button type="submit" className="auth-submit-btn" disabled={loading} aria-busy={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Creating account…' : 'Create Account'}
          {!loading && <MdArrowForward size={18} />}
        </button>

      </form>

      <p className="auth-switch-text">
        Already have an account?{' '}
        <button className="auth-switch-link" onClick={onSwitch}>Sign in →</button>
      </p>
    </div>
  )
}

/* ──────────────────────────────────────
   Illustration Panel (left side)
────────────────────────────────────── */
const ILLUSTRATION_ITEMS = [
  { icon: MdChat,       color: '#3A6FF7', label: 'Real-time messaging'  },
  { icon: MdLocationOn, color: '#22D3EE', label: 'Live location sharing' },
  { icon: MdSos,        color: '#F43F5E', label: 'Emergency SOS'         },
  { icon: MdShield,     color: '#7A5AF8', label: 'Privacy & encryption'  },
]

function IllustrationPanel() {
  return (
    <div className="auth-illustration-panel" aria-hidden="true">
      {/* Background blobs */}
      <div className="ill-blob ill-blob-1" />
      <div className="ill-blob ill-blob-2" />
      <div className="ill-blob ill-blob-3" />
      <div className="ill-grid" />

      {/* Logo + brand */}
      <div className="ill-logo">
        <div className="ill-logo-icon"><ConnectSphereLogo size={26} /></div>
        <span className="ill-logo-text">ConnectSphere</span>
      </div>

      {/* Central illustration */}
      <div className="ill-center">
        {/* Phone mockup */}
        <div className="ill-phone">
          <div className="ill-phone-notch" />
          <div className="ill-phone-screen">
            <div className="ill-chat-ui">
              <div className="ill-chat-row ill-chat-recv">
                <div className="ill-bubble ill-bubble-recv">Hey! 👋 Where are you?</div>
              </div>
              <div className="ill-chat-row ill-chat-sent">
                <div className="ill-bubble ill-bubble-sent">Sharing my location! 📍</div>
              </div>
              <div className="ill-chat-row ill-chat-recv">
                <div className="ill-loc-card">
                  <div className="ill-map-mini">
                    <div className="ill-map-grid" />
                    <span className="ill-map-pin">📍</span>
                  </div>
                  <p className="ill-loc-text">Live · 30 min</p>
                </div>
              </div>
              <div className="ill-chat-row ill-chat-sent">
                <div className="ill-bubble ill-bubble-sent">On my way! 🚗</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating feature cards */}
        <div className="ill-feature-pill pill-1">
          <MdCheck size={13} /> End-to-end encrypted
        </div>
        <div className="ill-feature-pill pill-2">
          <span className="pill-dot" /> 3 Online
        </div>
        <div className="ill-sos-badge">
          <span className="ill-sos-dot" /> Safety Active
        </div>
      </div>

      {/* Feature list */}
      <ul className="ill-features-list">
        {ILLUSTRATION_ITEMS.map(({ icon: Icon, color, label }) => (
          <li key={label} className="ill-feature-item">
            <div className="ill-feature-icon" style={{ background: `${color}22`, color }}>
              <Icon size={16} />
            </div>
            {label}
          </li>
        ))}
      </ul>

      {/* Testimonial */}
      <div className="ill-testimonial">
        <div className="ill-stars">{'★'.repeat(5)}</div>
        <p>"ConnectSphere keeps my family safe every day. The SOS feature is a lifesaver."</p>
        <div className="ill-author">
          <div className="ill-author-avatar" />
          <div>
            <p className="ill-author-name">Priya S.</p>
            <p className="ill-author-role">Parent & user</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Auth Page – Root Export
────────────────────────────────────── */
export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  // Detect initial mode from URL
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register')

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Sync URL with tab state
  const switchToLogin  = () => { setIsLogin(true);  navigate('/login',    { replace: true }) }
  const switchToSignup = () => { setIsLogin(false); navigate('/register', { replace: true }) }

  return (
    <div className="auth-page">
      {/* Left – illustration (desktop only) */}
      <IllustrationPanel />

      {/* Right – form panel */}
      <div className="auth-panel">
        {/* Mobile logo */}
        <Link to="/" className="auth-mobile-logo" aria-label="ConnectSphere home">
          <div className="auth-mobile-logo-icon"><ConnectSphereLogo size={22} /></div>
          <span>ConnectSphere</span>
        </Link>

        {/* Tab switcher */}
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            role="tab"
            aria-selected={isLogin}
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={switchToLogin}
            id="tab-login"
            aria-controls="panel-login"
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={!isLogin}
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={switchToSignup}
            id="tab-signup"
            aria-controls="panel-signup"
          >
            Sign Up
          </button>
          {/* Sliding pill indicator */}
          <div className="auth-tab-indicator" style={{ left: isLogin ? 4 : 'calc(50% + 0px)' }} />
        </div>

        {/* Form panels */}
        <div
          id={isLogin ? 'panel-login' : 'panel-signup'}
          role="tabpanel"
          aria-labelledby={isLogin ? 'tab-login' : 'tab-signup'}
          className="auth-panel-body"
        >
          {isLogin
            ? <LoginForm  onSwitch={switchToSignup} />
            : <SignupForm onSwitch={switchToLogin}  />
          }
        </div>

        <p className="auth-panel-footer">
          © 2026 ConnectSphere · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
        </p>
      </div>
    </div>
  )
}
