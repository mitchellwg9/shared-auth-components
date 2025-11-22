import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Vite config for demo app
export default defineConfig({
  plugins: [react()],
  base: '/app/demo/',
  resolve: {
    alias: {
      // Import from parent src folder
      '@wayne/shared-auth': resolve(__dirname, '../src/index.js'),
      // Ensure React is resolved correctly
      'react': resolve(__dirname, '../node_modules/react'),
      'react-dom': resolve(__dirname, '../node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: ['nodemailer'], // Exclude nodemailer (Node.js only, not for browser)
  },
  build: {
    rollupOptions: {
      external: ['nodemailer'], // Don't bundle nodemailer
    },
  },
})

