// Catálogo de la colección 01 "Ruinas Suaves".
// Todas las imágenes son originales del equipo (generadas para el proyecto).
const base = import.meta.env.BASE_URL

export const products = [
  {
    id: 'portico',
    name: 'Abrigo Pórtico',
    category: 'Abrigos',
    price: 489000,
    color: 'Arena',
    hex: '#C8A97E',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    img: `${base}img/products/portico.webp`,
    room: 0,
    description:
      'Abrigo largo cruzado en lana virgen. Su caída recta evoca las columnas de un pórtico: estructura firme, gesto sereno.',
    details: ['80% lana, 20% poliamida', 'Forro de cupro', 'Hecho en Bogotá'],
  },
  {
    id: 'marmol',
    name: 'Blazer Mármol',
    category: 'Sastrería',
    price: 359000,
    color: 'Hueso veteado',
    hex: '#E6E1D6',
    sizes: ['XS', 'S', 'M', 'L'],
    img: `${base}img/products/marmol.webp`,
    room: 0,
    description:
      'Blazer estructurado con un jacquard sutil que imita las vetas del mármol. Hombro marcado y botón único.',
    details: ['Jacquard de algodón y viscosa', 'Hombreras ligeras', 'Hecho en Medellín'],
  },
  {
    id: 'anfora',
    name: 'Vestido Ánfora',
    category: 'Vestidos',
    price: 329000,
    color: 'Terracota',
    hex: '#B9532F',
    sizes: ['XS', 'S', 'M', 'L'],
    img: `${base}img/products/anfora.webp`,
    room: 1,
    description:
      'Vestido midi en seda lavada con drapeado asimétrico. Pliegues que se mueven como el barro antes de tomar forma.',
    details: ['100% seda lavada', 'Cierre lateral invisible', 'Lavar a mano'],
  },
  {
    id: 'fresco',
    name: 'Camisa Fresco',
    category: 'Camisas',
    price: 189000,
    color: 'Azul fresco',
    hex: '#7F9DB5',
    sizes: ['S', 'M', 'L', 'XL'],
    img: `${base}img/products/fresco.webp`,
    room: 1,
    description:
      'Camisa amplia en lino con un azul desvanecido, como los pigmentos de un fresco antiguo expuesto al sol.',
    details: ['100% lino europeo', 'Botones de corozo', 'Corte relajado'],
  },
  {
    id: 'columna',
    name: 'Pantalón Columna',
    category: 'Pantalones',
    price: 239000,
    color: 'Carbón',
    hex: '#3A3734',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    img: `${base}img/products/columna.webp`,
    room: 2,
    description:
      'Pantalón de tiro alto y pierna ancha con doble pinza. Una línea vertical continua, del talle al suelo.',
    details: ['Lana fría tropical', 'Pretina con botón interno', 'Bota de 28 cm'],
  },
  {
    id: 'mosaico',
    name: 'Suéter Mosaico',
    category: 'Tejidos',
    price: 269000,
    color: 'Crema / ocre',
    hex: '#D9B26A',
    sizes: ['S', 'M', 'L', 'XL'],
    img: `${base}img/products/mosaico.webp`,
    room: 2,
    description:
      'Suéter de punto grueso con un patrón geométrico inspirado en mosaicos romanos encontrados bajo la ceniza.',
    details: ['Lana merino y alpaca', 'Tejido en telar manual', 'Unisex'],
  },
  {
    id: 'capitel',
    name: 'Falda Capitel',
    category: 'Faldas',
    price: 209000,
    color: 'Oliva',
    hex: '#6E7348',
    sizes: ['XS', 'S', 'M', 'L'],
    img: `${base}img/products/capitel.webp`,
    room: 3,
    description:
      'Falda midi plisada en oliva. Cada pliegue se abre al caminar, como las estrías de un capitel en movimiento.',
    details: ['Poliéster reciclado', 'Plisado permanente', 'Cintura elástica oculta'],
  },
  {
    id: 'bronce',
    name: 'Chaqueta Bronce',
    category: 'Chaquetas',
    price: 399000,
    color: 'Bronce',
    hex: '#9C6B3C',
    sizes: ['S', 'M', 'L', 'XL'],
    img: `${base}img/products/bronce.webp`,
    room: 3,
    description:
      'Bomber corta en satén color bronce. Brilla como una escultura pulida por el tiempo y las manos de los visitantes.',
    details: ['Satén de acetato', 'Relleno ligero', 'Puños en rib'],
  },
]

export const rooms = [
  { id: 0, name: 'Sala I · Estructura', text: 'Piezas que sostienen: sastrería y abrigo.' },
  { id: 1, name: 'Sala II · Pigmento', text: 'Color que se desvanece con el tiempo.' },
  { id: 2, name: 'Sala III · Línea', text: 'Verticales, patrones y geometría.' },
  { id: 3, name: 'Sala IV · Pátina', text: 'Superficies que brillan como metal antiguo.' },
]

export const categories = ['Todo', ...new Set(products.map((p) => p.category))]

export const getProduct = (id) => products.find((p) => p.id === id)

export const formatPrice = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
