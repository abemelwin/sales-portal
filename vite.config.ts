/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const buildTime = Date.now().toString()

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime)
  },
  plugins: [
    vue(),
    {
      name: 'generate-version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: buildTime })
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec,property}.{ts,tsx}'
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage'
    }
  }
})
