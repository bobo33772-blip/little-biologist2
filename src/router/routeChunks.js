import { lazyWithPreload } from '../utils/lazyWithPreload'
import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'

// 로그인·회원가입 카드 내용은 로그아웃 상태로 앱을 열면 바로 보이는 첫 화면이고, 둘 합쳐 약 8KB라
// 메인 번들에 넣는다. 지연 로드하면 미리 받아도 첫 화면 카드 안에 '불러오는 중' 스피너가 잠깐 끼었다.
// 다른 화면과 똑같이 preload()를 부를 수 있게만 맞춰 둔다.
function eager(Component) {
  Component.preload = () => Promise.resolve()
  return Component
}

// 라우트 단위 코드 스플리팅: 접속한 화면의 JS만 받아오도록 페이지를 전부 지연 로드한다.
// (예: /login만 열어도 목장·상점·퀴즈 등 다른 페이지 JS까지 같이 받아오는 걸 막는다.)
// 대신 갈 것 같은 화면은 미리 받아 둬서(prefetchRoute) 첫 진입 때 '불러오는 중' 스피너가 끼지 않게 한다.
export const routes = {
  login: eager(Login),
  signup: eager(Signup),
  ranch: lazyWithPreload(() => import('../pages/Ranch')),
  ranchHabitat: lazyWithPreload(() => import('../pages/RanchHabitat')),
  exploration: lazyWithPreload(() => import('../pages/Exploration')),
  fieldGuide: lazyWithPreload(() => import('../pages/FieldGuide')),
  quests: lazyWithPreload(() => import('../pages/Quests')),
  friends: lazyWithPreload(() => import('../pages/Friends')),
  friendRanch: lazyWithPreload(() => import('../pages/FriendRanch')),
  friendRanchHabitat: lazyWithPreload(() => import('../pages/FriendRanchHabitat')),
  friendFieldGuide: lazyWithPreload(() => import('../pages/FriendFieldGuide')),
  shop: lazyWithPreload(() => import('../pages/Shop')),
  bag: lazyWithPreload(() => import('../pages/Bag')),
  aiCompanion: lazyWithPreload(() => import('../pages/AiCompanion')),
  quiz: lazyWithPreload(() => import('../pages/Quiz')),
  profile: lazyWithPreload(() => import('../pages/Profile')),
}

// App.jsx의 <Route path>와 같은 규칙으로 주소를 routes 키로 바꾼다. 모르는 주소는 null.
export function routeKeyForPath(pathname) {
  const path = (pathname || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (path === '/login') return 'login'
  if (path === '/signup') return 'signup'
  if (path === '/ranch') return 'ranch'
  if (/^\/ranch\/[^/]+$/.test(path)) return 'ranchHabitat'
  if (path === '/exploration') return 'exploration'
  if (path === '/field-guide') return 'fieldGuide'
  if (path === '/quests') return 'quests'
  if (path === '/friends') return 'friends'
  if (/^\/friends\/ranch\/[^/]+$/.test(path)) return 'friendRanch'
  if (/^\/friends\/ranch\/[^/]+\/[^/]+$/.test(path)) return 'friendRanchHabitat'
  if (/^\/friends\/field-guide\/[^/]+$/.test(path)) return 'friendFieldGuide'
  if (path === '/shop') return 'shop'
  if (path === '/bag') return 'bag'
  if (path === '/ai-companion') return 'aiCompanion'
  if (path === '/quiz') return 'quiz'
  if (path === '/profile' || path === '/profile/edit') return 'profile'
  return null
}

// 미리받기는 실패해도 조용히 넘어간다 — 실제로 그 화면에 갈 때 lazy가 다시 받고, 그때도
// 실패하면 원래처럼 오류가 난다.
export function prefetchRoute(key) {
  return routes[key]?.preload().catch(() => {})
}

// 지금 당장 필요하진 않은 화면들을 유휴 시간에 하나씩 순서대로 받는다. 한꺼번에 받으면 막
// 그려지는 그림·소리와 회선을 다투므로 하나를 다 받은 뒤 다음 유휴 시간에 다음 것을 받는다.
// 데이터 절약 모드면 아예 받지 않는다(그 화면에 갈 때 받는다). 반환값으로 중간에 멈출 수 있다.
export function prefetchRoutesInIdle(keys) {
  if (typeof window === 'undefined' || navigator.connection?.saveData) return () => {}
  const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 200))
  const cancel = window.cancelIdleCallback || window.clearTimeout
  let cancelled = false
  let handle = null
  const queue = [...keys]

  function next() {
    handle = null
    if (cancelled) return
    const key = queue.shift()
    if (!key) return
    Promise.resolve(prefetchRoute(key)).then(() => {
      if (cancelled) return
      handle = schedule(next)
    })
  }

  handle = schedule(next)
  return () => {
    cancelled = true
    if (handle !== null) cancel(handle)
  }
}
