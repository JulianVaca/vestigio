import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import cuts from './cuts.json'

/**
 * Vitrina 3D del calzado: un carrusel de pedestales de travertino.
 * Cada sneaker (el recorte con alfa de su foto de catálogo, con grosor) flota sobre su pedestal;
 * el anillo gira con inercia al arrastrar y el par que queda al frente se levanta y sigue al
 * cursor para dejar ver su volumen. Misma técnica y mismas reglas que el perchero (Rack3D).
 *
 * Rendimiento: `frameloop="demand"`. El bucle sólo corre mientras algo se mueve y la GPU queda
 * en reposo cuando la vitrina está quieta. Geometrías y materiales de pedestal son compartidos.
 */

// ---------- Medidas de la escena (metros aproximados) ----------
const W = 1.5 // ancho de la foto completa de frente
const H = (W * 4) / 3 // alto de la foto completa (3:4); cada par ocupa su encuadre dentro de ella
const RX = 3.05 // el anillo de pedestales es una elipse: ancha hacia los lados…
const RZ = 1.65 // …y menos profunda, para que la fila del fondo asome por encima de la del frente
const RING_Z = -0.45
const SPREAD = 0.4 // cuánto se cierran hacia el centro los pedestales del fondo (rad)
const FLOOR_Y = -1.3
const PED_H = 0.8
const PED_R = 0.52
const TOP_Y = FLOOR_Y + PED_H
const HOVER = 0.04 // aire entre el pedestal y la suela
const LIFT = 0.1 // lo que sube el par que se mira
const TURN = 0.95 // giro de los pares laterales hacia el centro (rad)
const LOOK = 0.6 // cuánto sigue al cursor el par del frente (rad)
const FOV = 30
// La cámara mira desde arriba: así se lee el anillo completo y no una fila plana.
const CAM = { y: 1.7, z: 6.5, lookY: -0.42 }
const CAM_PORTRAIT = { y: 1.75, z: 6.9, lookY: -0.4, fov: 36 }
const HAZE = '#ece4d3' // bruma del color del escenario: los pares del fondo se funden con él

// ---------- Recursos compartidos (se crean una vez por sesión) ----------
let shared = null
function getShared() {
  if (shared) return shared

  // Travertino con estrías de columna dórica: una textura pequeña que se repite alrededor del fuste.
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#e9dfca'
  g.fillRect(0, 0, 256, 64)
  const flutes = 16
  for (let i = 0; i < flutes; i++) {
    const x = (i * 256) / flutes
    const grad = g.createLinearGradient(x, 0, x + 256 / flutes, 0)
    grad.addColorStop(0, 'rgba(120,100,70,0.34)')
    grad.addColorStop(0.5, 'rgba(255,250,238,0.3)')
    grad.addColorStop(1, 'rgba(120,100,70,0.34)')
    g.fillStyle = grad
    g.fillRect(x, 0, 256 / flutes, 64)
  }
  const stone = new THREE.CanvasTexture(c)
  stone.colorSpace = THREE.SRGBColorSpace
  stone.wrapS = THREE.RepeatWrapping

  // Latón pulido como matcap (el mismo herraje dorado del perchero).
  const m = document.createElement('canvas')
  m.width = m.height = 128
  const mg = m.getContext('2d')
  const mgrad = mg.createRadialGradient(46, 40, 4, 64, 64, 70)
  mgrad.addColorStop(0, '#fff6d8')
  mgrad.addColorStop(0.28, '#e2c888')
  mgrad.addColorStop(0.62, '#b08a44')
  mgrad.addColorStop(0.86, '#6b5020')
  mgrad.addColorStop(1, '#3a2a0e')
  mg.fillStyle = mgrad
  mg.fillRect(0, 0, 128, 128)
  const matcap = new THREE.CanvasTexture(m)
  matcap.colorSpace = THREE.SRGBColorSpace

  // Sombra de contacto: mancha radial suave.
  const s = document.createElement('canvas')
  s.width = s.height = 64
  const sg = s.getContext('2d')
  const sgrad = sg.createRadialGradient(32, 32, 2, 32, 32, 32)
  sgrad.addColorStop(0, 'rgba(15,26,20,0.3)')
  sgrad.addColorStop(0.55, 'rgba(15,26,20,0.1)')
  sgrad.addColorStop(1, 'rgba(15,26,20,0)')
  sg.fillStyle = sgrad
  sg.fillRect(0, 0, 64, 64)
  const shadowTex = new THREE.CanvasTexture(s)

  shared = {
    stone: new THREE.MeshLambertMaterial({ map: stone }),
    cap: new THREE.MeshLambertMaterial({ color: '#f1e9d8' }),
    brass: new THREE.MeshMatcapMaterial({ matcap }),
    shadow: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    shaft: new THREE.CylinderGeometry(PED_R * 0.86, PED_R * 0.92, 1, 32, 1, true),
    disc: new THREE.CylinderGeometry(1, 1, 1, 32),
    ring: new THREE.TorusGeometry(PED_R * 0.9, 0.014, 6, 40),
    plane: new THREE.PlaneGeometry(1, 1),
    shoe: shoeGeometry(),
  }
  return shared
}

