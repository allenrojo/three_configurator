import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // For relative paths if deploying to subdirectory
  server: {
    port: 3000, // or whatever port you prefer
    open: true // automatically open browser
  }
})