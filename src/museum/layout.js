import { products, rooms } from '../data/products.js'

/**
 * Plano arquitectónico del Museo VESTIGIO (unidades = metros).
 * Cinco salas temáticas de estilo griego en granito con vegetación botánica y 30 piezas (6 por sala).
 *
 *   z = +11  ┌───────────── Pórtico de entrada ─────────────┐
 *            │        VESTÍBULO  (Ánfora Textil Helénica)   │
 *   z =  -2  ├──────┐                               ┌───────┤
 *            │ SALA I · Ágora & Diseñador (6 piezas)        │
 *   z = -18  ├──────┐                               ┌───────┤
 *            │ SALA II · Cosmos & BBC (6 piezas)            │
 *   z = -34  ├──────┐                               ┌───────┤
 *            │ SALA III · Camuflaje & BAPE (6 piezas)       │
 *   z = -50  ├──────┐                               ┌───────┤
 *            │ SALA IV · Monolito & Yeezy (6 piezas)        │
 *   z = -66  ├──────┐                               ┌───────┤
 *            │ SALA V · Pedestal & Sneakers (6 piezas)      │
 *   z = -82  └──────────── Muro final (Archivo) ────────────┘
 *           x = -5.6                                       x = +5.6
 */
export const HALL = {
  halfW: 5.6,
  height: 5.4,
  zStart: 11,
  zEnd: -82,
  roomLen: 16,
  firstDivider: -2,
}
export const EYE = 1.68
export const DOOR_HALF = 2.5
export const dividers = rooms.map((_, i) => HALL.firstDivider - i * HALL.roomLen) // [-2, -18, -34, -50, -66]
export const roomCenter = (i) => HALL.firstDivider - HALL.roomLen / 2 - i * HALL.roomLen // [-10, -26, -42, -58, -74]

export const ENTRANCE_SCULPTURE = { x: 0, z: 3.2 }
export const sculptures = [ENTRANCE_SCULPTURE, ...rooms.map((_, i) => ({ x: 0, z: roomCenter(i) }))]

/**
 * 30 piezas: 6 por cada una de las 5 salas (3 en el muro izquierdo y 3 en el muro derecho).
 */
export const exhibits = products.map((p) => {
  const inRoom = products.filter((q) => q.room === p.room)
  const k = inRoom.indexOf(p) // 0..5
  const side = k % 2 === 0 ? -1 : 1
  const row = Math.floor(k / 2) // 0, 1, 2
  const z = roomCenter(p.room) + (1 - row) * 4.6
  return {
    product: p,
    side,
    row,
    position: [side * (HALL.halfW - 0.06), 2.0, z],
    rotationY: side === -1 ? Math.PI / 2 : -Math.PI / 2,
  }
})

const lookAt = (px, pz, tx, ty, tz) => {
  const dx = tx - px
  const dz = tz - pz
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(ty - EYE, Math.hypot(dx, dz)) }
}

/** Paradas del recorrido guiado (vestíbulo → 30 piezas → muro final). */
export const stations = [
  {
    id: 'entrada',
    label: 'Pórtico · Ánfora Textil Helénica',
    room: -1,
    x: 0,
    z: 8.0,
    ...lookAt(0, 8.0, 0, 1.55, ENTRANCE_SCULPTURE.z),
  },
  ...exhibits.map((e) => {
    const x = e.side * 2.35
    const z = e.position[2]
    return {
      id: e.product.id,
      label: e.product.name,
      room: e.product.room,
      productId: e.product.id,
      x,
      z,
      ...lookAt(x, z, e.position[0], 1.9, z),
    }
  }),
  {
    id: 'final',
    label: 'Fin del recorrido · Archivo completo',
    room: 4,
    x: 0,
    z: -78.0,
    ...lookAt(0, -78.0, 0, 2.2, HALL.zEnd),
  },
]

export const START = { x: 0, z: 9.8, yaw: 0, pitch: 0.05 }

/** ¿En qué sala está el visitante? -1 = vestíbulo */
export function roomAt(z) {
  if (z > HALL.firstDivider) return -1
  return Math.min(rooms.length - 1, Math.max(0, Math.floor((HALL.firstDivider - z) / HALL.roomLen)))
}

/* ───────────────────────── Colisiones y rutas ───────────────────────── */

const MARGIN = 0.55
export function walkable(x, z) {
  if (Math.abs(x) > HALL.halfW - MARGIN) return false
  if (z > HALL.zStart - MARGIN || z < HALL.zEnd + MARGIN) return false
  for (const d of dividers) {
    if (Math.abs(z - d) < 0.22 + MARGIN && Math.abs(x) > DOOR_HALF - MARGIN) return false
  }
  for (const s of sculptures) {
    if (Math.hypot(x - s.x, z - s.z) < 0.92) return false
  }
  return true
}

function segmentClear(a, b) {
  const len = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.max(2, Math.ceil(len / 0.35))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (!walkable(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false
  }
  return true
}

const navNodes = [
  ...dividers.map((z) => ({ x: 0, z })),
  ...sculptures.flatMap((s) => [
    { x: -1.9, z: s.z },
    { x: 1.9, z: s.z },
  ]),
  { x: 0, z: 7.0 },
]

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

export function pointOnPath(path, d) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const seg = Math.hypot(b.x - a.x, b.z - a.z)
    if (d <= seg || i === path.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, d / seg)
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        dirYaw: Math.atan2(-(b.x - a.x), -(b.z - a.z)),
      }
    }
    d -= seg
  }
  const last = path[path.length - 1]
  return { x: last.x, z: last.z, dirYaw: 0 }
}

export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))
