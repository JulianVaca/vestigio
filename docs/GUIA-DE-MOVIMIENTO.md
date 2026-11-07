# Guía de movimiento — VESTIGIO

> Regla de oro: **cada movimiento responde a una pregunta del usuario** (¿dónde estoy?, ¿qué cambió?, ¿funcionó mi acción?, ¿qué miro primero?). Si una animación no responde ninguna, se elimina.

## 1. Tokens

| Token | Curva | Duración | Uso |
|---|---|---|---|
| **Entrada** | `cubic-bezier(0.22, 1, 0.36, 1)` | 0.5 – 1.0 s | Elementos que aparecen: salen rápido y se posan suave (ease-out) |
| **Telón** | `cubic-bezier(0.76, 0, 0.24, 1)` | 0.45 – 0.55 s | Transiciones de página, menú móvil, rellenos de botón (in-out con peso) |
| **Recorrido** | easeInOutCubic | 0.9 – 4.2 s (según distancia) | Cámara del museo 3D |
| **Rebote** | spring (600, 14) | ~0.4 s | Contador del carrito, ícono al recibir un producto |
| **Lineal** | `none` | ligado al scroll | Parallax y lectura del manifiesto (scrub) |

Duraciones: micro-interacciones ≤ 300 ms · entradas de contenido 600–1000 ms · nunca bloquear la interacción más de 600 ms.

## 2. Principios de animación aplicados

| Principio | Dónde | Intención |
|---|---|---|
| **Tiempo (timing)** | Botones 0.2–0.35 s, telón 0.5 s, cámara según distancia | Lo pequeño responde rápido; lo grande (cambiar de página o de sala) se toma su tiempo |
| **Aceleración (slow in / slow out)** | Toda la cámara 3D, telón de página | El visitante acelera y frena como una persona, no como un robot |
| **Anticipación** | Botón "Añadir" se comprime antes de confirmar; la imagen sube antes de volar al carrito; la cámara mira hacia dónde va antes de girar a la obra | Prepara al ojo para la acción principal |
| **Arcos** | Vuelo de la prenda al carrito (X ease-out + Y ease-in = parábola) | Trayectoria natural, conecta el producto con el carrito |
| **Seguimiento / superposición** | La mirada de la cámara se amortigua y llega después del cuerpo | Sensación física de caminar |
| **Jerarquía / escalonamiento (stagger)** | Hero: imagen → titular → texto → botones; grillas en cascada | Dicta el orden de lectura |
| **Exageración controlada** | Badge del carrito con rebote | Confirma la acción más importante del negocio |
| **Acción secundaria** | Polvo flotando en el museo, escultura que respira | Atmósfera sin competir con la prenda |

## 3. Inventario de animaciones

### Globales
- **Transición de página "telón"** — un panel terracota sube y otro se retira. *Intención:* marcar el cambio de "sala" del sitio. `PageTransition.jsx`
- **Header que se esconde al bajar** — *Intención:* liberar pantalla mientras se lee; vuelve al subir porque el usuario busca navegar. `Header.jsx`
- **Subrayado compartido del menú** (`layoutId`) — *Intención:* indicar dónde estoy.
- **Logo que se dibuja** al cargar (stroke-dashoffset). *Intención:* identidad.

### Inicio
- **Hero**: Ken Burns + titular enmascarado línea por línea + parallax con el puntero. *Intención:* primera impresión, jerarquía.
- **Manifiesto**: palabras que se iluminan al ritmo del scroll. *Intención:* controlar la velocidad de lectura.
- **Corredor CSS 3D**: el scroll avanza por una galería. *Intención:* anticipar la experiencia del museo sin cargar Three.js.
- **Marquee** continuo. *Intención:* comunicar novedades sin ocupar espacio.

### Catálogo y producto
- **Filtros con animación de layout (FLIP)**: las tarjetas que salen se encogen, las que quedan se deslizan. *Intención:* explicar qué cambió.
- **Hover de tarjeta**: zoom lento + "Añadir rápido" desde abajo. *Intención:* revelar la acción sólo cuando hay interés.
- **Zoom que sigue al cursor** en la foto de producto. *Intención:* inspeccionar la tela.
- **Selector de talla** con píldora que se desliza; **sacudida** si falta la talla. *Intención:* feedback de error sin texto rojo agresivo.
- **Botón "Añadir"**: compresión (anticipación) → vuelo al carrito (arco) → rebote del ícono → texto cambia a "Añadido".

### Carrito
- Líneas que se colapsan al eliminar; **total que rueda** hasta su nuevo valor; barra de envío gratis con resorte; check que se dibuja al confirmar.

### Museo 3D
- **Recorrido guiado** con aceleración y mirada amortiguada.
- **Anillo en el piso** que indica a dónde vas a caminar (verde/hueso = se puede, terracota = bloqueado).
- **Hover sobre obra**: se acerca 3.5 % y su halo de luz se intensifica.
- **Rótulo de sala** que cambia con un deslizamiento vertical al cruzar un muro.
- **Pieza original "Ánfora textil"**: vestido generado por revolución cuyos pliegues se calculan en un *vertex shader*.

## 4. Accesibilidad y movimiento reducido

- Se respeta `prefers-reduced-motion` del sistema **y** existe un botón en el header (ícono de onda) para activarlo/desactivarlo manualmente; la preferencia se guarda.
- Con movimiento reducido:
  - CSS: duraciones a 0.01 ms, sin marquee ni indicadores en bucle.
  - Framer Motion: `MotionConfig reducedMotion="always"` (sólo cambios de opacidad).
  - GSAP: no se registran animaciones de scroll; el contenido se muestra directo.
  - Transición de página: fundido de 150 ms.
  - Museo: los viajes de cámara son **cortes**, sin balanceo de pasos, sin polvo, esculturas quietas.
  - Vuelo al carrito: se omite (el toast y el contador siguen confirmando la acción).
- Sólo se animan `transform` y `opacity` (compuestas en GPU) para mantener 60 fps.

## 5. Presupuesto de rendimiento

| Recurso | Límite | Real |
|---|---|---|
| Imagen hero | ≤ 60 KB | 36 KB (WebP 1600 px) / 14 KB móvil |
| Foto de producto | ≤ 40 KB | 12–29 KB (excepto Mosaico 72 KB por el tejido) |
| JS inicial (gzip) | ≤ 200 KB | ver `npm run build` |
| Museo 3D | carga diferida | sólo se descarga al entrar a `/museo` |
