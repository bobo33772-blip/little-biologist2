import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 이미 개발 서버가 떠 있는 상태에서 실수로 npm run dev를 한 번 더 실행하면, 기본값(false)은
    // 5173이 막혀 있을 때 조용히 다른 포트로 넘어가버린다 — 그러면 그 두 번째 vite는 뜨는데 같이
    // 떠야 할 API 서버(server/index.js)는 포트 충돌로 죽어서, "무슨 vite에 접속했느냐"에 따라
    // API 요청이 프록시 에러로 실패하는 혼란스러운 상태가 된다. strictPort로 그런 경우 조용히
    // 다른 포트로 넘어가지 말고 바로 에러를 내게 해서, 중복 실행을 바로 알아차리게 한다.
    strictPort: true,
    proxy: {
      // 곤충 사진 분류 프록시 서버(server/index.js)로 전달 — iNaturalist 토큰을
      // 프론트엔드에 노출하지 않기 위해 항상 이 경로를 거친다.
      '/api': 'http://localhost:5174',
      // AI 말벗 챗봇도 같은 프록시 서버(server/index.js)의 /chat 라우트로 보낸다.
      '/chat': 'http://localhost:5174',
    },
  },
})
