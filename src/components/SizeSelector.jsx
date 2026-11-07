import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SizeGuide, { FitMeter } from './SizeGuide.jsx'
import { stockOf, fitOf, recommendSize, loadFitProfile } from '../data/sizing.js'

/**
 * Selector de talla premium: existencias por talla, talla recomendada para el visitante,
 * medidor de calce y acceso a la guía de tallas.
 * `prices` (opcional) = { [talla]: precio formateado } para el mercado de sneakers.
 */
export default function SizeSelector({
  product,
  value,
  onChange,
  error = false,
  compact = false,
  reduced = false,
  prices = null,
  name = 'size',
  layoutKey = 'size-pill',
}) {
  const [guide, setGuide] = useState(false)
  const [profileTick, setProfileTick] = useState(0)
  const stock = useMemo(() => stockOf(product), [product])
  const fit = fitOf(product)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rec = useMemo(() => recommendSize(product, loadFitProfile()), [product, profileTick])
  const selected = value ? stock[value] : null

  return (
    <fieldset className={`sizer ${compact ? 'sizer--compact' : ''} ${error ? 'is-error' : ''}`}>
      <legend className="sr-only">Talla de {product.name}</legend>
      <div className="sizer__head">
        <span className="sizer__label" aria-hidden="true">
          Talla
          {error && <span className="sizer__hint">· Selecciona una talla</span>}
        </span>
        {error && (
          <span className="sr-only" role="alert">
            Selecciona una talla
          </span>
        )}
        <button type="button" className="sizer__guide" onClick={() => setGuide(true)}>
          <RulerIcon /> Guía de tallas
        </button>
      </div>

      <motion.div
        className={`sizer__grid ${prices ? 'sizer__grid--prices' : ''}`}
        animate={error && !reduced ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {product.sizes.map((s) => {
          const st = stock[s]
          const out = prices ? prices[s] === null : st.state === 'out'
          const active = value === s
          return (
            <label
              key={s}
              className={`sizer__opt ${active ? 'is-active' : ''} ${out ? 'is-out' : ''} ${rec === s ? 'is-rec' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={s}
                checked={active}
                disabled={out}
                onChange={() => onChange(s)}
                className="sr-only"
              />
              {active && (
                <motion.span
                  layoutId={layoutKey}
                  className="sizer__pill"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}
              <span className="sizer__size">{s}</span>
              {prices ? (
                <span className="sizer__sub">{prices[s] ?? 'Sin oferta'}</span>
              ) : (
                <span className="sizer__sub">{out ? 'Agotada' : st.state === 'low' ? `Últimas ${st.units}` : rec === s ? 'Tu talla' : ' '}</span>
              )}
              {rec === s && <span className="sizer__rec-dot" aria-label="Talla recomendada para ti" />}
            </label>
          )
        })}
      </motion.div>

      <AnimatePresence initial={false}>
        {selected && !prices && (
          <motion.p
            key={value}
            className={`sizer__status sizer__status--${selected.state}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {selected.state === 'low'
              ? `Quedan ${selected.units} ${selected.units === 1 ? 'unidad' : 'unidades'} en talla ${value} · despacho en 24 h`
              : `Talla ${value} disponible · despacho asegurado en 24 h`}
          </motion.p>
        )}
      </AnimatePresence>

      {!compact && (
        <div className="sizer__fit">
          <span>
            Calce: <strong>{fit.label}</strong>
          </span>
          <FitMeter value={fit.value} />
          <p>{rec ? `Según tu perfil te recomendamos la talla ${rec}.` : fit.advice}</p>
        </div>
      )}

      <AnimatePresence>
        {guide && (
          <SizeGuide
            product={product}
            onPick={(s) => {
              if (!(prices ? prices[s] === null : stock[s]?.state === 'out')) onChange(s)
            }}
            onClose={() => {
              setGuide(false)
              setProfileTick((t) => t + 1)
            }}
          />
        )}
      </AnimatePresence>
    </fieldset>
  )
}

function RulerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2.5" y="7.5" width="19" height="9" rx="1.5" />
      <path d="M6.5 7.5v3M10.5 7.5v4.5M14.5 7.5v3M18.5 7.5v4.5" strokeLinecap="round" />
    </svg>
  )
}
