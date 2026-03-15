import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdArrowBack, MdArrowUpward, MdArrowForward, MdArrowDownward,
  MdTurnLeft, MdTurnRight, MdMic, MdMicOff, MdClose,
  MdChat, MdSend, MdNavigation, MdTimer, MdSpeed,
  MdLocalGasStation, MdTraffic, MdSearch, MdStar,
  MdPlace, MdExpandLess, MdExpandMore, MdVolumeUp,
  MdVolumeOff, MdMyLocation, MdDirections, MdWarning,
  MdCheckCircle, MdHistory, MdKeyboardArrowRight
} from 'react-icons/md'
import { LocationContext } from '../context/LocationContext'
import { ChatContext, MOCK_ROOMS } from '../context/ChatContext'
import Avatar from '../components/Avatar'
import './NavigationPage.css'

/* ──────────────────────────────────────
   Static mock data
────────────────────────────────────── */
const RECENT_DESTINATIONS = [
  { id: 'd1', name: 'Cubbon Park',       address: 'Kasturba Rd, Bengaluru',  dist: '2.3 km', icon: '🌳', eta: '7 min'  },
  { id: 'd2', name: 'Orion Mall',        address: 'Malleswaram, Bengaluru',  dist: '5.1 km', icon: '🛍️', eta: '14 min' },
  { id: 'd3', name: 'MG Road Metro',     address: 'Metro Station, Bengaluru', dist: '1.2 km', icon: '🚇', eta: '4 min'  },
  { id: 'd4', name: 'Sarah\'s Home',     address: '14 Church St, Bengaluru', dist: '3.8 km', icon: '👤', eta: '11 min' },
]

const SAVED_PLACES = [
  { id: 'sp1', name: 'Home',   address: 'Koramangala, Bengaluru', icon: '🏠', eta: '9 min'  },
  { id: 'sp2', name: 'Office', address: 'Whitefield, Bengaluru',  icon: '🏢', eta: '28 min' },
]

// Simulated turn-by-turn instructions
const ROUTE_STEPS = [
  { id: 's1', dir: 'straight', icon: MdArrowUpward,  text: 'Head north on MG Road',          dist: '200 m',  dur: '1 min'  },
  { id: 's2', dir: 'right',    icon: MdTurnRight,    text: 'Turn right onto Residency Rd',    dist: '450 m',  dur: '2 min'  },
  { id: 's3', dir: 'left',     icon: MdTurnLeft,     text: 'Turn left onto Brigade Rd',       dist: '1.2 km', dur: '4 min'  },
  { id: 's4', dir: 'straight', icon: MdArrowUpward,  text: 'Continue onto Church St',         dist: '300 m',  dur: '1 min'  },
  { id: 's5', dir: 'arrive',   icon: MdCheckCircle,  text: 'Arrive at destination on right', dist: '—',      dur: '—'      },
]

// Simulated traffic data
const TRAFFIC_ZONES = [
  { top: '38%', left: '20%', severity: 'high',   label: 'Heavy traffic · +8 min' },
  { top: '55%', left: '60%', severity: 'medium', label: 'Moderate · +3 min'  },
  { top: '25%', left: '45%', severity: 'low',    label: 'Moving well'         },
]

