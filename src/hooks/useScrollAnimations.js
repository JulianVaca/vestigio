import { useEffect } from 'react'
import { useMotionPref } from '../context/MotionContext.jsx'

let gsapPromise = null
/** GSAP + ScrollTrigger bajo demanda (sólo para efectos con scrub en la portada). */
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
      const gsap = g.gsap || g.default
      const ScrollTrigger = st.ScrollTrigger || st.default
      gsap.registerPlugin(ScrollTrigger)
      return { gsap, ScrollTrigger }
    })
  }
  return gsapPromise
}

/**
 * Ejecuta `fn` en la primera interacción real del visitante (scroll, puntero, toque o tecla).
 * Mantiene el hilo principal libre durante la carga: los efectos decorativos no compiten
 * con el primer render (mejora TBT / INP). Devuelve una función de limpieza.
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
 * Animaciones de aparición al hacer scroll con IntersectionObserver + transiciones CSS
 * (sin GSAP: cero trabajo de layout por fotograma y nada que descargar).
 * Dentro de `scopeRef`:
 *  - [data-reveal]          → aparece desde abajo al entrar en viewport
 *  - [data-reveal-stagger]  → sus hijos aparecen en cascada
 * Con movimiento reducido no se registra nada: el contenido queda visible.
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
        child.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 70}ms`)
        targets.push(child)
      })
    })

    // Sin getBoundingClientRect (forzaría un layout síncrono en plena carga): la primera
    // notificación del observer indica qué está ya en pantalla. Eso queda visible tal cual;
    // sólo lo que está fuera se oculta y se revela al entrar.
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
      { rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((el) => io.observe(el))

    return () => {
      io.disconnect()
      targets.forEach((el) => el.classList.remove('reveal', 'is-revealed'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps])
}
