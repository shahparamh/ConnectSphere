export default function NotificationBadge({ count = 0 }) {
  if (!count) return null
  return (
    <span
      className="badge"
      role="status"
      aria-label={`${count} unread messages`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
