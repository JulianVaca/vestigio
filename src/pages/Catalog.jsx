import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { products, categories } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'

const sorts = {
  relevance: { label: 'Orden de sala', fn: (a, b) => a.room - b.room },
  asc: { label: 'Precio: menor a mayor', fn: (a, b) => a.price - b.price },
  desc: { label: 'Precio: mayor a menor', fn: (a, b) => b.price - a.price },
}

/**
 * Catálogo: los filtros reordenan la grilla con animaciones de layout (FLIP).
 * El movimiento comunica QUÉ cambió: las tarjetas que salen se encogen,
 * las que quedan se deslizan a su nueva posición.
 */
export default function Catalog() {
  const scope = useRef(null)
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || 'Todo'
  const [sort, setSort] = useState('relevance')
  useScrollAnimations(scope)

  const list = useMemo(
    () => products.filter((p) => cat === 'Todo' || p.category === cat).sort(sorts[sort].fn),
    [cat, sort],
  )

  return (
    <main id="main" ref={scope} className="page container">
      <header className="page__head" data-reveal>
        <p className="eyebrow">Colección 01 · Ruinas Suaves</p>
        <h1 className="h1">
          Catá<em>logo</em>
        </h1>
        <p className="page__lead">Ocho piezas, cuatro salas. Filtra por tipo de prenda u ordénalas por precio.</p>
      </header>

      <div className="toolbar" data-reveal>
        <div className="chips" role="group" aria-label="Filtrar por categoría">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${c === cat ? 'chip--active' : ''}`}
              aria-pressed={c === cat}
              onClick={() => setParams(c === 'Todo' ? {} : { cat: c }, { replace: true })}
            >
              {c === cat && <motion.span layoutId="chip-bg" className="chip__bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span className="chip__label">{c}</span>
            </button>
          ))}
        </div>
        <label className="select">
          <span className="sr-only">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(sorts).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="results" aria-live="polite">
        {list.length} {list.length === 1 ? 'pieza' : 'piezas'}
      </p>

      <motion.div layout className="grid grid--4">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
              transition={{ layout: { type: 'spring', stiffness: 300, damping: 32 } }}
            >
              <ProductCard product={p} priority={i < 4} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </main>
  )
}
