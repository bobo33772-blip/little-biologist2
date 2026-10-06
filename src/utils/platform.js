import { Capacitor } from '@capacitor/core'

// Capacitor로 감싼 앱(Android/iOS) 안에서 실행 중인지. 웹 브라우저(Vercel 배포, npm run dev)에서는 false.
// 네이티브 브리지는 페이지 스크립트보다 먼저 주입되므로 모듈을 불러오는 시점에 한 번만 판정해도 된다.
export const isNativeApp = Capacitor.isNativePlatform()

// 'android' | 'ios' | 'web'
export const nativePlatform = Capacitor.getPlatform()

// 홈 화면에 추가한 웹 앱(아이폰 Safari "홈 화면에 추가", 안드로이드 Chrome "앱 설치")으로 실행 중인지.
// 이때는 브라우저 탭이 아니라 앱처럼 열고 닫으므로 로그인 유지 같은 동작은 앱 쪽에 맞춘다.
// navigator.standalone은 iOS 전용 값이고, 그 밖의 브라우저는 display-mode 미디어 쿼리로 판정한다.
export const isStandaloneWebApp =
  !isNativeApp &&
  typeof window !== 'undefined' &&
  (window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true)

// 그중 아이폰·아이패드 Safari의 "홈 화면에 추가"로 연 웹 앱. iOS에만 있는 버그를 피할 때 쓴다.
export const isIosHomeScreenApp = !isNativeApp && typeof window !== 'undefined' && window.navigator.standalone === true
