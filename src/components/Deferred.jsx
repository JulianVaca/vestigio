import { useEffect, useRef, useState } from 'react'
import { useScrollAnimations } from '../hooks/useScrollAnimations.js'

/**
 * Renderiza `children` cuando el navegador queda libre (requestIdleCallback).
 * Cada sección diferida se monta en su propia tarea corta en lugar de una sola
 * tarea larga con toda la página: reduce el Total Blocking Time en móvil.
 * Mientras tanto reserva altura para no provocar saltos de layout (CLS).
 */
export default function Deferred({ children, minHeight = 600, timeout = 2500 }) {
  const [ready, setReady] = useState(false)
  const ref = useRef(null)
  useScrollAnimations(ref, [ready])

  useEffect(() => {
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 120))
    const cic = window.cancelIdleCallback || clearTimeout
    const id = ric(() => setReady(true), { timeout })
    return () => cic(id)
  }, [timeout])

  if (!ready) return <div style={{ minHeight }} aria-hidden="true" />
  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
