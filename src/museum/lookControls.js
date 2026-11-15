/**
 * El giro positivo de Three.js mira hacia la izquierda y el pitch positivo hacia arriba.
 * Modo normal: arrastrar a la derecha mira a la derecha y arrastrar hacia abajo mira abajo.
 * Modo invertido: conserva los ejes originales del recorrido.
 */
export function getLookDelta(dx, dy, sensitivity, inverted = false) {
  const direction = inverted ? 1 : -1
  return {
    yaw: dx * sensitivity * direction,
    pitch: dy * sensitivity * 0.8 * direction,
  }
}
