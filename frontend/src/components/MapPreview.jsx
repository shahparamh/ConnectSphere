import { useNavigate } from 'react-router-dom'
import { MdOpenInNew, MdMyLocation } from 'react-icons/md'
import './MapPreview.css'

export default function MapPreview({ lat = 12.9716, lng = 77.5946, label = 'Live Location', compact = false }) {
  const navigate = useNavigate()

  // Uses OpenStreetMap static tiles (no API key needed for demo)
  const zoom = compact ? 14 : 13
  const size = compact ? '280x120' : '360x180'
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=${lat},${lng},red`

  return (
    <div className={`map-preview ${compact ? 'compact' : ''}`} role="img" aria-label={`Map showing ${label}`}>
      <div className="map-preview-image-wrapper">
        <img
          className="map-preview-image"
          src={mapUrl}
          alt={`Location map for ${label}`}
          loading="lazy"
          onError={(e) => {
            // Fallback gradient if map fails to load
            e.target.style.display = 'none'
            e.target.parentNode.classList.add('map-fallback')
          }}
        />
        <div className="map-preview-pin" aria-hidden>📍</div>
      </div>
      {!compact && (
        <div className="map-preview-footer">
          <div className="map-preview-label">
            <MdMyLocation size={14} color="var(--primary)" />
            <span>{label}</span>
          </div>
          <button
            className="map-preview-open"
            onClick={() => navigate('/map')}
            aria-label="Open full map"
          >
            <MdOpenInNew size={14} />
            Open Map
          </button>
        </div>
      )}
    </div>
  )
}
