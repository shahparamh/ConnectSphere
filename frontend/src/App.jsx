import { Routes, Route, Navigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from './context/AuthContext'
import axios from 'axios'

// Configure axios for production (Vercel + Render)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''
import LandingPage   from './pages/LandingPage'
import AuthPage      from './pages/AuthPage'
import Dashboard     from './pages/Dashboard'
import DashboardPage from './pages/DashboardPage'
import ChatPage        from './pages/ChatPage'
import LiveMapPage     from './pages/LiveMapPage'
import ProfilePage     from './pages/ProfilePage'
import SettingsPage    from './pages/SettingsPage'
import SOSPage         from './pages/SOSPage'
import NavigationPage  from './pages/NavigationPage'
import InfoPage        from './pages/InfoPage'
import NavigationSidebar from './components/NavigationSidebar'
import BottomNav from './components/BottomNav'
import StartupSplash from './components/StartupSplash'
import SettingsManager from './components/SettingsManager'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LocationProvider } from './context/LocationContext'
import PhoneNumberModal from './components/PhoneNumberModal'

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext)
  return user ? children : <Navigate to="/login" replace />
}


const AppShell = ({ children }) => (
  <div className="app-layout">
    <NavigationSidebar />
    <main className="main-content">
      {children}
    </main>
    <BottomNav />
  </div>
)

function App(){
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <StartupSplash onFinish={() => setShowSplash(false)} />
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here'}>
      <LocationProvider>
        <div className="app-container">
        <SettingsManager />
        <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/privacy"  element={<InfoPage />} />
        <Route path="/terms"    element={<InfoPage />} />
        <Route path="/help"     element={<InfoPage />} />
        <Route path="/pricing"  element={<InfoPage />} />
        <Route path="/about"    element={<InfoPage />} />
        <Route path="/status"   element={<InfoPage />} />
        <Route path="/alerts"   element={<InfoPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppShell><Dashboard /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/chat/:id" element={
          <ProtectedRoute>
            <AppShell><ChatPage /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <AppShell><LiveMapPage /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppShell><ProfilePage /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppShell><SettingsPage /></AppShell>
          </ProtectedRoute>
        } />
        <Route path="/sos" element={
          <ProtectedRoute>
            <SOSPage />
          </ProtectedRoute>
        } />
        <Route path="/navigation" element={
          <ProtectedRoute>
            <AppShell><NavigationPage /></AppShell>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
        <PhoneNumberModal />
      </LocationProvider>
    </GoogleOAuthProvider>
  )
}

export default App
