# Registro de Cambios (Changelog) — VESTIGIO

## [2.4.0] — Museo sin bloqueo al cargar, animaciones de scroll restauradas (2026-11-07)

Lighthouse escritorio (build de producción):

| Página | Antes | Después |
|---|---|---|
| Museo 3D (`/museo`) | 62 · TBT 3.160 ms | **99** · TBT 20–50 ms |
| Inicio | 80–98 (variable) | **99** · TBT 10–20 ms |
| Catálogo | 89 | **99** |

### Museo en dos fases (`src/pages/Museum.jsx`, `src/museum/IntroCard.jsx`)
- Al abrir `/museo` se muestra al instante una portada ligera con una captura real del museo (`public/img/museo-preview*.webp`, 28 KB) y **sin Three.js**. Antes la página descargaba ~970 KB y construía toda la escena (texturas, PMREM, shaders) mientras se cargaba: dos tareas de 1,2 s y 1,5 s.
- Al pulsar «Entrar» se carga el 3D y la experiencia **arranca sola** al terminar (ya no hace falta un segundo clic). La descarga empieza al pasar el cursor o enfocar el botón.
- Los enlaces directos a una sala u obra (`?sala=`, `?obra=`) entran directamente.
- La misma tarjeta (`IntroCard`) se usa en ambas fases: sin saltos visuales ni de layout.

### Animaciones de scroll restauradas (`useGsapEffect`)
- **Corredor 3D de la portada:** si el visitante hacía scroll antes de que se montara la sección diferida, el efecto se configuraba sin encontrar el elemento y nunca se activaba. Ahora cada efecto se configura cuando su elemento existe.
- **Parallax de «Nosotros»** restaurado.
- Un `ResizeObserver` recalcula ScrollTrigger cuando cambia la altura de la página (secciones diferidas y `content-visibility`).

### Pintado más barato en el hero
- Sin `mix-blend-mode`, sin `backdrop-filter` en la etiqueta y sombras con menos desenfoque. Lighthouse y PageSpeed pintan sin GPU (por software), y esos efectos bloqueaban el hilo principal ~350 ms esperando al rasterizado.

## [2.3.1] — Tirones del museo 3D en PC (2026-11-07)

Medido con Edge sobre la GPU real (AMD Radeon integrada, Direct3D 11), 1600×900, con vsync.
Fotogramas de más de 25 ms (saltos visibles) por escenario:

| Escenario | v2.1 | v2.3.0 | v2.3.1 |
|---|---|---|---|
| Mover el mouse sobre las prendas | 26–30 (peor 125 ms) | 2 | **0** (peor 21 ms) |
| Caminar con WASD | 29–47 (peor 146 ms) | 0 | **0** (peor 21 ms) |
| Recorrido con N | — (el panel fallaba) | 14–15 | 11 (peor 90 ms) |

- **DPR adaptativo sólo de bajada.** El de v2.2 subía y bajaba la resolución: con pantallas de 60 Hz oscilaba y el lienzo cambiaba de tamaño varias veces por segundo (4 veces en 4 s medidos), recreando los framebuffers de la GPU en cada cambio. Ahora sólo baja un escalón tras 3 s seguidos por debajo de 40 FPS, como máximo dos veces, y nunca vuelve a subir.
- **Sin `backdrop-filter` sobre el lienzo 3D** (header, píldoras de sala, minimapa, barra de recorrido y panel). Cada capa desenfocada obligaba a la GPU a re-desenfocar su área en cada fotograma. Los fondos ya eran 90–96 % opacos, así que el cambio no se nota.
- **Precompilación de shaders (`compileAsync`) y subida anticipada de texturas (`initTexture`)** durante la pantalla de carga, en lugar de hacerlo la primera vez que cada objeto entra en cámara.
- `checkShaderErrors` desactivado en producción (evita consultas síncronas a la GPU).
- Imágenes del panel de la prenda con decodificación asíncrona.

## [2.3.0] — Rendimiento Lighthouse y portada «Columnata» (2026-11-07)

Medido con Lighthouse 12 sobre la build de producción (portada):

| | Antes | Después |
|---|---|---|
| Escritorio | 65 · TBT 2.260 ms | **96–99** · TBT 20–150 ms |
| Móvil | 47 · TBT 810 ms | **84–85** · TBT 210–250 ms |

