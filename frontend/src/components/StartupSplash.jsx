import { useEffect, useState } from 'react'
import ConnectSphereLogo from './ConnectSphereLogo'

export default function StartupSplash({ onFinish }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 2200)
    const finishTimer = setTimeout(() => onFinish?.(), 2700)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div className={`startup-splash ${visible ? 'visible' : 'hidden'}`} aria-label="ConnectSphere loading screen">
      <div className="startup-orb startup-orb-1" aria-hidden />
      <div className="startup-orb startup-orb-2" aria-hidden />
      <div className="startup-grid" aria-hidden />

      <div className="startup-content">
        <div className="startup-logo-wrap">
          <ConnectSphereLogo size={86} />
        </div>
        <h1 className="startup-brand">ConnectSphere</h1>
        <p className="startup-quote">"Stay connected. Stay safe. Every sphere matters."</p>
        <div className="startup-loader" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
