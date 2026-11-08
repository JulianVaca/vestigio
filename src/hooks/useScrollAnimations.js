import { useEffect } from 'react'
import { useMotionPref } from '../context/MotionContext.jsx'

/**
 * Ejecuta `fn` en la primera interacción real del visitante (scroll, puntero, toque o tecla).
 */
export function onFirstInteraction(fn) {
  const events = ['scroll', 'pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel']
  let done = false
  const run = () => {
    if (done) return
    done = true
    cleanup()
    fn()
  }
  const cleanup = () => events.forEach((e) => window.removeEventListener(e, run, { passive: true }))
  events.forEach((e) => window.addEventListener(e, run, { passive: true, once: true }))
  return () => {
    done = true
    cleanup()
  }
}

/**
 * Animaciones de aparición al hacer scroll con IntersectionObserver + transiciones CSS en GPU
 * (cero listeners de scroll en el hilo principal, cero reflujos y cero librerías pesadas).
 */
export function useScrollAnimations(scopeRef, deps = []) {
  const { reduced } = useMotionPref()

  useEffect(() => {
    const root = scopeRef.current
    if (reduced || !root || typeof IntersectionObserver === 'undefined') return

    const targets = []
    root.querySelectorAll('[data-reveal]').forEach((el) => targets.push(el))
    root.querySelectorAll('[data-reveal-stagger]').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        child.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 50}ms`)
        targets.push(child)
      })
    })
    if (!targets.length) return

    const seen = new WeakSet()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          if (!seen.has(el)) {
            seen.add(el)
            if (entry.isIntersecting) {
              io.unobserve(el)
            } else {
              el.classList.add('reveal')
            }
            return
          }
          if (entry.isIntersecting) {
            el.classList.add('is-revealed')
            io.unobserve(el)
          }
        })
      },
      { rootMargin: '0px 0px -5% 0px' },
    )
    targets.forEach((el) => io.observe(el))

    return () => {
      io.disconnect()
      targets.forEach((el) => el.classList.remove('reveal', 'is-revealed'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps])
}
