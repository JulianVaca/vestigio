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

// Geometrías y materiales compartidos a nivel de módulo para los Racks 3D de tienda y arquitectura
const sharedPoolGeo = new THREE.PlaneGeometry(3.6, 3.6)
const sharedRackPlinthGeo = new THREE.BoxGeometry(1.94, 0.16, 0.68)
const sharedRackPostGeo = new THREE.CylinderGeometry(0.026, 0.026, 3.12, 10)
const sharedRackBarGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.84, 10)
const sharedRackBracketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8)
const sharedFrameGeo = new THREE.BoxGeometry(1.52, 2.02, 0.04)
const sharedArtGeo = new THREE.PlaneGeometry(1.44, 1.92)
const sharedPlaqueGeo = new THREE.PlaneGeometry(0.68, 0.34)
const sharedPlaquePostGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.15, 6)
const sharedLampGeo = new THREE.CircleGeometry(0.12, 12)
const sharedConeGeo = new THREE.ConeGeometry(1.18, 3.2, 16, 1, true)
const sharedShadowGeo = new THREE.PlaneGeometry(2.2, 2.2)
const sharedPedestalGeo = new THREE.BoxGeometry(0.88, 1.02, 0.88)

// Materiales Blinn-Phong / Lambert ultraligeros: aspecto idéntico de bronce y piedra helénica
// sin el coste por píxel de PBR + PMREM (4× más rápido en fragment shader en monitores grandes).
const sharedBronzeMat = new THREE.MeshPhongMaterial({ color: '#B8964F', specular: '#FFF2CC', shininess: 48 })
const sharedDarkBronzeMat = new THREE.MeshPhongMaterial({ color: '#4A3B24', specular: '#9A7D4A', shininess: 32 })
const sharedTravertineMat = new THREE.MeshLambertMaterial({ color: '#E6DFD1' })
const sharedCompanionMat = new THREE.MeshLambertMaterial({ color: '#D6CFC0' })
const sharedFrameMat = new THREE.MeshLambertMaterial({ color: '#F2EEE4' })
const sharedLampMat = new THREE.MeshBasicMaterial({ color: '#FFFDF7', side: THREE.DoubleSide })
const sharedPedestalMat = new THREE.MeshLambertMaterial({ color: '#E2DBD0' })

const poolTex = radialTexture('rgba(255, 248, 230, 0.55)', 'rgba(255, 248, 230, 0)')
const sharedPoolMat = new THREE.MeshBasicMaterial({
  map: poolTex,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
})

// Percha fusionada: gancho + vástago + hombros = 1 geometría compartida
const hangerGeo = (() => {
  const hook = new THREE.TorusGeometry(0.055, 0.01, 6, 12, Math.PI * 1.35).translate(0, 1.15, 0)
  const stem = new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6).translate(0, 1.05, 0)
  const bar = new THREE.CylinderGeometry(0.016, 0.016, 0.92, 8).rotateZ(Math.PI / 2).translate(0, 0.98, 0)
  const parts = [hook, stem, bar].map((g) => (g.index ? g.toNonIndexed() : g))
  return mergeGeometries(parts)
})()
const shadowTex = radialTexture('rgba(35, 32, 26, 0.32)', 'rgba(35, 32, 26, 0)')
const sharedShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })

