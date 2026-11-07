import { Link } from 'react-router-dom'
import { ArrowIcon } from '../components/Icons.jsx'

/**
 * Tarjeta de entrada del museo (compartida por la portada ligera y la experiencia 3D,
 * para que el paso de una a otra no produzca saltos visuales ni de layout).
 * status: 'idle' (sin 3D cargado) | 'loading' (descargando/montando) | 'ready'
 */
export default function IntroCard({ status, progress = 0, onEnter, onIntent }) {
  const loading = status === 'loading'
  return (
    <div className="museum__intro-card">
      <p className="eyebrow">Tienda-Museo 3D · Racks de Bronce & Travertino</p>
      <h1 className="h1">
        Atelier & <em>Racks</em>
      </h1>
      <p className="museum__intro-text">
        Recorre cinco salas en piedra travertino y granito griego con olivos mediterráneos y 30 prendas originales colgadas
        en racks arquitectónicos de bronce.
      </p>
      <ul className="museum__keys" aria-label="Controles">
        <li>
          <kbd>Arrastrar</kbd> mirar alrededor
        </li>
        <li>
          <kbd>Clic / toque</kbd> en el piso para caminar hacia un rack
        </li>
        <li>
          <kbd>W A S D</kbd> o flechas para moverte con fluidez
        </li>
        <li>
          <kbd>N</kbd> / <kbd>P</kbd> siguiente / anterior prenda en el rack
        </li>
      </ul>
      <div className="museum__loader" aria-live="polite">
        <div className="museum__loader-track">
          {loading && progress <= 0.02 ? (
            <div className="museum__loader-fill museum__loader-fill--indeterminate" />
          ) : (
            <div
              className="museum__loader-fill"
              style={{ transform: `scaleX(${status === 'idle' ? 0 : Math.max(0.08, progress)})`, transition: 'transform 0.4s' }}
            />
          )}
        </div>
        <span>
          {status === 'idle'
            ? 'El museo 3D se carga al entrar (~1 MB)'
            : progress > 0.02
              ? `Preparando racks y prendas… ${Math.round(progress * 100)}%`
              : 'Cargando el motor 3D…'}
        </span>
      </div>
      <div className="museum__intro-actions">
        <button
          className="btn btn--primary"
          onClick={onEnter}
          onPointerEnter={onIntent}
          onFocus={onIntent}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Abriendo la tienda 3D…' : 'Entrar a la tienda 3D'} <ArrowIcon width={18} height={18} />
        </button>
        <Link to="/catalogo" className="btn btn--ghost">
          Ver racks en catálogo (30)
        </Link>
      </div>
    </div>
  )
}
