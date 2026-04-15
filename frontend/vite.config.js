import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Verifique se esta linha existe

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // E esta também
  ],
})