import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The Java API (apps/api). `docker compose up` runs it on 8080.
    proxy: { '/api': 'http://localhost:8080' },
  },
})
