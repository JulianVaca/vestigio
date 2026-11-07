import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useMotionPref } from '../context/MotionContext.jsx'
import { runCartAcrossScreen } from '../lib/flyToCart.js'
import { CheckIcon, CloseIcon } from './Icons.jsx'

/** Confirmación no intrusiva de "añadido al carrito" (aria-live para lectores de pantalla). */
export default function Toast() {
  const { toast, dismissToast } = useCart()
  const { reduced } = useMotionPref()

  return (
    <div className="toast-region" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            className="toast"
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <img src={toast.product.img.replace('.webp', '-sm.webp')} alt="" width="48" height="64" />
            <div className="toast__body">
              <p className="toast__title">
                <CheckIcon width={16} height={16} /> Pieza añadida al carrito
              </p>
              <p className="toast__meta">
                {toast.product.name} · Talla {toast.size}
              </p>
              <Link
                to="/carrito"
                className="toast__link"
                onClick={() => {
                  runCartAcrossScreen(reduced)
                  dismissToast()
                }}
              >
                Ir al carrito →
              </Link>
            </div>
            <button className="toast__close" onClick={dismissToast} aria-label="Cerrar aviso">
              <CloseIcon width={16} height={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
