import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { HALL, dividers, roomCenter, exhibits, ENTRANCE_SCULPTURE, DOOR_HALF, walkable } from './layout.js'
import { roomTitleTexture, plaqueTexture, wallTextTexture, floorTexture, radialTexture } from './textures.js'
import { rooms, formatPrice } from '../data/products.js'

const LENGTH = HALL.zStart - HALL.zEnd // 60
const MID_Z = (HALL.zStart + HALL.zEnd) / 2 // -20
const WALL = '#2b2723'
const WARM = '#ffe0bd'

/* ───────────────────────────── Escena completa ───────────────────────────── */
export default function Scene({ reduced, hoveredId, onHover, onSelect, onFloorClick, onNavigate, lowPower, onReady }) {
  const { gl, scene } = useThree()

  // Iluminación basada en imagen generada en tiempo real (sin HDR descargado)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.35
    onReady?.()
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  const textures = useLoader(
    THREE.TextureLoader,
    exhibits.map((e) => e.product.img),
  )
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    })
  }, [textures])

  return (
    <>
      <hemisphereLight args={['#fff3e2', '#1a1715', 0.55]} />
      {[5, ...rooms.map((_, i) => roomCenter(i))].map((z) => (
        <pointLight key={z} position={[0, 4.3, z]} intensity={18} distance={18} decay={1.6} color={WARM} />
      ))}

      <Architecture onFloorClick={onFloorClick} />
      <WallTexts onNavigate={onNavigate} />

      {exhibits.map((e, i) => (
        <Artwork
          key={e.product.id}
          exhibit={e}
          texture={textures[i]}
          hovered={hoveredId === e.product.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <AnforaTextil reduced={reduced} />
      <ColumnFragment z={roomCenter(0)} reduced={reduced} />
      <Amphora z={roomCenter(1)} reduced={reduced} />
      <MosaicSolid z={roomCenter(2)} reduced={reduced} />
      <BronzeKnot z={roomCenter(3)} reduced={reduced} />

      {!reduced && <Dust count={lowPower ? 140 : 320} />}
    </>
  )
}

/* ───────────────────────────── Arquitectura ───────────────────────────── */
function Architecture({ onFloorClick }) {
  const floorMap = useMemo(() => {
    const t = floorTexture()
    t.repeat.set(HALL.halfW, LENGTH / 2)
    return t
  }, [])
  const marker = useRef()
  const markerMat = useRef()

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.92 }), [])
  const dividerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#332e29', roughness: 0.9 }), [])
  const segW = HALL.halfW - DOOR_HALF
  const doorH = 3.9

  return (
    <group>
      {/* Piso: clic/toque para caminar; un anillo muestra el destino */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, MID_Z]}
        onPointerMove={(e) => {
          if (!marker.current) return
          marker.current.visible = true
          marker.current.position.set(e.point.x, 0.01, e.point.z)
          markerMat.current.color.set(walkable(e.point.x, e.point.z) ? '#EFE9DF' : '#D9643A')
        }}
        onPointerOut={() => marker.current && (marker.current.visible = false)}
        onClick={(e) => {
          if (e.delta > 6) return // fue un arrastre para mirar, no un clic
          e.stopPropagation()
          onFloorClick(e.point.x, e.point.z)
        }}
      >
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
        <meshStandardMaterial map={floorMap} roughness={0.32} metalness={0.15} envMapIntensity={0.8} />
      </mesh>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false} renderOrder={2}>
        <ringGeometry args={[0.22, 0.27, 40]} />
        <meshBasicMaterial ref={markerMat} transparent opacity={0.8} depthWrite={false} />
      </mesh>

      {/* Techo y franjas de luz */}
      <mesh rotation-x={Math.PI / 2} position={[0, HALL.height, MID_Z]}>
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
        <meshStandardMaterial color="#151311" roughness={1} />
      </mesh>
      {[-2.7, 2.7].map((x) => (
        <mesh key={x} position={[x, HALL.height - 0.02, MID_Z]}>
          <boxGeometry args={[0.12, 0.02, LENGTH - 0.6]} />
          <meshBasicMaterial color="#fff1dc" />
        </mesh>
      ))}

      {/* Muros */}
      <mesh position={[-HALL.halfW, HALL.height / 2, MID_Z]} rotation-y={Math.PI / 2} material={wallMat}>
        <planeGeometry args={[LENGTH, HALL.height]} />
      </mesh>
      <mesh position={[HALL.halfW, HALL.height / 2, MID_Z]} rotation-y={-Math.PI / 2} material={wallMat}>
        <planeGeometry args={[LENGTH, HALL.height]} />
      </mesh>
      <mesh position={[0, HALL.height / 2, HALL.zStart]} rotation-y={Math.PI} material={wallMat}>
        <planeGeometry args={[HALL.halfW * 2, HALL.height]} />
      </mesh>
      <mesh position={[0, HALL.height / 2, HALL.zEnd]} material={wallMat}>
        <planeGeometry args={[HALL.halfW * 2, HALL.height]} />
      </mesh>
      {/* zócalo */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (HALL.halfW - 0.02), 0.06, MID_Z]}>
          <boxGeometry args={[0.04, 0.12, LENGTH]} />
          <meshStandardMaterial color="#0c0b0a" />
        </mesh>
      ))}

      {/* Muros divisorios con vano y rótulo de sala */}
      {dividers.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (DOOR_HALF + segW / 2), HALL.height / 2, 0]} material={dividerMat}>
              <boxGeometry args={[segW, HALL.height, 0.4]} />
            </mesh>
          ))}
          <mesh position={[0, (HALL.height + doorH) / 2, 0]} material={dividerMat}>
            <boxGeometry args={[DOOR_HALF * 2, HALL.height - doorH, 0.4]} />
          </mesh>
          <RoomTitle index={i} />
        </group>
      ))}
    </group>
  )
}

