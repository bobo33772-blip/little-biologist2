import { useEffect, useState } from 'react'
import { RotateCw, Smartphone } from 'lucide-react'
import { isStandaloneWebApp } from '../../utils/platform'

// 홈 화면 웹 앱(특히 아이폰)은 화면 방향을 고정할 수 없다 — iOS는 manifest의 orientation과
// screen.orientation.lock()을 지원하지 않는다. 목장·로그인 화면이 가로 기준이라 폰을 세로로 들면
// 메뉴가 잘리므로, 그동안 돌려 달라는 안내로 화면을 덮는다. 브라우저 탭에서는 기존 동작을 바꾸지 않도록
// 홈 화면 웹 앱일 때만 띄운다(Capacitor 앱은 네이티브 설정으로 가로 고정).
const PHONE_PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 600px)'

function matchesPhonePortrait() {
  return isStandaloneWebApp && window.matchMedia(PHONE_PORTRAIT_QUERY).matches
}

export default function RotateDeviceOverlay() {
  const [isPhonePortrait, setIsPhonePortrait] = useState(matchesPhonePortrait)

  useEffect(() => {
    if (!isStandaloneWebApp) return undefined
    const query = window.matchMedia(PHONE_PORTRAIT_QUERY)
    const handleChange = () => setIsPhonePortrait(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  if (!isPhonePortrait) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-device-title"
      className="lb-fade-in fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-ivory-50 px-8 text-center"
    >
      <img src="/app-icons/icon-192.png" alt="" className="h-20 w-20 rounded-3xl shadow-card" />
      <span className="flex items-center gap-2 text-leaf-600" aria-hidden="true">
        <Smartphone size={40} />
        <RotateCw size={28} />
      </span>
      <h1 id="rotate-device-title" className="font-['Jua'] text-2xl text-leaf-700">휴대폰을 가로로 돌려 주세요</h1>
      <p className="text-sm leading-relaxed text-ink-700/80">
        리틀 바이올로지스트는 가로 화면에서 플레이해요.
        <br />
        화면이 돌아가지 않으면 제어 센터에서
        <br />
        화면 방향 잠금(자물쇠 모양 버튼)을 꺼 주세요.
      </p>
    </div>
  )
}
