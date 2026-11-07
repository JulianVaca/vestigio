// Optimiza las imágenes originales (PNG) a WebP para cumplir el presupuesto de peso.
// Uso: npm run images
// - Toma los PNG de public/img (y subcarpetas)
// - Genera .webp redimensionados en el mismo lugar
// - Mueve los PNG originales a assets-src/ (fuera de la carpeta publicada)
import sharp from 'sharp'
import { readdir, mkdir, rename } from 'node:fs/promises'
import { join, relative, dirname, extname, basename } from 'node:path'

const PUBLIC = 'public/img'
const SRC = 'assets-src/img'

const presets = {
  hero: [
    { suffix: '', width: 1600, quality: 72 },
    { suffix: '-sm', width: 800, quality: 70 },
  ],
  atelier: [{ suffix: '', width: 1200, quality: 72 }],
  default: [
    { suffix: '', width: 720, quality: 76 },
    { suffix: '-sm', width: 400, quality: 72 },
  ],
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (/\.(png|jpe?g)$/i.test(entry.name)) out.push(p)
  }
  return out
}

const files = await walk(PUBLIC)
for (const file of files) {
  const name = basename(file, extname(file))
  const variants = presets[name] ?? presets.default
  for (const v of variants) {
    const target = join(dirname(file), `${name}${v.suffix}.webp`)
    const info = await sharp(file).resize({ width: v.width, withoutEnlargement: true }).webp({ quality: v.quality }).toFile(target)
    console.log(`✓ ${target}  ${(info.size / 1024).toFixed(0)} KB`)
  }
  const dest = join(SRC, relative(PUBLIC, file))
  await mkdir(dirname(dest), { recursive: true })
  await rename(file, dest)
}
console.log(`Listo: ${files.length} imágenes optimizadas.`)
