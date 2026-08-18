// 칭호(타이틀) 미션. 업적(achievementMissions.js)과 별도 트랙으로, 완료 시 배지 대신 프로필에 전시 가능한
// 텍스트 칭호를 준다. counter 값은 QuestsContext의 buildTitleCounters()가 계산해서 채워준다.
const REWARD_BY_TIER = [50, 100, 150]

const TITLE_GROUPS = [
  [
    { title: '새싹 생물학자', desc: '첫 로그인 완료', counter: 'loginCount', goal: 1 },
    { title: '성장하는 생물학자', desc: '누적 7일 로그인', counter: 'loginCount', goal: 7 },
    { title: '성실한 생물학자', desc: '누적 30일 로그인', counter: 'loginCount', goal: 30 },
  ],
  [
    { title: '초보 탐험가', desc: '탐험 1회 완료', counter: 'explorationCount', goal: 1 },
    { title: '숙련된 탐험가', desc: '탐험 20회 완료', counter: 'explorationCount', goal: 20 },
    { title: '전설의 탐험가', desc: '탐험 50회 완료', counter: 'explorationCount', goal: 50 },
  ],
  [
    { title: '곤충 발견자', desc: '곤충 1종 도감 등록', counter: 'registeredCount', goal: 1 },
    { title: '곤충 추적자', desc: '곤충 10종 도감 등록', counter: 'registeredCount', goal: 10 },
    { title: '곤충의 달인', desc: '곤충 30종 도감 등록', counter: 'registeredCount', goal: 30 },
  ],
  [
    { title: '숲속 조사원', desc: '숲 서식지 곤충 1종 등록', counter: 'forestRegisteredCount', goal: 1 },
    { title: '숲속 탐험대장', desc: '숲 서식지 곤충 5종 등록', counter: 'forestRegisteredCount', goal: 5 },
    { title: '숲의 수호자', desc: '숲 서식지 곤충 10종 등록', counter: 'forestRegisteredCount', goal: 10 },
  ],
  [
    { title: '연못 관찰자', desc: '연못 서식지 곤충 1종 등록', counter: 'pondRegisteredCount', goal: 1 },
    { title: '물가의 조사원', desc: '연못 서식지 곤충 5종 등록', counter: 'pondRegisteredCount', goal: 5 },
    { title: '연못 생태 전문가', desc: '연못 서식지 곤충 10종 등록', counter: 'pondRegisteredCount', goal: 10 },
  ],
  [
    { title: '땅속 탐험가', desc: '흙 서식지 곤충 1종 등록', counter: 'soilRegisteredCount', goal: 1 },
    { title: '흙 속 조사대장', desc: '흙 서식지 곤충 5종 등록', counter: 'soilRegisteredCount', goal: 5 },
    { title: '지하 생태 전문가', desc: '흙 서식지 곤충 10종 등록', counter: 'soilRegisteredCount', goal: 10 },
  ],
  [
    { title: '알의 보호자', desc: '알 성장 활동 5회 진행', counter: 'eggGrowthCount', goal: 5 },
    { title: '부화 도우미', desc: '알 3개 부화', counter: 'eggHatchCount', goal: 3 },
    { title: '생명의 탄생을 지켜본 자', desc: '알 10개 부화', counter: 'eggHatchCount', goal: 10 },
  ],
  [
    { title: '초보 목장 관리자', desc: '목장에 곤충 3마리 배치', counter: 'interiorPlacementCount', goal: 3 },
    { title: '능숙한 목장지기', desc: '목장에 곤충 10마리 배치', counter: 'interiorPlacementCount', goal: 10 },
    { title: '자연목장의 주인', desc: '목장에 곤충 20마리 배치', counter: 'interiorPlacementCount', goal: 20 },
  ],
  [
    { title: '곤충 수집가', desc: '곤충 10종 도감 등록', counter: 'fieldGuideCount', goal: 10 },
    { title: '희귀 곤충 수집가', desc: '모든 랭크 곤충 5종 등록', counter: 'allRankCount', goal: 5 },
    { title: '전설의 곤충 수집가', desc: '곤충 50종 도감 등록', counter: 'fieldGuideCount', goal: 50 },
  ],
  [
    { title: '컨셉 리틀 바이올로지스트', desc: '업적 5개 달성', counter: 'achievementCount', goal: 5 },
    { title: '정식 리틀 바이올로지스트', desc: '업적 15개 달성', counter: 'achievementCount', goal: 15 },
    { title: '위대한 리틀 바이올로지스트', desc: '업적 30개 달성', counter: 'achievementCount', goal: 30 },
  ],
]

export const TITLE_MISSIONS = TITLE_GROUPS.flatMap((group, groupIndex) =>
  group.map((mission, tierIndex) => ({
    id: `title-${groupIndex + 1}-${tierIndex + 1}`,
    ...mission,
    rewardLeaf: REWARD_BY_TIER[tierIndex] ?? REWARD_BY_TIER[REWARD_BY_TIER.length - 1],
  })),
)
