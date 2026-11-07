import { useMemo, useRef, useState } from 'react'
import { formatPrice } from '../data/products.js'
import { formatDate, formatPct } from '../data/market.js'

const RANGES = [
  { id: '1M', days: 30 },
  { id: '3M', days: 90 },
  { id: '6M', days: 180 },
  { id: '1A', days: 365 },
]
const W = 800
const H = 260
const PAD_T = 14
const PAD_B = 10

/**
 * Historial de precio de reventa (una serie) con línea de referencia del precio de lista.
 * Cruz + tooltip al pasar el cursor o arrastrar el dedo; flechas del teclado para recorrer los días.
 */
export default function PriceChart({ history, retail, title = 'Historial de precio' }) {
  const [range, setRange] = useState('3M')
  const [hover, setHover] = useState(null)
  const ref = useRef(null)

  const days = RANGES.find((r) => r.id === range).days
  const data = useMemo(() => history.slice(-days - 1), [history, days])
  const { min, max, line, area } = useMemo(() => {
    const prices = data.map((d) => d.price)
    let lo = Math.min(...prices, retail)
    let hi = Math.max(...prices, retail)
    const pad = (hi - lo) * 0.12 || hi * 0.05
    lo -= pad
    hi += pad
    const pts = data.map((d, i) => [(i / (data.length - 1)) * W, PAD_T + (1 - (d.price - lo) / (hi - lo)) * (H - PAD_T - PAD_B)])
    const l = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    return { min: lo, max: hi, line: l, area: `${l} L${W} ${H} L0 ${H} Z` }
  }, [data, retail])

  const y = (v) => PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B)
  const first = data[0].price
  const last = data[data.length - 1].price
  const change = (last - first) / first
  const ticks = [max - (max - min) * 0.15, (max + min) / 2, min + (max - min) * 0.15]

  const pick = (clientX) => {
    const r = ref.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    setHover(Math.round(t * (data.length - 1)))
  }

  const h = hover !== null ? data[hover] : null
  const hx = hover !== null ? (hover / (data.length - 1)) * 100 : 0
  const hy = h ? (y(h.price) / H) * 100 : 0

  return (
    <figure className="pchart">
      <figcaption className="pchart__head">
        <div>
          <h3 className="pchart__title">{title}</h3>
          <p className="pchart__sum">
            {formatPrice(last)}{' '}
            <span className={change >= 0 ? 'is-up' : 'is-down'}>
              {change >= 0 ? '▲' : '▼'} {formatPct(change)}
            </span>{' '}
            en {range === '1A' ? '12 meses' : range.replace('M', ' meses').replace('1 meses', '1 mes')}
          </p>
        </div>
        <div className="seg seg--sm" role="group" aria-label="Rango de tiempo">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`seg__btn ${range === r.id ? 'is-active' : ''}`}
              aria-pressed={range === r.id}
              onClick={() => {
                setRange(r.id)
                setHover(null)
              }}
            >
              {r.id}
            </button>
          ))}
        </div>
      </figcaption>

      <div
        ref={ref}
        className="pchart__plot"
        tabIndex={0}
        role="img"
        aria-label={`${title}: de ${formatPrice(first)} a ${formatPrice(last)} (${formatPct(change)}). Usa las flechas para recorrer los días.`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setHover((v) => Math.max(0, (v ?? data.length - 1) - 1))
          if (e.key === 'ArrowRight') setHover((v) => Math.min(data.length - 1, (v ?? data.length - 2) + 1))
          if (e.key === 'Escape') setHover(null)
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="pchart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--c-gold-500)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--c-gold-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} className="pchart__grid" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1="0" x2={W} y1={y(retail)} y2={y(retail)} className="pchart__ref" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#pchart-fill)" />
          <path d={line} className="pchart__line" vectorEffect="non-scaling-stroke" />
          {h && <line x1={(hx / 100) * W} x2={(hx / 100) * W} y1="0" y2={H} className="pchart__cross" vectorEffect="non-scaling-stroke" />}
        </svg>

        {/* Etiquetas HTML (no se deforman con el SVG) */}
        {ticks.map((t) => (
          <span key={t} className="pchart__tick" style={{ top: `${(y(t) / H) * 100}%` }}>
            {formatPrice(t)}
          </span>
        ))}
        <span className="pchart__ref-label" style={{ top: `${(y(retail) / H) * 100}%` }}>
          Precio de lista
        </span>

        {h && (
          <>
            <span className="pchart__dot" style={{ left: `${hx}%`, top: `${hy}%` }} />
            <div className={`pchart__tip ${hx > 70 ? 'is-left' : ''}`} style={{ left: `${hx}%`, top: `${hy}%` }}>
              <strong>{formatPrice(h.price)}</strong>
              <span>{formatDate(h.t, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>{formatPct((h.price - retail) / retail)} vs. lista</span>
            </div>
          </>
        )}
      </div>

      <div className="pchart__axis" aria-hidden="true">
        <span>{formatDate(data[0].t)}</span>
        <span>{formatDate(data[Math.floor(data.length / 2)].t)}</span>
        <span>Hoy</span>
      </div>
    </figure>
  )
}
