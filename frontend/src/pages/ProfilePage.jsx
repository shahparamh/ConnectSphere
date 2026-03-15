import { useContext, useState } from 'react'
import {
  MdEdit, MdChevronRight, MdCheck, MdCamera,
} from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import './ProfilePage.css'

/* ──────────────────────────────────────
   Profile Card
 ────────────────────────────────────── */
function ProfileCard({ user, onSave }) {
  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(user?.name || 'Demo User')
  const [bio, setBio] = useState(user?.bio || 'Staying connected, staying safe 🛡️')
  const [status, setStatus] = useState(user?.status || 'online')
  const [editStatus, setEditStatus] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarPos, setAvatarPos] = useState({ x: 0, y: 0 })

  const STATUS_OPTIONS = [
    { id: 'online', label: 'Online', color: '#10B981' },
    { id: 'away', label: 'Away', color: '#F59E0B' },
    { id: 'busy', label: 'Busy', color: '#EF4444' },
    { id: 'invisible', label: 'Invisible', color: '#94A3B8' },
  ]

  const curStatus = STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[0]
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : 'March 2026'

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleBlur = () => {
    setEditName(false)
    if (name !== user?.name) onSave({ name })
  }

  const handleBioBlur = () => {
    if (bio !== user?.bio) onSave({ bio })
  }

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    setEditStatus(false)
    onSave({ status: newStatus })
  }

  return (
    <div className="pp-profile-card">
      <div className="pp-card-bg" aria-hidden />

      <div className="pp-avatar-wrap">
        <Avatar src={user?.avatar} initials={initials} size={88} isOnline={status === 'online'} color="var(--primary)" />
        <label className="pp-avatar-edit" aria-label="Change profile photo" htmlFor="avatar-upload">
          <MdCamera size={16} />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setAvatarPreview(reader.result);
                  setAvatarZoom(1);
                  setAvatarPos({ x: 0, y: 0 });
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Avatar Adjust Modal */}
      {avatarPreview && (
        <div className="pp-avatar-modal-overlay" onClick={() => setAvatarPreview(null)}>
          <div className="pp-avatar-modal" onClick={e => e.stopPropagation()}>
            <h3 className="pp-avatar-modal-title">Adjust Profile Picture</h3>
            <div className="pp-avatar-preview-wrap">
              <div className="pp-avatar-preview-circle">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="pp-avatar-preview-img"
                  style={{
                    transform: `scale(${avatarZoom}) translate(${avatarPos.x}px, ${avatarPos.y}px)`,
                  }}
                  draggable={false}
                />
              </div>
            </div>
            <div className="pp-avatar-controls">
              <label className="pp-avatar-control-label">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={avatarZoom}
                onChange={e => setAvatarZoom(parseFloat(e.target.value))}
                className="pp-avatar-slider"
              />
              <label className="pp-avatar-control-label">Horizontal</label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={avatarPos.x}
                onChange={e => setAvatarPos(p => ({ ...p, x: parseInt(e.target.value) }))}
                className="pp-avatar-slider"
              />
              <label className="pp-avatar-control-label">Vertical</label>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={avatarPos.y}
                onChange={e => setAvatarPos(p => ({ ...p, y: parseInt(e.target.value) }))}
                className="pp-avatar-slider"
              />
            </div>
            <div className="pp-avatar-modal-actions">
              <button className="btn-secondary" onClick={() => setAvatarPreview(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                onSave({ avatar: avatarPreview });
                setAvatarPreview(null);
              }}>Save Photo</button>
            </div>
          </div>
        </div>
      )}

      <div className="pp-name-row">
        {editName ? (
          <input
            className="pp-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => e.key === 'Enter' && handleBlur()}
            autoFocus
            aria-label="Edit your name"
            maxLength={40}
          />
        ) : (
          <h2 className="pp-name" onClick={() => setEditName(true)}>
            {name}
            <MdEdit size={15} className="pp-edit-inline" />
          </h2>
        )}
      </div>

      <p className="pp-email">{user?.email || 'demo@connectsphere.app'}</p>
      <p className="pp-phone-info">📱 {user?.phoneNumber || user?.phone || 'No phone number added'}</p>

      <div className="pp-bio-wrap">
        <textarea
          className="pp-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          onBlur={handleBioBlur}
          rows={2}
          maxLength={120}
          aria-label="Add a short bio…"
          placeholder="Add a short bio…"
        />
        <span className="pp-bio-count">{bio.length}/120</span>
      </div>

      <div className="pp-status-row">
        <button
          className="pp-status-btn"
          onClick={() => setEditStatus(o => !o)}
          aria-label="Change status"
          style={{ '--status-color': curStatus.color }}
        >
          <span className="pp-status-dot" style={{ background: curStatus.color }} aria-hidden />
          {curStatus.label}
          <MdChevronRight size={16} className={`pp-status-chevron ${editStatus ? 'open' : ''}`} />
        </button>
        {editStatus && (
          <div className="pp-status-menu" role="listbox" aria-label="Select status">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.id}
                role="option"
                aria-selected={status === s.id}
                className={`pp-status-option ${status === s.id ? 'selected' : ''}`}
                onClick={() => handleStatusChange(s.id)}
              >
                <span className="pp-status-dot" style={{ background: s.color }} aria-hidden />
                {s.label}
                {status === s.id && <MdCheck size={14} className="pp-status-tick" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pp-stats-row">
        {[
          { n: '247', l: 'Messages' },
          { n: '12', l: 'Contacts' },
          { n: '5', l: 'Groups' },
          { n: '3', l: 'Trusted' },
        ].map(({ n, l }, i, arr) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="pp-stat">
              <p className="pp-stat-n">{n}</p>
              <p className="pp-stat-l">{l}</p>
            </div>
            {i < arr.length - 1 && <div className="pp-stat-div" />}
          </div>
        ))}
      </div>

      <p className="pp-joined">Member since {joinDate}</p>
    </div>
  )
}

/* ──────────────────────────────────────
   ProfilePage — Root Export
 ────────────────────────────────────── */
export default function ProfilePage() {
  const { user, saveProfile } = useContext(AuthContext)

  const handleSave = async (data) => {
    await saveProfile(data)
  }

  return (
    <div className="pp-root">
      <header className="pp-topbar">
        <h1 className="pp-topbar-title">Profile</h1>
      </header>

      <div className="pp-scroll">
        <ProfileCard user={user} onSave={handleSave} />
      </div>
    </div>
  )
}
