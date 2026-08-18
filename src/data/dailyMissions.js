export const DAILY_MISSION_CANDIDATES = [
  { id: 'exploration', title: '오늘의 탐험', desc: '탐험을 1회 완료하기', event: 'exploration_complete' },
  { id: 'ranch-insect', title: '작은 생물학자', desc: '목장에서 곤충을 1마리 발견하기', event: 'ranch_insect_found' },
  { id: 'guide-register', title: '도감 기록하기', desc: '새로운 곤충을 도감에 1종 등록하기', event: 'field_guide_register' },
  { id: 'guide-view', title: '곤충 관찰일지', desc: '도감에서 곤충 정보를 1회 확인하기', event: 'field_guide_view' },
  { id: 'egg-talk', title: '알 돌보기', desc: '대표캐릭터와 대화하기', event: 'egg_talk' },
  { id: 'habitat-visit', title: '서식지 탐방', desc: '원하는 서식지를 1회 방문하기', event: 'habitat_visit' },
  { id: 'rank-up', title: '곤충 랭크업', desc: '기본 등급인 곤충을 사진/그림으로 랭크업 시키기', event: 'rank_up' },
  { id: 'interior-place', title: '목장 꾸미기', desc: '목장에 인테리어 1개 배치하기', event: 'interior_place' },
  { id: 'quiz-correct', title: '똑똑이', desc: '퀴즈 문제 1개 맞히기', event: 'quiz_correct' },
  { id: 'friend-add', title: '친구야 나 왔어1', desc: '친구 1명 추가하기', event: 'friend_add' },
  { id: 'guestbook', title: '친구야 나 왔어2', desc: '친구 방명록에 글 남기기', event: 'guestbook' },
  { id: 'friend-visit', title: '친구야 나 왔어3', desc: '친구 목장 방문하기', event: 'friend_visit' },
]

export const DAILY_MISSION_COUNT = 3

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// dateKey 기반 시드로 셔플해서, 같은 날 안에 여러 번 다시 계산돼도(새로고침 등) 매번 다른 3개가
// 뽑히지 않고 그날 내내 같은 미션 구성을 유지한다.
function createSeededRandom(seedText) {
  let seed = [...seedText].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function createDailyMissions(dateKey = getLocalDateKey()) {
  const shuffled = [...DAILY_MISSION_CANDIDATES]
  const random = createSeededRandom(dateKey)
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    date: dateKey,
    missions: shuffled.slice(0, DAILY_MISSION_COUNT).map((mission) => ({
      ...mission,
      progress: 0,
      total: 1,
      rewardLeaf: 50,
      claimed: false,
      done: false,
    })),
  }
}
