import { useState, useCallback, useRef } from 'react'
import { MdSearch, MdClose } from 'react-icons/md'
import './SearchBar.css'

export default function SearchBar({ onSearch, placeholder = 'Search chats, people…' }) {
  const [query, setQuery]       = useState('')
  const [focused, setFocused]   = useState(false)
  const timerRef                = useRef(null)

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch?.(val), 300) // debounce
  }, [onSearch])

  const clear = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className={`search-bar ${focused ? 'focused' : ''}`} role="search">
      <MdSearch className="search-icon" size={20} />
      <input
        className="search-input"
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Search"
      />
      {query && (
        <button className="search-clear" onClick={clear} aria-label="Clear search">
          <MdClose size={18} />
        </button>
      )}
    </div>
  )
}
