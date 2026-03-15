import { useContext, useState } from 'react'
import {
  MdLogout, MdShield, MdNotifications, MdPalette,
  MdHelp, MdChevronRight, MdCheck, MdLocationOn,
  MdPeople, MdVisibility,
  MdCamera, MdLink, MdBlock, MdDelete,
  MdDarkMode, MdLightMode, MdDevices, MdLock,
  MdTimer, MdNotificationsActive, MdNotificationsOff, MdDoneAll,
  MdMessage, MdVolumeUp, MdStar, MdHistory,
} from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { LocationContext } from '../context/LocationContext'
import Avatar from '../components/Avatar'
import './ProfilePage.css'

/* ── Toggle Switch ── */
function Toggle({ checked, onChange, id, label, disabled }) {
  return (
    <label htmlFor={id} className={`pp-toggle ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`} aria-label={label}>
      <input id={id} type="checkbox" className="pp-toggle-input" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} aria-checked={checked} disabled={disabled} />
      <span className="pp-toggle-track"><span className="pp-toggle-thumb" /></span>
    </label>
  )
}

/* ── Section Header ── */
function SectionHeader({ icon: Icon, title, color = 'var(--primary)' }) {
  const iconStyle = {
    background: color.startsWith('#') ? `${color}18` : 'rgba(var(--primary-rgb), 0.1)',
    color: color
  }
  return (
    <div className="pp-section-header">
      <div className="pp-section-icon" style={iconStyle}><Icon size={16} /></div>
      <h3 className="pp-section-title">{title}</h3>
    </div>
  )
}

/* ── Trusted Contacts ── */
const PERM_LABELS = { 'live-loc': '📍 Live Location', 'sos': '🆘 SOS Alerts', 'view-trip': '🗺️ Trip History' }

