import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn('\n[vite] 백엔드 서버(포트 5001)에 연결할 수 없습니다.')
            console.warn('       프로젝트 루트에서 "npm run dev"를 실행하면 서버와 클라이언트가 함께 실행됩니다.\n')
          })
        }
      }
    }
  }
})
