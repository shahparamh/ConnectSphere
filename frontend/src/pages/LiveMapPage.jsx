import { useState, useEffect, useContext, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, MarkerF, CircleF, PolylineF, useJsApiLoader } from '@react-google-maps/api'
import {
  MdLocationOn, MdPause, MdStop, MdPlayArrow, MdMyLocation,
  MdPeople, MdChat, MdNavigation,
  MdSpeed, MdTimer, MdSignalCellularAlt, MdGpsFixed,
  MdWifiTethering, MdInfo, MdExpandMore, MdExpandLess,
  MdDirectionsWalk, MdDirectionsCar, MdSatellite, MdMap, MdPlace
} from 'react-icons/md'
import { LocationContext } from '../context/LocationContext'
import { MOCK_CONTACTS, MOCK_ROOMS } from '../context/ChatContext'
import Avatar from '../components/Avatar'
import LocationShareModal from '../components/LocationShareModal'
import './LiveMapPage.css'

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946, accuracy: 18 }
const PLACE_MARKER_SEEDS = [
  { id: 'p1', name: 'Safe Cafe', kind: 'Cafe', latOffset: 0.0042, lngOffset: -0.0055 },
  { id: 'p2', name: 'Metro Gate', kind: 'Transit', latOffset: -0.0058, lngOffset: 0.0048 },
  { id: 'p3', name: 'Campus Help Desk', kind: 'Support', latOffset: 0.0065, lngOffset: 0.0028 },
]
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

