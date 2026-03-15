import { MdDone, MdDoneAll, MdAccessTime, MdLocationOn } from 'react-icons/md'
import './MessageBubble.css'
import MapPreview from './MapPreview'

function StatusIcon({ status }) {
  if (status === 'read')      return <MdDoneAll size={14} style={{ color: 'var(--accent)' }} />
  if (status === 'delivered') return <MdDoneAll size={14} style={{ color: 'var(--text-muted)' }} />
  if (status === 'sent')      return <MdDone    size={14} style={{ color: 'var(--text-muted)' }} />
  return <MdAccessTime size={14} style={{ color: 'var(--text-muted)' }} />
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message }) {
  const { text, timestamp, isSent, status, type, lat, lng } = message

  return (
    <div className={`bubble-wrapper ${isSent ? 'sent' : 'received'}`}>
      <div className={`bubble ${isSent ? 'bubble-sent' : 'bubble-received'} ${type === 'location' ? 'bubble-location' : ''}`}>
        {type === 'location' ? (
          <div className="bubble-location-content">
            <div className="bubble-location-header">
              <MdLocationOn size={16} color="var(--accent)" />
              <span>Live Location Shared</span>
            </div>
            <MapPreview lat={lat} lng={lng} compact />
          </div>
        ) : (
          <p className="bubble-text">{text}</p>
        )}
        <div className="bubble-meta">
          <time className="bubble-time" dateTime={new Date(timestamp).toISOString()}>
            {formatTime(timestamp)}
          </time>
          {isSent && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  )
}
