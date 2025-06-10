import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        ar: resolve(__dirname, 'public/ar.html'),
        admin: resolve(__dirname, 'public/admin.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-ar-files',
      writeBundle() {
        try {
          const distDir = resolve(__dirname, 'dist')
          
          // models.jsonをコピー
          if (existsSync(resolve(__dirname, 'models.json'))) {
            copyFileSync(
              resolve(__dirname, 'models.json'),
              resolve(distDir, 'models.json')
            )
          }
          
          // keyholder-projects.jsonをコピー
          if (existsSync(resolve(__dirname, 'keyholder-projects.json'))) {
            copyFileSync(
              resolve(__dirname, 'keyholder-projects.json'),
              resolve(distDir, 'keyholder-projects.json')
            )
          }
          
          // markersディレクトリを作成
          const markersDir = resolve(distDir, 'markers')
          if (!existsSync(markersDir)) {
            mkdirSync(markersDir, { recursive: true })
          }
          
          console.log('✓ AR files copied to dist/')
        } catch (error) {
          console.warn('Failed to copy AR files:', error.message)
        }
      }
    }
  ]
})