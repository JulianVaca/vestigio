# Boutique física — diseño

## Intención

Quien entra a VESTIGIO debe sentirse dentro de una boutique cara y notar, al tocar las cosas, lo bien hecha que está. Toda la web de scroll se comporta como una tienda física. El museo 3D es una experiencia aparte y no se modifica.

## Decisiones de Julián

- La llegada es una puerta inmersiva que se abre.
- La puerta tiene un botón para ir directo al museo 3D.
- El perchero debe ser 3D y realista.
- La parte de sneakers debe ser realista, con modelos 3D conseguidos de internet.
- El catálogo (nombres, descripciones, piezas) puede cambiarse para ajustarse a los modelos disponibles.
- Las páginas de scroll siguen siendo páginas de scroll.

## Decisiones del constructor

- La identidad actual se conserva: paleta ciprés y oro, Fraunces, tokens de movimiento existentes.
- La puerta es CSS 3D, no WebGL, para que aparezca al instante. Se muestra sólo al llegar por la portada, una vez por visita, y nunca con movimiento reducido.
- El único modelo descargado es `public/models/MaterialsVariantsShoe.glb` (© 2021 Shopify, CC-BY 4.0, repositorio KhronosGroup/glTF-Sample-Assets). Trae tres colores: Beach, Midnight, Street. La web debe mostrar el crédito a Shopify.
- No se encontró ropa 3D con licencia libre clara. Las prendas se montan con las fotos existentes sobre mobiliario 3D propio.
- Three.js sigue cargándose de forma diferida: nada de WebGL en el primer render de la portada.

## Etapas

1. **Puerta de entrada** — hecha: `src/components/EntranceDoor.jsx`, `src/styles/door.css`.
2. **Perchero 3D real** — hecho: `src/rack3d/Rack3D.jsx`, `src/styles/rack3d.css`, integrado en `BoutiqueRack`. Barra y perchas en WebGL, prendas con grosor (once capas del recorte), balanceo con inercia, sombras de contacto. Los recortes con alfa (`public/img/products/*-cut.webp`) y su encuadre (`src/rack3d/cuts.json`) los genera `scripts/cut-garments.py`. El riel clásico sigue en el DOM para teclado, lectores de pantalla, movimiento reducido y calzado. Three.js se descarga sólo cuando un perchero se acerca a la pantalla.
3. **Sneakers** — repisas iluminadas; el modelo 3D gira 360° y cambia entre sus tres colores. Tres de los seis sneakers del catálogo se adaptan a esos colores.
4. **Capa de respuesta** — hero que reacciona al cursor, tarjetas de producto, botones con peso, secciones ligadas al scroll.

## Lo que no debe pasar

- Perder la fluidez ganada en los commits de rendimiento.
- Mostrar un producto 3D distinto del que se vende.
- Ignorar el botón de movimiento reducido.
