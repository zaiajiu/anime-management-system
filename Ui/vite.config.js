import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'   // ← 添加这一行
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // ← 添加这一行
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
