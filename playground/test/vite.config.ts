import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@yunlefun/utils': path.resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },

  plugins: [vue()],

  server: {
    fs: {
      strict: false,
    },
  },
})
