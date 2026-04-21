import { useState } from 'react'

const TOTAL = 532

export default function Welcome({ onContinue, onDownloadComplete, alreadyDownloaded }) {
  const [step, setStep] = useState('intro') // intro | downloading | done
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Pré-télécharge toutes les pages pour les mettre dans le cache du service worker
  const downloadAll = async () => {
    setStep('downloading')
    setError(null)
    setProgress(0)
    let done = 0

    // Batch par 8 pour ne pas saturer
    const BATCH = 8
    try {
      for (let i = 1; i <= TOTAL; i += BATCH) {
        const batch = []
        for (let j = i; j < Math.min(i + BATCH, TOTAL + 1); j++) {
          const url = `/pages/${String(j).padStart(3, '0')}.webp`
          batch.push(
            fetch(url, { cache: 'reload' }).then(r => r.blob()).catch(() => null)
          )
        }
        await Promise.all(batch)
        done = Math.min(i + BATCH - 1, TOTAL)
        setProgress(done)
      }
      onDownloadComplete()
      setStep('done')
    } catch (e) {
      setError("Téléchargement interrompu. Vous pouvez réessayer.")
      setStep('intro')
    }
  }

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <div className="welcome-ornament">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="var(--gold)" strokeWidth="1" />
            <circle cx="50" cy="50" r="38" stroke="var(--gold)" strokeWidth="0.5" />
            <path d="M50 12 L54 48 L88 50 L54 52 L50 88 L46 52 L12 50 L46 48 Z"
                  fill="var(--gold)" opacity="0.9" />
          </svg>
        </div>

        <h1 className="welcome-title">
          <span className="arabic">القرآن الكريم</span>
          <span className="welcome-sub">Mushaf Warsh – Lecture Warsh `an Nāfi`</span>
        </h1>

        {step === 'intro' && (
          <>
            <p className="welcome-text">
              Cette application vous permet de lire le Coran hors-ligne sur votre téléphone,
              avec un sommaire des 114 sourates, des marque-pages et la reprise automatique
              de votre lecture.
            </p>

            {!alreadyDownloaded ? (
              <>
                <div className="welcome-card">
                  <h3>Télécharger pour lire hors-ligne</h3>
                  <p>
                    L'application va télécharger les 532 pages (~40 Mo). Une fois terminé,
                    aucune connexion Internet ne sera nécessaire pour la lecture.
                  </p>
                </div>
                {error && <div className="welcome-error">{error}</div>}
                <button className="btn-primary large" onClick={downloadAll}>
                  Télécharger et continuer
                </button>
                <button className="btn-link" onClick={onContinue}>
                  Passer (télécharger plus tard)
                </button>
              </>
            ) : (
              <button className="btn-primary large" onClick={onContinue}>
                Commencer la lecture
              </button>
            )}
          </>
        )}

        {step === 'downloading' && (
          <>
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(progress / TOTAL) * 100}%` }} />
              </div>
              <div className="progress-text">
                {progress} / {TOTAL} pages
              </div>
            </div>
            <p className="welcome-text small">
              Merci de garder l'application ouverte pendant le téléchargement.
            </p>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="welcome-check">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="welcome-text">Téléchargement terminé. L'application fonctionne maintenant hors-ligne.</p>
            <button className="btn-primary large" onClick={onContinue}>
              Commencer la lecture
            </button>
          </>
        )}
      </div>
    </div>
  )
}
