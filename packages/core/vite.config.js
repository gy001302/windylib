import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const packageDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.js'),
      name: 'WindyLib',
      fileName: 'index',
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@luma.gl/constants',
        '@luma.gl/core',
        '@luma.gl/engine',
        '@luma.gl/webgl',

      ],
    },
  },
})
