import { defineConfig } from 'vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ar: resolve(__dirname, 'public/ar.html'),
        admin: resolve(__dirname, 'public/admin.html')
      },
      output: {
        // HTMLファイルを正しい場所に出力
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // HTMLファイルは dist 直下に配置
          if (assetInfo.name?.endsWith('.html')) {
            return '[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  plugins: [
    {
      name: 'copy-and-fix-files',
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
          
          // HTMLファイルをpublic/からdist直下に移動
          const htmlFiles = ['admin.html', 'ar.html']
          htmlFiles.forEach(file => {
            const srcPath = resolve(distDir, 'public', file)
            const destPath = resolve(distDir, file)
            if (existsSync(srcPath) && !existsSync(destPath)) {
              copyFileSync(srcPath, destPath)
              console.log(`✓ Moved ${file} to dist root`)
            }
          })
          
          console.log('✓ All files processed')
        } catch (error) {
          console.warn('Failed to process files:', error.message)
        }
      }
    }
  ]
})