const formatCountdown = (secs) => {
  if (secs === null) return '∞'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const OSM_TILE_SIZE = 256
const OSM_TILE_RADIUS = 3
const OSM_CANVAS_SIZE = OSM_TILE_SIZE * (OSM_TILE_RADIUS * 2 + 1)

const makeRoutePath = (start, end) => {
  const latMid = (start.lat + end.lat) / 2 + 0.0028
  const lngMid = (start.lng + end.lng) / 2 - 0.0035
  return [start, { lat: latMid, lng: lngMid }, end]
}

const makeNearbyPoint = (center, latOffset, lngOffset) => ({
  lat: +(center.lat + latOffset).toFixed(6),
  lng: +(center.lng + lngOffset).toFixed(6),
})

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

const isVisibleInViewport = ({ x, y }) => x > -12 && x < 112 && y > -12 && y < 112

const createNearbyFriends = (center) => ([
  {
    ...MOCK_CONTACTS[0],
    color: '#3A6FF7',
    location: makeNearbyPoint(center, 0.0038, 0.0026),
    accuracy: 12,
    speed: 3,
    address: '2 min away',
  },
  {
    ...MOCK_CONTACTS[2],
    color: '#22D3EE',
    location: makeNearbyPoint(center, -0.0022, 0.0058),
    accuracy: 18,
    speed: 1,
    address: 'Near your route',
  },
  {
    ...MOCK_CONTACTS[4],
    color: '#F59E0B',
    location: makeNearbyPoint(center, 0.0052, -0.0034),
    accuracy: 10,
    speed: 0,
    address: 'At help point',
  },
])

const createNearbyPlaces = (center) => PLACE_MARKER_SEEDS.map(place => ({
  ...place,
  location: makeNearbyPoint(center, place.latOffset, place.lngOffset),
}))

function UserLocationMarker({ x, y }) {
  return (
    <div className="ulm-root" style={{ left: `${x}%`, top: `${y}%` }} aria-label="Your location">
      <div className="ulm-dot">
        <MdMyLocation size={14} />
      </div>
    </div>
  )
}

function FriendLocationMarker({ contact, x, y, selected, onClick, distance, onRoute, onChat }) {
  return (
    <button
      className={`flm-root ${selected ? 'selected' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      aria-label={`${contact.name}'s location${distance ? `, ${distance}m away` : ''}`}
      aria-pressed={selected}
    >
      <div className={`flm-pulse ${selected ? 'active' : ''}`} aria-hidden />
      <div className="flm-avatar">
        <Avatar initials={contact.initials} size={selected ? 42 : 36} color={contact.color} isOnline={contact.isOnline} />
      </div>
      <div className="flm-label">
        <span className="flm-name">{contact.name.split(' ')[0]}</span>
        {distance && <span className="flm-dist">{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</span>}
        {contact.speed !== undefined && (
          <span className="flm-speed">
            <MdDirectionsWalk size={10} /> {contact.speed} km/h
          </span>
        )}
      </div>
      {selected && (
        <div className="flm-info-card" role="tooltip">
          <p className="flm-info-name">{contact.name}</p>
          {contact.address && <p className="flm-info-addr">{contact.address}</p>}
          <div className="flm-info-row">
            <span className="flm-info-chip">
              <MdGpsFixed size={11} /> ±{contact.accuracy || 15}m
            </span>
            {contact.speed !== undefined && (
              <span className="flm-info-chip">
                <MdSpeed size={11} /> {contact.speed} km/h
              </span>
            )}
          </div>
          <div className="flm-info-actions">
            <button className="flm-action" onClick={(e) => { e.stopPropagation(); onRoute?.(contact) }}>
              <MdNavigation size={14} /> Route
            </button>
            <button className="flm-action" onClick={(e) => { e.stopPropagation(); onChat?.(contact) }}>
              <MdChat size={14} /> Chat
            </button>
          </div>
        </div>
      )}
    </button>
  )
}

function PlaceMarker({ place, x, y, selected, onClick }) {
  return (
    <button
      className={`plm-root ${selected ? 'selected' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${place.name}, ${place.kind}`}
    >
      <div className="plm-pin">
        <MdPlace size={16} />
      </div>
      <div className="plm-label">
        <span className="plm-name">{place.name}</span>
        <span className="plm-kind">{place.kind}</span>
      </div>
      {selected && <div className="plm-glow" />}
    </button>
  )
}

function GoogleLiveMap({ center, friendsOnMap, placesOnMap, selectedFriend, setSelectedFriend, selectedPlace, setSelectedPlace, myLocation, mapStyle, zoomLevel, onRoute, onChat, onLoadError }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
  const { isLoaded, loadError } = useJsApiLoader({ id: 'connectsphere-live-map', googleMapsApiKey: apiKey })

  useEffect(() => {
    if (loadError && onLoadError) {
      onLoadError()
    }
  }, [loadError, onLoadError])

  if (!isLoaded) return <div className="mc-root mc-loading">Loading map…</div>

  const googleZoom = clamp(Math.round(14 + (zoomLevel - 1) * 8), 12, 18)
  const mapTypeId = mapStyle === 'satellite' ? 'satellite' : mapStyle === 'terrain' ? 'terrain' : 'roadmap'
  const selected = friendsOnMap.find(friend => friend._id === selectedFriend)
  const selectedPlaceCard = placesOnMap.find(place => place.id === selectedPlace)
  const routePath = selected ? makeRoutePath(myLocation, selected.location) : null

  return (
    <div className="mc-root" aria-label="Live location map">
      <GoogleMap
        mapContainerClassName="mc-google-map"
        center={{ lat: center.lat, lng: center.lng }}
        zoom={googleZoom}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          mapTypeId,
          gestureHandling: 'greedy',
          styles: mapTypeId === 'roadmap' ? GOOGLE_DARK_STYLE : undefined,
        }}
      >
        <MarkerF position={{ lat: center.lat, lng: center.lng }} title="You" />
      </GoogleMap>

      {selected && (
        <div className="mc-selected-card">
          <p className="mc-selected-name">{selected.name}</p>
          <p className="mc-selected-sub">
            {Math.round(calcDistance(myLocation.lat, myLocation.lng, selected.location.lat, selected.location.lng))}m away
          </p>
          <div className="mc-selected-actions">
            <button className="flm-action" onClick={() => onRoute(selected)}><MdNavigation size={14} /> Route</button>
            <button className="flm-action" onClick={() => onChat(selected)}><MdChat size={14} /> Chat</button>
          </div>
        </div>
      )}

      {selectedPlaceCard && (
        <div className="mc-selected-card">
          <p className="mc-selected-name">{selectedPlaceCard.name}</p>
          <p className="mc-selected-sub">{selectedPlaceCard.kind} nearby</p>
          <div className="mc-selected-actions">
            <button className="flm-action" onClick={() => setSelectedPlace(null)}><MdMap size={14} /> Dismiss</button>
            <button className="flm-action" onClick={() => onRoute({ location: selectedPlaceCard.location })}><MdNavigation size={14} /> Route</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MapQuickPlaces({ placesOnMap, selectedPlace, onSelect }) {
  return (
    <div className="mqp-bar" role="tablist" aria-label="Nearby places">
      {placesOnMap.map(place => (
        <button
          key={place.id}
          className={`mqp-chip ${selectedPlace === place.id ? 'active' : ''}`}
          onClick={() => onSelect(place.id)}
          role="tab"
          aria-selected={selectedPlace === place.id}
        >
          <MdPlace size={14} />
          <span>{place.name}</span>
        </button>
      ))}
    </div>
  )
}

function OpenStreetMapEmbed({ center, friendsOnMap, placesOnMap, selectedFriend, setSelectedFriend, selectedPlace, setSelectedPlace, myLocation, zoomLevel, isSharing, heading, onRoute, onChat }) {
  const osmZoom = clamp(Math.round(14 + (zoomLevel - 1) * 5), 13, 17)
  const centerWorld = latLngToWorld(center, osmZoom)
  const originX = centerWorld.x - OSM_CANVAS_SIZE / 2
  const originY = centerWorld.y - OSM_CANVAS_SIZE / 2
  const selected = friendsOnMap.find(friend => friend._id === selectedFriend)
  const routePath = selected
    ? makeRoutePath(myLocation, selected.location).map(point => projectToViewport(point, center, osmZoom))
    : null
  const selectedPlaceCard = placesOnMap.find(place => place.id === selectedPlace)
  const tiles = []

  for (let dx = -OSM_TILE_RADIUS; dx <= OSM_TILE_RADIUS; dx += 1) {
    for (let dy = -OSM_TILE_RADIUS; dy <= OSM_TILE_RADIUS; dy += 1) {
      const tileX = Math.floor(centerWorld.x / OSM_TILE_SIZE) + dx
      const tileY = Math.floor(centerWorld.y / OSM_TILE_SIZE) + dy
      const tilesPerAxis = 2 ** osmZoom
      if (tileY < 0 || tileY >= tilesPerAxis) continue
      const wrappedTileX = ((tileX % tilesPerAxis) + tilesPerAxis) % tilesPerAxis
      const left = ((tileX * OSM_TILE_SIZE - originX) / OSM_CANVAS_SIZE) * 100
      const top = ((tileY * OSM_TILE_SIZE - originY) / OSM_CANVAS_SIZE) * 100
      tiles.push({
        key: `${wrappedTileX}-${tileY}-${osmZoom}`,
        src: `https://tile.openstreetmap.org/${osmZoom}/${wrappedTileX}/${tileY}.png`,
        left,
        top,
      })
    }
  }

  const myPos = projectToViewport(center, center, osmZoom)

  return (
    <div className="mc-root" aria-label="Live location map">
      <div className="mc-osm-frame mc-osm-stage" aria-hidden>
        {tiles.map(tile => (
          <img
            key={tile.key}
            className="mc-osm-tile"
            src={tile.src}
            alt=""
            loading="lazy"
            draggable="false"
            style={{ left: `${tile.left}%`, top: `${tile.top}%` }}
          />
        ))}
        {/* Realistic Depth Layers */}
        <div className="mc-osm-scrim" />
        <div className="mc-osm-vignette" />
        
        {/* Traffic Simulation */}
        <div className="mc-traffic-layer">
          <div className="traffic-dot td-1" />
          <div className="traffic-dot td-2" />
          <div className="traffic-dot td-3" />
        </div>
      </div>
      <div className="mc-overlay-layer">
        <UserLocationMarker x={myPos.x} y={myPos.y} />
      </div>

      {selectedPlaceCard && (
        <div className="mc-selected-card">
          <p className="mc-selected-name">{selectedPlaceCard.name}</p>
          <p className="mc-selected-sub">{selectedPlaceCard.kind} nearby</p>
          <div className="mc-selected-actions">
            <button className="flm-action" onClick={() => setSelectedPlace(null)}><MdMap size={14} /> Dismiss</button>
            <button className="flm-action" onClick={() => onRoute({ location: selectedPlaceCard.location })}><MdNavigation size={14} /> Route</button>
          </div>
        </div>
      )}
    </div>
  )
}

function LocationStatusPanel({ isSharing, isPaused, countdown, onTogglePause, onStop, onShare, sharingWith, myLocation }) {
  const [collapsed, setCollapsed] = useState(false)
  const statusColor = isPaused ? 'var(--warning)' : isSharing ? 'var(--success)' : 'var(--text-muted)'
  const statusLabel = isPaused ? 'Paused' : isSharing ? 'Sharing' : 'Not sharing'

  return (
    <div className={`lsp-panel ${collapsed ? 'collapsed' : ''}`} role="region" aria-label="Location sharing status">
      <button className="lsp-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand status panel' : 'Collapse status panel'} aria-expanded={!collapsed}>
        {collapsed ? <MdExpandMore size={20} /> : <MdExpandLess size={20} />}
      </button>
      <div className="lsp-status-row">
        <div className="lsp-status-indicator" style={{ background: statusColor }}>
          {!isPaused && isSharing && <span className="lsp-pulse" aria-hidden />}
        </div>
        <div className="lsp-status-text">
          <p className="lsp-status-label" style={{ color: statusColor }}>{statusLabel}</p>
          {isSharing && <p className="lsp-status-sub">{sharingWith.length} contact{sharingWith.length !== 1 ? 's' : ''} · {isPaused ? 'Paused' : 'Live'}</p>}
        </div>
        {isSharing && countdown !== null && (
          <div className="lsp-countdown" aria-label={`${formatCountdown(countdown)} remaining`}>
            <MdTimer size={13} />
            <span>{formatCountdown(countdown)}</span>
          </div>
        )}
      </div>
      {!collapsed && (
        <div className="lsp-detail animate-fadeInUp">
          <div className="lsp-gps-row">
            <div className="lsp-gps-chip">
              <MdGpsFixed size={12} />
              {myLocation.lat.toFixed(4)}°N, {myLocation.lng.toFixed(4)}°E
            </div>
            <div className="lsp-gps-chip">
              <MdSignalCellularAlt size={12} /> ±{Math.round(myLocation.accuracy || 18)}m
            </div>
          </div>
          {isSharing && sharingWith.length > 0 && (
            <div className="lsp-shared-with">
              <span className="lsp-shared-label">Visible to</span>
              <div className="lsp-avatars">
                {sharingWith.map(c => (
                  <div key={c._id} className="lsp-avatar-wrap" title={c.name}>
                    <Avatar initials={c.initials} size={28} isOnline={c.isOnline} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="lsp-controls">
            {isSharing ? (
              <>
                <button className={`lsp-ctrl-btn lsp-pause-btn ${isPaused ? 'resume' : ''}`} onClick={onTogglePause}>
                  {isPaused ? <MdPlayArrow size={16} /> : <MdPause size={16} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button className="lsp-ctrl-btn lsp-stop-btn" onClick={onStop}>
                  <MdStop size={16} />
                  Stop
                </button>
              </>
            ) : (
              <button className="lsp-ctrl-btn lsp-start-btn" onClick={onShare}>
                <MdWifiTethering size={16} />
                Share Location
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContactsSidePanel({ contacts, selectedId, onSelect, myLocation }) {
  return (
    <aside className="csp-panel" aria-label="Contacts on map">
      <div className="csp-header">
        <MdPeople size={18} />
        <h3>Friends</h3>
        <span className="csp-online-count">{contacts.filter(c => c.isOnline).length} online</span>
      </div>
      <div className="csp-list" role="list">
        {contacts.map(c => {
          const loc = c.location
          const dist = loc ? Math.round(calcDistance(myLocation.lat, myLocation.lng, loc.lat, loc.lng)) : null
          return (
            <button
              key={c._id}
              className={`csp-item ${selectedId === c._id ? 'active' : ''}`}
              onClick={() => onSelect(c._id === selectedId ? null : c._id)}
              role="listitem"
              aria-pressed={selectedId === c._id}
            >
              <Avatar initials={c.initials} size={40} isOnline={c.isOnline} color={c.color} />
              <div className="csp-info">
                <p className="csp-name">{c.name}</p>
                <p className="csp-sub">
                  {!c.isOnline ? 'Offline' : loc ? `${dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`} · Online` : 'Not sharing'}
                </p>
              </div>
              {loc && (
                <div className="csp-loc-indicator" aria-label="Location available">
                  <MdLocationOn size={14} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function MapToolbar({ mapStyle, setMapStyle, onCenter, onZoomIn, onZoomOut, hasGoogleMaps }) {
  const styles = hasGoogleMaps
    ? [
        { id: 'streets', icon: MdMap, label: 'Streets' },
        { id: 'satellite', icon: MdSatellite, label: 'Satellite' },
        { id: 'terrain', icon: MdDirectionsCar, label: 'Terrain' },
      ]
    : [
        { id: 'streets', icon: MdMap, label: 'Map' },
      ]

  return (
    <div className="mt-toolbar" role="toolbar" aria-label="Map controls">
      <button className="mt-btn mt-recenter" onClick={onCenter} aria-label="Center on my location">
        <MdMyLocation size={20} />
      </button>
      <div className="mt-style-group" role="group" aria-label="Map style">
        {styles.map(({ id, icon: Icon, label }) => (
          <button key={id} className={`mt-style-btn ${mapStyle === id ? 'active' : ''}`} onClick={() => setMapStyle(id)} aria-pressed={mapStyle === id}>
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="mt-zoom">
        <button className="mt-btn" aria-label="Zoom in" onClick={onZoomIn}>+</button>
        <div className="mt-zoom-sep" />
        <button className="mt-btn" aria-label="Zoom out" onClick={onZoomOut}>−</button>
      </div>
    </div>
  )
}

function GoogleMapsBanner() {
  if (import.meta.env.VITE_GOOGLE_MAPS_KEY) return null
  return (
    <div className="gmb-banner" role="note" aria-label="Map notice">
      <MdInfo size={16} />
      <span>Using OSM Mode</span>
    </div>
  )
}

export default function LiveMapPage() {
  const navigate = useNavigate()
  const { myLocation, contactLocations } = useContext(LocationContext)
  const [isPaused, setPaused] = useState(false)
  const [countdown, setCountdown] = useState(3600)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [mapStyle, setMapStyle] = useState('streets')
  const [showShareModal, setShareModal] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [sharingActive, setSharingActive] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [heading] = useState(42)
  const [selectedPlace, setSelectedPlace] = useState('p1')

  const [googleQuotaExceeded, setQuotaExceeded] = useState(false)
  const center = myLocation || DEFAULT_CENTER
  const friendsOnMap = useMemo(() => {
    const fallbackFriends = createNearbyFriends(center)
    return fallbackFriends.map(friend => {
      const liveLocation = contactLocations?.[friend._id]
      if (!liveLocation) return friend
      return {
        ...friend,
        location: {
          lat: liveLocation.lat,
          lng: liveLocation.lng,
        },
        accuracy: liveLocation.accuracy || friend.accuracy,
        address: liveLocation.lastUpdated
          ? `Updated ${new Date(liveLocation.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : friend.address,
      }
    })
  }, [center, contactLocations])
  const placesOnMap = useMemo(() => createNearbyPlaces(center), [center])
  const sharingWith = friendsOnMap
  const hasGoogleMaps = Boolean(import.meta.env.VITE_GOOGLE_MAPS_KEY) && !googleQuotaExceeded

  useEffect(() => {
    if (!sharingActive || isPaused || countdown === null) return
    if (countdown <= 0) {
      setSharingActive(false)
      return
    }
    const t = setInterval(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000)
    return () => clearInterval(t)
  }, [sharingActive, isPaused, countdown])

  const handleTogglePause = useCallback(() => setPaused(p => !p), [])
  const handleStop = useCallback(() => { setSharingActive(false); setPaused(false) }, [])
  const handleRecenter = useCallback(() => { setZoomLevel(1); setSelectedFriend(null); setSelectedPlace('p1') }, [])
  const handleRoute = useCallback(() => navigate('/navigation'), [navigate])
  const handleChat = useCallback((friend) => navigate(`/chat/${MOCK_ROOMS.find(r => r.contactId === friend._id)?._id || 'r1'}`), [navigate])

  return (
    <div className="lmp-root">
      <div className="lmp-map-area">
        <MapToolbar
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          onCenter={handleRecenter}
          onZoomIn={() => setZoomLevel(z => Math.min(1.6, +(z + 0.1).toFixed(2)))}
          onZoomOut={() => setZoomLevel(z => Math.max(0.8, +(z - 0.1).toFixed(2)))}
          hasGoogleMaps={hasGoogleMaps}
        />
        <GoogleMapsBanner />
        <MapQuickPlaces
          placesOnMap={placesOnMap}
          selectedPlace={selectedPlace}
          onSelect={(placeId) => {
            setSelectedFriend(null)
            setSelectedPlace(current => current === placeId ? null : placeId)
          }}
        />

        {hasGoogleMaps ? (
          <GoogleLiveMap
            center={center}
            friendsOnMap={friendsOnMap}
            placesOnMap={placesOnMap}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            myLocation={center}
            mapStyle={mapStyle}
            zoomLevel={zoomLevel}
            onRoute={handleRoute}
            onChat={handleChat}
            onLoadError={() => setQuotaExceeded(true)}
          />
        ) : (
          <OpenStreetMapEmbed
            center={center}
            friendsOnMap={friendsOnMap}
            placesOnMap={placesOnMap}
            selectedFriend={selectedFriend}
            setSelectedFriend={setSelectedFriend}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            myLocation={center}
            zoomLevel={zoomLevel}
            isSharing={sharingActive && !isPaused}
            heading={heading}
            onRoute={handleRoute}
            onChat={handleChat}
          />
        )}

        {showPanel && (
          <LocationStatusPanel
            isSharing={sharingActive}
            isPaused={isPaused}
            countdown={countdown}
            onTogglePause={handleTogglePause}
            onStop={handleStop}
            onShare={() => setShareModal(true)}
            sharingWith={sharingWith}
            myLocation={center}
          />
        )}

        <button className="lmp-panel-toggle" onClick={() => setShowPanel(p => !p)} aria-label={showPanel ? 'Hide status panel' : 'Show status panel'}>
          {showPanel ? <MdExpandLess size={20} /> : <MdLocationOn size={20} />}
        </button>
      </div>

      <ContactsSidePanel contacts={friendsOnMap} selectedId={selectedFriend} onSelect={(id) => {
        setSelectedPlace(null)
        setSelectedFriend(id)
      }} myLocation={center} />
      {showShareModal && <LocationShareModal onClose={() => setShareModal(false)} />}
    </div>
  )
}
