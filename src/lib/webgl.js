// ¿Puede este navegador abrir un contexto WebGL? Se comprueba una vez por sesión:
// el perchero y el pedestal 3D lo consultan antes de descargar Three.js.
let webglOk = null

export function hasWebGL() {
  if (webglOk === null) {
    try {
      const c = document.createElement('canvas')
      webglOk = Boolean(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webglOk = false
    }
  }
  return webglOk
}
