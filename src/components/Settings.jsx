import { useEffect, useState } from 'react'

export default function Settings({
  theme, onThemeChange,
  keepAwake, onKeepAwakeChange,
  zoomed, onZoomedChange,
  zoomScale, onZoomScaleChange,
  autoHide, onAutoHideChange,
  hapticEnabled, onHapticEnabledChange,
  notesCount, onOpenNotes,
  warshReady, onRedownloadWarsh,
  onClose
}) {
  const [downloading, setDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState(null)
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
          {/* APPARENCE */}
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
            <h3>Zoom</h3>

            <label className="settings-toggle">
              <div className="toggle-info">
                <div className="toggle-label">Activer le zoom sur le texte</div>
                <div className="toggle-hint">
                  Agrandit la page pour mieux lire. Double-tap sur la page pour activer/désactiver.
                </div>
              </div>
              <div className={`toggle-switch ${zoomed ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={zoomed}
                  onChange={e => onZoomedChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>

            <div className="slider-block">
              <div className="slider-header">
                <span className="slider-label">Niveau de zoom</span>
                <span className="slider-value">×{zoomScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={zoomScale}
                onChange={e => onZoomScaleChange(parseFloat(e.target.value))}
                className="zoom-slider"
              />
              <div className="slider-marks">
                <span>×1.0</span>
                <span>×1.5</span>
                <span>×2.0</span>
              </div>
              <p className="settings-hint" style={{ margin: '8px 0 0' }}>
                Le réglage s'applique uniquement quand le zoom est activé. Valeur recommandée : ×1.45.
              </p>
            </div>
          </section>

          {/* LECTURE */}
          <section className="settings-section">
            <h3>Lecture</h3>

            <label className="settings-toggle">
              <div className="toggle-info">
                <div className="toggle-label">Masquer les barres automatiquement</div>
                <div className="toggle-hint">
                  Après 3 secondes d'inactivité. Touchez la page pour les faire revenir.
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

            <label className="settings-toggle" style={{ marginTop: 16 }}>
              <div className="toggle-info">
                <div className="toggle-label">Vibration tactile</div>
                <div className="toggle-hint">
                  Petite vibration au tournement de page et aux actions. Peut ne pas fonctionner sur tous les iPhones.
                </div>
              </div>
              <div className={`toggle-switch ${hapticEnabled ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={hapticEnabled}
                  onChange={e => onHapticEnabledChange(e.target.checked)}
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

          {/* TEXTE CORANIQUE */}
          <section className="settings-section">
            <h3>Texte coranique</h3>
            <p className="settings-hint">
              Texte du Saint Coran selon la lecture Warsh, utilisé pour afficher les versets dans vos notes.
            </p>
            <div className="warsh-status">
              <div className="warsh-status-row">
                <span className="warsh-status-label">État :</span>
                <span className={`warsh-status-value ${warshReady ? 'ready' : 'pending'}`}>
                  {warshReady ? '✓ Texte téléchargé' : 'Non téléchargé'}
                </span>
              </div>
              <button
                className="btn-secondary warsh-download-btn"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true)
                  setDownloadStatus(null)
                  try {
                    const ok = await onRedownloadWarsh()
                    setDownloadStatus(ok === false ? 'error' : 'success')
                  } catch {
                    setDownloadStatus('error')
                  } finally {
                    setDownloading(false)
                    setTimeout(() => setDownloadStatus(null), 3000)
                  }
                }}
              >
                {downloading
                  ? 'Téléchargement…'
                  : warshReady ? 'Re-télécharger' : 'Télécharger maintenant'}
              </button>
              {downloadStatus === 'error' && (
                <div className="warsh-status-msg error">
                  Échec. Vérifiez votre connexion Internet et réessayez.
                </div>
              )}
              {downloadStatus === 'success' && (
                <div className="warsh-status-msg success">
                  Texte téléchargé avec succès.
                </div>
              )}
            </div>
            <p className="settings-hint" style={{ marginTop: 8, fontSize: 11 }}>
              Source : fawazahmed0/quran-api (CC0 / domaine public). ~3 Mo, télécharge une seule fois.
            </p>
          </section>

          {/* À PROPOS */}
          <section className="settings-section settings-about">
            <h3>À propos</h3>
            <p className="about-text">
              <span className="arabic about-ar">القرآن الكريم</span>
              <span>Mushaf Warsh `an Nāfi`</span>
              <span className="about-sub">Calligraphie maghrébine tunisienne</span>
              <span className="about-sub">Édition Dar Al-Mushaf, Beyrouth</span>
              <span className="about-sub">App créée par Abu Hanaa</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
