import { products, rooms } from '../data/products.js'

/**
 * Plano del museo (unidades = metros).
 *
 *   z = +10  ┌───────────── muro de entrada ─────────────┐
 *            │        VESTÍBULO  (escultura original)    │
 *   z =  -2  ├──────┐                         ┌──────────┤  ← muro divisor con vano
 *            │ SALA I · Estructura                       │
 *   z = -14  ├──────┐                         ┌──────────┤
 *            │ SALA II · Pigmento                        │
 *   z = -26  ├──────┐                         ┌──────────┤
 *            │ SALA III · Línea                          │
 *   z = -38  ├──────┐                         ┌──────────┤
 *            │ SALA IV · Pátina                          │
 *   z = -50  └──────────── muro final (logo) ────────────┘
 *           x = -5                                   x = +5
 */
export const HALL = { halfW: 5, height: 5, zStart: 10, zEnd: -50, roomLen: 12, firstDivider: -2 }
export const EYE = 1.65
export const DOOR_HALF = 2.4
export const dividers = rooms.map((_, i) => HALL.firstDivider - i * HALL.roomLen) // [-2,-14,-26,-38]
export const roomCenter = (i) => HALL.firstDivider - HALL.roomLen / 2 - i * HALL.roomLen // -8,-20,-32,-44

export const ENTRANCE_SCULPTURE = { x: 0, z: 2.5 }
export const sculptures = [ENTRANCE_SCULPTURE, ...rooms.map((_, i) => ({ x: 0, z: roomCenter(i) }))]

/** Cada prenda se cuelga en un muro lateral; la primera de la sala a la izquierda, la segunda a la derecha. */
export const exhibits = products.map((p) => {
  const inRoom = products.filter((q) => q.room === p.room)
  const k = inRoom.indexOf(p)
  const side = k === 0 ? -1 : 1
  const z = roomCenter(p.room) + (k === 0 ? 2.6 : -2.6)
  return {
    product: p,
    side,
    position: [side * (HALL.halfW - 0.06), 1.95, z],
    rotationY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
  }
})

const lookAt = (px, pz, tx, ty, tz) => {
  const dx = tx - px
  const dz = tz - pz
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ty - EYE, Math.hypot(dx, dz)) }
}

/** Paradas del recorrido guiado (vestíbulo → 8 piezas → muro final). */
export const stations = [
  {
    id: 'entrada',
    label: 'Vestíbulo · Ánfora textil',
    room: -1,
    x: 0,
    z: 7.4,
    ...lookAt(0, 7.4, 0, 1.5, ENTRANCE_SCULPTURE.z),
  },
  ...exhibits.map((e) => {
    const x = e.side * 2.05
    const z = e.position[2]
    return { id: e.product.id, label: e.product.name, room: e.product.room, productId: e.product.id, x, z, ...lookAt(x, z, e.position[0], 1.85, z) }
  }),
  // frente al muro final de la Sala IV, con el botón 3D "VER CATÁLOGO" despejado
  { id: 'final', label: 'Fin del recorrido', room: 3, x: 0, z: -46.0, ...lookAt(0, -46.0, 0, 2.1, HALL.zEnd) },
]

export const START = { x: 0, z: 9.4, yaw: 0, pitch: 0.06 }

/** ¿En qué sala está el visitante? -1 = vestíbulo */
export function roomAt(z) {
  if (z > HALL.firstDivider) return -1
  return Math.min(rooms.length - 1, Math.floor((HALL.firstDivider - z) / HALL.roomLen))
}

/* ───────────────────────── Colisiones y rutas ───────────────────────── */

const MARGIN = 0.55
export function walkable(x, z) {
  if (Math.abs(x) > HALL.halfW - MARGIN) return false
  if (z > HALL.zStart - MARGIN || z < HALL.zEnd + MARGIN) return false
  for (const d of dividers) if (Math.abs(z - d) < 0.2 + MARGIN && Math.abs(x) > DOOR_HALF - MARGIN) return false
  for (const s of sculptures) if (Math.hypot(x - s.x, z - s.z) < 0.95) return false
  return true
}

function segmentClear(a, b) {
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.max(2, Math.ceil(len / 0.2))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false
  }
  return true
}

// Nodos de navegación: vanos de las puertas y pasillos a los lados de cada escultura
const navNodes = [
  ...dividers.map((z) => ({ x: 0, z })),
  ...sculptures.flatMap((s) => [
    { x: -1.8, z: s.z },
    { x: 1.8, z: s.z },
  ]),
  { x: 0, z: 6.5 },
]

/**
 * Ruta más corta entre dos puntos esquivando muros y esculturas
 * (grafo de visibilidad + Dijkstra; ~20 nodos, costo despreciable).
 * Devuelve la polilínea o null si el destino no es caminable.
 */
export function findPath(a, b) {
  if (!walkable(b.x, b.z)) return null
  if (segmentClear(a, b)) return [a, b]
  const nodes = [a, ...navNodes, b]
  const n = nodes.length
  const dist = Array(n).fill(Infinity)
  const prev = Array(n).fill(-1)
  const done = Array(n).fill(false)
  dist[0] = 0
  for (let iter = 0; iter < n; iter++) {
    let u = -1
    for (let i = 0; i < n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i
    if (u === -1 || dist[u] === Infinity) break
    if (u === n - 1) break
    done[u] = true
    for (let v = 0; v < n; v++) {
      if (done[v] || v === u) continue
      if (!segmentClear(nodes[u], nodes[v])) continue
      const d = dist[u] + Math.hypot(nodes[u].x - nodes[v].x, nodes[u].z - nodes[v].z)
      if (d < dist[v]) {
        dist[v] = d
        prev[v] = u
      }
    }
  }
  if (dist[n - 1] === Infinity) return null
  const path = []
  for (let v = n - 1; v !== -1; v = prev[v]) path.unshift(nodes[v])
  return path
}

export function pathLength(path) {
  let L = 0
  for (let i = 1; i < path.length; i++) L += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z)
  return L
}

/** Punto a una distancia `d` sobre la polilínea, más la dirección del tramo. */
export function pointOnPath(path, d) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const seg = Math.hypot(b.x - a.x, b.z - a.z)
    if (d <= seg || i === path.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, d / seg)
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dirYaw: Math.atan2(-(b.x - a.x), -(b.z - a.z)) }
    }
    d -= seg
  }
  const last = path[path.length - 1]
  return { x: last.x, z: last.z, dirYaw: 0 }
}

export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))
