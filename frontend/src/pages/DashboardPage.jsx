import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdMessage, MdLocationOn, MdPeople, MdWifiTethering, MdNotificationsActive } from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import { LocationContext } from '../context/LocationContext'
import ChatCard from '../components/ChatCard'
import SearchBar from '../components/SearchBar'
import MapPreview from '../components/MapPreview'
import LocationShareModal from '../components/LocationShareModal'
import './DashboardPage.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { rooms } = useContext(ChatContext)
  const { isSharing, myLocation, contactLocations } = useContext(LocationContext)

  const [query, setQuery]         = useState('')
  const [showLocModal, setLocModal] = useState(false)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.lastMessage?.toLowerCase().includes(query.toLowerCase())
  )

  const totalUnread = rooms.reduce((acc, r) => acc + r.unreadCount, 0)
  const onlineContacts = Object.keys(contactLocations).length

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-greeting">
          <h2>{greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>You have <strong>{totalUnread}</strong> unread message{totalUnread !== 1 ? 's' : ''}</p>
        </div>
        <button className="dashboard-notif-btn" aria-label="Notifications" onClick={() => navigate('/profile')}>
          <MdNotificationsActive size={22} />
          {totalUnread > 0 && <span className="notif-dot" aria-hidden />}
        </button>
      </header>

      {/* Stats strip */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><MdMessage size={18} /></div>
          <div>
            <p className="stat-value">{totalUnread}</p>
            <p className="stat-label">Unread</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><MdPeople size={18} /></div>
          <div>
            <p className="stat-value">{onlineContacts}</p>
            <p className="stat-label">Online</p>
          </div>
        </div>
        <div
          className={`stat-card stat-card-location ${isSharing ? 'sharing' : ''}`}
          onClick={() => setLocModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setLocModal(true)}
          aria-label="Share location"
        >
          <div className={`stat-icon ${isSharing ? 'stat-icon-green' : 'stat-icon-cyan'}`}>
            <MdLocationOn size={18} />
          </div>
          <div>
            <p className="stat-value">{isSharing ? 'Live' : 'Share'}</p>
            <p className="stat-label">Location</p>
          </div>
          {isSharing && <span className="sharing-dot" aria-label="Sharing active" />}
        </div>
      </div>

      {/* Map preview strip */}
      <div className="dashboard-map-section">
        <div className="section-header">
          <h3>Live Map</h3>
          <span className="section-badge">{onlineContacts} tracked</span>
        </div>
        <MapPreview
          lat={myLocation?.lat || 12.9716}
          lng={myLocation?.lng || 77.5946}
          label="Your location"
        />
      </div>

      {/* Chat List */}
      <div className="dashboard-chats">
        <div className="section-header">
          <h3>Recent Chats</h3>
          <span className="section-badge">{rooms.length}</span>
        </div>
        <SearchBar onSearch={setQuery} placeholder="Search chats…" />
        <div className="chat-list" role="list" aria-label="Chat conversations">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <MdMessage size={40} opacity={0.2} />
              <p>No chats found</p>
            </div>
          ) : (
            filtered.map((room, i) => (
              <div key={room._id} style={{ animationDelay: `${i * 0.05}s` }}>
                <ChatCard room={room} />
              </div>
            ))
          )}
        </div>
      </div>

      {showLocModal && <LocationShareModal onClose={() => setLocModal(false)} />}
    </div>
  )
}
