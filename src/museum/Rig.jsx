import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EYE, START, stations, findPath, pathLength, pointOnPath, walkable, roomAt, wrapAngle, HALL } from './layout.js'

/**
 * Cámara en primera persona del museo.
 *
 * Formas de moverse (todas convergen en el mismo estado):
 *  - Arrastrar (mouse o dedo)      → mirar alrededor
 *  - Clic / toque en el piso       → caminar hasta ese punto (ruta que esquiva muros)
 *  - WASD / flechas ↑↓             → caminar libremente; ←→ girar
 *  - Botones del recorrido / obra  → viajar a una parada y encuadrar la pieza
 *
 * Principios de animación aplicados:
 *  - Aceleración (slow in / slow out): los viajes usan easeInOutCubic.
 *  - Seguimiento / superposición: la mirada se amortigua (damping) y llega
 *    un instante después que el cuerpo, como la cabeza de un visitante real.
 *  - Anticipación: en recorridos largos la cámara primero mira hacia donde va
 *    y sólo al final gira hacia la obra.
 * Con movimiento reducido todos los viajes son cortes directos.
 */
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export default function Rig({ controllerRef, started, reduced, onRoomChange, onArrive, onUserInteract, minimapRef }) {
  const { camera, gl } = useThree()
  const s = useRef({
    x: START.x,
    z: START.z,
    yaw: START.yaw,
    pitch: START.pitch,
    targetYaw: null,
    targetPitch: null,
    path: null,
    pathLen: 0,
    progress: 0,
    duration: 1,
    travelLook: false,
    arrive: null,
    keys: new Set(),
    dragging: false,
    lastX: 0,
    lastY: 0,
    dragDist: 0,
    room: null,
    walked: 0,
  })
  const props = useRef({})
  props.current = { started, reduced, onRoomChange, onArrive, onUserInteract }

  useEffect(() => {
    camera.rotation.order = 'YXZ'
  }, [camera])

  // API pública para el HUD y el piso
  useEffect(() => {
    const st = s.current
    const travel = (tx, tz, { yaw = null, pitch = null, arrive = null, speed = 1 } = {}) => {
      const path = findPath({ x: st.x, z: st.z }, { x: tx, z: tz }) ?? (walkable(tx, tz) ? [{ x: st.x, z: st.z }, { x: tx, z: tz }] : null)
      if (!path) return false
      if (props.current.reduced) {
        st.x = tx
        st.z = tz
        if (yaw !== null) st.yaw = yaw
        if (pitch !== null) st.pitch = pitch
        st.targetYaw = st.targetPitch = null
        st.path = null
        props.current.onArrive?.(arrive)
        return true
      }
      const L = pathLength(path)
      st.path = path
      st.pathLen = L
      st.progress = 0
      st.duration = clamp((0.8 + L * 0.2) / speed, 0.9, 4.2)
      st.targetYaw = yaw
      st.targetPitch = pitch
      st.travelLook = yaw !== null && L > 7
      st.arrive = arrive
      if (L < 0.05) st.duration = 0.8
      return true
    }

    controllerRef.current = {
      goToStation: (i) => {
        const t = stations[i]
        return travel(t.x, t.z, { yaw: t.yaw, pitch: t.pitch, arrive: i })
      },
      walkTo: (x, z) => travel(x, z, { arrive: null, speed: 1.3 }),
      getPose: () => ({ x: st.x, z: st.z, yaw: st.yaw }),
    }
  }, [controllerRef])

  // Arrastrar para mirar
  useEffect(() => {
    const el = gl.domElement
    const st = s.current
    el.style.touchAction = 'none'
    const down = (e) => {
      st.dragging = true
      st.lastX = e.clientX
      st.lastY = e.clientY
      st.dragDist = 0
    }
    const move = (e) => {
      if (!st.dragging) return
      const dx = e.clientX - st.lastX
      const dy = e.clientY - st.lastY
      st.lastX = e.clientX
      st.lastY = e.clientY
      st.dragDist += Math.abs(dx) + Math.abs(dy)
      if (st.dragDist < 4) return
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042
      st.yaw += dx * k
      st.pitch = clamp(st.pitch + dy * k * 0.8, -0.6, 0.6)
      st.targetYaw = st.targetPitch = null
      st.travelLook = false
      props.current.onUserInteract?.()
    }
    const up = () => (st.dragging = false)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl])

  // Teclado
  useEffect(() => {
    const st = s.current
    const isField = (t) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
    const down = (e) => {
      if (isField(e.target) || !MOVE_KEYS.includes(e.code)) return
      e.preventDefault()
      st.keys.add(e.code)
    }
    const up = (e) => st.keys.delete(e.code)
    const blur = () => st.keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useFrame((state, delta) => {
    const st = s.current
    const { started, reduced } = props.current
    const dt = Math.min(delta, 0.05)
    const pathDt = Math.min(delta, 1.0)
    let moved = 0

    // 1. Teclado: caminar con deslizamiento sobre colisiones
    const k = st.keys
    const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
    const strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0)
    const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
    if (started && (fwd || strafe || turn)) {
      st.path = null
      st.targetYaw = st.targetPitch = null
      props.current.onUserInteract?.()
      st.yaw += turn * 1.9 * dt
      if (fwd || strafe) {
        const speed = 3.4 * dt
        const sin = Math.sin(st.yaw)
        const cos = Math.cos(st.yaw)
        const dx = (-sin * fwd + cos * strafe) * speed
        const dz = (-cos * fwd - sin * strafe) * speed
        if (walkable(st.x + dx, st.z)) st.x += dx
        if (walkable(st.x, st.z + dz)) st.z += dz
        moved = Math.hypot(dx, dz)
      }
    }

    // 2. Seguir la ruta activa
    let desiredYaw = st.targetYaw
    let desiredPitch = st.targetPitch
    if (st.path) {
      st.progress = Math.min(1, st.progress + pathDt / st.duration)
      const p = pointOnPath(st.path, easeInOutCubic(st.progress) * st.pathLen)
      moved = Math.hypot(p.x - st.x, p.z - st.z)
      st.x = p.x
      st.z = p.z
      if (st.travelLook && st.progress < 0.68) {
        desiredYaw = p.dirYaw
        desiredPitch = 0
      }
      if (st.progress >= 1) {
        st.path = null
        props.current.onArrive?.(st.arrive)
      }
    }

    // 3. Mirada amortiguada (follow-through)
    if (desiredYaw !== null) st.yaw += wrapAngle(desiredYaw - st.yaw) * (1 - Math.exp(-4.5 * pathDt))
    if (desiredPitch !== null) st.pitch += (desiredPitch - st.pitch) * (1 - Math.exp(-4.5 * pathDt))

    // 4. Antes de comenzar: respiración lenta de la cámara (invita a entrar)
    let yaw = st.yaw
    if (!started && !reduced) yaw += Math.sin(state.clock.elapsedTime * 0.35) * 0.06

    // 5. Balanceo de pasos muy sutil
    st.walked += moved
    const bob = reduced ? 0 : Math.sin(st.walked * 3.2) * 0.022 * Math.min(1, moved / (dt * 2 + 1e-4))

    camera.position.set(st.x, EYE + bob, st.z)
    camera.rotation.set(st.pitch, yaw, 0)

    // 6. Sala actual y minimapa
    const room = roomAt(st.z)
    if (room !== st.room) {
      st.room = room
      props.current.onRoomChange?.(room)
    }
    if (minimapRef?.current) {
      const mx = HALL.zStart - st.z
      const my = st.x + HALL.halfW
      minimapRef.current.setAttribute('transform', `translate(${mx.toFixed(2)} ${my.toFixed(2)}) rotate(${((-yaw * 180) / Math.PI).toFixed(1)})`)
    }
  })

  return null
}
