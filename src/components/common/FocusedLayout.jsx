import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import RanchBackButton from './RanchBackButton'
import { getFeatureBackground } from '../../data/featureBackgrounds'
import { markSceneReady } from '../../utils/sceneReady'

// AGENTS.md §11 / screen-requirements.md: 도감·퀘스트·AI말벗 등은
// '목장으로 돌아가기' 중심의 집중형 내비게이션을 사용하고, 전체 사이드바를 복원하지 않는다.
// 현재 경로에 맞는 배경 이미지(featureBackgrounds.js)가 있으면 옅게 깔고, 본문은 반투명 카드
// 위에 올려서 가독성을 유지한다.
export default function FocusedLayout({ title, icon, iconSrc, actions, backTo, backLabel, children }) {
  const location = useLocation()
  const backgroundImage = getFeatureBackground(location.pathname)

  // 기능 화면으로 바로 들어온 경우의 첫 장면 신호. 화면마다 그림이 제각각이라 그림 로드 대신
  // 1초를 기다린 뒤 효과음·배경음 미리받기를 풀어준다(이미 신호가 나갔으면 아무 일도 없다).
  useEffect(() => {
    const timer = window.setTimeout(markSceneReady, 1000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {backgroundImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(255, 252, 245, 0.72), rgba(255, 248, 233, 0.84)), url('${backgroundImage}')`,
          }}
        />
      )}
      <AppHeader leftSlot={<RanchBackButton to={backTo} label={backLabel} />} />
      <main className="mx-auto w-full max-w-5xl flex-1 pb-[calc(1.5rem+var(--safe-bottom))] pl-[calc(1rem+var(--safe-left))] pr-[calc(1rem+var(--safe-right))] pt-6">
        <div className={backgroundImage ? 'rounded-3xl bg-white/72 p-4 shadow-soft backdrop-blur-[2px] sm:p-5' : ''}>
          {title && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
                {iconSrc ? (
                  <span className="grid h-16 w-16 place-items-center overflow-visible" aria-hidden="true">
                    <img src={iconSrc} alt="" className="h-16 w-16 scale-110 object-contain drop-shadow-sm" />
                  </span>
                ) : icon ? (
                  <span aria-hidden="true">{icon}</span>
                ) : null}
                {title}
              </h1>
              {actions}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
