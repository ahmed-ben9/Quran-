import { useEffect } from 'react'

export default function Settings({
  theme, onThemeChange,
  keepAwake, onKeepAwakeChange,
  zoomLevel, onZoomLevelChange,
  autoHide, onAutoHideChange,
  notesCount, onOpenNotes,
  onClose
}) {
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
          {/* THÈME */}
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

          {/* ZOOM */}
          <section className="settings-section">
            <h3>Taille de la page</h3>
            <p className="settings-hint">Niveau de zoom pour la lecture</p>
            <div className="zoom-options">
              <button
                className={`zoom-option ${zoomLevel === 'normal' ? 'active' : ''}`}
                onClick={() => onZoomLevelChange('normal')}
              >
                <div className="zoom-preview zoom-preview-normal">
                  <div className="zoom-page">
                    <div className="zoom-page-lines">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
                <span>Normal</span>
                <small>Page entière</small>
              </button>

              <button
                className={`zoom-option ${zoomLevel === 'medium' ? 'active' : ''}`}
                onClick={() => onZoomLevelChange('medium')}
              >
                <div className="zoom-preview zoom-preview-medium">
                  <div className="zoom-page medium">
                    <div className="zoom-page-lines">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
                <span>Moyen</span>
                <small>Zoom léger</small>
              </button>

              <button
                className={`zoom-option ${zoomLevel === 'large' ? 'active' : ''}`}
                onClick={() => onZoomLevelChange('large')}
              >
                <div className="zoom-preview zoom-preview-large">
                  <div className="zoom-page large">
                    <div className="zoom-page-lines">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
                <span>Grand</span>
                <small>Texte maximal</small>
              </button>
            </div>
            <p className="settings-hint" style={{ marginTop: 10 }}>
              Vous pouvez aussi changer rapidement via l'icône loupe en haut.
            </p>
          </section>

          {/* LECTURE */}
          <section className="settings-section">
            <h3>Lecture</h3>

            <label className="settings-toggle">
              <div className="toggle-info">
                <div className="toggle-label">Masquer les barres automatiquement</div>
                <div className="toggle-hint">
                  Après 3 secondes d'inactivité — touchez la page pour les faire revenir
                </div>
              </div>
              <div className={`toggle-switch ${autoHide ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={autoHide}
                  onChange={e => onAutoHideChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>

            <label className="settings-toggle" style={{ marginTop: 16 }}>
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

          {/* NOTES */}
          <section className="settings-section">
            <h3>Mes notes</h3>
            <button className="settings-row" onClick={onOpenNotes}>
              <div className="row-info">
                <div className="row-label">Consulter mes notes</div>
                <div className="row-hint">
                  {notesCount === 0
                    ? "Aucune note pour l'instant"
                    : notesCount === 1
                    ? "1 note enregistrée"
                    : `${notesCount} notes enregistrées`}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="row-arrow">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </section>

          {/* À PROPOS */}
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
