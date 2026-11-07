import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'

const brainDir = 'C:/Users/julia/.gemini/antigravity/brain/90fd2b1b-d647-4e24-9dc7-69bfd6615010'
const outDir = path.resolve('public/img/products')

const sheets = [
  {
    file: 'sala1_triptych_a_1794058115688.jpg',
    ids: ['raf-riot-bomber', 'rick-drkshdw-toga', 'balenciaga-armor-hoodie'],
  },
  {
    file: 'sala1_triptych_b_1794058257154.jpg',
    ids: ['offwhite-caravaggio-varsity', 'margiela-artisanal-coat', 'fog-eternal-blazer'],
  },
  {
    file: 'sala2_triptych_a_1794058112279.jpg',
    ids: ['bbc-astronaut-hoodie', 'bbc-icecream-varsity', 'bbc-running-dog-denim'],
  },
  {
    file: 'sala2_triptych_b_1794058122670.jpg',
    ids: ['bbc-starfield-zip', 'bbc-diamond-dollar-tee', 'bbc-nebula-cargo'],
  },
  {
    file: 'sala3_triptych_a_1794058115252.jpg',
    ids: ['bape-shark-granite', 'bape-college-marble-tee', 'bape-m65-laurel'],
  },
  {
    file: 'sala3_triptych_b_1794058126431.jpg',
    ids: ['base-doric-hoodie', 'base-pleated-trouser', 'base-thermal-tunic'],
  },
  {
    file: 'sala4_triptych_a_1794058116762.jpg',
    ids: ['yeezy-dove-hoodie', 'yeezy-season-puffer', 'yeezy-glacier-parka'],
  },
  {
    file: 'sala4_triptych_b_1794058126693.jpg',
    ids: ['yeezy-heavy-sweatpant', 'yeezy-distressed-knit', 'yeezy-tactical-vest'],
  },
  {
    file: 'sala5_triptych_a_1794058119646.jpg',
    ids: ['sneaker-aj1-chicago', 'sneaker-yeezy-350-turtledove', 'sneaker-bapesta-marble'],
  },
  {
    file: 'sala5_triptych_b_1794058260689.jpg',
    ids: ['sneaker-yeezy-700-waverunner', 'sneaker-offwhite-aj1', 'sneaker-dunk-pigeon'],
  },
]

async function main() {
  await fs.mkdir(outDir, { recursive: true })
  let count = 0

  for (const sheet of sheets) {
    const srcPath = path.join(brainDir, sheet.file)
    const meta = await sharp(srcPath).metadata()
    const colW = Math.floor(meta.width / 3)
    const H = meta.height
    const padX = Math.floor(colW * 0.025)
    const padY = Math.floor(H * 0.015)

    for (let i = 0; i < 3; i++) {
      const id = sheet.ids[i]
      const left = i * colW + padX
      const width = colW - padX * 2
      const top = padY
      const height = H - padY * 2

      // 840x1120 (3:4 alta resolución)
      await sharp(srcPath)
        .extract({ left, top, width, height })
        .resize(840, 1120, { fit: 'cover', position: 'centre' })
        .webp({ quality: 88 })
        .toFile(path.join(outDir, `${id}.webp`))

      // 420x560 (3:4 miniatura para racks 3D y tarjetas móviles)
      await sharp(srcPath)
        .extract({ left, top, width, height })
        .resize(420, 560, { fit: 'cover', position: 'centre' })
        .webp({ quality: 84 })
        .toFile(path.join(outDir, `${id}-sm.webp`))

      count++
    }
  }

  console.log(`Generadas ${count} prendas originales (60 archivos WebP) con éxito.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
