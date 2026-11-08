import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { HALL, dividers, roomCenter, exhibits, ENTRANCE_SCULPTURE, DOOR_HALF, walkable } from './layout.js'
import { roomTitleTexture, plaqueTexture, wallTextTexture, floorTexture, wallGraniteTexture, radialTexture } from './textures.js'
import { rooms, formatPrice } from '../data/products.js'

const LENGTH = HALL.zStart - HALL.zEnd // 93m
const MID_Z = (HALL.zStart + HALL.zEnd) / 2 // -35.5
const noopRaycast = () => null

// Geometrías y materiales compartidos a nivel de módulo (100% Lambert/Basic = iluminación por vértice ultrarrápida)
const sharedPoolGeo = new THREE.PlaneGeometry(2.1, 2.4)
const sharedRackPlinthGeo = new THREE.BoxGeometry(1.94, 0.16, 0.68)
const sharedRackPostGeo = new THREE.CylinderGeometry(0.026, 0.026, 3.12, 8)
const sharedRackBarGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.84, 8)
const sharedRackBracketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6)
const sharedFrameGeo = new THREE.BoxGeometry(1.52, 2.02, 0.04)
const sharedArtGeo = new THREE.PlaneGeometry(1.44, 1.92)
const sharedPlaqueGeo = new THREE.PlaneGeometry(0.68, 0.34)
const sharedPlaquePostGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6)
const sharedLampGeo = new THREE.CircleGeometry(0.12, 10)
const sharedShadowGeo = new THREE.PlaneGeometry(2.1, 2.1)
const sharedPedestalGeo = new THREE.BoxGeometry(0.88, 1.02, 0.88)

// Todos los materiales usan MeshLambertMaterial (cálculo de luz por vértice, no por píxel) o MeshBasicMaterial:
// un único programa de shader compartido y cero cuellos de botella de fill-rate en GPUs integradas.
const sharedBronzeMat = new THREE.MeshLambertMaterial({ color: '#C4A055', emissive: '#2A1F0A' })
const sharedDarkBronzeMat = new THREE.MeshLambertMaterial({ color: '#5A472B' })
const sharedTravertineMat = new THREE.MeshLambertMaterial({ color: '#E6DFD1' })
const sharedCompanionMat = new THREE.MeshLambertMaterial({ color: '#D6CFC0' })
const sharedFrameMat = new THREE.MeshLambertMaterial({ color: '#F2EEE4' })
const sharedLampMat = new THREE.MeshBasicMaterial({ color: '#FFFDF7' })
const sharedPedestalMat = new THREE.MeshLambertMaterial({ color: '#E2DBD0' })

const poolTex = radialTexture('rgba(255, 248, 230, 0.42)', 'rgba(255, 248, 230, 0)')
const sharedPoolMat = new THREE.MeshBasicMaterial({
  map: poolTex,
  transparent: true,
  depthWrite: false,
  toneMapped: false,
})

// Percha fusionada: gancho + vástago + hombros = 1 geometría compartida
const hangerGeo = (() => {
  const hook = new THREE.TorusGeometry(0.055, 0.01, 5, 10, Math.PI * 1.35).translate(0, 1.15, 0)
  const stem = new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6).translate(0, 1.05, 0)
  const bar = new THREE.CylinderGeometry(0.016, 0.016, 0.92, 6).rotateZ(Math.PI / 2).translate(0, 0.98, 0)
  const parts = [hook, stem, bar].map((g) => (g.index ? g.toNonIndexed() : g))
  return mergeGeometries(parts)
})()
const shadowTex = radialTexture('rgba(35, 32, 26, 0.3)', 'rgba(35, 32, 26, 0)')
const sharedShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })

