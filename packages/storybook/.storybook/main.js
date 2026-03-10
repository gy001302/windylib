import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

const configDir = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(configDir, '..')
const childProcessShimPath = resolve(packageDir, 'src/shims/childProcessShim.js')
const coreEntryPath = resolve(packageDir, '../core/src/index.js')
const mapsEntryPath = resolve(packageDir, '../maps/src/index.js')

export default {
  stories: ['../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../../../public'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(config) {
    return {
      ...config,
      plugins: [...(config.plugins ?? []), react()],
      optimizeDeps: {
        ...(config.optimizeDeps ?? {}),
        exclude: [...(config.optimizeDeps?.exclude ?? []), '@windylib/core', '@windylib/maps'],
      },
      resolve: {
        ...(config.resolve ?? {}),
        alias: [
          ...(Array.isArray(config.resolve?.alias) ? config.resolve.alias : []),
          { find: 'child_process', replacement: childProcessShimPath },
          { find: /^@windylib\/core$/, replacement: coreEntryPath },
          { find: /^@windylib\/maps$/, replacement: mapsEntryPath },
        ],
      },
    }
  },
}
