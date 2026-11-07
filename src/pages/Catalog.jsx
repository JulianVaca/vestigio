import { useMemo, useRef, useState } from 'react'
import { m as motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { products, categories, rooms } from '../data/products.js'
import ProductCard from '../components/ProductCard.jsx'
import BoutiqueRack from '../components/BoutiqueRack.jsx'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'

const sorts = {
  relevance: { label: 'Orden de sala (I – V)', fn: (a, b) => a.room - b.room },
  asc: { label: 'Precio: menor a mayor', fn: (a, b) => a.price - b.price },
  desc: { label: 'Precio: mayor a menor', fn: (a, b) => b.price - a.price },
}

export default function Catalog() {
  const scope = useRef(null)
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || 'Todo'
  const [sort, setSort] = useState('relevance')
  const [viewMode, setViewMode] = useState('both') // 'both' | 'racks' | 'grid'
  useScrollAnimations(scope)

  const list = useMemo(
    () => products.filter((p) => cat === 'Todo' || p.category === cat).sort(sorts[sort].fn),
    [cat, sort],
  )

  return (
    <main id="main" ref={scope} className="page container">
      <header className="page__head" data-reveal>
        <p className="eyebrow">Colección Permanente · 30 Diseños Originales de Atelier</p>
        <h1 className="h1">
          Catálogo & <em>Racks</em>
        </h1>
        <p className="page__lead">
          Explora nuestras 30 prendas creadas desde cero como si recorrieras los percheros de nuestra tienda física:
          desliza las perchas de bronce, inspecciona cada caída textil y descuelga tu talla directamente al carrito.
        </p>
      </header>

      <div className="toolbar" data-reveal>
        <div className="chips" role="group" aria-label="Filtrar por línea del atelier">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${c === cat ? 'chip--active' : ''}`}
              aria-pressed={c === cat}
              onClick={() => setParams(c === 'Todo' ? {} : { cat: c }, { replace: true })}
            >
              {c === cat && (
                <motion.span
                  layoutId="chip-bg"
                  className="chip__bg"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="chip__label">{c}</span>
            </button>
          ))}
        </div>

        <div className="toolbar__right">
          <div className="view-switch" role="group" aria-label="Modo de visualización de tienda">
            {[
              { id: 'both', label: 'Rack + Galería' },
              { id: 'racks', label: '5 Racks de Tienda' },
              { id: 'grid', label: 'Solo Cuadrícula' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`view-switch__btn ${viewMode === m.id ? 'is-active' : ''}`}
                onClick={() => setViewMode(m.id)}
              >
                {m.label}
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
      </div>

      {/* Vista de Rack Principal + Cuadrícula */}
      {viewMode === 'both' && (
        <BoutiqueRack
          items={list}
          title={cat === 'Todo' ? 'Perchero Central · 30 Piezas de Autor' : `Perchero · ${cat}`}
          subtitle="Haz clic en cualquier percha lateral, usa las flechas o arrastra horizontalmente para recorrer las prendas colgadas."
        />
      )}

      {/* Vista de los 5 Racks de Tienda por Sala */}
      {viewMode === 'racks' && (
        <div className="racks-stack">
          {rooms.map((r) => {
            const roomItems = products.filter((p) => p.room === r.id && (cat === 'Todo' || p.category === cat))
            if (!roomItems.length) return null
            return (
              <BoutiqueRack
                key={r.id}
                items={roomItems}
                title={r.name}
                subtitle={r.text}
              />
            )
          })}
        </div>
      )}

      {viewMode !== 'racks' && (
        <>
          <p className="results" aria-live="polite">
            Mostrando {list.length} {list.length === 1 ? 'prenda original' : 'prendas originales'} en vitrina
          </p>

          {/* Sin animaciones de layout de framer-motion: medían las 30 tarjetas en cada cambio
              (layouts forzados). Fundido CSS escalonado al cambiar filtro u orden. */}
          <div key={`${cat}-${sort}`} className="grid grid--4 grid--fade">
            {list.map((p, i) => (
              <div key={p.id} style={{ '--i': Math.min(i, 12) }}>
                <ProductCard product={p} priority={i < 4} />
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
