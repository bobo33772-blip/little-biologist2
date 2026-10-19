// 서식지 화면(RanchHabitat·FriendRanchHabitat)이 함께 쓰는 장면 정보.
// 배경 그림은 IMAGE/*.png를 같은 크기로 바꾼 WebP다(scripts/convert-scene-images.mjs). PNG는
// 장당 1.2~1.5MB라 느린 회선에서 위에서부터 줄 단위로 그려졌다. 원본 PNG는 비교용으로 남겨 둔다.
// import는 해시가 붙은 URL 문자열만 돌려주므로, 이 파일을 가져와도 그림을 받지는 않는다.
import forestImage from '../../IMAGE/forest.webp'
import pondImage from '../../IMAGE/pond.webp'
import soilImage from '../../IMAGE/soil.webp'
import streetImage from '../../IMAGE/street.webp'
import fieldFlowerImage from '../../IMAGE/field_flower.webp'
import fieldTreeImage from '../../IMAGE/field_tree.webp'

// coverColor: 목장↔서식지 장면 전환 때 화면을 덮는 색. 서식지 그림의 가장 짙은 색에 맞췄다.
export const HABITAT_SCENES = {
  forest: {
    id: 'forest',
    name: '숲',
    images: [forestImage],
    description: '나무 그늘 아래 숨은 곤충들을 가까이서 관찰할 수 있어요.',
    accent: 'from-emerald-950/90 via-emerald-900/35 to-ink-950/90',
    coverColor: '#022c22',
  },
  pond: {
    id: 'pond',
    name: '연못·습지',
    images: [pondImage],
    description: '물가와 갈대 사이를 따라 이동하는 곤충들을 살펴볼 수 있어요.',
    accent: 'from-cyan-950/90 via-sky-900/35 to-ink-950/90',
    coverColor: '#083344',
  },
  soil: {
    id: 'soil',
    name: '흙 속',
    images: [soilImage],
    description: '땅 위와 흙 속에 숨어 지내는 곤충들을 발견할 수 있어요.',
    accent: 'from-amber-950/90 via-stone-900/35 to-ink-950/90',
    coverColor: '#451a03',
  },
  'street-trees': {
    id: 'street-trees',
    name: '가로수',
    images: [streetImage],
    description: '가로수 주변을 오가는 곤충들을 도심 풍경 속에서 만나보세요.',
    accent: 'from-lime-950/90 via-green-900/35 to-ink-950/90',
    coverColor: '#1a2e05',
  },
  grass: {
    id: 'grass',
    name: '풀밭',
    images: [fieldFlowerImage, fieldTreeImage],
    descriptions: [
      '꽃이 많은 풀밭에서는 꽃을 찾는 곤충들을 먼저 관찰할 수 있어요.',
      '나무가 섞인 풀밭에서는 가지와 줄기 주변 곤충들까지 이어서 볼 수 있어요.',
    ],
    accent: 'from-emerald-950/90 via-lime-900/35 to-ink-950/90',
    coverColor: '#022c22',
  },
}
