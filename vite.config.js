import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cambiá 'recmil-form' por el nombre exacto de tu repo en GitHub
export default defineConfig({
  plugins: [react()],
  base: '/recmil-form/',
})
