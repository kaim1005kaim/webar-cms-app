import { defineConfig } from 'vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
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
      name: 'copy-root-files',
      writeBundle() {
        try {
          const distDir = resolve(__dirname, 'dist')
          
          // models.jsonをコピー（publicディレクトリ外）
          if (existsSync(resolve(__dirname, 'models.json'))) {
            copyFileSync(
              resolve(__dirname, 'models.json'),
              resolve(distDir, 'models.json')
            )
          }
          
          // keyholder-projects.jsonをコピー（publicディレクトリ外）
          if (existsSync(resolve(__dirname, 'keyholder-projects.json'))) {
            copyFileSync(
              resolve(__dirname, 'keyholder-projects.json'),
              resolve(distDir, 'keyholder-projects.json')
            )
          }
          
          console.log('✓ Root files copied to dist/')
        } catch (error) {
          console.warn('Failed to copy root files:', error.message)
        }
      }
    }
  ]
})