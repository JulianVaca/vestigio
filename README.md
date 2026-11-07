# VESTIGIO — Archivo de Streetwear & Museo 3D

Plataforma de comercio electrónico de archivo y **museo 3D interactivo** para **VESTIGIO** (Exposición 01: *Ágora & Archivo*). Fusiona la historia del streetwear y el archivo de diseñador (**Raf Simons, Rick Owens, Balenciaga, Off-White, Maison Margiela, Fear of God, Billionaire Boys Club, A Bathing Ape (BAPE), Yeezy y Sneakers de culto**) con una dirección de arte de estilo griego en granito y vegetación mediterránea.

## Novedades de Producción (v2.0)

| Área | Implementación en VESTIGIO |
|---|---|
| **Catálogo de 30 Piezas en 5 Salas** | 30 piezas curadas y autenticadas distribuidas en 5 salas temáticas: **Sala I · Ágora & Diseñador** (6), **Sala II · Cosmos & Billionaire Boys Club** (6), **Sala III · Camuflaje & BAPE / Base** (6), **Sala IV · Monolito & Yeezy** (6) y **Sala V · Pedestal & Sneakers** (6). |
| **Paleta Griega: Granito & Botánica** | Sistema de diseño en **Granito Abisal (`#121514`)**, **Mármol Pentélico (`#F2EFE9`)**, **Laurel Botánico (`#5E9E7E`)**, **Bronce de Delfos (`#C8B07A`)**, **Ceniza de Olivo (`#A3ADA6`)** y **Granito Labrado (`#242B28`)**, con contraste WCAG AA/AAA verificado en `/marca`. |
| **Ambientación 3D Helénica & Rendimiento PC** | Pórtico de 5 salas con columnas dóricas instanciadas (`InstancedMesh`), jardineras de granito con olivos y laureles, losas de granito moteado, 6 esculturas centrales (incluyendo shader GLSL en vivo) y partículas de polen en GPU. Iluminación y geometrías compartidas para mantener 60–144 FPS en PC. |
| **Zoom-Out a la Marquilla (Selección de Talla)** | Al abrir o seleccionar talla en una prenda (catálogo, página de producto o museo 3D), la cámara realiza un zoom-out desde la **marquilla tejida** del cuello o lengüeta, mostrando una etiqueta bordada interactiva para elegir la talla. |
| **Carrito Dinámico en Carrera & Cápsula 3D** | Ícono de carrito personalizado. Al añadir un producto, gira en 3D dentro de una cápsula sellada con estela de hojas de laurel y hace levantar las ruedas del carrito. Al hacer clic en el carrito, un **carrito animado pasa corriendo a toda velocidad frente a la pantalla**. |
| **Imagen Hero en Alta Resolución** | Fotografía editorial en alta definición (`hero-hd.webp` 2560w, `hero.webp` 1920w, `hero-sm.webp` 960w) ambientada en un pórtico dórico de granito con olivos, vitrina museográfica y streetwear de archivo. |
| **Enfoque de Producción** | Copywriting y flujos listos para producción comercial: certificados de autenticidad, despacho asegurado, showroom y departamentos curatoriales. |

## Cómo ejecutar localmente

```bash
npm install
npm run dev
```

Para generar el build optimizado de producción:

```bash
npm run build
npm run preview
```

## Estructura de ramas en GitHub

- **`produccion` / `main`**: Versión estable lista para despliegue en producción.
- **`desarrollo`**: Rama activa de integración y pruebas de nuevas exposiciones.
