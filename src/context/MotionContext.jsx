import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'

/**
 * Control de movimiento y accesibilidad.
 * - Por defecto mantiene las animaciones activas en PC y móvil para preservar
 *   la experiencia interactiva (museo 3D, zoom a la marquilla y carrito dinámico),
 *   a menos que el usuario active manualmente el modo de movimiento reducido
 *   con el botón situado al lado del carrito (ícono de onda / línea horizontal).
 */
const MotionCtx = createContext({ reduced: false, toggle: () => {} })

const STORAGE_KEY = 'vestigio-motion-v2'

export function MotionProvider({ children }) {
  const [userPref, setUserPref] = useState(() => localStorage.getItem(STORAGE_KEY) || 'full') // 'reduce' | 'full'

  const reduced = userPref === 'reduce'

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced)
  }, [reduced])

  const value = useMemo(
    () => ({
      reduced,
      toggle: () => {
        const next = reduced ? 'full' : 'reduce'
        localStorage.setItem(STORAGE_KEY, next)
        setUserPref(next)
      },
    }),
    [reduced],
  )

  return (
    <MotionCtx.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </MotionCtx.Provider>
  )
}

export const useMotionPref = () => useContext(MotionCtx)
