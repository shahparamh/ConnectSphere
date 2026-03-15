export default function ConnectSphereLogo({ size = 24, className = '', alt = 'ConnectSphere logo' }) {
  return (
    <img
      src="/logo-premium-removebg-preview.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain', 
        display: 'block',
        filter: 'drop-shadow(0 4px 12px rgba(var(--primary-rgb), 0.25))'
      }}
    />
  )
}
