import * as THREE from 'three'

/**
 * Texturas generadas por código (canvas 2D): cero descargas extra.
 * Textos de sala, cartelas, piso de concreto pulido y halos de luz.
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

/** Rótulo de sala pintado sobre el muro. */
export function roomTitleTexture(number, title, subtitle) {
  const [c, g] = canvas(1024, 512)
  g.fillStyle = '#EFE9DF'
  g.font = `500 44px ${SANS}`
  g.fillText(number, 40, 90)
  g.fillStyle = '#D9643A'
  g.fillRect(40, 116, 80, 4)
  g.fillStyle = '#EFE9DF'
  g.font = `italic 600 120px ${DISPLAY}`
  g.fillText(title, 34, 270)
  g.fillStyle = '#A39C91'
  g.font = `400 40px ${SANS}`
  wrap(g, subtitle, 40, 350, 900, 54)
  return toTexture(c)
}

/** Cartela museográfica bajo cada prenda. */
export function plaqueTexture(product, price) {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#EFE9DF'
  g.fillRect(0, 0, 512, 256)
  g.fillStyle = '#0E0D0C'
  g.font = `600 46px ${DISPLAY}`
  g.fillText(product.name, 28, 70)
  g.fillStyle = '#5b554d'
  g.font = `400 24px ${SANS}`
  g.fillText(`${product.category} · ${product.color}`, 28, 112)
  g.fillStyle = '#0E0D0C'
  g.font = `600 30px ${SANS}`
  g.fillText(price, 28, 168)
  g.fillStyle = '#B4502C'
  g.font = `600 22px ${SANS}`
  g.fillText('TOCA LA OBRA PARA VERLA  →', 28, 222)
  return toTexture(c)
}

/** Texto libre (muro de entrada y muro final). */
export function wallTextTexture({ eyebrow, title, subtitle, w = 2048, h = 1024, titleSize = 260 }) {
  const [c, g] = canvas(w, h)
  g.textAlign = 'center'
  g.fillStyle = '#A39C91'
  g.font = `500 54px ${SANS}`
  if (eyebrow) g.fillText(eyebrow.toUpperCase().split('').join(' '), w / 2, h * 0.28)
  g.fillStyle = '#EFE9DF'
  g.font = `600 ${titleSize}px ${DISPLAY}`
  g.fillText(title, w / 2, h * 0.58)
  g.fillStyle = '#D9643A'
  g.fillRect(w / 2 - 70, h * 0.66, 140, 6)
  if (subtitle) {
    g.fillStyle = '#EFE9DF'
    g.font = `italic 400 70px ${DISPLAY}`
    g.fillText(subtitle, w / 2, h * 0.8)
  }
  return toTexture(c)
}

/** Concreto pulido con juntas cada 2 m. */
export function floorTexture() {
  const [c, g] = canvas(512, 512)
  g.fillStyle = '#1d1a17'
  g.fillRect(0, 0, 512, 512)
  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)
  // manchas suaves
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 40 + Math.random() * 120
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, 'rgba(255,240,220,0.035)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 512, 512)
  }
  g.strokeStyle = 'rgba(0,0,0,0.55)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
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
