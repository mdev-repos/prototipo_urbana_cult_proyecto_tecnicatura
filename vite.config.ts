import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: el sitio funciona en GitHub Pages sin importar el nombre del repo.
  base: './',
  plugins: [react()],
})
