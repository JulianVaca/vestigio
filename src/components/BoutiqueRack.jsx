import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice, rooms } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import { ArrowIcon, ArrowLeftIcon, CheckIcon, CubeIcon, PlusIcon } from './Icons.jsx'

/**
 * Percha arquitectónica en bronce cepillado y madera de olivo.
 */
function HangerGraphic({ active }) {
  return (
    <svg
      className={`rack__hanger-svg ${active ? 'is-active' : ''}`}
      viewBox="0 0 180 62"
      fill="none"
      aria-hidden="true"
    >
      {/* Argolla que abraza el tubo del rack */}
      <circle cx="90" cy="8" r="5.5" stroke="currentColor" strokeWidth="2.4" />
      {/* Gancho de bronce */}
      <path
        d="M90 13.5 C90 21, 90 25, 90 30"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Hombros de la percha de tienda */}
      <path
        d="M16 56 C38 34, 68 29, 90 29 C112 29, 142 34, 164 56"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Placa central del atelier */}
      <rect x="74" y="25" width="32" height="9" rx="2" fill="currentColor" />
    </svg>
  )
}

/**
 * Rack interactivo de tienda (Perchero de Boutique).
 * Permite deslizar prendas colgadas sobre una barra metálica como en una boutique física.
 */
export default function BoutiqueRack({ items, title, subtitle }) {
  const [index, setIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const activeImgRef = useRef(null)
  const { add } = useCart()
  const { reduced } = useMotionPref()

  // Mantener el índice dentro de rango cuando cambia el filtro
  useEffect(() => {
    setIndex(0)
    setSelectedSize(null)
  }, [items])

  if (!items || items.length === 0) return null

  const safeIndex = Math.min(index, items.length - 1)
  const current = items[safeIndex]

  const goPrev = () => {
    setIndex((i) => (i - 1 + items.length) % items.length)
    setSelectedSize(null)
    setSizeError(false)
  }

  const goNext = () => {
    setIndex((i) => (i + 1) % items.length)
    setSelectedSize(null)
    setSizeError(false)
  }

  const handleAdd = () => {
    const sizeToUse = selectedSize || current.sizes[0]
    if (!selectedSize && current.sizes.length > 1) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 650)
      return
    }
    flyToCart(activeImgRef.current, reduced)
    add(current.id, sizeToUse, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <section className="rack" aria-label={title || 'Rack interactivo de prendas'}>
      <div className="rack__header">
        <div>
          <p className="eyebrow">Boutique Interactiva · Desliza las perchas</p>
          <h2 className="h3 rack__title">{title || 'Perchero Principal del Atelier'}</h2>
          {subtitle && <p className="rack__subtitle">{subtitle}</p>}
        </div>

        <div className="rack__controls">
          <button
            type="button"
            className="icon-btn"
            onClick={goPrev}
            aria-label="Prenda anterior en el rack"
          >
            <ArrowLeftIcon />
          </button>
          <span className="rack__counter">
            {String(safeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={goNext}
            aria-label="Prenda siguiente en el rack"
          >
            <ArrowIcon />
          </button>
        </div>
      </div>

      {/* Estructura arquitectónica del perchero: barra de bronce + soportes */}
      <div className="rack__frame">
        <div className="rack__post rack__post--left" aria-hidden="true" />
        <div className="rack__post rack__post--right" aria-hidden="true" />

        {/* Barra cilíndrica superior con muescas interactivas */}
        <div className="rack__bar" role="tablist" aria-label="Posiciones del perchero">
          <div className="rack__bar-rod" aria-hidden="true" />
          <div className="rack__bar-hooks">
            {items.map((item, idx) => {
              const isCurrent = idx === safeIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`Deslizar rack a ${item.name}`}
                  className={`rack__bar-notch ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => {
                    setIndex(idx)
                    setSelectedSize(null)
                  }}
                >
                  <span className="rack__bar-ring" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Escenario de prendas colgadas con física de perchero */}
        <motion.div
          className="rack__stage"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -45) goNext()
            else if (info.offset.x > 45) goPrev()
          }}
        >
          {items.map((item, idx) => {
            // Distancia circular o lineal respecto a la prenda activa
            const offset = idx - safeIndex
            if (Math.abs(offset) > 3) return null

            const isCenter = offset === 0
            const abs = Math.abs(offset)
            const xSpread = offset * 175
            const rotateY = offset === 0 ? 0 : offset < 0 ? 34 : -34
            const rotateZ = offset * 1.4
            const scale = isCenter ? 1 : Math.max(0.72, 0.9 - abs * 0.08)
            const opacity = isCenter ? 1 : Math.max(0.35, 0.85 - abs * 0.2)
            const zIndex = 20 - abs

            return (
              <motion.div
                key={item.id}
                className={`rack__item ${isCenter ? 'is-center' : ''}`}
                style={{ zIndex }}
                initial={false}
                animate={{
                  x: xSpread,
                  scale,
                  opacity,
                  rotateY: reduced ? 0 : rotateY,
                  rotateZ: reduced ? 0 : rotateZ,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 290,
                  damping: 28,
                }}
                onClick={() => {
                  if (!isCenter) {
                    setIndex(idx)
                    setSelectedSize(null)
                  }
                }}
              >
                <HangerGraphic active={isCenter} />
                <div className="rack__garment-card">
                  <img
                    ref={isCenter ? activeImgRef : null}
                    src={isCenter ? item.img : item.img.replace('.webp', '-sm.webp')}
                    alt={item.name}
                    width="420"
                    height="560"
                    draggable={false}
                  />
                  <span className="rack__garment-badge">{item.category}</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Base de piedra travertino del perchero con panel de compra rápida */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="rack__plinth"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <div className="rack__plinth-info">
              <p className="eyebrow">
                {rooms[current.room]?.name} · {current.brand}
              </p>
              <h3 className="rack__plinth-name">
                <Link to={`/producto/${current.id}`}>{current.name}</Link>
              </h3>
              <p className="rack__plinth-meta">
                <span className="swatch" style={{ background: current.hex }} aria-hidden="true" />
                <span>{current.color}</span>
                <span aria-hidden="true">·</span>
                <strong className="rack__plinth-price">{formatPrice(current.price)}</strong>
              </p>
              <p className="rack__plinth-desc">{current.description}</p>
            </div>

            <div className="rack__plinth-actions">
              <div className={`rack__sizes ${sizeError ? 'is-error' : ''}`}>
                <span className="rack__sizes-label">
                  Talla en percha:
                  {sizeError && <em className="rack__sizes-alert"> · Elige una talla</em>}
                </span>
                <div className="rack__sizes-list" role="group" aria-label="Seleccionar talla">
                  {current.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`rack__size-pill ${selectedSize === s ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedSize(s)
                        setSizeError(false)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rack__cta-row">
                <button type="button" className="btn btn--primary" onClick={handleAdd}>
                  {added ? (
                    <>
                      <CheckIcon width={17} height={17} /> Añadido al carrito
                    </>
                  ) : (
                    <>
                      <PlusIcon width={17} height={17} /> Descolgar al carrito
                    </>
                  )}
                </button>
                <Link to={`/producto/${current.id}`} className="btn btn--ghost">
                  Ver prenda en detalle
                </Link>
                <Link to={`/museo?obra=${current.id}`} className="btn btn--ghost" title="Ver en el rack 3D del museo">
                  <CubeIcon width={16} height={16} /> Rack 3D
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
