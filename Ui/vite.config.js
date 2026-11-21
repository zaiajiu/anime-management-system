import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' //引入Tailwind CSS
import path from 'path'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname,'./src')
    },
  },
})

