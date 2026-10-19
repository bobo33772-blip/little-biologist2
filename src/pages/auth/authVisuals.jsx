import { useEffect, useState } from 'react'
import { preloadImage } from '../../utils/preloadImages'
import { markSceneReady } from '../../utils/sceneReady'

// 로그인/회원가입 화면이 공유하는 배경·로고·"통째로 같은 비율로 스케일" 로직.
// 원본 로그인.png(856KB)를 같은 크기의 WebP(220KB)로 바꿔 쓴다(scripts/convert-scene-images.mjs).
export const BACKGROUND_SRC = '/images/login/로그인.webp'
// logo.png는 실제 글자/캐릭터가 위쪽 40%에만 있고 아래 60%가 빈 여백이라
// 그대로 쓰면 작아 보인다. 콘텐츠 영역만 잘라낸 버전을 사용한다.
export const LOGO_SRC = '/images/login/logo-cropped.png'
// 배경 원본 픽셀 비율(1672x941). 배경을 화면 폭에 맞춰 그렸을 때 그림이 실제로
// 화면 안 어디에 얼마나 보일지 계산하려면 이 비율이 필요하다.
const BACKGROUND_ASPECT = 1672 / 941

export const DESIGN_WIDTH = 440
// 로그인/가입 화면이 같은 배율을 공유하도록 고정된 기준 높이(더 긴 회원가입
// 폼 기준). 페이지마다 다른 값을 쓰면 전환할 때마다 로고까지 같이 커지고
// 작아지면서 깜빡여 보이므로, 두 화면 모두 이 값 하나만 쓴다.
export const DESIGN_HEIGHT = 660
export const SHIFT_RATIO = 0.1 // 카드를 오른쪽으로 살짝 밀어 왼쪽 알 캐릭터를 가리지 않게 함

// 노치·홈 바(안전 영역) 폭을 px 숫자로 읽는다. index.css의 --safe-* 값은 env()가 섞여 있어
// JS에서 바로 숫자로 읽을 수 없으므로, 보이지 않는 요소에 padding으로 걸고 계산된 값을 읽는다.
function readSafeArea() {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)'
  document.body.appendChild(probe)
  const style = window.getComputedStyle(probe)
  const insets = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  }
  probe.remove()
  return insets
}

function computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale }) {
  if (typeof window === 'undefined') return 1
  const safe = readSafeArea()
  // 배경은 항상 화면 폭에 맞춰 그린다(AuthScreen의 background-size: 100% auto).
  // 그래서 그림이 보이는 폭은 화면 폭 전체이고, 높이는 화면 높이와 "폭에 맞춘 그림 높이" 중 작은 쪽이다.
  // 여기서 노치·홈 바 폭을 빼서 카드가 그 밑에 깔리지 않게 한다.
  const pictureWidth = window.innerWidth - safe.left - safe.right
  const pictureHeight = Math.min(window.innerHeight - safe.top - safe.bottom, window.innerWidth / BACKGROUND_ASPECT)

  // 오른쪽으로 밀린 만큼 오른쪽 여유 공간이 더 필요하므로, 카드 중심에서
  // 가장 먼 쪽(오른쪽) 기준으로 폭 제약을 계산한다.
  const widestHalfWidth = designWidth * (0.5 + shiftRatio)

  const scaleByWidth = (pictureWidth * marginRatio) / (widestHalfWidth * 2)
  const scaleByHeight = (pictureHeight * marginRatio) / designHeight
  return Math.min(maxScale, scaleByWidth, scaleByHeight)
}

