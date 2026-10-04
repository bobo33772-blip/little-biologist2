import { isNativeApp } from '../utils/platform'

// 웹에서는 /api, /chat 요청을 상대 경로로 보내고, vercel.json 리라이트(배포)나 vite 프록시(개발)가
// Render 서버(server/index.js)로 넘겨준다. 앱(Capacitor) 안에서는 화면이 https://localhost(Android)·
// capacitor://localhost(iOS)에서 열려서 상대 경로 요청이 앱 내부 파일 서버로 가버리므로, 앱에서만
// 백엔드 주소를 앞에 붙인다. 서버는 cors()로 모든 출처를 허용하고 있어서 따로 바꿀 것이 없다.
const DEFAULT_NATIVE_API_BASE = 'https://little-biologist2.onrender.com'

export const API_BASE = isNativeApp
  ? (import.meta.env.VITE_API_BASE_URL || DEFAULT_NATIVE_API_BASE).replace(/\/+$/, '')
  : ''

// path는 '/api/...' 또는 '/chat'처럼 슬래시로 시작하는 서버 경로.
export function apiUrl(path) {
  return `${API_BASE}${path}`
}
