# 리틀 바이올로지스트 — 프론트엔드 네비게이션 뼈대

프로젝트 MD 문서(`AGENTS.md` 등)를 기준으로 만든 전체 화면 뼈대입니다.
UI 참고 이미지(`리틀_바이올로지스트__화면_흐름도_UI_이미지_구현.pptx`)의 레이아웃/톤만 참고했고,
문서와 다른 요소(골드·보석 재화, 별점, 실시간 친구 대화·선물 등)는 반영하지 않았습니다.

## 실행 방법

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 프로덕션 빌드
```

## 폴더 구조

```
src/
  components/common/   화면 전반에서 재사용하는 공통 컴포넌트
                        (design-guidelines.md §6 Component Rules 기준)
  data/mockData.js      백엔드 연동 전까지 사용하는 목업 데이터 (유저/퀘스트/친구/상점 등)
  data/insectSpecies.js 실제 곤충 도감 자산(80종) + 서식지(5개) 데이터 — 아래 참고
  pages/                화면 단위 컴포넌트 (라우트 1:1 대응)
  pages/auth/            로그인/회원가입 (배경 공유, 카드만 전환)
  router/                인증 컨텍스트 + 보호 라우트
public/insects/         곤충 이미지 80종 (01.webp ~ 80.webp)
public/ranch/            목장 배경 1장 + 서식지 오브젝트 5장
```

## 목장 배경 & 서식지 자산

`public/ranch/background.webp`가 목장 화면의 배경(전체 씬)이고, 나머지 5장
(`forest.webp` 숲, `grass.webp` 풀밭, `street-trees.webp` 도심 가로수, `pond.webp` 연못·습지,
`soil.webp` 흙 속)은 배경 위에 배치되는 클릭 가능한 오브젝트입니다 (`RanchMapScene.jsx`).
원본 PNG(장당 최대 3.4MB)를 최대 560px / WebP로 압축해서 총 756KB로 줄였습니다.
`숲`, `연못` 원본은 배경이 불투명 흰색이라 OpenCV flood-fill로 투명화 후 사용했습니다.

오브젝트 좌표는 `insectSpecies.js`의 `HABITATS` 배열에서 `x`/`y`(퍼센트)로 지정하며,
목장 배경 이미지의 울타리·문 위치를 눈대중으로 피해서 배치했습니다 — 실제 배경 그림과
좌표가 어긋나 보이면 이 값만 조정하면 됩니다.

## 곤충 도감 자산 (80종)

`public/insects/{2자리ID}.webp`에 실제 도감 이미지 80종이 들어있습니다.
원본 PNG(평균 870KB, 총 70MB)를 최대 640px / WebP 품질 82로 리사이즈·압축해서
총 용량을 약 1.9MB로 줄였습니다. 더 고화질이 필요하면 원본을 다시 넣고
압축 설정을 조정하세요.

`src/data/insectSpecies.js`:
- `HABITATS`: 서식지(상위종 그룹) 5개 — 숲(19종) / 풀밭(34종) / 도심 가로수(9종) /
  연못·습지(7종) / 흙 속(11종). 각 서식지가 몇 종을 포함하는지, 어떤 종이 속하는지는
  전부 사용자가 지정한 분류를 그대로 반영했습니다 (정식 분류학 기준 아님 — 실제 분류
  체계는 `unresolved-decisions.md`에서 팀 확정 필요).
- `INSECT_SPECIES`: 80종 전체 목록 `{ id, name, image, habitatId, registered, rank }`
- `getSpeciesByHabitat(id)` / `getHabitatStats(id)`: 서식지별 종 목록/등록 현황 계산
- `registered`/`rank`는 화면 데모용 임의 배정입니다 (id % 3 == 1인 27종만 등록 처리).
  실제 등록 여부는 사용자별 서버 데이터로 교체되어야 합니다.
- `mockUser.fieldGuideCount`/`fieldGuideTotal`(mockData.js)은 이 데이터에서 자동 계산됩니다.

## 네비게이션 구조

- `목장`(허브) 화면에서만 전체 하단 메뉴(BottomNav)가 노출됩니다.
- 그 외 화면(탐험/도감/퀘스트/친구/상점/가방/AI말벗/퀴즈/프로필)은
  **"목장으로 돌아가기" 중심의 집중형 내비게이션**만 사용합니다.
  (`AGENTS.md` §11: 집중형 화면에서 전체 사이드바를 임의로 복원하지 않는다.)

## 현재 상태 (Definition of Done 기준 미충족 항목)

이 뼈대는 **최소 버전(스켈레톤)**이며, 아래는 아직 구현되지 않았습니다.

- 실제 백엔드 API 연동 (인증, 분류, 도감, 퀘스트, 상점, 채팅 등 — 각 파일의 `TODO(backend)` 주석 참고)
- `unresolved-decisions.md`에 남아있는 미확정 사항 전반
  (예: 금/은/동 등급 조건, 신뢰도 계산식, 가챠/실결제 등)
- 곤충 이미지는 실제 자산(80종) 연동 완료. 그 외 UI 아이콘·캐릭터 연출은 여전히 이모지로 대체
- 접근성 심화 검증, 반응형 세부 튜닝

## 다음 단계 제안

1. `docs/features/*.md` 중 우선순위 기능(예: 인증, 탐험·분류)부터 백엔드 계약 정의
2. 화면별 상태(idle/loading/success/empty/error/unauthorized) 실제 API 응답에 맞게 연결
3. `decision-log.md`의 미확정 항목이 확정되는 대로 관련 화면(도감 등급, 퀘스트 보상 등) 갱신
