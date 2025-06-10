import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ar: resolve(__dirname, 'public/ar.html'),
        admin: resolve(__dirname, 'public/admin.html'),
        main: resolve(__dirname, 'public/index.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-static-files',
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
          
          console.log('✓ Static files copied to dist/')
        } catch (error) {
          console.warn('Failed to copy files:', error.message)
        }
      }
    }
  ]
})