/**
 * Micro-interacción "volar al carrito".
 * Clona la imagen del producto y la lleva hasta el ícono del carrito siguiendo
 * un ARCO (principio de animación): el eje X avanza con ease-out y el eje Y
 * con ease-in, por lo que la trayectoria resultante es curva y natural.
 * Usa Web Animations API (sin dependencias) y sólo anima transform/opacity.
 */
export function flyToCart(sourceEl, reduced) {
  const target = document.getElementById('cart-icon')
  if (!sourceEl || !target || reduced) return Promise.resolve()

  const s = sourceEl.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const size = Math.min(s.width, 160)

  const outer = document.createElement('div')
  const inner = document.createElement('img')
  inner.src = sourceEl.currentSrc || sourceEl.src
  inner.alt = ''
  Object.assign(outer.style, {
    position: 'fixed',
    left: `${s.left + s.width / 2 - size / 2}px`,
    top: `${s.top + s.height / 2 - size * 0.66}px`,
    width: `${size}px`,
    zIndex: 9999,
    pointerEvents: 'none',
  })
  Object.assign(inner.style, { width: '100%', display: 'block', borderRadius: '4px', boxShadow: '0 20px 40px rgba(0,0,0,.5)' })
  outer.appendChild(inner)
  document.body.appendChild(outer)

  const dx = t.left + t.width / 2 - (s.left + s.width / 2)
  const dy = t.top + t.height / 2 - (s.top + s.height / 2)
  const duration = 850

  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: 'cubic-bezier(0.3, 0, 0.2, 1)',
    fill: 'forwards',
  })
  const anim = inner.animate(
    [
      // anticipación: se eleva y crece un poco antes de salir disparada
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(-40px) scale(1.05)', opacity: 1, offset: 0.18 },
      { transform: `translateY(${dy}px) scale(0.12)`, opacity: 0.6 },
    ],
    { duration, easing: 'cubic-bezier(0.55, 0, 0.9, 0.4)', fill: 'forwards' },
  )
  return anim.finished.then(() => {
    outer.remove()
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    )
  })
}
