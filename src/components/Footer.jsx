import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo />
          <p className="footer__claim">Moda que se exhibe. Colección 01 — Ruinas Suaves.</p>
        </div>
        <nav aria-label="Tienda">
          <h2 className="footer__title">Tienda</h2>
          <ul>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/museo">Museo 3D</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>
        <nav aria-label="Marca">
          <h2 className="footer__title">Marca</h2>
          <ul>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
            <li><Link to="/marca">Guía de marca</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="footer__title">Proyecto académico</h2>
          <p className="footer__small">
            Tienda ficticia creada para la materia de motion design web. Sin pasarela de pagos real. Imágenes y modelos 3D
            originales del equipo; fuentes Fraunces e Inter (SIL Open Font License).
          </p>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} VESTIGIO</span>
        <span>Hecho con React, GSAP, Framer Motion y Three.js</span>
      </div>
    </footer>
  )
}
