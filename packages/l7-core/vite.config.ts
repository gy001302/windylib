import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { string } from 'rollup-plugin-string';

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    // Prefer TypeScript sources over generated JS files that currently coexist in src/.
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  },
  plugins: [
    string({
      include: ['**/*.glsl'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.ts'),
      name: 'L7Core',
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        '@antv/async-hook',
        '@antv/l7-utils',
        '@babel/runtime',
        '@turf/helpers',
        '@windylib/until',
        'ajv',
        'element-resize-event',
        'eventemitter3',
        'gl-matrix',
        'inversify',
        'inversify-inject-decorators',
        'l7-tiny-sdf',
        'l7hammerjs',
        'lodash',
        'reflect-metadata',
        'viewport-mercator-project',
      ],
    },
  },
});