### Rendimiento de la web
- **Three.js fuera de la portada.** La regla `manualChunks` de `vite.config.js` metía módulos compartidos en `vendor-three`, así que todas las páginas descargaban y ejecutaban 925 KB de Three.js. Ahora sólo los carga el museo.
- **Apariciones al hacer scroll sin GSAP.** `useScrollAnimations` usa `IntersectionObserver` + transiciones CSS (sin forzar layout). GSAP sólo se descarga para los efectos con scrub de la portada, y únicamente tras la primera interacción del visitante.
- **Render progresivo de la portada (`Deferred.jsx`).** Las secciones bajo el pliegue se montan cada una en su propia tarea ociosa (`requestIdleCallback`) en lugar de una única tarea larga.
- **`content-visibility: auto`** en secciones fuera de pantalla: el navegador no calcula su estilo ni su layout hasta que te acercas.
- Hero: sin filtro SVG de ruido, decodificación asíncrona, animaciones de entrada sólo con `transform` (LCP inmediato) y una sola imagen al cargar; las demás se montan al interactuar.
- Cabeceras de caché largas para `/assets` e `/img` en `vercel.json` y `netlify.toml` (GitHub Pages no permite configurarlas).

### Museo 3D
- Percha fusionada en una geometría (3 → 1 draw call por obra).
- Halos de luz instanciados (30 → 1 draw call).
- Las 30 etiquetas de precio en un único atlas de textura y una malla fusionada (30 texturas y 30 draw calls → 1).
- Minimapa: el DOM del HUD sólo se actualiza cuando cambia la pose (antes, en cada fotograma).

### Portada «Columnata»
- El nicho único se reemplaza por un tríptico de arcos sobre un estilóbato de travertino: prenda destacada en el arco central (rotativa), sneaker y hoodie en los arcos menores, columnas con capitel dorado.
- La etiqueta de la pieza pasa debajo del estilóbato para no tapar la prenda.

## [2.2.0] — «Helénico Botánico Áureo» (2026-11-07)

### 1. Rendimiento del museo 3D en PC (`src/museum/`)
La versión móvil iba fluida pero en PC se sentía lenta. Causas encontradas y corregidas:
- **Regeneración del mapa de entorno en cada hover (causa principal).** `onReady` se pasaba como función inline, así que cada hover del mouse (que no existe en móvil) re-renderizaba `MuseumExperience`, cambiaba la identidad de `onReady` y el `useEffect` de `Scene` destruía y volvía a generar el PMREM completo. Ahora `onReady` es estable (`useCallback`) y se lee desde un ref.
- **`Scene` y `Artwork` memoizados (`React.memo`).** El hover de cada prenda vive en un `ref` local leído en `useFrame`: pasar el cursor ya no reconcilia las 30 obras ni la arquitectura.
- **Herrajes de los 30 racks con `InstancedMesh`.** Base, postes, barra, soportes, prendas de fondo, atril, cono de luz y lámpara pasan de ~360 draw calls a 9. El shader del cono aplica `instanceMatrix` y usa `FrontSide` (la mitad de sobre-dibujo aditivo).
- **Presupuesto de píxeles + DPR adaptativo.** El DPR se calcula según el tamaño de la ventana (máx. ~2,6 MP por fotograma en PC) y el antialiasing sólo se activa si el lienzo resultante es moderado. Un componente `AdaptiveDpr` mide los FPS cada segundo y baja/sube la resolución con histéresis.
- **Bug corregido:** `ProductPanel` usaba `useMemo` sin importarlo; el panel de la prenda en el museo fallaba al abrirse.

### 2. Paleta «Helénico Botánico Áureo» (`src/styles/global.css`, `/marca`)
- Marfil Pentélico `#F5F1E8`, Ciprés Nocturno `#0F1A14`, Laurel Profundo `#23432F`, Oro Antiguo `#B8964F`, Oro Claro `#DCC48E`, Oro Antiguo Texto `#7A5A22`, Basalto `#161917`.
- Regla del oro: el oro brillante es sólo ornamento (herrajes, grecas, bordes). El texto dorado sobre marfil usa `#7A5A22` (5,6:1, WCAG AA).
- Nuevos botones `btn--gold` y `btn--on-dark`; header claro sobre los heros oscuros.

