import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure VITE_API_BASE_URL is properly defined for production builds
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://test-app-kam9.onrender.com/api')
  },
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