function RoomTitle({ index }) {
  const tex = useMemo(() => {
    const [num, name] = rooms[index].name.split('·').map((s) => s.trim())
    return roomTitleTexture(num.toUpperCase(), name, rooms[index].text)
  }, [index])
  const segW = HALL.halfW - DOOR_HALF
  return (
    <mesh position={[-(DOOR_HALF + segW / 2), 2.6, 0.205]}>
      <planeGeometry args={[segW - 0.2, (segW - 0.2) / 2]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function WallTexts({ onNavigate }) {
  const welcome = useMemo(
    () => wallTextTexture({ eyebrow: 'Museo Vestigio', title: 'Ruinas Suaves', subtitle: 'Colección 01 · ocho piezas', titleSize: 210 }),
    [],
  )
  const help = useMemo(
    () => wallTextTexture({ eyebrow: 'Cómo recorrer', title: 'Mira · Camina', subtitle: 'Arrastra para mirar, toca el suelo para avanzar', titleSize: 200 }),
    [],
  )
  const end = useMemo(() => wallTextTexture({ eyebrow: 'Gracias por tu visita', title: 'VESTIGIO', subtitle: 'Moda que se exhibe', titleSize: 300 }), [])
  const [hover, setHover] = useState(false)

  return (
    <group>
      <mesh position={[-HALL.halfW + 0.02, 2.4, 4.5]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[5, 2.5]} />
        <meshBasicMaterial map={welcome} transparent toneMapped={false} />
      </mesh>
      <mesh position={[HALL.halfW - 0.02, 2.4, 4.5]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5, 2.5]} />
        <meshBasicMaterial map={help} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.7, HALL.zEnd + 0.02]}>
        <planeGeometry args={[6.4, 3.2]} />
        <meshBasicMaterial map={end} transparent toneMapped={false} />
      </mesh>
      {/* Botón 3D: ir al catálogo */}
      <group
        position={[0, 0.95, HALL.zEnd + 0.05]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (e.delta > 6) return
          e.stopPropagation()
          onNavigate('/catalogo')
        }}
      >
        <mesh scale={hover ? 1.06 : 1}>
          <planeGeometry args={[2.4, 0.5]} />
          <meshBasicMaterial color={hover ? '#e8774c' : '#D9643A'} toneMapped={false} />
        </mesh>
        <CatalogLabel />
      </group>
    </group>
  )
}

function CatalogLabel() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 214
    const g = c.getContext('2d')
    g.fillStyle = '#0E0D0C'
    g.font = '600 92px "Inter Variable", system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('VER CATÁLOGO  →', 512, 112)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[2.4, 0.5]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/* ───────────────────────────── Obras (prendas) ───────────────────────────── */
const poolTex = radialTexture('rgba(255,225,190,1)', 'rgba(255,225,190,0)')
const shadowTex = radialTexture('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)')

