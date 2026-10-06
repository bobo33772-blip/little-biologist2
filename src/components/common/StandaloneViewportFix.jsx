import { useEffect } from 'react'
import { isIosHomeScreenApp, isStandaloneWebApp } from '../../utils/platform'

// 홈 화면 웹 앱(특히 아이폰)을 세로로 열었다가 가로로 돌리면, iOS가 문서를 상태 바 높이만큼 밀어 둔 채로
// 두는 경우가 있다. 화면 위에 빈 띠가 생기고 그만큼 아래(목장 메뉴 이름 등)가 잘린다.
// 이때 scrollY는 0으로 보여서 페이지가 알아채기 어렵다. 회전·크기 변경 뒤에 이런 "보이지 않는 밀림"을
// 찾으면 스크롤 위치를 다시 지정해 되돌린다. 브라우저 탭 동작은 바꾸지 않도록 홈 화면 웹 앱에서만 켠다.
// 같은 문제를 겪은 다른 홈 화면 웹 앱의 해결 방법(밀림을 감지하면 scrollTo)을 따랐다. 자세한 내용은
// docs/devlog/004-fill-landscape-screen.md 참고.
const KEYBOARD_MIN_HEIGHT = 150
// 회전 애니메이션이 끝나고 iOS가 화면 크기를 다시 정할 때까지 몇 번 더 확인한다.
const RECHECK_DELAYS_MS = [0, 250, 800]

function isViewportShifted() {
  const vv = window.visualViewport
  if (vv) {
    // 손가락으로 확대한 상태나 키보드가 열린 상태에서는 화면이 밀려 있는 게 정상이라 건드리지 않는다.
    if (Math.abs(vv.scale - 1) > 0.01) return false
    if (window.innerHeight - vv.height > KEYBOARD_MIN_HEIGHT) return false
    if (Math.abs(vv.offsetTop) >= 1 || Math.abs(vv.offsetLeft) >= 1) return true
  }
  // 정상이라면 문서 맨 위의 화면상 위치는 항상 -scrollY다. 다르면 페이지가 모르는 밀림이 있다.
  const rootTop = document.documentElement.getBoundingClientRect().top
  return window.scrollY < 0 || Math.abs(rootTop + window.scrollY) >= 1
}

function resetShiftedViewport() {
  if (!isViewportShifted()) return
  // 스크롤되는 화면(도감 등)은 보던 위치를 지키고, 위로 당겨진 상태(음수)만 0으로 되돌린다.
  const y = Math.max(0, window.scrollY)
  window.scrollTo(0, y)
  if (document.scrollingElement) document.scrollingElement.scrollTop = y
}

export default function StandaloneViewportFix() {
  useEffect(() => {
    if (!isStandaloneWebApp) return undefined

    // 가로 폰에서 iOS가 남겨 두는 세로 때의 위쪽 안전 영역 값을 무시하기 위한 표시(index.css 참고).
    if (isIosHomeScreenApp) document.documentElement.classList.add('ios-home-screen-app')

    const timers = new Set()
    const schedule = () => {
      for (const delay of RECHECK_DELAYS_MS) {
        const id = window.setTimeout(() => {
          timers.delete(id)
          resetShiftedViewport()
        }, delay)
        timers.add(id)
      }
    }
    const orientation = window.screen?.orientation

    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    orientation?.addEventListener?.('change', schedule)
    schedule()

    return () => {
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      orientation?.removeEventListener?.('change', schedule)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return null
}