// 배경 사진은 화면 폭에 맞춰 그리므로 화면이 그림보다 세로로 길면(태블릿·세로 화면) 위아래에
// 빈 공간이 생긴다. window 전체 크기가 아니라 "사진이 실제로 보이는 영역" 안에서 배율을
// 계산해야 로그인/가입창이 사진 밖으로 넘어가지 않는다.
// 최초 렌더부터 정확한 배율로 그려야(지연 초기화) 마운트 시 "확 커졌다 줄어드는"
// 깜빡임이 생기지 않는다.
export function useUniformScale({ designWidth, designHeight, marginRatio = 0.96, shiftRatio = 0, maxScale = 1.7 }) {
  const [scale, setScale] = useState(() =>
    computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale })
  )

  useEffect(() => {
    const timers = new Set()
    function update() {
      setScale(computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale }))
    }
    // 아이폰은 회전 직후 화면 크기·안전 영역 값이 조금 늦게 바뀌는 경우가 있어 잠시 뒤 한 번 더 계산한다.
    function updateAfterRotation() {
      update()
      const id = window.setTimeout(() => {
        timers.delete(id)
        update()
      }, 500)
      timers.add(id)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', updateAfterRotation)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', updateAfterRotation)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [designWidth, designHeight, marginRatio, shiftRatio, maxScale])

  return scale
}

// 로고 이미지가 없어도 깨지지 않도록, 로드 실패 시 텍스트 워드마크로 대체한다.
export function AuthLogo() {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <h1 className="mb-3 select-none whitespace-nowrap text-center font-['Jua'] text-6xl text-white [-webkit-text-stroke:2px_rgba(49,35,15,0.55)] [text-shadow:0_5px_0_rgba(41,36,19,0.72),0_0_16px_rgba(29,54,12,0.5)]">
        리틀 바이올로지스트
      </h1>
    )
  }

  return (
    <img
      src={LOGO_SRC}
      alt="리틀 바이올로지스트"
      // logo-cropped.png의 실제 크기. 그림이 오기 전에도 비율만큼 자리를 잡아 카드가 아래로 밀리지 않게 한다.
      width={1401}
      height={430}
      className="mb-3 w-full h-auto object-contain drop-shadow-lg"
      onError={() => setFailed(true)}
    />
  )
}

// 로고 + 반투명 유리 카드를 기준 크기(DESIGN_WIDTH x DESIGN_HEIGHT, px)로 그려두고
// 화면 크기에 맞춰 통째로 하나의 비율로 scale()하는 공통 뼈대.
// 로그인/가입 라우트 전환 중에도 이 컴포넌트가 언마운트되지 않도록 라우터
// 레이아웃(AuthRouteLayout)에서 한 번만 렌더링하고, 카드 내용만 바뀌게 한다.
// 카드 자체는 overflow-hidden이라 스크롤바가 생기지 않는다.
export function AuthScreen({ children }) {
  const scale = useUniformScale({ designWidth: DESIGN_WIDTH, designHeight: DESIGN_HEIGHT, shiftRatio: SHIFT_RATIO })

  // 로그인 배경까지 다 받아야 첫 장면이 완성된 것으로 보고, 그 뒤에 효과음·배경음 미리받기를 풀어준다.
  useEffect(() => {
    preloadImage(BACKGROUND_SRC).then(markSceneReady)
  }, [])

  return (
    <div
      // padding(안전 영역)만큼 안쪽에서 카드를 가운데 정렬해 노치·홈 바를 피한다.
      // 배경은 padding까지 포함한 화면 전체에 그려진다.
      className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)] pt-[var(--safe-top)]"
      style={{
        // 사진을 화면 폭에 맞춰(100% auto) 하늘/풀밭 톤 그라디언트 위에 얹는다.
        // 폰 가로 화면처럼 화면이 그림보다 가로로 길면 위아래가 조금 잘리는 대신 양옆 빈 띠 없이
        // 화면을 꽉 채우고, 태블릿·세로 화면처럼 세로로 길면 예전(contain)처럼 그림 전체가 보이고
        // 위아래만 그라디언트가 채운다. 어느 경우든 그림의 왼쪽(알 캐릭터)~오른쪽 끝은 잘리지 않는다.
        backgroundImage: `url('${BACKGROUND_SRC}'), linear-gradient(to bottom, #BFE3F5, #DCEFC7)`,
        backgroundSize: '100% auto, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
    >
      <div
        className="flex flex-col items-center"
        style={{ width: DESIGN_WIDTH, transform: `scale(${scale}) translateX(10%)` }}
      >
        <AuthLogo />

        <div className="relative w-full overflow-hidden rounded-[36px] border-2 border-dashed border-white/60 bg-white/30 p-5 shadow-soft backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  )
}
