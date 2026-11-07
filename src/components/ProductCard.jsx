import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import { PlusIcon, CheckIcon, CloseIcon } from './Icons.jsx'

/**
 * Tarjeta de prenda en el catálogo y estanterías (memoizada para evitar re-renders al filtrar/ordenar).
 * Permite inspección limpia de la pieza completa y selección rápida de talla sin distorsionar la imagen.
 */
const ProductCard = memo(function ProductCard({ product, priority = false }) {
  const { add } = useCart()
  const { reduced } = useMotionPref()
  const [picking, setPicking] = useState(false)
  const [added, setAdded] = useState(false)

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
    <article className="card">
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
            fetchpriority={priority ? 'high' : 'low'}
            decoding="async"
          />
          <span className="card__tag">{product.category}</span>
          <span className="card__brand-pill">{product.brand}</span>
        </Link>

        <div className="card__quick">
          <AnimatePresence mode="wait">
            {picking ? (
              <motion.div
                key="sizes"
                className="card__sizes"
                role="group"
                aria-label="Elige una talla"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="card__size-btn"
                    onClick={(e) => quickAdd(s, e)}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  className="card__size-close"
                  onClick={() => setPicking(false)}
                  aria-label="Cancelar selección de talla"
                >
                  <CloseIcon width={13} height={13} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="cta"
                type="button"
                className="card__quick-btn"
                onClick={() => setPicking(true)}
                aria-label={`Añadir ${product.name} al carrito`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {added ? (
                  <>
                    <CheckIcon width={16} height={16} /> Añadido al carrito
                  </>
                ) : (
                  <>
                    <PlusIcon width={16} height={16} /> Añadir rápida · Talla
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
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
})

export default ProductCard
