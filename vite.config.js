import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Three.js / R3F NO se agrupan a mano: el import() diferido del museo ya los separa.
        // Agruparlos arrastraba módulos compartidos (React, scheduler) al chunk y obligaba
        // a la portada a descargar y ejecutar 925 KB de Three.js en cada visita.
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap'
          }
        },
      },
    },
  },
})
