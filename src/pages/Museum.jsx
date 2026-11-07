import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMotionPref } from '../context/MotionContext.jsx'

// Three.js + escena se descargan sólo al entrar a esta página
const MuseumExperience = lazy(() => import('../museum/MuseumExperience.jsx'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Museum() {
  const { reduced } = useMotionPref()
  const [params] = useSearchParams()
  const [fontsReady, setFontsReady] = useState(false)
  const [webgl] = useState(hasWebGL)

  // Los rótulos 3D se pintan en canvas: esperamos a que las fuentes estén listas
  useEffect(() => {
    let alive = true
    Promise.all([
      document.fonts.load('600 80px "Fraunces Variable"'),
      document.fonts.load('italic 600 80px "Fraunces Variable"'),
      document.fonts.load('500 40px "Inter Variable"'),
    ])
      .catch(() => {})
      .finally(() => alive && setFontsReady(true))
    document.body.classList.add('no-scroll')
    return () => {
      alive = false
      document.body.classList.remove('no-scroll')
      document.body.style.cursor = ''
    }
  }, [])

  if (!webgl) {
    return (
      <main id="main" className="page container notfound">
        <p className="eyebrow">Museo 3D</p>
        <h1 className="h1">Tu navegador no puede abrir las salas 3D</h1>
        <p className="page__lead">Necesitamos WebGL para mostrar el museo. Puedes ver toda la colección en el catálogo.</p>
        <Link to="/catalogo" className="btn btn--primary">Ir al catálogo</Link>
      </main>
    )
  }

  const sala = params.get('sala')
  const obra = params.get('obra')
  // primera parada de la sala pedida (cada sala tiene 2 obras; la parada 0 es el vestíbulo)
  const initialStation = sala !== null ? 1 + Number(sala) * 2 : 0

  return (
    <main id="main" className="museum-page">
      <h1 className="sr-only">Museo 3D de la colección Ruinas Suaves</h1>
      <Suspense fallback={<MuseumFallback />}>
        {fontsReady ? (
          <MuseumExperience reduced={reduced} initialStation={initialStation} initialProduct={obra} />
        ) : (
          <MuseumFallback />
        )}
      </Suspense>
    </main>
  )
}

function MuseumFallback() {
  return (
    <div className="museum museum--loading" aria-busy="true">
      <div className="museum__intro">
        <div className="museum__intro-card">
          <p className="eyebrow">Museo VESTIGIO</p>
          <p className="h2">Abriendo las puertas…</p>
          <div className="museum__loader">
            <div className="museum__loader-track">
              <div className="museum__loader-fill museum__loader-fill--indeterminate" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
