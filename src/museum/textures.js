import * as THREE from 'three'

/**
 * Texturas procedurales generadas en Canvas 2D (cero peticiones de red adicionales):
 * - Rótulos de sala con acentos en hoja de olivo (#2D5A40) y bronce helénico (#9A7438)
 * - Etiquetas de rack en mármol travertino (#F3EFE6)
 * - Piso de losas de granito griego claro y mármol travertino pulido
 * - Muros de sillería de piedra caliza y travertino del Egeo
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
  g.fillStyle = '#9A7438'
  g.font = `700 40px ${SANS}`
  g.fillText(number, 40, 88)
  g.fillStyle = '#2D5A40'
  g.fillRect(40, 112, 96, 6)
  g.fillStyle = '#181B19'
  g.font = `italic 600 92px ${DISPLAY}`
  g.fillText(title, 36, 246)
  g.fillStyle = '#4A524D'
  g.font = `500 38px ${SANS}`
  wrap(g, subtitle, 40, 332, 920, 50)
  return toTexture(c)
}

/** Etiqueta de perchero junto a cada rack en mármol travertino y verde olivo. */
export function plaqueTexture(product, price) {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#F7F4EC'
  g.fillRect(0, 0, 512, 256)
  g.strokeStyle = '#9A7438'
  g.lineWidth = 6
  g.strokeRect(3, 3, 506, 250)

  g.fillStyle = '#181B19'
  g.font = `600 32px ${DISPLAY}`
  g.fillText(product.name.slice(0, 26), 26, 60)

  g.fillStyle = '#4A524D'
  g.font = `600 20px ${SANS}`
  g.fillText(`${product.brand} · ${product.color}`, 26, 102)

  g.fillStyle = '#181B19'
  g.font = `700 28px ${SANS}`
  g.fillText(price, 26, 158)

  g.fillStyle = '#2D5A40'
  g.font = `700 20px ${SANS}`
  g.fillText('VER RACK & ELEGIR TALLA  →', 26, 218)
  return toTexture(c)
}

/** Texto mural (pórtico de entrada y muro final). */
export function wallTextTexture({ eyebrow, title, subtitle, w = 2048, h = 1024, titleSize = 230 }) {
  const [c, g] = canvas(w, h)
  g.textAlign = 'center'
  g.fillStyle = '#9A7438'
  g.font = `700 50px ${SANS}`
  if (eyebrow) g.fillText(eyebrow.toUpperCase().split('').join(' '), w / 2, h * 0.27)
  g.fillStyle = '#181B19'
  g.font = `600 ${titleSize}px ${DISPLAY}`
  g.fillText(title, w / 2, h * 0.56)
  g.fillStyle = '#2D5A40'
  g.fillRect(w / 2 - 80, h * 0.65, 160, 7)
  if (subtitle) {
    g.fillStyle = '#434A45'
    g.font = `italic 500 64px ${DISPLAY}`
    g.fillText(subtitle, w / 2, h * 0.8)
  }
  return toTexture(c)
}

/** Losas de granito griego claro y mármol travertino con moteado mineral. */
export function floorTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#DDD6C7'
  g.fillRect(0, 0, 512, 512)

  // Moteado mineral característico del granito griego claro
  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const r = Math.random()
    const n = r > 0.92 ? 14 : r < 0.08 ? -16 : (r - 0.5) * 10
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n))
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n))
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.95))
  }
  g.putImageData(img, 0, 0)

  // Vetas suaves de cuarzo y travertino
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const rad = 50 + Math.random() * 130
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    grd.addColorStop(0, i % 2 === 0 ? 'rgba(255,252,245,0.22)' : 'rgba(154,116,56,0.06)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 512)
  }

  // Juntas arquitectónicas de sillería
  g.strokeStyle = 'rgba(120, 112, 98, 0.35)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
  g.strokeStyle = 'rgba(154, 116, 56, 0.18)'
  g.lineWidth = 1
  g.strokeRect(8, 8, 496, 496)

  const t = toTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Textura de sillería de travertino y granito claro para los muros de la tienda-museo. */
export function wallGraniteTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#EAE4D7'
  g.fillRect(0, 0, 512, 512)

  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n * 0.94
  }
  g.putImageData(img, 0, 0)

  // Bloques horizontales de sillería helénica (isódomo)
  g.strokeStyle = 'rgba(140, 132, 116, 0.28)'
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

/** Gradiente radial suave (para sombras y halos de luz). */
export function radialTexture(inner, outer) {
  const [c, g] = canvas(256, 256)
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, inner)
  grd.addColorStop(1, outer)
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  return toTexture(c)
}

function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' ')
  let line = ''
  for (const w of words) {
    const test = line + w + ' '
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line.trim(), x, y)
      line = w + ' '
      y += lh
    } else line = test
  }
  if (line) g.fillText(line.trim(), x, y)
}
