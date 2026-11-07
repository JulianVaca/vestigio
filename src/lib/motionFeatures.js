// Funciones de animación de framer-motion (gestos, layout, layoutId) cargadas de forma diferida.
// La app usa el componente ligero `m` con <LazyMotion>; este módulo se descarga después del
// primer render, así el núcleo de animación no bloquea la carga de ninguna página.
import { domMax } from 'framer-motion'

export default domMax
