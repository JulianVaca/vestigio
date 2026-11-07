import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { HALL, dividers, roomCenter, exhibits, ENTRANCE_SCULPTURE, DOOR_HALF, walkable } from './layout.js'
import { roomTitleTexture, plaqueTexture, wallTextTexture, floorTexture, wallGraniteTexture, radialTexture } from './textures.js'
import { rooms, formatPrice } from '../data/products.js'

const LENGTH = HALL.zStart - HALL.zEnd // 93m
const MID_Z = (HALL.zStart + HALL.zEnd) / 2 // -35.5

// Geometrías y materiales compartidos a nivel de módulo para los Racks 3D de tienda y arquitectura
const sharedPoolGeo = new THREE.PlaneGeometry(3.6, 3.6)
const sharedRackPlinthGeo = new THREE.BoxGeometry(1.94, 0.16, 0.68)
const sharedRackPostGeo = new THREE.CylinderGeometry(0.026, 0.026, 3.12, 12)
const sharedRackBarGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.84, 12)
const sharedRackBracketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8)
const sharedHangerHookGeo = new THREE.TorusGeometry(0.055, 0.01, 8, 16, Math.PI * 1.35)
const sharedHangerStemGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.14, 8)
const sharedHangerBarGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.92, 10)
const sharedFrameGeo = new THREE.BoxGeometry(1.52, 2.02, 0.04)
const sharedArtGeo = new THREE.PlaneGeometry(1.44, 1.92)
const sharedPlaqueGeo = new THREE.PlaneGeometry(0.68, 0.34)
const sharedPlaquePostGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.15, 8)
const sharedLampGeo = new THREE.CircleGeometry(0.12, 16)
const sharedConeGeo = new THREE.ConeGeometry(1.18, 3.2, 20, 1, true)
const sharedShadowGeo = new THREE.PlaneGeometry(2.2, 2.2)
const sharedPedestalGeo = new THREE.BoxGeometry(0.88, 1.02, 0.88)

const sharedBronzeMat = new THREE.MeshStandardMaterial({ color: '#9A7438', roughness: 0.32, metalness: 0.72 })
const sharedDarkBronzeMat = new THREE.MeshStandardMaterial({ color: '#4A3B24', roughness: 0.4, metalness: 0.58 })
const sharedTravertineMat = new THREE.MeshLambertMaterial({ color: '#E6DFD1' })
const sharedCompanionMat = new THREE.MeshLambertMaterial({ color: '#D6CFC0' })
const sharedFrameMat = new THREE.MeshLambertMaterial({ color: '#F2EEE4' })
const sharedLampMat = new THREE.MeshBasicMaterial({ color: '#FFFDF7', side: THREE.DoubleSide })
const sharedPedestalMat = new THREE.MeshStandardMaterial({ color: '#E2DBD0', roughness: 0.55, metalness: 0.06 })

const poolTex = radialTexture('rgba(255, 248, 230, 0.55)', 'rgba(255, 248, 230, 0)')
const shadowTex = radialTexture('rgba(35, 32, 26, 0.32)', 'rgba(35, 32, 26, 0)')
const sharedShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })

const coneMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color('#fff6e0') }, uOpacity: { value: 0.06 } },
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
      float edge = pow(abs(dot(vN, vView)), 1.5);
      float fade = smoothstep(0.0, 1.0, vH);
      gl_FragColor = vec4(uColor, uOpacity * edge * fade);
    }`,
})

/* ───────────────────────────── Escena completa optimizada ───────────────────────────── */
export default function Scene({ reduced, hoveredId, onHover, onSelect, onFloorClick, onNavigate, lowPower, onReady }) {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.3
    onReady?.()
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, onReady])

  // Cargamos las variantes -sm.webp (420x560) para las 30 obras en 3D: carga instantánea y 4x menos VRAM en PC
  const textures = useLoader(
    THREE.TextureLoader,
    exhibits.map((e) => e.product.img.replace('.webp', '-sm.webp')),
  )

  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      t.generateMipmaps = true
      t.needsUpdate = true
    })
  }, [textures])

  return (
    <>
      {/* Iluminación cálida mediterránea sin múltiples PointLights costosos: máximo rendimiento en PC */}
      <hemisphereLight args={['#fffdf8', '#c8bfa8', 1.45]} />
      <directionalLight position={[5, 14, 8]} intensity={0.95} color="#fff9eb" />
      <directionalLight position={[-5, 10, -35]} intensity={0.55} color="#e6dfd0" />

      <Architecture onFloorClick={onFloorClick} />
      <InstancedDoricColumns />
      <BotanicalGarden />
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
      <CosmosAstrolabe z={roomCenter(1)} reduced={reduced} />
      <GraniteMonolith z={roomCenter(2)} reduced={reduced} />
      <BrutalistSphere z={roomCenter(3)} reduced={reduced} />
      <WingedPedestalRelic z={roomCenter(4)} reduced={reduced} />

      {!reduced && <Dust count={lowPower ? 140 : 280} />}
    </>
  )
}

/* ───────────────────────────── Arquitectura en Travertino y Granito Griego ───────────────────────────── */
function Architecture({ onFloorClick }) {
  const floorMap = useMemo(() => {
    const t = floorTexture()
    t.repeat.set(HALL.halfW, LENGTH / 2.2)
    return t
  }, [])

  const wallMap = useMemo(() => {
    const t = wallGraniteTexture()
    t.repeat.set(LENGTH / 4, 2)
    return t
  }, [])

  const marker = useRef()
  const markerMat = useRef()
  const lastMoveTime = useRef(0)

  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ map: wallMap, color: '#f0ebe0' }), [wallMap])
  const dividerMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#e2dbcc' }), [])
  const segW = HALL.halfW - DOOR_HALF
  const doorH = 4.1

  return (
    <group>
      {/* Piso de granito claro y travertino pulido con throttling en pointerMove */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, MID_Z]}
        onPointerMove={(e) => {
          const now = performance.now()
          if (now - lastMoveTime.current < 28 || !marker.current) return
          lastMoveTime.current = now
          marker.current.visible = true
          marker.current.position.set(e.point.x, 0.012, e.point.z)
          markerMat.current.color.set(walkable(e.point.x, e.point.z) ? '#2D5A40' : '#9A7438')
        }}
        onPointerOut={() => marker.current && (marker.current.visible = false)}
        onClick={(e) => {
          if (e.delta > 6) return
          e.stopPropagation()
          onFloorClick(e.point.x, e.point.z)
        }}
      >
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
        <meshStandardMaterial map={floorMap} roughness={0.42} metalness={0.06} envMapIntensity={0.45} />
      </mesh>

      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false} renderOrder={2}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial ref={markerMat} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Techo casetonado luminoso y tragaluces de luz natural */}
      <mesh rotation-x={Math.PI / 2} position={[0, HALL.height, MID_Z]}>
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
        <meshBasicMaterial color="#DFD8C8" />
      </mesh>
      {[-3.0, 3.0].map((x) => (
        <mesh key={x} position={[x, HALL.height - 0.02, MID_Z]}>
          <boxGeometry args={[0.24, 0.02, LENGTH - 0.6]} />
          <meshBasicMaterial color="#FFFDF7" />
        </mesh>
      ))}

      {/* Muros perimetrales de travertino */}
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

      {/* Zócalo de bronce cepillado */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (HALL.halfW - 0.03), 0.08, MID_Z]}>
          <boxGeometry args={[0.06, 0.16, LENGTH]} />
          <meshBasicMaterial color="#8A6B3A" />
        </mesh>
      ))}

      {/* Pórticos divisorios con vano y rótulo de cada una de las 5 salas */}
      {dividers.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (DOOR_HALF + segW / 2), HALL.height / 2, 0]} material={dividerMat}>
              <boxGeometry args={[segW, HALL.height, 0.42]} />
            </mesh>
          ))}
          <mesh position={[0, (HALL.height + doorH) / 2, 0]} material={dividerMat}>
            <boxGeometry args={[DOOR_HALF * 2, HALL.height - doorH, 0.42]} />
          </mesh>
          {/* Arquitrabe de bronce sobre el pórtico */}
          <mesh position={[0, doorH, 0]}>
            <boxGeometry args={[DOOR_HALF * 2 + 0.4, 0.08, 0.48]} />
            <meshBasicMaterial color="#9A7438" />
          </mesh>
          <RoomTitle index={i} />
        </group>
      ))}
    </group>
  )
}

/* ───────────────────── Columnas Dóricas Griegas Instanciadas (1 Draw Call) ───────────────────── */
function InstancedDoricColumns() {
  const shaftRef = useRef()
  const capRef = useRef()

  const positions = useMemo(() => {
    const pts = [
      // Pórtico de bienvenida
      [-2.6, 6.2],
      [2.6, 6.2],
      // Junto a cada uno de los 5 pórticos divisorios
      ...dividers.flatMap((z) => [
        [-DOOR_HALF + 0.15, z],
        [DOOR_HALF - 0.15, z],
      ]),
    ]
    return pts
  }, [])

  const shaftGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.27, 4.1, 16), [])
  const capGeo = useMemo(() => new THREE.BoxGeometry(0.68, 0.18, 0.68), [])
  const marbleMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#DCD7CC' }), [])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, 2.05, z)
      dummy.updateMatrix()
      shaftRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, 4.02, z)
      dummy.updateMatrix()
      capRef.current.setMatrixAt(i, dummy.matrix)
    })
    shaftRef.current.instanceMatrix.needsUpdate = true
    capRef.current.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <group>
      <instancedMesh ref={shaftRef} args={[shaftGeo, marbleMat, positions.length]} />
      <instancedMesh ref={capRef} args={[capGeo, marbleMat, positions.length]} />
    </group>
  )
}

/* ───────────────────── Jardineras Botánicas Griegas (Olivos, Laureles y Helechos) ───────────────────── */
const planterGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.56, 12)
const planterMat = new THREE.MeshLambertMaterial({ color: '#2F3834' })
const trunkGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8)
const trunkMat = new THREE.MeshLambertMaterial({ color: '#4A3F35' })
const foliageGeo1 = new THREE.DodecahedronGeometry(0.46, 1)
const foliageGeo2 = new THREE.DodecahedronGeometry(0.34, 1)
const foliageMat1 = new THREE.MeshLambertMaterial({ color: '#3E755B' })
const foliageMat2 = new THREE.MeshLambertMaterial({ color: '#5E9E7E' })

function BotanicalGarden() {
  const planters = useMemo(() => {
    const list = [
      // Vestíbulo
      { x: -4.2, z: 7.5, scale: 1.15 },
      { x: 4.2, z: 7.5, scale: 1.15 },
      { x: -4.2, z: 0.2, scale: 1.0 },
      { x: 4.2, z: 0.2, scale: 1.0 },
    ]
    // Jardineras botánicas en cada una de las 5 salas
    rooms.forEach((_, r) => {
      const cz = roomCenter(r)
      list.push(
        { x: -4.4, z: cz + 6.9, scale: 0.95 },
        { x: 4.4, z: cz + 6.9, scale: 0.95 },
        { x: -4.4, z: cz - 6.9, scale: 1.05 },
        { x: 4.4, z: cz - 6.9, scale: 1.05 },
      )
    })
    return list
  }, [])

  return (
    <group>
      {planters.map((p, idx) => (
        <group key={idx} position={[p.x, 0, p.z]} scale={p.scale}>
          <mesh position={[0, 0.28, 0]} geometry={planterGeo} material={planterMat} />
          <mesh position={[0, 0.85, 0]} geometry={trunkGeo} material={trunkMat} />
          <mesh position={[0, 1.38, 0]} geometry={foliageGeo1} material={foliageMat1} />
          <mesh position={[0.2, 1.62, 0.12]} geometry={foliageGeo2} material={foliageMat2} />
          <mesh position={[-0.18, 1.54, -0.14]} geometry={foliageGeo2} material={foliageMat2} />
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
    <mesh position={[-(DOOR_HALF + segW / 2), 2.65, 0.22]}>
      <planeGeometry args={[segW - 0.2, (segW - 0.2) / 2]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

function WallTexts({ onNavigate }) {
  const welcome = useMemo(
    () =>
      wallTextTexture({
        eyebrow: 'Flagship Boutique · Pórtico Helénico',
        title: 'Atelier & Racks',
        subtitle: '30 prendas originales · Racks de bronce y travertino',
        titleSize: 184,
      }),
    [],
  )
  const help = useMemo(
    () =>
      wallTextTexture({
        eyebrow: 'Guía de tienda',
        title: 'Recorre los Racks',
        subtitle: 'Toca el piso para caminar · Clic en un rack para elegir talla',
        titleSize: 176,
      }),
    [],
  )
  const end = useMemo(
    () =>
      wallTextTexture({
        eyebrow: 'Colección Completa · 5 Salas',
        title: 'VESTIGIO',
        subtitle: 'Prendas originales de autor en piedra y botánica',
        titleSize: 280,
      }),
    [],
  )
  const [hover, setHover] = useState(false)

  return (
    <group>
      <mesh position={[-HALL.halfW + 0.02, 2.45, 4.8]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={welcome} transparent toneMapped={false} />
      </mesh>
      <mesh position={[HALL.halfW - 0.02, 2.45, 4.8]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={help} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.75, HALL.zEnd + 0.02]}>
        <planeGeometry args={[6.4, 3.2]} />
        <meshBasicMaterial map={end} transparent toneMapped={false} />
      </mesh>
      {/* Botón 3D: ir al catálogo de 30 piezas */}
      <group
        position={[0, 0.98, HALL.zEnd + 0.05]}
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
          <planeGeometry args={[2.6, 0.52]} />
          <meshBasicMaterial color={hover ? '#1F422E' : '#2D5A40'} toneMapped={false} />
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
    g.fillStyle = '#F7F4EC'
    g.font = '700 78px "Inter Variable", system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('VER RACKS EN CATÁLOGO  →', 512, 112)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[2.6, 0.52]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/* ───────────────────── Racks 3D de Boutique (Percheros Arquitectónicos de Bronce y Travertino) ───────────────────── */
function Artwork({ exhibit, texture, hovered, onHover, onSelect }) {
  const { product, position, rotationY } = exhibit
  const group = useRef()
  const pool = useRef()
  const plaque = useMemo(() => plaqueTexture(product, formatPrice(product.price)), [product])

  useFrame((_, dt) => {
    if (!group.current) return
    const targetScale = hovered ? 1.04 : 1
    const targetZ = hovered ? 0.52 : 0.36
    const targetRotY = hovered ? 0.065 : 0
    if (
      Math.abs(group.current.scale.x - targetScale) > 0.001 ||
      Math.abs(group.current.position.z - targetZ) > 0.001
    ) {
      const k = 1 - Math.exp(-10 * dt)
      const s = THREE.MathUtils.lerp(group.current.scale.x, targetScale, k)
      group.current.scale.setScalar(s)
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, k)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, k)
      pool.current.opacity = THREE.MathUtils.lerp(pool.current.opacity, hovered ? 0.52 : 0.26, k)
    }
  })

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Halo cálido sobre el muro de travertino */}
      <mesh position={[0, 0.15, 0.01]} geometry={sharedPoolGeo}>
        <meshBasicMaterial
          ref={pool}
          map={poolTex}
          transparent
          opacity={0.26}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Base de mármol travertino del perchero en el piso */}
      <mesh position={[0, -1.97, 0.36]} geometry={sharedRackPlinthGeo} material={sharedTravertineMat} />

      {/* Columnas verticales de bronce cepillado del rack */}
      <mesh position={[-0.88, -0.4, 0.36]} geometry={sharedRackPostGeo} material={sharedBronzeMat} />
      <mesh position={[0.88, -0.4, 0.36]} geometry={sharedRackPostGeo} material={sharedBronzeMat} />

      {/* Barra horizontal superior del perchero de tienda */}
      <mesh position={[0, 1.15, 0.36]} rotation-z={Math.PI / 2} geometry={sharedRackBarGeo} material={sharedBronzeMat} />

      {/* Soportes de anclaje al muro */}
      <mesh position={[-0.88, 1.15, 0.18]} rotation-x={Math.PI / 2} geometry={sharedRackBracketGeo} material={sharedDarkBronzeMat} />
      <mesh position={[0.88, 1.15, 0.18]} rotation-x={Math.PI / 2} geometry={sharedRackBracketGeo} material={sharedDarkBronzeMat} />

      {/* Prendas secundarias colgadas al fondo del rack para dar volumen de tienda */}
      <mesh position={[-0.12, -0.02, 0.16]} geometry={sharedFrameGeo} material={sharedCompanionMat} />
      <mesh position={[0.12, -0.01, 0.24]} geometry={sharedFrameGeo} material={sharedTravertineMat} />

      {/* Prenda principal colgada en su percha interactiva de bronce */}
      <group ref={group} position={[0, 0, 0.36]}>
        {/* Gancho y hombros de la percha */}
        <mesh position={[0, 1.15, 0]} geometry={sharedHangerHookGeo} material={sharedBronzeMat} />
        <mesh position={[0, 1.05, 0]} geometry={sharedHangerStemGeo} material={sharedBronzeMat} />
        <mesh position={[0, 0.98, 0]} rotation-z={Math.PI / 2} geometry={sharedHangerBarGeo} material={sharedDarkBronzeMat} />

        {/* Portaprenda rígido del atelier */}
        <mesh position={[0, -0.04, 0]} geometry={sharedFrameGeo} material={sharedFrameMat} />

        {/* Fotografía de estudio de la prenda original */}
        <mesh
          position={[0, -0.04, 0.024]}
          geometry={sharedArtGeo}
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
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>

      {/* Atril lateral de bronce con la etiqueta de precio y tallas */}
      <mesh position={[1.28, -1.42, 0.36]} geometry={sharedPlaquePostGeo} material={sharedDarkBronzeMat} />
      <mesh position={[1.28, -0.78, 0.38]} geometry={sharedPlaqueGeo}>
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.4, 0.95]} rotation-x={0.32} geometry={sharedConeGeo} material={coneMaterial} />
      <mesh position={[0, HALL.height - position[1] - 0.01, 1.45]} rotation-x={Math.PI / 2} geometry={sharedLampGeo} material={sharedLampMat} />
    </group>
  )
}

/* ───────────────────────────── Esculturas Centrales (Vestíbulo + 5 Salas) ───────────────────────────── */
function Pedestal({ z, x = 0, children }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2} geometry={sharedShadowGeo} material={sharedShadowMat} />
      <mesh position={[0, 0.51, 0]} geometry={sharedPedestalGeo} material={sharedPedestalMat} />
      <group position={[0, 1.02, 0]}>{children}</group>
      <mesh position={[0, 3.25, 0]} geometry={sharedConeGeo} material={coneMaterial} />
    </group>
  )
}

function useSpin(ref, reduced, speed = 0.25) {
  useFrame((_, dt) => {
    if (!reduced && ref.current) ref.current.rotation.y += dt * speed
  })
}

/**
 * PIEZA ORIGINAL 3D — "Ánfora Textil Helénica" (Vestíbulo).
 * Peplos griego / vestido por revolución cuyos pliegues respiran en un vertex shader GLSL.
 */
function AnforaTextil({ reduced }) {
  const group = useRef()
  const shaderRef = useRef()
  const geometry = useMemo(() => {
    const profile = [
      [0.0, 1.62], [0.12, 1.62], [0.17, 1.56], [0.3, 1.48], [0.33, 1.4], [0.31, 1.24],
      [0.25, 1.06], [0.22, 0.98], [0.27, 0.86], [0.36, 0.7], [0.44, 0.48], [0.54, 0.24], [0.66, 0.02], [0.64, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const g = new THREE.LatheGeometry(profile, 72)
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#4E8C6F',
      roughness: 0.42,
      metalness: 0.12,
      side: THREE.DoubleSide,
    })
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
    if (!reduced && group.current) group.current.rotation.y += dt * 0.18
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
        { name: 'Ánfora Textil Helénica', brand: 'Escultura GLSL', color: 'Jade Botánico & Bronce' },
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
        <cylinderGeometry args={[0.85, 0.9, 0.44, 36]} />
        <meshStandardMaterial color="#D8D4CA" roughness={0.68} />
      </mesh>
      <group ref={group} position={[0, 0.44, 0]}>
        <mesh geometry={geometry} material={material} />
      </group>
      <group ref={rings} position={[0, 1.3, 0]}>
        {[0.95, 1.1, 1.25].map((r) => (
          <mesh key={r} rotation-x={Math.PI / 2}>
            <torusGeometry args={[r, 0.007, 6, 64]} />
            <meshStandardMaterial color="#C8B07A" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 3.2, 0]} geometry={sharedConeGeo} material={coneMaterial} />
      <mesh position={[0, 0.5, 1.05]} rotation-x={-0.5} geometry={sharedPlaqueGeo}>
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Sala I (Diseñador): Fragmento de Columna Dórica */
function ColumnFragment({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.14)
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.3, 0.33, 1.25, 48, 12)
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
        const broken = (0.5 + 0.5 * Math.sin(th * 3 + 1.3)) * 0.3
        v.y -= broken * ((v.y - 0.3) / 0.3)
      }
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <Pedestal z={z}>
      <mesh ref={ref} geometry={geometry} position={[0, 0.62, 0]}>
        <meshStandardMaterial color="#EAE6DD" roughness={0.5} />
      </mesh>
    </Pedestal>
  )
}

/** Sala II (Billionaire Boys Club): Astrolabio Cósmico de Delfos */
function CosmosAstrolabe({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.28)
  return (
    <Pedestal z={z}>
      <group ref={ref} position={[0, 0.65, 0]}>
        <mesh>
          <OctahedronCore />
        </mesh>
        <mesh rotation-x={0.6}>
          <torusGeometry args={[0.42, 0.018, 12, 48]} />
          <meshStandardMaterial color="#C8B07A" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh rotation-y={0.8} rotation-x={-0.4}>
          <torusGeometry args={[0.52, 0.014, 12, 48]} />
          <meshStandardMaterial color="#5E9E7E" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
    </Pedestal>
  )
}

function OctahedronCore() {
  return (
    <>
      <octahedronGeometry args={[0.24, 1]} />
      <meshStandardMaterial color="#EAE6DD" roughness={0.3} metalness={0.2} flatShading />
    </>
  )
}

/** Sala III (BAPE & Base): Monolito Facetado de Granito y Jade */
function GraniteMonolith({ z, reduced }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (reduced || !ref.current) return
    ref.current.rotation.y += dt * 0.25
    ref.current.rotation.x += dt * 0.1
  })
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.44, 1).toNonIndexed()
    const palette = ['#F2EFE9', '#5E9E7E', '#C8B07A', '#3B5246', '#252D29'].map((c) => new THREE.Color(c))
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
        <meshStandardMaterial vertexColors flatShading roughness={0.45} />
      </mesh>
    </Pedestal>
  )
}

/** Sala IV (Yeezy): Monolito Brutalista del Pentélico */
function BrutalistSphere({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.22)
  return (
    <Pedestal z={z}>
      <mesh ref={ref} position={[0, 0.62, 0]}>
        <torusKnotGeometry args={[0.28, 0.095, 96, 18, 2, 3]} />
        <meshStandardMaterial color="#7C8580" roughness={0.55} metalness={0.25} />
      </mesh>
    </Pedestal>
  )
}

/** Sala V (Sneakers): Reliquia Alada de Hermes en Bronce */
function WingedPedestalRelic({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, reduced, 0.32)
  return (
    <Pedestal z={z}>
      <group ref={ref} position={[0, 0.55, 0]}>
        {/* Silueta escultórica abstracta de calzado alado en bronce antiguo */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.64, 0.14, 0.28]} />
          <meshStandardMaterial color="#EAE6DD" roughness={0.4} />
        </mesh>
        <mesh position={[-0.06, 0.08, 0]}>
          <boxGeometry args={[0.46, 0.28, 0.24]} />
          <meshStandardMaterial color="#C8B07A" metalness={0.85} roughness={0.28} />
        </mesh>
        {/* Alas de Hermes */}
        <mesh position={[-0.18, 0.24, 0.15]} rotation-z={0.35}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshStandardMaterial color="#5E9E7E" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[-0.18, 0.24, -0.15]} rotation-z={0.35}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshStandardMaterial color="#5E9E7E" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
    </Pedestal>
  )
}

/* ───────────────────── Polvo y Polen Botánico en GPU (Cero CPU loop por frame) ───────────────────── */
function Dust({ count }) {
  const matRef = useRef()
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * HALL.halfW * 1.85
      positions[i * 3 + 1] = Math.random() * HALL.height
      positions[i * 3 + 2] = HALL.zStart - Math.random() * LENGTH
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases }
  }, [count])

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uHeight: { value: HALL.height },
        },
        vertexShader: /* glsl */ `
          attribute float aPhase;
          uniform float uTime;
          uniform float uHeight;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.y = mod(p.y + uTime * 0.06 + aPhase, uHeight);
            p.x += sin(uTime * 0.4 + aPhase * 6.0) * 0.12;
            vAlpha = sin((p.y / uHeight) * 3.14159);
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = 18.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(0.68, 0.88, 0.76, (1.0 - d * 2.0) * vAlpha * 0.55);
          }
        `,
      }),
    [],
  )

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <primitive ref={matRef} object={shaderMaterial} attach="material" />
    </points>
  )
}
