import { defineConfig } from 'vitest/config'

// Config separada da de Vite a propósito: vitest trae a súa propia
// copia de Vite e mesturar as dúas nun só ficheiro fai chocar os tipos
// dos plugins. As probas son de Node puro — non precisan o plugin React.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
