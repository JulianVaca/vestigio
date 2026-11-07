import { useEffect } from 'react'
import { useMotionPref } from '../context/MotionContext.jsx'

let gsapPromise = null
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
 * Animaciones de scroll con GSAP + ScrollTrigger (cargado de forma diferida
 * tras el primer pintado para no bloquear FCP/LCP ni causar reflujos en la carga).
 * Dentro de `scopeRef`:
 *  - [data-reveal]          → aparece desde abajo (y, opacidad) al entrar en viewport
 *  - [data-reveal-stagger]  → sus hijos aparecen en cascada (jerarquía de lectura)
 *  - [data-parallax="0.2"]  → se desplaza más lento que el scroll (profundidad)
 * Con movimiento reducido no se registra nada: el contenido queda visible.
 */
export function useScrollAnimations(scopeRef, deps = []) {
  const { reduced } = useMotionPref()

  useEffect(() => {
    if (reduced || !scopeRef.current) return
    let ctx
    let refresh
    let cancelled = false

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !scopeRef.current) return
      ctx = gsap.context(() => {
        gsap.utils.toArray('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 48,
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          })
        })
        gsap.utils.toArray('[data-reveal-stagger]').forEach((group) => {
          gsap.from(group.children, {
            y: 60,
            autoAlpha: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.09,
            scrollTrigger: { trigger: group, start: 'top 85%', once: true },
          })
        })
        gsap.utils.toArray('[data-parallax]').forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.2
          gsap.fromTo(
            el,
            { yPercent: -speed * 50 },
            {
              yPercent: speed * 50,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      }, scopeRef)
      refresh = () => ScrollTrigger.refresh()
      window.addEventListener('load', refresh)
    })

    return () => {
      cancelled = true
      if (refresh) window.removeEventListener('load', refresh)
      ctx?.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps])
}
