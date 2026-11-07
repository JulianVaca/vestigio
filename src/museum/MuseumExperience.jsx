import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Scene from './Scene.jsx'
import IntroCard from './IntroCard.jsx'
import Rig from './Rig.jsx'
import { stations, HALL, dividers, exhibits, sculptures, DOOR_HALF } from './layout.js'
import { rooms, getProduct, formatPrice } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { flyToCart } from '../lib/flyToCart.js'
import { ArrowIcon, ArrowLeftIcon, CloseIcon, PlayIcon, PauseIcon, PlusIcon, CheckIcon } from '../components/Icons.jsx'

const AUTOPLAY_MS = 6500

/**
 * Perfil de calidad calculado una sola vez al montar.
 * En PC el cuello de botella es el fill-rate: monitores 1440p/4K con DPR 1.25–1.5
 * y MSAA multiplicaban los píxeles por fotograma. Se fija un presupuesto de píxeles
 * y el antialiasing sólo se activa cuando el lienzo resultante es moderado.
 */
function detectQuality() {
  if (typeof window === 'undefined') return { lowPower: false, maxDpr: 1, minDpr: 0.75, antialias: true }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 8
  const lowPower = coarse || cores <= 4
  const deviceDpr = window.devicePixelRatio || 1
  const px = window.innerWidth * window.innerHeight
  const budget = lowPower ? 1.35e6 : 2.3e6 // píxeles renderizados por fotograma
  const byBudget = Math.sqrt(budget / px)
  const maxDpr = Math.max(Math.min(1, deviceDpr), Math.min(deviceDpr, lowPower ? 1.2 : 1.4, byBudget))
  const antialias = !lowPower && px * maxDpr * maxDpr <= 2.3e6
  return { lowPower, maxDpr, minDpr: Math.min(maxDpr, 0.7), antialias }
}

/**
 * DPR adaptativo SÓLO DE BAJADA.
 * Sólo baja un escalón cuando los FPS se mantienen bajos 3 s seguidos, como máximo
 * dos veces por visita, y nunca vuelve a subir para evitar recrear framebuffers en GPU.
 */
function AdaptiveDpr({ min, max }) {
  const setDpr = useThree((s) => s.setDpr)
  const st = useRef({ acc: 0, frames: 0, dpr: max, slow: 0, warmup: 3, steps: 0 })
  useFrame((_, delta) => {
    const s = st.current
    if (s.steps >= 2 || s.dpr <= min) return
    if (delta > 0.25) return
    s.acc += delta
    s.frames++
    if (s.acc < 1) return
    const fps = s.frames / s.acc
    s.acc = 0
    s.frames = 0
    if (s.warmup > 0) {
      s.warmup--
      return
    }
    s.slow = fps < 42 ? s.slow + 1 : 0
    if (s.slow >= 2) {
      s.dpr = Math.max(min, +(s.dpr - 0.2).toFixed(2))
      s.steps++
      s.slow = 0
      s.warmup = 2
      setDpr(s.dpr)
    }
  })
  return null
}

/** Minimapa memoizado: no vuelve a reconciliar los 45 nodos SVG salvo que cambie la sala o la obra activa. */
const Minimap = memo(function Minimap({ room, selected, minimapPlayer, onMinimapClick }) {
  return (
    <figure className="minimap" aria-label="Plano del museo. Toca un punto para caminar hasta allí.">
      <svg viewBox={`-0.5 -0.5 ${HALL.zStart - HALL.zEnd + 1} ${HALL.halfW * 2 + 1}`} onClick={onMinimapClick}>
        <rect x="0" y="0" width={HALL.zStart - HALL.zEnd} height={HALL.halfW * 2} className="minimap__hall" />
        {rooms.map((r, i) => (
          <rect
            key={r.id}
            x={HALL.zStart - dividers[i]}
            y="0"
            width={HALL.roomLen}
            height={HALL.halfW * 2}
            className={`minimap__room ${room === i ? 'is-active' : ''}`}
          />
        ))}
        {dividers.map((z) => (
          <g key={z} className="minimap__wall">
            <line x1={HALL.zStart - z} x2={HALL.zStart - z} y1="0" y2={HALL.halfW - DOOR_HALF} />
            <line x1={HALL.zStart - z} x2={HALL.zStart - z} y1={HALL.halfW + DOOR_HALF} y2={HALL.halfW * 2} />
          </g>
        ))}
        {sculptures.map((s, i) => (
          <circle key={i} cx={HALL.zStart - s.z} cy={s.x + HALL.halfW} r="0.65" className="minimap__sculpture" />
        ))}
        {exhibits.map((e) => (
          <rect
            key={e.product.id}
            x={HALL.zStart - e.position[2] - 0.8}
            y={e.side === -1 ? 0 : HALL.halfW * 2 - 0.55}
            width="1.6"
            height="0.55"
            className={`minimap__art ${selected === e.product.id ? 'is-active' : ''}`}
          />
        ))}
        <g ref={minimapPlayer}>
          <path d="M1.6 0 L-0.9 -1.0 L-0.4 0 L-0.9 1.0 Z" className="minimap__player" />
        </g>
      </svg>
    </figure>
  )
})

