import { useState, useMemo } from 'react'
import { fuzzyMatch, normalizeForSearch } from '../utils.js'

export default function SurahIndex({ surahs, currentPage, onSelect, onClose, totalPages }) {
  const [query, setQuery] = useState('')
  const [activeRub, setActiveRub] = useState('all')
  const [jumpInput, setJumpInput] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    return surahs.filter(s => {
      if (activeRub !== 'all' && s.rub !== activeRub) return false
      if (!q) return true

      // Numéro exact
      if (String(s.num) === q) return true

      // Recherche dans nom arabe (substring exact pour l'arabe)
      if (s.name_ar.includes(q)) return true

      // Recherche tolérante (fuzzy) sur la translittération
      if (fuzzyMatch(q, s.name_tr)) return true

      return false
    })
  }, [surahs, query, activeRub])

  const currentSurahNum = useMemo(() => {
    let current = null
    for (const s of surahs) {
      if (s.page_pdf <= currentPage) current = s
      else break
    }
    return current?.num
  }, [surahs, currentPage])

  const handleJump = (e) => {
    e.preventDefault()
    const n = parseInt(jumpInput, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onSelect(n)
      setJumpInput('')
    }
  }

  return (
    <div className="index-view page-transition">
      <header className="index-header">
        <button className="btn-icon" onClick={onClose} aria-label="Retour">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="index-title">Sommaire</h1>
        <div style={{ width: 44 }} />
      </header>

      <div className="index-search">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher une sourate (fateha, baqra, 36…)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')} aria-label="Effacer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="rub-tabs">
        {['all', 1, 2, 3, 4].map(r => (
          <button
            key={r}
            className={`rub-tab ${activeRub === r ? 'active' : ''}`}
            onClick={() => setActiveRub(r)}
          >
            {r === 'all' ? 'Tout' : `Rub\` ${r}`}
          </button>
        ))}
      </div>

      <div className="jump-bar">
        <form onSubmit={handleJump}>
          <label>Aller à la page :</label>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpInput}
            onChange={e => setJumpInput(e.target.value)}
            placeholder={`1 – ${totalPages}`}
            inputMode="numeric"
          />
          <button type="submit" className="btn-primary small">Ouvrir</button>
        </form>
      </div>

      <div className="surah-list">
        {filtered.length === 0 ? (
          <div className="empty">Aucune sourate trouvée</div>
        ) : (
          filtered.map(s => (
            <button
              key={s.num}
              className={`surah-item ${s.num === currentSurahNum ? 'current' : ''}`}
              onClick={() => onSelect(s.page_pdf)}
            >
              <div className="surah-num">
                <div className="num-badge">{s.num}</div>
              </div>
              <div className="surah-info">
                <div className="surah-names">
                  <span className="name-tr">{s.name_tr}</span>
                  <span className={`type-tag ${s.type === 'Md' ? 'madani' : 'makki'}`}>
                    {s.type === 'Md' ? 'Médinoise' : 'Mecquoise'}
                  </span>
                </div>
                <div className="surah-details">
                  {s.ayat} versets · Rub` {s.rub} · p. {s.page_printed}
                </div>
              </div>
              <div className="surah-arabic arabic">{s.name_ar}</div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
