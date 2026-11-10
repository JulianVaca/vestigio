import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowIcon, CubeIcon } from './Icons.jsx'
import '../styles/door.css'

const SESSION_KEY = 'vestigio-door-open'
const OPEN_MS = 1750
const HERO_CUE_MS = 620

/** ¿Debe mostrarse la puerta? Sólo al llegar a la portada, una vez por visita. */
export function shouldShowDoor(pathname, reduced) {
  if (reduced || pathname !== '/') return false
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1'
  } catch {
    return false
  }
}

/** Una hoja de la puerta: dos cuarterones, media «V» del logotipo, medio nombre y el tirador. */
function Leaf({ side }) {
  const left = side === 'l'
  return (
    <div className={`door__leaf door__leaf--${side}`}>
      <div className="door__panel door__panel--upper" />
      <div className="door__rail">
        <svg className="door__v" viewBox="0 0 20 40" fill="none">
          <path d={left ? 'M5 4 L20 35' : 'M0 35 L15 4'} stroke="currentColor" strokeWidth="2.6" />
          <path d={left ? 'M3 39 H20' : 'M0 39 H17'} stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
        </svg>
        <span className="door__word">{left ? 'VEST' : 'IGIO'}</span>
      </div>
      <div className="door__panel door__panel--lower" />
      <span className="door__pull" />
      <span className="door__glow">
        <span className="door__sheen" />
      </span>
    </div>
  )
}

/**
 * Puerta de entrada a la boutique.
 * Dos hojas lacadas en ciprés con herrajes de oro viejo: ceden unos grados cuando el cursor
 * se acerca a la rendija de luz y se abren hacia dentro con un clic, la rueda o un gesto.
 *
 * Rendimiento: todo lo que se mueve es `transform` u `opacity` sobre capas propias, así que
 * el navegador lo resuelve en la GPU sin recalcular estilos, maquetar ni repintar.
 */
export default function EntranceDoor({ onDone }) {
  const rootRef = useRef(null)
  const enterRef = useRef(null)
  const [opening, setOpening] = useState(false)
  const started = useRef(false)
  // Seguimiento del cursor con inercia: `target` lo escribe el puntero, `cur` lo persigue el bucle.
  const track = useRef({ raf: 0, near: 0, y: 0, tNear: 0, tY: 0, parts: null })
  const navigate = useNavigate()

  const open = useCallback(
    (to) => {
      if (started.current) return
      started.current = true
      const t = track.current
      cancelAnimationFrame(t.raf)
      t.raf = 0
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* almacenamiento bloqueado: la puerta volverá a mostrarse, sin más consecuencias */
      }
      if (to) {
        // La ruta nueva se monta primero; la puerta gira cuando el hilo principal ya está libre.
        navigate(to)
        setTimeout(() => setOpening(true), 160)
      } else {
        setOpening(true)
      }
    },
    [navigate],
  )

  // La página queda inerte detrás de la puerta. Se libera al desmontar, cuando ya no hay
  // nada animándose: cambiar `inert` recalcula estilos de todo el árbol.
  useEffect(() => {
    const html = document.documentElement
    const app = document.getElementById('root')
    const root = rootRef.current
    html.classList.add('has-door')
    if (app) app.inert = true
    track.current.parts = {
      leaves: [...root.querySelectorAll('.door__leaf')],
      sheens: [...root.querySelectorAll('.door__sheen')],
    }
    enterRef.current?.focus({ preventScroll: true })
    return () => {
      cancelAnimationFrame(track.current.raf)
      track.current.raf = 0
      html.classList.remove('has-door', 'door-opening')
      if (app) app.inert = false
    }
  }, [])

  // Al retirar el ángulo en línea en el mismo fotograma en que cambia el estado,
  // la transición CSS parte de donde estaba la hoja y sigue hasta la apertura.
  useLayoutEffect(() => {
    if (opening) track.current.parts?.leaves.forEach((el) => (el.style.transform = ''))
  }, [opening])

  useEffect(() => {
    if (!opening) return
    const html = document.documentElement
    const cue = setTimeout(() => html.classList.add('door-opening'), HERO_CUE_MS)
    const done = setTimeout(onDone, OPEN_MS)
    return () => {
      clearTimeout(cue)
      clearTimeout(done)
    }
  }, [opening, onDone])

  // Rueda, gesto táctil y teclado también empujan la puerta.
  useEffect(() => {
    if (opening) return
    let touchY = null
    // La página no debe desplazarse por detrás mientras la puerta sigue cerrada.
    const onWheel = (e) => {
      e.preventDefault()
      if (Math.abs(e.deltaY) > 6) open()
    }
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (touchY !== null && Math.abs(e.touches[0].clientY - touchY) > 28) open()
    }
    const onKey = (e) => {
      if (['Escape', 'ArrowDown', 'PageDown', 'End'].includes(e.key)) {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [opening, open])

  // El cursor atrae la luz de la rendija y entreabre las hojas. El bucle sólo corre mientras
  // hay diferencia entre el objetivo y el estado actual, y sólo escribe transform y opacity.
  const step = () => {
    const t = track.current
    t.raf = 0
    if (started.current || !t.parts) return
    t.near += (t.tNear - t.near) * 0.1
    t.y += (t.tY - t.y) * 0.14
    const angle = 1.1 + t.near * 5.2
    const [leafL, leafR] = t.parts.leaves
    leafL.style.transform = `rotateY(${angle.toFixed(3)}deg)`
    leafR.style.transform = `rotateY(${(-angle).toFixed(3)}deg)`
    const shift = `translate3d(0, ${(t.y * 100).toFixed(2)}%, 0)`
    const glow = (0.45 + t.near * 0.55).toFixed(3)
    t.parts.sheens.forEach((el) => {
      el.style.transform = shift
      el.style.opacity = glow
    })
    if (Math.abs(t.tNear - t.near) > 0.002 || Math.abs(t.tY - t.y) > 0.002) {
      t.raf = requestAnimationFrame(step)
    }
  }

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse' || started.current) return
    const t = track.current
    t.tNear = 1 - Math.min(1, Math.abs(e.clientX / window.innerWidth - 0.5) * 2.4)
    // La hoja de luz mide el doble que la puerta: ±25 % de su alto recorre la puerta entera.
    t.tY = (e.clientY / window.innerHeight - 0.46) * 0.5
    if (!t.raf) t.raf = requestAnimationFrame(step)
  }

  return createPortal(
    <div
      ref={rootRef}
      className="door"
      data-state={opening ? 'opening' : 'closed'}
      role="dialog"
      aria-modal="true"
      aria-label="Entrada a la boutique VESTIGIO"
      onPointerMove={onPointerMove}
    >
      <div className="door__light" aria-hidden="true" />

      <div className="door__scene" aria-hidden="true" onClick={() => open()}>
        <Leaf side="l" />
        <Leaf side="r" />
      </div>

      <div className="door__ui">
        <button ref={enterRef} type="button" className="btn btn--gold" onClick={() => open()}>
          Entrar a la boutique <ArrowIcon width={18} height={18} />
        </button>
        <button type="button" className="btn btn--ghost btn--on-dark" onClick={() => open('/museo')}>
          <CubeIcon width={18} height={18} /> Ir al museo 3D
        </button>
      </div>
    </div>,
    document.body,
  )
}
