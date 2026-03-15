import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

export const LocationContext = createContext(null)
const DEFAULT_ANCHOR = { lat: 12.9716, lng: 77.5946, accuracy: 18 }
const CONTACT_MOTION_SEEDS = {
  '1': { name: 'Sarah Chen', accuracy: 15, latOffset: 0.0034, lngOffset: 0.0026, latAmp: 0.0009, lngAmp: 0.0007, speed: 0.8 },
  '3': { name: 'Aisha Patel', accuracy: 20, latOffset: -0.0022, lngOffset: 0.0051, latAmp: 0.0007, lngAmp: 0.0009, speed: 1.15 },
  '5': { name: 'Elena Torres', accuracy: 10, latOffset: 0.005, lngOffset: -0.0032, latAmp: 0.0008, lngAmp: 0.0006, speed: 0.6 },
}

function locationReducer(state, action) {
  switch (action.type) {
    case 'SET_MY_LOCATION':
      return { ...state, myLocation: action.payload }
    case 'START_SHARING':
      return { ...state, isSharing: true, shareTimer: action.payload }
    case 'STOP_SHARING':
      return { ...state, isSharing: false, shareTimer: null }
    case 'SET_CONTACT_LOCATION':
      return {
        ...state,
        contactLocations: { ...state.contactLocations, [action.contactId]: action.payload }
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}

const MOCK_CONTACT_LOCATIONS = {
  '1': { lat: 12.9750, lng: 77.5972, name: 'Sarah Chen',   lastUpdated: new Date(), accuracy: 15 },
  '3': { lat: 12.9694, lng: 77.5997, name: 'Aisha Patel',  lastUpdated: new Date(), accuracy: 20 },
  '5': { lat: 12.9766, lng: 77.5914, name: 'Elena Torres', lastUpdated: new Date(), accuracy: 10 },
}

export const LocationProvider = ({ children }) => {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(locationReducer, {
    myLocation: null,
    isSharing: false,
    shareTimer: null,
    contactLocations: MOCK_CONTACT_LOCATIONS,
    error: null,
  })

  // Watch user's geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_ERROR', payload: 'Geolocation not supported' })
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => dispatch({
        type: 'SET_MY_LOCATION',
        payload: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
      }),
      (err) => dispatch({ type: 'SET_ERROR', payload: err.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    const tick = () => {
      const anchor = state.myLocation || DEFAULT_ANCHOR
      const t = Date.now() / 1000

      Object.entries(CONTACT_MOTION_SEEDS).forEach(([contactId, seed], index) => {
        dispatch({
          type: 'SET_CONTACT_LOCATION',
          contactId,
          payload: {
            lat: +(anchor.lat + seed.latOffset + Math.sin(t * seed.speed + index) * seed.latAmp).toFixed(6),
            lng: +(anchor.lng + seed.lngOffset + Math.cos(t * seed.speed + index * 0.8) * seed.lngAmp).toFixed(6),
            name: seed.name,
            lastUpdated: new Date(),
            accuracy: seed.accuracy,
          }
        })
      })
    }

    tick()
    const intervalId = setInterval(tick, 4000)
    return () => clearInterval(intervalId)
  }, [state.myLocation])

  const shareLocation = useCallback((options = 30) => {
    const durationMinutes = typeof options === 'number'
      ? options
      : options?.durationMinutes ?? 30
    const expiresAt = durationMinutes === null
      ? null
      : new Date(Date.now() + durationMinutes * 60 * 1000)
    dispatch({ type: 'START_SHARING', payload: expiresAt })
    // Would emit through socket in production
    return { success: true, expiresAt }
  }, [])

  const stopSharing = useCallback(() => {
    dispatch({ type: 'STOP_SHARING' })
  }, [])

  const triggerSOS = useCallback(async (emergencyContacts) => {
    const location = state.myLocation || DEFAULT_ANCHOR
    try {
      // In production: await axios.post('/api/location/sos', { location, emergencyContacts })
      console.log('SOS triggered!', { location, emergencyContacts })
      return { success: true }
    } catch {
      return { success: false }
    }
  }, [state.myLocation])

  return (
    <LocationContext.Provider value={{
      ...state,
      shareLocation,
      stopSharing,
      triggerSOS,
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
