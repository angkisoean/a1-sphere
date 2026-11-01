import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // The SDK ships this subpath but doesn't declare it in package.json "exports".
      // Direct alias to the physical file so Vite/Rolldown can resolve it.
      '@unicitylabs/sphere-sdk/impl/browser/connect':
        import.meta.dirname + '/node_modules/@unicitylabs/sphere-sdk/dist/impl/browser/connect/index.js',
    },
  },
})

