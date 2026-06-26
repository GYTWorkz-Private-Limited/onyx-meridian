import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server. In mock mode (default, VITE_USE_MOCK=true) the API is
// answered in-process by src/api/mock.js and the proxy below is unused. When a
// real backend exists, set VITE_USE_MOCK=false and /api is proxied to it.
export default defineConfig({
  plugins: [react()],
  // App.jsx resolves the active page by component function name, so the minifier
  // must NOT mangle names — otherwise routing breaks in a production build.
  esbuild: { keepNames: true },
  server: {
    port: 5173,
    open: false,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3100',
    },
  },
})
