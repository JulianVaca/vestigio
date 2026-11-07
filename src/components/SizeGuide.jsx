import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { m as motion } from 'framer-motion'
import { CloseIcon } from './Icons.jsx'
import {
  SIZE_TABLES,
  LENGTH_COLUMNS,
  sizeFamily,
  fitOf,
  recommendSize,
  loadFitProfile,
  saveFitProfile,
} from '../data/sizing.js'

const TABS = [
  { id: 'find', label: 'Encuentra tu talla' },
  { id: 'table', label: 'Tabla de medidas' },
  { id: 'how', label: 'Cómo medir' },
]

/**
 * Guía de tallas en hoja lateral (diálogo modal accesible).
 * Incluye recomendador por estatura/peso o largo de pie, tabla cm/pulgadas e instrucciones.
 */
export default function SizeGuide({ product, onClose, onPick }) {
  const family = sizeFamily(product)
  const table = SIZE_TABLES[family]
  const fit = fitOf(product)
  const [tab, setTab] = useState('find')
  const [unit, setUnit] = useState('cm')
  const [profile, setProfile] = useState(() => loadFitProfile() ?? { height: '', weight: '', pref: 'regular', foot: '' })
  const [result, setResult] = useState(() => recommendSize(product, loadFitProfile()))
  const dialogRef = useRef(null)
  const lastFocus = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    lastFocus.current = document.activeElement
    dialogRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll('button, input, select, a[href]')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
      lastFocus.current?.focus?.()
    }
  }, [])

  const convert = (col, v) => {
    if (v === null || v === undefined) return '—'
    if (unit === 'in' && LENGTH_COLUMNS.has(col) && typeof v === 'number') return (v / 2.54).toFixed(1)
    return v
  }

  const submit = (e) => {
    e.preventDefault()
    saveFitProfile(profile)
    setResult(recommendSize(product, profile))
  }

  const rows = product.sizes.filter((s) => table.rows[s])

  return createPortal(
    <div className="sheet" role="presentation">
      <motion.div
        className="sheet__scrim"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={dialogRef}
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        tabIndex={-1}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      >
        <header className="sheet__head">
          <div>
            <p className="eyebrow">Atelier de tallas</p>
            <h2 id="size-guide-title" className="sheet__title">
              Guía de tallas
            </h2>
            <p className="sheet__sub">{product.name}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar guía de tallas">
            <CloseIcon />
          </button>
        </header>

        <div className="sheet__fit">
          <span className="sheet__fit-label">Calce · {fit.label}</span>
          <FitMeter value={fit.value} />
          <p>{fit.advice}</p>
        </div>

        <div className="seg" role="tablist" aria-label="Secciones de la guía">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`seg__btn ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'find' && (
          <form className="finder" onSubmit={submit}>
            {family === 'sneakers' ? (
              <label className="finder__field">
                <span>Largo de tu pie (cm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="22"
                  max="32"
                  step="0.1"
                  required
                  value={profile.foot}
                  onChange={(e) => setProfile({ ...profile, foot: e.target.value })}
                  placeholder="Ej. 26.3"
                />
              </label>
            ) : (
              <>
                <div className="finder__row">
                  <label className="finder__field">
                    <span>Estatura (cm)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="140"
                      max="215"
                      required
                      value={profile.height}
                      onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                      placeholder="Ej. 176"
                    />
                  </label>
                  <label className="finder__field">
                    <span>Peso (kg)</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="40"
                      max="160"
                      required
                      value={profile.weight}
                      onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                      placeholder="Ej. 72"
                    />
                  </label>
                </div>
                <fieldset className="finder__pref">
                  <legend>¿Cómo te gusta que te quede?</legend>
                  {[
                    ['ajustado', 'Ajustado'],
                    ['regular', 'Regular'],
                    ['amplio', 'Amplio'],
                  ].map(([v, l]) => (
                    <label key={v} className={`finder__chip ${profile.pref === v ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="fit-pref"
                        value={v}
                        checked={profile.pref === v}
                        onChange={() => setProfile({ ...profile, pref: v })}
                        className="sr-only"
                      />
                      {l}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            <button type="submit" className="btn btn--primary btn--block">
              Calcular mi talla
            </button>

            {result && (
              <motion.div className="finder__result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
                <span className="finder__result-label">Tu talla recomendada</span>
                <strong className="finder__result-size">{result}</strong>
                <p>
                  Calculada con el patronaje de esta prenda ({fit.label.toLowerCase()}). Tu perfil se guarda en este
                  navegador para marcar tu talla en todo el sitio.
                </p>
                {onPick && (
                  <button
                    type="button"
                    className="btn btn--gold btn--block"
                    onClick={() => {
                      onPick(result)
                      onClose()
                    }}
                  >
                    Seleccionar talla {result}
                  </button>
                )}
              </motion.div>
            )}
          </form>
        )}

        {tab === 'table' && (
          <div className="measures">
            <div className="measures__bar">
              <span>{table.note}</span>
              {family !== 'sneakers' && (
                <div className="unit-toggle" role="group" aria-label="Unidad de medida">
                  {['cm', 'in'].map((u) => (
                    <button key={u} className={unit === u ? 'is-active' : ''} aria-pressed={unit === u} onClick={() => setUnit(u)}>
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="measures__scroll">
              <table className="measures__table">
                <thead>
                  <tr>
                    <th scope="col">Talla</th>
                    {table.columns.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s} className={result === s ? 'is-rec' : ''}>
                      <th scope="row">{s}</th>
                      {table.rows[s].map((v, i) => (
                        <td key={i}>{convert(table.columns[i], v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'how' && (
          <ol className="howto">
            {(family === 'sneakers'
              ? [
                  ['Apoya el talón contra la pared', 'De pie, con calcetín y el peso repartido en ambos pies.'],
                  ['Marca el dedo más largo', 'Sobre una hoja en el piso, sin inclinar el lápiz.'],
                  ['Mide en centímetros', 'Usa la medida del pie más largo y suma 0.3 cm de holgura.'],
                ]
              : family === 'tops'
                ? [
                    ['Pecho', 'Rodea la parte más ancha del pecho, bajo las axilas, sin apretar.'],
                    ['Hombro', 'De la punta de un hombro a la otra por la espalda.'],
                    ['Compara con una prenda tuya', 'Mide en plano una prenda que te quede bien y compárala con la tabla.'],
                  ]
                : [
                    ['Cintura', 'Mide donde normalmente llevas el pantalón, sin cinturón.'],
                    ['Largo', 'Desde la cintura hasta donde quieres que caiga el bajo.'],
                    ['Tiro', 'De la entrepierna a la pretina por delante.'],
                  ]
            ).map(([t, d], i) => (
              <li key={t}>
                <span className="howto__n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{t}</strong>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

export function FitMeter({ value }) {
  return (
    <div className="fitmeter" aria-hidden="true">
      <div className="fitmeter__track">
        <span className="fitmeter__mark" style={{ left: `${value * 100}%` }} />
      </div>
      <div className="fitmeter__labels">
        <span>Ceñido</span>
        <span>Fiel</span>
        <span>Amplio</span>
      </div>
    </div>
  )
}