function Artwork({ exhibit, texture, hovered, onHover, onSelect }) {
  const { product, position, rotationY } = exhibit
  const group = useRef()
  const pool = useRef()
  const plaque = useMemo(() => plaqueTexture(product, formatPrice(product.price)), [product])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-10 * dt)
    const s = THREE.MathUtils.lerp(group.current.scale.x, hovered ? 1.035 : 1, k)
    group.current.scale.setScalar(s)
    pool.current.opacity = THREE.MathUtils.lerp(pool.current.opacity, hovered ? 0.5 : 0.28, k)
  })

  return (
    <group position={position} rotation-y={rotationY}>
      {/* piscina de luz en el muro */}
      <mesh position={[0, 0.15, 0.01]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshBasicMaterial ref={pool} map={poolTex} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <group
        ref={group}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(product.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (e.delta > 6) return
          e.stopPropagation()
          onSelect(product.id)
        }}
      >
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[1.8, 2.36, 0.07]} />
          <meshStandardMaterial color="#15110e" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.077]}>
          <planeGeometry args={[1.66, 2.2]} />
          <meshBasicMaterial color="#cbc2b3" />
        </mesh>
        <mesh position={[0, 0.02, 0.079]}>
          <planeGeometry args={[1.44, 1.92]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>

      {/* cartela */}
      <mesh position={[1.35, -0.7, 0.02]}>
        <planeGeometry args={[0.64, 0.32]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>

      <LightCone position={[0, 1.4, 1.0]} rotation-x={0.32} height={3.3} radius={1.25} />
      <mesh position={[0, HALL.height - position[1] - 0.01, 1.5]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[0.13, 24]} />
        <meshBasicMaterial color="#fff6e8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Haz de luz volumétrico falso: cono aditivo que se desvanece hacia abajo y en los bordes. */
const coneMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color('#ffdcb0') }, uOpacity: { value: 0.11 } },
  vertexShader: /* glsl */ `
    varying float vH;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      vH = uv.y;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vH;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      float edge = pow(abs(dot(vN, vView)), 1.6);
      float fade = smoothstep(0.0, 1.0, vH);
      gl_FragColor = vec4(uColor, uOpacity * edge * fade);
    }`,
})

function LightCone({ height, radius, ...props }) {
  return (
    <mesh {...props} material={coneMaterial}>
      <coneGeometry args={[radius, height, 32, 1, true]} />
    </mesh>
  )
}

/* ───────────────────────────── Esculturas ───────────────────────────── */
function Pedestal({ z, x = 0, children, plaqueText }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.85, 1, 0.85]} />
        <meshStandardMaterial color="#d3ccc0" roughness={0.75} />
      </mesh>
      <group position={[0, 1, 0]}>{children}</group>
      <LightCone position={[0, 3.3, 0]} height={3.4} radius={1.1} />
      {plaqueText}
    </group>
  )
}

function useSpin(ref, reduced, speed = 0.25) {
  useFrame((_, dt) => {
    if (!reduced && ref.current) ref.current.rotation.y += dt * speed
  })
}

/**
 * PIEZA ORIGINAL 3D — "Ánfora textil".
 * Un vestido generado por revolución (LatheGeometry) cuyos pliegues se calculan
 * en el vertex shader: ondas que bajan por la falda como tela movida por el aire.
 * Con movimiento reducido la tela queda quieta en una pose estática.
 */
