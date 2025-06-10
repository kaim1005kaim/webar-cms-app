import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
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
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
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
          // models.jsonをコピー
          copyFileSync(
            resolve(__dirname, 'models.json'),
            resolve(__dirname, 'dist/models.json')
          )
          
          // keyholder-projects.jsonをコピー
          if (existsSync(resolve(__dirname, 'keyholder-projects.json'))) {
            copyFileSync(
              resolve(__dirname, 'keyholder-projects.json'),
              resolve(__dirname, 'dist/keyholder-projects.json')
            )
          }
          
          // markersディレクトリを作成
          const markersDir = resolve(__dirname, 'dist/markers')
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