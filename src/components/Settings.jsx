import { useEffect } from 'react'

export default function Settings({ theme, onThemeChange, keepAwake, onKeepAwakeChange, onClose }) {
  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="modal-backdrop settings-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <header className="settings-header">
          <h2>Réglages</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Fermer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <h3>Apparence</h3>
            <p className="settings-hint">Choisir le thème de lecture</p>
            <div className="theme-options">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                <div className="theme-preview theme-preview-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <span>Clair</span>
              </button>

              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                <div className="theme-preview theme-preview-dark">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <span>Sombre</span>
              </button>

              <button
                className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
                onClick={() => onThemeChange('auto')}
              >
                <div className="theme-preview theme-preview-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <span>Auto</span>
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Lecture</h3>
            <label className="settings-toggle">
              <div className="toggle-info">
                <div className="toggle-label">Garder l'écran allumé</div>
                <div className="toggle-hint">
                  Empêche l'iPhone de se verrouiller pendant la lecture
                </div>
              </div>
              <div className={`toggle-switch ${keepAwake ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={keepAwake}
                  onChange={e => onKeepAwakeChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </section>

          <section className="settings-section settings-about">
            <h3>À propos</h3>
            <p className="about-text">
              <span className="arabic about-ar">القرآن الكريم</span>
              <span>Mushaf Warsh `an Nāfi`</span>
              <span className="about-sub">Calligraphie maghrébine tunisienne</span>
              <span className="about-sub">Édition Dar Al-Mushaf, Beyrouth</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
