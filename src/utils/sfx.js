// 이 프로젝트에서 쓰는 효과음 파일 경로를 한곳에 모아둔다 — 여러 화면에서 같은 파일을
// 참조할 때 이름을 다시 안 적어도 되고, 실제로 무슨 효과음이 몇 군데서 쓰이는지 여기만 보면 안다.
const SOUND_PREFIX = '/sounds'

function sfx(name) {
  return encodeURI(`${SOUND_PREFIX}/${name}.mp3`)
}

export const SFX = {
  // 특별히 지정된 것 없는 모든 버튼(뽁 소리).
  buttonDefault: sfx('나머지 버튼 효과음'),
  // 튜토리얼 진행 중(탐험도우미 말풍선의 "다음"/"건너뛰기"/"시작하기") 버튼 전용.
  buttonTutorial: sfx('튜토리얼 버튼'),
  // 상점 '재화' 탭의 나뭇잎 구매 버튼.
  currencyPurchase: sfx('나뭇잎 재화 구매'),
  // 미션 탭(일일/주간/업적)에서 완료된 미션 보상 수령.
  missionReward: sfx('미션 보상 수령'),
  // 미션 탭의 '칭호' 탭에서 완료된 칭호 보상 수령.
  titleReward: sfx('배지 칭호 수령'),
  // 상점 뽑기에서 상품이 나왔을 때(뽑기 클릭).
  gachaResult: sfx('뽑기 상품'),
  // 하루치 퀴즈를 다 풀었을 때.
  dailyQuizComplete: sfx('일일 퀴즈 완수'),
  quizCorrect: sfx('퀴즈 성공'),
  quizWrong: sfx('퀴즈 실패'),
  // 도감 등록 등급별 — 금(사진)/은(그림)/기본(목장 랜덤 곤충).
  registerGold: sfx('등록-금'),
  registerSilver: sfx('등록-은'),
  registerBronze: sfx('등록-기본'),
  // 대표 캐릭터 알 성장 시스템: 새 알 받음 -> 알-애벌레 -> 애벌레-번데기 -> 번데기-성체.
  newEgg: sfx('새로운 알'),
  eggToLarva: sfx('알-애벌레'),
  larvaToPupa: sfx('애벌레-번데기'),
  pupaToAdult: sfx('번데기-성체'),
}
