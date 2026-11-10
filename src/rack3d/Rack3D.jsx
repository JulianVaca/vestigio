import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { formatPrice } from '../data/products.js'
import cuts from './cuts.json'

/**
 * Perchero 3D de la boutique.
 * Una barra de latón con perchas reales: las prendas (recortes con alfa de las fotos del catálogo)
 * cuelgan de lado, se abren como las hojas de un libro alrededor de la que se mira, se balancean
 * con la inercia del riel y proyectan su sombra en el suelo.
 *
 * Rendimiento: `frameloop="demand"`. El bucle sólo corre mientras algo se mueve y la GPU queda
 * en reposo cuando el perchero está quieto. Geometrías y materiales de herraje son compartidos.
 */

// ---------- Medidas de la escena (metros aproximados) ----------
const W = 1.5 // ancho de la foto completa de frente
const H = 2.0 // alto de la foto completa (3:4); cada prenda ocupa su encuadre dentro de ella
const BULGE = 0.17 // cuánto se curvan los hombros hacia atrás, como sobre un torso
const SLOT = 0.36 // separación entre perchas cuando cuelgan de lado
const GAP = 0.64 // hueco que se abre a cada lado de la prenda que se mira
const SIDE = 1.3 // giro de una prenda colgada de lado (rad, ~75°)
const RAIL_Y = 1.3
const HOOK = 0.2 // de la barra al cruce de hombros
const FLOOR_Y = -1.27
const COLLAR = 0.075 // el cuello sube un poco por encima del cruce de hombros
const CAM_Y = 0.42
const CAM_Z = 6.2
const FOV = 30
const VIEW_H = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))

// ---------- Recursos compartidos (se crean una vez por sesión) ----------
let shared = null
function getShared() {
  if (shared) return shared

  // Latón pulido como matcap: brillo arriba a la izquierda, borde oscuro. No necesita luces ni entorno.
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(46, 40, 4, 64, 64, 70)
  grad.addColorStop(0, '#fff6d8')
  grad.addColorStop(0.28, '#e2c888')
  grad.addColorStop(0.62, '#b08a44')
  grad.addColorStop(0.86, '#6b5020')
  grad.addColorStop(1, '#3a2a0e')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const matcap = new THREE.CanvasTexture(c)
  matcap.colorSpace = THREE.SRGBColorSpace

  // Sombra de contacto: mancha radial suave.
  const s = document.createElement('canvas')
  s.width = s.height = 64
  const sg = s.getContext('2d')
  const sgrad = sg.createRadialGradient(32, 32, 2, 32, 32, 32)
  sgrad.addColorStop(0, 'rgba(15,26,20,0.17)')
  sgrad.addColorStop(0.55, 'rgba(15,26,20,0.06)')
  sgrad.addColorStop(1, 'rgba(15,26,20,0)')
  sg.fillStyle = sgrad
  sg.fillRect(0, 0, 64, 64)
  const shadowTex = new THREE.CanvasTexture(s)

  // Gancho: rodea la barra y baja hasta el cruce de hombros.
  const hook = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.035, -0.055),
      new THREE.Vector3(0, 0.02, -0.062),
      new THREE.Vector3(0, 0.062, -0.02),
      new THREE.Vector3(0, 0.058, 0.03),
      new THREE.Vector3(0, 0.015, 0.05),
      new THREE.Vector3(0, -0.04, 0.02),
      new THREE.Vector3(0, -0.085, 0),
      new THREE.Vector3(0, -HOOK, 0),
    ]),
    28,
    0.011,
    6,
  )
  // Hombros de la percha: quedan dentro de la prenda y asoman sólo por el cuello.
  const shoulders = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.46, -0.13, -BULGE * 0.38),
      new THREE.Vector3(-0.24, -0.045, -BULGE * 0.1),
      new THREE.Vector3(0, 0.005, 0),
      new THREE.Vector3(0.24, -0.045, -BULGE * 0.1),
      new THREE.Vector3(0.46, -0.13, -BULGE * 0.38),
    ]),
    20,
    0.016,
    6,
  )

  shared = {
    brass: new THREE.MeshMatcapMaterial({ matcap }),
    shadow: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    hook,
    shoulders,
    garment: garmentGeometry(),
    plane: new THREE.PlaneGeometry(1, 1),
    rod: new THREE.CylinderGeometry(0.032, 0.032, 1, 14),
    post: new THREE.CylinderGeometry(0.03, 0.03, 1, 12),
    foot: new THREE.CylinderGeometry(0.2, 0.22, 0.035, 24),
    finial: new THREE.SphereGeometry(0.06, 16, 12),
  }
  return shared
}

