const SOUND_PREFIX = '/sounds'

const HABITAT_SOUND_SRC = {
  soil: encodeURI(`${SOUND_PREFIX}/흙 속 서식시 효과음.mp3`),
  forest: encodeURI(`${SOUND_PREFIX}/숲 서식지 효과음.mp3`),
  pond: encodeURI(`${SOUND_PREFIX}/연못 습지 서식지 효과음.mp3`),
  grass: encodeURI(`${SOUND_PREFIX}/풀밭 서식지_꽃밭 효과음.mp3`),
  'street-trees': encodeURI(`${SOUND_PREFIX}/가로수 서식지 효과음.mp3`),
  grassFlower: encodeURI(`${SOUND_PREFIX}/풀밭 서식지_꽃밭 효과음.mp3`),
  grassTree: encodeURI(`${SOUND_PREFIX}/풀밭 서식지_나무 효과음.mp3`),
}

export function getRanchHabitatSoundSrc(habitatId) {
  return HABITAT_SOUND_SRC[habitatId] ?? null
}

// 풀밭 서식지는 화면이 꽃밭(0)/나무(1) 두 개라 단계별로 다른 배경음악을 쓴다.
export function getGrassStageSoundSrc(stage) {
  return stage === 1 ? HABITAT_SOUND_SRC.grassTree : HABITAT_SOUND_SRC.grassFlower
}