const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/* ──────────────────────────────────────
   Voice Input Button
────────────────────────────────────── */
function VoiceInputButton({ onResult }) {
  const [listening, setListening] = useState(false)
  const [supported]               = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recogRef = useRef(null)

  const toggleListen = useCallback(() => {
    if (!supported) { onResult?.('Navigate to Cubbon Park'); return } // demo fallback
    if (listening) {
      recogRef.current?.stop()
      setListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'en-IN'
    r.continuous = false
    r.interimResults = false
    r.onresult = (e) => onResult?.(e.results[0][0].transcript)
    r.onend   = () => setListening(false)
    r.onerror = () => setListening(false)
    recogRef.current = r
    r.start()
    setListening(true)
  }, [listening, supported, onResult])

  return (
    <button
      className={`vib-btn ${listening ? 'listening' : ''}`}
      onClick={toggleListen}
      aria-label={listening ? 'Stop voice input' : 'Start voice navigation input'}
      aria-pressed={listening}
    >
      {listening
        ? <div className="vib-bars" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="vib-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        : <MdMic size={22} />
      }
    </button>
  )
}

/* ──────────────────────────────────────
   Navigation Map (CSS canvas)
────────────────────────────────────── */
function NavigationMap({ navState, activeStep }) {
  const isNavigating = navState === 'navigating'

  return (
    <div className="nm-root" aria-label="Navigation map">
      {/* Map bg */}
      <div className="nm-grid" aria-hidden />

      {/* Water */}
      <div className="nm-water" aria-hidden />
      {/* Park */}
      <div className="nm-park" aria-hidden />

      {/* Roads */}
      <div className="nm-roads" aria-hidden>
        <div className="nm-road nm-rh1" />
        <div className="nm-road nm-rh2" />
        <div className="nm-road nm-rh3" />
        <div className="nm-road nm-rv1" />
        <div className="nm-road nm-rv2" />
        <div className="nm-road nm-rv3" />
        <div className="nm-road nm-rd1" />
      </div>

      {/* Traffic overlays */}
      {TRAFFIC_ZONES.map((t, i) => (
        <div
          key={i}
          className={`nm-traffic nm-traffic-${t.severity}`}
          style={{ top: t.top, left: t.left }}
          aria-label={t.label}
          role="img"
          title={t.label}
        />
      ))}

      {/* Active route highlight */}
      {isNavigating && (
        <svg
          className="nm-route-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            points="42,90 42,60 55,60 55,45 40,45 40,25 60,25 60,15"
            fill="none"
            stroke="rgba(58,111,247,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
            className="nm-route-line"
          />
        </svg>
      )}

      {/* Destination pin */}
      {isNavigating && (
        <div className="nm-dest-pin" aria-label="Destination">
          <MdPlace size={28} className="nm-dest-icon" />
          <div className="nm-dest-shadow" aria-hidden />
          <div className="nm-dest-label">Cubbon Park</div>
        </div>
      )}

      {/* User position */}
      <div className="nm-user-dot" style={{ bottom: '18%', left: '41%' }} aria-label="Your location">
        <div className="nm-user-ring nm-ur-1" aria-hidden />
        <div className="nm-user-ring nm-ur-2" aria-hidden />
        <div className="nm-user-core" aria-hidden>
          <MdNavigation size={16} style={{ transform: 'rotate(-20deg)' }} />
        </div>
      </div>

      {/* Map labels */}
      <div className="nm-map-label nm-ml-1" aria-hidden>MG Road</div>
      <div className="nm-map-label nm-ml-2" aria-hidden>Brigade Rd</div>
      <div className="nm-map-label nm-ml-3" aria-hidden>Church St</div>
    </div>
  )
}

/* ──────────────────────────────────────
   Route Panel (search + route details)
────────────────────────────────────── */
function RoutePanel({
  navState, destination, setDestination,
  onStartNav, onEndNav,
  voiceMuted, setVoiceMuted,
  activeStepIdx, setActiveStepIdx,
  currentETA, distRemaining,
}) {
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState(false)

  const isIdle       = navState === 'idle'
  const isNavigating = navState === 'navigating'

  const filteredRecent = useMemo(() =>
    RECENT_DESTINATIONS.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase())
    ),
  [search])

  const handleSelectDest = (d) => {
    setDestination(d)
    setSearch('')
  }

  return (
    <div className="rp-panel">
      {/* ── Idle: search UI ── */}
      {isIdle && (
        <>
          {/* Search bar */}
          <div className="rp-search-wrap">
            <div className="rp-search-bar">
              <MdSearch size={20} className="rp-search-icon" />
              <input
                className="rp-search-input"
                placeholder="Search destination…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search destination"
              />
              {search && (
                <button className="rp-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                  <MdClose size={18} />
                </button>
              )}
              <VoiceInputButton onResult={val => setSearch(val)} />
            </div>
          </div>

          {/* Saved places */}
          {!search && (
            <div className="rp-section">
              <p className="rp-section-label">Saved Places</p>
              <div className="rp-saved-grid">
                {SAVED_PLACES.map(p => (
                  <button key={p.id} className="rp-saved-chip" onClick={() => handleSelectDest(p)} aria-label={`Navigate to ${p.name}`}>
                    <span className="rp-chip-icon">{p.icon}</span>
                    <div>
                      <p className="rp-chip-name">{p.name}</p>
                      <p className="rp-chip-eta">{p.eta}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent / search results */}
          <div className="rp-section">
            <p className="rp-section-label">
              {search ? `Results for "${search}"` : 'Recent'}
            </p>
            <div className="rp-list">
              {filteredRecent.map(d => (
                <button key={d.id} className={`rp-list-item ${destination?.id === d.id ? 'selected' : ''}`}
                  onClick={() => handleSelectDest(d)} aria-label={`${d.name}, ${d.address}`}>
                  <div className="rp-list-emoji">{d.icon}</div>
                  <div className="rp-list-info">
                    <p className="rp-list-name">{d.name}</p>
                    <p className="rp-list-addr">{d.address}</p>
                  </div>
                  <div className="rp-list-meta">
                    <p className="rp-list-dist">{d.dist}</p>
                    <p className="rp-list-eta">{d.eta}</p>
                  </div>
                  <MdKeyboardArrowRight size={18} className="rp-list-arrow" />
                </button>
              ))}
              {filteredRecent.length === 0 && (
                <p className="rp-no-results">No results found</p>
              )}
            </div>
          </div>

          {/* Start button if destination selected */}
          {destination && (
            <div className="rp-start-wrap">
              <div className="rp-dest-info">
                <MdPlace size={16} color="var(--danger)" />
                <div>
                  <p className="rp-dest-name">{destination.name}</p>
                  <p className="rp-dest-sub">{destination.dist} · {destination.eta}</p>
                </div>
              </div>
              <button className="rp-start-btn" onClick={onStartNav} aria-label={`Start navigation to ${destination.name}`}>
                <MdNavigation size={18} />
                Start
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Navigating: guidance UI ── */}
      {isNavigating && (
        <>
          {/* ETA / stats bar */}
          <div className="rp-nav-stats">
            <div className="rp-stat">
              <MdTimer size={16} color="var(--primary)" />
              <div>
                <p className="rp-stat-val">{currentETA}</p>
                <p className="rp-stat-lbl">ETA</p>
              </div>
            </div>
            <div className="rp-stat-div" />
            <div className="rp-stat">
              <MdNavigation size={16} color="var(--primary)" />
              <div>
                <p className="rp-stat-val">{distRemaining}</p>
                <p className="rp-stat-lbl">Remaining</p>
              </div>
            </div>
            <div className="rp-stat-div" />
            <div className="rp-stat">
              <MdTraffic size={16} color="var(--warning)" />
              <div>
                <p className="rp-stat-val" style={{ color: 'var(--warning)' }}>+8 min</p>
                <p className="rp-stat-lbl">Traffic</p>
              </div>
            </div>
          </div>

          {/* Next instruction */}
          <div className="rp-next-step">
            <div className="rp-step-icon">
              {(() => { const Step = ROUTE_STEPS[activeStepIdx]?.icon || MdArrowUpward; return <Step size={24} /> })()}
            </div>
            <div className="rp-step-text">
              <p className="rp-step-main">{ROUTE_STEPS[activeStepIdx]?.text}</p>
              <p className="rp-step-sub">in {ROUTE_STEPS[activeStepIdx]?.dist}</p>
            </div>
            <button
              className={`rp-voice-btn ${voiceMuted ? 'muted' : ''}`}
              onClick={() => setVoiceMuted(v => !v)}
              aria-label={voiceMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
              aria-pressed={voiceMuted}
            >
              {voiceMuted ? <MdVolumeOff size={20} /> : <MdVolumeUp size={20} />}
            </button>
          </div>

          {/* Step list toggle */}
          <button className="rp-steps-toggle" onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
            {expanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
            {expanded ? 'Hide steps' : 'All steps'} · {ROUTE_STEPS.length} turns
          </button>

          {expanded && (
            <div className="rp-steps-list animate-fadeInUp" aria-label="Route steps">
              {ROUTE_STEPS.map((s, i) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    className={`rp-step-row ${i === activeStepIdx ? 'active' : i < activeStepIdx ? 'done' : ''}`}
                    onClick={() => setActiveStepIdx(i)}
                    aria-label={`Step ${i + 1}: ${s.text}, ${s.dist}`}
                  >
                    <div className="rp-step-row-icon">
                      <Icon size={18} />
                    </div>
                    <div className="rp-step-row-info">
                      <p className="rp-step-row-text">{s.text}</p>
                      <p className="rp-step-row-meta">{s.dist} · {s.dur}</p>
                    </div>
                    {i < activeStepIdx && <MdCheckCircle size={16} className="rp-step-done-icon" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* End navigation */}
          <button className="rp-end-btn" onClick={onEndNav} aria-label="End navigation">
            <MdClose size={16} /> End Navigation
          </button>
        </>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Chat Overlay (slide-in from bottom on mobile)
────────────────────────────────────── */
function ChatOverlay({ isOpen, onClose }) {
  const { messages } = useContext(ChatContext)
  const room = MOCK_ROOMS[0]
  const roomMsgs = (messages && messages[room._id]) || []

  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, roomMsgs])

  const handleSend = () => {
    if (!text.trim()) return
    setText('')
  }

  if (!isOpen) return null

  return (
    <div className="co-overlay" role="complementary" aria-label="Chat overlay">
      <div className="co-panel animate-fadeInUp">
        {/* Header */}
        <div className="co-header">
          <Avatar initials={room.initials} size={30} isOnline={room.isOnline} color={room.color} />
          <div className="co-title">
            <p className="co-name">{room.name}</p>
            <p className="co-status">Driving mode · limited view</p>
          </div>
          <button className="co-close" onClick={onClose} aria-label="Close chat overlay">
            <MdClose size={20} />
          </button>
        </div>

        {/* Messages (compact) */}
        <div className="co-messages" aria-live="polite">
          {roomMsgs.slice(-5).map(m => (
            <div key={m._id} className={`co-msg ${m.isSent ? 'co-sent' : 'co-recv'}`}>
              <p className="co-msg-text">{m.text}</p>
              <span className="co-msg-time">{fmtTime(m.timestamp)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="co-quick-replies" aria-label="Quick replies">
          {['On my way!', 'Running late', 'Almost there 📍'].map(r => (
            <button key={r} className="co-quick-chip" onClick={() => setText(r)} aria-label={`Quick reply: ${r}`}>
              {r}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="co-input-row">
          <input
            className="co-input"
            placeholder="Message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            aria-label="Type a message"
          />
          <button className="co-send" onClick={handleSend} aria-label="Send message">
            <MdSend size={18} />
          </button>
        </div>

        {/* Safety note */}
        <div className="co-safety-note" role="note">
          <MdWarning size={12} />
          Don't text while driving
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   NavigationPage — Root Export
────────────────────────────────────── */
export default function NavigationPage() {
  const navigate = useNavigate()
  const { myLocation } = useContext(LocationContext)

  const [navState,      setNavState]     = useState('idle')     // idle | navigating
  const [destination,   setDestination]  = useState(null)
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [voiceMuted,    setVoiceMuted]   = useState(false)
  const [chatOpen,      setChatOpen]     = useState(false)
  const [elapsedSecs,   setElapsed]      = useState(0)

  const timerRef = useRef(null)

  // Advance route steps automatically (demo)
  useEffect(() => {
    if (navState !== 'navigating') return
    timerRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [navState])

  // Simulate step advancement every 12s
  useEffect(() => {
    if (navState !== 'navigating') return
    if (elapsedSecs > 0 && elapsedSecs % 12 === 0) {
      setActiveStepIdx(i => Math.min(i + 1, ROUTE_STEPS.length - 1))
    }
  }, [elapsedSecs, navState])

  const handleStartNav = useCallback(() => {
    if (!destination) return
    setNavState('navigating')
    setActiveStepIdx(0)
    setElapsed(0)
  }, [destination])

  const handleEndNav = useCallback(() => {
    clearInterval(timerRef.current)
    setNavState('idle')
    setDestination(null)
    setActiveStepIdx(0)
    setElapsed(0)
  }, [])

  // ETA counting down
  const totalSecsInit = 7 * 60 // 7 minutes
  const secsLeft = Math.max(0, totalSecsInit - elapsedSecs)
  const etaLabel = `${Math.floor(secsLeft / 60).toString().padStart(2, '0')}:${(secsLeft % 60).toString().padStart(2, '0')}`
  const distLeft = (2.3 * (secsLeft / totalSecsInit)).toFixed(1) + ' km'

  const isNavigating = navState === 'navigating'

  return (
    <div className={`nav-page-root ${isNavigating ? 'nav-mode' : ''}`}>
      {/* ── Back / top controls overlay (over map) ── */}
      <div className="nav-map-header">
        <button className="nav-back-btn" onClick={() => navigate(-1)} aria-label="Exit navigation">
          <MdArrowBack size={20} />
        </button>

        {isNavigating && (
          <div className="nav-header-center">
            <div className="nav-speed-badge" aria-label="Current speed: 42 km/h">
              <MdSpeed size={14} />
              <strong>42</strong>
              <span className="nav-speed-unit">km/h</span>
            </div>
          </div>
        )}

        {/* Chat toggle */}
        <button
          className={`nav-chat-fab ${chatOpen ? 'active' : ''} ${isNavigating ? 'chat-navigating' : ''}`}
          onClick={() => setChatOpen(o => !o)}
          aria-label={chatOpen ? 'Close chat' : 'Open chat'}
          aria-expanded={chatOpen}
        >
          {chatOpen ? <MdClose size={20} /> : <MdChat size={20} />}
          {!chatOpen && !isNavigating && (
            <span className="nav-chat-badge" aria-label="3 unread messages">3</span>
          )}
        </button>
      </div>

      {/* ── Map + Route panel split layout ── */}
      <div className="nav-body">
        {/* Map side */}
        <div className="nav-map-side">
          <NavigationMap navState={navState} activeStep={ROUTE_STEPS[activeStepIdx]} />

          {/* Mobile: next-step HUD overlay */}
          {isNavigating && (
            <div className="nav-hud-mobile" aria-label="Next turn">
              <div className="nav-hud-icon">
                {(() => { const I = ROUTE_STEPS[activeStepIdx]?.icon || MdArrowUpward; return <I size={28} /> })()}
              </div>
              <div className="nav-hud-text">
                <p className="nav-hud-dist">{ROUTE_STEPS[activeStepIdx]?.dist}</p>
                <p className="nav-hud-turn">{ROUTE_STEPS[activeStepIdx]?.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Route panel side */}
        <div className="nav-route-side">
          <RoutePanel
            navState={navState}
            destination={destination}
            setDestination={setDestination}
            onStartNav={handleStartNav}
            onEndNav={handleEndNav}
            voiceMuted={voiceMuted}
            setVoiceMuted={setVoiceMuted}
            activeStepIdx={activeStepIdx}
            setActiveStepIdx={setActiveStepIdx}
            currentETA={etaLabel}
            distRemaining={distLeft}
          />
        </div>
      </div>

      {/* Chat overlay */}
      <ChatOverlay isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
