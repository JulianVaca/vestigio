import * as THREE from 'three'

/**
 * Texturas procedurales generadas en Canvas 2D (cero peticiones de red adicionales):
 * - Rótulos de sala con acentos en verde laurel (#5E9E7E) y bronce de Delfos (#C8B07A)
 * - Cartelas museográficas en mármol del Pentélico y granito
 * - Piso de losas de granito griego pulido con vetas minerales
 * - Muros de sillería de granito helénico
 */
const DISPLAY = '"Fraunces Variable", Georgia, serif'
const SANS = '"Inter Variable", system-ui, sans-serif'

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function toTexture(c, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Rótulo de sala pintado sobre el pórtico divisor. */
export function roomTitleTexture(number, title, subtitle) {
  const [c, g] = canvas(1024, 512)
  g.fillStyle = '#C8B07A'
  g.font = `600 40px ${SANS}`
  g.fillText(number, 40, 88)
  g.fillStyle = '#5E9E7E'
  g.fillRect(40, 112, 96, 5)
  g.fillStyle = '#F2EFE9'
  g.font = `italic 600 96px ${DISPLAY}`
  g.fillText(title, 36, 250)
  g.fillStyle = '#A3ADA6'
  g.font = `400 38px ${SANS}`
  wrap(g, subtitle, 40, 336, 920, 50)
  return toTexture(c)
}

/** Cartela museográfica bajo cada obra en mármol Pentélico y verde laurel. */
export function plaqueTexture(product, price) {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#F2EFE9'
  g.fillRect(0, 0, 512, 256)
  g.strokeStyle = '#5E9E7E'
  g.lineWidth = 6
  g.strokeRect(3, 3, 506, 250)

  g.fillStyle = '#121514'
  g.font = `600 34px ${DISPLAY}`
  g.fillText(product.name.slice(0, 26), 26, 62)

  g.fillStyle = '#3B5246'
  g.font = `600 21px ${SANS}`
  g.fillText(`${product.brand || product.category} · ${product.color}`, 26, 104)

  g.fillStyle = '#121514'
  g.font = `700 28px ${SANS}`
  g.fillText(price, 26, 160)

  g.fillStyle = '#2F6B4F'
  g.font = `700 20px ${SANS}`
  g.fillText('INSPECCIONAR PIEZA & MARQUILLA  →', 26, 218)
  return toTexture(c)
}

/** Texto mural (pórtico de entrada y muro final). */
export function wallTextTexture({ eyebrow, title, subtitle, w = 2048, h = 1024, titleSize = 240 }) {
  const [c, g] = canvas(w, h)
  g.textAlign = 'center'
  g.fillStyle = '#C8B07A'
  g.font = `600 50px ${SANS}`
  if (eyebrow) g.fillText(eyebrow.toUpperCase().split('').join(' '), w / 2, h * 0.27)
  g.fillStyle = '#F2EFE9'
  g.font = `600 ${titleSize}px ${DISPLAY}`
  g.fillText(title, w / 2, h * 0.56)
  g.fillStyle = '#5E9E7E'
  g.fillRect(w / 2 - 80, h * 0.65, 160, 7)
  if (subtitle) {
    g.fillStyle = '#D5DFD8'
    g.font = `italic 400 66px ${DISPLAY}`
    g.fillText(subtitle, w / 2, h * 0.8)
  }
  return toTexture(c)
}

/** Losas de granito griego pulido con moteado mineral y juntas de bronce/mármol. */
export function floorTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#1C2220'
  g.fillRect(0, 0, 512, 512)

  // Moteado mineral característico del granito griego
  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const r = Math.random()
    const n = r > 0.92 ? 26 : r < 0.08 ? -18 : (r - 0.5) * 14
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n))
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 1.08))
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 1.02))
  }
  g.putImageData(img, 0, 0)

  // Vetas suaves de cuarzo y musgo mineral
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const rad = 50 + Math.random() * 130
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    grd.addColorStop(0, i % 2 === 0 ? 'rgba(242,239,233,0.045)' : 'rgba(94,158,126,0.04)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 512)
  }

  // Juntas de sillería de granito
  g.strokeStyle = 'rgba(10, 13, 12, 0.7)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
  g.strokeStyle = 'rgba(200, 176, 122, 0.14)'
  g.lineWidth = 1
  g.strokeRect(8, 8, 496, 496)

  const t = toTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Textura de sillería de granito claro/gris para muros del templo. */
export function wallGraniteTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#252D29'
  g.fillRect(0, 0, 512, 512)

  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    img.data[i] += n
    img.data[i + 1] += n * 1.05
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)

  // Bloques horizontales de sillería helénica (isódomo)
  g.strokeStyle = 'rgba(14, 17, 16, 0.55)'
  g.lineWidth = 2
  for (let y = 0; y < 512; y += 128) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(512, y)
    g.stroke()
    const offset = (y / 128) % 2 === 0 ? 0 : 128
    for (let x = offset; x < 512; x += 256) {
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x, y + 128)
      g.stroke()
    }
  }

  const t = toTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Halo radial para piscinas de luz y sombras de contacto. */
export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const [c, g] = canvas(256, 256)
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, inner)
  grd.addColorStop(1, outer)
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  return toTexture(c, false)
}

function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' ')
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y)
      line = w
      y += lh
    } else line = test
  }
  g.fillText(line, x, y)
}