function AnforaTextil({ reduced }) {
  const group = useRef()
  const shaderRef = useRef()
  const geometry = useMemo(() => {
    const profile = [
      [0.0, 1.62], [0.12, 1.62], [0.17, 1.56], [0.3, 1.48], [0.33, 1.4], [0.31, 1.24],
      [0.25, 1.06], [0.22, 0.98], [0.27, 0.86], [0.36, 0.7], [0.44, 0.48], [0.54, 0.24], [0.66, 0.02], [0.64, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const g = new THREE.LatheGeometry(profile, 128)
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#B9532F', roughness: 0.48, metalness: 0.05, side: THREE.DoubleSide })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shaderRef.current = shader
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float ang = atan(position.z, position.x);
           float h = clamp(1.0 - position.y / 1.0, 0.0, 1.0);
           float folds = sin(ang * 9.0 + uTime * 1.3 + position.y * 4.0) * 0.05
                       + sin(ang * 4.0 - uTime * 0.8) * 0.03;
           transformed += normal * folds * h * h;`,
        )
    }
    return m
  }, [])

  useFrame((state, dt) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = reduced ? 1.2 : state.clock.elapsedTime
    if (!reduced) group.current.rotation.y += dt * 0.18
  })

  const rings = useRef()
  useFrame((state) => {
    if (reduced || !rings.current) return
    const t = state.clock.elapsedTime
    rings.current.children.forEach((r, i) => {
      r.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + i) * 0.35
      r.rotation.z = t * (0.2 + i * 0.08)
    })
  })

  const plaque = useMemo(
    () =>
      plaqueTexture(
        { name: 'Ánfora textil', category: 'Pieza original 3D', color: 'tela generativa' },
        'Shader de pliegues en vivo',
      ),
    [],
  )

  return (
    <group position={[ENTRANCE_SCULPTURE.x, 0, ENTRANCE_SCULPTURE.z]}>
      <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.85, 0.9, 0.44, 64]} />
        <meshStandardMaterial color="#d3ccc0" roughness={0.7} />
      </mesh>
      <group ref={group} position={[0, 0.44, 0]}>
        <mesh geometry={geometry} material={material} />
      </group>
      <group ref={rings} position={[0, 1.3, 0]}>
        {[0.95, 1.1, 1.25].map((r) => (
          <mesh key={r} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.006, 6, 120]} />
            <meshStandardMaterial color="#C9A45C" metalness={1} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <LightCone position={[0, 3.2, 0]} height={3.6} radius={1.4} />
      <mesh position={[0, 0.5, 1.05]} rotation-x={-0.5}>
        <planeGeometry args={[0.64, 0.32]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  )
}

function ColumnFragment({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.12)
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.3, 0.32, 1.2, 96, 16)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const r = Math.hypot(v.x, v.z)
      const th = Math.atan2(v.z, v.x)
      if (r > 0.01) {
        const flute = 1 - 0.08 * Math.pow(Math.abs(Math.cos(th * 10)), 0.6)
        v.x *= flute
        v.z *= flute
      }
      if (v.y > 0.3) {
        const broken = (0.5 + 0.5 * Math.sin(th * 3 + 1.3)) * 0.3 + (0.5 + 0.5 * Math.sin(th * 7)) * 0.08
        v.y -= broken * ((v.y - 0.3) / 0.3)
      }
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <Pedestal z={z}>
      <mesh ref={ref} geometry={geometry} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#ebe5da" roughness={0.55} />
      </mesh>
    </Pedestal>
  )
}

function Amphora({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.2)
  const geometry = useMemo(() => {
    const pts = [[0, 0], [0.1, 0], [0.16, 0.05], [0.28, 0.25], [0.33, 0.5], [0.29, 0.72], [0.15, 0.9], [0.1, 1.02], [0.14, 1.1], [0.13, 1.12]].map(
      ([r, y]) => new THREE.Vector2(r, y),
    )
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  return (
    <Pedestal z={z}>
      <group ref={ref}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#7F9DB5" roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.2, 0.86, 0]} rotation-z={s * -0.2}>
            <torusGeometry args={[0.13, 0.022, 10, 24, Math.PI]} />
            <meshStandardMaterial color="#6d8ba3" roughness={0.65} />
          </mesh>
        ))}
      </group>
    </Pedestal>
  )
}

function MosaicSolid({ z, reduced }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += dt * 0.3
    ref.current.rotation.x += dt * 0.12
  })
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.42, 1).toNonIndexed()
    const palette = ['#EFE9DF', '#D9643A', '#D9B26A', '#B9532F', '#EFE9DF', '#3A3734'].map((c) => new THREE.Color(c))
    const colors = []
    for (let f = 0; f < g.attributes.position.count / 3; f++) {
      const c = palette[(f * 7 + (f % 5)) % palette.length]
      for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return g
  }, [])
  return (
    <Pedestal z={z}>
      <mesh ref={ref} geometry={geometry} position={[0, 0.62, 0]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </mesh>
    </Pedestal>
  )
}

function BronzeKnot({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.35)
  return (
    <Pedestal z={z}>
      <mesh ref={ref} position={[0, 0.62, 0]}>
        <torusKnotGeometry args={[0.28, 0.09, 180, 24]} />
        <meshStandardMaterial color="#b98552" metalness={1} roughness={0.28} envMapIntensity={1.6} />
      </mesh>
    </Pedestal>
  )
}

/* ───────────────────────────── Polvo en suspensión ───────────────────────────── */
function Dust({ count }) {
  const ref = useRef()
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * HALL.halfW * 1.8
      positions[i * 3 + 1] = Math.random() * HALL.height
      positions[i * 3 + 2] = HALL.zStart - Math.random() * LENGTH
      speeds[i] = 0.03 + Math.random() * 0.06
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, dt) => {
    const p = ref.current.geometry.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = p.array[i * 3 + 1] + speeds[i] * dt
      if (y > HALL.height) y = 0
      p.array[i * 3 + 1] = y
      p.array[i * 3] += Math.sin(t * 0.3 + i) * 0.0008
    }
    p.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#ffdcb0" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}
