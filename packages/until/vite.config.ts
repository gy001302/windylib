import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { string } from 'rollup-plugin-string';

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    string({
      include: ['**/*.glsl'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(packageDir, 'src/index.ts'),
      name: 'UntilShaders',
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
  },
});
