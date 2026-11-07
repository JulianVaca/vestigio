import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMotionPref } from '../context/MotionContext.jsx'
import IntroCard from '../museum/IntroCard.jsx'

/**
 * Página del museo en dos fases (rendimiento):
 * 1. Portada ligera: foto real del museo + tarjeta de entrada. Sin Three.js → la página
 *    es interactiva al instante (antes: ~3 s de bloqueo construyendo la escena al cargar).
 * 2. Al pulsar «Entrar» se descarga y monta la experiencia 3D, que arranca sola al terminar.
 *    La descarga empieza ya al pasar el cursor/enfocar el botón (intención).
 */
// Los rótulos 3D se pintan en canvas con Fraunces/Inter: hay que tener las fuentes antes de montar
let experiencePromise = null
const loadExperience = () => {
  if (!experiencePromise) {
    const fonts = Promise.all([
      document.fonts.load('600 80px "Fraunces Variable"'),
      document.fonts.load('italic 600 80px "Fraunces Variable"'),
      document.fonts.load('500 40px "Inter Variable"'),
    ]).catch(() => {})
    experiencePromise = Promise.all([import('../museum/MuseumExperience.jsx'), fonts]).then(([m]) => m)
  }
  return experiencePromise
}
const MuseumExperience = lazy(loadExperience)
const base = import.meta.env.BASE_URL

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
  const [webgl] = useState(hasWebGL)
  const sala = params.get('sala')
  const obra = params.get('obra')
  // Si llegan con un enlace directo a una sala u obra, ya expresaron la intención de entrar
  const [entering, setEntering] = useState(Boolean(sala !== null || obra))

  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => {
      document.body.classList.remove('no-scroll')
      document.body.style.cursor = ''
    }
  }, [])

  const prefetch = useCallback(() => {
    loadExperience()
  }, [])

  if (!webgl) {
    return (
      <main id="main" className="page container notfound">
        <p className="eyebrow">Museo 3D</p>
        <h1 className="h1">Tu navegador no puede abrir las salas 3D</h1>
        <p className="page__lead">Necesitamos WebGL para mostrar el museo. Puedes explorar las 30 piezas en el catálogo.</p>
        <Link to="/catalogo" className="btn btn--primary">
          Ir al catálogo
        </Link>
      </main>
    )
  }

  // Primera parada de la sala pedida (cada una de las 5 salas tiene 6 obras; la parada 0 es el pórtico)
  const initialStation = sala !== null ? 1 + Number(sala) * 6 : 0

  const lightIntro = (
    <div className="museum__intro">
      <IntroCard status={entering ? 'loading' : 'idle'} onEnter={() => setEntering(true)} onIntent={prefetch} />
    </div>
  )

  return (
    <main id="main" className="museum-page">
      <div className="museum museum--preview" aria-hidden={entering}>
        <img
          className="museum__preview"
          src={`${base}img/museo-preview.webp`}
          srcSet={`${base}img/museo-preview-sm.webp 960w, ${base}img/museo-preview.webp 1920w`}
          sizes="100vw"
          alt="Vista del pórtico del museo 3D VESTIGIO con la escultura Ánfora Textil y los olivos"
          width="1920"
          height="1080"
          fetchpriority="high"
        />
        {!entering && lightIntro}
      </div>

      {entering && (
        <Suspense fallback={<div className="museum museum--live">{lightIntro}</div>}>
          <MuseumExperience reduced={reduced} initialStation={initialStation} initialProduct={obra} autoStart />
        </Suspense>
      )}
    </main>
  )
}