### 3. Nueva portada «Atrio Áureo» (`src/pages/Home.jsx`)
- La fotografía del hero se reemplaza por un nicho en arco de travertino con la prenda destacada colgada (4 piezas en rotación), ramas de olivo y greca griega en oro, sobre fondo ciprés.
- Cifras clave, etiqueta flotante con nombre y precio, y precarga de la nueva imagen LCP en `index.html`.
- Nueva sección «Sneakers con precio de mercado» en la portada.

### 4. Rack de boutique lateral (`src/components/BoutiqueRack.jsx`)
- Las prendas cuelgan **de lado** sobre una barra dorada con remates, como en un perchero de tienda física (canto de tela visible en el color de la prenda).
- Al pasar el cursor (o enfocar con teclado) la percha gira y la prenda queda **de frente**, con etiqueta de nombre y precio. Clic o toque fija la prenda y abre la ficha de compra rápida.
- Arrastre con mouse, scroll táctil nativo, flechas del teclado y centrado automático de la percha activa.

### 5. Sistema de tallas (`src/components/SizeSelector.jsx`, `SizeGuide.jsx`, `src/data/sizing.js`)
- Existencias por talla (disponible / últimas unidades / agotada), talla recomendada marcada y medidor de calce (ceñido · fiel · amplio) según el patronaje.
- Guía de tallas en hoja lateral accesible: **Encuentra tu talla** (estatura, peso y preferencia de calce, o largo de pie para sneakers), tabla de medidas en cm/pulgadas y cómo medir.
- El perfil del visitante se guarda en el navegador y marca su talla en todo el sitio.

### 6. Mercado de Sneakers (`/sneakers`, `/sneakers/:id`)
- Listado tipo mercado de reventa: precio más bajo (también por talla), variación semanal, unidades vendidas, filtros por silueta y talla, y orden por precio, variación o ventas.
- Ficha con escenario de producto con inclinación 3D, vistas lateral/medial/detalle, precio por talla, **Comprar** o **Hacer oferta**, gráfico interactivo del historial de precio (1M/3M/6M/1A), últimas ventas, métricas de mercado y proceso de autenticación.
- El carrito acepta precio de mercado por línea (`add(id, talla, cantidad, precio)`).
- Los datos de mercado se generan de forma determinista en `src/data/market.js` hasta conectar el inventario real.

## [2.0.0] — Exposición "Ágora & Archivo" (Producción)

### 1. Optimización de Rendimiento 3D en PC (`src/museum/`)
- **Eliminación de luces puntuales dinámicas múltiples (`PointLight`)**: Se reemplazaron las luces puntuales por sala por iluminación hemisférica + direccional y piscinas de luz aditivas precalculadas, reduciendo drásticamente el costo de fragment shader en pantallas PC de alta resolución.
- **Geometrías y materiales compartidos + `InstancedMesh`**: Las columnas dóricas griegas se renderizan mediante `InstancedMesh` (un solo draw call) y los 30 marcos, paspartús, cartelas, conos de luz y jardineras comparten instancias de geometría y material en memoria.
- **Partículas en GPU (GLSL Vertex Shader)**: El sistema de polen/polvo atmosférico ahora calcula su movimiento íntegramente en la GPU mediante el uniforme `uTime`, eliminando el bucle de CPU por frame y las subidas constantes de buffers (`needsUpdate`).
- **Raycasting optimizado y texturas ligeras (`-sm.webp`)**: Se aplicó *throttling* al detector de movimiento del piso y se limitaron los eventos de puntero al lienzo frontal de cada obra.
- **Activación por defecto de animaciones en PC (`MotionContext.jsx`)**: Evita que la configuración del sistema operativo desactive involuntariamente las animaciones web y del museo 3D al abrir el sitio.

### 2. Transición de Proyecto Académico a Producción Comercial
- Se eliminaron todas las menciones a «proyecto académico», «tienda ficticia», «carrito simulado», «simulación académica» y «formulario de demostración» en `Footer.jsx`, `Cart.jsx`, `About.jsx`, `Contact.jsx`, `Product.jsx`, `README.md` y `package.json`.
- Se incorporaron textos de producción real: garantía de autenticidad con sello numerado, despacho asegurado, showroom en Bogotá y departamentos curatoriales.

