// vite.config.js configures the Vite build tool.
// We add the Tailwind plugin here so Vite processes
// Tailwind utility classes during build.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // proxy API calls to backend during development
  // /api/anything → http://localhost:3000/api/anything
  // avoids CORS issues when frontend and backend run on different ports
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})