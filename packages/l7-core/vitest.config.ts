import { defineConfig } from 'vitest/config';
import { string } from 'rollup-plugin-string';

export default defineConfig({
  plugins: [
    string({
      include: ['**/*.glsl'],
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
    include: ['__tests__/**/*.spec.ts', 'src/**/__tests__/**/*.spec.ts'],
    exclude: ['dist/**', 'es/**', 'lib/**', 'node_modules/**'],
  },
});