export default function MuseumExperience({ reduced, initialStation = 0, initialProduct = null, autoStart = false }) {
  const navigate = useNavigate()
  const controller = useRef(null)
  const minimapPlayer = useRef(null)
  const hintRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [started, setStarted] = useState(false)
  const [station, setStation] = useState(null)
  const [room, setRoom] = useState(-1)
  const [selected, setSelected] = useState(null)
  const [autoplay, setAutoplay] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [quality] = useState(detectQuality)
  const { lowPower } = quality
  const [isPortrait] = useState(() => typeof window !== 'undefined' && window.innerWidth < window.innerHeight)

  const handleReady = useCallback(() => setLoaded(true), [])
  // Hover imperativo sobre el DOM: pasar el cursor por los 30 racks produce CERO re-renders de React
  const handleHover = useCallback((id) => {
    const el = hintRef.current
    if (!el) return
    if (id) {
      const p = getProduct(id)
      el.textContent = p ? `${p.name} · clic en el rack para elegir talla` : ''
      el.style.display = p ? '' : 'none'
    } else {
      el.style.display = 'none'
    }
  }, [])

  const glOptions = useMemo(
    () => ({ antialias: quality.antialias, powerPreference: 'high-performance', stencil: false, alpha: false }),
    [quality.antialias],
  )
  const cameraOptions = useMemo(
    () => ({ fov: isPortrait ? 76 : 60, near: 0.1, far: 95, position: [0, 1.68, 9.8] }),
    [isPortrait],
  )

  useEffect(() => {
    const m = THREE.DefaultLoadingManager
    m.onProgress = (_, done, total) => setProgress(done / total)
    return () => {
      m.onProgress = undefined
    }
  }, [])

  const goTo = useCallback((i, { openPanel = true } = {}) => {
    const idx = (i + stations.length) % stations.length
    controller.current?.goToStation(idx)
    setStation(idx)
    const pid = stations[idx].productId
    setSelected(openPanel && pid ? pid : null)
  }, [])

  const jumpToRoom = useCallback(
    (roomIdx) => {
      setAutoplay(false)
      if (roomIdx === -1) {
        goTo(0, { openPanel: false })
      } else {
        goTo(1 + roomIdx * 6, { openPanel: false })
      }
    },
    [goTo],
  )

  const start = () => {
    setStarted(true)
    const target = initialProduct ? stations.findIndex((s) => s.productId === initialProduct) : initialStation
    goTo(target >= 0 ? target : 0, { openPanel: Boolean(initialProduct) })
  }

  const startRef = useRef(start)
  startRef.current = start
  useEffect(() => {
    if (autoStart && loaded && !started) startRef.current()
  }, [autoStart, loaded, started])

  const stationRef = useRef(station)
  stationRef.current = station
  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => goTo((stationRef.current ?? -1) + 1), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [autoplay, goTo])

  const onUserInteract = useCallback(() => {
    setAutoplay(false)
  }, [])

  const onFloorClick = useCallback((x, z) => {
    if (controller.current?.walkTo(x, z)) {
      setStation(null)
      setAutoplay(false)
    }
  }, [])

  const onSelect = useCallback(
    (id) => {
      setAutoplay(false)
      goTo(stations.findIndex((s) => s.productId === id))
    },
    [goTo],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'Escape') setSelected(null)
      if (!started) return
      if (e.key === 'n' || e.key === 'N' || e.key === 'PageDown') goTo((station ?? 0) + 1)
      if (e.key === 'p' || e.key === 'P' || e.key === 'PageUp') goTo((station ?? 1) - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, station, goTo])

  const onMinimapClick = useCallback((e) => {
    const svg = e.currentTarget
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    const x = p.y - HALL.halfW
    const z = HALL.zStart - p.x
    if (controller.current?.walkTo(x, z)) setStation(null)
  }, [])

  const onArrive = useCallback(() => {}, [])

  const current = station !== null ? stations[station] : null
  const roomLabel = room === -1 ? 'Pórtico · Vestíbulo' : rooms[room]?.name ?? 'Museo'

  return (
    <div className={`museum museum--live ${started ? 'is-started' : ''}`}>
      <Canvas
        className="museum__canvas"
        dpr={quality.maxDpr}
        gl={glOptions}
        camera={cameraOptions}
        onCreated={({ gl }) => {
          if (import.meta.env.PROD) gl.debug.checkShaderErrors = false
        }}
        aria-label="Museo 3D interactivo de la colección Ágora y Archivo"
        role="img"
      >
        <color attach="background" args={['#EAE4D7']} />
        <fog attach="fog" args={['#EAE4D7', 18, 56]} />
        <AdaptiveDpr min={quality.minDpr} max={quality.maxDpr} />
        <Suspense fallback={null}>
          <Scene
            reduced={reduced}
            lowPower={lowPower}
            onHover={handleHover}
            onSelect={onSelect}
            onFloorClick={onFloorClick}
            onNavigate={navigate}
            onReady={handleReady}
          />
        </Suspense>
        <Rig
          controllerRef={controller}
          started={started}
          reduced={reduced}
          onRoomChange={setRoom}
          onArrive={onArrive}
          onUserInteract={onUserInteract}
          minimapRef={minimapPlayer}
        />
      </Canvas>

      {/* ───────── Intro / carga ───────── */}
      <AnimatePresence>
        {!started && (
          <motion.div
            className="museum__intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
          >
            <motion.div exit={{ y: -30, opacity: 0, transition: { duration: 0.45 } }}>
              <IntroCard
                status={loaded ? 'ready' : 'loading'}
                progress={loaded ? 1 : Math.max(0.03, progress)}
                onEnter={start}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          {/* ───────── Sala actual + Selector rápido de salas ───────── */}
          <div className="museum__hud-top">
            <div className="museum__room" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.p
                  key={room}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {roomLabel}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="museum__room-pills" role="navigation" aria-label="Salto rápido por salas">
              <button
                type="button"
                className={`museum__room-pill ${room === -1 ? 'is-active' : ''}`}
                onClick={() => jumpToRoom(-1)}
              >
                Pórtico
              </button>
              {rooms.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={`museum__room-pill ${room === i ? 'is-active' : ''}`}
                  onClick={() => jumpToRoom(i)}
                >
                  {r.name.split('·')[0].trim()} · {r.name.split('·')[1]?.trim()}
                </button>
              ))}
            </div>
          </div>

          <Minimap room={room} selected={selected} minimapPlayer={minimapPlayer} onMinimapClick={onMinimapClick} />

          {/* ───────── Barra del recorrido ───────── */}
          <nav className="tour" aria-label="Recorrido guiado">
            <button className="icon-btn" onClick={() => goTo((station ?? 1) - 1)} aria-label="Obra anterior">
              <ArrowLeftIcon />
            </button>
            <div className="tour__label">
              <span className="tour__count">
                {current ? String(station + 1).padStart(2, '0') : '··'} / {String(stations.length).padStart(2, '0')}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={current?.id ?? 'free'}
                  className="tour__name"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {current ? current.label : 'Recorrido libre'}
                </motion.span>
              </AnimatePresence>
            </div>
            <button className="icon-btn" onClick={() => goTo((station ?? -1) + 1)} aria-label="Obra siguiente">
              <ArrowIcon />
            </button>
            <span className="tour__sep" aria-hidden="true" />
            <button
              className={`icon-btn ${autoplay ? 'is-on' : ''}`}
              onClick={() => {
                if (!autoplay) goTo((station ?? -1) + 1)
                setAutoplay((a) => !a)
              }}
              aria-pressed={autoplay}
              aria-label={autoplay ? 'Pausar recorrido automático' : 'Recorrido automático'}
              title="Recorrido automático"
            >
              {autoplay ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              className="icon-btn tour__help"
              onClick={() => setShowHelp((v) => !v)}
              aria-expanded={showHelp}
              aria-label="Ayuda de controles"
            >
              ?
            </button>
          </nav>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                className="museum__help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <ul className="museum__keys">
                  <li>
                    <kbd>Arrastrar</kbd> mirar alrededor
                  </li>
                  <li>
                    <kbd>Clic</kbd> piso: caminar · rack: ver prenda y talla
                  </li>
                  <li>
                    <kbd>WASD</kbd> / flechas: caminar libremente
                  </li>
                  <li>
                    <kbd>N</kbd> <kbd>P</kbd> rack siguiente / anterior (30 prendas)
                  </li>
                  <li>
                    <kbd>Esc</kbd> cerrar panel
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ───────── Panel de Rack de la prenda seleccionada ───────── */}
          <AnimatePresence>
            {selected && (
              <ProductPanel
                key={selected}
                id={selected}
                reduced={reduced}
                onSelectOther={(otherId) => onSelect(otherId)}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>

          <div
            ref={hintRef}
            className="museum__hint"
            style={{ display: selected ? 'none' : 'none' }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  )
}

function ProductPanel({ id, reduced, onSelectOther, onClose }) {
  const p = getProduct(id)
  const { add } = useCart()
  const [size, setSize] = useState(null)
  const [state, setState] = useState('idle')
  const img = useRef(null)

  const roomItems = useMemo(
    () => exhibits.filter((e) => e.product.room === p.room).map((e) => e.product),
    [p.room],
  )

  const handleAdd = () => {
    if (!size) {
      setState('error')
      setTimeout(() => setState('idle'), 600)
      return
    }
    flyToCart(img.current, reduced)
    add(p.id, size)
    setState('done')
    setTimeout(() => setState('idle'), 1600)
  }

  return (
    <motion.aside
      className="panel"
      aria-label={`Rack de ${p.name}`}
      initial={{ x: '110%', opacity: 0.5 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '110%', opacity: 0.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <button className="icon-btn panel__close" onClick={onClose} aria-label="Cerrar panel">
        <CloseIcon />
      </button>

      {/* Selector de perchas del rack de la sala actual */}
      <div className="panel__rack-strip" aria-label="Otras prendas en los racks de esta sala">
        <span className="panel__rack-label">Rack de {rooms[p.room].name.split('·')[1]?.trim()}:</span>
        <div className="panel__rack-thumbs">
          {roomItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`panel__rack-thumb ${item.id === p.id ? 'is-active' : ''}`}
              onClick={() => onSelectOther(item.id)}
              title={item.name}
            >
              <img src={item.img.replace('.webp', '-sm.webp')} alt={item.name} width="56" height="74" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      <div className="panel__garment-preview">
        <img
          ref={img}
          src={p.img.replace('.webp', '-sm.webp')}
          alt={p.name}
          width="420"
          height="560"
          decoding="async"
        />
      </div>

      <div>
        <p className="eyebrow">
          {rooms[p.room].name} · {p.brand}
        </p>
        <h2 className="panel__title">{p.name}</h2>
        <p className="panel__price">{formatPrice(p.price)}</p>
      </div>

      <p className="panel__desc">{p.description}</p>

      <fieldset className={`sizes sizes--sm ${state === 'error' ? 'is-error' : ''}`}>
        <legend>
          Talla disponible{' '}
          {state === 'error' && (
            <span className="sizes__hint" role="alert">
              · Elige una talla
            </span>
          )}
        </legend>
        <motion.div
          className="sizes__row"
          animate={state === 'error' && !reduced ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {p.sizes.map((s) => (
            <label key={s} className={`size ${size === s ? 'size--active' : ''}`} onClick={() => setSize(s)}>
              <input
                type="radio"
                name="panel-size"
                value={s}
                checked={size === s}
                onChange={() => setSize(s)}
                className="sr-only"
              />
              {size === s && <motion.span layoutId="panel-size-pill" className="size__pill" />}
              <span className="size__label">{s}</span>
            </label>
          ))}
        </motion.div>
      </fieldset>

      <div className="panel__actions">
        <motion.button className="btn btn--primary btn--block" onClick={handleAdd} whileTap={{ scale: 0.96 }}>
          {state === 'done' ? (
            <>
              <CheckIcon width={18} height={18} /> Añadido al carrito
            </>
          ) : (
            <>
              <PlusIcon width={18} height={18} /> Descolgar al carrito
            </>
          )}
        </motion.button>
        <Link to={`/producto/${p.id}`} className="btn btn--ghost btn--block">
          Ver ficha completa de la prenda
        </Link>
      </div>
    </motion.aside>
  )
}
