import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { isNativeApp, isStandaloneWebApp } from '../../utils/platform'

// 같은 화면 안에서 오가는 주소 쌍. 화면이 다시 그려지지 않으니 보던 위치를 그대로 둔다.
const SAME_SCREEN_PAIRS = [['/profile', '/profile/edit']]

function isSameScreen(from, to) {
  return SAME_SCREEN_PAIRS.some(([a, b]) => (from === a && to === b) || (from === b && to === a))
}

// 화면을 옮기면 맨 위에서 시작한다. 그대로 두면 앞 화면(상점 등)에서 내려 둔 scrollY가 이어져 새 화면이
// 중간부터 보인다. 주소(pathname)가 바뀔 때만 보고 search·state 변화는 무시한다.
// 브라우저 탭의 뒤로가기(POP)는 브라우저가 보던 위치를 되돌려 주는 기존 동작을 유지한다(웹 동작 유지).
// 앱·홈 화면 웹 앱은 그런 복원이 없는 '앱 화면'이라 뒤로가기도 맨 위에서 시작한다.
// 위로 당겨진 밀림(음수) 보정은 StandaloneViewportFix가 맡는다.
export default function RouteScrollReset() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPathRef = useRef(pathname)

  // 앱·홈 화면 웹 앱에서는 브라우저의 스크롤 복원을 끈다. 켜 두면 뒤로가기 때 여기서 0으로 올린 뒤에
  // 브라우저가 예전 위치(줄어든 화면 높이에 맞춰 잘린 값)로 다시 내려 버린다(Chromium에서 확인).
  useLayoutEffect(() => {
    if (!isNativeApp && !isStandaloneWebApp) return
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  useLayoutEffect(() => {
    const previous = previousPathRef.current
    previousPathRef.current = pathname
    if (previous === pathname) return
    if (navigationType === 'POP' && !isNativeApp && !isStandaloneWebApp) return
    if (isSameScreen(previous, pathname)) return
    window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
