import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdSos, MdLocationOn, MdPhone, MdClose, MdCheck,
  MdWarning, MdPeople, MdAdd, MdEdit, MdDelete,
  MdTimer, MdWifiTethering, MdNotificationsActive, MdArrowBack,
  MdShield, MdFlashOn, MdMyLocation, MdSignalCellularAlt,
  MdMic, MdCameraAlt, MdMessage, MdHistory
} from 'react-icons/md'
import { LocationContext } from '../context/LocationContext'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import Avatar from '../components/Avatar'
import './SOSPage.css'

/* ──────────────────────────────────────
   Mock Emergency Contacts
────────────────────────────────────── */
const INITIAL_CONTACTS = [
  { id: 'ec1', name: 'Sarah Chen',   phone: '+91 98765 43210', relation: 'Friend',  initials: 'SC', isOnline: true,  notified: false, color: '#3A6FF7' },
  { id: 'ec2', name: 'David Kumar',  phone: '+91 98765 10987', relation: 'Colleague', initials: 'DK', isOnline: false, notified: false, color: '#7A5AF8' },
  { id: 'ec3', name: 'Mom',          phone: '+91 99887 76655', relation: 'Family',  initials: 'MO', isOnline: true,  notified: false, color: '#F43F5E' },
]

/* ──────────────────────────────────────
   SOS States
────────────────────────────────────── */
// idle → arming (hold in progress) → armed (waiting to confirm) → active (SOS triggered) → resolved