function TrustedContactsSection({ user, onSave }) {
  const [expanded, setExpanded] = useState(null)
  const contacts = user?.emergencyContacts && user.emergencyContacts.length > 0
    ? user.emergencyContacts
    : [
        { id: 'tc1', name: 'Sarah Chen', initials: 'SC', phone: '+91 98765 43210', isOnline: true, color: '#3A6FF7', perms: ['live-loc', 'sos'] },
        { id: 'tc2', name: 'David Kumar', initials: 'DK', phone: '+91 987 6510987', isOnline: false, color: '#7A5AF8', perms: ['sos'] },
        { id: 'tc3', name: 'Mom', initials: 'MO', phone: '+91 99887 76655', isOnline: true, color: '#F43F5E', perms: ['live-loc', 'sos', 'view-trip'] },
      ]

  const updateContacts = (newContacts) => onSave({ emergencyContacts: newContacts })
  const togglePerm = (cid, perm) => {
    const updated = contacts.map(c => {
      if (c.id !== cid) return c
      const hasPerm = c.perms?.includes(perm)
      return { ...c, perms: hasPerm ? c.perms.filter(p => p !== perm) : [...(c.perms || []), perm] }
    })
    updateContacts(updated)
  }
  const removeTrusted = (id) => updateContacts(contacts.filter(c => c.id !== id))
  const addTrusted = () => {
    const newC = { id: `tc${Date.now()}`, name: 'New Contact', initials: 'NC', phone: '+91 90000 00000', isOnline: false, color: '#10B981', perms: ['sos'] }
    updateContacts([...contacts, newC])
  }

  return (
    <section className="pp-section" aria-label="Trusted contacts">
      <SectionHeader icon={MdPeople} title="Trusted Contacts" color="#3A6FF7" />
      <p className="pp-section-desc">These people can see your live location and receive SOS alerts.</p>
      <div className="pp-tc-list">
        {contacts.map(c => {
          const permCount = c.perms?.length || 0
          const isExp = expanded === c.id
          return (
            <div key={c.id} className="pp-tc-card">
              <button className="pp-tc-header" onClick={() => setExpanded(isExp ? null : c.id)} aria-expanded={isExp}>
                <Avatar initials={c.initials} size={40} isOnline={c.isOnline} color={c.color} />
                <div className="pp-tc-info">
                  <p className="pp-tc-name">{c.name}</p>
                  <p className="pp-tc-phone">{c.phone}</p>
                </div>
                <div className="pp-tc-perms-preview">{permCount} permission{permCount !== 1 ? 's' : ''}</div>
                <MdChevronRight size={18} className={`pp-tc-chevron ${isExp ? 'open' : ''}`} />
              </button>
              {isExp && (
                <div className="pp-tc-perms animate-fadeInUp">
                  {Object.entries(PERM_LABELS).map(([key, label]) => (
                    <div key={key} className="pp-perm-row">
                      <span className="pp-perm-label">{label}</span>
                      <Toggle id={`${c.id}-${key}`} checked={c.perms?.includes(key)} onChange={() => togglePerm(c.id, key)} label={`${label} for ${c.name}`} />
                    </div>
                  ))}
                  <button className="pp-tc-remove" onClick={() => removeTrusted(c.id)}>
                    <MdDelete size={14} /> Remove from trusted
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button className="pp-tc-add-btn" onClick={addTrusted}>+ Add Trusted Contact</button>
    </section>
  )
}

/* ── Location Permissions ── */
function LocationPermissionsSection({ user, onSave, isSharing, stopSharing }) {
  const currentSettings = user?.settings?.location || { allowAll: true, trustedOnly: false, shareWithGroups: true, showOnMap: true, preciseLocation: true, defaultDuration: '1h' }
  const [liveDuration, setLiveDuration] = useState(currentSettings.defaultDuration)
  const toggle = (key) => onSave({ settings: { ...user?.settings, location: { ...currentSettings, [key]: !currentSettings[key] } } })
  const handleDurationChange = (val) => { setLiveDuration(val); onSave({ settings: { ...user?.settings, location: { ...currentSettings, defaultDuration: val } } }) }
  const LOC_ROWS = [
    { key: 'allowAll', label: 'Allow location sharing', desc: 'Contacts can request your location' },
    { key: 'trustedOnly', label: 'Trusted contacts only', desc: 'Restrict to trusted contacts list' },
    { key: 'shareWithGroups', label: 'Share in groups', desc: 'Enable location in group chats' },
    { key: 'showOnMap', label: 'Appear on live map', desc: 'Others can see you on the map' },
    { key: 'preciseLocation', label: 'Precise location', desc: 'Use GPS (vs approximate area only)' },
  ]
  return (
    <section className="pp-section" aria-label="Location permissions">
      <SectionHeader icon={MdLocationOn} title="Location Permissions" color="#10B981" />
      {isSharing ? (
        <div className="pp-loc-banner pp-loc-active" role="status">
          <span className="pp-loc-dot" aria-hidden /><p>Live location is currently being shared</p>
          <button className="pp-loc-stop" onClick={stopSharing} aria-label="Stop sharing location">Stop</button>
        </div>
      ) : (
        <div className="pp-loc-banner" role="status"><MdLocationOn size={14} /><p>Not currently sharing live location</p></div>
      )}
      <div className="pp-setting-row pp-setting-block">
        <div className="pp-setting-text">
          <p className="pp-setting-label"><MdTimer size={14} /> Default sharing duration</p>
          <p className="pp-setting-desc">Applied when you tap "Share location"</p>
        </div>
        <div className="pp-dur-chips" role="group" aria-label="Default duration options">
          {[['15m', '15 min'], ['1h', '1 hour'], ['8h', '8 hours'], ['inf', 'No limit']].map(([val, lbl]) => (
            <button key={val} className={`pp-dur-chip ${liveDuration === val ? 'active' : ''}`} onClick={() => handleDurationChange(val)} aria-pressed={liveDuration === val}>{lbl}</button>
          ))}
        </div>
      </div>
      <div className="pp-toggle-list">
        {LOC_ROWS.map(({ key, label, desc }) => (
          <div key={key} className="pp-setting-row">
            <div className="pp-setting-text"><p className="pp-setting-label">{label}</p><p className="pp-setting-desc">{desc}</p></div>
            <Toggle id={`loc-${key}`} checked={currentSettings[key]} onChange={() => toggle(key)} label={label} />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Notifications ── */
function NotificationSection({ user, onSave }) {
  const currentSettings = user?.settings?.notifications || { messages: true, sos: true, locationReq: true, groupAlerts: true, sounds: true, vibration: true, emailDigest: false, quietHours: false }
  const toggle = (key) => onSave({ settings: { ...user?.settings, notifications: { ...currentSettings, [key]: !currentSettings[key] } } })
  const NOTIF_GROUPS = [
    { label: 'Alerts', rows: [
      { key: 'messages', icon: MdMessage, label: 'Messages', desc: 'New chat messages' },
      { key: 'sos', icon: MdNotificationsActive, label: 'SOS Alerts', desc: 'Emergency alerts from contacts' },
      { key: 'locationReq', icon: MdLocationOn, label: 'Location Requests', desc: 'When a contact requests your location' },
      { key: 'groupAlerts', icon: MdPeople, label: 'Group Activity', desc: 'Messages and updates in groups' },
    ]},
    { label: 'Sound & Haptics', rows: [
      { key: 'sounds', icon: MdVolumeUp, label: 'Notification Sounds', desc: 'Play alert sounds' },
      { key: 'vibration', icon: MdDevices, label: 'Vibration', desc: 'Haptic feedback' },
      { key: 'quietHours', icon: MdNotificationsOff, label: 'Quiet Hours (10pm–7am)', desc: 'Silence non-urgent alerts' },
    ]},
    { label: 'Other', rows: [
      { key: 'emailDigest', icon: MdLink, label: 'Weekly Email Digest', desc: 'Summary of activity' },
    ]},
  ]
  return (
    <section className="pp-section" aria-label="Notification settings">
      <SectionHeader icon={MdNotifications} title="Notifications" color="#F59E0B" />
      {NOTIF_GROUPS.map(({ label, rows }) => (
        <div key={label} className="pp-notif-group">
          <p className="pp-notif-group-label">{label}</p>
          <div className="pp-toggle-list">
            {rows.map(({ key, icon: Icon, label: lbl, desc }) => (
              <div key={key} className="pp-setting-row">
                <div className="pp-setting-icon-text">
                  <div className="pp-setting-icon"><Icon size={16} /></div>
                  <div className="pp-setting-text"><p className="pp-setting-label">{lbl}</p><p className="pp-setting-desc">{desc}</p></div>
                </div>
                <Toggle id={`notif-${key}`} checked={currentSettings[key]} onChange={() => toggle(key)} label={lbl} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ── Appearance ── */
function AppearanceSection({ user, onSave }) {
  const currentSettings = user?.settings?.appearance || { theme: 'system', fontSize: 'medium', accentIdx: 0 }
  const THEMES = [
    { id: 'light', label: 'Light', icon: MdLightMode },
    { id: 'dark', label: 'Dark', icon: MdDarkMode },
    { id: 'system', label: 'System', icon: MdDevices },
  ]
  const ACCENTS = ['#3A6FF7', '#7A5AF8', '#10B981', '#F43F5E', '#F59E0B', '#06B6D4']
  const FONT_SIZES = [
    { id: 'small', label: 'Small', sample: 'Aa' },
    { id: 'medium', label: 'Medium', sample: 'Aa' },
    { id: 'large', label: 'Large', sample: 'Aa' },
  ]
  const handleChange = (key, val) => onSave({ settings: { ...user?.settings, appearance: { ...currentSettings, [key]: val } } })
  return (
    <section className="pp-section" aria-label="Appearance settings">
      <SectionHeader icon={MdPalette} title="Appearance" color="#7A5AF8" />
      <div className="pp-appear-group">
        <p className="pp-appear-label">Theme</p>
        <div className="pp-theme-grid" role="group" aria-label="Select theme">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`pp-theme-card ${currentSettings.theme === id ? 'active' : ''}`} onClick={() => handleChange('theme', id)} aria-pressed={currentSettings.theme === id} aria-label={`${label} theme`}>
              <div className={`pp-theme-preview pp-theme-${id}`} aria-hidden>
                <div className="pp-theme-bar" /><div className="pp-theme-line" /><div className="pp-theme-line pp-theme-line-short" />
              </div>
              <Icon size={16} /><span>{label}</span>
              {currentSettings.theme === id && <MdCheck size={13} className="pp-theme-tick" />}
            </button>
          ))}
        </div>
      </div>
      <div className="pp-appear-group">
        <p className="pp-appear-label">Accent Colour</p>
        <div className="pp-accent-row" role="group" aria-label="Accent colour options">
          {ACCENTS.map((c, i) => (
            <button key={c} className={`pp-accent-swatch ${currentSettings.accentIdx === i ? 'active' : ''}`} style={{ background: c }} onClick={() => handleChange('accentIdx', i)} aria-pressed={currentSettings.accentIdx === i} aria-label={`Accent colour ${i + 1}`}>
              {currentSettings.accentIdx === i && <MdCheck size={13} color="white" />}
            </button>
          ))}
        </div>
      </div>
      <div className="pp-appear-group">
        <p className="pp-appear-label">Text Size</p>
        <div className="pp-font-row" role="group" aria-label="Text size options">
          {FONT_SIZES.map(({ id, label, sample }, i) => (
            <button key={id} className={`pp-font-btn ${currentSettings.fontSize === id ? 'active' : ''}`} onClick={() => handleChange('fontSize', id)} aria-pressed={currentSettings.fontSize === id} aria-label={`${label} text size`}>
              <span style={{ fontSize: 10 + i * 3 }}>{sample}</span>
              <span className="pp-font-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Privacy & Security ── */
function PrivacySection({ user, onSave, navigate }) {
  const currentSettings = user?.settings?.privacy || { lastSeen: 'everyone', profilePhoto: 'contacts', onlineStatus: 'everyone', readReceipts: true, twoFA: false }
  const handleChange = (key, val) => onSave({ settings: { ...user?.settings, privacy: { ...currentSettings, [key]: val } } })
  const toggle = (key) => handleChange(key, !currentSettings[key])
  const VISIBILITY_OPTIONS = ['everyone', 'contacts', 'nobody']
  return (
    <section className="pp-section" aria-label="Privacy and security settings">
      <SectionHeader icon={MdShield} title="Privacy & Security" color="#F43F5E" />
      {[
        { key: 'lastSeen', label: 'Last Seen', icon: MdHistory },
        { key: 'profilePhoto', label: 'Profile Photo', icon: MdCamera },
        { key: 'onlineStatus', label: 'Online Status', icon: MdVisibility },
      ].map(({ key, label, icon: Icon }) => (
        <div key={key} className="pp-setting-row pp-setting-row-col">
          <div className="pp-setting-icon-text">
            <div className="pp-setting-icon"><Icon size={16} /></div>
            <p className="pp-setting-label">{label}</p>
          </div>
          <div className="pp-vis-chips" role="group" aria-label={`${label} visibility`}>
            {VISIBILITY_OPTIONS.map(opt => (
              <button key={opt} className={`pp-vis-chip ${currentSettings[key] === opt ? 'active' : ''}`} onClick={() => handleChange(key, opt)} aria-pressed={currentSettings[key] === opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="pp-toggle-list">
        <div className="pp-setting-row">
          <div className="pp-setting-icon-text">
            <div className="pp-setting-icon"><MdDoneAll size={16} /></div>
            <div className="pp-setting-text"><p className="pp-setting-label">Read Receipts</p><p className="pp-setting-desc">Show blue ticks when you read messages</p></div>
          </div>
          <Toggle id="read-receipts" checked={currentSettings.readReceipts} onChange={() => toggle('readReceipts')} label="Read receipts" />
        </div>
        <div className="pp-setting-row">
          <div className="pp-setting-icon-text">
            <div className="pp-setting-icon"><MdLock size={16} /></div>
            <div className="pp-setting-text">
              <p className="pp-setting-label">Two-Factor Authentication</p>
              <p className="pp-setting-desc">{currentSettings.twoFA ? '✓ Enabled — your account is extra secure' : 'Add an extra layer of security'}</p>
            </div>
          </div>
          <Toggle id="twofa" checked={currentSettings.twoFA} onChange={() => toggle('twoFA')} label="Two-factor authentication" />
        </div>
      </div>
      <div className="pp-danger-zone">
        <button className="pp-danger-btn" aria-label="Block users" onClick={() => navigate('/help')}><MdBlock size={16} /> Blocked Users (0)</button>
        <button className="pp-danger-btn pp-danger-red" aria-label="Delete account" onClick={() => navigate('/help')}><MdDelete size={16} /> Delete Account</button>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────
   SettingsPage — Root Export
 ────────────────────────────────────── */
export default function SettingsPage() {
  const { user, saveProfile, logout } = useContext(AuthContext)
  const { isSharing, stopSharing } = useContext(LocationContext)
  const navigate = useNavigate()

  const handleSave = async (data) => {
    await saveProfile(data)
  }

  return (
    <div className="pp-root">
      <header className="pp-topbar">
        <h1 className="pp-topbar-title">Settings</h1>
      </header>

      <div className="pp-scroll">
        <TrustedContactsSection user={user} onSave={handleSave} />
        <LocationPermissionsSection user={user} onSave={handleSave} isSharing={isSharing} stopSharing={stopSharing} />
        <NotificationSection user={user} onSave={handleSave} />
        <AppearanceSection user={user} onSave={handleSave} />
        <PrivacySection user={user} onSave={handleSave} navigate={navigate} />

        <section className="pp-section pp-links-section" aria-label="Quick links">
          {[
            { icon: MdHelp, label: 'Help & Support', desc: 'FAQ, contact us' },
            { icon: MdLink, label: 'Terms & Privacy', desc: 'Legal documents' },
            { icon: MdStar, label: 'Rate the App', desc: 'Leave a review' },
          ].map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              className="pp-link-row"
              aria-label={label}
              onClick={() => {
                if (label === 'Help & Support') navigate('/help')
                if (label === 'Terms & Privacy') navigate('/privacy')
                if (label === 'Rate the App') window.open('https://github.com/', '_blank', 'noreferrer')
              }}
            >
              <div className="pp-link-icon"><Icon size={18} /></div>
              <div className="pp-link-text">
                <p className="pp-link-label">{label}</p>
                <p className="pp-link-desc">{desc}</p>
              </div>
              <MdChevronRight size={18} className="pp-link-chevron" />
            </button>
          ))}
        </section>

        <button className="pp-logout-btn" onClick={() => { logout(); navigate('/login') }} aria-label="Sign out of ConnectSphere">
          <MdLogout size={18} />
          Sign Out
        </button>

        <p className="pp-version">ConnectSphere v1.0.0 · Build 2026.03</p>
      </div>
    </div>
  )
}
