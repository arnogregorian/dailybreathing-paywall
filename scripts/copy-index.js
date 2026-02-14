import { copyFileSync } from 'fs'

try {
  copyFileSync('index.html', 'dist/index.html')
  console.log('✓ Copied index.html to dist/')
} catch (error) {
  console.error('Error copying index.html:', error.message)
}
