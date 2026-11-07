import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import { PlusIcon, CheckIcon, TagIcon, CloseIcon } from './Icons.jsx'

/**
 * Tarjeta de producto con animación de "Zoom-Out a la Marquilla" al seleccionar talla.
 * - Al pulsar "Elegir talla", la cámara parte de un primer plano de la marquilla del cuello/lengüeta
 *   y hace un zoom-out suave mostrando la etiqueta tejida interactiva para elegir la talla.
 */
export default function ProductCard({ product, priority = false }) {
  const { add } = useCart()
  const { reduced } = useMotionPref()
  const [picking, setPicking] = useState(false)
  const [added, setAdded] = useState(false)

  const tagX = product.tagPos?.x ?? 50
  const tagY = product.tagPos?.y ?? 18

  const quickAdd = (size, e) => {
    const cardEl = e.currentTarget.closest('.card')
    const img = cardEl?.querySelector('img')
    setPicking(false)
    setAdded(true)
    flyToCart(img, reduced)
    add(product.id, size)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className={`card ${picking ? 'card--marquilla-open' : ''}`}>
      <div className="card__visual">
        <Link
          to={`/producto/${product.id}`}
          className="card__media"
          aria-label={`${product.name}, ${formatPrice(product.price)}`}
        >
          <img
            src={product.img}
            srcSet={`${product.img.replace('.webp', '-sm.webp')} 420w, ${product.img} 840w`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={`${product.name} — ${product.brand} en color ${product.color}`}
            width="840"
            height="1120"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={{
              transformOrigin: `${tagX}% ${tagY}%`,
            }}
          />
          <span className="card__tag">{product.category}</span>
          <span className="card__brand-pill">{product.brand}</span>
        </Link>

        {/* Overlay interactivo de Marquilla tejida con animación de Zoom-Out */}
        <AnimatePresence>
          {picking && (
            <motion.div
              className="marquilla-overlay"
              role="dialog"
              aria-label={`Marquilla de talla para ${product.name}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.55, y: -18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="marquilla-tag">
                <div className="marquilla-tag__stitch" aria-hidden="true" />
                <div className="marquilla-tag__head">
                  <span className="marquilla-tag__brand">VESTIGIO · {product.brand}</span>
                  <button
                    type="button"
                    className="marquilla-tag__close"
                    onClick={() => setPicking(false)}
                    aria-label="Cerrar marquilla"
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </div>
                <p className="marquilla-tag__title">Selecciona talla en marquilla</p>
                <div className="marquilla-tag__sizes" role="group" aria-label="Elige una talla">
                  {product.sizes.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      className="marquilla-tag__size-btn"
                      onClick={(e) => quickAdd(s, e)}
                      initial={{ opacity: 0, scale: 1.25 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: 0.08 + i * 0.035 } }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
                <div className="marquilla-tag__stitch" aria-hidden="true" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card__quick">
          {!picking && (
            <button
              type="button"
              className="card__quick-btn"
              onClick={() => setPicking(true)}
              aria-label={`Ver marquilla y elegir talla de ${product.name}`}
            >
              {added ? (
                <>
                  <CheckIcon width={16} height={16} /> Sellado en carrito
                </>
              ) : (
                <>
                  <TagIcon width={16} height={16} /> Elegir talla · Marquilla
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="card__info">
        <h3 className="card__name">
          <Link to={`/producto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__price">{formatPrice(product.price)}</p>
        <p className="card__color">
          <span className="swatch" style={{ background: product.hex }} aria-hidden="true" />
          {product.color}
        </p>
      </div>
    </article>
  )
}
