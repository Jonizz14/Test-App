import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure VITE_API_BASE_URL is properly defined for production builds
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          antd: ['antd', '@ant-design/icons'],
          xlsx: ['xlsx'],
          charts: ['chart.js', 'react-chartjs-2'],
          echarts: ['echarts', 'echarts-for-react'],
          utils: ['axios', 'dayjs', 'i18next', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  preview: {
    host: true,
    port: 5173,
    cors: true,
  }
})
