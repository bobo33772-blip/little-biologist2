import { Suspense, useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthScreen } from './authVisuals'
import LoadingOverlay from '../../components/common/LoadingOverlay'
import { wakeServer } from '../../api/auth'
import { prefetchRoute } from '../../router/routeChunks'
import { whenSceneReady } from '../../utils/sceneReady'

// /login, /signup가 이 레이아웃 아래에서 전환된다. AuthScreen(배경+로고+카드
// 틀)은 여기서 한 번만 마운트되어 라우트가 바뀌어도 리마운트되지 않으므로
// 제목/로고는 그대로 있고, 카드 안 내용(Outlet)만 부드럽게 크로스페이드된다.
export default function AuthRouteLayout() {
  const location = useLocation()
  // <Outlet/>은 그릴 때마다 '지금' 주소의 화면을 읽어서, 사라지는 중인 로그인 카드도 이미 회원가입 폼을
  // 그렸다(두 번 바뀌어 보임). 이 렌더 시점의 화면 element를 받아 넣으면 AnimatePresence가 나가는 자식을
  // 그때 element 그대로 붙잡아 두므로, 나가는 카드는 끝까지 자기 화면을 그린다.
  const outlet = useOutlet()

  useEffect(() => {
    wakeServer()
  }, [])

  // 로그인↔회원가입은 서로 바로 오가므로 둘 다 지금 받아 둔다(카드 안 스피너 방지). 목장 청크는
  // 로그인 배경이 다 그려진 뒤에 받아, 첫 화면 그림과 회선을 다투지 않으면서 로그인 직후엔 준비돼 있게 한다.
  useEffect(() => {
    let cancelled = false
    prefetchRoute('login')
    prefetchRoute('signup')
    whenSceneReady().then(() => {
      if (!cancelled) prefetchRoute('ranch')
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthScreen>
      <motion.div layout transition={{ layout: { duration: 0.22, ease: 'easeOut' } }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Suspense fallback={<LoadingOverlay />}>
              {outlet}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AuthScreen>
  )
}
