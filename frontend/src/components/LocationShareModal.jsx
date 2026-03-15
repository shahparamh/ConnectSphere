import { useState, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  MdLocationOn, MdClose, MdMyLocation, MdWifiTethering,
  MdTimer, MdPeople, MdCheck, MdWarning, MdInfo,
  MdArrowBack, MdGpsFixed, MdGpsNotFixed, MdLock
} from 'react-icons/md'
import { LocationContext } from '../context/LocationContext'
import { ChatContext, MOCK_CONTACTS } from '../context/ChatContext'
import Avatar from './Avatar'
import './LocationShareModal.css'

/* ──────────────────────────────────────
   Data
────────────────────────────────────── */
const DURATION_OPTIONS = [
  { id: '15m',   label: '15 min',       mins: 15,    icon: '⚡' },
  { id: '1h',    label: '1 hour',       mins: 60,    icon: '⏱' },
  { id: '8h',    label: '8 hours',      mins: 480,   icon: '🌙' },
  { id: 'stop',  label: 'Until stopped', mins: null,  icon: '∞'  },
]

const SHARE_MODES = [
  {
    id: 'current',
    icon: MdMyLocation,
    title: 'Send Current Location',
    desc: 'Share a single snapshot of your location right now. Recipients see where you are at this moment.',
    color: 'var(--primary)',
    bg: 'rgba(58,111,247,0.1)',
  },
  {
    id: 'live',
    icon: MdWifiTethering,
    title: 'Share Live Location',
    desc: 'Continuously update your location in real-time. Others can follow your movement on a map.',
    color: 'var(--success)',
    bg: 'rgba(16,185,129,0.1)',
  },
]

