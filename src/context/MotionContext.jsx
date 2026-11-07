import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'

/**
 * Accesibilidad de movimiento.
 * - Lee la preferencia del sistema (prefers-reduced-motion).
 * - Permite al usuario forzarla desde el sitio (botón en el header).
 * - Expone `reduced` a toda la app (GSAP y la escena 3D lo consultan),
 *   configura Framer Motion y marca <html data-reduced-motion> para el CSS.
 */
const MotionCtx = createContext({ reduced: false, toggle: () => {} })

const query = '(prefers-reduced-motion: reduce)'
const STORAGE_KEY = 'vestigio-motion'

export function MotionProvider({ children }) {
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia(query).matches)
  const [userPref, setUserPref] = useState(() => localStorage.getItem(STORAGE_KEY)) // 'reduce' | 'full' | null

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setSystemReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const reduced = userPref ? userPref === 'reduce' : systemReduced

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
