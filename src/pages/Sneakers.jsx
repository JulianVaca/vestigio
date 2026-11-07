import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice } from '../data/products.js'
import { sneakers, getMarket, formatPct } from '../data/market.js'
import { VerifiedSeal, OliveBranch } from '../components/Ornaments.jsx'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'

const SIZES = ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44']
const SORTS = {
  featured: { label: 'Destacados', fn: () => 0 },
  low: { label: 'Precio más bajo', fn: (a, b) => a.price - b.price },
  high: { label: 'Precio más alto', fn: (a, b) => b.price - a.price },
  movers: { label: 'Mayor variación', fn: (a, b) => Math.abs(b.m.change) - Math.abs(a.m.change) },
  sales: { label: 'Más vendidos', fn: (a, b) => b.m.sales - a.m.sales },
}

/**
 * Mercado de Sneakers «Pedestal»: listado tipo mercado de reventa con precio más bajo
 * por talla, última venta, variación semanal y unidades vendidas.
 */
export default function Sneakers() {
  const scope = useRef(null)
  const [silhouette, setSilhouette] = useState('Todos')
  const [size, setSize] = useState('')
  const [sort, setSort] = useState('featured')
  useScrollAnimations(scope)

  const list = useMemo(() => {
    return sneakers
      .map((p) => {
        const m = getMarket(p)
        const forSize = size ? m.sizes.find((s) => s.size === size)?.ask : m.lowestAsk
        return { p, m, price: forSize ?? null }
      })
      .filter((x) => silhouette === 'Todos' || x.m.silhouette === silhouette)
      .sort((a, b) => {
        if (a.price === null) return 1
        if (b.price === null) return -1
        return SORTS[sort].fn(a, b)
      })
  }, [silhouette, size, sort])

  const totalSales = sneakers.reduce((s, p) => s + getMarket(p).sales, 0)

  return (
    <main id="main" ref={scope} className="market">
      <section className="market__hero">
        <OliveBranch className="market__olive" />
        <div className="container">
          <p className="eyebrow eyebrow--light">Sala V · Mercado Pedestal</p>
          <h1 className="h1 market__title">
            Sneakers <em>verificados</em>
          </h1>
          <p className="market__lead">
            Precio en vivo por talla, historial de ventas y autenticación en 23 puntos realizada en nuestro atelier antes de
            cada despacho.
          </p>
          <ul className="market__facts">
            <li>
              <VerifiedSeal className="market__seal" />
              <span>
                <strong>100% auténtico</strong> o te devolvemos el dinero
              </span>
            </li>
            <li>
              <strong>{totalSales.toLocaleString('es-CO')}</strong> pares vendidos en 12 meses
            </li>
            <li>
              <strong>Envío asegurado</strong> en caja original sellada
            </li>
          </ul>
        </div>
      </section>

      <div className="container">
        <div className="market__toolbar">
          <div className="chips" role="group" aria-label="Silueta">
            {['Todos', 'Caña alta', 'Caña baja'].map((c) => (
              <button
                key={c}
                className={`chip ${c === silhouette ? 'chip--active' : ''}`}
                aria-pressed={c === silhouette}
                onClick={() => setSilhouette(c)}
              >
                {c === silhouette && <motion.span layoutId="market-chip" className="chip__bg" />}
                <span className="chip__label">{c}</span>
              </button>
            ))}
          </div>
          <div className="toolbar__right">
            <label className="select">
              <span className="sr-only">Talla</span>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="">Todas las tallas</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="select">
              <span className="sr-only">Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="results" aria-live="polite">
          {list.length} {list.length === 1 ? 'modelo' : 'modelos'}
          {size && ` · precios para ${size}`}
        </p>

        <motion.ul layout className="market__grid">
          <AnimatePresence mode="popLayout">
            {list.map(({ p, m, price }, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <Link to={`/sneakers/${p.id}`} className="mtile">
                  <span className="mtile__media">
                    <img
                      src={p.img}
                      srcSet={`${p.img.replace('.webp', '-sm.webp')} 420w, ${p.img} 840w`}
                      sizes="(max-width: 640px) 50vw, 30vw"
                      alt={p.name}
                      width="840"
                      height="1120"
                      loading={i < 3 ? 'eager' : 'lazy'}
                    />
                    <span className="mtile__badge">
                      <VerifiedSeal className="mtile__seal" /> Verificado
                    </span>
                  </span>
                  <span className="mtile__name">{p.name}</span>
                  <span className="mtile__label">{size ? `Precio más bajo · ${size}` : 'Precio más bajo'}</span>
                  <span className="mtile__price">{price ? formatPrice(price) : 'Sin ofertas'}</span>
                  <span className="mtile__row">
                    <span className={`mtile__change ${m.change >= 0 ? 'is-up' : 'is-down'}`}>
                      {m.change >= 0 ? '▲' : '▼'} {formatPct(m.change)}
                    </span>
                    <span className="mtile__sold">{m.sales} vendidos</span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </main>
  )
}
