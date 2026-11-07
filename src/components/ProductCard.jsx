import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import { PlusIcon, CheckIcon } from './Icons.jsx'

/**
 * Tarjeta de producto.
 * Hover: la imagen hace un zoom lento (1.06) y aparece "Añadir rápido" desde abajo.
 * Tocar "Añadir rápido" despliega las tallas (revelado progresivo, no satura la vista).
 */
export default function ProductCard({ product, priority = false }) {
  const { add } = useCart()
  const { reduced } = useMotionPref()
  const [picking, setPicking] = useState(false)
  const [added, setAdded] = useState(false)

  const quickAdd = (size, e) => {
    const img = e.currentTarget.closest('.card').querySelector('img')
    flyToCart(img, reduced)
    add(product.id, size)
    setPicking(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="card">
      <div className="card__visual">
      <Link to={`/producto/${product.id}`} className="card__media" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
        <img
          src={product.img}
          srcSet={`${product.img.replace('.webp', '-sm.webp')} 400w, ${product.img} 720w`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={`${product.name} en color ${product.color}`}
          width="720"
          height="960"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
        <span className="card__tag">{product.category}</span>
      </Link>

      <div className="card__quick">
        {!picking ? (
          <button className="card__quick-btn" onClick={() => setPicking(true)} aria-label={`Añadir rápido ${product.name}`}>
            {added ? (
              <>
                <CheckIcon width={16} height={16} /> Añadido
              </>
            ) : (
              <>
                <PlusIcon width={16} height={16} /> Añadir rápido
              </>
            )}
          </button>
        ) : (
          <motion.div
            className="card__sizes"
            role="group"
            aria-label="Elige una talla"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {product.sizes.map((s, i) => (
              <motion.button
                key={s}
                onClick={(e) => quickAdd(s, e)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                whileTap={{ scale: 0.9 }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
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
