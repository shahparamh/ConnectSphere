import { NavLink } from 'react-router-dom'
import { MdDashboard, MdChat, MdLocationOn, MdPerson } from 'react-icons/md'
import './BottomNav.css'

const TABS = [
  { to: '/dashboard', icon: MdDashboard,  label: 'Home'    },
  { to: '/chat/r1',   icon: MdChat,       label: 'Chats'   },
  { to: '/map',       icon: MdLocationOn, label: 'Map'     },
  { to: '/profile',   icon: MdPerson,     label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
          aria-label={label}
        >
          <span className="bottom-tab-icon"><Icon size={24} /></span>
          <span className="bottom-tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
