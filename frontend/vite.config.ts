import { defineConfig, PluginOption } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@wasm': resolve(__dirname, 'wasm'),
      croissant: resolve(__dirname, './croissant'),
    },
  },
  plugins: [
    react(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    wasm() as PluginOption,
    topLevelAwait(),
  ],
  optimizeDeps: {
    exclude: ['@wasm'],
  },
})
