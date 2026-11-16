import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products.js'
import { getMarket, formatPct } from '../data/market.js'
import { useMotionPref } from '../context/MotionContext.jsx'
import { hasWebGL } from '../lib/webgl.js'
import { ArrowIcon, ArrowLeftIcon, CubeIcon } from './Icons.jsx'
import '../styles/pedestal3d.css'

// Three.js sólo se descarga cuando la vitrina se acerca a la pantalla.
const Pedestal3D = lazy(() => import('../rack3d/Pedestal3D.jsx'))

/**
 * Vitrina del calzado: el equivalente del perchero 3D para la Sala V.
 * Los sneakers descansan en pedestales que giran como un carrusel; el par del frente se
 * inspecciona con el cursor y abre su ficha de mercado debajo.
 * La fila de miniaturas sigue en el DOM para teclado y lectores de pantalla, y es lo que se ve
 * con movimiento reducido o sin WebGL.
 */
const SneakerPedestal = memo(function SneakerPedestal({ items, title, subtitle }) {
  const [active, setActive] = useState(0)
  const { reduced } = useMotionPref()
  const stageRef = useRef(null)
  const railRef = useRef(null)
  const [near, setNear] = useState(false)
  const [ready3d, setReady3d] = useState(false)

  const can3d = !reduced && items?.length > 2 && hasWebGL()
  const show3d = can3d && near

  // Monta la escena sólo cerca de la pantalla y la libera al alejarse (GPU y memoria en reposo).
  useEffect(() => {
    const el = stageRef.current
    if (!can3d || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '350px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [can3d])

  useEffect(() => {
    if (!show3d) setReady3d(false)
  }, [show3d])

  if (!items || items.length === 0) return null
  const n = items.length
  const safe = Math.min(active, n - 1)
  const current = items[safe]
  const market = getMarket(current)

  const select = (idx, { focus = false } = {}) => {
    const i = (idx + n) % n
    setActive(i)
    if (focus) railRef.current?.querySelectorAll('.pstage__item')[i]?.focus({ preventScroll: true })
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      select(safe + 1, { focus: true })
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      select(safe - 1, { focus: true })
    }
  }

  return (
    <section className="vrack pstage" aria-label={title || 'Vitrina 3D de sneakers'}>
      <header className="vrack__header">
        <div>
          <p className="eyebrow">Sala V · {can3d ? 'Arrastra para girar la vitrina' : 'Elige un par'}</p>
          <h2 className="vrack__title">{title || 'Pedestales del atelier'}</h2>
          <p className="vrack__subtitle">
            {can3d ? subtitle : 'Elige un par para ver su precio de mercado y entrar a su ficha.'}
          </p>
        </div>
        <div className="vrack__controls">
          <button type="button" className="icon-btn" onClick={() => select(safe - 1)} aria-label="Sneaker anterior">
            <ArrowLeftIcon />
          </button>
          <span className="vrack__counter" aria-live="polite">
            {String(safe + 1).padStart(2, '0')} <i>/</i> {String(n).padStart(2, '0')}
          </span>
          <button type="button" className="icon-btn" onClick={() => select(safe + 1)} aria-label="Sneaker siguiente">
            <ArrowIcon />
          </button>
        </div>
      </header>

      <div ref={stageRef} className={`vrack__stage pstage__stage ${show3d && ready3d ? 'is-3d' : ''}`}>
        {show3d && (
          <Suspense fallback={null}>
            <Pedestal3D items={items} active={safe} onSelect={(i) => select(i)} onReady={() => setReady3d(true)} />
          </Suspense>
        )}

        <ul ref={railRef} className="pstage__rail" onKeyDown={onKeyDown} aria-label="Sneakers en la vitrina">
          {items.map((item, idx) => {
            const isActive = idx === safe
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`pstage__item ${isActive ? 'is-active' : ''}`}
                  aria-pressed={isActive}
                  aria-label={`${item.name}, desde ${formatPrice(getMarket(item).lowestAsk)}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(idx)}
                >
                  <img
                    src={item.img.replace('.webp', '-cut.webp')}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span className="pstage__plinth" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
        <div className="vrack__floor" aria-hidden="true" />
      </div>

      <div className="vrack__plinth pstage__info" key={current.id}>
        <div className="vrack__info">
          <p className="eyebrow">
            {market.silhouette} · {market.sku}
          </p>
          <h3 className="vrack__name">
            <Link to={`/sneakers/${current.id}`}>{current.name}</Link>
          </h3>
          <p className="vrack__meta">
            <span className="swatch" style={{ background: current.hex }} aria-hidden="true" />
            {current.color}
          </p>
        </div>

        <div className="vrack__buy">
          <dl className="pstage__stats">
            <div>
              <dt>Precio más bajo</dt>
              <dd className="pstage__price">{formatPrice(market.lowestAsk)}</dd>
            </div>
            <div>
              <dt>Esta semana</dt>
              <dd className={market.change >= 0 ? 'is-up' : 'is-down'}>
                {market.change >= 0 ? '▲' : '▼'} {formatPct(market.change)}
              </dd>
            </div>
            <div>
              <dt>Vendidos</dt>
              <dd>{market.sales}</dd>
            </div>
          </dl>
          <div className="vrack__cta">
            <Link to={`/sneakers/${current.id}`} className="btn btn--primary">
              Ver precios por talla <ArrowIcon width={17} height={17} />
            </Link>
            <Link to={`/museo?obra=${current.id}`} className="btn btn--ghost" title="Ver en la Sala V del museo 3D">
              <CubeIcon width={16} height={16} /> Museo 3D
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
})

export default SneakerPedestal
