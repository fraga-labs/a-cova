import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Base relativa: o build pode servirse desde calquera subruta
// (GitHub Pages incluído) sen tocar a configuración.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180 },
})
