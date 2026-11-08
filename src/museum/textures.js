import * as THREE from 'three'

/**
 * Texturas procedurales generadas en Canvas 2D con caché en memoria y resoluciones óptimas para VRAM:
 * - Rótulos de sala (512×256)
 * - Etiquetas de rack (256×128, empaquetadas en un atlas 1024×1024)
 * - Textos murales (1024×512)
 * - Piso y muros en granito/travertino (256×256 repetible)
 */
const DISPLAY = '"Fraunces Variable", Georgia, serif'
const SANS = '"Inter Variable", system-ui, sans-serif'

const textureCache = new Map()

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function toTexture(c, { srgb = true, mipmaps = false, anisotropy = 1 } = {}) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = mipmaps
  t.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.anisotropy = anisotropy
  return t
}

/** Rótulo de sala pintado sobre el pórtico divisor (512×256: 4× menos VRAM). */
export function roomTitleTexture(number, title, subtitle) {
  const key = `room:${number}:${title}`
  if (textureCache.has(key)) return textureCache.get(key)

  const [c, g] = canvas(512, 256)
  g.fillStyle = '#9A7438'
  g.font = `700 20px ${SANS}`
  g.fillText(number, 20, 44)
  g.fillStyle = '#2D5A40'
  g.fillRect(20, 56, 48, 3)
  g.fillStyle = '#181B19'
  g.font = `italic 600 46px ${DISPLAY}`
  g.fillText(title, 18, 123)
  g.fillStyle = '#4A524D'
  g.font = `500 19px ${SANS}`
  wrap(g, subtitle, 20, 166, 460, 25)

  const tex = toTexture(c, { mipmaps: false })
  textureCache.set(key, tex)
  return tex
}

/** Etiqueta de perchero junto a cada rack (256×128: ligera y nítida). */
export function plaqueTexture(product, price) {
  const [c, g] = canvas(256, 128)
  g.fillStyle = '#F7F4EC'
  g.fillRect(0, 0, 256, 128)
  g.strokeStyle = '#9A7438'
  g.lineWidth = 3
  g.strokeRect(1.5, 1.5, 253, 125)

  g.fillStyle = '#181B19'
  g.font = `600 16px ${DISPLAY}`
  g.fillText(product.name.slice(0, 26), 13, 30)

  g.fillStyle = '#4A524D'
  g.font = `600 10px ${SANS}`
  g.fillText(`${product.brand} · ${product.color}`, 13, 51)

  g.fillStyle = '#181B19'
  g.font = `700 14px ${SANS}`
  g.fillText(price, 13, 79)

  g.fillStyle = '#2D5A40'
  g.font = `700 10px ${SANS}`
  g.fillText('VER RACK & ELEGIR TALLA  →', 13, 109)
  return toTexture(c, { mipmaps: false })
}

/** Texto mural (pórtico de entrada y muro final) optimizado a 1024×512. */
export function wallTextTexture({ eyebrow, title, subtitle, w = 1024, h = 512, titleSize = 184 }) {
  const key = `wall:${eyebrow}:${title}`
  if (textureCache.has(key)) return textureCache.get(key)

  const scale = w / 2048
  const [c, g] = canvas(w, h)
  g.textAlign = 'center'
  g.fillStyle = '#9A7438'
  g.font = `700 ${Math.round(50 * scale)}px ${SANS}`
  if (eyebrow) g.fillText(eyebrow.toUpperCase().split('').join(' '), w / 2, h * 0.27)
  g.fillStyle = '#181B19'
  g.font = `600 ${Math.round(titleSize * scale)}px ${DISPLAY}`
  g.fillText(title, w / 2, h * 0.56)
  g.fillStyle = '#2D5A40'
  g.fillRect(w / 2 - 80 * scale, h * 0.65, 160 * scale, Math.max(3, 7 * scale))
  if (subtitle) {
    g.fillStyle = '#434A45'
    g.font = `italic 500 ${Math.round(64 * scale)}px ${DISPLAY}`
    g.fillText(subtitle, w / 2, h * 0.8)
  }

  const tex = toTexture(c, { mipmaps: false })
  textureCache.set(key, tex)
  return tex
}

/** Losas de granito griego claro y mármol travertino con moteado mineral (cacheada). */
export function floorTexture() {
  if (textureCache.has('floor')) return textureCache.get('floor')

  const [c, g] = canvas(256, 256)
  g.fillStyle = '#DDD6C7'
  g.fillRect(0, 0, 256, 256)

  const img = g.getImageData(0, 0, 256, 256)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const r = ((i * 16807) % 2147483647) / 2147483647
    const n = r > 0.92 ? 13 : r < 0.08 ? -15 : (r - 0.5) * 9
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.95))
  }
  g.putImageData(img, 0, 0)

  for (let i = 0; i < 8; i++) {
    const x = ((i * 73) % 240) + 8
    const y = ((i * 137) % 240) + 8
    const rad = 35 + (i % 4) * 20
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    grd.addColorStop(0, i % 2 === 0 ? 'rgba(255,252,245,0.24)' : 'rgba(154,116,56,0.06)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 256, 256)
  }

  g.strokeStyle = 'rgba(120, 112, 98, 0.35)'
  g.lineWidth = 2
  g.strokeRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(154, 116, 56, 0.18)'
  g.lineWidth = 1
  g.strokeRect(4, 4, 248, 248)

  const t = toTexture(c, { mipmaps: true, anisotropy: 2 })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  textureCache.set('floor', t)
  return t
}

/** Textura de sillería de travertino y granito claro para los muros de la tienda-museo (cacheada). */
export function wallGraniteTexture() {
  if (textureCache.has('wallGranite')) return textureCache.get('wallGranite')

  const [c, g] = canvas(256, 256)
  g.fillStyle = '#EAE4D7'
  g.fillRect(0, 0, 256, 256)

  const img = g.getImageData(0, 0, 256, 256)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const r = ((i * 48271) % 2147483647) / 2147483647
    const n = (r - 0.5) * 9
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n * 0.94
  }
  g.putImageData(img, 0, 0)

  g.strokeStyle = 'rgba(140, 132, 116, 0.28)'
  g.lineWidth = 1.5
  for (let y = 0; y < 256; y += 64) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(256, y)
    g.stroke()
    const offset = (y / 64) % 2 === 0 ? 0 : 64
    for (let x = offset; x < 256; x += 128) {
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x, y + 64)
      g.stroke()
    }
  }

  const t = toTexture(c, { mipmaps: true, anisotropy: 2 })
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  textureCache.set('wallGranite', t)
  return t
}

/** Gradiente radial suave (para sombras y halos de luz). */
export function radialTexture(inner, outer) {
  const key = `radial:${inner}:${outer}`
  if (textureCache.has(key)) return textureCache.get(key)

  const [c, g] = canvas(128, 128)
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, inner)
  grd.addColorStop(1, outer)
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = toTexture(c, { mipmaps: false, anisotropy: 1 })
  textureCache.set(key, t)
  return t
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
