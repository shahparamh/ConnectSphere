import { useNavigate } from 'react-router-dom'
import { MdLocationOn } from 'react-icons/md'
import Avatar from './Avatar'
import NotificationBadge from './NotificationBadge'
import './ChatCard.css'

function formatTimestamp(ts) {
  const now = new Date()
  const diff = now - new Date(ts)
  if (diff < 60000)    return 'now'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ChatCard({ room, isActive = false, onClick }) {
  const navigate = useNavigate()

  const handleClick = () => {
    onClick?.()
    navigate(`/chat/${room._id}`)
  }

  const isLocationMsg = room.lastMessage?.toLowerCase().includes('location shared')

  return (
    <article
      className={`chat-card ${isActive ? 'active' : ''} animate-fadeInUp`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Chat with ${room.name}, ${room.unreadCount ? room.unreadCount + ' unread' : 'no unread'} messages`}
    >
      <div className="chat-card-avatar">
        <Avatar
          initials={room.initials}
          size={48}
          isOnline={room.isOnline}
          color={room.color}
        />
        {room.pinned && (
          <span className="chat-card-pin" aria-label="Pinned">📌</span>
        )}
      </div>

      <div className="chat-card-body">
        <div className="chat-card-header">
          <h4 className="chat-card-name">{room.name}</h4>
          <span className="chat-card-time">{formatTimestamp(room.timestamp)}</span>
        </div>
        <div className="chat-card-footer">
          <p className="chat-card-preview">
            {isLocationMsg && <MdLocationOn size={14} style={{ color: 'var(--accent)', marginRight: 3, verticalAlign: 'middle' }} />}
            {room.lastMessage}
          </p>
          <NotificationBadge count={room.unreadCount} />
        </div>
      </div>
    </article>
  )
}
