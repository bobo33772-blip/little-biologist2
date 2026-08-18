// 실제 프로젝트 곤충 도감 자산(80종) + 목장 배경 자산 기반 데이터.
// 서식지(상위종 그룹) 분류는 사용자가 지정한 기준을 그대로 반영했다.
// 이미지: public/insects-original/{2자리ID}.png, 서식지 오브젝트: public/ranch/*.webp
//
// IMAGE/ 폴더의 원본 PNG를 정적 자산으로 복사해 투명 배경 원본을 사용한다.
// 기존 public/insects/*.webp 압축 자산은 비교·롤백을 위해 보존한다.

// 도감 카드 배경 텍스처 on/off 스위치. false로 바꾸면 카드가 이전(단색 leaf-50) 모습으로 즉시 복원된다.
// 출처: IMAGE/배경/*.png (5종, IMAGE/예시/image.png 레퍼런스 참고) → public/card-backgrounds/*.webp
export const SHOW_INSECT_CARD_BACKGROUND = false

// x/y/scale은 목장 화면(Ranch.jsx)의 "편집" 모드에서 드래그/크기 슬라이더로 조절한 값을
// 그대로 기본값으로 고정해둔 것 — 편집 모드에서 다시 바꾸면 localStorage override가 이
// 기본값을 덮어쓴다.
export const HABITATS = [
  {
    id: "forest",
    name: "숲",
    image: "/ranch/forest.webp",
    x: 53.13,
    y: 13.22,
    scale: 0.85,
    cardBackground: "/card-backgrounds/forest.webp", // 나무껍질 텍스처
  },
  {
    id: "street-trees",
    name: "가로수",
    image: "/ranch/street-trees.webp",
    x: 80.53,
    y: 19.82,
    scale: 0.75,
    cardBackground: "/card-backgrounds/street-trees.webp", // 나뭇잎 텍스처
  },
  {
    id: "grass",
    name: "풀밭",
    image: "/ranch/grass.webp",
    x: 81.13,
    y: 65.64,
    scale: 1,
    cardBackground: "/card-backgrounds/grass.webp", // 가시덤불(들풀) 텍스처
  },
  {
    id: "soil",
    name: "흙 속",
    image: "/ranch/soil.webp",
    x: 21.75,
    y: 37.22,
    scale: 1,
    cardBackground: "/card-backgrounds/soil.webp", // 낙엽 텍스처
  },
  {
    id: "pond",
    name: "연못·습지",
    image: "/ranch/pond.png",
    x: 53.25,
    y: 44.72,
    scale: 0.95,
    cardBackground: "/card-backgrounds/pond.webp", // 덩쿨(이끼) 텍스처
  },
]

export function getHabitatCardBackground(habitatId) {
  if (!SHOW_INSECT_CARD_BACKGROUND) return null
  return HABITATS.find((h) => h.id === habitatId)?.cardBackground ?? null
}

export function getHabitatById(habitatId) {
  return HABITATS.find((h) => h.id === habitatId) ?? null
}

// 금(사진 등록) / 은(그림 등록) / 동(목장 획득) 데모 배정 — 최종 승급 조건은 D-003 미확정 항목
function demoRank(id) {
  const cycle = ["gold", "silver", "bronze"]
  return cycle[Math.floor(id / 3) % 3]
}

