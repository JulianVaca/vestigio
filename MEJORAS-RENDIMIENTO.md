# VESTIGIO — Optimización de rendimiento 

## Cambios realizados

1. **`src/data/products.js`:** consulta de productos mediante `Map` por identificador en lugar de recorrer el arreglo en cada búsqueda; reutilización de un `Intl.NumberFormat` para pesos colombianos. No cambian los precios ni las cadenas producidas.
2. **`src/data/market.js`:** reutilización de `Intl.DateTimeFormat` por opciones. Mejora la construcción de fechas en gráficas y transacciones.
3. **`src/museum/layout.js`:** el recorrido que asigna las posiciones a las obras ahora usa contadores por sala, sin reconstruir el subconjunto completo para cada pieza. Mantiene coordenadas y orden.
4. **`src/pages/Catalog.jsx`:** listas de productos agrupadas una sola vez por sala y filtradas mediante `useMemo` en el modo de cinco racks. Se evitan filtros repetidos al actualizar la pantalla.
5. **`src/pages/Sneakers.jsx`:** total de ventas precomputado una vez en vez de volver a sumarlo en cada render de filtros y ordenaciones.
6. **`src/components/BoutiqueRack.jsx`:** se precargan solo las dos primeras imágenes por rack; el resto conserva carga diferida nativa, reduciendo solicitudes innecesarias cuando se muestran cinco racks. Se conservan las 30 piezas y la selección interactiva.
7. **`src/pages/Home.jsx`:** la rotación automática del destacado no procesa cambios de diapositiva mientras la pestaña está oculta; continúa al volver.
8. **`index.html`:** eliminación de tres enlaces `preload` a `node_modules`, rutas inválidas una vez publicado con Vite. Las fuentes siguen incluidas en `fonts.css` con `font-display: swap` y sus URL correctas son resueltas por Vite.

## Conservación del comportamiento

- Sin cambios en dependencias, estructura de rutas, datos del catálogo, filtros, precios, tallas, carrito, animaciones o archivos WebP.
- Se mantienen intactas las experiencias WebGL, incluido el modo de detalle de ropa y el recorrido del museo.
- No se eliminan recursos gráficos ni se altera el aspecto visual.

## Validación y límites

- `node --check` para todos los archivos JavaScript `.js` (sin JSX).
- Pruebas de regresión de datos (`tests/performance-regression.mjs`): 30 piezas, búsquedas equivalentes, catálogo por salas, posiciones 3D originales, formato COP y coherencia de mercado.
- El build de Vite requiere `npm ci` con acceso a paquetes: en este entorno no estaban disponibles todas las dependencias en la caché local (`ENOTCACHED` para `zustand`), por lo que no se pudo ejecutar la compilación ni pruebas visuales de navegador. No se afirma una ganancia porcentual de FPS sin medición real.

## Ejecutar

```bash
npm ci
npm run build
node --test tests/performance-regression.mjs
npm run dev
```

