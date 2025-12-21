import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/services': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/dashboard': 'http://localhost:3000',
      '/incidents': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/services': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/dashboard': 'http://localhost:3000',
      '/incidents': 'http://localhost:3000',
      // '/status': 'http://localhost:3000', // Removed to let React Router handle /status
    }
  }
})
