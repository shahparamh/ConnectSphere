import { useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MdSearch, MdEdit, MdFilterList, MdGroup, MdMailOutline,
  MdMessage, MdPeople, MdLocationOn,
  MdCircle, MdDoneAll, MdDone, MdMoreHoriz, MdRefresh,
  MdAdd, MdClose, MdWifi, MdWifiOff, MdChat, MdDelete
} from 'react-icons/md'
import { ChatContext, MOCK_ROOMS } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import NotificationBadge from '../components/NotificationBadge'
import ConnectSphereLogo from '../components/ConnectSphereLogo'
import './Dashboard.css'

/* ──────────────────────────────────────
   Utility: time format
────────────────────────────────────── */
const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

/* ──────────────────────────────────────
   ChatPreviewCard
────────────────────────────────────── */
function ChatPreviewCard({ room, isActive, onClick }) {
  const { typing } = useContext(ChatContext)
  const isTyping = typing[room._id]

  const lastMsgPreview = isTyping
    ? 'typing…'
    : (typeof room.lastMessage === 'object' && room.lastMessage
        ? room.lastMessage.text || `[${room.lastMessage.type || 'Message'}]`
        : room.lastMessage) || 'No messages yet'

  const statusIcon = room.lastMessageStatus === 'read'
    ? <MdDoneAll size={13} className="tick-read" />
    : room.lastMessageStatus === 'delivered'
      ? <MdDoneAll size={13} className="tick-delivered" />
      : room.lastMessageStatus
        ? <MdDone size={13} className="tick-sent" />
        : null

  return (
    <button
      className={`chat-preview-card ${isActive ? 'active' : ''} ${room.unreadCount > 0 ? 'has-unread' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Chat with ${room.name}. ${room.unreadCount > 0 ? `${room.unreadCount} unread messages.` : ''} Last message: ${lastMsgPreview}`}
    >
      {/* Avatar with online indicator */}
      <div className="card-avatar-wrap">
        <Avatar
          initials={room.initials || (room.name ? room.name.slice(0, 2).toUpperCase() : '??')}
          size={50}
          isOnline={room.isOnline}
          color={room.color}
        />
        {room.isGroup && (
          <div className="group-badge" aria-label="Group chat">
            <MdGroup size={10} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="card-content">
        <div className="card-top-row">
          <span className="card-name">{room.name}</span>
          <span className={`card-time ${room.unreadCount > 0 ? 'unread-time' : ''}`}>
            {formatTime(room.lastMessageAt)}
          </span>
        </div>
        <div className="card-bottom-row">
          <span className={`card-preview ${isTyping ? 'typing-preview' : ''} ${room.unreadCount > 0 ? 'unread-preview' : ''}`}>
            {!isTyping && statusIcon}
            {isTyping
              ? <span className="typing-text"><span className="type-dot" /><span className="type-dot" /><span className="type-dot" /> typing…</span>
              : lastMsgPreview
            }
          </span>
          <div className="card-badges">
            {room.muted && <span className="muted-icon" aria-label="Muted">🔇</span>}
            {room.pinned && <span className="pinned-icon" aria-label="Pinned">📌</span>}
            {room.unreadCount > 0 && (
              <NotificationBadge count={room.unreadCount} />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ──────────────────────────────────────
   ChatList (left panel)
────────────────────────────────────── */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'groups', label: 'Groups' },
]

function ContactItem({ room, onSelect }) {
  return (
    <button className="contact-item-row" onClick={() => onSelect(room)}>
      <Avatar initials={room.initials || (room.name ? room.name.slice(0, 2).toUpperCase() : '??')} size={42} isOnline={room.isOnline} color={room.color} />
      <div className="contact-info">
        <p className="contact-name">{room.name}</p>
        <p className="contact-status">{room.isOnline ? 'Online' : 'Yesterday'}</p>
      </div>
      <MdChat className="contact-chat-icon" size={18} />
    </button>
  )
}

function ChatList({ activeId, onSelect, onNewContact, onDeleteChat, onOpenProfile, onRetry }) {
  const { rooms, connected } = useContext(ChatContext)
  const { user } = useContext(AuthContext)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [showSearch, setShowSearch] = useState(false)

  const totalUnread = rooms.reduce((n, r) => n + (r.unreadCount || 0), 0)

  const filtered = useMemo(() => {
    let list = rooms
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => {
        const msgText = typeof r.lastMessage === 'object' && r.lastMessage ? r.lastMessage.text : r.lastMessage
        return r.name.toLowerCase().includes(q) || (msgText && String(msgText).toLowerCase().includes(q))
      })
    }
    if (filter === 'unread') list = list.filter(r => r.unreadCount > 0)
    if (filter === 'groups') list = list.filter(r => r.isGroup)
    if (filter === 'contacts') list = list.filter(r => !r.isGroup)
    return list
  }, [rooms, query, filter])

  return (
    <aside className="chat-list-panel" aria-label="Chat list">
      {/* Panel header */}
      <div className="cl-header">
        <div className="cl-header-top">
          <div className="cl-brand">
            <div className="cl-logo"><ConnectSphereLogo size={36} /></div>
            <h2 className="cl-title">Messages</h2>
            {totalUnread > 0 && (
              <span className="cl-total-badge" aria-label={`${totalUnread} unread`}>{totalUnread}</span>
            )}
          </div>
          <div className="cl-header-actions">
            <button
              className="cl-icon-btn"
              onClick={() => setShowSearch(s => !s)}
              aria-label="Search chats"
              aria-pressed={showSearch}
            >
              {showSearch ? <MdClose size={20} /> : <MdSearch size={20} />}
            </button>
            <button 
              className={`cl-icon-btn ${activeId === 'rai' ? 'disabled' : ''}`} 
              aria-label="Delete chat" 
              onClick={() => activeId !== 'rai' && onDeleteChat(activeId)}
              disabled={activeId === 'rai'}
            >
              <MdDelete size={20} style={{ color: activeId === 'rai' ? 'var(--text-muted)' : 'var(--error)' }} />
            </button>
            <button className="cl-icon-btn" aria-label="Add contact" onClick={onNewContact}>
              <MdAdd size={22} />
            </button>
          </div>
        </div>

        {/* Animated search bar */}
        {showSearch && (
          <div className="cl-search-wrap animate-fadeInUp">
            <MdSearch size={16} className="cl-search-icon" />
            <input
              type="search"
              className="cl-search-input"
              placeholder="Search conversations…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              aria-label="Search chats"
            />
            {query && (
              <button onClick={() => setQuery('')} className="cl-search-clear" aria-label="Clear search">
                <MdClose size={14} />
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="cl-filters" role="tablist" aria-label="Filter chats">
          {FILTERS.map(f => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`cl-filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {f.id === 'unread' && totalUnread > 0 && (
                <span className="filter-count">{totalUnread}</span>
              )}
            </button>
          ))}
        </div>

        {/* Connection status */}
        {!connected && (
          <div className="cl-offline-bar" role="status" aria-live="polite">
            <MdWifiOff size={14} />
            Connecting…
            <button className="cl-refresh-btn" aria-label="Retry connection" onClick={onRetry}>
              <MdRefresh size={14} />
            </button>
          </div>
        )}
        {connected && (
          <div className="cl-online-bar" role="status" aria-live="polite">
            <MdWifi size={14} />
            Connected
          </div>
        )}
      </div>

      {/* Chat list */}
      <div className="cl-list" role="list" aria-label="Conversations">
        {filtered.length === 0 ? (
          <div className="cl-empty" role="status">
            {query ? (
              <>
                <MdSearch size={36} opacity={0.2} />
                <p>No results for "<strong>{query}</strong>"</p>
                <button className="cl-empty-action" onClick={() => setQuery('')}>Clear search</button>
              </>
            ) : (
              <>
                <MdMessage size={36} opacity={0.2} />
                <p>No {filter !== 'all' ? filter : ''} chats yet</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((room, i) => (
            <div
              key={room._id}
              className="cl-item animate-fadeInUp"
              style={{ animationDelay: `${i * 0.04}s` }}
              role="listitem"
            >
              {filter === 'contacts' ? (
                <ContactItem room={room} onSelect={onSelect} />
              ) : (
                <ChatPreviewCard
                  room={room}
                  isActive={room._id === activeId}
                  onClick={() => onSelect(room)}
                />
              )}
              {i < filtered.length - 1 && (
                <div className="cl-divider" aria-hidden />
              )}
            </div>
          ))
        )}
      </div>

    </aside>
  )
}

/* ──────────────────────────────────────
   Welcome / Empty State (right panel)
────────────────────────────────────── */
/* ──────────────────────────────────────
   AddContactModal
   ────────────────────────────────────── */
function AddContactModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  const isPhoneValid = phone.replace(/\D/g, '').length === 10

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-contact-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Contact</h3>
          <button className="modal-close" onClick={onClose}><MdClose size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="modal-hint">Enter the details of the person you want to chat with.</p>
          <div className="input-group">
            <label>Name (Compulsory)</label>
            <input 
              type="text" 
              placeholder="e.g. Sarah Chen" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Phone Number (Compulsory)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{ width: '90px', padding: '10px 8px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="+91">+91 🇮🇳</option>
                <option value="+1">+1 🇺🇸</option>
                <option value="+44">+44 🇬🇧</option>
                <option value="+61">+61 🇦🇺</option>
                <option value="+81">+81 🇯🇵</option>
                <option value="+49">+49 🇩🇪</option>
                <option value="+33">+33 🇫🇷</option>
                <option value="+86">+86 🇨🇳</option>
                <option value="+971">+971 🇦🇪</option>
                <option value="+65">+65 🇸🇬</option>
              </select>
              <input 
                type="tel" 
                placeholder="10-digit number" 
                value={phone} 
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setPhone(digits)
                }}
                maxLength={10}
                style={{ flex: 1 }}
              />
            </div>
            {phone.length > 0 && !isPhoneValid && (
              <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '4px' }}>
                Phone number must be exactly 10 digits
              </p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={() => { if (name && isPhoneValid) onAdd({ name, phone: countryCode + phone }); onClose(); }}
            disabled={!name.trim() || !isPhoneValid}
          >
            Add Contact
          </button>
        </div>
      </div>
    </div>
  )
}

function WelcomePanel({ onSelectContact, onAddContact, onOpenProfile }) {
  const { rooms } = useContext(ChatContext)
  const totalUnread = rooms.reduce((n, r) => n + (r.unreadCount || 0), 0)
  const onlineCount = rooms.filter(r => r.isOnline).length

  const stats = [
    { icon: MdMailOutline, value: totalUnread, label: 'Unread', color: 'var(--primary)' },
    { icon: MdPeople, value: onlineCount, label: 'Online', color: 'var(--secondary)' },
    { icon: MdMessage, value: rooms.length, label: 'Chats', color: 'var(--accent)' },
  ]

  return (
    <div className="welcome-panel" aria-label="Welcome panel">
      {/* Decorative blobs */}
      <div className="wp-blob wp-blob-1" aria-hidden />
      <div className="wp-blob wp-blob-2" aria-hidden />

      <div className="wp-content">
        <div className="wp-logo" aria-hidden>
          <ConnectSphereLogo size={64} />
        </div>
        <h2 className="wp-title">ConnectSphere</h2>
        <p className="wp-subtitle">
          Select a conversation to start chatting,<br />
          or begin a new one below.
        </p>

        {/* Stats row */}
        <div className="wp-stats" aria-label="Chat statistics">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="wp-stat">
              <div className="wp-stat-icon" style={{ background: `${color}14`, color }}>
                <Icon size={18} />
              </div>
              <p className="wp-stat-value">{value}</p>
              <p className="wp-stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent contacts quick-start */}
        <div className="wp-contacts-section">
          <p className="wp-contacts-label">Start a chat</p>
          <div className="wp-contacts-row">
            {rooms.slice(0, 4).map(r => (
              <button
                key={r._id}
                className="wp-contact-btn"
                onClick={() => onSelectContact(r)}
                aria-label={`Open chat with ${r.name}`}
              >
                <Avatar initials={r.initials || (r.name ? r.name.slice(0, 2).toUpperCase() : '??')} size={46} isOnline={r.isOnline} color={r.color} />
                <span className="wp-contact-name">{r.name ? r.name.split(' ')[0] : 'User'}</span>
              </button>
            ))}
            <button className="wp-contact-btn wp-new-btn" aria-label="Add contact" onClick={onAddContact}>
              <div className="wp-add-circle"><MdAdd size={22} /></div>
              <span className="wp-contact-name">New</span>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="wp-tips">
          <p className="wp-tip">💡 <strong>Tip:</strong> Hold the SOS button for 2 seconds to send an emergency alert.</p>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Inline Chat View (desktop right panel)
────────────────────────────────────── */
import ChatPage from './ChatPage'

/* ──────────────────────────────────────
   Dashboard — Root Export
────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const { rooms, setActiveRoom, deleteRoom, addRoom } = useContext(ChatContext)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      const firstRoom = rooms.find(r => r.pinned) || rooms[0]
      setSelectedRoom(firstRoom)
      setActiveRoom(firstRoom._id)
    }
  }, [rooms, selectedRoom, setActiveRoom])

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room)
    setActiveRoom(room._id)
    // On mobile: navigate to the full chat page
    if (window.innerWidth < 900) {
      navigate(`/chat/${room._id}`)
    }
  }, [navigate, setActiveRoom])

  const handleAddContact = (contact) => {
    const newRoom = addRoom(contact)
    handleSelectRoom(newRoom)
  }

  const handleDeleteChat = (roomId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteRoom(roomId)
      setSelectedRoom(null)
    }
  }

  return (
    <div className="dashboard-screen">
      {/* LEFT: Chat list */}
      <ChatList
        activeId={selectedRoom?._id}
        onSelect={handleSelectRoom}
        onNewContact={() => setShowAddModal(true)}
        onDeleteChat={handleDeleteChat}
        onOpenProfile={() => navigate('/profile')}
        onRetry={() => window.location.reload()}
      />

      {/* RIGHT: Chat view or welcome panel (desktop only) */}
      <div className="dashboard-main" aria-label={selectedRoom ? `Chat with ${selectedRoom.name}` : 'Select a chat'}>
        {selectedRoom
          ? <ChatPage inlineRoomId={selectedRoom._id} />
          : <WelcomePanel 
              onSelectContact={handleSelectRoom}
              onAddContact={() => setShowAddModal(true)} 
              onOpenProfile={() => navigate('/profile')} 
            />
        }
      </div>

      <AddContactModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddContact}
      />
    </div>
  )
}
