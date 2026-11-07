/**
 * Micro-interacciones dinámicas del carrito VESTIGIO:
 * 1. `flyToCart`: Al añadir una prenda, la pieza gira en 3D, se sella en una cápsula
 *    de archivo de granito y laurel, deja una estela botánica/dorada y aterriza en el
 *    carrito haciendo que este levante las ruedas ("wheelie") con partículas.
 * 2. `runCartAcrossScreen`: Al hacer clic en el carrito, un carrito de compras animado
 *    con ruedas giratorias, líneas de velocidad y estela de hojas de laurel pasa
 *    corriendo a toda velocidad por delante de la pantalla.
 */

export function flyToCart(sourceEl, reduced) {
  const target = document.getElementById('cart-icon')
  if (!sourceEl || !target || reduced) return Promise.resolve()

  const s = sourceEl.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const size = Math.min(Math.max(s.width * 0.55, 110), 170)

  const startX = s.left + s.width / 2
  const startY = s.top + s.height / 2
  const endX = t.left + t.width / 2
  const endY = t.top + t.height / 2

  const outer = document.createElement('div')
  const card = document.createElement('div')
  const img = document.createElement('img')
  const seal = document.createElement('div')

  img.src = sourceEl.currentSrc || sourceEl.src
  img.alt = ''

  Object.assign(outer.style, {
    position: 'fixed',
    left: `${startX - size / 2}px`,
    top: `${startY - size * 0.65}px`,
    width: `${size}px`,
    height: `${size * 1.3}px`,
    zIndex: 9999,
    pointerEvents: 'none',
    perspective: '800px',
  })

  Object.assign(card.style, {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '2px solid #C8B07A',
    background: '#1B201E',
    boxShadow: '0 24px 55px rgba(0,0,0,0.68), 0 0 28px rgba(94, 158, 126, 0.45)',
    transformStyle: 'preserve-3d',
  })

  Object.assign(img.style, {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  })

  Object.assign(seal.style, {
    position: 'absolute',
    inset: 'auto 8px 8px 8px',
    padding: '4px 8px',
    background: 'rgba(18, 21, 20, 0.92)',
    border: '1px solid #5E9E7E',
    borderRadius: '999px',
    color: '#C8B07A',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.16em',
    textAlign: 'center',
    textTransform: 'uppercase',
  })
  seal.textContent = 'ARCHIVE · SELLADO'

  card.appendChild(img)
  card.appendChild(seal)
  outer.appendChild(card)
  document.body.appendChild(outer)

  // Estela de partículas botánicas y doradas durante el vuelo
  spawnTrailParticles(startX, startY, endX, endY)

  const dx = endX - startX
  const dy = endY - startY
  const duration = 920

  outer.animate(
    [
      { transform: 'translateX(0px)' },
      { transform: `translateX(${dx * 0.35}px)`, offset: 0.35 },
      { transform: `translateX(${dx}px)` },
    ],
    {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  )

  const anim = card.animate(
    [
      { transform: 'translateY(0px) scale(0.92) rotateY(0deg) rotateZ(0deg)', opacity: 1 },
      { transform: 'translateY(-68px) scale(1.12) rotateY(180deg) rotateZ(-8deg)', opacity: 1, offset: 0.28 },
      { transform: `translateY(${dy * 0.45 - 50}px) scale(0.65) rotateY(320deg) rotateZ(12deg)`, opacity: 0.95, offset: 0.65 },
      { transform: `translateY(${dy}px) scale(0.14) rotateY(540deg) rotateZ(22deg)`, opacity: 0.2 },
    ],
    {
      duration,
      easing: 'cubic-bezier(0.5, 0, 0.75, 0.35)',
      fill: 'forwards',
    },
  )

  return anim.finished.then(() => {
    outer.remove()
    spawnImpactBurst(endX, endY)
    target.animate(
      [
        { transform: 'translateX(0) rotate(0deg) scale(1)' },
        { transform: 'translateX(-8px) rotate(-22deg) scale(1.32)', offset: 0.3 },
        { transform: 'translateX(10px) rotate(10deg) scale(1.18)', offset: 0.65 },
        { transform: 'translateX(0) rotate(0deg) scale(1)' },
      ],
      { duration: 540, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    )
  })
}

function spawnTrailParticles(sx, sy, ex, ey) {
  const count = 8
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const t = (i + 1) / (count + 1)
      const px = sx + (ex - sx) * t + (Math.random() - 0.5) * 30
      const py = sy + (ey - sy) * (t * t) - Math.sin(t * Math.PI) * 65
      const dot = document.createElement('span')
      const isLeaf = i % 2 === 0
      Object.assign(dot.style, {
        position: 'fixed',
        left: `${px}px`,
        top: `${py}px`,
        width: isLeaf ? '12px' : '7px',
        height: isLeaf ? '6px' : '7px',
        borderRadius: isLeaf ? '12px 0 12px 0' : '50%',
        background: isLeaf ? '#5E9E7E' : '#C8B07A',
        boxShadow: '0 0 10px rgba(94, 158, 126, 0.7)',
        zIndex: 9998,
        pointerEvents: 'none',
      })
      document.body.appendChild(dot)
      dot
        .animate(
          [
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 0.95 },
            {
              transform: `translate(${(Math.random() - 0.5) * 45}px, ${15 + Math.random() * 25}px) scale(0) rotate(140deg)`,
              opacity: 0,
            },
          ],
          { duration: 480, easing: 'ease-out' },
        )
        .finished.then(() => dot.remove())
    }, i * 75)
  }
}

