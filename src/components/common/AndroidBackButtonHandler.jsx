import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { useTutorial } from '../../context/TutorialContext'
import { nativePlatform } from '../../utils/platform'

// 안드로이드 하드웨어 뒤로가기 버튼 처리 — Capacitor 앱(Android)에서만 동작하고 웹·iOS에서는 아무것도 하지 않는다.
// 기본 동작(WebView 기록 뒤로가기)만 쓰면 목장에서 뒤로가기를 눌렀을 때 로그인 화면으로 돌아가 버리고,
// 첫 화면에서는 아무 반응이 없어서 앱을 끌 방법이 없다. 그래서 화면 구조에 맞게 직접 정한다.
// - 목장(허브)·로그인: 한 번 누르면 안내 토스트, 2초 안에 한 번 더 누르면 앱 종료
// - 회원가입: 로그인 카드로
// - 그 밖의 집중형 화면: 앱 안의 이전 화면으로(이전 기록이 없으면 목장으로)
const EXIT_CONFIRM_WINDOW_MS = 2000
const EXIT_ON_BACK_PATHS = new Set(['/ranch', '/login'])

export default function AndroidBackButtonHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { step, advance } = useTutorial()
  const [showExitHint, setShowExitHint] = useState(false)
  // 리스너는 한 번만 등록하고, 렌더마다 바뀌는 값(경로, 튜토리얼 단계 등)은 ref로 최신 값을 읽는다.
  const latestRef = useRef(null)

  useEffect(() => {
    latestRef.current = { navigate, pathname: location.pathname, step, advance }
  })

  useEffect(() => {
    if (nativePlatform !== 'android') return undefined
    let lastBackPressAt = 0
    let hideTimer = null

    const handleBackButton = ({ canGoBack }) => {
      if (!latestRef.current) return
      const { navigate: go, pathname, step: tutorialStep, advance: advanceTutorial } = latestRef.current

      if (EXIT_ON_BACK_PATHS.has(pathname)) {
        const now = Date.now()
        if (now - lastBackPressAt < EXIT_CONFIRM_WINDOW_MS) {
          CapacitorApp.exitApp()
          return
        }
        lastBackPressAt = now
        setShowExitHint(true)
        window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => setShowExitHint(false), EXIT_CONFIRM_WINDOW_MS)
        return
      }
      if (pathname === '/signup') {
        go('/login', { replace: true })
        return
      }
      // 튜토리얼 '다시 목장으로' 단계는 도감의 "목장으로 돌아가기" 버튼(RanchBackButton)이 다음 단계로 넘기는
      // 액션이라, 하드웨어 뒤로가기도 같은 일을 하게 한다 — 안 그러면 목장에 누를 버튼이 없는 안내가 남는다.
      if (tutorialStep?.id === 'return-to-ranch' && pathname === '/field-guide') {
        advanceTutorial()
        go('/ranch')
        return
      }
      if (canGoBack) go(-1)
      else go('/ranch', { replace: true })
    }

    const listener = CapacitorApp.addListener('backButton', handleBackButton)
    listener.catch(() => {})
    return () => {
      window.clearTimeout(hideTimer)
      listener.then((handle) => handle.remove()).catch(() => {})
    }
  }, [])

  if (!showExitHint) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-[1000] mb-[var(--safe-bottom)] flex justify-center" role="status" aria-live="polite">
      <div className="rounded-full bg-ink-900/85 px-5 py-2.5 text-center font-['Jua'] text-sm text-white shadow-[0_12px_28px_rgba(35,60,20,0.24)]">
        &apos;뒤로&apos; 버튼을 한 번 더 누르면 게임이 종료돼요
      </div>
    </div>
  )
}
