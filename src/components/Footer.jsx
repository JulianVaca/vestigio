import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo />
          <p className="footer__claim">
            Streetwear de archivo e historia clásica. Exposición 01 — Ágora & Archivo: 30 piezas curadas en cinco salas.
          </p>
        </div>
        <nav aria-label="Archivo y Tienda">
          <h2 className="footer__title">Archivo & Tienda</h2>
          <ul>
            <li><Link to="/catalogo">Catálogo (30 piezas)</Link></li>
            <li><Link to="/museo">Museo 3D Interactivo</Link></li>
            <li><Link to="/carrito">Carrito de compras</Link></li>
          </ul>
        </nav>
        <nav aria-label="Casa Curatorial">
          <h2 className="footer__title">Casa Curatorial</h2>
          <ul>
            <li><Link to="/nosotros">Nuestra historia</Link></li>
            <li><Link to="/contacto">Showroom & Contacto</Link></li>
            <li><Link to="/marca">Identidad & Paleta</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="footer__title">Autenticidad Garantizada</h2>
          <p className="footer__small">
            Cada prenda de diseñador, Billionaire Boys Club, BAPE, Yeezy y par de colección es verificado individualmente por
            nuestro equipo de curaduría y se entrega con sello numerado de archivo y envío asegurado.
          </p>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} VESTIGIO ARCHIVE · Todos los derechos reservados</span>
        <span>Bogotá · Atenas · Tokyo · Envíos asegurados a todo el país</span>
      </div>
    </footer>
  )
}
