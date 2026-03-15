import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * SettingsManager - Non-visual component that applies user appearance 
 * preferences (theme, accent color, font size) to the document root.
 */
export default function SettingsManager() {
  const { user } = useAuth()
  const lastSettingsRef = useRef(null)

  useEffect(() => {
    if (!user?.settings) return

    const { appearance } = user.settings
    if (!appearance) return

    // Avoid redundant updates
    const settingsStr = JSON.stringify(appearance)
    if (lastSettingsRef.current === settingsStr) return
    lastSettingsRef.current = settingsStr

    const root = document.documentElement
    const { theme, accentIdx, fontSize } = appearance

    // 1. Apply Theme
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      // System - check media query
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    // 2. Apply Accent Color
    const ACCENTS = [
      { hex: '#3b82f6', rgb: '59, 130, 246', dark: '#2563eb', light: '#7cb3ff' }, // Blue (Default)
      { hex: '#7c5cff', rgb: '124, 92, 255', dark: '#6547ea', light: '#a78bfa' }, // Indigo/Purple
      { hex: '#10b981', rgb: '16, 185, 129', dark: '#059669', light: '#6ee7b7' }, // Green
      { hex: '#f43f5e', rgb: '244, 63, 94',  dark: '#e11d48', light: '#fda4af' }, // Rose/Red
      { hex: '#f59e0b', rgb: '245, 158, 11', dark: '#d97706', light: '#fcd34d' }, // Amber/Orange
      { hex: '#06b6d4', rgb: '6, 182, 212',  dark: '#0891b2', light: '#67e8f9' }, // Cyan
    ]
    const accent = ACCENTS[accentIdx] || ACCENTS[0]
    
    root.style.setProperty('--primary', accent.hex)
    root.style.setProperty('--primary-rgb', accent.rgb)
    root.style.setProperty('--primary-dark', accent.dark)
    root.style.setProperty('--primary-light', accent.light)

    // 3. Apply Font Size
    const FONT_SIZES = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    root.style.setProperty('--font-size-base', FONT_SIZES[fontSize] || '16px')

  }, [user])

  return null
}