/* ──────────────────────────────────────
   Mini Map Preview Component
────────────────────────────────────── */
function MapPreviewSection({ mode, location, permissionState }) {
  return (
    <div className="lsm-map-wrap" aria-label="Map preview">
      {/* Map canvas */}
      <div className="lsm-map">
        {/* Grid */}
        <div className="lsm-map-grid" aria-hidden />
        {/* Roads */}
        <div className="lsm-roads" aria-hidden>
          <div className="lsm-road lsm-road-h1" />
          <div className="lsm-road lsm-road-h2" />
          <div className="lsm-road lsm-road-v1" />
          <div className="lsm-road lsm-road-v2" />
          <div className="lsm-road lsm-road-d"  />
        </div>
        {/* Blocks */}
        <div className="lsm-blocks" aria-hidden>
          <div className="lsm-block lsm-block-1" />
          <div className="lsm-block lsm-block-2" />
          <div className="lsm-block lsm-block-3" />
        </div>

        {/* Location pin */}
        {permissionState !== 'denied' && (
          <div className={`lsm-pin-wrap ${mode === 'live' ? 'live-mode' : ''}`} aria-label="Your location">
            <div className="lsm-accuracy-ring" aria-hidden />
            <div className="lsm-accuracy-ring lsm-ring-2" aria-hidden />
            <div className="lsm-pin">
              <MdLocationOn size={28} className="lsm-pin-icon" />
              <div className="lsm-pin-shadow" aria-hidden />
            </div>
          </div>
        )}

        {/* Live indicator overlay */}
        {mode === 'live' && permissionState !== 'denied' && (
          <div className="lsm-live-badge" aria-label="Live location mode">
            <span className="lsm-live-dot" aria-hidden />
            LIVE
          </div>
        )}

        {/* Permission denied overlay */}
        {permissionState === 'denied' && (
          <div className="lsm-perm-overlay" role="alert">
            <MdGpsNotFixed size={28} />
            <p>Location access denied</p>
            <p className="lsm-perm-sub">Enable in browser settings</p>
          </div>
        )}

        {/* Loading overlay */}
        {permissionState === 'loading' && (
          <div className="lsm-perm-overlay" role="status">
            <div className="lsm-perm-spinner" aria-hidden />
            <p>Getting location…</p>
          </div>
        )}
      </div>

      {/* Coordinates strip */}
      {location && permissionState === 'granted' && (
        <div className="lsm-coords" aria-label="Current coordinates">
          <MdGpsFixed size={13} />
          <span>{location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E</span>
          <span className="lsm-accuracy-label">±{Math.round(location.accuracy || 18)}m</span>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Step 1 – Mode & Options
────────────────────────────────────── */
function StepOptions({ mode, setMode, duration, setDuration, contacts, selectedContacts, toggleContact, onNext, onCancel }) {
  const canProceed = selectedContacts.length > 0

  return (
    <div className="lsm-step animate-fadeInUp">
      {/* Mode selector */}
      <div className="lsm-section">
        <p className="lsm-section-label">Share type</p>
        <div className="lsm-mode-grid">
          {SHARE_MODES.map(({ id, icon: Icon, title, desc, color, bg }) => (
            <button
              key={id}
              className={`lsm-mode-card ${mode === id ? 'active' : ''}`}
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              style={{ '--mode-color': color, '--mode-bg': bg }}
            >
              <div className="lsm-mode-icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </div>
              <div className="lsm-mode-text">
                <p className="lsm-mode-title">{title}</p>
                <p className="lsm-mode-desc">{desc}</p>
              </div>
              <div className={`lsm-mode-radio ${mode === id ? 'checked' : ''}`} aria-hidden>
                {mode === id && <MdCheck size={13} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration picker – only for live mode */}
      {mode === 'live' && (
        <div className="lsm-section animate-fadeInUp" aria-label="Live location duration">
          <p className="lsm-section-label">
            <MdTimer size={14} /> Duration
          </p>
          <div className="lsm-duration-grid" role="group" aria-label="Duration options">
            {DURATION_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`lsm-dur-btn ${duration.id === opt.id ? 'active' : ''}`}
                onClick={() => setDuration(opt)}
                aria-pressed={duration.id === opt.id}
              >
                <span className="lsm-dur-icon">{opt.icon}</span>
                <span className="lsm-dur-label">{opt.label}</span>
              </button>
            ))}
          </div>
          {duration.id === 'stop' && (
            <div className="lsm-info-tip">
              <MdInfo size={14} />
              Sharing continues until you manually stop it from the map screen.
            </div>
          )}
        </div>
      )}

      {/* Contact selector */}
      <div className="lsm-section">
        <p className="lsm-section-label">
          <MdPeople size={14} /> Share with
          {selectedContacts.length > 0 && (
            <span className="lsm-selected-count">{selectedContacts.length} selected</span>
          )}
        </p>
        <div className="lsm-contacts" role="group" aria-label="Select contacts">
          {contacts.map(c => {
            const sel = selectedContacts.includes(c._id)
            return (
              <button
                key={c._id}
                className={`lsm-contact-btn ${sel ? 'selected' : ''}`}
                onClick={() => toggleContact(c._id)}
                aria-pressed={sel}
                aria-label={`${sel ? 'Deselect' : 'Select'} ${c.name}`}
              >
                <div className="lsm-contact-avatar-wrap">
                  <Avatar initials={c.initials} size={40} isOnline={c.isOnline} />
                  {sel && (
                    <div className="lsm-contact-check" aria-hidden>
                      <MdCheck size={12} />
                    </div>
                  )}
                </div>
                <span className="lsm-contact-name">{c.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
        {selectedContacts.length === 0 && (
          <p className="lsm-contacts-hint" role="status">
            <MdWarning size={13} /> Select at least one contact to continue
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="lsm-actions">
        <button className="lsm-cancel-btn" onClick={onCancel}>Cancel</button>
        <button
          className="lsm-share-btn"
          onClick={onNext}
          disabled={!canProceed}
          aria-disabled={!canProceed}
        >
          Continue
          <MdArrowBack size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Step 2 – Confirmation Dialog
────────────────────────────────────── */
function StepConfirm({ mode, duration, selectedContacts, contacts, onBack, onConfirm, sharing }) {
  const selContacts = contacts.filter(c => selectedContacts.includes(c._id))
  const modeData = SHARE_MODES.find(m => m.id === mode)
  const ModeIcon = modeData.icon

  return (
    <div className="lsm-step animate-fadeInUp">
      <div className="lsm-confirm-card">
        {/* Mode summary */}
        <div className="lsm-confirm-mode" style={{ '--mode-color': modeData.color }}>
          <div className="lsm-confirm-icon" style={{ background: modeData.bg, color: modeData.color }}>
            <ModeIcon size={24} />
          </div>
          <div>
            <p className="lsm-confirm-mode-title">{modeData.title}</p>
            {mode === 'live' && (
              <p className="lsm-confirm-mode-sub">
                <MdTimer size={12} /> {duration.label}
              </p>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="lsm-confirm-recipients">
          <p className="lsm-confirm-label">
            <MdPeople size={14} /> Sharing with {selContacts.length} contact{selContacts.length !== 1 ? 's' : ''}
          </p>
          <div className="lsm-confirm-avatars">
            {selContacts.map(c => (
              <div key={c._id} className="lsm-confirm-avatar-row">
                <Avatar initials={c.initials} size={32} isOnline={c.isOnline} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="lsm-privacy-note" role="note">
          <MdLock size={14} />
          <p>
            {mode === 'live'
              ? `Your live location will be visible for ${duration.label}. You can stop sharing any time from the map screen.`
              : 'Only your current position is shared — no ongoing tracking.'
            }
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="lsm-actions">
        <button className="lsm-back-btn" onClick={onBack} disabled={sharing}>
          <MdArrowBack size={16} /> Back
        </button>
        <button
          className={`lsm-confirm-btn ${sharing ? 'sharing' : ''}`}
          onClick={onConfirm}
          disabled={sharing}
          aria-busy={sharing}
          aria-label={sharing ? 'Sharing…' : 'Confirm share'}
        >
          {sharing ? (
            <>
              <span className="lsm-spinner" aria-hidden />
              Sharing…
            </>
          ) : (
            <>
              <MdLocationOn size={16} />
              Share Now
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Step 3 – Success
────────────────────────────────────── */
function StepSuccess({ mode, duration, selectedContacts, contacts, onClose }) {
  const selContacts = contacts.filter(c => selectedContacts.includes(c._id))

  return (
    <div className="lsm-step lsm-success animate-fadeInUp">
      <div className="lsm-success-animation" aria-hidden>
        <div className="lsm-success-ring lsm-ring-outer" />
        <div className="lsm-success-ring lsm-ring-inner" />
        <div className="lsm-success-check">
          <MdCheck size={36} />
        </div>
      </div>

      <h3 className="lsm-success-title">
        {mode === 'live' ? 'Live Location Shared!' : 'Location Sent!'}
      </h3>
      <p className="lsm-success-sub">
        {mode === 'live'
          ? `Your location is being shared for ${duration.label} with ${selContacts.length} contact${selContacts.length !== 1 ? 's' : ''}.`
          : `Your current location has been sent to ${selContacts.length} contact${selContacts.length !== 1 ? 's' : ''}.`
        }
      </p>

      <div className="lsm-success-recipients">
        {selContacts.map(c => (
          <div key={c._id} className="lsm-success-recipient">
            <Avatar initials={c.initials} size={36} isOnline={c.isOnline} />
            <span>{c.name}</span>
            <MdCheck size={14} className="lsm-recipient-check" />
          </div>
        ))}
      </div>

      {mode === 'live' && (
        <div className="lsm-live-active-badge">
          <span className="lsm-live-dot" />
          Live tracking active
        </div>
      )}

      <button className="lsm-done-btn" onClick={onClose} autoFocus>
        Done
      </button>
    </div>
  )
}

/* ──────────────────────────────────────
   Location Share Modal — Root
────────────────────────────────────── */
export default function LocationShareModal({ onClose }) {
  const { myLocation, shareLocation, isSharing } = useContext(LocationContext)

  const [step, setStep] = useState(1)   // 1 = options, 2 = confirm, 3 = success
  const [mode, setMode] = useState('live')
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]) // 1 hour default
  const [selectedContacts, setSel] = useState([])
  const [sharing, setSharing] = useState(false)
  const [permissionState, setPermState] = useState(
    myLocation ? 'granted' : 'loading'
  )

  const backdropRef = useRef(null)

  // Simulate geolocation check
  useEffect(() => {
    if (myLocation) { setPermState('granted'); return }
    const timer = setTimeout(() => {
      if (!myLocation) setPermState('granted') // demo: assume granted
    }, 1200)
    return () => clearTimeout(timer)
  }, [myLocation])

  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleContact = (id) => {
    setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleConfirm = async () => {
    setSharing(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1400))
    if (shareLocation) {
      await shareLocation({
        durationMinutes: duration.mins,
        sharedWith: selectedContacts,
      }).catch(() => {})
    }
    setSharing(false)
    setStep(3)
  }

  // Backdrop click — only close if on step 1 or step 3
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      if (step === 1 || step === 3) onClose()
      // Step 2: don't close on backdrop click to prevent accidental dismiss
    }
  }

  const stepLabel = ['', 'Choose sharing options', 'Confirm sharing', 'Location shared'][step]

  return createPortal(
    <div
      className="lsm-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Location sharing"
      aria-describedby="lsm-step-label"
    >
      <div className="lsm-modal">
        {/* ── Header ── */}
        <div className="lsm-header">
          <div className="lsm-header-left">
            <div className="lsm-header-icon">
              <MdLocationOn size={18} />
            </div>
            <div>
              <h2 className="lsm-title">Share Location</h2>
              <p id="lsm-step-label" className="lsm-step-label">
                Step {step} of 3 · {stepLabel}
              </p>
            </div>
          </div>
          {step !== 3 && (
            <button className="lsm-close-btn" onClick={onClose} aria-label="Close modal">
              <MdClose size={20} />
            </button>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="lsm-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
          {[1, 2, 3].map(n => (
            <div key={n} className={`lsm-progress-seg ${n <= step ? 'filled' : ''}`} />
          ))}
        </div>

        {/* ── Map preview (always visible) ── */}
        <MapPreviewSection
          mode={mode}
          location={myLocation}
          permissionState={permissionState}
        />

        {/* ── Step content ── */}
        <div className="lsm-body">
          {step === 1 && (
            <StepOptions
              mode={mode} setMode={setMode}
              duration={duration} setDuration={setDuration}
              contacts={MOCK_CONTACTS}
              selectedContacts={selectedContacts}
              toggleContact={toggleContact}
              onNext={() => setStep(2)}
              onCancel={onClose}
            />
          )}
          {step === 2 && (
            <StepConfirm
              mode={mode} duration={duration}
              selectedContacts={selectedContacts}
              contacts={MOCK_CONTACTS}
              onBack={() => setStep(1)}
              onConfirm={handleConfirm}
              sharing={sharing}
            />
          )}
          {step === 3 && (
            <StepSuccess
              mode={mode} duration={duration}
              selectedContacts={selectedContacts}
              contacts={MOCK_CONTACTS}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