/**
 * La prenda no es una lámina: son once capas del mismo recorte, curvadas como un torso,
 * que juntas dan un canto con grosor cuando cuelga de lado. Una sola geometría de 1 × 1
 * (cada prenda la escala a su encuadre) y una sola llamada de dibujo por prenda.
 */
function garmentGeometry({ layers = 11, thick = 0.11, bulge = BULGE, segX = 14 } = {}) {
  const pos = []
  const uv = []
  const col = []
  const idx = []
  for (let l = 0; l < layers; l++) {
    const zOff = -thick / 2 + (thick * l) / (layers - 1)
    // La capa delantera muestra la foto tal cual; las interiores quedan en penumbra.
    const shade = l === layers - 1 ? 1 : 0.66
    const base = (pos.length / 3) | 0
    for (let iy = 0; iy <= 1; iy++) {
      for (let ix = 0; ix <= segX; ix++) {
        const u = ix / segX
        const k = 2 * u - 1
        pos.push(u - 0.5, iy - 0.5, zOff - bulge * k * k)
        uv.push(u, iy)
        col.push(shade, shade, shade)
      }
    }
    for (let ix = 0; ix < segX; ix++) {
      const a = base + ix
      const b = a + 1
      const c2 = a + segX + 1
      const d = c2 + 1
      idx.push(a, b, c2, b, d, c2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/** Herraje fijo: barra, remates y dos pies hasta el suelo. Se desplaza con el riel. */
function Hardware({ from, to }) {
  const s = getShared()
  const len = to - from
  const mid = (from + to) / 2
  const postH = RAIL_Y - FLOOR_Y
  return (
    <group>
      <mesh geometry={s.rod} material={s.brass} position={[mid, RAIL_Y, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, len, 1]} />
      {[from, to].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={s.finial} material={s.brass} position={[0, RAIL_Y, 0]} />
          <mesh geometry={s.post} material={s.brass} position={[0, FLOOR_Y + postH / 2, 0]} scale={[1, postH, 1]} />
          <mesh geometry={s.foot} material={s.brass} position={[0, FLOOR_Y + 0.018, 0]} />
          <mesh geometry={s.plane} material={s.shadow} position={[0, FLOOR_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.9, 0.7, 1]} />
        </group>
      ))}
    </group>
  )
}

function Scene({ items, active, hover, setHover, onSelect, sim, labelRef }) {
  const s = getShared()
  const n = items.length
  const { invalidate, camera, size, gl } = useThree()
  const rail = useRef(null)
  const pivots = useRef([])
  const bodies = useRef([])
  const shadows = useRef([])
  const live = useRef({ active, hover })
  live.current.active = active
  live.current.hover = hover

  // Tamaño real de cada prenda: su encuadre dentro de la foto de catálogo.
  const dims = useMemo(
    () =>
      items.map((item) => {
        const [x0, y0, x1, y1] = cuts[item.id] ?? [0, 0, 1, 1]
        const w = W * (x1 - x0)
        return { w, h: H * (y1 - y0), bar: Math.min(1, (w * 0.62) / 0.92) }
      }),
    [items],
  )

  // Estado físico por prenda en arreglos planos: sin objetos ni basura por fotograma.
  const st = useMemo(() => {
    const f = () => new Float32Array(n)
    const o = { open: f(), openV: f(), yaw: f(), yawV: f(), swing: f(), swingV: f(), tilt: f(), tiltV: f(), rel: f(), vel: f(), first: true }
    for (let i = 0; i < n; i++) {
      o.yaw[i] = SIDE
      // Al montarse, las prendas quedan meciéndose como recién colgadas.
      o.swingV[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1 > 0 ? 0.9 : -0.9
      o.swingV[i] *= 0.6 + ((i * 7) % 5) * 0.12
    }
    return o
  }, [n])

  // Un material por prenda: sólo cambia la textura. Recorte por alphaTest puro: alphaToCoverage
  // deshace en puntos el canto de las capas cuando la prenda cuelga de lado.
  const mats = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const aniso = Math.min(4, gl.capabilities.getMaxAnisotropy())
    return items.map((item) => {
      const tex = loader.load(item.img.replace('.webp', '-cut.webp'), () => invalidate())
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = aniso
      // Sin mipmaps: de lado, los niveles reducidos promedian el alfa y el borde del recorte se deshace en puntos.
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter
      return new THREE.MeshLambertMaterial({
        map: tex,
        vertexColors: true,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
      })
    })
  }, [items, gl, invalidate])

  useEffect(
    () => () =>
      mats.forEach((m) => {
        m.map?.dispose()
        m.dispose()
      }),
    [mats],
  )

  // Elegir una prenda la lleva al centro; un golpe de inclinación le da peso al abrirse.
  useEffect(() => {
    sim.target = clamp(active * SLOT, 0, (n - 1) * SLOT)
    invalidate()
  }, [active, n, sim, invalidate])
  useEffect(() => {
    if (hover != null) st.tiltV[hover] -= 0.5
    invalidate()
  }, [hover, st, invalidate])

  useEffect(() => {
    sim.kick = invalidate
    sim.unitsPerPx = VIEW_H / size.height
    return () => {
      sim.kick = null
    }
  }, [sim, invalidate, size.height])

  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const { active: a, hover: h } = live.current
    let energy = 0

    // Riel: sigue al objetivo con un resorte críticamente amortiguado (se siente pesado, no elástico).
    const max = (n - 1) * SLOT
    sim.target = clamp(sim.target, -0.6, max + 0.6)
    if (!sim.dragging) sim.target += (clamp(sim.target, 0, max) - sim.target) * Math.min(1, dt * 8)
    const acc = (sim.target - sim.scroll) * 70 - sim.scrollV * 16.5
    sim.scrollV += acc * dt
    sim.scroll += sim.scrollV * dt
    energy += Math.abs(sim.scrollV) + Math.abs(sim.target - sim.scroll)
    rail.current.position.x = -sim.scroll

    // Apertura: la prenda activa y la que está bajo el cursor giran de frente.
    let openSum = 0
    for (let i = 0; i < n; i++) {
      const goal = i === a || i === h ? 1 : 0
      const f = (goal - st.open[i]) * 110 - st.openV[i] * 17
      st.openV[i] += f * dt
      st.open[i] += st.openV[i] * dt
      openSum += st.open[i]
      energy += Math.abs(st.openV[i]) + Math.abs(goal - st.open[i])
    }

    let before = 0
    for (let i = 0; i < n; i++) {
      const o = st.open[i]
      // Las vecinas se apartan: cada prenda abierta empuja a las de su derecha e izquierda.
      const x = i * SLOT + GAP * (before - (openSum - before - o))
      before += o
      const rel = x - sim.scroll

      // Giro: de lado miran hacia el centro del perchero, como las hojas de un libro abierto.
      const yawGoal = SIDE * clamp(-rel / 0.5, -1, 1) * (1 - clamp(o, 0, 1))
      const yf = (yawGoal - st.yaw[i]) * 60 - st.yawV[i] * 13
      st.yawV[i] += yf * dt
      st.yaw[i] += st.yawV[i] * dt

      // Balanceo: péndulo colgado de la barra, empujado por la aceleración lateral de la percha.
      const vel = st.first ? 0 : (rel - st.rel[i]) / dt
      const push = st.first ? 0 : clamp((vel - st.vel[i]) / dt, -45, 45)
      st.rel[i] = rel
      st.vel[i] = vel
      st.swingV[i] += (-st.swing[i] * 34 - st.swingV[i] * 2.1 - push * 0.055) * dt
      st.swing[i] = clamp(st.swing[i] + st.swingV[i] * dt, -0.5, 0.5)
      st.tiltV[i] += (-st.tilt[i] * 48 - st.tiltV[i] * 5) * dt
      st.tilt[i] += st.tiltV[i] * dt
      energy += Math.abs(st.swingV[i]) + Math.abs(st.swing[i]) + Math.abs(st.tiltV[i]) + Math.abs(st.yawV[i])

      const p = pivots.current[i]
      p.position.x = x
      p.rotation.set(st.tilt[i], 0, st.swing[i])
      const b = bodies.current[i]
      b.rotation.y = st.yaw[i]
      b.position.z = o * 0.28
      const sh = shadows.current[i]
      sh.position.x = x + Math.sin(st.swing[i]) * 1.6
      sh.scale.set(0.45 + Math.abs(Math.cos(st.yaw[i])) * dims[i].w, 0.75 + o * 0.35, 1)
    }
    st.first = false

    // Cámara: un paso lateral mínimo con el cursor da paralaje entre barra, prendas y suelo.
    const cx = sim.pointer * 0.22
    camera.position.x += (cx - camera.position.x) * Math.min(1, dt * 5)
    camera.lookAt(camera.position.x * 0.35, -0.02, 0)
    energy += Math.abs(cx - camera.position.x)

    // Etiqueta HTML bajo la prenda que se mira.
    const label = labelRef.current
    const li = h ?? a
    if (label && pivots.current[li]) {
      v.set(pivots.current[li].position.x - sim.scroll, FLOOR_Y + 0.2, 0.3).project(camera)
      label.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * size.width).toFixed(1)}px, 0, 0) translateX(-50%)`
    }

    if (energy > 0.004) invalidate()
  })

  return (
    <>
      <ambientLight intensity={2.25} />
      <directionalLight position={[-2.5, 4, 6]} intensity={1.35} />
      <group ref={rail}>
        <Hardware from={-GAP - 0.95} to={(n - 1) * SLOT + GAP + 0.95} />
        {items.map((item, i) => (
          <group key={item.id}>
            <group ref={(el) => (pivots.current[i] = el)} position={[i * SLOT, RAIL_Y, 0]}>
              <mesh geometry={s.hook} material={s.brass} />
              <group ref={(el) => (bodies.current[i] = el)} rotation={[0, SIDE, 0]}>
                <mesh geometry={s.shoulders} material={s.brass} position={[0, -HOOK, 0]} scale={[dims[i].bar, 1, 1]} />
                <mesh
                  geometry={s.garment}
                  material={mats[i]}
                  position={[0, -HOOK + COLLAR - dims[i].h / 2, 0.012]}
                  scale={[dims[i].w, dims[i].h, 1]}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    if (!sim.dragging) setHover(i)
                  }}
                  onPointerOut={() => setHover((cur) => (cur === i ? null : cur))}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (sim.moved < 6) onSelect(i)
                  }}
                />
              </group>
            </group>
            <mesh
              ref={(el) => (shadows.current[i] = el)}
              geometry={s.plane}
              material={s.shadow}
              position={[i * SLOT, FLOOR_Y, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            />
          </group>
        ))}
      </group>
    </>
  )
}

export default function Rack3D({ items, active, onSelect, onReady }) {
  const [hover, setHover] = useState(null)
  const labelRef = useRef(null)
  const wrapRef = useRef(null)
  const sim = useRef({ scroll: 0, scrollV: 0, target: 0, dragging: false, moved: 0, pointer: 0, unitsPerPx: 0.008, kick: null }).current

  const latest = useRef({ n: items.length, onSelect })
  latest.current = { n: items.length, onSelect }

  // Arrastre del riel: horizontal con ratón o dedo; el scroll vertical de la página no se toca.
  useEffect(() => {
    const el = wrapRef.current
    let startX = 0
    let startTarget = 0
    let lastX = 0
    let lastT = 0
    let speed = 0
    const move = (e) => {
      const dx = e.clientX - startX
      sim.moved = Math.max(sim.moved, Math.abs(dx))
      if (sim.moved > 5) {
        sim.dragging = true
        el.classList.add('is-dragging')
        sim.target = startTarget - dx * sim.unitsPerPx
        const now = performance.now()
        if (now > lastT) speed = ((e.clientX - lastX) / (now - lastT)) * 0.6 + speed * 0.4
        lastX = e.clientX
        lastT = now
        sim.kick?.()
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (sim.dragging) {
        // Al soltar, el riel conserva parte del impulso y se detiene en la prenda más cercana,
        // que queda abierta en el centro: siempre hay una pieza a la vista y en la ficha.
        const { n, onSelect: pick } = latest.current
        const rest = clamp(sim.target - speed * 220 * sim.unitsPerPx, 0, (n - 1) * SLOT)
        setHover(null)
        const idx = Math.round(rest / SLOT)
        sim.target = idx * SLOT
        pick(idx)
      }
      sim.dragging = false
      el.classList.remove('is-dragging')
      sim.kick?.()
    }
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      startX = lastX = e.clientX
      lastT = performance.now()
      speed = 0
      startTarget = sim.target
      sim.moved = 0
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }
    const hoverMove = (e) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      sim.pointer = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
      sim.kick?.()
    }
    const leave = () => {
      sim.pointer = 0
      sim.kick?.()
    }
    const wheel = (e) => {
      // Sólo el desplazamiento horizontal (trackpad) mueve el riel.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      sim.target += e.deltaX * sim.unitsPerPx * 0.9
      sim.kick?.()
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', hoverMove)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', hoverMove)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('wheel', wheel)
      up()
    }
  }, [sim])

  const shown = items[hover ?? active]

  return (
    <div ref={wrapRef} className={`rack3d ${hover != null ? 'is-hover' : ''}`} aria-hidden="true">
      <Canvas
        flat
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: FOV, position: [0, CAM_Y, CAM_Z], near: 0.5, far: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        onCreated={onReady}
      >
        <Scene
          items={items}
          active={active}
          hover={hover}
          setHover={setHover}
          onSelect={onSelect}
          sim={sim}
          labelRef={labelRef}
        />
      </Canvas>
      {shown && (
        <div ref={labelRef} className="rack3d__label">
          <span className="rack3d__label-name">{shown.name}</span>
          <span className="rack3d__label-price">{formatPrice(shown.price)}</span>
        </div>
      )}
    </div>
  )
}
