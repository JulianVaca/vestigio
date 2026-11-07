import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' permite publicar en GitHub Pages bajo cualquier subruta
// (https://usuario.github.io/vestigio/). Se usa HashRouter para evitar 404.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
  },
})
