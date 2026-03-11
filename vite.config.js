import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { string } from 'rollup-plugin-string'

const rootDir = dirname(fileURLToPath(import.meta.url))

const internalAliases = {
  '@windylib/core': resolve(rootDir, 'packages/core/src/index.js'),
  '@windylib/layers': resolve(rootDir, 'packages/layers/src/index.js'),
  '@windylib/maps-leaflet': resolve(rootDir, 'packages/maps/leaflet/src/index.js'),
  '@windylib/maps-maplibre': resolve(rootDir, 'packages/maps/maplibre/src/index.js'),
  '@windylib/until': resolve(rootDir, 'packages/until/src/index.ts'),
  '@antv/l7-core': resolve(rootDir, 'packages/l7-core/src/index.ts'),
  child_process: resolve(rootDir, 'packages/storybook/src/shims/childProcessShim.js'),
}

export default defineConfig(({ mode }) => {
  if (mode === 'window') {
    return {
      resolve: {
        alias: internalAliases,
        extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
      },
      plugins: [
        string({
          include: ['**/*.glsl'],
        }),
      ],
      build: {
        lib: {
          entry: resolve(rootDir, 'src/window.js'),
          name: 'wl',
          fileName: () => 'wl.js',
          formats: ['iife'],
        },
        outDir: 'dist/window',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
          output: {
            exports: 'named',
          },
        },
      },
    }
  }

  return {}
})