// scientificName: iNaturalist 분류 매칭(server/index.js)이 한국어 이름 대신 학명으로 종을 특정하기 위한
// 필드다. iNaturalist는 종에 한국어 이름이 등록돼 있지 않으면 preferred_common_name을 비워서 주기 때문에
// (예: 부엉이나비=Caligo는 한국어 이름이 아예 없음), 한국어 이름만으로는 매칭이 안 되는 경우가 많았다.
// 확신이 낮은 항목은 속(genus)까지만 적었고, 그마저 불확실한 항목은 "확인 필요" 주석과 함께 null로 뒀다
// (틀린 학명으로 엉뚱한 종에 매칭되는 것보다, 매칭 안 되는 게 낫다고 판단). 정확한 학명을 알고 있다면
// 여기 값을 검증/수정해달라.
// feature: 곤충 특징 요약글.docx에서 옮긴 도감 상세 패널용 설명 텍스트.
const INSECT_SPECIES_RAW = [
  { id: 1, name: "장수풍뎅이", scientificName: "Allomyrina dichotoma", feature: "수컷의 머리와 가슴에 크고 멋진 뿔이 있다. 참나무 수액을 먹으며, 수컷끼리 먹이나 짝을 차지하려고 뿔로 밀어내는 싸움을 한다.", image: "/insects-original/01.png", habitatId: "forest", registered: false, rank: demoRank(1) },
  { id: 2, name: "외뿔장수풍뎅이", scientificName: "Eophileurus chinensis", feature: "수컷의 머리에 길고 굵은 외뿔이 솟아 있는 대형 장수풍뎅이다. 주로 열대 지역에 살며 수액과 잘 익은 과일을 먹고, 때로는 작은 동물을 먹기도 한다.", image: "/insects-original/02.png", habitatId: "forest", registered: false, rank: null },
  { id: 3, name: "청동풍뎅이", scientificName: "Mimela", feature: "몸이 초록빛 또는 청동빛으로 반짝이는 풍뎅이다. 초여름부터 여름 사이 나뭇잎이나 꽃에서 볼 수 있으며, 몸의 아랫면은 금빛을 띠기도 한다.", image: "/insects-original/03.png", habitatId: "forest", registered: false, rank: null }, // 종 확인 필요, 속만 확신
  { id: 4, name: "기드온장수풍뎅이", scientificName: "Xylotrupes gideon", feature: "수컷의 머리와 가슴에 집게처럼 마주 보는 뿔이 발달한 열대 장수풍뎅이다. 뿔 사이에 상대를 끼워 들어 올리며 힘겨루기를 한다.", image: "/insects-original/04.png", habitatId: "forest", registered: true, rank: demoRank(4) },
  { id: 5, name: "흰점박이꽃무지", scientificName: "Protaetia brevitarsis", feature: "검거나 구릿빛이 도는 몸에 작은 흰 점들이 흩어져 있다. 꽃가루와 과일, 나무 수액을 먹으며 날 때 딱지날개를 크게 펼치지 않는 특징이 있다.", image: "/insects-original/05.png", habitatId: "forest", registered: false, rank: null },
  { id: 6, name: "벼룩잎벌레", scientificName: "Phyllotreta", feature: "몸길이가 매우 작고 뒷다리가 발달하여 벼룩처럼 멀리 뛴다. 배추와 무 같은 밭작물의 잎에 작은 구멍을 내며 먹는다.", image: "/insects-original/06.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null }, // 종 확인 필요, 속만 확신
  { id: 7, name: "사시나무잎벌레", scientificName: "Chrysomela populi", feature: "주황색 또는 붉은색 딱지날개에 검은 점무늬가 줄지어 있다. 사시나무와 버드나무의 잎을 갉아 먹는다.", image: "/insects-original/07.png", habitatId: "grass", grassZone: "tree", registered: false, rank: demoRank(7) },
  { id: 8, name: "중국청람색잎벌레", scientificName: null, feature: "몸 전체가 짙은 청색이나 남색의 금속광택으로 반짝인다. 박주가리와 하수오 등의 잎을 먹으며, 박주가리의 독성 물질을 견딜 수 있다.", image: "/insects-original/08.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null }, // 학명 확인 필요
  { id: 9, name: "버들잎벌레", scientificName: "Plagiodera versicolora", feature: "둥글고 볼록한 몸에 검은색과 노란색 또는 붉은색 무늬가 나타난다. 애벌레와 어른벌레 모두 버드나무 잎을 무리 지어 갉아 먹는다.", image: "/insects-original/09.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 10, name: "톱사슴벌레", scientificName: "Prosopocoilus inclinatus", feature: "수컷의 큰턱 안쪽에 톱날처럼 여러 개의 돌기가 나 있다. 참나무 수액을 먹으며, 큰턱으로 상대를 붙잡아 밀어낸다.", image: "/insects-original/10.png", habitatId: "forest", registered: false, rank: demoRank(10) },
  { id: 11, name: "왕사슴벌레", scientificName: "Dorcus hopei", feature: "검고 윤기 나는 몸과 굵고 튼튼한 큰턱을 가진 사슴벌레다. 큰턱 안쪽의 굵은 돌기가 특징이며 주로 밤에 참나무 수액을 찾아다닌다.", image: "/insects-original/11.png", habitatId: "forest", registered: false, rank: null },
  { id: 12, name: "넓적사슴벌레", scientificName: "Dorcus titanus", feature: "몸이 넓고 납작하며 수컷의 큰턱이 길고 힘이 세다. 우리나라의 사슴벌레 가운데 몸집이 큰 편이고 성격도 비교적 활발하다.", image: "/insects-original/12.png", habitatId: "forest", registered: false, rank: null },
  { id: 13, name: "애사슴벌레", scientificName: "Dorcus rectus", feature: "다른 사슴벌레보다 몸집이 작고 수컷의 큰턱도 짧은 편이다. 비교적 다양한 숲에서 살며 밤에 나무 수액을 먹는다.", image: "/insects-original/13.png", habitatId: "forest", registered: false, rank: demoRank(13) },
  { id: 14, name: "칠성무당벌레", scientificName: "Coccinella septempunctata", feature: "붉은 딱지날개에 검은 점 일곱 개가 있다. 진딧물을 많이 잡아먹어 농작물을 지켜 주는 이로운 곤충이다.", image: "/insects-original/14.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 15, name: "남생이무당벌레", scientificName: "Aiolocaria hexaspilota", feature: "황갈색 딱지날개에 검은 얼룩무늬가 있어 남생이의 등딱지를 닮았다. 진딧물과 깍지벌레 같은 작은 해충을 잡아먹는다.", image: "/insects-original/15.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 16, name: "이십팔점박이무당벌레", scientificName: "Henosepilachna vigintioctopunctata", feature: "노란빛이 도는 갈색 딱지날개에 검은 점이 모두 스물여덟 개 있다. 다른 무당벌레와 달리 감자나 가지 등의 잎을 갉아 먹는다.", image: "/insects-original/16.png", habitatId: "grass", grassZone: "flower", registered: true, rank: demoRank(16) },
  { id: 18, name: "알락하늘소", scientificName: "Anoplophora chinensis", feature: "검은 몸에 흰 점무늬가 촘촘하고 긴 더듬이에 검고 흰 줄무늬가 있다. 애벌레는 나무줄기 속을 파먹으며 자란다.", image: "/insects-original/18.png", habitatId: "forest", registered: false, rank: null },
  { id: 19, name: "장수하늘소", scientificName: "Callipogon relictus", feature: "몸길이가 매우 크고 긴 더듬이를 가진 우리나라의 대표적인 대형 하늘소다. 오래된 활엽수림에 살며 개체 수가 매우 적어 보호받고 있다.", image: "/insects-original/19.png", habitatId: "forest", registered: false, rank: demoRank(19) },
  { id: 20, name: "참나무하늘소", scientificName: "Massicus", feature: "갈색 몸에 매우 긴 더듬이를 가진 큰 하늘소다. 애벌레는 참나무류의 죽거나 약해진 줄기 속에서 나무를 먹으며 자란다.", image: "/insects-original/20.png", habitatId: "forest", registered: false, rank: null }, // 종 확인 필요, 속만 확신
  { id: 21, name: "솔수염하늘소", scientificName: "Monochamus alternatus", feature: "소나무에서 주로 발견되는 회갈색 하늘소다. 소나무재선충을 다른 소나무로 옮길 수 있어 산림 관리에서 중요하게 살펴보는 곤충이다.", image: "/insects-original/21.png", habitatId: "forest", registered: false, rank: null },
  { id: 22, name: "뽕나무하늘소", scientificName: "Apriona germari", feature: "몸은 회갈색이며 딱지날개에 여러 개의 작은 검은 점이 있다. 애벌레가 뽕나무와 무화과나무 등의 줄기 속을 파먹는다.", image: "/insects-original/22.png", habitatId: "forest", registered: true, rank: demoRank(22) },
  { id: 23, name: "멋쟁이딱정벌레", scientificName: null, feature: "검은 몸에 붉은색이나 금속성 무늬가 있어 화려하게 보인다. 땅 위를 빠르게 돌아다니며 애벌레와 작은 곤충을 잡아먹는다.", image: "/insects-original/23.png", habitatId: "forest", registered: false, rank: null }, // 학명 확인 필요
  { id: 24, name: "비단벌레", scientificName: "Chrysochroa fulgidissima", feature: "몸이 초록색·청색·붉은색 등의 금속광택으로 아름답게 빛난다. 애벌레는 죽거나 약해진 나무 속에서 살며 나무 조직을 먹는다.", image: "/insects-original/24.png", habitatId: "forest", registered: false, rank: null },
  { id: 25, name: "길앞잡이", scientificName: "Cicindela chinensis", feature: "큰 눈과 날카로운 큰턱을 가진 빠른 사냥꾼이다. 사람이 다가가면 길 앞쪽으로 날아가 다시 내려앉는 행동 때문에 이런 이름이 붙었다.", image: "/insects-original/25.png", habitatId: "soil", registered: true, rank: demoRank(25) },
  { id: 26, name: "쇠똥구리", scientificName: "Copris", feature: "소나 말 같은 초식동물의 똥을 먹거나 둥글게 굴려 땅속에 저장한다. 똥을 분해하고 흙을 기름지게 만들어 자연의 청소부 역할을 한다.", image: "/insects-original/26.png", habitatId: "soil", registered: false, rank: null }, // 종 확인 필요, 속만 확신
  { id: 27, name: "반딧불이", scientificName: "Luciola lateralis", feature: "배 끝의 발광기관에서 차가운 빛을 낸다. 빛을 깜빡여 짝을 찾으며, 애벌레는 깨끗한 물가에서 다슬기와 작은 동물을 잡아먹는다.", image: "/insects-original/27.png", habitatId: "pond", registered: false, rank: null },
  { id: 28, name: "호랑나비", scientificName: "Papilio xuthus", feature: "노란 날개에 검은 줄무늬가 있어 호랑이 무늬처럼 보인다. 뒷날개에는 꼬리 모양 돌기가 있으며 애벌레는 산초나 탱자나무 잎을 먹는다.", image: "/insects-original/28.png", habitatId: "grass", grassZone: "flower", registered: false, rank: demoRank(28) },
  { id: 29, name: "배추흰나비", scientificName: "Pieris rapae", feature: "흰 날개 끝에 검은 무늬가 있는 흔한 나비다. 애벌레는 초록색으로 배추와 무 같은 십자화과 식물의 잎을 먹는다.", image: "/insects-original/29.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 30, name: "제비나비", scientificName: "Papilio bianor", feature: "검은 날개에 푸른색 또는 초록색 광택이 나며 뒷날개에 제비꼬리 같은 돌기가 있다. 꽃의 꿀을 먹고 애벌레는 산초나 황벽나무 등의 잎을 먹는다.", image: "/insects-original/30.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 31, name: "노랑나비", scientificName: "Colias erate", feature: "날개가 밝은 노란색이며 가장자리에 검은 무늬가 나타난다. 햇볕이 잘 드는 풀밭을 빠르게 날아다니고 콩과식물에 알을 낳는다.", image: "/insects-original/31.png", habitatId: "grass", grassZone: "flower", registered: false, rank: demoRank(31) },
  { id: 32, name: "유리창나비", scientificName: "Dilipa fenestra", feature: "앞날개 끝에 유리창처럼 투명하게 비치는 무늬가 있다. 이른 봄 숲 가장자리와 계곡 주변에서 나타나는 아름다운 나비다.", image: "/insects-original/32.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 33, name: "부엉이나비", scientificName: "Caligo", feature: "날개에 부엉이의 큰 눈을 닮은 눈알무늬가 있어 천적을 놀라게 한다. 주로 열대 지역에 사는 대형 나방을 가리키는 이름으로 사용된다.", image: "/insects-original/33.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null }, // 종 확인 필요, 속만 확신
  { id: 34, name: "누에나방", scientificName: "Bombyx mori", feature: "몸이 희고 통통하며 날개가 있지만 사육된 누에나방은 잘 날지 못한다. 애벌레인 누에는 뽕잎을 먹고 입에서 실을 뽑아 고치를 만든다.", image: "/insects-original/34.png", habitatId: "grass", grassZone: "tree", registered: false, rank: demoRank(34) },
  { id: 35, name: "태극나방", scientificName: null, feature: "뒷날개에 붉은색·푸른색·검은색이 어우러진 둥근 무늬가 있어 태극무늬처럼 보인다. 평소에는 앞날개로 화려한 뒷날개를 가리고 있다가 위험할 때 펼친다.", image: "/insects-original/35.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null }, // 학명 확인 필요
  { id: 36, name: "박각시나방", scientificName: "Agrius convolvuli", feature: "몸이 굵고 날개가 길며 매우 빠르게 난다. 꽃 앞에서 벌새처럼 공중에 머문 채 긴 입을 뻗어 꿀을 먹는다.", image: "/insects-original/36.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 37, name: "나방애벌레", scientificName: null, feature: "부드럽고 긴 몸에 여러 쌍의 배다리가 있으며 대부분 식물의 잎을 먹는다. 다 자라면 번데기 과정을 거쳐 날개 달린 나방으로 변한다.", image: "/insects-original/37.png", habitatId: "grass", grassZone: "tree", registered: false, rank: demoRank(37) }, // 특정 종이 아닌 통칭이라 학명 없음
  { id: 38, name: "서양꿀벌", scientificName: "Apis mellifera", feature: "노란색과 갈색 줄무늬가 있으며 큰 무리를 이루어 벌집에서 산다. 꽃의 꿀과 꽃가루를 모아 꿀을 만들고 농작물의 꽃가루받이를 돕는다.", image: "/insects-original/38.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 39, name: "토종꿀벌", scientificName: "Apis cerana", feature: "우리나라 환경에 오래 적응해 온 꿀벌로, 서양꿀벌보다 몸이 조금 작고 검은빛이 강하다. 나무 구멍이나 벌통에 집을 짓고 다양한 야생화의 꿀을 모은다.", image: "/insects-original/39.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 40, name: "호박벌", scientificName: "Bombus ignitus", feature: "몸이 크고 둥글며 검고 노란 털이 복슬복슬하게 나 있다. 낮은 온도에서도 활동할 수 있고 몸을 떨며 꽃가루를 떨어뜨리는 꽃가루 받이를 한다.", image: "/insects-original/40.png", habitatId: "grass", grassZone: "flower", registered: false, rank: demoRank(40) },
  { id: 41, name: "장수말벌", scientificName: "Vespa mandarinia", feature: "머리가 크고 주황색이며 몸집이 매우 큰 말벌이다. 큰턱과 강한 독침으로 다른 곤충을 사냥하므로 벌집 가까이에서는 함부로 접근하면 안 된다.", image: "/insects-original/41.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 42, name: "땅벌", scientificName: "Vespula flaviceps", feature: "땅속의 빈 공간이나 동물의 옛 굴에 종이 같은 벌집을 만든다. 여러 마리가 무리를 이루며 집을 건드리면 떼로 방어하기 때문에 주의해야 한다.", image: "/insects-original/42.png", habitatId: "forest", registered: false, rank: null },
  { id: 43, name: "쌍살벌", scientificName: "Polistes", feature: "가늘고 긴 다리를 늘어뜨린 채 날며 처마 밑이나 나뭇가지에 작은 벌집을 만든다. 애벌레에게 먹이기 위해 나비나 나방의 애벌레를 사냥한다.", image: "/insects-original/43.png", habitatId: "grass", grassZone: "tree", registered: true, rank: demoRank(43) }, // 종 확인 필요, 속만 확신
  { id: 44, name: "일본왕개미", scientificName: "Camponotus japonicus", feature: "몸집이 크고 검은색인 대표적인 왕개미다. 땅속이나 썩은 나무에 큰 집을 만들며 단맛이 나는 액체와 작은 곤충을 먹는다.", image: "/insects-original/44.png", habitatId: "soil", registered: false, rank: null },
  { id: 45, name: "가시개미", scientificName: "Polyrhachis lamellidens", feature: "가슴 뒤쪽에 뾰족한 가시가 발달한 검은 개미다. 주로 나무 위에서 생활하며 다른 개미의 집을 빼앗아 새로운 군체를 만들기도 한다.", image: "/insects-original/45.png", habitatId: "soil", registered: false, rank: null },
  { id: 46, name: "불개미", scientificName: "Formica japonica", feature: "몸이 붉은빛이나 적갈색을 띠며 햇볕이 잘 드는 땅에 집을 짓는다. 침입자를 큰턱으로 물고 배 끝에서 자극성 물질을 내보내 따갑게 만든다.", image: "/insects-original/46.png", habitatId: "soil", registered: false, rank: demoRank(46) },
  { id: 47, name: "짱구개미", scientificName: "Pristomyrmex punctatus", feature: "머리가 크고 네모지거나 둥글게 발달한 일개미가 섞여 있는 작은 개미다. 큰 머리와 강한 큰턱을 이용해 단단한 먹이를 부수거나 집을 지킨다.", image: "/insects-original/47.png", habitatId: "soil", registered: false, rank: null },
  { id: 48, name: "참매미", scientificName: "Hyalessa fuscata", feature: "몸은 검은색이고 초록빛 무늬가 있으며 날개가 투명하다. 여름 낮에 일정한 리듬의 울음소리를 내며 나무줄기의 수액을 먹는다.", image: "/insects-original/48.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 49, name: "말매미", scientificName: "Cryptotympana atrata", feature: "우리나라 매미 가운데 몸집이 매우 큰 편이며 검은 몸에 초록색 무늬가 있다. 한여름에 크고 힘찬 소리로 길게 울어 쉽게 알아볼 수 있다.", image: "/insects-original/49.png", habitatId: "street-trees", registered: false, rank: demoRank(49) },
  { id: 50, name: "유지매미", scientificName: "Graptopsaltria nigrofuscata", feature: "몸에 녹색·검은색·갈색 무늬가 복잡하게 섞여 있어 나무껍질에 잘 숨는다. 날개에는 짙은 얼룩무늬가 있고 기름 끓는 듯한 소리로 운다.", image: "/insects-original/50.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 51, name: "쓰름매미", scientificName: "Meimuna opalifera", feature: "검은 몸에 초록색과 갈색 무늬가 있으며 투명한 날개에 어두운 점무늬가 있다. ‘쓰르라미’처럼 들리는 비교적 높고 맑은 소리로 운다.", image: "/insects-original/51.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 52, name: "꽃매미", scientificName: "Lycorma delicatula", feature: "회갈색 앞날개에 검은 점이 있고, 뒷날개는 붉은색과 검은색으로 화려하다. 나무의 즙을 빨아 먹고 많은 배설물을 남겨 식물에 피해를 줄 수 있다.", image: "/insects-original/52.png", habitatId: "street-trees", registered: false, rank: demoRank(52) },
  { id: 53, name: "썩덩나무노린재", scientificName: "Halyomorpha halys", feature: "갈색 몸에 얼룩무늬가 있어 나무껍질과 비슷하게 보인다. 위험을 느끼면 강한 냄새를 내며 과일과 농작물의 즙을 빨아 먹는다.", image: "/insects-original/53.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 54, name: "광대노린재", scientificName: "Poecilocoris lewisi", feature: "검은 바탕에 붉은색이나 노란색 무늬가 선명해 광대의 옷처럼 화려하다. 이런 눈에 띄는 색깔로 자신에게 불쾌한 냄새나 맛이 있음을 천적에게 알린다.", image: "/insects-original/54.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 55, name: "소금쟁이", scientificName: "Aquarius paludum", feature: "길고 가는 다리 끝의 잔털과 기름 성분을 이용해 물 위에 뜬다. 수면에 떨어진 작은 곤충의 진동을 느끼고 빠르게 다가가 잡아먹는다.", image: "/insects-original/55.png", habitatId: "pond", registered: false, rank: demoRank(55) },
  { id: 56, name: "물장군", scientificName: "Lethocerus deyrolli", feature: "몸이 크고 납작한 대형 수서곤충이다. 강한 앞다리로 물고기와 올챙이 등을 붙잡고, 수컷이 물 밖에 낳은 알을 지키며 물을 묻혀 준다.", image: "/insects-original/56.png", habitatId: "pond", registered: false, rank: null },
  { id: 57, name: "큰물자라", scientificName: "Appasus major", feature: "갈색의 넓적한 몸과 사냥용 앞다리를 가진 물속 노린재다. 암컷이 수컷의 등에 알을 붙이면 수컷은 알이 깨어날 때까지 등에 지고 다닌다.", image: "/insects-original/57.png", habitatId: "pond", registered: false, rank: null },
  { id: 58, name: "물방개", scientificName: "Cybister japonicus", feature: "매끈한 타원형 몸과 노처럼 넓적한 뒷다리로 물속을 빠르게 헤엄친다. 물속 곤충과 올챙이 등을 잡아먹고 수면 위로 올라와 공기를 저장한다.", image: "/insects-original/58.png", habitatId: "pond", registered: true, rank: demoRank(58) },
  { id: 59, name: "선녀벌레", scientificName: "Geisha distinctissima", feature: "어른벌레는 연한 갈색 또는 회색이며 식물의 즙을 빨아 먹는다. 어린벌레는 몸 뒤에 흰 솜털 같은 밀랍 물질이 달려 있어 작은 선녀처럼 보인다.", image: "/insects-original/59.png", habitatId: "grass", grassZone: "tree", registered: false, rank: null },
  { id: 60, name: "고추잠자리", scientificName: "Crocothemis servilia", feature: "수컷은 성숙하면 몸 전체가 고추처럼 선명한 붉은색이 된다. 연못이나 논 주변의 높은 풀 끝에 앉아 작은 날벌레를 사냥한다.", image: "/insects-original/60.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 61, name: "왕잠자리", scientificName: "Anax parthenope", feature: "몸집이 크고 가슴은 초록색, 배에는 푸른색이나 초록색 무늬가 있다. 쉬지 않고 넓은 구역을 빠르게 날아다니며 곤충을 사냥한다.", image: "/insects-original/61.png", habitatId: "street-trees", registered: false, rank: demoRank(61) },
  { id: 62, name: "된장잠자리", scientificName: "Pantala flavescens", feature: "몸이 된장처럼 황갈색이며 배에 검은 줄무늬가 있다. 먼 거리를 이동하는 능력이 뛰어나고 일시적으로 생긴 웅덩이에서도 번식한다.", image: "/insects-original/62.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 63, name: "장수잠자리", scientificName: "Anotogaster sieboldii", feature: "검은 몸에 노란 줄무늬가 있고 배가 길며 튼튼한 대형 잠자리다. 산속 계곡 주변을 힘차게 날며 다른 곤충을 잡아먹는다.", image: "/insects-original/63.png", habitatId: "street-trees", registered: false, rank: null },
  { id: 64, name: "실잠자리", scientificName: "Ischnura asiatica", feature: "몸이 바늘이나 실처럼 매우 가늘고 작다. 쉴 때 대부분 날개를 등 위로 모으며 물가의 풀 사이를 천천히 날아다닌다.", image: "/insects-original/64.png", habitatId: "pond", registered: false, rank: demoRank(64) },
  { id: 65, name: "물잠자리", scientificName: "Calopteryx atrata", feature: "수컷은 날개가 짙은 청흑색으로 빛나고 몸은 초록빛 금속광택을 띤다. 깨끗한 계곡이나 흐르는 물 주변에서 나비처럼 천천히 날아다닌다.", image: "/insects-original/65.png", habitatId: "pond", registered: false, rank: null },
  { id: 66, name: "왕사마귀", scientificName: "Tenodera angustipennis", feature: "몸집이 크고 초록색 또는 갈색이며 앞다리에 날카로운 가시가 많다. 풀숲에서 움직이지 않고 기다리다가 곤충을 빠르게 붙잡아 먹는다.", image: "/insects-original/66.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 67, name: "넓적배사마귀", scientificName: "Hierodula patellifera", feature: "배가 넓고 납작하며 몸에 나뭇잎과 비슷한 얼룩무늬가 있다. 나뭇가지나 줄기에 몸을 숨기고 가까이 오는 곤충을 사냥한다.", image: "/insects-original/67.png", habitatId: "grass", grassZone: "flower", registered: false, rank: demoRank(67) },
  { id: 68, name: "참사마귀", scientificName: "Statilia maculata", feature: "몸이 길고 가늘며 초록색 또는 갈색을 띤다. 왕사마귀와 비슷하지만 몸과 가슴이 더 가늘고 길어 날씬하게 보인다.", image: "/insects-original/68.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 69, name: "벼메뚜기", scientificName: "Oxya chinensis", feature: "몸이 연한 갈색이나 초록색이며 논과 풀밭에서 흔히 볼 수 있다. 벼와 여러 풀의 잎을 먹고 긴 뒷다리로 멀리 뛴다.", image: "/insects-original/69.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 70, name: "방아깨비", scientificName: "Acrida cinerea", feature: "머리가 뾰족하고 몸이 길쭉하여 풀잎처럼 보인다. 뒷다리를 잡으면 몸을 방아 찧듯 위아래로 움직이는 행동을 한다.", image: "/insects-original/70.png", habitatId: "grass", grassZone: "flower", registered: true, rank: demoRank(70) },
  { id: 71, name: "여치", scientificName: "Gampsocleis sedakovii", feature: "잎처럼 넓은 날개와 매우 긴 더듬이를 가지고 있다. 풀과 나뭇잎을 먹기도 하지만 작은 곤충을 잡아먹는 잡식성 사냥꾼이다.", image: "/insects-original/71.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 72, name: "귀뚜라미", scientificName: "Teleogryllus emma", feature: "검거나 갈색인 몸에 매우 긴 더듬이가 있다. 수컷이 앞날개를 서로 비벼 ‘귀뚤귀뚤’ 소리를 내어 암컷을 부른다.", image: "/insects-original/72.png", habitatId: "grass", grassZone: "flower", registered: false, rank: null },
  { id: 73, name: "방울벌레", scientificName: "Homoeogryllus japonicus", feature: "몸은 작고 갈색 또는 검은색이며 수컷의 앞날개가 넓다. 가을밤에 앞날개를 비벼 방울이 울리는 듯한 맑은 소리를 낸다.", image: "/insects-original/73.png", habitatId: "grass", grassZone: "flower", registered: false, rank: demoRank(73) },
  { id: 74, name: "꼽등이", scientificName: "Diestrammena japonica", feature: "등이 굽고 뒷다리와 더듬이가 매우 길며 날개가 없다. 어둡고 습한 동굴이나 지하실에서 살며 놀라면 높이 뛰어오른다.", image: "/insects-original/74.png", habitatId: "forest", registered: false, rank: null },
  { id: 75, name: "땅강아지", scientificName: "Gryllotalpa orientalis", feature: "앞다리가 두더지의 발처럼 넓고 강하게 발달했다. 땅속에 굴을 파며 식물의 뿌리와 작은 동물을 먹고, 수컷은 굴 입구에서 크게 운다.", image: "/insects-original/75.png", habitatId: "soil", registered: false, rank: null },
  { id: 76, name: "대벌레", scientificName: "Ramulus mikado", feature: "몸과 다리가 길고 가늘어 마른 나뭇가지처럼 보인다. 움직임을 멈추거나 몸을 흔들어 나뭇가지인 것처럼 위장하며 나뭇잎을 먹는다.", image: "/insects-original/76.png", habitatId: "forest", registered: false, rank: demoRank(76) },
  { id: 77, name: "집게벌레", scientificName: null, feature: "배 끝에 집게처럼 생긴 한 쌍의 꼬리집게가 있다. 집게는 자신을 지키거나 먹이를 붙잡고 날개를 정리할 때 사용한다.", image: "/insects-original/77.png", habitatId: "soil", registered: false, rank: null }, // 학명 확인 필요 (국내 종만 여러 속)
  { id: 78, name: "공벌레", scientificName: "Armadillidium vulgare", feature: "몸이 여러 개의 단단한 마디로 덮여 있으며 위험하면 공처럼 둥글게 몸을 만다. 축축한 낙엽 밑에서 썩은 식물을 먹어 자연의 분해를 돕는다.", image: "/insects-original/78.png", habitatId: "soil", registered: false, rank: null },
  { id: 79, name: "지렁이", scientificName: null, feature: "다리가 없는 길고 부드러운 몸으로 흙속을 이동한다. 흙과 썩은 유기물을 먹고 굴을 만들면서 흙에 공기가 잘 통하게 한다.", image: "/insects-original/79.png", habitatId: "soil", registered: false, rank: demoRank(79) }, // 특정 종이 아닌 통칭이라 학명 없음
  { id: 80, name: "돈벌레", scientificName: "Scutigera coleoptrata", feature: "몸에 매우 긴 다리가 여러 쌍 달려 있어 빠르게 달린다. 집 안의 어둡고 습한 곳에 살면서 바퀴벌레의 어린 개체나 작은 벌레를 잡아먹는다.", image: "/insects-original/80.png", habitatId: "soil", registered: false, rank: null },
]

// 데모용 잠금 카드 id 목록. 비워두면 80종 전체가 registered: true로 표시된다.
// kang7330 계정에서만 이 데모 등록 상태를 보여주고(개발/전시용 고정 데이터), 그 외 신규 계정은
// 전부 미등록 상태(getInsectSpecies(false))로 시작한다 — 실제 진행도는 RegisteredPhotosContext에서 온다.
// 무작위로 고른 20종을 미등록(잠금) 상태로 둔다: 21 솔수염하늘소, 23 멋쟁이딱정벌레, 26 쇠똥구리,
// 30 제비나비, 31 노랑나비, 35 태극나방, 40 호박벌, 41 장수말벌, 50 유지매미, 53 썩덩나무노린재,
// 57 큰물자라, 58 물방개, 59 선녀벌레, 60 고추잠자리, 62 된장잠자리, 63 장수잠자리, 71 여치,
// 74 꼽등이, 75 땅강아지, 78 공벌레.
const DEMO_LOCKED_IDS = [21, 23, 26, 30, 31, 35, 40, 41, 50, 53, 57, 58, 59, 60, 62, 63, 71, 74, 75, 78]
export const DEMO_ACCOUNT_USERNAME = 'kang7330'

function buildSpecies(species, { demo }) {
  const locked = demo && DEMO_LOCKED_IDS.includes(species.id)
  const registered = demo && !locked
  const rank = registered ? 'bronze' : null
  const defaultUrl = species.image
  const photoUrl = registered && rank === "gold" ? species.image : null
  const sketchUrl = registered && rank === "silver" ? species.image : null
  const registeredRanks = {
    gold: Boolean(photoUrl),
    silver: Boolean(sketchUrl),
    bronze: registered,
  }

  return {
    ...species,
    registered,
    rank,
    representativeRank: rank,
    defaultUrl: registered ? defaultUrl : null,
    photoUrl,
    sketchUrl,
    registeredRanks,
    habitats: [species.habitatId],
  }
}

// 실제(비-데모) 기본 목록 — 신규 계정은 전부 미등록 상태다.
export const INSECT_SPECIES = INSECT_SPECIES_RAW.map((species) => buildSpecies(species, { demo: false }))
// kang7330 전용 데모 등록 목록 — 목장 대객체 배치·피라미드 전시용으로 고정해서 계속 쓴다.
const DEMO_INSECT_SPECIES = INSECT_SPECIES_RAW.map((species) => buildSpecies(species, { demo: true }))

export function getInsectSpecies(isDemoAccount) {
  return isDemoAccount ? DEMO_INSECT_SPECIES : INSECT_SPECIES
}

export function getSpeciesByHabitat(habitatId, speciesList = INSECT_SPECIES) {
  return speciesList.filter((s) => s.habitatId === habitatId)
}

export function getHabitatStats(habitatId, speciesList = INSECT_SPECIES) {
  const list = getSpeciesByHabitat(habitatId, speciesList)
  return { registered: list.filter((s) => s.registered).length, total: list.length }
}

// 도감 목록 분류 체계 — 서식지 대신 곤충 종류 기준으로 표시한다.
// 정확한 종 배정은 추후 확정 예정이라 지금은 SPECIES_CATEGORY가 비어 있고, 모든 종이 미배정 상태다.
export const INSECT_CATEGORIES = [
  { id: "beetle", name: "풍뎅이" },
  { id: "leaf-beetle", name: "잎벌레" },
  { id: "stag-beetle", name: "사슴벌레" },
  { id: "ladybug", name: "무당벌레" },
  { id: "longhorn-beetle", name: "하늘소" },
  { id: "random", name: "무작위" },
  { id: "event", name: "이벤트" },
  { id: "butterfly", name: "나비" },
  { id: "moth", name: "나방" },
  { id: "bee", name: "꿀벌" },
  { id: "wasp", name: "말벌" },
  { id: "ant", name: "개미" },
  { id: "cicada", name: "매미" },
  { id: "stink-bug", name: "노린재" },
  { id: "planthopper", name: "매미충" },
  { id: "dragonfly", name: "잠자리" },
  { id: "mantis", name: "사마귀" },
  { id: "grasshopper", name: "메뚜기" },
  { id: "aquatic", name: "수생" },
  { id: "etc", name: "기타" },
]

// id → categoryId 매핑. 정확한 분류가 정해지면 여기를 채운다 (예: 1: "beetle").
export const SPECIES_CATEGORY = {
  // 풍뎅이: 장수풍뎅이, 외뿔장수풍뎅이, 청동풍뎅이, 기드온장수풍뎅이("주둥이풍뎅이" 요청분 — 목록엔 이 이름이 없어 대신 매핑), 흰점박이꽃무지
  1: "beetle",
  2: "beetle",
  3: "beetle",
  4: "beetle",
  5: "beetle",
  // 잎벌레: 벼룩잎벌레, 사시나무잎벌레, 중국청람색잎벌레, 버들잎벌레
  6: "leaf-beetle",
  7: "leaf-beetle",
  8: "leaf-beetle",
  9: "leaf-beetle",
  // 사슴벌레: 톱사슴벌레, 왕사슴벌레, 넓적사슴벌레, 애사슴벌레
  10: "stag-beetle",
  11: "stag-beetle",
  12: "stag-beetle",
  13: "stag-beetle",
  // 무당벌레: 칠성무당벌레, 남생이무당벌레, 이십팔점박이무당벌레
  14: "ladybug",
  15: "ladybug",
  16: "ladybug",
  // 하늘소: 알락하늘소, 장수하늘소, 참나무하늘소, 솔수염하늘소, 뽕나무하늘소
  18: "longhorn-beetle",
  19: "longhorn-beetle",
  20: "longhorn-beetle",
  21: "longhorn-beetle",
  22: "longhorn-beetle",
  // 무작위: 멋쟁이딱정벌레, 비단벌레, 길앞잡이, 쇠똥구리
  23: "random",
  24: "random",
  25: "random",
  26: "random",
  // 이벤트: 반딧불이
  27: "event",
  // 나비: 호랑나비, 배추흰나비, 제비나비, 노랑나비, 유리창나비
  28: "butterfly",
  29: "butterfly",
  30: "butterfly",
  31: "butterfly",
  32: "butterfly",
  // 나방: "부엉이나방"(요청분, 목록엔 부엉이나비=33으로 등록되어 있어 대신 매핑), 누에나방, 태극나방, 박각시나방, 나방애벌레
  33: "moth",
  34: "moth",
  35: "moth",
  36: "moth",
  37: "moth",
  // 꿀벌: 서양꿀벌, 토종꿀벌, 호박벌
  38: "bee",
  39: "bee",
  40: "bee",
  // 말벌: 장수말벌, 땅벌, 쌍살벌
  41: "wasp",
  42: "wasp",
  43: "wasp",
  // 개미: 일본왕개미, 가시개미, 불개미, 짱구개미
  44: "ant",
  45: "ant",
  46: "ant",
  47: "ant",
  // 매미: 참매미, 말매미, 유지매미, 쓰름매미, 꽃매미
  48: "cicada",
  49: "cicada",
  50: "cicada",
  51: "cicada",
  52: "cicada",
  // 노린재: 썩덩나무노린재, 광대노린재
  53: "stink-bug",
  54: "stink-bug",
  // 수생: 소금쟁이, 물장군, 큰물자라, 물방개
  55: "aquatic",
  56: "aquatic",
  57: "aquatic",
  58: "aquatic",
  // 매미충: 선녀벌레
  59: "planthopper",
  // 잠자리: 고추잠자리, 왕잠자리, 된장잠자리, 장수잠자리, 실잠자리, 물잠자리
  60: "dragonfly",
  61: "dragonfly",
  62: "dragonfly",
  63: "dragonfly",
  64: "dragonfly",
  65: "dragonfly",
  // 사마귀: 왕사마귀, 넓적배사마귀, 참사마귀
  66: "mantis",
  67: "mantis",
  68: "mantis",
  // 메뚜기: 벼메뚜기, 방아깨비, 여치, 귀뚜라미, 방울벌레, 꼽등이
  69: "grasshopper",
  70: "grasshopper",
  71: "grasshopper",
  72: "grasshopper",
  73: "grasshopper",
  74: "grasshopper",
  // 기타: 땅강아지, 대벌레, 집게벌레, 공벌레, 지렁이, 돈벌레
  75: "etc",
  76: "etc",
  77: "etc",
  78: "etc",
  79: "etc",
  80: "etc",
}

export function getSpeciesCategory(id) {
  return SPECIES_CATEGORY[id] ?? null
}

export function getSpeciesByCategory(categoryId, speciesList = INSECT_SPECIES) {
  return speciesList.filter((s) => getSpeciesCategory(s.id) === categoryId)
}

export function getCategoryStats(categoryId, speciesList = INSECT_SPECIES) {
  const list = getSpeciesByCategory(categoryId, speciesList)
  return { registered: list.filter((s) => s.registered).length, total: list.length }
}

export const INSECT_TOTAL = INSECT_SPECIES.length
export const INSECT_REGISTERED_COUNT = INSECT_SPECIES.filter((s) => s.registered).length
