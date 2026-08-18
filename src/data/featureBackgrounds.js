// FocusedLayout.jsx가 화면 경로별로 깔아주는 배경 이미지. 목장(Ranch.jsx)처럼 전체화면
// 배경을 쓰지 않는 집중형 화면(탐험/도감/소셜/가방/미션/상점/퀴즈/챗봇)에 은은하게 얹는다.
const featureBackgroundBase = '/feature-backgrounds'

function backgroundUrl(fileName) {
  return encodeURI(`${featureBackgroundBase}/${fileName}`)
}

export const FEATURE_BACKGROUNDS = {
  '/exploration': backgroundUrl('탐험 배경.png'),
  '/field-guide': backgroundUrl('도감 배경.png'),
  '/friends': backgroundUrl('소셜 배경.png'),
  '/bag': backgroundUrl('가방 배경.png'),
  '/quests': backgroundUrl('미션 배경.png'),
  '/shop': backgroundUrl('상점 배경.png'),
  '/quiz': backgroundUrl('퀴즈 배경.png'),
  '/ai-companion': backgroundUrl('챗봇 배경.png'),
}

export function getFeatureBackground(pathname) {
  return FEATURE_BACKGROUNDS[pathname] ?? null
}