/* ───────────────────────────── Escena completa optimizada ───────────────────────────── */
const Scene = memo(function Scene({ reduced, onHover, onSelect, onFloorClick, onNavigate, onReady }) {
  const { gl, scene, camera } = useThree()
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  useEffect(() => {
    let alive = true
    let rafId = 0
    // Precompilar shaders y subir texturas en lotes pequeños por fotograma (4 por frame)
    // para no congelar nunca el hilo principal al abrir el museo.
    const texList = []
    const seen = new Set()
    scene.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      mats.forEach((m) => {
        if (m.map && !seen.has(m.map)) {
          seen.add(m.map)
          texList.push(m.map)
        }
      })
    })
    gl.compile(scene, camera)
    readyRef.current?.()

    let idx = 0
    const uploadStep = () => {
      if (!alive) return
      const end = Math.min(idx + 4, texList.length)
      for (; idx < end; idx++) gl.initTexture(texList[idx])
      if (idx < texList.length) rafId = requestAnimationFrame(uploadStep)
    }
    rafId = requestAnimationFrame(uploadStep)

    return () => {
      alive = false
      cancelAnimationFrame(rafId)
    }
  }, [gl, scene, camera])

  // Variantes -sm.webp (420x560) sin mipmaps costosos: carga y subida instantánea
  const textures = useLoader(
    THREE.TextureLoader,
    exhibits.map((e) => e.product.img.replace('.webp', '-sm.webp')),
  )

  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 1
      t.generateMipmaps = false
      t.minFilter = THREE.LinearFilter
      t.magFilter = THREE.LinearFilter
      t.needsUpdate = true
    })
  }, [textures])

  return (
    <>
      <hemisphereLight args={['#fffdf8', '#c8bfa8', 1.6]} />
      <directionalLight position={[5, 14, 8]} intensity={0.95} color="#fff9eb" />

      <Architecture onFloorClick={onFloorClick} />
      <InstancedDoricColumns />
      <BotanicalGarden />
      <WallTexts onNavigate={onNavigate} />

      <InstancedRackHardware />
      <InstancedPedestals />
      <PlaqueAtlas />

      <ExhibitGarments textures={textures} onHover={onHover} onSelect={onSelect} />

      <AnforaTextil reduced={reduced} />
      <ColumnFragment z={roomCenter(0)} reduced={reduced} />
      <CosmosAstrolabe z={roomCenter(1)} reduced={reduced} />
      <GraniteMonolith z={roomCenter(2)} reduced={reduced} />
      <BrutalistSphere z={roomCenter(3)} reduced={reduced} />
      <WingedPedestalRelic z={roomCenter(4)} reduced={reduced} />
    </>
  )
})

export default Scene

/* ───────────────────── Herrajes de racks instanciados (sin conos transparentes superpuestos) ───────────────────── */
const RACK_PARTS = [
  { geo: sharedRackPlinthGeo, mat: sharedTravertineMat, items: [[[0, -1.97, 0.36], [0, 0, 0]]] },
  {
    geo: sharedRackPostGeo,
    mat: sharedBronzeMat,
    items: [
      [[-0.88, -0.4, 0.36], [0, 0, 0]],
      [[0.88, -0.4, 0.36], [0, 0, 0]],
    ],
  },
  { geo: sharedRackBarGeo, mat: sharedBronzeMat, items: [[[0, 1.15, 0.36], [0, 0, Math.PI / 2]]] },
  {
    geo: sharedRackBracketGeo,
    mat: sharedDarkBronzeMat,
    items: [
      [[-0.88, 1.15, 0.18], [Math.PI / 2, 0, 0]],
      [[0.88, 1.15, 0.18], [Math.PI / 2, 0, 0]],
    ],
  },
  { geo: sharedFrameGeo, mat: sharedCompanionMat, items: [[[-0.12, -0.02, 0.16], [0, 0, 0]]] },
  { geo: sharedFrameGeo, mat: sharedTravertineMat, items: [[[0.12, -0.01, 0.24], [0, 0, 0]]] },
  { geo: sharedPlaquePostGeo, mat: sharedDarkBronzeMat, items: [[[1.28, -1.42, 0.36], [0, 0, 0]]] },
  { geo: sharedLampGeo, mat: sharedLampMat, items: [[[0, HALL.height - 2.0 - 0.01, 1.45], [Math.PI / 2, 0, 0]]] },
  { geo: sharedPoolGeo, mat: sharedPoolMat, items: [[[0, 0.15, 0.01], [0, 0, 0]]] },
]

