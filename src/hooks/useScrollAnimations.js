import { useEffect } from 'react'
import { useMotionPref } from '../context/MotionContext.jsx'

let gsapPromise = null
/** GSAP + ScrollTrigger bajo demanda (sólo para efectos con scrub). */
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
      const gsap = g.gsap || g.default
      const ScrollTrigger = st.ScrollTrigger || st.default
      gsap.registerPlugin(ScrollTrigger)
      // Las secciones diferidas y content-visibility cambian la altura de la página después
      // de cargar: recalcular las posiciones de los triggers cuando cambie (con debounce).
      if (typeof ResizeObserver !== 'undefined') {
        let t
        let lastH = document.body.scrollHeight
        new ResizeObserver(() => {
          const h = document.body.scrollHeight
          if (Math.abs(h - lastH) < 4) return
          lastH = h
          clearTimeout(t)
          t = setTimeout(() => ScrollTrigger.refresh(), 160)
        }).observe(document.body)
      }
      return { gsap, ScrollTrigger }
    })
  }
  return gsapPromise
}

let interactionPromise = null
/** Promesa que se resuelve con la primera interacción (y queda resuelta para siempre). */
export function whenInteracted() {
  if (!interactionPromise) interactionPromise = new Promise((resolve) => onFirstInteraction(resolve))
  return interactionPromise
}

/**
 * Efecto GSAP con scrub atado a un elemento. Se configura cuando (1) el visitante ya interactuó
 * —GSAP nunca compite con la carga— y (2) el elemento de `scopeRef` existe. Así los componentes
 * que se montan tarde (secciones diferidas) también reciben su animación de scroll.
 * `setup({ gsap, ScrollTrigger, el })` puede devolver una función de limpieza.
 */
export function useGsapEffect(scopeRef, setup, deps = [], shouldRun = null) {
  const { reduced } = useMotionPref()
  useEffect(() => {
    if (reduced || !scopeRef.current) return
    if (shouldRun && !shouldRun(scopeRef.current)) return // nada que animar: ni siquiera descargar GSAP
    let ctx
    let extra
    let cancelled = false
    whenInteracted()
      .then(loadGsap)
      .then(({ gsap, ScrollTrigger }) => {
        if (cancelled || !scopeRef.current) return
        ctx = gsap.context(() => {
          extra = setup({ gsap, ScrollTrigger, el: scopeRef.current })
        }, scopeRef)
        ScrollTrigger.refresh()
      })
    return () => {
      cancelled = true
      if (typeof extra === 'function') extra()
      ctx?.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps])
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

  // [data-parallax="0.25"] → se desplaza más lento que el scroll (profundidad), vía GSAP diferido
  useGsapEffect(
    scopeRef,
    ({ gsap, el }) => {
      el.querySelectorAll('[data-parallax]').forEach((node) => {
        const speed = parseFloat(node.dataset.parallax) || 0.2
        gsap.fromTo(
          node,
          { yPercent: -speed * 50 },
          {
            yPercent: speed * 50,
            ease: 'none',
            scrollTrigger: { trigger: node.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    },
    deps,
    (el) => Boolean(el.querySelector('[data-parallax]')),
  )
}