/* ──────────────────────────────────────
   SOSButton Component
────────────────────────────────────── */
function SOSButton({ state, holdProgress, onHoldStart, onHoldEnd, onCancel, onResolve }) {
  const isIdle     = state === 'idle'
  const isArming   = state === 'arming'
  const isActive   = state === 'active'
  const isResolved = state === 'resolved'
  const ringSize   = 280
  const r          = 116
  const circ       = 2 * Math.PI * r
  const offset     = circ * (1 - holdProgress)

  return (
    <div className="sosb-wrap" aria-label="SOS button area">
      {/* Outermost ambient ring (active only) */}
      {isActive && (
        <>
          <div className="sosb-ambient-ring sosb-ar-1" aria-hidden />
          <div className="sosb-ambient-ring sosb-ar-2" aria-hidden />
          <div className="sosb-ambient-ring sosb-ar-3" aria-hidden />
        </>
      )}

      {/* SVG progress ring */}
      <svg
        className="sosb-svg"
        width={ringSize} height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={ringSize / 2} cy={ringSize / 2} r={r}
          fill="none"
          stroke="rgba(244,63,94,0.15)"
          strokeWidth={8}
        />
        {/* Progress arc */}
        {isArming && (
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r}
            fill="none"
            stroke="#F43F5E"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            style={{ transition: 'stroke-dashoffset 0.08s linear' }}
          />
        )}
        {isActive && (
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r}
            fill="none"
            stroke="#F43F5E"
            strokeWidth={6}
            strokeDasharray="12 8"
            style={{ animation: 'sosDash 1.5s linear infinite' }}
          />
        )}
      </svg>

      {/* Core button */}
      <button
        className={`sosb-core ${state}`}
        onMouseDown={onHoldStart}
        onMouseUp={onHoldEnd}
        onTouchStart={onHoldStart}
        onTouchEnd={onHoldEnd}
        onContextMenu={e => e.preventDefault()}
        aria-label={
          isIdle     ? 'Hold for 3 seconds to activate SOS' :
          isArming   ? `Activating SOS — hold for ${Math.round((1 - holdProgress) * 3)} seconds` :
          isActive   ? 'SOS active — tap to resolve' :
          isResolved ? 'SOS resolved' : 'SOS'
        }
        aria-live="assertive"
      >
        <div className="sosb-inner">
          {isIdle     && <><MdSos size={52} /><span className="sosb-label">SOS</span></>}
          {isArming   && <><MdFlashOn size={52} /><span className="sosb-label">Hold…</span></>}
          {isActive   && <><MdSos size={52} /><span className="sosb-label">ACTIVE</span></>}
          {isResolved && <><MdCheck size={52} /><span className="sosb-label">Safe</span></>}
        </div>
      </button>

      {/* Cancel / Resolve buttons below */}
      {isArming && (
        <button className="sosb-cancel-btn" onClick={onCancel} aria-label="Cancel SOS">
          <MdClose size={18} /> Cancel
        </button>
      )}
      {isActive && (
        <button className="sosb-resolve-btn" onClick={onResolve} aria-label="Mark as safe">
          <MdCheck size={18} /> I'm Safe — Stop Alert
        </button>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Alert Status Card
────────────────────────────────────── */
function AlertStatusCard({ state, contacts, location, elapsedSecs, onSendNote }) {
  const notifiedCount = contacts.filter(c => c.notified).length

  if (state === 'idle') return null

  const isActive   = state === 'active'
  const isResolved = state === 'resolved'

  return (
    <div
      className={`asc-card ${isActive ? 'asc-active' : 'asc-resolved'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Header */}
      <div className="asc-header">
        <div className={`asc-status-dot ${isActive ? 'pulsing' : 'resolved'}`} aria-hidden />
        <div>
          <p className="asc-title">
            {isActive ? '🚨 Emergency Alert Active' : '✅ Alert Resolved'}
          </p>
          {isActive && (
            <p className="asc-sub">{notifiedCount} of {contacts.length} contacts notified</p>
          )}
          {isResolved && (
            <p className="asc-sub">All contacts notified you are safe</p>
          )}
        </div>
        {isActive && (
          <div className="asc-elapsed" aria-label={`${elapsedSecs} seconds elapsed`}>
            <MdTimer size={14} />
            {Math.floor(elapsedSecs / 60).toString().padStart(2, '0')}:{(elapsedSecs % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Location strip */}
      {location && (
        <div className="asc-loc-strip">
          <MdLocationOn size={14} />
          <span>Live location sharing active · {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E</span>
          <span className="asc-accuracy">±{Math.round(location.accuracy || 18)}m</span>
        </div>
      )}

      {/* Contacts status */}
      <div className="asc-contacts" aria-label="Notification status per contact">
        {contacts.map(c => (
          <div key={c.id} className="asc-contact-row">
            <Avatar initials={c.initials} size={28} isOnline={c.isOnline} color={c.color} />
            <div className="asc-contact-info">
              <p className="asc-contact-name">{c.name}</p>
              <p className={`asc-contact-status ${c.notified ? 'notified' : 'pending'}`}>
                {c.notified ? '✓ Notified' : '⏳ Sending…'}
              </p>
            </div>
            {c.isOnline && c.notified && (
              <span className="asc-seen-badge">Seen</span>
            )}
          </div>
        ))}
      </div>

      {/* Actions row */}
      {isActive && (
        <div className="asc-actions">
          <button className="asc-action-btn" aria-label="Call emergency services" onClick={() => { window.location.href = 'tel:112' }}>
            <MdPhone size={16} /> Call 112
          </button>
          <button className="asc-action-btn asc-action-msg" aria-label="Send custom message" onClick={onSendNote}>
            <MdMessage size={16} /> Send Note
          </button>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Emergency Contact List
────────────────────────────────────── */
function EmergencyContactList({ contacts, onAdd, onRemove, onEdit, sosActive }) {
  return (
    <section className="ecl-section" aria-label="Emergency contacts">
      <div className="ecl-header">
        <div className="ecl-title-row">
          <MdPeople size={18} color="var(--primary)" />
          <h3 className="ecl-title">Trusted Contacts</h3>
          <span className="ecl-count">{contacts.length}/5</span>
        </div>
        {!sosActive && (
          <button className="ecl-add-btn" onClick={onAdd} aria-label="Add emergency contact">
            <MdAdd size={16} />
            Add
          </button>
        )}
      </div>
      <p className="ecl-hint">
        These contacts receive your live location and an alert message when SOS is activated.
      </p>

      <div className="ecl-list" role="list">
        {contacts.map((c, i) => (
          <div
            key={c.id}
            className={`ecl-item ${c.notified ? 'notified' : ''}`}
            role="listitem"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="ecl-priority">
              <span className="ecl-priority-num" aria-label={`Priority ${i + 1}`}>{i + 1}</span>
            </div>
            <Avatar initials={c.initials} size={44} isOnline={c.isOnline} color={c.color} />
            <div className="ecl-info">
              <p className="ecl-name">{c.name}</p>
              <p className="ecl-relation">{c.relation}</p>
              <p className="ecl-phone">
                <MdPhone size={12} /> {c.phone}
              </p>
            </div>
            <div className="ecl-status-col">
              {c.isOnline
                ? <span className="ecl-online-badge">Online</span>
                : <span className="ecl-offline-badge">Offline</span>
              }
              {c.notified && (
                <span className="ecl-notified-badge">
                  <MdNotificationsActive size={10} /> Notified
                </span>
              )}
            </div>
            {!sosActive && (
              <div className="ecl-actions">
                <button className="ecl-act-btn" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`}>
                  <MdEdit size={15} />
                </button>
                <button className="ecl-act-btn ecl-act-del" onClick={() => onRemove(c.id)} aria-label={`Remove ${c.name}`}>
                  <MdDelete size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="ecl-empty" role="status">
          <MdPeople size={32} opacity={0.2} />
          <p>No emergency contacts added yet</p>
          <button className="ecl-empty-add" onClick={onAdd}>+ Add First Contact</button>
        </div>
      )}
    </section>
  )
}

