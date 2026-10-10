// FocusedLayout.jsx가 화면 경로별로 깔아주는 배경 이미지. 목장(Ranch.jsx)처럼 전체화면
// 배경을 쓰지 않는 집중형 화면(탐험/도감/소셜/가방/미션/상점/퀴즈/챗봇)에 은은하게 얹는다.
// 원본 PNG(장당 약 450KB)를 같은 크기의 WebP(약 40KB)로 바꿔 쓴다(scripts/convert-scene-images.mjs).
const featureBackgroundBase = '/feature-backgrounds'

function backgroundUrl(fileName) {
  return encodeURI(`${featureBackgroundBase}/${fileName}`)
}

export const FEATURE_BACKGROUNDS = {
  '/exploration': backgroundUrl('탐험 배경.webp'),
  '/field-guide': backgroundUrl('도감 배경.webp'),
  '/friends': backgroundUrl('소셜 배경.webp'),
  '/bag': backgroundUrl('가방 배경.webp'),
  '/quests': backgroundUrl('미션 배경.webp'),
  '/shop': backgroundUrl('상점 배경.webp'),
  '/quiz': backgroundUrl('퀴즈 배경.webp'),
  '/ai-companion': backgroundUrl('챗봇 배경.webp'),
}

export function getFeatureBackground(pathname) {
  return FEATURE_BACKGROUNDS[pathname] ?? null
}
