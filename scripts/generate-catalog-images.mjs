import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const HERO_SRC = 'C:/Users/julia/.gemini/antigravity/brain/90fd2b1b-d647-4e24-9dc7-69bfd6615010/vestigio_hero_raw_1794053787597.jpg'
const OUT_IMG = 'public/img'
const OUT_PROD = 'public/img/products'

await mkdir(OUT_PROD, { recursive: true })

// 1. Procesar imagen Hero en alta resolución para PC + variante móvil
try {
  await sharp(HERO_SRC)
    .resize({ width: 2560, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.9, m1: 0.8, m2: 1.5 })
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toFile(join(OUT_IMG, 'hero-hd.webp'))

  await sharp(HERO_SRC)
    .resize({ width: 1920, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(join(OUT_IMG, 'hero.webp'))

  await sharp(HERO_SRC)
    .resize({ width: 960, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 82, effort: 6 })
    .toFile(join(OUT_IMG, 'hero-sm.webp'))

  console.log('✓ Hero images generated (hero-hd.webp, hero.webp, hero-sm.webp)')
} catch (err) {
  console.error('Hero generation warning:', err.message)
}

const catalogItems = [
  // SALA I · DISEÑADOR
  { id: 'raf-riot-bomber', title: 'RIOT AW01', sub: 'RAF SIMONS ARCHIVE', type: 'bomber', c1: '#4A5D52', c2: '#232D28', acc: '#C8B07A', graphic: 'patches' },
  { id: 'rick-drkshdw-toga', title: 'HIMATIÓN', sub: 'RICK OWENS DRKSHDW', type: 'coat', c1: '#262C29', c2: '#111513', acc: '#A3ADA6', graphic: 'drape' },
  { id: 'balenciaga-armor-hoodie', title: 'HOPLITA 880G', sub: 'BALENCIAGA ARCHIVE', type: 'hoodie', c1: '#2E3633', c2: '#161A18', acc: '#5E9E7E', graphic: 'crest' },
  { id: 'offwhite-caravaggio-varsity', title: '"ARTIFACT"', sub: 'OFF-WHITE c/o VIRGIL', type: 'varsity', c1: '#2F5946', c2: '#EAE6DD', acc: '#C8B07A', graphic: 'offwhite' },
  { id: 'margiela-artisanal-coat', title: '0 / 10 ARTISANAL', sub: 'MAISON MARGIELA', type: 'coat', c1: '#DDD8CD', c2: '#ABA496', acc: '#4E8C6F', graphic: 'margiela' },
  { id: 'fog-eternal-blazer', title: 'ETERNA STOA', sub: 'FEAR OF GOD', type: 'coat', c1: '#727C76', c2: '#424A45', acc: '#C8B07A', graphic: 'stoa' },

  // SALA II · BILLIONAIRE BOYS CLUB
  { id: 'bbc-astronaut-hoodie', title: 'ASTRO ORACLE', sub: 'BILLIONAIRE BOYS CLUB', type: 'hoodie', c1: '#EAE7E0', c2: '#BDB8AC', acc: '#4E8C6F', graphic: 'astronaut' },
  { id: 'bbc-icecream-varsity', title: 'PEGASUS ASTRO', sub: 'BBC ICECREAM', type: 'varsity', c1: '#27523E', c2: '#DFDBD2', acc: '#C8B07A', graphic: 'bbc-varsity' },
  { id: 'bbc-running-dog-denim', title: 'RUNNING DOG', sub: 'BBC SELVEDGE 14.5OZ', type: 'pants', c1: '#3A4B56', c2: '#1E282F', acc: '#C8B07A', graphic: 'running-dog' },
  { id: 'bbc-starfield-zip', title: 'STARFIELD DELPHI', sub: 'BILLIONAIRE BOYS CLUB', type: 'ziphoodie', c1: '#20332B', c2: '#0F1814', acc: '#6FB391', graphic: 'starfield' },
  { id: 'bbc-diamond-dollar-tee', title: 'DRACHMA & $', sub: 'BBC ICECREAM', type: 'tee', c1: '#F2EFE8', c2: '#C7C2B7', acc: '#4E8C6F', graphic: 'diamond' },
  { id: 'bbc-nebula-cargo', title: 'ARCADIA ROVER', sub: 'BILLIONAIRE BOYS CLUB', type: 'cargo', c1: '#587867', c2: '#33473D', acc: '#E6E3DC', graphic: 'cargo' },

  // SALA III · BAPE & BASE
  { id: 'bape-shark-granite', title: 'WGM SHARK', sub: 'A BATHING APE®', type: 'sharkhoodie', c1: '#486353', c2: '#24332A', acc: '#C8B07A', graphic: 'shark' },
  { id: 'bape-college-marble-tee', title: 'APE SHALL NEVER', sub: 'A BATHING APE®', type: 'tee', c1: '#313935', c2: '#181D1B', acc: '#F2EFE9', graphic: 'apehead' },
  { id: 'bape-m65-laurel', title: '1ST CAMO M-65', sub: 'A BATHING APE®', type: 'bomber', c1: '#345745', c2: '#1A2E24', acc: '#C8B07A', graphic: 'camo' },
  { id: 'base-doric-hoodie', title: 'DORIC 650 GSM', sub: 'VESTIGIO BASE ARCHIVE', type: 'hoodie', c1: '#808A84', c2: '#4E5651', acc: '#F2EFE9', graphic: 'minimal' },
  { id: 'base-pleated-trouser', title: 'FLUTED PLEAT', sub: 'VESTIGIO BASE ARCHIVE', type: 'pants', c1: '#2B332F', c2: '#151917', acc: '#A3ADA6', graphic: 'pleats' },
  { id: 'base-thermal-tunic', title: 'CHIOS WAFFLE', sub: 'VESTIGIO BASE ARCHIVE', type: 'longsleeve', c1: '#E4DFD4', c2: '#B5AEA0', acc: '#4E8C6F', graphic: 'waffle' },

  // SALA IV · YEEZY
  { id: 'yeezy-dove-hoodie', title: 'ATHENA DOVE', sub: 'YZY × GAP × BALENCIAGA', type: 'hoodie', c1: '#282E2B', c2: '#121514', acc: '#D8D3C8', graphic: 'dove' },
  { id: 'yeezy-season-puffer', title: 'ROUND MONOLITH', sub: 'YEEZY ARCHIVE', type: 'puffer', c1: '#36413C', c2: '#181E1B', acc: '#6FB391', graphic: 'round' },
  { id: 'yeezy-glacier-parka', title: 'QUARRY ANORAK', sub: 'YEEZY SEASON 3', type: 'bomber', c1: '#A19C8E', c2: '#6B665B', acc: '#4E8C6F', graphic: 'anorak' },
  { id: 'yeezy-heavy-sweatpant', title: 'PILLAR 620G', sub: 'YEEZY SEASON 6', type: 'pants', c1: '#5E6B63', c2: '#363F3A', acc: '#C8B07A', graphic: 'sweatpant' },
  { id: 'yeezy-distressed-knit', title: 'RELIC KNIT', sub: 'YEEZY SEASON 1', type: 'longsleeve', c1: '#525E4A', c2: '#2D3428', acc: '#C8B07A', graphic: 'distressed' },
  { id: 'yeezy-tactical-vest', title: 'AEGIS VEST', sub: 'YEEZY SEASON 5', type: 'vest', c1: '#323A36', c2: '#171B19', acc: '#5E9E7E', graphic: 'vest' },

  // SALA V · SNEAKERS
  { id: 'sneaker-aj1-chicago', title: '1985 RELIC OG', sub: 'JORDAN ARCHIVE', type: 'sneaker-high', c1: '#B83A32', c2: '#F2EFE9', acc: '#181A19', graphic: 'aj1' },
  { id: 'sneaker-yeezy-350-turtledove', title: 'BOOST 350 V1', sub: 'YEEZY FOOTWEAR', type: 'sneaker-low', c1: '#A39F95', c2: '#4A4E4C', acc: '#C85A48', graphic: '350' },
  { id: 'sneaker-bapesta-marble', title: 'BAPE STA™ LOW', sub: 'A BATHING APE®', type: 'sneaker-low', c1: '#F2EFE9', c2: '#4A785E', acc: '#C8B07A', graphic: 'bapesta' },
  { id: 'sneaker-yeezy-700-waverunner', title: 'WAVE RUNNER 700', sub: 'YEEZY FOOTWEAR', type: 'sneaker-chunky', c1: '#75807A', c2: '#355E4B', acc: '#D9823B', graphic: '700' },
  { id: 'sneaker-offwhite-aj1', title: '"AIR" THE TEN', sub: 'OFF-WHITE™ ARCHIVE', type: 'sneaker-high', c1: '#ECE8DF', c2: '#CFD5D1', acc: '#D95338', graphic: 'ow-aj1' },
  { id: 'sneaker-dunk-pigeon', title: 'COLUMBA DUNK', sub: 'STAPLE NYC RELIC', type: 'sneaker-low', c1: '#7E8782', c2: '#48504C', acc: '#D96B52', graphic: 'pigeon' },
]

function renderMarquillaSVG(item, x, y, scale = 1) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})">
      <rect x="-54" y="-24" width="108" height="50" rx="3" fill="rgba(0,0,0,0.65)" transform="translate(0, 4)" />
      <rect x="-54" y="-24" width="108" height="50" rx="2.5" fill="#151917" stroke="#C8B07A" stroke-width="1.3" />
      <line x1="-48" y1="-22" x2="-48" y2="24" stroke="#5E9E7E" stroke-width="1.6" stroke-dasharray="3 2" />
      <line x1="48" y1="-22" x2="48" y2="24" stroke="#5E9E7E" stroke-width="1.6" stroke-dasharray="3 2" />
      <text x="0" y="-8" text-anchor="middle" fill="#C8B07A" font-family="Georgia, serif" font-size="8.5" font-weight="bold" letter-spacing="2.5">VESTIGIO</text>
      <text x="0" y="3" text-anchor="middle" fill="#F2EFE9" font-family="sans-serif" font-size="6.8" font-weight="600" letter-spacing="1.1">${item.sub.slice(0, 18)}</text>
      <rect x="-30" y="8" width="60" height="12" rx="2" fill="#212825" stroke="#4E8C6F" stroke-width="0.9" />
      <text x="0" y="16.5" text-anchor="middle" fill="#6FB391" font-family="monospace" font-size="7.2" font-weight="bold">ARCHIVE · TALLA</text>
    </g>
  `
}

function renderGraphicOverlay(item) {
  switch (item.graphic) {
    case 'astronaut':
      return `
        <g transform="translate(420, 465)">
          <ellipse cx="0" cy="0" rx="82" ry="90" fill="rgba(20,25,23,0.12)" stroke="${item.acc}" stroke-width="4.5" />
          <ellipse cx="0" cy="-6" rx="64" ry="48" fill="#17211D" stroke="#C8B07A" stroke-width="3" />
          <path d="M-38 -18 Q0 -38 38 -18" fill="none" stroke="#F2EFE9" stroke-width="3.5" opacity="0.8" stroke-linecap="round" />
          <circle cx="-28" cy="44" r="9" fill="${item.acc}" />
          <circle cx="28" cy="44" r="9" fill="#C8B07A" />
          <path d="M-115 -35 Q0 -115 115 -35" fill="none" stroke="#232B27" stroke-width="2" stroke-dasharray="4 4" />
          <text x="0" y="122" text-anchor="middle" fill="#1E2622" font-family="Georgia, serif" font-weight="bold" font-size="22" letter-spacing="4">BILLIONAIRE BOYS CLUB</text>
        </g>`
    case 'shark':
      return `
        <g transform="translate(420, 440)">
          <!-- Patrón camo orgánico en el pecho -->
          <path d="M-130 -80 Q-70 -120 -30 -60 T60 -85 T120 -20 Q80 40 10 20 T-110 10 Z" fill="#2C3E34" opacity="0.55" />
          <path d="M-90 40 Q-20 0 40 50 T130 30 Q90 110 -20 95 Z" fill="#687D6F" opacity="0.35" />
          <g transform="translate(0, -255)">
            <path d="M-68 -22 Q0 -80 68 -22 L54 32 Q0 14 -54 32 Z" fill="#1F2B25" stroke="#C8B07A" stroke-width="2.5" />
            <path d="M-46 6 L-33 24 L-20 6 L-7 24 L6 6 L19 24 L32 6 L45 24 L52 6" fill="#F2EFE9" stroke="#121514" stroke-width="2" />
            <circle cx="-32" cy="-18" r="11" fill="#F2EFE9" stroke="#121514" stroke-width="2.5" />
            <circle cx="-32" cy="-18" r="4.5" fill="#B83A32" />
            <circle cx="32" cy="-18" r="11" fill="#F2EFE9" stroke="#121514" stroke-width="2.5" />
            <circle cx="32" cy="-18" r="4.5" fill="#B83A32" />
            <text x="58" y="-32" fill="#C8B07A" font-family="Georgia, serif" font-weight="bold" font-size="20" letter-spacing="2">WGM</text>
          </g>
        </g>`
    case 'apehead':
      return `
        <g transform="translate(420, 455)">
          <text x="0" y="-68" text-anchor="middle" fill="#F2EFE9" font-family="Georgia, serif" font-weight="bold" font-size="23" letter-spacing="5">A BATHING APE</text>
          <ellipse cx="0" cy="12" rx="54" ry="64" fill="#EAE6DD" stroke="#C8B07A" stroke-width="3" />
          <ellipse cx="0" cy="30" rx="33" ry="25" fill="#2A322E" />
          <circle cx="-16" cy="-8" r="6.5" fill="#2A322E" />
          <circle cx="16" cy="-8" r="6.5" fill="#2A322E" />
          <text x="0" y="106" text-anchor="middle" fill="#C8B07A" font-family="sans-serif" font-weight="600" font-size="14" letter-spacing="6">ARCHIVE EDITION</text>
        </g>`
    case 'dove':
      return `
        <g transform="translate(420, 460)">
          <path d="M-115 -18 Q-42 -78 0 -14 Q42 -78 115 -18 Q58 18 26 46 L0 82 L-26 46 Q-58 18 -115 -18 Z" fill="#D8D3C8" opacity="0.88" />
          <circle cx="0" cy="-34" r="18" fill="none" stroke="#5E9E7E" stroke-width="2" />
          <text x="0" y="116" text-anchor="middle" fill="#A3ADA6" font-family="sans-serif" font-weight="700" font-size="15" letter-spacing="8">YZY · ATHENA</text>
        </g>`
    case 'patches':
      return `
        <g>
          <rect x="285" y="380" width="96" height="118" rx="2" fill="#EAE6DD" opacity="0.92" stroke="#C8B07A" stroke-width="1.5" />
          <text x="333" y="425" text-anchor="middle" fill="#181C1A" font-family="monospace" font-weight="bold" font-size="13">RIOT! RIOT!</text>
          <text x="333" y="448" text-anchor="middle" fill="#4E8C6F" font-family="Georgia, serif" font-style="italic" font-size="13">AW 2001</text>
          <rect x="448" y="430" width="104" height="88" rx="2" fill="#1B201E" stroke="#5E9E7E" stroke-width="1.5" />
          <text x="500" y="472" text-anchor="middle" fill="#F2EFE9" font-family="Georgia, serif" font-size="14" letter-spacing="2">PORTICO</text>
          <text x="500" y="492" text-anchor="middle" fill="#C8B07A" font-family="monospace" font-size="10.5">ARCHIVE 01</text>
        </g>`
    case 'offwhite':
      return `
        <g transform="translate(420, 455)">
          <text x="-75" y="-20" text-anchor="middle" fill="#F2EFE9" font-family="Georgia, serif" font-weight="bold" font-size="56">V</text>
          <rect x="18" y="-60" width="92" height="52" rx="4" fill="none" stroke="#C8B07A" stroke-width="2.5" />
          <text x="64" y="-28" text-anchor="middle" fill="#F2EFE9" font-family="monospace" font-weight="bold" font-size="14">"ICON"</text>
          <text x="0" y="92" text-anchor="middle" fill="#EAE6DD" font-family="sans-serif" font-weight="bold" font-size="17" letter-spacing="3">"HELLENIC FRESCO"</text>
        </g>`
    case 'diamond':
      return `
        <g transform="translate(420, 455)">
          <polygon points="-55,0 -25,-45 5,0 -25,45" fill="none" stroke="#4E8C6F" stroke-width="5" />
          <polygon points="-40,0 -25,-25 -10,0 -25,25" fill="#4E8C6F" opacity="0.35" />
          <text x="42" y="18" text-anchor="middle" fill="#1C221F" font-family="Georgia, serif" font-weight="bold" font-size="64">$</text>
          <text x="0" y="88" text-anchor="middle" fill="#3B5246" font-family="Georgia, serif" font-weight="bold" font-size="15" letter-spacing="4">TETRADRACHM · BBC</text>
        </g>`
    default:
      return `
        <g transform="translate(420, 460)" opacity="0.9">
          <circle cx="0" cy="0" r="48" fill="rgba(18,21,20,0.22)" stroke="${item.acc}" stroke-width="1.8" stroke-dasharray="6 4" />
          <text x="0" y="5" text-anchor="middle" fill="${item.acc}" font-family="Georgia, serif" font-style="italic" font-size="15" letter-spacing="2">${item.title}</text>
        </g>`
  }
}

function renderGarmentSVG(item) {
  const { type, c1, c2, acc } = item
  if (type === 'sneaker-high' || type === 'sneaker-low' || type === 'sneaker-chunky') {
    const isHigh = type === 'sneaker-high'
    const isChunky = type === 'sneaker-chunky'
    return `
      <g>
        <!-- Ramas de olivo botánicas detrás del pedestal -->
        <g opacity="0.65" stroke="#4E8C6F" stroke-width="2.2" fill="#2F5E48">
          <path d="M175 785 Q125 690 160 595" fill="none" />
          <ellipse cx="148" cy="675" rx="20" ry="7.5" transform="rotate(-35 148 675)" />
          <ellipse cx="165" cy="635" rx="20" ry="7.5" transform="rotate(25 165 635)" />
          <path d="M665 785 Q715 690 680 600" fill="none" />
          <ellipse cx="692" cy="680" rx="20" ry="7.5" transform="rotate(35 692 680)" />
          <ellipse cx="672" cy="638" rx="20" ry="7.5" transform="rotate(-25 672 638)" />
        </g>

        <!-- Pedestal de Granito Griego Tallado -->
        <polygon points="135,775 705,775 745,830 95,830" fill="#313A36" stroke="#4E5C55" stroke-width="2" />
        <rect x="95" y="830" width="650" height="215" fill="url(#granitePedestal)" stroke="#3D4842" stroke-width="2" />
        <g stroke="#141816" stroke-width="5" opacity="0.55">
          <line x1="185" y1="850" x2="185" y2="1025" />
          <line x1="280" y1="850" x2="280" y2="1025" />
          <line x1="560" y1="850" x2="560" y2="1025" />
          <line x1="655" y1="850" x2="655" y2="1025" />
        </g>

        <!-- Cartela de bronce en el pedestal -->
        <rect x="295" y="890" width="250" height="68" rx="4" fill="#151917" stroke="#C8B07A" stroke-width="1.6" />
        <text x="420" y="918" text-anchor="middle" fill="#C8B07A" font-family="Georgia, serif" font-size="15" font-weight="bold" letter-spacing="2.2">${item.title}</text>
        <text x="420" y="942" text-anchor="middle" fill="#A3ADA6" font-family="sans-serif" font-size="11" letter-spacing="1.8">${item.sub}</text>

        <ellipse cx="420" cy="782" rx="245" ry="24" fill="rgba(0,0,0,0.8)" />

        <!-- Silueta escultural del Sneaker -->
        <g transform="translate(0, ${isHigh ? '0' : '32'})">
          <!-- Entresuela (Midsole) con volumen 3D -->
          <path d="M172 715 C240 712, 580 712, 668 716 C685 745, 675 768, 658 774 L185 774 C162 762, 160 738, 172 715 Z" fill="#EAE4D7" stroke="#252A28" stroke-width="3" />
          ${
            isChunky
              ? `<ellipse cx="265" cy="746" rx="40" ry="14" fill="${acc}" />
                 <ellipse cx="390" cy="748" rx="34" ry="12" fill="${acc}" />
                 <path d="M178 742 Q310 720 460 746 T665 738" fill="none" stroke="#242B28" stroke-width="3.5" />`
              : `<path d="M178 760 L662 760" stroke="${c1}" stroke-width="9" stroke-linecap="round" />`
          }

          <!-- Cuerpo / Capellada con curvas orgánicas -->
          <path d="${
            isHigh
              ? 'M188 715 C185 600, 192 510, 200 445 C245 432, 300 428, 338 438 C365 485, 385 525, 415 555 C475 605, 555 632, 648 650 C675 662, 678 692, 662 715 Z'
              : 'M188 715 C186 645, 198 590, 210 550 C255 542, 305 558, 342 565 C375 552, 415 568, 530 622 C585 642, 635 648, 654 656 C676 675, 675 698, 662 715 Z'
          }" fill="url(#garmentGrad)" stroke="#181C1A" stroke-width="3.5" />

          <!-- Paneles de talón y puntera (Toebox & Heel Counter) -->
          <path d="M188 715 C188 650, 196 610, 205 588 C265 595, 315 618, 348 648 L362 715 Z" fill="${c2}" stroke="#181C1A" stroke-width="2.5" />
          <path d="M475 715 C495 642, 565 638, 654 656 C675 678, 672 698, 662 715 Z" fill="${c2}" stroke="#181C1A" stroke-width="2.5" />

          <!-- Emblema lateral -->
          ${
            item.graphic === 'bapesta'
              ? `<polygon points="340,620 365,590 355,625 398,625 352,655 368,690 330,660 282,670" fill="${acc}" stroke="#F2EFE9" stroke-width="2.5" />`
              : item.graphic === '350'
              ? `<path d="M208 662 Q410 620 648 682" fill="none" stroke="${acc}" stroke-width="20" stroke-linecap="round" opacity="0.88" />
                 <text x="410" y="658" fill="#F2EFE9" font-family="monospace" font-weight="bold" font-size="15">SPLY-350</text>`
              : `<path d="M245 608 C315 668, 415 662, 502 630 C410 638, 330 618, 275 572 Z" fill="${acc}" stroke="#F2EFE9" stroke-width="2" />`
          }

          ${
            item.graphic === 'ow-aj1'
              ? `<text x="275" y="752" fill="#181C1A" font-family="sans-serif" font-weight="900" font-size="22">"AIR"</text>
                 <rect x="355" y="510" width="76" height="18" rx="3" fill="#D95338" transform="rotate(-18 355 510)" />`
              : ''
          }

          <!-- Cordones -->
          <g stroke="#F2EFE9" stroke-width="5.5" stroke-linecap="round">
            <line x1="348" y1="532" x2="398" y2="520" />
            <line x1="368" y1="556" x2="420" y2="544" />
            <line x1="392" y1="580" x2="444" y2="568" />
            <line x1="416" y1="604" x2="468" y2="592" />
          </g>

          <!-- Marquilla tejida en la lengüeta -->
          ${renderMarquillaSVG(item, 330, isHigh ? 426 : 522, 1.06)}
        </g>
      </g>
    `
  }

  if (type === 'pants' || type === 'cargo') {
    return `
      <g>
        <ellipse cx="420" cy="1015" rx="195" ry="22" fill="rgba(0,0,0,0.7)" />
        <!-- Silueta Pantalón con caída orgánica -->
        <path d="M258 155 C340 162, 500 162, 582 155 C605 420, 622 710, 632 982 L452 982 L420 430 L388 982 L208 982 C218 710, 235 420, 258 155 Z" fill="url(#garmentGrad)" stroke="#3D4842" stroke-width="3" />
        <!-- Sombras de pliegues internos -->
        <path d="M325 202 C315 480, 305 740, 298 975" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="8" />
        <path d="M515 202 C525 480, 535 740, 542 975" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="8" />
        <path d="M332 202 C322 480, 312 740, 305 975" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.5" />
        <path d="M508 202 C518 480, 528 740, 535 975" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.5" />

        <!-- Pretina sastre -->
        <path d="M258 155 C340 162, 500 162, 582 155 L585 202 C500 208, 340 208, 255 202 Z" fill="${c2}" stroke="#4E5C55" stroke-width="2" />
        ${
          type === 'cargo'
            ? `<rect x="210" y="450" width="84" height="140" rx="8" fill="${c2}" stroke="${acc}" stroke-width="2" />
               <rect x="546" y="450" width="84" height="140" rx="8" fill="${c2}" stroke="${acc}" stroke-width="2" />`
            : ''
        }
        ${
          item.graphic === 'running-dog'
            ? `<path d="M232 420 Q330 365 420 408 Q510 450 605 392" fill="none" stroke="${acc}" stroke-width="14" stroke-linecap="round" />
               <text x="420" y="362" text-anchor="middle" fill="#F2EFE9" font-family="Georgia, serif" font-style="italic" font-size="20">BBC RUNNING DOG SELVEDGE</text>`
            : ''
        }
        ${renderMarquillaSVG(item, 420, 178, 1.15)}
      </g>
    `
  }

  // Prendas superiores con hombros caídos orgánicos, pliegues de tela y puños
  const isCoat = type === 'coat'
  const isVarsity = type === 'varsity'
  const isHoodie = type === 'hoodie' || type === 'ziphoodie' || type === 'sharkhoodie'
  const isTee = type === 'tee'
  const isVest = type === 'vest'

  return `
    <g>
      <ellipse cx="420" cy="1012" rx="190" ry="22" fill="rgba(0,0,0,0.72)" />

      <!-- Capucha tridimensional o cuello sastre -->
      ${
        isHoodie
          ? `<path d="M288 196 C272 95, 340 62, 420 62 C500 62, 568 95, 552 196 Z" fill="${c2}" stroke="#4A5750" stroke-width="3" />
             <path d="M326 196 C330 118, 368 94, 420 94 C472 94, 510 118, 514 196 Z" fill="#131715" stroke="${acc}" stroke-width="1.5" />`
          : `<ellipse cx="420" cy="188" rx="94" ry="38" fill="#131715" stroke="${acc}" stroke-width="2.5" />`
      }

      <!-- Mangas con caída curva natural (drop-shoulder) y puños acanalados -->
      ${
        isVest
          ? ''
          : isTee
          ? `<path d="M225 220 C175 260, 138 325, 112 392 L196 442 C220 398, 245 360, 265 330 Z" fill="url(#garmentGrad)" stroke="#3D4842" stroke-width="2.5" />
             <path d="M615 220 C665 260, 702 325, 728 392 L644 442 C620 398, 595 360, 575 330 Z" fill="url(#garmentGrad)" stroke="#3D4842" stroke-width="2.5" />`
          : `<path d="M225 216 C168 275, 134 510, 118 748 L212 762 C232 585, 255 430, 272 365 Z" fill="${isVarsity ? c2 : 'url(#garmentGrad)'}" stroke="#3D4842" stroke-width="3" />
             <path d="M615 216 C672 275, 706 510, 722 748 L628 762 C608 585, 585 430, 568 365 Z" fill="${isVarsity ? c2 : 'url(#garmentGrad)'}" stroke="#3D4842" stroke-width="3" />
             <!-- Puños (cuffs) -->
             <polygon points="118,748 212,762 206,796 122,784" fill="${c2}" stroke="#4A5750" stroke-width="2" />
             <polygon points="722,748 628,762 634,796 718,784" fill="${c2}" stroke="#4A5750" stroke-width="2" />`
      }

      <!-- Torso escultural con volumen de pecho y pliegues suaves -->
      <path d="${
        isCoat
          ? 'M225 214 C265 188, 305 176, 330 174 C360 198, 480 198, 510 174 C535 176, 575 188, 615 214 C618 480, 622 720, 626 955 L214 955 C218 720, 222 480, 225 214 Z'
          : 'M220 218 C260 190, 300 178, 328 176 C360 202, 480 202, 512 176 C540 178, 580 190, 620 218 C612 450, 602 650, 592 830 L248 830 C238 650, 228 450, 220 218 Z'
      }" fill="url(#garmentGrad)" stroke="#44524B" stroke-width="3" />

      <!-- Luz cenital de estudio y pliegues verticales de caída -->
      <ellipse cx="420" cy="390" rx="165" ry="210" fill="url(#chestHighlight)" />
      <path d="M285 320 Q295 560 278 785" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="10" />
      <path d="M555 320 Q545 560 562 785" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="10" />

      <!-- Solapas de abrigo o cremallera metálica -->
      ${
        isCoat
          ? `<polygon points="330,174 420,445 282,368" fill="${c2}" stroke="${acc}" stroke-width="2" />
             <polygon points="510,174 420,445 558,368" fill="${c2}" stroke="${acc}" stroke-width="2" />
             <line x1="420" y1="445" x2="420" y2="955" stroke="#141816" stroke-width="3.5" />`
          : ''
      }
      ${
        type === 'ziphoodie' || type === 'sharkhoodie' || type === 'bomber' || isVarsity
          ? `<line x1="420" y1="198" x2="420" y2="830" stroke="${acc}" stroke-width="4" />`
          : ''
      }

      <!-- Bolsillo canguro curvo -->
      ${
        isHoodie
          ? `<path d="M300 618 L540 618 L568 790 L272 790 Z" fill="${c2}" opacity="0.68" stroke="#4A5750" stroke-width="2" />`
          : ''
      }

      <!-- Pretina acanalada inferior -->
      ${
        !isCoat && !isTee
          ? `<rect x="248" y="790" width="344" height="44" rx="3" fill="${c2}" stroke="#4A5750" stroke-width="2" />`
          : ''
      }

      <!-- Gráfico de la pieza -->
      ${renderGraphicOverlay(item)}

      <!-- MARQUILLA TEJIDA EN EL CUELLO -->
      ${renderMarquillaSVG(item, 420, 212, 1.18)}
    </g>
  `
}

function buildProductSVG(item) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1120" viewBox="0 0 840 1120">
    <defs>
      <radialGradient id="studioBg" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#2A3430" />
        <stop offset="55%" stop-color="#171C1A" />
        <stop offset="100%" stop-color="#0E1110" />
      </radialGradient>
      <linearGradient id="garmentGrad" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stop-color="${item.c1}" />
        <stop offset="50%" stop-color="${item.c1}" />
        <stop offset="100%" stop-color="${item.c2}" />
      </linearGradient>
      <radialGradient id="chestHighlight" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
      <linearGradient id="granitePedestal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#272F2B" />
        <stop offset="100%" stop-color="#141816" />
      </linearGradient>
    </defs>

    <rect width="840" height="1120" fill="url(#studioBg)" />

    <!-- Arco de templo griego en hilo de bronce y laurel -->
    <path d="M88 1120 L88 360 A332 332 0 0 1 752 360 L752 1120" fill="none" stroke="rgba(200, 176, 122, 0.14)" stroke-width="2" />
    <path d="M112 1120 L112 360 A308 308 0 0 1 728 360 L728 1120" fill="none" stroke="rgba(94, 158, 126, 0.12)" stroke-width="1.2" />

    <!-- Ramas de olivo en las esquinas superiores -->
    <g opacity="0.28" fill="#4E8C6F">
      <ellipse cx="95" cy="90" rx="42" ry="12" transform="rotate(28 95 90)" />
      <ellipse cx="135" cy="65" rx="36" ry="10" transform="rotate(15 135 65)" />
      <ellipse cx="75" cy="130" rx="38" ry="11" transform="rotate(42 75 130)" />
      <ellipse cx="745" cy="90" rx="42" ry="12" transform="rotate(-28 745 90)" />
      <ellipse cx="705" cy="65" rx="36" ry="10" transform="rotate(-15 705 65)" />
      <ellipse cx="765" cy="130" rx="38" ry="11" transform="rotate(-42 765 130)" />
    </g>

    ${renderGarmentSVG(item)}

    <g transform="translate(420, 1078)" opacity="0.7">
      <text x="0" y="0" text-anchor="middle" fill="#A3ADA6" font-family="sans-serif" font-size="11" letter-spacing="4">VESTIGIO ARCHIVE · ${item.sub.toUpperCase()}</text>
    </g>
  </svg>`
}

for (const item of catalogItems) {
  const svgBuffer = Buffer.from(buildProductSVG(item))
  const fullPath = join(OUT_PROD, `${item.id}.webp`)
  const smPath = join(OUT_PROD, `${item.id}-sm.webp`)

  await sharp(svgBuffer)
    .resize(840, 1120)
    .webp({ quality: 86, effort: 4 })
    .toFile(fullPath)

  await sharp(svgBuffer)
    .resize(420, 560)
    .webp({ quality: 80, effort: 4 })
    .toFile(smPath)
}

console.log(`✓ Generated ${catalogItems.length * 2} sculpted product WebP images in ${OUT_PROD}`)