function spawnImpactBurst(x, y) {
  const colors = ['#5E9E7E', '#C8B07A', '#F2EFE9', '#6FB391']
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('span')
    const angle = (i / 10) * Math.PI * 2
    const dist = 24 + Math.random() * 22
    Object.assign(p.style, {
      position: 'fixed',
      left: `${x - 3}px`,
      top: `${y - 3}px`,
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: colors[i % colors.length],
      zIndex: 9999,
      pointerEvents: 'none',
    })
    document.body.appendChild(p)
    p.animate(
      [
        { transform: 'translate(0, 0) scale(1.2)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 },
      ],
      { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    ).finished.then(() => p.remove())
  }
}

let runningCartActive = false

/**
 * Animación dinámica: cuando el usuario hace clic en el carrito,
 * un carrito estilizado pasa corriendo a toda velocidad frente a la pantalla.
 */
export function runCartAcrossScreen(reduced) {
  if (reduced || runningCartActive) return Promise.resolve()
  runningCartActive = true

  const stage = document.createElement('div')
  stage.className = 'cart-runner-stage'
  stage.setAttribute('aria-hidden', 'true')

  stage.innerHTML = `
    <div class="cart-runner__track">
      <div class="cart-runner__wind cart-runner__wind--1"></div>
      <div class="cart-runner__wind cart-runner__wind--2"></div>
      <div class="cart-runner__wind cart-runner__wind--3"></div>
      <div class="cart-runner__vehicle">
        <span class="cart-runner__badge">VESTIGIO EXPRESS · ARCHIVE</span>
        <svg class="cart-runner__svg" viewBox="0 0 180 120" fill="none">
          <!-- Líneas de velocidad traseras -->
          <path d="M4 36H34M12 54H42M2 72H38" stroke="#C8B07A" stroke-width="2.5" stroke-linecap="round" opacity="0.85" />
          <!-- Hojas de laurel en estela -->
          <ellipse cx="24" cy="44" rx="8" ry="3.5" transform="rotate(-22 24 44)" fill="#5E9E7E" />
          <ellipse cx="16" cy="64" rx="9" ry="3.5" transform="rotate(15 16 64)" fill="#5E9E7E" />
          <!-- Estructura del carrito corriendo -->
          <path d="M36 22H56L72 78H144L162 36H62" stroke="#F2EFE9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M66 50H155M70 64H148" stroke="#5E9E7E" stroke-width="2.5" stroke-linecap="round" />
          <!-- Bolsas / Cajas de archivo dentro del carrito -->
          <rect x="82" y="18" width="28" height="28" rx="3" transform="rotate(-6 82 18)" fill="#242B28" stroke="#C8B07A" stroke-width="2" />
          <rect x="114" y="22" width="26" height="24" rx="3" transform="rotate(5 114 22)" fill="#4E8C6F" stroke="#F2EFE9" stroke-width="1.8" />
          <!-- Ruedas con rayos giratorios -->
          <g class="cart-runner__wheel" style="transform-origin: 82px 96px">
            <circle cx="82" cy="96" r="13" fill="#121514" stroke="#C8B07A" stroke-width="4" />
            <path d="M82 83V109M69 96H95" stroke="#5E9E7E" stroke-width="2" />
          </g>
          <g class="cart-runner__wheel" style="transform-origin: 136px 96px">
            <circle cx="136" cy="96" r="13" fill="#121514" stroke="#C8B07A" stroke-width="4" />
            <path d="M136 83V109M123 96H149" stroke="#5E9E7E" stroke-width="2" />
          </g>
        </svg>
      </div>
    </div>
  `

  document.body.appendChild(stage)
  const vehicle = stage.querySelector('.cart-runner__vehicle')

  const anim = vehicle.animate(
    [
      { transform: 'translateX(-28vw) translateY(6px) rotate(-4deg) scale(0.85)', opacity: 0 },
      { transform: 'translateX(8vw) translateY(-10px) rotate(-12deg) scale(1.06)', opacity: 1, offset: 0.22 },
      { transform: 'translateX(52vw) translateY(2px) rotate(-7deg) scale(1.1)', opacity: 1, offset: 0.62 },
      { transform: 'translateX(122vw) translateY(-8px) rotate(-14deg) scale(0.95)', opacity: 0 },
    ],
    {
      duration: 780,
      easing: 'cubic-bezier(0.22, 0.88, 0.38, 1)',
      fill: 'forwards',
    },
  )

  return anim.finished.then(() => {
    stage.remove()
    runningCartActive = false
  })
}