function InstancedRackHardware() {
  const refs = useRef([])

  useLayoutEffect(() => {
    const parent = new THREE.Object3D()
    const child = new THREE.Object3D()
    RACK_PARTS.forEach((part, pi) => {
      const mesh = refs.current[pi]
      if (!mesh) return
      let i = 0
      exhibits.forEach((e) => {
        parent.position.set(e.position[0], e.position[1], e.position[2])
        parent.rotation.set(0, e.rotationY, 0)
        parent.updateMatrix()
        part.items.forEach(([p, r]) => {
          child.position.set(p[0], p[1], p[2])
          child.rotation.set(r[0], r[1], r[2])
          child.updateMatrix()
          child.matrix.premultiply(parent.matrix)
          mesh.setMatrixAt(i++, child.matrix)
        })
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  }, [])

  return (
    <group>
      {RACK_PARTS.map((part, pi) => (
        <instancedMesh
          key={pi}
          ref={(m) => (refs.current[pi] = m)}
          args={[part.geo, part.mat, exhibits.length * part.items.length]}
          frustumCulled={false}
          raycast={noopRaycast}
        />
      ))}
    </group>
  )
}

/* ───────────────── Pedestales y sombras de las 6 esculturas instanciados (2 draw calls) ───────────────── */
function InstancedPedestals() {
  const shadowRef = useRef()
  const pedRef = useRef()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const roomZs = [0, 1, 2, 3, 4].map((i) => roomCenter(i))

    roomZs.forEach((z, i) => {
      dummy.position.set(0, 0.51, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      pedRef.current.setMatrixAt(i, dummy.matrix)
    })
    pedRef.current.instanceMatrix.needsUpdate = true

    const allSculptures = [
      { x: ENTRANCE_SCULPTURE.x, z: ENTRANCE_SCULPTURE.z, shadowScale: 1.36 },
      ...roomZs.map((z) => ({ x: 0, z, shadowScale: 1.0 })),
    ]
    allSculptures.forEach((s, i) => {
      dummy.position.set(s.x, 0.003, s.z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.setScalar(s.shadowScale)
      dummy.updateMatrix()
      shadowRef.current.setMatrixAt(i, dummy.matrix)
    })
    shadowRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      <instancedMesh ref={pedRef} args={[sharedPedestalGeo, sharedPedestalMat, 5]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={shadowRef} args={[sharedShadowGeo, sharedShadowMat, 6]} frustumCulled={false} raycast={noopRaycast} />
    </group>
  )
}

/* ───────────────────────────── Arquitectura en Travertino y Granito Griego ───────────────────────────── */
const { mergedDividersGeo, mergedBronzeTrimGeo, mergedSkylightsGeo } = (() => {
  const segW = HALL.halfW - DOOR_HALF
  const doorH = 4.1
  const divParts = []
  const bronzeParts = []

  dividers.forEach((z) => {
    ;[-1, 1].forEach((s) => {
      divParts.push(new THREE.BoxGeometry(segW, HALL.height, 0.42).translate(s * (DOOR_HALF + segW / 2), HALL.height / 2, z))
    })
    divParts.push(
      new THREE.BoxGeometry(DOOR_HALF * 2, HALL.height - doorH, 0.42).translate(0, (HALL.height + doorH) / 2, z),
    )
    bronzeParts.push(new THREE.BoxGeometry(DOOR_HALF * 2 + 0.4, 0.08, 0.48).translate(0, doorH, z))
  })

  ;[-1, 1].forEach((s) => {
    bronzeParts.push(new THREE.BoxGeometry(0.06, 0.16, LENGTH).translate(s * (HALL.halfW - 0.03), 0.08, MID_Z))
  })

  const skyParts = [-3.0, 3.0].map((x) =>
    new THREE.BoxGeometry(0.24, 0.02, LENGTH - 0.6).translate(x, HALL.height - 0.02, MID_Z),
  )

  return {
    mergedDividersGeo: mergeGeometries(divParts),
    mergedBronzeTrimGeo: mergeGeometries(bronzeParts),
    mergedSkylightsGeo: mergeGeometries(skyParts),
  }
})()

const sharedDividerMat = new THREE.MeshLambertMaterial({ color: '#e2dbcc' })
const sharedBronzeTrimMat = new THREE.MeshBasicMaterial({ color: '#9A7438' })
const sharedCeilingMat = new THREE.MeshBasicMaterial({ color: '#DFD8C8' })
const sharedSkylightMat = new THREE.MeshBasicMaterial({ color: '#FFFDF7' })

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

  const floorMat = useMemo(() => new THREE.MeshLambertMaterial({ map: floorMap, color: '#f4efe4' }), [floorMap])
  const wallMat = useMemo(() => new THREE.MeshLambertMaterial({ map: wallMap, color: '#f0ebe0' }), [wallMap])

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, MID_Z]}
        material={floorMat}
        onPointerMove={(e) => {
          if (e.buttons > 0) return
          const now = performance.now()
          if (now - lastMoveTime.current < 40 || !marker.current) return
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
      </mesh>

      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false} renderOrder={2} raycast={noopRaycast}>
        <ringGeometry args={[0.22, 0.28, 20]} />
        <meshBasicMaterial ref={markerMat} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      <mesh rotation-x={Math.PI / 2} position={[0, HALL.height, MID_Z]} material={sharedCeilingMat} raycast={noopRaycast}>
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
      </mesh>
      <mesh geometry={mergedSkylightsGeo} material={sharedSkylightMat} frustumCulled={false} raycast={noopRaycast} />

      <mesh position={[-HALL.halfW, HALL.height / 2, MID_Z]} rotation-y={Math.PI / 2} material={wallMat} raycast={noopRaycast}>
        <planeGeometry args={[LENGTH, HALL.height]} />
      </mesh>
      <mesh position={[HALL.halfW, HALL.height / 2, MID_Z]} rotation-y={-Math.PI / 2} material={wallMat} raycast={noopRaycast}>
        <planeGeometry args={[LENGTH, HALL.height]} />
      </mesh>
      <mesh position={[0, HALL.height / 2, HALL.zStart]} rotation-y={Math.PI} material={wallMat} raycast={noopRaycast}>
        <planeGeometry args={[HALL.halfW * 2, HALL.height]} />
      </mesh>
      <mesh position={[0, HALL.height / 2, HALL.zEnd]} material={wallMat} raycast={noopRaycast}>
        <planeGeometry args={[HALL.halfW * 2, HALL.height]} />
      </mesh>

      <mesh geometry={mergedDividersGeo} material={sharedDividerMat} frustumCulled={false} raycast={noopRaycast} />
      <mesh geometry={mergedBronzeTrimGeo} material={sharedBronzeTrimMat} frustumCulled={false} raycast={noopRaycast} />

      {dividers.map((z, i) => (
        <RoomTitle key={z} index={i} z={z} />
      ))}
    </group>
  )
}

/* ───────────────────── Columnas Dóricas Griegas Instanciadas (2 Draw Calls) ───────────────────── */
const columnPositions = [
  [-2.6, 6.2],
  [2.6, 6.2],
  ...dividers.flatMap((z) => [
    [-DOOR_HALF + 0.15, z],
    [DOOR_HALF - 0.15, z],
  ]),
]
const sharedShaftGeo = new THREE.CylinderGeometry(0.22, 0.27, 4.1, 10)
const sharedCapGeo = new THREE.BoxGeometry(0.68, 0.18, 0.68)
const sharedMarbleMat = new THREE.MeshLambertMaterial({ color: '#DCD7CC' })

function InstancedDoricColumns() {
  const shaftRef = useRef()
  const capRef = useRef()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    columnPositions.forEach(([x, z], i) => {
      dummy.position.set(x, 2.05, z)
      dummy.updateMatrix()
      shaftRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(x, 4.02, z)
      dummy.updateMatrix()
      capRef.current.setMatrixAt(i, dummy.matrix)
    })
    shaftRef.current.instanceMatrix.needsUpdate = true
    capRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      <instancedMesh
        ref={shaftRef}
        args={[sharedShaftGeo, sharedMarbleMat, columnPositions.length]}
        frustumCulled={false}
        raycast={noopRaycast}
      />
      <instancedMesh
        ref={capRef}
        args={[sharedCapGeo, sharedMarbleMat, columnPositions.length]}
        frustumCulled={false}
        raycast={noopRaycast}
      />
    </group>
  )
}

/* ───────────────────── Jardineras Botánicas Instanciadas (4 Draw Calls) ───────────────────── */
const planterGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.56, 8)
const planterMat = new THREE.MeshLambertMaterial({ color: '#2F3834' })
const trunkGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 6)
const trunkMat = new THREE.MeshLambertMaterial({ color: '#4A3F35' })
const foliageGeo1 = new THREE.DodecahedronGeometry(0.46, 0)
const foliageGeo2 = new THREE.DodecahedronGeometry(0.34, 0)
const foliageMat1 = new THREE.MeshLambertMaterial({ color: '#3E755B' })
const foliageMat2 = new THREE.MeshLambertMaterial({ color: '#5E9E7E' })

