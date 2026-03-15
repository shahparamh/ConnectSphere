import { NavLink, useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
  MdDashboard, MdChat, MdLocationOn, MdPerson,
  MdNotifications, MdSettings, MdLogout
} from 'react-icons/md'
import Avatar from './Avatar'
import SOSButton from './SOSButton'
import ConnectSphereLogo from './ConnectSphereLogo'
import './NavigationSidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: MdDashboard,   label: 'Chats' },
  { to: '/chat/rai',  icon: MdChat,        label: 'ConnectSphere AI' },
  { to: '/map',       icon: MdLocationOn,  label: 'Live Map'  },
  { to: '/profile',   icon: MdPerson,      label: 'Profile'   },
]

export default function NavigationSidebar() {
  const { user, logout } = useContext(AuthContext)
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  return (
    <nav
      className={`nav-sidebar ${expanded ? 'expanded' : ''}`}
      aria-label="Main navigation"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="nav-logo">
        <div className="nav-logo-icon">
          <ConnectSphereLogo size={24} />
        </div>
        {expanded && <span className="nav-logo-text">ConnectSphere</span>}
      </div>

      {/* Nav Items */}
      <ul className="nav-items" role="list">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to} role="listitem">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              aria-label={label}
              title={label}
            >
              <span className="nav-icon"><Icon size={24} /></span>
              {expanded && <span className="nav-label">{label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Bottom actions */}
      <div className="nav-bottom">
        <SOSButton inSidebar isExpanded={expanded} />
        
        <button className="nav-link" title="Notifications" aria-label="Notifications" onClick={() => navigate('/alerts')}>
          <span className="nav-icon"><MdNotifications size={22} /></span>
          {expanded && <span className="nav-label">Alerts</span>}
        </button>
        <button className="nav-link" title="Settings" aria-label="Settings" onClick={() => navigate('/settings')}>
          <span className="nav-icon"><MdSettings size={22} /></span>
          {expanded && <span className="nav-label">Settings</span>}
        </button>
      </div>
    </nav>
  )
}
