import { useState, useContext } from 'react'
import { MdMyLocation, MdLocationOn, MdRefresh, MdPeople, MdTimer } from 'react-icons/md'
import { LocationContext } from '../context/LocationContext'
import { ChatContext } from '../context/ChatContext'
import MapPreview from '../components/MapPreview'
import Avatar from '../components/Avatar'
import LocationShareModal from '../components/LocationShareModal'
import './MapPage.css'

export default function MapPage() {
  const { myLocation, contactLocations, isSharing, shareTimer, stopSharing } = useContext(LocationContext)
  const { rooms } = useContext(ChatContext)
  const [showLocModal, setLocModal] = useState(false)

  const contactEntries = Object.entries(contactLocations)

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return ''
    const diff = new Date(expiresAt) - Date.now()
    if (diff <= 0) return 'Expired'
    const mins = Math.floor(diff / 60000)
    return `${mins}m left`
  }

  return (
    <div className="map-page">
      {/* Header */}
      <header className="map-header">
        <div>
          <h2>Live Map</h2>
          <p className="map-subtitle">{contactEntries.length} contact{contactEntries.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="map-header-actions">
          {isSharing && (
            <button className="sharing-badge" onClick={stopSharing} aria-label="Stop sharing location">
              <span className="sharing-dot" /> Sharing {formatTimeLeft(shareTimer)}
            </button>
          )}
          <button
            className={`btn-primary map-share-btn ${isSharing ? 'share-active' : ''}`}
            onClick={() => setLocModal(true)}
          >
            <MdLocationOn size={16} />
            {isSharing ? 'Update' : 'Share Location'}
          </button>
        </div>
      </header>

      {/* My location */}
      <section className="map-section">
        <div className="map-section-label">
          <MdMyLocation size={16} color="var(--primary)" />
          <span>Your Location</span>
          {myLocation ? (
            <span className="location-accuracy">±{Math.round(myLocation.accuracy || 20)}m</span>
          ) : (
            <span className="location-loading"><MdRefresh size={14} /> Locating…</span>
          )}
        </div>
        <MapPreview
          lat={myLocation?.lat || 12.9716}
          lng={myLocation?.lng || 77.5946}
          label="You"
        />
      </section>

      {/* Contact locations */}
      <section className="map-section">
        <div className="map-section-label">
          <MdPeople size={16} color="var(--secondary)" />
          <span>Contact Locations</span>
        </div>

        {contactEntries.length === 0 ? (
          <div className="empty-state">
            <MdLocationOn size={40} opacity={0.2} />
            <p>No contacts sharing location</p>
            <button className="btn-secondary" onClick={() => setLocModal(true)}>
              Invite to share
            </button>
          </div>
        ) : (
          <div className="contact-location-grid">
            {contactEntries.map(([id, loc]) => (
              <div key={id} className="contact-map-card card">
                <div className="contact-map-header">
                  <Avatar
                    initials={loc.name.slice(0,2).toUpperCase()}
                    size={36}
                    isOnline
                    color="var(--gradient-primary)"
                  />
                  <div>
                    <p className="contact-map-name">{loc.name}</p>
                    <p className="contact-map-time">
                      <MdTimer size={12} /> Updated just now
                    </p>
                  </div>
                  <span className="contact-accuracy">±{loc.accuracy}m</span>
                </div>
                <MapPreview lat={loc.lat} lng={loc.lng} label={loc.name} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {showLocModal && <LocationShareModal onClose={() => setLocModal(false)} />}
    </div>
  )
}
