# Registro de Cambios (Changelog) — VESTIGIO v2.0

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

