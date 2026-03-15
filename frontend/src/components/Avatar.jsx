import './Avatar.css'

export default function Avatar({ initials = '??', size = 44, isOnline = false, src = null, color = null }) {
  const style = {
    width: size,
    height: size,
    minWidth: size,
    fontSize: size * 0.34,
    background: color || 'var(--gradient-primary)',
  }

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      {src ? (
        <img className="avatar-img" src={src} alt={initials} style={{ width: size, height: size }} />
      ) : (
        <div className="avatar-initials" style={style}>
          {initials}
        </div>
      )}
      {isOnline && (
        <span className="avatar-online-dot" aria-label="Online">
          <span className="avatar-online-ping" />
        </span>
      )}
    </div>
  )
}
