import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/cart-widget.ts',
      name: 'CartWidget',
      formats: ['iife'],
      fileName: () => 'cart-widget.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'cart-widget.css'
      }
    }
  }
})

