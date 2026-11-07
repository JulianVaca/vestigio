import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice, rooms } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import SizeSelector from './SizeSelector.jsx'
import { ArrowIcon, ArrowLeftIcon, CheckIcon, CubeIcon, PlusIcon } from './Icons.jsx'

/** Percha de bronce dorado: gancho + hombros + placa del atelier. */
function Hanger() {
  return (
    <svg className="vrack__hanger" viewBox="0 0 180 64" fill="none" aria-hidden="true">
      <path d="M90 31 V19 C90 14 94 10.5 98.5 10.5 C103 10.5 106 14 106 18" stroke="url(#vrack-gold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 58 C38 36, 68 31, 90 31 C112 31, 142 36, 166 58" stroke="url(#vrack-gold)" strokeWidth="5" strokeLinecap="round" />
      <rect x="76" y="27" width="28" height="8" rx="2" fill="url(#vrack-gold)" />
    </svg>
  )
}

/**
 * Rack de boutique física.
 * Las prendas cuelgan DE LADO sobre una barra dorada, como en un perchero real de tienda;
 * al pasar el cursor (o enfocar con teclado) la percha gira y la prenda queda DE FRENTE.
 * Clic / toque fija la prenda y abre su ficha de compra rápida debajo.
 */
export default function BoutiqueRack({ items, title, subtitle }) {
  const [active, setActive] = useState(0)
  const [size, setSize] = useState(null)
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const railRef = useRef(null)
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 })
  const { add } = useCart()
  const { reduced } = useMotionPref()

  useEffect(() => {
    setActive(0)
    setSize(null)
    if (railRef.current) railRef.current.scrollLeft = 0
  }, [items])

  /** Centra la percha `idx` en el riel. Calcula la posición con las medidas en reposo para no depender de la transición. */
  const centerOn = useCallback(
    (idx, smooth = true) => {
      const rail = railRef.current
      if (!rail) return
      const cs = getComputedStyle(rail)
      const slot = parseFloat(cs.getPropertyValue('--slot')) || 72
      const front = parseFloat(cs.getPropertyValue('--front')) || 260
      const gap = parseFloat(cs.columnGap) || 0
      const padL = parseFloat(cs.paddingLeft) || 0
      const left = padL + idx * (slot + gap) + front / 2 - rail.clientWidth / 2
      rail.scrollTo({ left, behavior: smooth && !reduced ? 'smooth' : 'auto' })
    },
    [reduced],
  )

  if (!items || items.length === 0) return null
  const safe = Math.min(active, items.length - 1)
  const current = items[safe]

  const select = (idx, { focus = false } = {}) => {
    const i = (idx + items.length) % items.length
    setActive(i)
    setSize(null)
    setSizeError(false)
    centerOn(i)
    if (focus) railRef.current?.querySelectorAll('.vrack__garment')[i]?.focus({ preventScroll: true })
  }

  const handleAdd = () => {
    if (!size) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 700)
      return
    }
    const img = railRef.current?.querySelectorAll('.vrack__face img')[safe]
    flyToCart(img, reduced)
    add(current.id, size, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  // Arrastre con mouse para recorrer el riel (en táctil se usa el scroll nativo)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { down: true, x: e.clientX, left: railRef.current.scrollLeft, moved: 0 }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.x
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved > 4) {
      railRef.current.scrollLeft = d.left - dx
      railRef.current.classList.add('is-dragging')
    }
  }
  const endDrag = () => {
    drag.current.down = false
    railRef.current?.classList.remove('is-dragging')
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
    <section className="vrack" aria-label={title || 'Rack interactivo de prendas'}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="vrack-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8a6a2c" />
            <stop offset="0.45" stopColor="#e2c98f" />
            <stop offset="0.7" stopColor="#a8853f" />
            <stop offset="1" stopColor="#d9bf86" />
          </linearGradient>
        </defs>
      </svg>

      <header className="vrack__header">
        <div>
          <p className="eyebrow">Boutique · Pasa el cursor o toca una percha</p>
          <h2 className="vrack__title">{title || 'Perchero principal del atelier'}</h2>
          {subtitle && <p className="vrack__subtitle">{subtitle}</p>}
        </div>
        <div className="vrack__controls">
          <button type="button" className="icon-btn" onClick={() => select(safe - 1)} aria-label="Prenda anterior">
            <ArrowLeftIcon />
          </button>
          <span className="vrack__counter" aria-live="polite">
            {String(safe + 1).padStart(2, '0')} <i>/</i> {String(items.length).padStart(2, '0')}
          </span>
          <button type="button" className="icon-btn" onClick={() => select(safe + 1)} aria-label="Prenda siguiente">
            <ArrowIcon />
          </button>
        </div>
      </header>

      <div className="vrack__stage">
        <div className="vrack__rod" aria-hidden="true">
          <span className="vrack__finial vrack__finial--l" />
          <span className="vrack__finial vrack__finial--r" />
        </div>

        <ul
          ref={railRef}
          className="vrack__rail"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onKeyDown={onKeyDown}
          aria-label="Prendas colgadas en el rack"
        >
          {items.map((item, idx) => {
            const isActive = idx === safe
            return (
              <li key={item.id} className={`vrack__slot ${isActive ? 'is-active' : ''}`} style={{ '--hex': item.hex }}>
                <button
                  type="button"
                  className="vrack__garment"
                  aria-pressed={isActive}
                  aria-label={`${item.name}, ${formatPrice(item.price)}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => {
                    if (drag.current.moved > 4) return
                    select(idx)
                  }}
                >
                  <Hanger />
                  <span className="vrack__body">
                    <span className="vrack__face">
                      <img
                        src={item.img.replace('.webp', '-sm.webp')}
                        alt=""
                        width="420"
                        height="560"
                        loading={idx < 8 ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable={false}
                      />
                      <span className="vrack__shade" />
                    </span>
                    <span className="vrack__edge" />
                  </span>
                  <span className="vrack__tag">
                    <span className="vrack__tag-name">{item.name}</span>
                    <span className="vrack__tag-price">{formatPrice(item.price)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="vrack__floor" aria-hidden="true" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          className="vrack__plinth"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="vrack__info">
            <p className="eyebrow">
              {rooms[current.room]?.name} · {current.category}
            </p>
            <h3 className="vrack__name">
              <Link to={`/producto/${current.id}`}>{current.name}</Link>
            </h3>
            <p className="vrack__meta">
              <span className="swatch" style={{ background: current.hex }} aria-hidden="true" />
              {current.color}
            </p>
            <p className="vrack__price">{formatPrice(current.price)}</p>
            <p className="vrack__desc">{current.description}</p>
          </div>

          <div className="vrack__buy">
            <SizeSelector
              product={current}
              value={size}
              onChange={(s) => {
                setSize(s)
                setSizeError(false)
              }}
              error={sizeError}
              compact
              reduced={reduced}
              name={`rack-size-${current.id}`}
              layoutKey={`rack-pill-${title}`}
            />
            <div className="vrack__cta">
              <button type="button" className="btn btn--primary" onClick={handleAdd}>
                {added ? (
                  <>
                    <CheckIcon width={17} height={17} /> Añadido
                  </>
                ) : (
                  <>
                    <PlusIcon width={17} height={17} /> Descolgar al carrito
                  </>
                )}
              </button>
              <Link to={`/producto/${current.id}`} className="btn btn--ghost">
                Ver detalle
              </Link>
              <Link to={`/museo?obra=${current.id}`} className="btn btn--ghost" title="Ver en el rack 3D del museo">
                <CubeIcon width={16} height={16} /> 3D
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