### 3. Imagen Hero en Alta Resolución (`public/img/hero-hd.webp`)
- Nueva fotografía editorial en alta resolución (`2560×1440` en `hero-hd.webp`, `1920w` en `hero.webp` y `960w` en `hero-sm.webp`) ambientada en un pórtico dórico de granito con olivos mediterráneos, vitrina con torso de mármol clásico junto a un sneaker de archivo y visitante en streetwear.

### 4. Catálogo y Museo de 30 Productos (Streetwear + Historia en 5 Salas)
- **Sala I · Ágora & Diseñador (6 piezas)**: Raf Simons AW01 Riot Bomber, Rick Owens DRKSHDW Himatión Coat, Balenciaga Hoplita 880G Hoodie, Off-White™ Fresco Helénico Varsity, Maison Margiela Artisanal Cariátide Trench, Fear of God Eternal Estoa Blazer.
- **Sala II · Cosmos & Billionaire Boys Club (6 piezas)**: BBC Astronaut Oráculo Hoodie OG, BBC Icecream Pegaso Varsity, BBC Running Dog Selvedge Denim, BBC Starfield Delphi Full-Zip, BBC Dracma & Diamond Tee, BBC Arcadia Rover Cargo.
- **Sala III · Camuflaje & BAPE / Base (6 piezas)**: BAPE Shark Full-Zip Granite & Olive Camo, BAPE College Ape Head Relieve Pentélico Tee, BAPE 1st Camo Botánico M-65, VESTIGIO Base Columna Dórica 650 GSM Hoodie, Base Estrías Wide-Leg Trouser, Base Quios Heavy Waffle Longsleeve.
- **Sala IV · Monolito & Yeezy (6 piezas)**: Yeezy × Gap Engineered by Balenciaga Paloma de Atenea Hoodie, Yeezy Round Jacket Monolito, Yeezy Season 3 Cantera Anorak, Yeezy Season 6 Pilar Brutalista Sweatpants, Yeezy Season 1 Reliquia Textil Distressed Knit, Yeezy Season 5 Égida Utility Vest.
- **Sala V · Pedestal & Sneakers (6 piezas)**: Air Jordan 1 High OG "1985 Relic", Yeezy Boost 350 V1 "Turtle Dove" OG, BAPE STA™ Low "Pentelic & Olive", Yeezy Boost 700 "Wave Runner" OG, Off-White™ × Air Jordan 1 "The Ten", SB Dunk Low "Columba / Staple Archive".

### 5. Paleta Estilo Griego (Granito con Plantas) y Ambientación 3D
- Nueva paleta en CSS y 3D: **Granito Abisal (`#121514`)**, **Mármol Pentélico (`#F2EFE9`)**, **Laurel Botánico (`#5E9E7E`)**, **Bronce de Delfos (`#C8B07A`)**, **Ceniza de Olivo (`#A3ADA6`)** y **Granito Labrado (`#242B28`)**.
- Sala 3D ambientada con losas de granito moteado, muros de sillería helénica, columnas dóricas, jardineras de granito con olivos y laureles, y 6 esculturas temáticas.

### 6. Animación de Zoom-Out a la Marquilla para Elegir Talla
- En el catálogo (`ProductCard.jsx`), en la página de detalle (`Product.jsx`) y en la ficha del museo 3D (`MuseumExperience.jsx`), al seleccionar una prenda o elegir talla se ejecuta una animación de **zoom-out desde la marquilla tejida** del cuello o lengüeta, desplegando la etiqueta bordada interactiva con las tallas disponibles.

### 7. Nuevo Ícono de Carrito, Cápsula 3D al Añadir y Carrito Corriendo por la Pantalla
- Se reemplazó el ícono de bolsa por un **carrito de compras (`CartIcon`)**.
- Al añadir un producto (`flyToCart`), la prenda gira en 3D dentro de una cápsula sellada con estela de hojas de laurel y hace que el carrito levante las ruedas (*wheelie*) con partículas.
- Al hacer clic en el carrito (`runCartAcrossScreen`), un **carrito animado con ruedas giratorias y líneas de velocidad pasa corriendo dinámicamente frente a la pantalla**.

