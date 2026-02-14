import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/widget.js'),
      name: 'DailyBreathingPaywall',
      fileName: 'paywall',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'paywall.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'paywall.css'
          return assetInfo.name
        }
      }
    },
    cssCodeSplit: false
  },
  optimizeDeps: {
    include: ['@stripe/stripe-js']
  }
})
