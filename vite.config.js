import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pob/',
  server: {
    host: '0.0.0.0', // Expose to network for local testing (e.g. tablet on same wifi)
    proxy: {
      '/pob/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pob\/api/, '')
      },
      '/pob/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        rewrite: (path) => path.replace(/^\/pob\/socket.io/, '/socket.io')
      }
    }
  }
})
