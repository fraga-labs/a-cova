import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Base relativa: o build pode servirse desde calquera subruta
// (GitHub Pages incluído) sen tocar a configuración.
export default defineConfig({
  base: './',
  plugins: [react()],
  // `strictPort`: se o 5190 estivese collido preferimos fallar a que Vite
  // salte a outro porto en silencio. O 5180 xa e do editor de
  // yggdrasil-forge (examples/editor) e o solape confunde.
  server: { port: 5190, strictPort: true },
})