const PLANTERS_LIST = (() => {
  const list = [
    { x: -4.2, z: 7.5, scale: 1.15 },
    { x: 4.2, z: 7.5, scale: 1.15 },
    { x: -4.2, z: 0.2, scale: 1.0 },
    { x: 4.2, z: 0.2, scale: 1.0 },
  ]
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
})()

function BotanicalGarden() {
  const potRef = useRef()
  const trunkRef = useRef()
  const fol1Ref = useRef()
  const fol2Ref = useRef()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    let f2Idx = 0
    PLANTERS_LIST.forEach((p, i) => {
      const s = p.scale
      dummy.scale.setScalar(s)

      dummy.position.set(p.x, 0.28 * s, p.z)
      dummy.updateMatrix()
      potRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(p.x, 0.85 * s, p.z)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(p.x, 1.38 * s, p.z)
      dummy.updateMatrix()
      fol1Ref.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(p.x + 0.2 * s, 1.62 * s, p.z + 0.12 * s)
      dummy.updateMatrix()
      fol2Ref.current.setMatrixAt(f2Idx++, dummy.matrix)

      dummy.position.set(p.x - 0.18 * s, 1.54 * s, p.z - 0.14 * s)
      dummy.updateMatrix()
      fol2Ref.current.setMatrixAt(f2Idx++, dummy.matrix)
    })
    potRef.current.instanceMatrix.needsUpdate = true
    trunkRef.current.instanceMatrix.needsUpdate = true
    fol1Ref.current.instanceMatrix.needsUpdate = true
    fol2Ref.current.instanceMatrix.needsUpdate = true
  }, [])

  const n = PLANTERS_LIST.length
  return (
    <group>
      <instancedMesh ref={potRef} args={[planterGeo, planterMat, n]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, n]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={fol1Ref} args={[foliageGeo1, foliageMat1, n]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={fol2Ref} args={[foliageGeo2, foliageMat2, n * 2]} frustumCulled={false} raycast={noopRaycast} />
    </group>
  )
}

