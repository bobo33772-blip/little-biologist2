import { Capacitor } from '@capacitor/core'

// Capacitor로 감싼 앱(Android/iOS) 안에서 실행 중인지. 웹 브라우저(Vercel 배포, npm run dev)에서는 false.
// 네이티브 브리지는 페이지 스크립트보다 먼저 주입되므로 모듈을 불러오는 시점에 한 번만 판정해도 된다.
export const isNativeApp = Capacitor.isNativePlatform()

// 'android' | 'ios' | 'web'
export const nativePlatform = Capacitor.getPlatform()