/* ──────────────────────────────────────
   Quick Safety Features Strip
────────────────────────────────────── */
function SafetyFeaturesStrip({ onAction }) {
  const features = [
    { icon: MdMyLocation,     label: 'Auto Location',  desc: 'Shared instantly',   color: '#3A6FF7' },
    { icon: MdNotificationsActive, label: 'Alert All', desc: 'All contacts notified', color: '#F43F5E' },
    { icon: MdSignalCellularAlt, label: 'SMS Backup',  desc: 'Works offline',      color: '#10B981' },
    { icon: MdHistory,        label: 'Alert History',  desc: 'View past alerts',   color: '#7A5AF8' },
  ]

  return (
    <div className="sfs-strip" aria-label="Safety features">
      {features.map(({ icon: Icon, label, desc, color }) => (
        <button key={label} className="sfs-item" aria-label={`${label}: ${desc}`} onClick={() => onAction(label)}>
          <div className="sfs-icon" style={{ background: `${color}18`, color }}>
            <Icon size={20} />
          </div>
          <p className="sfs-label">{label}</p>
          <p className="sfs-desc">{desc}</p>
        </button>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────
   Add Contact Modal (simple inline)
────────────────────────────────────── */
function AddContactModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', relation: 'Friend' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    onSave({
      id:       `ec${Date.now()}`,
      name:     form.name,
      phone:    form.phone,
      relation: form.relation,
      initials: form.name.slice(0, 2).toUpperCase(),
      isOnline: false,
      notified: false,
      color:    '#7A5AF8',
    })
    onClose()
  }

  return (
    <div className="acm-backdrop" role="dialog" aria-modal="true" aria-label="Add emergency contact">
      <div className="acm-modal animate-fadeInUp">
        <div className="acm-header">
          <h3>Add Emergency Contact</h3>
          <button onClick={onClose} aria-label="Close"><MdClose size={20} /></button>
        </div>
        {[
          { id: 'ac-name',     label: 'Full Name',    key: 'name',     type: 'text',  placeholder: 'e.g. Sarah Chen' },
          { id: 'ac-phone',    label: 'Phone Number', key: 'phone',    type: 'tel',   placeholder: '+91 98765 43210' },
          { id: 'ac-relation', label: 'Relationship', key: 'relation', type: 'text',  placeholder: 'Friend, Family, Colleague…' },
        ].map(({ id, label, key, type, placeholder }) => (
          <div key={id} className="acm-field">
            <label htmlFor={id} className="acm-label">{label}</label>
            <input
              id={id}
              type={type}
              className="acm-input"
              placeholder={placeholder}
              value={form[key]}
              onChange={set(key)}
            />
          </div>
        ))}
        <div className="acm-actions">
          <button className="acm-cancel" onClick={onClose}>Cancel</button>
          <button
            className="acm-save"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.phone.trim()}
          >
            <MdCheck size={16} /> Save Contact
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   SOSPage — Root Export
────────────────────────────────────── */
const HOLD_DURATION_MS = 3000

export default function SOSPage() {
  const navigate = useNavigate()
  const { myLocation } = useContext(LocationContext)
  const { user }       = useContext(AuthContext)
  const { socket }     = useContext(ChatContext)

  const [sosState,    setSosState]   = useState('idle')   // idle|arming|active|resolved
  const [holdProg,    setHoldProg]   = useState(0)
  const [contacts,    setContacts]   = useState(INITIAL_CONTACTS)
  const [elapsed,     setElapsed]    = useState(0)
  const [showAdd,     setShowAdd]    = useState(false)

  const holdTimerRef   = useRef(null)
  const holdStartRef   = useRef(null)
  const elapsedRef     = useRef(null)
  const animFrameRef   = useRef(null)

  /* ── Hold SOS button ── */
  const startHold = useCallback(() => {
    if (sosState !== 'idle') return
    setSosState('arming')
    holdStartRef.current = Date.now()

    // Animate progress via requestAnimationFrame
    const tick = () => {
      const diff = Date.now() - holdStartRef.current
      const prog = Math.min(diff / HOLD_DURATION_MS, 1)
      setHoldProg(prog)
      if (prog < 1) {
        animFrameRef.current = requestAnimationFrame(tick)
      } else {
        triggerSOS()
      }
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [sosState])

  const endHold = useCallback(() => {
    if (sosState !== 'arming') return
    cancelAnimationFrame(animFrameRef.current)
    setSosState('idle')
    setHoldProg(0)
  }, [sosState])

  const cancelSOS = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    setSosState('idle')
    setHoldProg(0)
  }, [])

  /* ── Trigger SOS ── */
  const triggerSOS = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    setSosState('active')
    setHoldProg(1)
    setElapsed(0)

    // Start elapsed timer
    elapsedRef.current = setInterval(() => setElapsed(s => s + 1), 1000)

    // Notify contacts progressively (simulate API call delay)
    contacts.forEach((c, i) => {
      setTimeout(() => {
        setContacts(prev => prev.map(x => x.id === c.id ? { ...x, notified: true } : x))
      }, 600 + i * 800)
    })

    // Emit via Socket.IO
    socket?.emit('sos-alert', {
      userId: user?._id,
      location: myLocation || { lat: 12.9716, lng: 77.5946 },
      contacts: contacts.map(c => c.id),
    })

    // POST to backend (fire-and-forget demo)
    fetch('/api/location/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: myLocation, contacts }),
    }).catch(() => {}) // fails gracefully in demo mode
  }, [contacts, myLocation, user, socket])

  /* ── Resolve SOS ── */
  const resolveSOS = useCallback(() => {
    clearInterval(elapsedRef.current)
    setSosState('resolved')
    // Reset contacts after brief delay
    setTimeout(() => {
      setContacts(prev => prev.map(c => ({ ...c, notified: false })))
      setSosState('idle')
      setHoldProg(0)
      setElapsed(0)
    }, 3500)
  }, [])

  // Cleanup
  useEffect(() => () => {
    cancelAnimationFrame(animFrameRef.current)
    clearInterval(elapsedRef.current)
  }, [])

  const handleAddContact = (c) => setContacts(prev => [...prev, c])
  const handleRemove    = (id) => setContacts(prev => prev.filter(c => c.id !== id))
  const handleEditContact = (contact) => {
    const name = window.prompt('Edit contact name', contact.name)
    if (!name) return
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, name, initials: name.slice(0, 2).toUpperCase() } : c))
  }

  const isSOSActive = sosState === 'active'

  return (
    <div className={`sos-page ${isSOSActive ? 'sos-alarm-mode' : ''}`}>
      {/* ── Top bar ── */}
      <header className="sos-topbar">
        <button className="sos-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <MdArrowBack size={22} />
        </button>
        <div className="sos-topbar-title">
          <MdShield size={20} color="var(--danger)" />
          <h1>Emergency SOS</h1>
        </div>
        <div className="sos-topbar-right">
          {isSOSActive && (
            <div className="sos-alarm-indicator" aria-live="polite">
              <span className="sos-alarm-dot" aria-hidden />
              ALARM
            </div>
          )}
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="sos-scroll">
        {/* ── SOS Button section ── */}
        <section className="sos-hero-section" aria-label="SOS activation">
          {sosState === 'idle' && (
            <p className="sos-instruction">
              Hold the button for <strong>3 seconds</strong> to send an emergency alert to your trusted contacts.
            </p>
          )}
          {sosState === 'arming' && (
            <p className="sos-instruction sos-arming-text" aria-live="polite">
              Keep holding… releasing will cancel.
            </p>
          )}
          {isSOSActive && (
            <p className="sos-instruction sos-active-text" aria-live="assertive">
              🚨 Emergency alert sent! Contacts are being notified.
            </p>
          )}
          {sosState === 'resolved' && (
            <p className="sos-instruction sos-resolved-text" aria-live="polite">
              ✅ Alert cancelled. All contacts notified you're safe.
            </p>
          )}

          <SOSButton
            state={sosState}
            holdProgress={holdProg}
            onHoldStart={startHold}
            onHoldEnd={endHold}
            onCancel={cancelSOS}
            onResolve={resolveSOS}
          />
        </section>

        {/* ── Alert status card ── */}
        <AlertStatusCard
          state={sosState}
          contacts={contacts}
          location={myLocation || { lat: 12.9716, lng: 77.5946, accuracy: 18 }}
          elapsedSecs={elapsed}
          onSendNote={() => { window.location.href = `sms:${contacts[0]?.phone?.replace(/\s+/g, '')}?body=${encodeURIComponent('Emergency alert acknowledged. Please check in with me.')}` }}
        />

        {/* ── Safety features ── */}
        {sosState === 'idle' && <SafetyFeaturesStrip onAction={(label) => {
          if (label === 'Auto Location') navigate('/map')
          if (label === 'Alert All') triggerSOS()
          if (label === 'SMS Backup') { window.location.href = `sms:${contacts[0]?.phone?.replace(/\s+/g, '')}?body=${encodeURIComponent('This is a backup SOS text from ConnectSphere.')}` }
          if (label === 'Alert History') navigate('/profile')
        }} />}

        {/* ── Emergency contact list ── */}
        <EmergencyContactList
          contacts={contacts}
          onAdd={() => setShowAdd(true)}
          onRemove={handleRemove}
          onEdit={handleEditContact}
          sosActive={isSOSActive}
        />

        {/* ── Quick dial ── */}
        <section className="sos-quick-dial" aria-label="Quick dial emergency services">
          <h3 className="sos-section-title">Emergency Services</h3>
          <div className="sos-dial-grid">
            {[
              { label: 'Police',      number: '100', color: '#3A6FF7', icon: '🚔' },
              { label: 'Ambulance',   number: '108', color: '#EF4444', icon: '🚑' },
              { label: 'Fire',        number: '101', color: '#F97316', icon: '🚒' },
              { label: 'Women Help',  number: '1091', color: '#A855F7', icon: '🛡️' },
            ].map(s => (
              <a
                key={s.label}
                href={`tel:${s.number}`}
                className="sos-dial-btn"
                style={{ '--dial-color': s.color }}
                aria-label={`Call ${s.label} at ${s.number}`}
              >
                <span className="sos-dial-emoji">{s.icon}</span>
                <span className="sos-dial-label">{s.label}</span>
                <span className="sos-dial-num">{s.number}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <AddContactModal
          onSave={handleAddContact}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
