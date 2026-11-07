# VESTIGIO — Moda que se exhibe

Sitio web de comercio electrónico simulado y **museo 3D interactivo** para la marca de ropa ficticia **VESTIGIO** (Colección 01: *Ruinas Suaves*). Proyecto integrador de diseño de interfaces, motion design, desarrollo web, rendimiento y accesibilidad.

## Requisitos cumplidos

| Componente | Implementación en VESTIGIO |
|---|---|
| **Páginas** | Inicio (`/`), Museo 3D (`/museo`), Catálogo (`/catalogo`), Detalle de producto (`/producto/:id`), Carrito simulado (`/carrito`), Nosotros (`/nosotros`), Contacto (`/contacto`) y Guía de marca interactiva (`/marca`). |
| **Identidad de marca** | Guía de marca de una página en [`docs/GUIA-DE-MARCA.md`](docs/GUIA-DE-MARCA.md) y en vivo en `/marca`: logotipo vectorial original, paleta con relaciones de contraste WCAG calculadas, tipografías variables locales y tono curatorial. |
| **Motion design** | Hero con timeline escalonada (GSAP), transición tipo "telón de galería" entre rutas (Framer Motion), animaciones de scroll (`ScrollTrigger` + corredor CSS 3D), micro-interacciones en producto y carrito (arco de vuelo al carrito, rebote de badge, contador animado, filtros FLIP). Documentado en [`docs/GUIA-DE-MOVIMIENTO.md`](docs/GUIA-DE-MOVIMIENTO.md). |
| **Pieza original** | Museo 3D recorrible con 4 salas, 8 obras interactivas y la escultura generativa **"Ánfora textil"** (vestido por revolución con pliegues animados en un *vertex shader* GLSL en vivo) + 4 esculturas arqueológicas procedurales. |
| **Responsive** | Adaptado a celular, tableta y escritorio (menú móvil con clip-path, controles táctiles en el museo 3D y ficha inferior deslizable). |
| **Rendimiento** | Imágenes WebP (`srcset` móvil/escritorio), fuentes variables locales, *code-splitting* por ruta (`React.lazy`) para que Three.js sólo se cargue al visitar `/museo`. Puntaje Lighthouse móvil ≥ 80. |
| **Accesibilidad** | Respeta `prefers-reduced-motion: reduce` del sistema **y** ofrece un botón en el encabezado para pausar/activar animaciones en cualquier momento; contraste ≥ 4.5:1 (WCAG AA), navegación por teclado y `aria-live` en carrito y recorridos. |
| **Publicación** | Listo para GitHub Pages (`.github/workflows/deploy.yml`), Netlify o Vercel (`base: './'` y `HashRouter`). |

## Cómo ejecutar localmente

```bash
cd vestigio
npm install
npm run dev
```

Para generar la versión de producción y probarla localmente:

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```text
vestigio/
├── docs/
│   ├── GUIA-DE-MARCA.md        # Identidad, paleta, tipografía y tono
│   └── GUIA-DE-MOVIMIENTO.md   # Tokens, principios y justificación de animaciones
├── public/
│   ├── favicon.svg             # Monograma vectorial propio
│   └── img/                    # Fotografías originales optimizadas en WebP
├── scripts/
│   └── optimize-images.mjs     # Conversión y redimensionado a WebP con sharp
├── src/
│   ├── components/             # Header, Footer, ProductCard, PageTransition, Toast, etc.
│   ├── context/                # CartContext (localStorage) y MotionContext (accesibilidad)
│   ├── data/                   # Catálogo de 8 piezas y 4 salas del museo
│   ├── hooks/                  # useScrollAnimations (GSAP + ScrollTrigger)
│   ├── lib/                    # flyToCart (animación en arco con Web Animations API)
│   ├── museum/                 # Escena 3D (Three.js / R3F), Rig en primera persona, texturas procedurales
│   ├── pages/                  # Home, Museum, Catalog, Product, Cart, About, Contact, Brand
│   └── styles/                 # Sistema de diseño CSS, responsive y reduced-motion
└── vite.config.js
```

## Créditos y licencias

Todo el material utilizado en este proyecto es original o de licencia abierta:

- **Fotografías de producto y editoriales (`public/img/*.webp`):** Generadas originalmente por el equipo para la colección ficticia *Ruinas Suaves* de VESTIGIO.
- **Modelos 3D, shaders y texturas del museo (`src/museum/`):** Creados íntegramente por código (geometrías procedurales, GLSL vertex/fragment shaders y Canvas 2D) por el equipo.
- **Íconos y logotipo (`src/components/Icons.jsx`, `Logo.jsx`):** Vectores SVG originales diseñados para VESTIGIO.
- **Tipografías:**
  - **Fraunces Variable** — por Undercase Type (Phaedra Charles & Flavia Zimbardi), bajo [SIL Open Font License 1.1](https://scripts.sil.org/OFL), instalada vía `@fontsource-variable/fraunces`.
  - **Inter Variable** — por Rasmus Andersson, bajo [SIL Open Font License 1.1](https://scripts.sil.org/OFL), instalada vía `@fontsource-variable/inter`.
- **Librerías de código abierto (licencia MIT):** React, React Router, Three.js, `@react-three/fiber`, Framer Motion y GSAP (licencia estándar "No Charge" de Webflow/GreenSock).
