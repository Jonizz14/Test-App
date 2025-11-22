import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173, // Default port
    strictPort: false, // Allow fallback to another port if 5173 is taken
    cors: true, // Enable CORS
    hmr: {
      port: 5173,
    }
  },
  preview: {
    host: true,
    port: 5173,
    cors: true,
  }
})
