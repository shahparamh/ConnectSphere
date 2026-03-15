import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api'
import {
  MdArrowBack, MdMoreVert, MdSend, MdAttachFile,
  MdEmojiEmotions, MdLocationOn, MdMic, MdStopCircle,
  MdCall, MdVideocam, MdMap, MdClose, MdPlayArrow,
  MdPause, MdDoneAll, MdDone, MdSchedule, MdInfo,
  MdImage, MdInsertDriveFile, MdKeyboardVoice, MdDelete,
  MdSearch, MdNotificationsOff, MdHistory, MdBlock, MdVisibility
} from 'react-icons/md'
import { ChatContext, MOCK_ROOMS, MOCK_MESSAGES } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import { LocationContext } from '../context/LocationContext'
import Avatar from '../components/Avatar'
import LocationShareModal from '../components/LocationShareModal'
import ContactProfileModal from '../components/ContactProfileModal'
import './ChatPage.css'

/* ──────────────────────────────────────
   Helpers
────────────────────────────────────── */
const fmtTime = (ts) => ts
  ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : ''

const fmtDuration = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const calcDistanceKm = (from, to) => {
  if (!from || !to) return null
  const R = 6371
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ──────────────────────────────────────
   Read Receipt Icon
────────────────────────────────────── */
function ReceiptIcon({ status }) {
  if (!status) return null
  if (status === 'read')      return <MdDoneAll size={14} className="receipt read"     aria-label="Read" />
  if (status === 'delivered') return <MdDoneAll size={14} className="receipt delivered" aria-label="Delivered" />
  if (status === 'sent')      return <MdDone    size={14} className="receipt sent"      aria-label="Sent" />
  return <MdSchedule size={14} className="receipt pending" aria-label="Pending" />
}

/* ──────────────────────────────────────
   Voice Message Waveform
────────────────────────────────────── */
function VoiceWaveform({ bars = 28, playing, progress = 0 }) {
  // Deterministic fake waveform heights
  const heights = useMemo(() =>
    Array.from({ length: bars }, (_, i) => {
      const x = i / bars
      return 25 + 50 * Math.abs(Math.sin(x * 9.4 + 1.2)) * Math.abs(Math.cos(x * 3.7 + 0.4))
    }),
  [bars])

  return (
    <div className="voice-waveform" aria-hidden="true">
      {heights.map((h, i) => {
        const filled = progress > 0 && i / bars < progress
        return (
          <div
            key={i}
            className={`waveform-bar ${filled ? 'filled' : ''} ${playing && filled ? 'playing' : ''}`}
            style={{ height: `${h}%`, animationDelay: `${i * 30}ms` }}
          />
        )
      })}
    </div>
  )
}

/* ──────────────────────────────────────
   Message Bubble
────────────────────────────────────── */
function MessageBubble({ message, showAvatar, room, isAI }) {
  const { isSent, text, type, status, timestamp, duration } = message
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [voiceProgress, setVoiceProgress] = useState(0)
  const voiceTimerRef = useRef(null)

  const toggleVoice = () => {
    if (voicePlaying) {
      clearInterval(voiceTimerRef.current)
      setVoicePlaying(false)
    } else {
      const totalSecs = duration || 12
      const steps = totalSecs * 10
      let step = 0
      setVoicePlaying(true)
      setVoiceProgress(0)
      voiceTimerRef.current = setInterval(() => {
        step++
        setVoiceProgress(step / steps)
        if (step >= steps) {
          clearInterval(voiceTimerRef.current)
          setVoicePlaying(false)
          setVoiceProgress(0)
        }
      }, 100)
    }
  }

  useEffect(() => () => clearInterval(voiceTimerRef.current), [])

  return (
    <div className={`bubble-row ${isSent ? 'sent-row' : 'recv-row'}`}
         aria-label={`${isSent ? 'You' : room?.name}: ${text || (type === 'voice' ? 'Voice message' : type)}`}>
      {/* Avatar for received messages */}
      {!isSent && showAvatar && (
        <div className="bubble-avatar">
          <Avatar
            initials={room?.initials || 'U'}
            size={28}
            color={room?.color}
          />
        </div>
      )}
      {!isSent && !showAvatar && <div className="bubble-avatar-spacer" />}

      <div className={`bubble-outer ${isSent ? 'sent' : 'received'}`}>
        {/* ── Text message ── */}
        {(type === 'text' || !type) && (
          <div className={`bubble ${isSent ? 'bubble-sent' : 'bubble-recv'} ${!isSent && isAI ? 'bubble-ai' : ''}`}>
            <p className="bubble-text">{text}</p>
            <div className="bubble-meta">
              <span className="bubble-time">{fmtTime(timestamp)}</span>
              {isSent && <ReceiptIcon status={status} />}
            </div>
          </div>
        )}

        {/* ── Voice message ── */}
        {type === 'voice' && (
          <div className={`bubble bubble-voice ${isSent ? 'bubble-sent' : 'bubble-recv'}`}>
            <button
              className={`voice-play-btn ${voicePlaying ? 'playing' : ''}`}
              onClick={toggleVoice}
              aria-label={voicePlaying ? 'Pause voice message' : 'Play voice message'}
            >
              {voicePlaying ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
            </button>
            <div className="voice-middle">
              <VoiceWaveform playing={voicePlaying} progress={voiceProgress} />
              <span className="voice-duration">
                {voicePlaying
                  ? fmtDuration(Math.floor(voiceProgress * (duration || 12)))
                  : fmtDuration(duration || 12)}
              </span>
            </div>
            <div className="bubble-meta voice-meta">
              <span className="bubble-time">{fmtTime(timestamp)}</span>
              {isSent && <ReceiptIcon status={status} />}
            </div>
          </div>
        )}

        {/* ── Location message ── */}
        {type === 'location' && (
          <div className={`bubble bubble-location ${isSent ? 'bubble-sent' : 'bubble-recv'}`}>
            <div className="loc-map-thumb">
              {/* Realistic Map Mockup */}
              <div className="loc-map-canvas" aria-hidden>
                {/* Green Areas (Parks) */}
                <div className="loc-area park-1" />
                <div className="loc-area park-2" />
                
                {/* Major Roads */}
                <div className="loc-way road-main-h" />
                <div className="loc-way road-main-v" />
                
                {/* Building Footprints */}
                <div className="loc-building b-1" />
                <div className="loc-building b-2" />
                <div className="loc-building b-3" />
                <div className="loc-building b-4" />
                
                {/* Labels */}
                <span className="loc-map-label street">Church St</span>
                <span className="loc-map-label landmark">Safe Cafe</span>
                
                {/* User Pin */}
                <div className="loc-pin-modern">
                  <div className="pin-pulse" />
                  <div className="pin-core">
                    <MdLocationOn size={16} />
                  </div>
                </div>
              </div>
            </div>
            <div className="loc-info">
              <p className="loc-label">
                <MdLocationOn size={14} /> {text || 'Live Location'}
              </p>
              <p className="loc-sublabel">Tap to open in map</p>
            </div>
            <div className="bubble-meta">
              <span className="bubble-time">{fmtTime(timestamp)}</span>
              {isSent && <ReceiptIcon status={status} />}
            </div>
          </div>
        )}

        {/* ── Image / file message ── */}
        {type === 'image' && (
          <div className={`bubble bubble-image ${isSent ? 'bubble-sent' : 'bubble-recv'}`}>
            <div className="image-placeholder">
              <MdImage size={32} opacity={0.4} />
              <span>Photo</span>
            </div>
            <div className="bubble-meta">
              <span className="bubble-time">{fmtTime(timestamp)}</span>
              {isSent && <ReceiptIcon status={status} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Chat Header
────────────────────────────────────── */
function ChatHeader({ room, onBack, onToggleMap, mapVisible, typing, onOpenProfile, onVoiceCall, onVideoCall, onMenuAction }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const statusText = typing
    ? 'typing…'
    : room?.isOnline
    ? 'Online'
    : 'Last seen recently'

  return (
    <header className="ch-header" role="banner">
      <button className="ch-back" onClick={onBack} aria-label="Back to chats">
        <MdArrowBack size={22} />
      </button>

      {/* Contact info */}
      <button className="ch-info" aria-label={`View profile of ${room?.name}`} onClick={onOpenProfile}>
        <Avatar
          initials={room?.initials || '??'}
          size={40}
          isOnline={room?.isOnline}
          color={room?.color}
        />
        <div className="ch-text">
          <h2 className="ch-name">{room?.name || 'Chat'}</h2>
          <p className={`ch-status ${typing ? 'typing' : room?.isOnline ? 'online' : ''}`}>
            {typing && <span className="ch-typing-dots">
              <span /><span /><span />
            </span>}
            {statusText}
          </p>
        </div>
      </button>

      {/* Actions */}
      <div className="ch-actions">
        <button className="ch-action-btn" aria-label="Voice call" onClick={onVoiceCall}>
          <MdCall size={20} />
        </button>
        <button className="ch-action-btn" aria-label="Video call" onClick={onVideoCall}>
          <MdVideocam size={20} />
        </button>
        <button
          className={`ch-action-btn ${mapVisible ? 'active' : ''}`}
          onClick={onToggleMap}
          aria-label={mapVisible ? 'Hide map' : 'Show map'}
          aria-pressed={mapVisible}
        >
          <MdMap size={20} />
        </button>
        <div className="ch-menu-wrap" ref={menuRef}>
          <button className="ch-action-btn" aria-label="More options" onClick={() => setMenuOpen(o => !o)}>
            <MdMoreVert size={20} />
          </button>
          {menuOpen && (
            <div className="ch-dropdown" role="menu">
              {[
                { label: 'View Contact', icon: MdVisibility },
                { label: 'Search in Chat', icon: MdSearch },
                { label: 'Mute Notifications', icon: MdNotificationsOff },
                { label: 'Clear Chat', icon: MdHistory },
                { label: 'Report', icon: MdBlock },
              ].map(item => (
                <button key={item.label} role="menuitem" className="ch-menu-item" onClick={() => { onMenuAction(item.label); setMenuOpen(false) }}>
                  <item.icon className="ch-menu-icon" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/* ──────────────────────────────────────
   Message List
────────────────────────────────────── */
function MessageList({ messages, room, typingActive }) {
  const bottomRef = useRef(null)
  const listRef   = useRef(null)

  // Group messages by date
  const grouped = useMemo(() => {
    const groups = {}
    messages.forEach(m => {
      const label = new Date(m.timestamp).toLocaleDateString(undefined,
        { weekday: 'long', month: 'long', day: 'numeric' })
      if (!groups[label]) groups[label] = []
      groups[label].push(m)
    })
    return groups
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingActive])

  return (
    <div className="ml-container" ref={listRef} aria-label="Messages" aria-live="polite">
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="ml-empty" role="status">
          <div className="ml-empty-icon">👋</div>
          <p>No messages yet</p>
          <p className="ml-empty-sub">Say hello to {room?.name}!</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date} className="ml-date-group">
          <div className="ml-date-sep" role="separator">
            <span>{date}</span>
          </div>
          {msgs.map((m, i) => {
            const prev = msgs[i - 1]
            const showAvatar = !m.isSent && (!prev || prev.isSent)
            return (
              <MessageBubble key={m._id} message={m} showAvatar={showAvatar} room={room} isAI={room.isAI} />
            )
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingActive && (
        <div className="bubble-row recv-row typing-row" role="status" aria-label={`${room?.name} is typing`}>
          <div className="bubble-avatar">
            <Avatar initials={room?.initials || 'U'} size={28} color={room?.color} />
          </div>
          <div className="bubble bubble-recv typing-bubble">
            <span className="td" /><span className="td" /><span className="td" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

/* ──────────────────────────────────────
   Chat Input
────────────────────────────────────── */
function ChatInput({ roomId, onSend, onLocationShare }) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [recDuration, setRecDuration] = useState(0)
  const [showAttach, setShowAttach] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const inputRef    = useRef(null)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const recTimerRef = useRef(null)
  const holdTimerRef = useRef(null)

  const hasText = text.trim().length > 0

  const handleSend = useCallback(() => {
    if (!hasText) return
    onSend(text.trim(), 'text')
    setText('')
    inputRef.current?.focus()
  }, [text, hasText, onSend])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Voice recording (simulated)
  const startRecord = () => {
    if (recording) return
    setRecording(true)
    setRecDuration(0)
    recTimerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000)
  }

  const stopRecord = useCallback((send = true) => {
    if (!recording) return
    clearInterval(recTimerRef.current)
    const dur = recDuration
    setRecording(false)
    setRecDuration(0)
    if (send && dur >= 1) {
      onSend(`Voice message (${fmtDuration(dur)})`, 'voice', { duration: dur })
    }
  }, [recording, recDuration, onSend])

  const cancelRecord = useCallback(() => stopRecord(false), [stopRecord])

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // In a real app, we'd upload to a server. 
    // For this demo, we'll simulate sending the file.
    onSend(file.name, type === 'image' ? 'image' : 'file', { fileName: file.name, fileSize: (file.size / 1024).toFixed(1) + ' KB' })
    setShowAttach(false)
    e.target.value = '' // Reset for next selection
  }

  useEffect(() => () => {
    clearInterval(recTimerRef.current)
    clearTimeout(holdTimerRef.current)
  }, [])

  const ATTACH_OPTIONS = [
    { icon: MdImage,          label: 'Photo / Video' },
    { icon: MdInsertDriveFile, label: 'Document' },
    { icon: MdLocationOn,     label: 'Location',  action: onLocationShare },
    { icon: MdKeyboardVoice,  label: 'Audio' },
  ]

  return (
    <div className="ci-bar">
      {/* Recording overlay */}
      {recording && (
        <div className="ci-recording" role="status" aria-live="assertive">
          <button className="ci-rec-cancel" onClick={cancelRecord} aria-label="Cancel recording">
            <MdDelete size={20} />
          </button>
          <div className="ci-rec-center">
            <span className="ci-rec-dot" aria-hidden />
            <VoiceWaveform playing bars={20} progress={0.5} />
          </div>
          <span className="ci-rec-timer">{fmtDuration(recDuration)}</span>
        </div>
      )}

      {/* Attach Popover */}
      {showAttach && !recording && (
        <div className="ci-attach-popover" role="menu">
          <button className="ci-attach-item" onClick={() => imageInputRef.current?.click()}>
            <div className="ci-attach-icon img"><MdImage size={22} /></div>
            <span>Gallery</span>
          </button>
          <button className="ci-attach-item" onClick={() => fileInputRef.current?.click()}>
            <div className="ci-attach-icon file"><MdInsertDriveFile size={22} /></div>
            <span>File</span>
          </button>
          <button className="ci-attach-item" onClick={onLocationShare}>
            <div className="ci-attach-icon loc"><MdLocationOn size={22} /></div>
            <span>Location</span>
          </button>
          <button className="ci-attach-item" onClick={() => { onSend('Voice recording started', 'text'); setShowAttach(false); }}>
            <div className="ci-attach-icon mic"><MdKeyboardVoice size={22} /></div>
            <span>Audio</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        style={{ display: 'none' }} 
        accept="image/*,video/*"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => handleFileSelect(e, 'file')}
      />

      {!recording && (
        <div className="ci-row">
          {/* Left buttons */}
          <button
            className={`ci-btn ${showAttach ? 'active' : ''}`}
            onClick={() => setShowAttach(s => !s)}
            aria-label="Attachments"
            aria-pressed={showAttach}
          >
            {showAttach ? <MdClose size={22} /> : <MdAttachFile size={22} />}
          </button>

          <div className="ci-emoji-wrap">
            {showEmoji && (
              <div className="ci-emoji-popover">
                {['😊', '😂', '🔥', '❤️', '✨', '🙏', '💯', '👍', '🙌', '🎉', '😎', '💡', '📍', '🏠', '🆘', '🛡️', '✅', '❌', '🍕', '☕', '🏃'].map(e => (
                  <button key={e} className="ci-emoji-item" onClick={() => { setText(t => t + e); setShowEmoji(false) }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
            <button 
              className={`ci-btn ${showEmoji ? 'active' : ''}`} 
              aria-label="Emoji" 
              onClick={() => setShowEmoji(s => !s)}
            >
              <MdEmojiEmotions size={22} />
            </button>
          </div>

          {/* Text input */}
          <div className="ci-input-wrap">
            <textarea
              ref={inputRef}
              className="ci-input"
              placeholder="Type a message…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              aria-label="Message input"
              aria-multiline="true"
            />
          </div>

          {/* Right button: send or mic */}
          {hasText ? (
            <button className="ci-send-btn" onClick={handleSend} aria-label="Send message">
              <MdSend size={20} />
            </button>
          ) : (
            <button
              className="ci-mic-btn"
              onMouseDown={startRecord}
              onMouseUp={() => stopRecord(true)}
              onTouchStart={startRecord}
              onTouchEnd={() => stopRecord(true)}
              aria-label="Hold to record voice message"
            >
              <MdMic size={20} />
            </button>
          )}
        </div>
      )}

      {/* Stop recording button */}
      {recording && (
        <button
          className="ci-stop-btn"
          onClick={() => stopRecord(true)}
          aria-label="Stop recording and send"
        >
          <MdStopCircle size={32} />
          <span>Release to send</span>
        </button>
      )}
    </div>
  )
}

const GOOGLE_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#243248' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#284c86' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#172033' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b2640' }] },
]

/* ──────────────────────────────────────
   Map Utils (Projection)
────────────────────────────────────── */
const OSM_TILE_SIZE = 256
const OSM_CANVAS_SIZE = OSM_TILE_SIZE * 7 // Fixed 7x7 tile preview

const latLngToWorld = ({ lat, lng }, zoom) => {
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const scale = OSM_TILE_SIZE * 2 ** zoom
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  }
}

const projectToViewport = (point, center, zoom) => {
  const worldPoint = latLngToWorld(point, zoom)
  const worldCenter = latLngToWorld(center, zoom)
  return {
    x: 50 + ((worldPoint.x - worldCenter.x) / OSM_CANVAS_SIZE) * 100,
    y: 50 + ((worldPoint.y - worldCenter.y) / OSM_CANVAS_SIZE) * 100,
  }
}

/* ──────────────────────────────────────
   Map Preview Card (right panel)
────────────────────────────────────── */
function MapPreviewCard({ room }) {
  const { myLocation, contactLocations } = useContext(LocationContext)
  const contactLoc = contactLocations[room?.contactId]
  const [zoomLevel, setZoomLevel] = useState(15)
  const [showLocModal, setLocModal] = useState(false)
  
  const center = myLocation || { lat: 12.9716, lng: 77.5946 }
  const target = contactLoc || { lat: center.lat + 0.0034, lng: center.lng + 0.0042, accuracy: 15 }

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
  const { isLoaded } = useJsApiLoader({
    id: 'sidebar-map-preview',
    googleMapsApiKey: googleApiKey
  })

  // OSM Fallback logic
  const myPos = projectToViewport(center, center, zoomLevel)
  const contactPos = projectToViewport(target, center, zoomLevel)
  const safeCafePos = projectToViewport({ lat: center.lat + 0.0042, lng: center.lng - 0.0055 }, center, zoomLevel)
  const metroHubPos = projectToViewport({ lat: center.lat - 0.0028, lng: center.lng + 0.0068 }, center, zoomLevel)

  const centerWorld = latLngToWorld(center, zoomLevel)
  const originX = centerWorld.x - OSM_CANVAS_SIZE / 2
  const originY = centerWorld.y - OSM_CANVAS_SIZE / 2
  const tiles = []
  if (!googleApiKey || !isLoaded) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const tileX = Math.floor(centerWorld.x / OSM_TILE_SIZE) + dx
        const tileY = Math.floor(centerWorld.y / OSM_TILE_SIZE) + dy
        const left = ((tileX * OSM_TILE_SIZE - originX) / OSM_CANVAS_SIZE) * 100
        const top = ((tileY * OSM_TILE_SIZE - originY) / OSM_CANVAS_SIZE) * 100
        tiles.push({ key: `${tileX}-${tileY}`, src: `https://tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`, left, top })
      }
    }
  }

  const distanceKm = calcDistanceKm(center, target)

  return (
    <aside className="map-panel" aria-label="Map panel">
      <div className="mp-header">
        <MdLocationOn size={18} color="var(--accent)" />
        <h3>Live Location</h3>
        {contactLoc && <span className="mp-live-badge">Live</span>}
      </div>

      <div className="mp-map">
        {googleApiKey && isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: center.lat, lng: center.lng }}
            zoom={15}
            options={{
              disableDefaultUI: true,
              clickableIcons: false,
              styles: GOOGLE_DARK_STYLE,
              gestureHandling: 'cooperative'
            }}
          >
            <MarkerF position={{ lat: center.lat, lng: center.lng }} title="You" />
          </GoogleMap>
        ) : (
          <>
            <div className="mp-osm-stage">
              {tiles.map(tile => (
                <img key={tile.key} className="mp-osm-tile" src={tile.src} alt="" style={{ left: `${tile.left}%`, top: `${tile.top}%` }} />
              ))}
              <div className="mp-osm-scrim" />
            </div>

            <div className="mp-map-overlay" aria-hidden>
            <div className="mp-marker mp-marker-me" style={{ top: `${myPos.y}%`, left: `${myPos.x}%` }}>
              <div className="mp-me-dot" aria-label="Your location" />
            </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mp-actions">
        <button
          className="btn-primary mp-share-btn"
          onClick={() => setLocModal(true)}
          aria-label="Share my location"
        >
          <MdLocationOn size={16} />
          Share Location
        </button>
        {contactLoc && (
          <div className="mp-accuracy">
            <MdInfo size={13} />
            ±{contactLoc.accuracy || 15}m accuracy
          </div>
        )}
      </div>

      {/* Stats below map */}
      <div className="mp-stats">
        <div className="mp-stat">
          <p className="mp-stat-label">Distance</p>
          <p className="mp-stat-value">{contactLoc && distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}</p>
        </div>
        <div className="mp-stat-divider" />
        <div className="mp-stat">
          <p className="mp-stat-label">ETA</p>
          <p className="mp-stat-value">{contactLoc ? '~4 min' : '—'}</p>
        </div>
        <div className="mp-stat-divider" />
        <div className="mp-stat">
          <p className="mp-stat-label">Status</p>
          <p className="mp-stat-value" style={{ color: room?.isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
            {room?.isOnline ? 'Online' : 'Away'}
          </p>
        </div>
      </div>

      {showLocModal && <LocationShareModal onClose={() => setLocModal(false)} />}
    </aside>
  )
}

/* ──────────────────────────────────────
   ChatPage — Root Export
────────────────────────────────────── */
export default function ChatPage({ inlineRoomId }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const roomId = inlineRoomId || id

  const { messages, sendMessage, setActiveRoom, typing } = useContext(ChatContext)
  const { user } = useContext(AuthContext)

  const room = MOCK_ROOMS.find(r => r._id === roomId) || MOCK_ROOMS[0]
  const roomMsgs = messages[room._id] || MOCK_MESSAGES[room._id] || []
  const isTyping = typing?.[room._id]

  const [mapVisible, setMapVisible] = useState(window.innerWidth >= 1200)
  const [showLocModal, setLocModal] = useState(false)
  const [showContactProfile, setShowContactProfile] = useState(false)

  useEffect(() => {
    setActiveRoom(room._id)
  }, [room._id, setActiveRoom])

  const handleSend = useCallback((text, type = 'text', extra = {}) => {
    sendMessage(room._id, text, type, extra)
  }, [room._id, sendMessage])

  const handleMenuAction = useCallback((item) => {
    if (item === 'View Contact') setShowContactProfile(true)
    if (item === 'Search in Chat') document.querySelector('.ci-input')?.focus()
    if (item === 'Mute Notifications') navigate('/profile')
    if (item === 'Clear Chat') window.alert('Clear chat can be connected to backend persistence next. For now, messages stay visible in demo mode.')
    if (item === 'Report') navigate('/help')
  }, [navigate])

  return (
    <div className="chat-page-root">
      {/* Main chat area */}
      <div className="chat-main">
        <ChatHeader
          room={room}
          onBack={() => navigate('/dashboard')}
          onToggleMap={() => setMapVisible(v => !v)}
          mapVisible={mapVisible}
          typing={isTyping}
          onOpenProfile={() => navigate('/profile')}
          onVoiceCall={() => { window.location.href = 'tel:+919876543210' }}
          onVideoCall={() => window.open('https://meet.google.com', '_blank', 'noreferrer')}
          onMenuAction={handleMenuAction}
        />

        <MessageList
          messages={roomMsgs}
          room={room}
          typingActive={isTyping}
        />

        <ChatInput
          roomId={room._id}
          onSend={handleSend}
          onLocationShare={() => setLocModal(true)}
        />
      </div>

      {/* Right: map panel (desktop only, toggleable) */}
      {mapVisible && (
        <MapPreviewCard room={room} />
      )}

      {showLocModal && <LocationShareModal onClose={() => setLocModal(false)} />}
      
      {showContactProfile && (
        <ContactProfileModal 
          contact={room} 
          onClose={() => setShowContactProfile(false)} 
        />
      )}
    </div>
  )
}
