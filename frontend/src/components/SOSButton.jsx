import { useState, useRef, useCallback } from 'react'
import { useLocation } from '../context/LocationContext'
import './SOSButton.css'

const PRESS_DURATION = 2000 // 2s hold to activate

export default function SOSButton({ inSidebar = false, isExpanded = false }) {
  const { triggerSOS } = useLocation()
  const [pressing, setPressing]   = useState(false)
  const [progress, setProgress]   = useState(0)
  const [activated, setActivated] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const intervalRef = useRef(null)
  const startRef    = useRef(null)

  const startPress = useCallback(() => {
    setPressing(true)
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / PRESS_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(intervalRef.current)
        setPressing(false)
        setProgress(0)
        setShowConfirm(true)
      }
    }, 30)
  }, [])

  const cancelPress = useCallback(() => {
    clearInterval(intervalRef.current)
    setPressing(false)
    setProgress(0)
  }, [])

  const confirmSOS = async () => {
    setShowConfirm(false)
    setActivated(true)
    await triggerSOS([])
    setTimeout(() => setActivated(false), 5000)
  }

  const cancelSOS = () => {
    setShowConfirm(false)
    setActivated(false)
    setProgress(0)
  }

  if (inSidebar) {
    return (
      <div className={`sos-sidebar-item ${pressing ? 'pressing' : ''} ${activated ? 'activated' : ''}`}>
        <button
          className="sos-sidebar-btn"
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          aria-label="Emergency SOS - Hold to activate"
        >
          <div className="sos-sidebar-icon">
            <svg className="sos-ring-small" viewBox="0 0 40 40">
              <circle className="sos-ring-bg" cx="20" cy="20" r="18" />
              <circle
                className="sos-ring-progress"
                cx="20" cy="20" r="18"
                style={{
                  strokeDasharray: '113px',
                  strokeDashoffset: `${113 - (113 * progress) / 100}px`,
                }}
              />
            </svg>
            <span className="sos-sidebar-emoji">{activated ? '🆘' : '🆘'}</span>
          </div>
          {isExpanded && (
            <div className="sos-sidebar-text">
              <span className="sos-sidebar-label">Emergency SOS</span>
              <span className="sos-sidebar-hint">{pressing ? 'HOLDING...' : 'HOLD 2S'}</span>
            </div>
          )}
        </button>

        {showConfirm && (
          <div className="sos-sidebar-confirm-overlay">
            <div className="sos-sidebar-confirm-popover">
              <p>Trigger SOS?</p>
              <div className="sos-sidebar-confirm-btns">
                <button className="confirm-no" onClick={cancelSOS}>No</button>
                <button className="confirm-yes" onClick={confirmSOS}>Yes</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="sos-wrapper" role="complementary" aria-label="Emergency SOS">
        <div className="sos-hint">{pressing ? 'Hold…' : 'Hold for SOS'}</div>
        <button
          className={`sos-btn ${pressing ? 'pressing' : ''} ${activated ? 'activated' : ''}`}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          aria-label="Emergency SOS - Hold to activate"
          aria-pressed={activated}
        >
          <svg className="sos-ring" viewBox="0 0 60 60" aria-hidden>
            <circle className="sos-ring-bg" cx="30" cy="30" r="26" />
            <circle
              className="sos-ring-progress"
              cx="30" cy="30" r="26"
              style={{
                strokeDashoffset: `${163.36 - (163.36 * progress) / 100}px`,
              }}
            />
          </svg>
          <span className="sos-label">{activated ? '🆘' : 'SOS'}</span>
        </button>
      </div>

      {showConfirm && (
        <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="sos-confirm-title">
          <div className="modal sos-confirm-modal">
            <div className="sos-confirm-icon">🆘</div>
            <h3 id="sos-confirm-title">Send SOS Alert?</h3>
            <p>Your location will be shared with your emergency contacts immediately.</p>
            <div className="sos-confirm-actions">
              <button className="btn-secondary" onClick={cancelSOS}>Cancel</button>
              <button className="sos-confirm-btn" onClick={confirmSOS}>Send SOS!</button>
            </div>
          </div>
        </div>
      )}

      {activated && (
        <div className="sos-alert-banner" role="alert" aria-live="assertive">
          <span>🆘 SOS Alert Sent! Emergency contacts notified.</span>
          <button onClick={() => setActivated(false)} aria-label="Dismiss">×</button>
        </div>
      )}
    </>
  )
}
