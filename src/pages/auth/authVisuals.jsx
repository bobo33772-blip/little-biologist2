import { useEffect, useState } from 'react'

// 로그인/회원가입 화면이 공유하는 배경·로고·"통째로 같은 비율로 스케일" 로직.
export const BACKGROUND_SRC = '/images/login/로그인.png'
// logo.png는 실제 글자/캐릭터가 위쪽 40%에만 있고 아래 60%가 빈 여백이라
// 그대로 쓰면 작아 보인다. 콘텐츠 영역만 잘라낸 버전을 사용한다.
export const LOGO_SRC = '/images/login/logo-cropped.png'
// 배경 원본 픽셀 비율(1672x941). background-size:contain이 실제로 그림을
// 화면 안 어디에 얼마나 그릴지 계산하려면 이 비율이 필요하다.
const BACKGROUND_ASPECT = 1672 / 941

export const DESIGN_WIDTH = 440
// 로그인/가입 화면이 같은 배율을 공유하도록 고정된 기준 높이(더 긴 회원가입
// 폼 기준). 페이지마다 다른 값을 쓰면 전환할 때마다 로고까지 같이 커지고
// 작아지면서 깜빡여 보이므로, 두 화면 모두 이 값 하나만 쓴다.
export const DESIGN_HEIGHT = 660
export const SHIFT_RATIO = 0.1 // 카드를 오른쪽으로 살짝 밀어 왼쪽 알 캐릭터를 가리지 않게 함

function computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale }) {
  if (typeof window === 'undefined') return 1
  const viewportAspect = window.innerWidth / window.innerHeight
  let pictureWidth
  let pictureHeight
  if (viewportAspect > BACKGROUND_ASPECT) {
    pictureHeight = window.innerHeight
    pictureWidth = pictureHeight * BACKGROUND_ASPECT
  } else {
    pictureWidth = window.innerWidth
    pictureHeight = pictureWidth / BACKGROUND_ASPECT
  }

  // 오른쪽으로 밀린 만큼 오른쪽 여유 공간이 더 필요하므로, 카드 중심에서
  // 가장 먼 쪽(오른쪽) 기준으로 폭 제약을 계산한다.
  const widestHalfWidth = designWidth * (0.5 + shiftRatio)

  const scaleByWidth = (pictureWidth * marginRatio) / (widestHalfWidth * 2)
  const scaleByHeight = (pictureHeight * marginRatio) / designHeight
  return Math.min(maxScale, scaleByWidth, scaleByHeight)
}

// 배경 사진은 background-size:contain이라 화면 비율에 따라 실제로는 화면보다
// 작게(레터박스 있는) 그려질 수 있다. window 전체 크기가 아니라 "사진이 실제로
// 차지하는 영역" 안에서 배율을 계산해야 로그인/가입창이 사진 밖으로 넘어가지 않는다.
// 최초 렌더부터 정확한 배율로 그려야(지연 초기화) 마운트 시 "확 커졌다 줄어드는"
// 깜빡임이 생기지 않는다.
export function useUniformScale({ designWidth, designHeight, marginRatio = 0.96, shiftRatio = 0, maxScale = 1.7 }) {
  const [scale, setScale] = useState(() =>
    computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale })
  )

  useEffect(() => {
    function update() {
      setScale(computeScale({ designWidth, designHeight, marginRatio, shiftRatio, maxScale }))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
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

  return (
    <div
      className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden"
      style={{
        // 사진(contain)을 하늘/풀밭 톤 그라디언트 위에 얹어, 화면 비율이 달라져도
        // 잘리거나 사라지지 않고 항상 전체 그림이 같은 비율로 보이게 고정한다.
        backgroundImage: `url('${BACKGROUND_SRC}'), linear-gradient(to bottom, #BFE3F5, #DCEFC7)`,
        backgroundSize: 'contain, cover',
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