function RoomTitle({ index, z }) {
  const tex = useMemo(() => {
    const [num, name] = rooms[index].name.split('·').map((s) => s.trim())
    return roomTitleTexture(num.toUpperCase(), name, rooms[index].text)
  }, [index])
  const segW = HALL.halfW - DOOR_HALF
  return (
    <mesh position={[-(DOOR_HALF + segW / 2), 2.65, z + 0.22]} raycast={noopRaycast}>
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
      <mesh position={[-HALL.halfW + 0.02, 2.45, 4.8]} rotation-y={Math.PI / 2} raycast={noopRaycast}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={welcome} transparent toneMapped={false} />
      </mesh>
      <mesh position={[HALL.halfW - 0.02, 2.45, 4.8]} rotation-y={-Math.PI / 2} raycast={noopRaycast}>
        <planeGeometry args={[5.2, 2.6]} />
        <meshBasicMaterial map={help} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.75, HALL.zEnd + 0.02]} raycast={noopRaycast}>
        <planeGeometry args={[6.4, 3.2]} />
        <meshBasicMaterial map={end} transparent toneMapped={false} />
      </mesh>
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
    c.width = 512
    c.height = 108
    const g = c.getContext('2d')
    g.fillStyle = '#F7F4EC'
    g.font = '700 39px "Inter Variable", system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('VER RACKS EN CATÁLOGO  →', 256, 56)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.generateMipmaps = false
    t.minFilter = THREE.LinearFilter
    return t
  }, [])
  return (
    <mesh position={[0, 0, 0.01]} raycast={noopRaycast}>
      <planeGeometry args={[2.6, 0.52]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/* ───────────── Prendas y Perchas Interactivas (2 InstancedMeshes + 1 bucle useFrame) ───────────── */
const parentHelper = new THREE.Object3D()
const hangerHelper = new THREE.Object3D()
const frameHelper = new THREE.Object3D()

function computeHangerAndFrameMatrices(exhibit, s, z, rotY) {
  parentHelper.position.set(exhibit.position[0], exhibit.position[1], exhibit.position[2])
  parentHelper.rotation.set(0, exhibit.rotationY, 0)
  parentHelper.updateMatrix()

  hangerHelper.position.set(0, 0, z)
  hangerHelper.rotation.set(0, rotY, 0)
  hangerHelper.scale.setScalar(s)
  hangerHelper.updateMatrix()
  hangerHelper.matrix.premultiply(parentHelper.matrix)

  frameHelper.position.set(0, -0.04 * s, z)
  frameHelper.rotation.set(0, rotY, 0)
  frameHelper.scale.setScalar(s)
  frameHelper.updateMatrix()
  frameHelper.matrix.premultiply(parentHelper.matrix)
}

const ExhibitGarments = memo(function ExhibitGarments({ textures, onHover, onSelect }) {
  const hangerInstRef = useRef()
  const frameInstRef = useRef()
  const artRefs = useRef([])
  const animState = useRef(() => exhibits.map(() => ({ hovered: false, s: 1, z: 0.36, rotY: 0 })))
  if (typeof animState.current === 'function') animState.current = animState.current()
  const activeSet = useRef(new Set())

  useLayoutEffect(() => {
    exhibits.forEach((e, i) => {
      computeHangerAndFrameMatrices(e, 1, 0.36, 0)
      hangerInstRef.current.setMatrixAt(i, hangerHelper.matrix)
      frameInstRef.current.setMatrixAt(i, frameHelper.matrix)
    })
    hangerInstRef.current.instanceMatrix.needsUpdate = true
    frameInstRef.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((_, dt) => {
    if (activeSet.current.size === 0) return
    const k = 1 - Math.exp(-10 * Math.min(dt, 0.05))
    let updatedInst = false

    activeSet.current.forEach((idx) => {
      const st = animState.current[idx]
      const targetS = st.hovered ? 1.04 : 1
      const targetZ = st.hovered ? 0.52 : 0.36
      const targetRotY = st.hovered ? 0.065 : 0

      if (Math.abs(st.s - targetS) > 0.001 || Math.abs(st.z - targetZ) > 0.001) {
        st.s = THREE.MathUtils.lerp(st.s, targetS, k)
        st.z = THREE.MathUtils.lerp(st.z, targetZ, k)
        st.rotY = THREE.MathUtils.lerp(st.rotY, targetRotY, k)
      } else {
        st.s = targetS
        st.z = targetZ
        st.rotY = targetRotY
        if (!st.hovered) activeSet.current.delete(idx)
      }

      const artMesh = artRefs.current[idx]
      if (artMesh) {
        artMesh.scale.setScalar(st.s)
        artMesh.position.set(0, -0.04 * st.s, st.z + 0.024 * st.s)
        artMesh.rotation.y = st.rotY
      }

      computeHangerAndFrameMatrices(exhibits[idx], st.s, st.z, st.rotY)
      hangerInstRef.current.setMatrixAt(idx, hangerHelper.matrix)
      frameInstRef.current.setMatrixAt(idx, frameHelper.matrix)
      updatedInst = true
    })

    if (updatedInst) {
      hangerInstRef.current.instanceMatrix.needsUpdate = true
      frameInstRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh
        ref={hangerInstRef}
        args={[hangerGeo, sharedBronzeMat, exhibits.length]}
        frustumCulled={false}
        raycast={noopRaycast}
      />
      <instancedMesh
        ref={frameInstRef}
        args={[sharedFrameGeo, sharedFrameMat, exhibits.length]}
        frustumCulled={false}
        raycast={noopRaycast}
      />
      {exhibits.map((e, i) => (
        <group key={e.product.id} position={e.position} rotation-y={e.rotationY}>
          <mesh
            ref={(m) => (artRefs.current[i] = m)}
            position={[0, -0.04, 0.384]}
            geometry={sharedArtGeo}
            onPointerOver={(ev) => {
              ev.stopPropagation()
              animState.current[i].hovered = true
              activeSet.current.add(i)
              onHover(e.product.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              animState.current[i].hovered = false
              activeSet.current.add(i)
              onHover(null)
              document.body.style.cursor = ''
            }}
            onClick={(ev) => {
              if (ev.delta > 6) return
              ev.stopPropagation()
              onSelect(e.product.id)
            }}
          >
            <meshBasicMaterial map={textures[i]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

/* ───────────── Etiquetas de los 30 racks: atlas 1024×1024 (4× menos VRAM) + malla única ───────────── */
const PLAQUE_COLS = 4
const PLAQUE_ROWS = 8 // 4 × 8 celdas de 256×128 → atlas 1024×1024
function PlaqueAtlas() {
  const { geometry, material } = useMemo(() => {
    const atlas = document.createElement('canvas')
    atlas.width = 256 * PLAQUE_COLS
    atlas.height = 128 * PLAQUE_ROWS
    const ctx = atlas.getContext('2d')
    const parent = new THREE.Object3D()
    const child = new THREE.Object3D()
    const parts = exhibits.map((e, i) => {
      const col = i % PLAQUE_COLS
      const row = Math.floor(i / PLAQUE_COLS)
      const single = plaqueTexture(e.product, formatPrice(e.product.price))
      ctx.drawImage(single.image, col * 256, row * 128)
      single.dispose()

      const g = sharedPlaqueGeo.clone()
      const uv = g.attributes.uv
      for (let k = 0; k < uv.count; k++) {
        uv.setXY(k, (col + uv.getX(k)) / PLAQUE_COLS, 1 - (row + 1) / PLAQUE_ROWS + uv.getY(k) / PLAQUE_ROWS)
      }
      parent.position.set(e.position[0], e.position[1], e.position[2])
      parent.rotation.set(0, e.rotationY, 0)
      parent.updateMatrix()
      child.position.set(1.28, -0.78, 0.38)
      child.updateMatrix()
      child.matrix.premultiply(parent.matrix)
      g.applyMatrix4(child.matrix)
      return g
    })
    const tex = new THREE.CanvasTexture(atlas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    tex.minFilter = THREE.LinearFilter
    const merged = mergeGeometries(parts)
    parts.forEach((p) => p.dispose())
    return { geometry: merged, material: new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) }
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.map.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  return <mesh geometry={geometry} material={material} frustumCulled={false} raycast={noopRaycast} />
}

/* ───────────────────────────── Esculturas Centrales (100% Lambert + Culling por Distancia) ───────────────────────────── */
function Pedestal({ z, x = 0, children }) {
  return <group position={[x, 1.02, z]}>{children}</group>
}

function useSpin(ref, z, reduced, speed = 0.25) {
  useFrame((state, dt) => {
    if (reduced || !ref.current) return
    if (Math.abs(state.camera.position.z - z) > 24) return
    ref.current.rotation.y += dt * speed
  })
}

/**
 * PIEZA ORIGINAL 3D — "Ánfora Textil Helénica" (Vestíbulo).
 * Pliegues esculpidos directamente en la geometría al inicializar (cero compilación de shaders custom).
 */
function AnforaTextil({ reduced }) {
  const group = useRef()
  const rings = useRef()
  const geometry = useMemo(() => {
    const profile = [
      [0.0, 1.62], [0.12, 1.62], [0.17, 1.56], [0.3, 1.48], [0.33, 1.4], [0.31, 1.24],
      [0.25, 1.06], [0.22, 0.98], [0.27, 0.86], [0.36, 0.7], [0.44, 0.48], [0.54, 0.24], [0.66, 0.02], [0.64, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const g = new THREE.LatheGeometry(profile, 36)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const ang = Math.atan2(v.z, v.x)
      const h = Math.max(0, Math.min(1, 1.0 - v.y))
      const folds = Math.sin(ang * 9.0 + v.y * 4.0) * 0.045 + Math.sin(ang * 4.0) * 0.025
      const r = Math.hypot(v.x, v.z)
      if (r > 0.01) {
        const scale = (r + folds * h * h) / r
        v.x *= scale
        v.z *= scale
      }
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])

  useFrame((state, dt) => {
    if (reduced || Math.abs(state.camera.position.z - ENTRANCE_SCULPTURE.z) > 22) return
    const t = state.clock.elapsedTime
    if (group.current) group.current.rotation.y += dt * 0.18
    if (rings.current) {
      rings.current.children.forEach((r, i) => {
        r.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + i) * 0.35
        r.rotation.z = t * (0.2 + i * 0.08)
      })
    }
  })

  const plaque = useMemo(
    () =>
      plaqueTexture(
        { name: 'Ánfora Textil Helénica', brand: 'Escultura Helénica', color: 'Jade Botánico & Bronce' },
        'Pieza central del vestíbulo',
      ),
    [],
  )

  return (
    <group position={[ENTRANCE_SCULPTURE.x, 0, ENTRANCE_SCULPTURE.z]}>
      <mesh position={[0, 0.22, 0]} raycast={noopRaycast}>
        <cylinderGeometry args={[0.85, 0.9, 0.44, 20]} />
        <meshLambertMaterial color="#D8D4CA" />
      </mesh>
      <group ref={group} position={[0, 0.44, 0]}>
        <mesh geometry={geometry} raycast={noopRaycast}>
          <meshLambertMaterial color="#4E8C6F" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={rings} position={[0, 1.3, 0]}>
        {[0.95, 1.1, 1.25].map((r) => (
          <mesh key={r} rotation-x={Math.PI / 2} material={sharedBronzeMat} raycast={noopRaycast}>
            <torusGeometry args={[r, 0.007, 6, 32]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.5, 1.05]} rotation-x={-0.5} geometry={sharedPlaqueGeo} raycast={noopRaycast}>
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Sala I (Diseñador): Fragmento de Columna Dórica */
function ColumnFragment({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, z, reduced, 0.14)
  const geometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.3, 0.33, 1.25, 28, 6)
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
      <mesh ref={ref} geometry={geometry} position={[0, 0.62, 0]} raycast={noopRaycast}>
        <meshLambertMaterial color="#EAE6DD" />
      </mesh>
    </Pedestal>
  )
}

/** Sala II (Billionaire Boys Club): Astrolabio Cósmico de Delfos */
function CosmosAstrolabe({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, z, reduced, 0.28)
  return (
    <Pedestal z={z}>
      <group ref={ref} position={[0, 0.65, 0]}>
        <mesh raycast={noopRaycast}>
          <octahedronGeometry args={[0.24, 1]} />
          <meshLambertMaterial color="#EAE6DD" flatShading />
        </mesh>
        <mesh rotation-x={0.6} material={sharedBronzeMat} raycast={noopRaycast}>
          <torusGeometry args={[0.42, 0.018, 8, 28]} />
        </mesh>
        <mesh rotation-y={0.8} rotation-x={-0.4} raycast={noopRaycast}>
          <torusGeometry args={[0.52, 0.014, 8, 28]} />
          <meshLambertMaterial color="#5E9E7E" />
        </mesh>
      </group>
    </Pedestal>
  )
}

/** Sala III (BAPE & Base): Monolito Facetado de Granito y Jade */
function GraniteMonolith({ z, reduced }) {
  const ref = useRef()
  useFrame((state, dt) => {
    if (reduced || !ref.current) return
    if (Math.abs(state.camera.position.z - z) > 24) return
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
      <mesh ref={ref} geometry={geometry} position={[0, 0.62, 0]} raycast={noopRaycast}>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
    </Pedestal>
  )
}

/** Sala IV (Yeezy): Monolito Brutalista del Pentélico */
function BrutalistSphere({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, z, reduced, 0.22)
  return (
    <Pedestal z={z}>
      <mesh ref={ref} position={[0, 0.62, 0]} raycast={noopRaycast}>
        <torusKnotGeometry args={[0.28, 0.095, 48, 12, 2, 3]} />
        <meshLambertMaterial color="#7C8580" />
      </mesh>
    </Pedestal>
  )
}

/** Sala V (Sneakers): Reliquia Alada de Hermes en Bronce */
function WingedPedestalRelic({ z, reduced }) {
  const ref = useRef()
  useSpin(ref, z, reduced, 0.32)
  return (
    <Pedestal z={z}>
      <group ref={ref} position={[0, 0.55, 0]}>
        <mesh position={[0, -0.1, 0]} raycast={noopRaycast}>
          <boxGeometry args={[0.64, 0.14, 0.28]} />
          <meshLambertMaterial color="#EAE6DD" />
        </mesh>
        <mesh position={[-0.06, 0.08, 0]} material={sharedBronzeMat} raycast={noopRaycast}>
          <boxGeometry args={[0.46, 0.28, 0.24]} />
        </mesh>
        <mesh position={[-0.18, 0.24, 0.15]} rotation-z={0.35} raycast={noopRaycast}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshLambertMaterial color="#5E9E7E" />
        </mesh>
        <mesh position={[-0.18, 0.24, -0.15]} rotation-z={0.35} raycast={noopRaycast}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshLambertMaterial color="#5E9E7E" />
        </mesh>
      </group>
    </Pedestal>
  )
}
