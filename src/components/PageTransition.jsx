/**
 * Transición entre páginas ultraligera en CSS (sin bloquear la navegación con mode="wait"
 * ni telones a pantalla completa que añadían ~1 s de latencia en cada clic).
 */
export default function PageTransition({ children }) {
  return <div className="page-enter">{children}</div>
}
