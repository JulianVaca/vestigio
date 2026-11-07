import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main id="main" className="page container notfound">
      <p className="eyebrow">Error 404</p>
      <h1 className="h1 h1--xl">
        Esta sala está <em>en restauración</em>.
      </h1>
      <p className="page__lead">La página que buscas no existe o fue movida a otra ala del museo.</p>
      <Link to="/" className="btn btn--primary">Volver al inicio</Link>
    </main>
  )
}
