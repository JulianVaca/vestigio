import { m as motion } from 'framer-motion'
import { useMotionPref } from '../context/MotionContext.jsx'

/**
 * Transición entre páginas: "telón de galería".
 * 1. Salida: el contenido baja levemente y se desvanece (anticipación),
 *    mientras un panel terracota sube desde abajo y cubre la pantalla.
 * 2. Entrada: el panel se retira hacia arriba y el contenido sube a su lugar.
 * La curva ease [0.76, 0, 0.24, 1] (in-out pronunciado) da peso al telón.
 * Con movimiento reducido sólo hay un fundido corto.
 */
const ease = [0.76, 0, 0.24, 1]

export default function PageTransition({ children }) {
  const { reduced } = useMotionPref()

  if (reduced) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
        {children}
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 } }}
        exit={{ opacity: 0, y: 12, transition: { duration: 0.3, ease } }}
      >
        {children}
      </motion.div>
      <motion.div
        className="curtain curtain--in"
        aria-hidden="true"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.45, ease }}
      />
      <motion.div
        className="curtain curtain--out"
        aria-hidden="true"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.55, ease, delay: 0.05 }}
      >
        <span className="curtain__mark">VESTIGIO</span>
      </motion.div>
    </>
  )
}