// FrontSide + Instancing: mitad de sobre-dibujo aditivo por cono y un solo draw call.
const coneMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.FrontSide,
  uniforms: { uColor: { value: new THREE.Color('#fff6e0') }, uOpacity: { value: 0.075 } },
  vertexShader: /* glsl */ `
    varying float vH;
    varying vec3 vN;
    varying vec3 vView;
    void main() {
      vH = uv.y;
      vec4 local = vec4(position, 1.0);
      vec3 n = normal;
      #ifdef USE_INSTANCING
        local = instanceMatrix * local;
        n = mat3(instanceMatrix) * n;
      #endif
      vec4 mv = modelViewMatrix * local;
      vN = normalize(normalMatrix * n);
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
const Scene = memo(function Scene({ reduced, onHover, onSelect, onFloorClick, onNavigate, lowPower, onReady }) {
  const { gl, scene, camera } = useThree()
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  useEffect(() => {
    let alive = true
    // Subir todas las texturas a la GPU y precompilar shaders durante la transición de entrada:
    // cero tirones al caminar por las 5 salas y sin el bloqueo inicial de PMREMGenerator.
    const seen = new Set()
    scene.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      mats.forEach((m) => m.map && seen.add(m.map))
    })
    seen.forEach((t) => gl.initTexture(t))
    const done = () => alive && readyRef.current?.()
    if (gl.compileAsync) gl.compileAsync(scene, camera).then(done, done)
    else {
      gl.compile(scene, camera)
      done()
    }
    return () => {
      alive = false
    }
  }, [gl, scene, camera])

  // Cargamos las variantes -sm.webp (420x560) para las 30 obras en 3D: carga instantánea y 4x menos VRAM en PC
  const textures = useLoader(
    THREE.TextureLoader,
    exhibits.map((e) => e.product.img.replace('.webp', '-sm.webp')),
  )

  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 2
      t.generateMipmaps = true
      t.needsUpdate = true
    })
  }, [textures])

  return (
    <>
      {/* Iluminación cálida mediterránea sin múltiples PointLights ni PMREM costosos */}
      <hemisphereLight args={['#fffdf8', '#c8bfa8', 1.55]} />
      <directionalLight position={[5, 14, 8]} intensity={1.0} color="#fff9eb" />
      <directionalLight position={[-5, 10, -35]} intensity={0.6} color="#e6dfd0" />

      <Architecture onFloorClick={onFloorClick} />
      <InstancedDoricColumns />
      <BotanicalGarden />
      <WallTexts onNavigate={onNavigate} />

      {/* Herrajes estáticos de los 30 racks + pedestales instanciados + etiquetas en atlas */}
      <InstancedRackHardware />
      <InstancedPedestals />
      <PlaqueAtlas />

      {/* 30 prendas interactivas con perchas/marcos instanciados y un único bucle useFrame */}
      <ExhibitGarments textures={textures} onHover={onHover} onSelect={onSelect} />

      <AnforaTextil reduced={reduced} />
      <ColumnFragment z={roomCenter(0)} reduced={reduced} />
      <CosmosAstrolabe z={roomCenter(1)} reduced={reduced} />
      <GraniteMonolith z={roomCenter(2)} reduced={reduced} />
      <BrutalistSphere z={roomCenter(3)} reduced={reduced} />
      <WingedPedestalRelic z={roomCenter(4)} reduced={reduced} />

      {!reduced && <Dust count={lowPower ? 120 : 180} />}
    </>
  )
})

export default Scene

/* ───────────────────── Herrajes de racks instanciados (1 draw call por pieza) ───────────────────── */
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
  // Prendas secundarias colgadas al fondo del rack (volumen de tienda)
  { geo: sharedFrameGeo, mat: sharedCompanionMat, items: [[[-0.12, -0.02, 0.16], [0, 0, 0]]] },
  { geo: sharedFrameGeo, mat: sharedTravertineMat, items: [[[0.12, -0.01, 0.24], [0, 0, 0]]] },
  // Atril de la etiqueta
  { geo: sharedPlaquePostGeo, mat: sharedDarkBronzeMat, items: [[[1.28, -1.42, 0.36], [0, 0, 0]]] },
  // Cono de luz y lámpara cenital
  { geo: sharedConeGeo, mat: coneMaterial, items: [[[0, 1.4, 0.95], [0.32, 0, 0]]] },
  { geo: sharedLampGeo, mat: sharedLampMat, items: [[[0, HALL.height - 2.0 - 0.01, 1.45], [Math.PI / 2, 0, 0]]] },
  // Halo cálido sobre el muro de travertino
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

/* ───────────────── Pedestales y conos de las 6 esculturas instanciados (3 draw calls) ───────────────── */
function InstancedPedestals() {
  const shadowRef = useRef()
  const pedRef = useRef()
  const coneRef = useRef()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const roomZs = [0, 1, 2, 3, 4].map((i) => roomCenter(i))

    // 5 pedestales de sala
    roomZs.forEach((z, i) => {
      dummy.position.set(0, 0.51, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      pedRef.current.setMatrixAt(i, dummy.matrix)
    })
    pedRef.current.instanceMatrix.needsUpdate = true

    // 6 sombras (vestíbulo + 5 salas) y 6 conos de luz
    const allSculptures = [
      { x: ENTRANCE_SCULPTURE.x, z: ENTRANCE_SCULPTURE.z, shadowScale: 1.36, coneY: 3.2 },
      ...roomZs.map((z) => ({ x: 0, z, shadowScale: 1.0, coneY: 3.25 })),
    ]
    allSculptures.forEach((s, i) => {
      dummy.position.set(s.x, 0.003, s.z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.setScalar(s.shadowScale)
      dummy.updateMatrix()
      shadowRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(s.x, s.coneY, s.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      coneRef.current.setMatrixAt(i, dummy.matrix)
    })
    shadowRef.current.instanceMatrix.needsUpdate = true
    coneRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      <instancedMesh ref={pedRef} args={[sharedPedestalGeo, sharedPedestalMat, 5]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={shadowRef} args={[sharedShadowGeo, sharedShadowMat, 6]} frustumCulled={false} raycast={noopRaycast} />
      <instancedMesh ref={coneRef} args={[sharedConeGeo, coneMaterial, 6]} frustumCulled={false} raycast={noopRaycast} />
    </group>
  )
}

/* ───────────────────────────── Arquitectura en Travertino y Granito Griego ───────────────────────────── */
// Geometrías arquitectónicas estáticas fusionadas a nivel de módulo (24 mallas → 3 draw calls)
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

  // Zócalos longitudinales de bronce
  ;[-1, 1].forEach((s) => {
    bronzeParts.push(new THREE.BoxGeometry(0.06, 0.16, LENGTH).translate(s * (HALL.halfW - 0.03), 0.08, MID_Z))
  })

  // Tragaluces cenitales
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
      {/* Piso de granito claro y travertino pulido con throttling y bloqueo durante arrastre */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, MID_Z]}
        material={floorMat}
        onPointerMove={(e) => {
          if (e.buttons > 0) return
          const now = performance.now()
          if (now - lastMoveTime.current < 32 || !marker.current) return
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
        <ringGeometry args={[0.22, 0.28, 24]} />
        <meshBasicMaterial ref={markerMat} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Techo casetonado luminoso y tragaluces fusionados */}
      <mesh rotation-x={Math.PI / 2} position={[0, HALL.height, MID_Z]} material={sharedCeilingMat} raycast={noopRaycast}>
        <planeGeometry args={[HALL.halfW * 2, LENGTH]} />
      </mesh>
      <mesh geometry={mergedSkylightsGeo} material={sharedSkylightMat} frustumCulled={false} raycast={noopRaycast} />

      {/* Muros perimetrales de travertino */}
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

      {/* Pórticos divisorios y molduras de bronce fusionados en 2 draw calls */}
      <mesh geometry={mergedDividersGeo} material={sharedDividerMat} frustumCulled={false} raycast={noopRaycast} />
      <mesh geometry={mergedBronzeTrimGeo} material={sharedBronzeTrimMat} frustumCulled={false} raycast={noopRaycast} />

      {/* Rótulos de las 5 salas */}
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
const sharedShaftGeo = new THREE.CylinderGeometry(0.22, 0.27, 4.1, 14)
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

/* ───────────────────── Jardineras Botánicas Instanciadas (120 mallas → 4 Draw Calls) ───────────────────── */
const planterGeo = new THREE.CylinderGeometry(0.42, 0.34, 0.56, 10)
const planterMat = new THREE.MeshLambertMaterial({ color: '#2F3834' })
const trunkGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.9, 6)
const trunkMat = new THREE.MeshLambertMaterial({ color: '#4A3F35' })
const foliageGeo1 = new THREE.DodecahedronGeometry(0.46, 1)
const foliageGeo2 = new THREE.DodecahedronGeometry(0.34, 1)
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

/* ───────────── Prendas y Perchas Interactivas (60 mallas de soporte → 2 InstancedMeshes + 1 useFrame) ───────────── */
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
  const animState = useRef(() =>
    exhibits.map(() => ({ hovered: false, s: 1, z: 0.36, rotY: 0 })),
  )
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

  // Un único bucle useFrame que sólo procesa las prendas en transición activa (cero coste en reposo)
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

/* ───────────── Etiquetas de los 30 racks: un atlas de textura + una sola malla fusionada ───────────── */
const PLAQUE_COLS = 4
const PLAQUE_ROWS = 8 // 4 × 8 celdas de 512×256 → atlas 2048×2048 (30 usadas)
function PlaqueAtlas() {
  const { geometry, material } = useMemo(() => {
    const atlas = document.createElement('canvas')
    atlas.width = 512 * PLAQUE_COLS
    atlas.height = 256 * PLAQUE_ROWS
    const ctx = atlas.getContext('2d')
    const parent = new THREE.Object3D()
    const child = new THREE.Object3D()
    const parts = exhibits.map((e, i) => {
      const col = i % PLAQUE_COLS
      const row = Math.floor(i / PLAQUE_COLS)
      const single = plaqueTexture(e.product, formatPrice(e.product.price))
      ctx.drawImage(single.image, col * 512, row * 256)
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
    tex.anisotropy = 2
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

/* ───────────────────────────── Esculturas Centrales (con culling por distancia) ───────────────────────────── */
function Pedestal({ z, x = 0, children }) {
  return <group position={[x, 1.02, z]}>{children}</group>
}

function useSpin(ref, z, reduced, speed = 0.25) {
  useFrame((state, dt) => {
    if (reduced || !ref.current) return
    if (Math.abs(state.camera.position.z - z) > 28) return
    ref.current.rotation.y += dt * speed
  })
}

/**
 * PIEZA ORIGINAL 3D — "Ánfora Textil Helénica" (Vestíbulo).
 * Peplos griego / vestido por revolución cuyos pliegues respiran en un vertex shader GLSL.
 */
function AnforaTextil({ reduced }) {
  const group = useRef()
  const rings = useRef()
  const shaderRef = useRef()
  const geometry = useMemo(() => {
    const profile = [
      [0.0, 1.62], [0.12, 1.62], [0.17, 1.56], [0.3, 1.48], [0.33, 1.4], [0.31, 1.24],
      [0.25, 1.06], [0.22, 0.98], [0.27, 0.86], [0.36, 0.7], [0.44, 0.48], [0.54, 0.24], [0.66, 0.02], [0.64, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    const g = new THREE.LatheGeometry(profile, 48)
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => {
    const m = new THREE.MeshPhongMaterial({
      color: '#4E8C6F',
      specular: '#A8D8BE',
      shininess: 28,
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
    if (Math.abs(state.camera.position.z - ENTRANCE_SCULPTURE.z) > 26) return
    const t = state.clock.elapsedTime
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = reduced ? 1.2 : t
    if (!reduced) {
      if (group.current) group.current.rotation.y += dt * 0.18
      if (rings.current) {
        rings.current.children.forEach((r, i) => {
          r.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + i) * 0.35
          r.rotation.z = t * (0.2 + i * 0.08)
        })
      }
    }
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
      <mesh position={[0, 0.22, 0]} raycast={noopRaycast}>
        <cylinderGeometry args={[0.85, 0.9, 0.44, 24]} />
        <meshLambertMaterial color="#D8D4CA" />
      </mesh>
      <group ref={group} position={[0, 0.44, 0]}>
        <mesh geometry={geometry} material={material} raycast={noopRaycast} />
      </group>
      <group ref={rings} position={[0, 1.3, 0]}>
        {[0.95, 1.1, 1.25].map((r) => (
          <mesh key={r} rotation-x={Math.PI / 2} material={sharedBronzeMat} raycast={noopRaycast}>
            <torusGeometry args={[r, 0.007, 6, 40]} />
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
    const g = new THREE.CylinderGeometry(0.3, 0.33, 1.25, 36, 8)
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
          <meshPhongMaterial color="#EAE6DD" specular="#FFFFFF" shininess={30} flatShading />
        </mesh>
        <mesh rotation-x={0.6} material={sharedBronzeMat} raycast={noopRaycast}>
          <torusGeometry args={[0.42, 0.018, 10, 36]} />
        </mesh>
        <mesh rotation-y={0.8} rotation-x={-0.4} raycast={noopRaycast}>
          <torusGeometry args={[0.52, 0.014, 10, 36]} />
          <meshPhongMaterial color="#5E9E7E" specular="#B0E2C8" shininess={36} />
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
    if (Math.abs(state.camera.position.z - z) > 28) return
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
        <meshPhongMaterial vertexColors flatShading shininess={25} />
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
        <torusKnotGeometry args={[0.28, 0.095, 64, 14, 2, 3]} />
        <meshPhongMaterial color="#7C8580" specular="#B8C0BC" shininess={28} />
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
    <points raycast={noopRaycast} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <primitive ref={matRef} object={shaderMaterial} attach="material" />
    </points>
  )
}