/**
 * El sneaker no es una lámina: son nueve capas del mismo recorte, apiladas con un leve abombado
 * en la puntera y el talón, que juntas dan un canto con grosor cuando el par gira.
 * Una sola geometría de 1 × 1 (cada par la escala a su encuadre) y una llamada de dibujo por par.
 */
function shoeGeometry({ layers = 9, thick = 0.2, bulge = 0.05, segX = 10 } = {}) {
  const pos = []
  const uv = []
  const col = []
  const idx = []
  for (let l = 0; l < layers; l++) {
    const zOff = -thick / 2 + (thick * l) / (layers - 1)
    // La capa delantera muestra la foto tal cual; las interiores quedan en penumbra.
    const shade = l === layers - 1 ? 1 : 0.62
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
const mod = (v, n) => ((v % n) + n) % n

/** Pedestal: basa, fuste estriado, ábaco y un filete de latón. Geometría y materiales compartidos. */
function Pedestal() {
  const s = getShared()
  return (
    <group>
      <mesh geometry={s.disc} material={s.cap} position={[0, FLOOR_Y + 0.035, 0]} scale={[PED_R * 1.04, 0.07, PED_R * 1.04]} />
      <mesh geometry={s.shaft} material={s.stone} position={[0, FLOOR_Y + PED_H / 2, 0]} scale={[1, PED_H - 0.12, 1]} />
      <mesh geometry={s.disc} material={s.cap} position={[0, TOP_Y - 0.03, 0]} scale={[PED_R, 0.06, PED_R]} />
      <mesh geometry={s.ring} material={s.brass} position={[0, TOP_Y - 0.065, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={s.plane} material={s.shadow} position={[0, FLOOR_Y + 0.003, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.9, 1.5, 1]} />
    </group>
  )
}

function Scene({ items, active, setHover, onSelect, sim }) {
  const s = getShared()
  const n = items.length
  const step = (Math.PI * 2) / n
  const { invalidate, camera, size, gl } = useThree()
  const stands = useRef([])
  const shoes = useRef([])
  const shadows = useRef([])
  const live = useRef(active)
  live.current = active

  // Tamaño real de cada par: su encuadre dentro de la foto de catálogo.
  const dims = useMemo(
    () =>
      items.map((item) => {
        const [x0, y0, x1, y1] = cuts[item.id] ?? [0, 0, 1, 1]
        return { w: W * (x1 - x0), h: H * (y1 - y0) }
      }),
    [items],
  )

  // Estado físico por par en arreglos planos: sin objetos ni basura por fotograma.
  const st = useMemo(() => {
    const f = () => new Float32Array(n)
    return { open: f(), openV: f(), look: 0, lookV: 0, nod: 0, nodV: 0 }
  }, [n])

  // Un material por par: sólo cambia la textura. Recorte por alphaTest puro, sin mipmaps,
  // para que el canto de las capas no se deshaga en puntos cuando el par gira.
  const mats = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const aniso = Math.min(4, gl.capabilities.getMaxAnisotropy())
    return items.map((item) => {
      const tex = loader.load(item.img.replace('.webp', '-cut.webp'), () => invalidate())
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = aniso
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter
      return new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, side: THREE.DoubleSide, alphaTest: 0.5 })
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

  // Elegir un par gira el anillo por el camino más corto hasta dejarlo al frente.
  useEffect(() => {
    const here = Math.round(sim.target)
    let d = mod(active - here, n)
    if (d > n / 2) d -= n
    if (!sim.dragging) sim.target = here + d
    invalidate()
  }, [active, n, sim, invalidate])

  // En pantallas estrechas la cámara encuadra el par central y deja asomar a sus vecinos.
  useEffect(() => {
    const portrait = size.width / size.height < 1.15
    const cam = portrait ? CAM_PORTRAIT : CAM
    camera.fov = cam.fov ?? FOV
    camera.position.set(0, cam.y, cam.z)
    camera.lookAt(0, cam.lookY, 0)
    camera.updateProjectionMatrix()
    sim.unitsPerPx = (portrait ? 1.5 : 2.4) / size.width
    sim.kick = invalidate
    invalidate()
    return () => {
      sim.kick = null
    }
  }, [camera, size.width, size.height, sim, invalidate])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const a = live.current
    let energy = 0

    // Anillo: sigue al objetivo con un resorte críticamente amortiguado (pesa, no rebota).
    const acc = (sim.target - sim.scroll) * 60 - sim.scrollV * 15.5
    sim.scrollV += acc * dt
    sim.scroll += sim.scrollV * dt
    energy += Math.abs(sim.scrollV) + Math.abs(sim.target - sim.scroll)

    // El par del frente sigue al cursor: gira y cabecea un poco para enseñar su canto.
    const lookGoal = sim.dragging ? 0 : sim.pointer * LOOK
    st.lookV += ((lookGoal - st.look) * 70 - st.lookV * 14) * dt
    st.look += st.lookV * dt
    const nodGoal = sim.dragging ? 0 : sim.pointerY * 0.14
    st.nodV += ((nodGoal - st.nod) * 70 - st.nodV * 14) * dt
    st.nod += st.nodV * dt
    energy += Math.abs(st.lookV) + Math.abs(lookGoal - st.look) + Math.abs(st.nodV) + Math.abs(nodGoal - st.nod)

    for (let i = 0; i < n; i++) {
      const goal = i === a ? 1 : 0
      st.openV[i] += ((goal - st.open[i]) * 90 - st.openV[i] * 15) * dt
      st.open[i] += st.openV[i] * dt
      energy += Math.abs(st.openV[i]) + Math.abs(goal - st.open[i])
      const o = st.open[i]

      // Reparto del anillo: los pares del fondo se juntan hacia el centro para asomar entre
      // los del frente en lugar de quedar tapados justo detrás de los laterales.
      const raw = (i - sim.scroll) * step
      const ang = raw + SPREAD * (1 - Math.cos(raw)) * Math.sin(raw)
      const x = Math.sin(ang) * RX
      const z = Math.cos(ang) * RZ + RING_Z
      stands.current[i].position.set(x, 0, z)

      // Los pares laterales miran hacia el centro; los del fondo vuelven a quedar de frente.
      const shoe = shoes.current[i]
      shoe.position.set(x, TOP_Y + HOVER + dims[i].h / 2 + o * LIFT, z)
      shoe.rotation.set(o * st.nod, -Math.sin(ang) * TURN + o * st.look, 0)
      const k = 1 + o * 0.08
      shoe.scale.set(dims[i].w * k, dims[i].h * k, k)

      const sh = shadows.current[i]
      sh.position.set(x, TOP_Y + 0.004, z)
      const spread = 0.35 + Math.abs(Math.cos(shoe.rotation.y)) * dims[i].w * 0.85
      sh.scale.set(spread * (1 - o * 0.12), 0.5, 1)
    }

    if (energy > 0.004) invalidate()
  })

  return (
    <>
      <fog attach="fog" args={[HAZE, 6.4, 13.5]} />
      <ambientLight intensity={2.2} />
      <directionalLight position={[-2.5, 4, 6]} intensity={1.4} />
      {items.map((item, i) => (
        <group key={item.id}>
          <group ref={(el) => (stands.current[i] = el)}>
            <Pedestal />
          </group>
          <mesh ref={(el) => (shadows.current[i] = el)} geometry={s.plane} material={s.shadow} rotation={[-Math.PI / 2, 0, 0]} />
          <mesh
            ref={(el) => (shoes.current[i] = el)}
            geometry={s.shoe}
            material={mats[i]}
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
      ))}
    </>
  )
}

export default function Pedestal3D({ items, active, onSelect, onReady }) {
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)
  const sim = useRef({
    scroll: active,
    scrollV: 0,
    target: active,
    dragging: false,
    moved: 0,
    pointer: 0,
    pointerY: 0,
    unitsPerPx: 0.002,
    kick: null,
  }).current

  const latest = useRef({ n: items.length, onSelect })
  latest.current = { n: items.length, onSelect }

  // Arrastre del anillo: horizontal con ratón o dedo; el scroll vertical de la página no se toca.
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
        // Al soltar, el anillo conserva parte del impulso y se detiene con un par al frente.
        const { n, onSelect: pick } = latest.current
        const rest = Math.round(sim.target - clamp(speed * 200 * sim.unitsPerPx, -1.6, 1.6))
        sim.target = rest
        setHover(null)
        pick(mod(rest, n))
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
      sim.pointerY = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)
      sim.kick?.()
    }
    const leave = () => {
      sim.pointer = 0
      sim.pointerY = 0
      sim.kick?.()
    }
    const wheel = (e) => {
      // Sólo el desplazamiento horizontal (trackpad) gira el anillo.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      sim.target += e.deltaX * sim.unitsPerPx * 0.9
      sim.kick?.()
      clearTimeout(wheel.t)
      wheel.t = setTimeout(() => {
        const { n, onSelect: pick } = latest.current
        sim.target = Math.round(sim.target)
        pick(mod(sim.target, n))
        sim.kick?.()
      }, 140)
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
      clearTimeout(wheel.t)
      up()
    }
  }, [sim])

  return (
    <div ref={wrapRef} className={`ped3d ${hover != null ? 'is-hover' : ''}`} aria-hidden="true">
      <Canvas
        flat
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: FOV, position: [0, CAM.y, CAM.z], near: 0.5, far: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
        onCreated={onReady}
      >
        <Scene items={items} active={active} setHover={setHover} onSelect={onSelect} sim={sim} />
      </Canvas>
    </div>
  )
}
