/* ===================== 리틀 바이올로지스트 - 프로토타입 앱 (v2) =====================
 * Architecture_정의서.pdf 반영:
 *  - 화면(app.js)은 순수 "클라이언트" 역할만 하고, 실제 서버 호출은 전부
 *    api/mockApi.js 의 API.* 함수를 통해서만 이루어지도록 구성했습니다.
 *  - 로그인=계정서버, 사진/그림 등록=이미지전처리+AI분석엔진, 챗봇/퀴즈=AI대화서버,
 *    상점/가챠=컨텐츠&랭크서버, 날씨/동네지도=외부 API(OpenWeatherMap/GBIF/카카오맵) 로 매핑됩니다.
 * ===================================================================================== */

const RANK_INFO = {
  gold:   { label: "금", color: "#f2b705", icon: "🥇" },
  silver: { label: "은", color: "#9aa5ad", icon: "🥈" },
  bronze: { label: "동", color: "#a97c50", icon: "🥉" },
};

const SPECIES_DB = [
  { id: "s1", name: "칠성무당벌레", emoji: "🐞", category: "곤충", desc: "빨간 등에 검은 점 7개가 있어요. 진딧물을 잡아먹는 익충이에요.", habitat: "숲, 꽃밭", rank: "gold", place: "숲 서식지", when: "10분 전" },
  { id: "s2", name: "배추흰나비", emoji: "🦋", category: "곤충", desc: "하얀 날개를 팔랑이며 꽃밭을 날아다녀요.", habitat: "꽃밭, 들판", rank: "gold", place: "꽃밭", when: "1시간 전" },
  { id: "s3", name: "청개구리", emoji: "🐸", category: "양서류", desc: "비 오는 날 더 활발해지는 작은 초록 개구리예요.", habitat: "연못, 논", rank: "silver", place: "연못", when: "2시간 전" },
  { id: "s4", name: "장수풍뎅이", emoji: "🪲", category: "곤충", desc: "몸길이 30~55mm의 대형 딱정벌레로, 나무의 수액을 먹으며 여름철에 활동해요.", habitat: "숲, 공원, 나무 근처", rank: "gold", place: "곤충 사육장", when: "3시간 전" },
  { id: "s5", name: "도마뱀", emoji: "🦎", category: "파충류", desc: "따뜻한 바위 위에서 일광욕을 즐겨요.", habitat: "바위, 담벼락", rank: "bronze", place: "파충류 사육장", when: "5시간 전" },
  { id: "s6", name: "사슴벌레", emoji: "🐜", category: "곤충", desc: "멋진 큰 턱으로 나무 수액을 두고 다른 사슴벌레와 싸워요.", habitat: "숲, 참나무", rank: "silver" },
  { id: "s7", name: "잠자리", emoji: "🐛", category: "곤충", desc: "네 개의 날개로 정지비행도 할 수 있어요.", habitat: "연못, 하천", rank: "bronze" },
  { id: "s8", name: "메뚜기", emoji: "🦗", category: "곤충", desc: "긴 뒷다리로 멀리 뛰어오를 수 있어요.", habitat: "들판, 풀숲", rank: "gold" },
  { id: "s9", name: "개미", emoji: "🐜", category: "곤충", desc: "협동하여 집을 짓고 먹이를 나르는 사회적 곤충이에요.", habitat: "땅속, 정원", rank: "bronze" },
  { id: "s10", name: "꿀벌", emoji: "🐝", category: "곤충", desc: "꽃가루를 옮기며 꿀을 모으는 부지런한 곤충이에요.", habitat: "꽃밭", rank: "silver" },
  { id: "s11", name: "매미", emoji: "🦗", category: "곤충", desc: "여름철 힘차게 울음소리를 내는 곤충이에요.", habitat: "나무", rank: "gold" },
  { id: "s12", name: "사마귀", emoji: "🦂", category: "곤충", desc: "앞다리를 접고 먹이를 기다리는 사냥꾼이에요.", habitat: "풀숲", rank: null },
  { id: "s13", name: "달팽이", emoji: "🐌", category: "연체동물", desc: "집을 등에 지고 천천히 움직여요.", habitat: "정원, 습지", rank: null },
  { id: "s14", name: "거북이", emoji: "🐢", category: "파충류", desc: "단단한 등딱지를 가진 느긋한 친구예요.", habitat: "연못, 양서류 사육장", rank: null },
  { id: "s15", name: "참새", emoji: "🐦", category: "조류", desc: "우리 주변에서 흔히 볼 수 있는 작은 새예요.", habitat: "나무, 전깃줄", rank: null },
  { id: "s16", name: "고슴도치", emoji: "🦔", category: "포유류", desc: "위험을 느끼면 몸을 동그랗게 말아요.", habitat: "숲, 덤불", rank: null },
  { id: "s17", name: "무당거미", emoji: "🕷️", category: "절지동물", desc: "화려한 무늬의 커다란 거미줄을 쳐요.", habitat: "숲, 처마 밑", rank: null },
  { id: "s18", name: "물방개", emoji: "🪲", category: "곤충", desc: "연못 속을 자유롭게 헤엄쳐 다녀요.", habitat: "연못", rank: null },
];

const NEW_CANDIDATES_PHOTO = [
  { name: "방아깨비", emoji: "🦗", category: "곤충", desc: "긴 뒷다리로 멀리 뛰어오르는 곤충이에요.", habitat: "들판" },
  { name: "호랑나비", emoji: "🦋", category: "곤충", desc: "화려한 무늬의 날개를 가진 나비예요.", habitat: "꽃밭, 숲" },
  { name: "물땅땅이", emoji: "🪲", category: "곤충", desc: "물가에서 자주 발견되는 딱정벌레예요.", habitat: "연못" },
];
const NEW_CANDIDATES_DRAWING = [
  { name: "넓적사슴벌레", emoji: "🐜", category: "곤충", desc: "사슴벌레 중에서도 턱이 넓적한 종류예요.", habitat: "숲" },
  { name: "청거북", emoji: "🐢", category: "파충류", desc: "초록빛이 도는 등딱지를 가졌어요.", habitat: "연못" },
];
const HIDDEN_CREATURE_POOL = [
  { name: "무당벌레 애벌레", emoji: "🐛", category: "곤충", desc: "무당벌레가 되기 전 애벌레 시기예요.", habitat: "돋보기로만 보이는 은신처" },
  { name: "굼벵이", emoji: "🐛", category: "곤충", desc: "장수풍뎅이의 유충으로 땅 속에 숨어있어요.", habitat: "땅속" },
  { name: "쥐며느리", emoji: "🐞", category: "절지동물", desc: "돌 밑이나 낙엽 속에 숨어 사는 작은 생물이에요.", habitat: "돌 밑, 낙엽" },
];

const MAP_SPOTS = [
  { id: 1, name: "숲 서식지", icon: "🌲", count: 5, top: "20%", left: "27%" },
  { id: 2, name: "꽃밭", icon: "🌸", count: 4, top: "12%", left: "56%" },
  { id: 3, name: "연못", icon: "💧", count: 4, top: "54%", left: "17%" },
  { id: 4, name: "곤충 사육장", icon: "🐛", count: 6, top: "56%", left: "45%" },
  { id: 5, name: "파충류 사육장", icon: "🦎", count: 2, top: "38%", left: "68%" },
  { id: 6, name: "온실", icon: "🌿", count: 3, top: "76%", left: "66%" },
];

const RANCH_HABITATS = [
  { name: "숲 서식지", top: "18%", left: "62%" },
  { name: "꽃밭", top: "14%", left: "30%" },
  { name: "연못", top: "45%", left: "40%" },
  { name: "파충류 사육장", top: "40%", left: "76%" },
  { name: "곤충 사육장", top: "62%", left: "56%" },
  { name: "양서류 사육장", top: "68%", left: "80%" },
];
const WILD_CREATURES = [
  { id: "w1", emoji: "🐞", top: "30%", left: "20%" },
  { id: "w2", emoji: "🦋", top: "22%", left: "48%" },
  { id: "w3", emoji: "🐌", top: "58%", left: "30%" },
];

const DAILY_QUESTS = [
  { id: "q1", icon: "📷", title: "탐험을 떠나보자!", desc: "오늘 탐험 지역을 1회 방문해요.", progress: 1, max: 1, leaf: 50, coin: 100, done: true },
  { id: "q2", icon: "📖", title: "도감에 기록하기", desc: "새로운 생물을 도감에 1회 등록해요.", progress: 0, max: 1, leaf: 40, coin: 80, done: false },
  { id: "q3", icon: "🔍", title: "친구의 목장 방문하기", desc: "친구 목장을 1회 방문해요.", progress: 0, max: 1, leaf: 30, coin: 60, done: false },
  { id: "q4", icon: "🎁", title: "AI 말벗과 대화하기", desc: "AI 말벗과 1회 대화해요.", progress: 0, max: 1, leaf: 30, coin: 50, done: false },
  { id: "q5", icon: "💧", title: "목장 식물에 물 주기", desc: "식물에 물을 3회 주세요.", progress: 2, max: 3, leaf: 30, coin: 50, done: false },
];
const WEEKLY_QUESTS = [
  { id: "wq1", icon: "📷", title: "탐험 5회 하기", progress: 0, max: 5, leaf: 150, done: false },
  { id: "wq2", icon: "📖", title: "새로운 생물 3종 등록", progress: 1, max: 33, leaf: 200, done: false },
  { id: "wq3", icon: "👥", title: "친구 목장 5회 방문", progress: 4, max: 50, leaf: 150, done: false },
  { id: "wq4", icon: "💬", title: "AI 말벗과 대화 5회", progress: 2, max: 35, leaf: 150, done: false },
];

const FRIENDS = [
  { name: "초록나무", level: 14, online: true, count: 86, points: 1250 },
  { name: "곤충박사", level: 13, online: true, count: 72, points: 980 },
  { name: "꽃잎소녀", level: 11, online: false, last: "2시간 전", count: 65, points: 870 },
  { name: "숲속탐험가", level: 12, online: false, last: "1일 전", count: 58, points: 760 },
  { name: "나비사랑", level: 10, online: false, last: "3일 전", count: 45, points: 540 },
];

const SHOP_ITEMS = [
  { name: "탐험 돋보기", desc: "생물을 더 자세히 관찰할 수 있어요!", icon: "🔍", price: 150, category: "기타" },
  { name: "탐험 가방 확장", desc: "가방 슬롯을 10칸 확장할 수 있어요!", icon: "🎒", price: 300, category: "기타" },
  { name: "체력 물약", desc: "탐험 시 사용하면 체력이 30 회복돼요!", icon: "🧪", price: 100, category: "기타" },
  { name: "나침반", desc: "목적지까지 빠르게 이동할 수 있어요!", icon: "🧭", price: 200, category: "기타" },
  { name: "가로등", desc: "목장을 은은하게 밝혀주는 장식이에요.", icon: "🏮", price: 180, category: "장식" },
  { name: "깃털 장식", desc: "목장 꾸미기 아이템이에요.", icon: "🪶", price: 120, category: "장식" },
];

const CASH_PACKS = [
  { label: "다이아 50개", icon: "💎", won: 1200 },
  { label: "다이아 130개", icon: "💎", won: 2500, bonus: "10% 더" },
  { label: "다이아 300개", icon: "💎", won: 4900, bonus: "25% 더" },
  { label: "탐험가의 스페셜 패키지", icon: "🎁", won: 5900, bonus: "탐험 필수 패키지" },
];

const CHAT_STARTERS = ["곤충에 대해 알려줘", "식물 키우는 팁 알려줘", "자연 보호 방법 알려줘", "오늘의 날씨는 어때?"];
const CHAT_RESPONSES = {
  "곤충에 대해 알려줘": "곤충은 몸이 머리, 가슴, 배 세 부분으로 나뉘고 다리가 6개예요! 지구에서 가장 종류가 많은 동물 무리랍니다 🐞",
  "식물 키우는 팁 알려줘": "식물은 알맞은 햇빛과 물, 그리고 통풍이 잘 되는 흙이 중요해요. 매일 흙 표면을 만져보고 마르면 물을 주세요 🌱",
  "자연 보호 방법 알려줘": "쓰레기를 함부로 버리지 않고, 곤충이나 동물을 발견하면 조심히 관찰만 하고 원래 있던 자리에 돌려주는 것도 좋은 방법이에요 🌍",
  "오늘의 날씨는 어때?": "오늘은 맑고 23도로 탐험하기 아주 좋은 날씨예요! ☀️ 가벼운 옷차림으로 나가보는 건 어때요?",
  DEFAULT: "우와, 좋은 질문이에요! 조금 더 자세히 알려주면 같이 찾아볼 수 있을 것 같아요 🌿",
};

const QUIZ_QUESTIONS = [
  { q: "식물의 광합성에 대한 설명으로 옳은 것은 무엇일까요?", options: ["빛 에너지를 이용해 이산화탄소와 물로부터 영양분을 만든다.", "빛 에너지를 이용해 산소를 흡수하고 이산화탄소를 배출한다.", "어두운 곳에서만 일어나며, 주로 밤에 에너지를 만든다.", "잎이 없는 식물에서는 광합성이 일어나지 않는다."], answer: 0, explanation: "식물은 빛 에너지를 이용해 이산화탄소와 물로부터 포도당(영양분)을 만들고, 산소를 배출해요." },
  { q: "장수풍뎅이는 주로 무엇을 먹고 살까요?", options: ["다른 곤충", "나무의 수액", "물풀", "흙 속의 미생물"], answer: 1, explanation: "장수풍뎅이는 참나무, 후박나무 등의 수액을 먹으며 여름철에 주로 활동해요." },
  { q: "무당벌레가 진딧물을 잡아먹는 이유로 알맞은 것은?", options: ["장난치기 위해", "먹이이기 때문에", "집을 짓기 위해", "짝짓기를 위해"], answer: 1, explanation: "무당벌레는 진딧물을 먹이로 삼는 대표적인 익충이에요." },
  { q: "청개구리는 어떤 날씨에 더 활발해질까요?", options: ["맑고 건조한 날", "눈이 오는 날", "비가 오는 날", "바람이 부는 날"], answer: 2, explanation: "청개구리는 비가 오는 날 습도가 높아지면 더 활발하게 움직여요." },
  { q: "사슴벌레들이 나무 수액을 두고 싸울 때 사용하는 것은?", options: ["더듬이", "큰 턱", "날개", "다리"], answer: 1, explanation: "사슴벌레는 크고 멋진 턱을 이용해 다른 사슴벌레와 힘겨루기를 해요." },
];

/* ===================== STATE ===================== */
const state = {
  screen: "login",
  loggedIn: false,
  loginLoading: false,
  player: { name: "자연 탐험가", level: 12, exp: 320, expMax: 500, leaf: 1250, coin: 8450, gem: 230 },
  species: JSON.parse(JSON.stringify(SPECIES_DB)),
  guideFilter: "전체",
  guideSearch: "",
  selectedSpeciesId: "s4",
  justAddedId: null,
  daily: JSON.parse(JSON.stringify(DAILY_QUESTS)),
  weekly: JSON.parse(JSON.stringify(WEEKLY_QUESTS)),
  chat: [{ from: "bot", text: "안녕! 나는 자연을 사랑하는 AI 말벗이야! 궁금한 것이 있으면 무엇이든 물어봐~" }],
  chatVisited: false,
  chatSending: false,
  modal: null, // 'preprocessing' | 'analyzing' | 'success' | 'hidden-creature' | 'friend' | 'help'
  pendingEntry: null,
  activeFriend: null,
  toast: "",
  toastTimer: null,
  magnifierOn: false,
  weather: null,
  bag: [
    { name: "벤치", icon: "🪑", qty: 3, category: "장식" },
    { name: "팻말", icon: "🪧", qty: 2, category: "장식" },
    { name: "꽃 화분", icon: "🌸", qty: 5, category: "장식" },
    { name: "화분 나무", icon: "🌳", qty: 2, category: "장식" },
    { name: "울타리", icon: "🚧", qty: 4, category: "시설" },
    { name: "가로등", icon: "🏮", qty: 3, category: "장식" },
    { name: "새 물통", icon: "🛁", qty: 2, category: "시설" },
    { name: "통나무", icon: "🪵", qty: 1, category: "시설" },
    { name: "작은 웅덩이", icon: "💧", qty: 2, category: "시설" },
    { name: "수레", icon: "🛒", qty: 1, category: "기타" },
    { name: "돌", icon: "🪨", qty: 6, category: "기타" },
    { name: "그루터기", icon: "🪑", qty: 3, category: "기타" },
  ],
  nearbySpecies: [],
  quiz: { list: QUIZ_QUESTIONS, index: 0, correct: 0, streak: 0, finished: false, selected: null, feedback: null },
};

function showToast(msg) {
  state.toast = msg;
  render();
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { state.toast = ""; render(); }, 2200);
}

function eggStage() {
  const pct = state.player.exp / state.player.expMax;
  if (pct < 0.34) return { stage: "알", emoji: "🥚" };
  if (pct < 0.67) return { stage: "애벌레", emoji: "🐛" };
  return { stage: "성체", emoji: "🦋" };
}

/* ===================== NAV CONFIG ===================== */
const NAV_ITEMS = [
  { id: "ranch", icon: "🏡", label: "목장" },
  { id: "explore", icon: "🗺️", label: "탐험" },
  { id: "guide", icon: "📖", label: "도감" },
  { id: "quest", icon: "📋", label: "퀘스트", badge: 2 },
  { id: "bag", icon: "🎒", label: "가방" },
  { id: "friends", icon: "👥", label: "친구" },
  { id: "chat", icon: "🤖", label: "AI 말벗" },
  { id: "quiz", icon: "❓", label: "퀴즈" },
  { id: "shop", icon: "🏪", label: "상점" },
  { id: "cashshop", icon: "💎", label: "캐시샵" },
  { id: "profile", icon: "🙂", label: "프로필" },
  { id: "settings", icon: "⚙️", label: "설정" },
];

/* ===================== RENDER ROOT ===================== */
function render() {
  const app = document.getElementById("app");
  if (!state.loggedIn) {
    app.innerHTML = renderLogin();
    attachLoginEvents();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">🌿</div>
        ${NAV_ITEMS.map(renderNavItem).join("")}
      </aside>
      <div class="main-col">
        ${renderTopbar()}
        <div class="content">${renderScreen()}</div>
      </div>
    </div>
    <nav class="bottom-nav">
      ${["ranch","explore","guide","quest","bag"].map(id => renderNavItem(NAV_ITEMS.find(n=>n.id===id))).join("")}
    </nav>
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
    ${renderModal()}
  `;
  attachAppEvents();
}

function renderNavItem(item) {
  const active = state.screen === item.id ? "active" : "";
  return `<button class="nav-item ${active}" data-nav="${item.id}">
    <span class="icon">${item.icon}</span>
    <span>${item.label}</span>
    ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
  </button>`;
}

function renderTopbar() {
  const p = state.player;
  return `
  <div class="topbar">
    <div class="player-chip">
      <div class="avatar-circle">🧑‍🌾</div>
      <div class="player-meta">
        <div class="name">${p.name} · Lv.${p.level}</div>
        <div class="exp-bar"><div style="width:${Math.round(p.exp/p.expMax*100)}%"></div></div>
      </div>
    </div>
    <div class="topbar-right">
      <div class="currency-group">
        <div class="currency-pill">🍃 ${p.leaf.toLocaleString()} <button data-action="add-currency" data-cur="leaf">+</button></div>
        <div class="currency-pill">🪙 ${p.coin.toLocaleString()} <button data-action="add-currency" data-cur="coin">+</button></div>
        <div class="currency-pill">💎 ${p.gem} <button data-action="add-currency" data-cur="gem">+</button></div>
      </div>
      <button class="icon-btn" title="메일">✉️</button>
      <button class="icon-btn" title="알림">🔔<span class="dot"></span></button>
      <button class="icon-btn" data-action="open-help" title="도움말">❓</button>
      <button class="icon-btn" data-nav="settings" title="설정">⚙️</button>
    </div>
  </div>`;
}

function renderScreen() {
  switch (state.screen) {
    case "ranch": return renderRanch();
    case "explore": return renderExplore();
    case "guide": return renderGuide();
    case "quest": return renderQuest();
    case "bag": return renderBag();
    case "friends": return renderFriends();
    case "chat": return renderChat();
    case "quiz": return renderQuiz();
    case "shop": return renderShop();
    case "cashshop": return renderCashShop();
    case "profile": return renderProfile();
    case "settings": return renderSettings();
    default: return renderRanch();
  }
}

/* ===================== LOGIN ===================== */
function renderLogin() {
  return `
  <div class="login-wrap">
    <div class="login-grid">
      <div class="login-left">
        <h1 class="jua">자연을 관찰하고 기록하며,<br/>나만의 도감을 완성해요!</h1>
        <p>그림을 그리고, 생물을 탐구하고, AI 친구와 대화하며<br/>세상에 하나뿐인 자연 도감을 만들어보세요.</p>
        <div class="egg-scene">🦋 🥚 🪲</div>
        <div class="login-feats">
          <div class="feat"><div class="t">🌱</div><b>발견하고 기록해요</b><span>주변의 생물을 찾아 그림과 사진으로 기록해요.</span></div>
          <div class="feat"><div class="t">📖</div><b>나만의 도감을 만들어요</b><span>발견한 생물들을 모아 나만의 도감을 완성해요.</span></div>
          <div class="feat"><div class="t">🤖</div><b>AI 친구와 이야기해요</b><span>생물 친구 '알'과 대화하며 더 많은 것을 배워요.</span></div>
        </div>
      </div>
      <div class="login-right">
        <h2 class="jua">로그인하고 탐험을 시작해요!</h2>
        <button class="login-option primary" data-action="login" data-provider="email" ${state.loginLoading ? "disabled" : ""}>${state.loginLoading ? "로그인 중..." : "✉️ 이메일로 로그인"}</button>
        <button class="login-option" data-action="login" data-provider="google" ${state.loginLoading ? "disabled" : ""}>🔴 Google로 로그인</button>
        <button class="login-option" data-action="login" data-provider="apple" ${state.loginLoading ? "disabled" : ""}> Apple로 로그인</button>
        <div class="login-divider">또는</div>
        <button class="login-signup-link" data-action="login" data-provider="signup" style="background:none;">계정이 없으신가요? 회원가입</button>
      </div>
    </div>
  </div>`;
}

function attachLoginEvents() {
  document.querySelectorAll('[data-action="login"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (state.loginLoading) return;
      state.loginLoading = true;
      render();
      const provider = btn.getAttribute("data-provider");
      const res = await API.account.login(provider); // [계정 및 소셜 관리 서버]
      state.loginLoading = false;
      state.loggedIn = true;
      state.screen = "ranch";
      render();
    });
  });
}

/* ===================== RANCH ===================== */
function renderRanch() {
  const foundCount = state.species.filter(s => s.rank).length;
  const egg = eggStage();
  return `
  <div class="card" style="margin-bottom:0;">
    <div class="ranch-header-row">
      <div>
        <h2 class="jua">🌿 나의 자연 목장 🌿</h2>
        <p class="muted">생물들이 행복하게 지내는 공간이에요!</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${state.weather ? `<div class="currency-pill">${state.weather.icon} ${state.weather.temp}°C ${state.weather.label}</div>` : `<div class="currency-pill">날씨 불러오는 중...</div>`}
        <button class="btn ${state.magnifierOn ? 'btn-primary' : 'btn-soft'}" data-action="toggle-magnifier">🔍 돋보기 모드</button>
      </div>
    </div>
    <p class="muted" style="font-size:12px;margin-top:-6px;">${state.magnifierOn ? "돋보기 모드 On! 서식지 팻말을 눌러 숨은 곤충을 찾아보세요." : "야생 곤충을 터치하면 도감에 바로 등록할 수 있어요."}</p>
    <div class="ranch-map">
      ${RANCH_HABITATS.map(h => `<div class="habitat-tag ${state.magnifierOn ? 'magnify-target' : ''}" ${state.magnifierOn ? `data-action="magnify-habitat" data-name="${h.name}"` : ""} style="top:${h.top};left:${h.left};">${h.name}</div>`).join("")}
      ${WILD_CREATURES.map(w => `<div class="wild-creature" style="top:${w.top};left:${w.left};" data-action="catch-wild" data-id="${w.id}">${w.emoji}</div>`).join("")}
      <div class="ranch-side-nav">
        <button class="rs-btn" data-nav="guide"><span class="icon">📖</span>도감</button>
        <button class="rs-btn" data-nav="shop"><span class="icon">🏪</span>상점</button>
        <button class="rs-btn" data-nav="friends"><span class="icon">👥</span>친구</button>
        <button class="rs-btn" data-nav="quest"><span class="icon">📋</span>퀘스트</button>
        <button class="rs-btn" data-nav="chat"><span class="icon">🤖</span>AI 말벗</button>
        <button class="rs-btn" data-nav="quiz"><span class="icon">❓</span>퀴즈</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;">
    <div class="card">
      <h3 class="jua" style="font-size:15px;">🐾 오늘의 미션</h3>
      ${state.daily.slice(0,3).map(q => `
        <div style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
            <span>${q.icon} ${q.title}</span><span>${q.progress}/${q.max}</span>
          </div>
          <div class="quest-progress"><div style="width:${Math.min(100,q.progress/q.max*100)}%"></div></div>
        </div>`).join("")}
      <button class="btn btn-soft btn-block" style="margin-top:14px;" data-nav="quest">미션 더보기 &gt;</button>
    </div>
    <div class="card">
      <h3 class="jua" style="font-size:15px;">🍀 도감 달성도</h3>
      <p class="jua" style="font-size:26px;margin:8px 0 2px;color:var(--forest);">${foundCount} / ${state.species.length}종</p>
      <div class="quest-progress"><div style="width:${Math.round(foundCount/state.species.length*100)}%"></div></div>
      <p class="muted" style="margin-top:8px;">전체 생물의 ${Math.round(foundCount/state.species.length*100)}%를 발견했어요! 🦋</p>
    </div>
    <div class="card">
      <h3 class="jua" style="font-size:15px;">${egg.emoji} 알 성장</h3>
      <p class="jua" style="font-size:20px;margin:8px 0 2px;color:var(--forest);">${egg.stage} 단계</p>
      <div class="exp-bar" style="width:100%;"><div style="width:${Math.round(state.player.exp/state.player.expMax*100)}%"></div></div>
      <p class="muted" style="margin-top:8px;font-size:12px;">AI 말벗과 대화할수록 알 → 애벌레 → 성체로 성장해요.</p>
      <button class="btn btn-soft btn-block" style="margin-top:8px;" data-nav="chat">대화하러 가기 →</button>
    </div>
  </div>`;
}

/* ===================== EXPLORE ===================== */
function renderExplore() {
  const recent = state.species.filter(s => s.rank && s.when).slice(0,5);
  const foundCount = state.species.filter(s => s.rank).length;
  return `
  <div class="grid-2">
    <section class="card">
      <div class="ranch-header-row">
        <h2 class="jua">탐험 <span style="font-size:16px;">🌿</span></h2>
        <div class="currency-pill">${state.weather ? `${state.weather.icon} ${state.weather.temp}°C ${state.weather.label}` : "☀️ 23°C 맑음"}</div>
      </div>
      <p class="muted" style="margin-top:-10px;">우리 동네를 탐험하고 다양한 생물들을 발견해보세요!</p>
      <div class="explore-map-wrap">
        ${MAP_SPOTS.map(spot => `
          <div class="pin-btn" style="top:${spot.top};left:${spot.left};">
            <div class="pin-circle">${spot.icon}</div>
            <div class="pin-label">${spot.name} · ${spot.count}종</div>
          </div>`).join("")}
      </div>

      <h3 class="jua" style="font-size:15px;margin-top:20px;">🔎 발견을 기록하는 방법을 선택해주세요!</h3>
      <div class="grid-3" style="grid-template-columns:1fr 1fr;">
        <div class="record-method" style="background:#f2f7ec;">
          <div style="font-size:30px;">📷</div>
          <b>사진으로 기록하기</b>
          <span class="muted">카메라로 찍은 사진으로 AI가 생물을 분석해요</span>
          <button class="btn btn-primary btn-block" data-action="record-photo">사진으로 기록 &gt;</button>
        </div>
        <div class="record-method" style="background:#fdf6e3;">
          <div style="font-size:30px;">🖍️</div>
          <b>그림으로 기록하기</b>
          <span class="muted">그림을 그려 나만의 방식으로 등록해요</span>
          <button class="btn btn-accent btn-block" data-action="record-drawing">그림으로 기록 &gt;</button>
        </div>
      </div>

      <h3 class="jua" style="font-size:15px;margin-top:20px;">🗺️ 우리 동네 생태 지도</h3>
      <p class="muted" style="font-size:12px;margin-top:-4px;">GBIF · 카카오맵 데이터를 기반으로 반경 1km 내 생물을 보여줘요.</p>
      <div id="nearbyList" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        ${state.nearbySpecies.length === 0 ? `<span class="muted">주변 생물 정보를 불러오는 중...</span>` :
          state.nearbySpecies.map(s => `<span class="chip">${s.emoji} ${s.name} · ${s.distanceM}m</span>`).join("")}
      </div>
    </section>

    <aside style="display:flex;flex-direction:column;gap:16px;">
      <div class="card">
        <div class="ranch-header-row" style="margin-bottom:10px;">
          <h3 class="jua" style="font-size:15px;">최근 발견 기록</h3>
          <button class="muted" style="background:none;font-weight:800;" data-nav="guide">더보기 &gt;</button>
        </div>
        ${recent.map(d => `
          <div class="recent-find" style="margin-bottom:12px;">
            <div class="recent-thumb">${d.emoji}</div>
            <div>
              <div style="font-weight:700;font-size:13px;">${d.name}</div>
              <div class="muted" style="font-size:11px;">${d.place || ""} ${d.when || ""}</div>
            </div>
          </div>`).join("")}
      </div>
      <div class="card">
        <h3 class="jua" style="font-size:15px;">🌱 지금까지의 탐험 현황</h3>
        <div style="display:flex;justify-content:space-between;text-align:center;margin-top:12px;">
          <div><p class="jua" style="font-size:18px;color:var(--forest);margin:0;">${foundCount}종</p><span class="muted" style="font-size:11px;">발견한 종</span></div>
          <div><p class="jua" style="font-size:18px;color:var(--sun);margin:0;">+280P</p><span class="muted" style="font-size:11px;">탐험 포인트</span></div>
          <div><p class="jua" style="font-size:18px;color:var(--sky);margin:0;">3일</p><span class="muted" style="font-size:11px;">연속 탐험</span></div>
        </div>
        <button class="btn btn-soft btn-block" style="margin-top:14px;" data-nav="guide">전체 도감 보기 →</button>
      </div>
    </aside>
  </div>`;
}

/* ===================== GUIDE (도감) ===================== */
function renderGuide() {
  const cats = ["전체","곤충","식물","버섯","양서류","파충류","조류","포유류"];
  let list = state.species.filter(s => state.guideFilter === "전체" || s.category === state.guideFilter);
  if (state.guideSearch.trim()) list = list.filter(s => s.name.includes(state.guideSearch.trim()));
  const selected = state.species.find(s => s.id === state.selectedSpeciesId) || null;
  const foundCount = state.species.filter(s => s.rank).length;

  return `
  <div class="grid-2">
    <section class="card">
      <div class="ranch-header-row">
        <div>
          <h2 class="jua">📖 도감</h2>
          <p class="muted">자연에서 만난 생물들을 기록하고 알아가요!</p>
        </div>
        <div class="currency-pill">🍀 ${foundCount}/${state.species.length}종</div>
      </div>
      <div class="guide-tabs">
        ${cats.map(c => `<button class="guide-tab ${state.guideFilter===c?'active':''}" data-action="guide-filter" data-cat="${c}">${c}</button>`).join("")}
      </div>
      <div class="guide-search">🔍 <input type="text" placeholder="생물 이름 검색..." value="${state.guideSearch}" data-action="guide-search" /></div>
      <div class="guide-grid">
        ${list.map(s => {
          const isNew = s.id === state.justAddedId;
          const rank = s.rank ? RANK_INFO[s.rank] : null;
          return `
          <div class="guide-card ${s.rank ? '' : 'locked'} ${s.id===state.selectedSpeciesId?'selected':''}" data-action="guide-select" data-id="${s.id}">
            ${isNew ? `<div class="gnew">NEW</div>` : ""}
            ${rank ? `<div class="rank-badge">${rank.icon}</div>` : ""}
            <div class="thumb">${s.rank ? s.emoji : "❔"}</div>
            <div class="gname">${s.rank ? s.name : "미발견"}</div>
          </div>`;
        }).join("")}
      </div>
    </section>

    <aside class="card guide-detail">
      ${selected ? renderGuideDetail(selected) : `<p class="muted">생물 카드를 선택해보세요.</p>`}
    </aside>
  </div>`;
}

function renderGuideDetail(s) {
  if (!s.rank) {
    return `
      <div style="text-align:center;">
        <div class="thumb" style="width:80px;height:80px;font-size:36px;margin:0 auto 10px;background:#e3ded0;">❔</div>
        <h3 class="jua">미발견 생물</h3>
        <p class="muted">탐험하며 이 생물을 찾아보세요!</p>
        <p class="muted" style="font-size:12px;">예상 서식지: ${s.habitat || "알 수 없음"}</p>
      </div>`;
  }
  const rank = RANK_INFO[s.rank];
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 class="jua">${s.name}</h3>
      <span class="rank-pill" style="background:${rank.color};">${rank.icon} ${rank.label}</span>
    </div>
    <p class="muted" style="font-size:12px;">${s.category}</p>
    <div class="thumb" style="width:100%;height:130px;font-size:56px;border-radius:16px;margin:12px 0;">${s.emoji}</div>
    <p style="font-size:13.5px;line-height:1.6;">${s.desc}</p>
    <p class="muted" style="font-size:12px;margin-top:10px;">서식지: ${s.habitat || "-"}</p>
    <button class="btn btn-primary btn-block" style="margin-top:14px;" data-action="ask-about" data-name="${s.name}">AI 말벗에게 "${s.name}"에 대해 물어보기 →</button>`;
}

/* ===================== QUEST ===================== */
function renderQuest() {
  return `
  <div class="quest-hero">
    <h2 class="jua" style="color:white;">📋 퀘스트</h2>
    <p style="opacity:.9;font-size:13px;">다양한 퀘스트를 완료하고 보상을 받아요!</p>
  </div>
  <div class="grid-2">
    <div class="card">
      <h3 class="jua" style="font-size:15px;">일일 미션</h3>
      ${state.daily.map(q => `
        <div class="quest-item">
          <div class="quest-icon">${q.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13.5px;">${q.title}</div>
            <div class="muted" style="font-size:12px;">${q.desc}</div>
            <div class="quest-progress"><div style="width:${Math.min(100,q.progress/q.max*100)}%"></div></div>
          </div>
          <div style="text-align:right;">
            <div class="reward-pill">🍃${q.leaf} 🪙${q.coin}</div>
            <button class="btn ${q.done ? 'btn-soft' : 'btn-primary'}" style="margin-top:6px;font-size:12px;padding:6px 12px;" data-action="claim-quest" data-id="${q.id}" ${q.progress < q.max ? "disabled style='opacity:.5'" : ""}>${q.done ? "완료" : "보상 받기"}</button>
          </div>
        </div>`).join("")}
    </div>
    <div class="card">
      <h3 class="jua" style="font-size:15px;">📅 주간 미션</h3>
      ${state.weekly.map(q => `
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
            <span>${q.icon} ${q.title}</span><span class="muted">${q.progress}/${q.max}</span>
          </div>
          <div class="quest-progress"><div style="width:${Math.min(100,q.progress/q.max*100)}%"></div></div>
        </div>`).join("")}
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
        <p style="font-weight:800;font-size:13px;">🔥 연속 미션 달성</p>
        <p class="muted" style="font-size:12px;">3일 연속 달성 중!</p>
      </div>
    </div>
  </div>`;
}

/* ===================== BAG (가방) ===================== */
function renderBag() {
  return `
  <div class="card">
    <h2 class="jua">🎒 가방</h2>
    <p class="muted">상점 및 뽑기에서 얻은 인테리어를 보관해요. 목장을 꾸미거나 알(대표 캐릭터)을 설정할 수 있어요.</p>
    <div class="shop-tabs">
      ${["전체","장식","시설","기타"].map((t,i) => `<button class="guide-tab ${i===0?'active':''}">${t}</button>`).join("")}
    </div>
    <div class="shop-grid" style="margin-top:10px;">
      ${state.bag.map(item => `
        <div class="shop-item">
          <div class="simg">${item.icon}</div>
          <div class="sname">${item.name}</div>
          <div class="sdesc">보유 수량</div>
          <div class="jua" style="font-size:18px;color:var(--forest);">x${item.qty}</div>
        </div>`).join("")}
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
      <h3 class="jua" style="font-size:15px;">🥚 대표 캐릭터(알) 설정</h3>
      <p class="muted" style="font-size:12px;">현재 대표 캐릭터: ${eggStage().emoji} ${eggStage().stage}</p>
    </div>
  </div>`;
}

/* ===================== FRIENDS ===================== */
function renderFriends() {
  return `
  <div class="grid-2">
    <div class="card">
      <h2 class="jua">👥 친구</h2>
      <p class="muted">친구와 함께 자연을 탐험하고 더 즐거운 시간을 보내요!</p>
      ${FRIENDS.map((f,i) => `
        <div class="friend-row">
          <div class="friend-avatar">🧑‍🌾</div>
          <div style="flex:1;">
            <div style="font-weight:800;font-size:13.5px;">${f.name} <span class="muted" style="font-weight:400;">Lv.${f.level}</span></div>
            <div class="muted" style="font-size:11.5px;">${f.online ? "🟢 온라인" : f.last} · 도감 ${f.count}종 · 탐험 포인트 ${f.points}P</div>
          </div>
          <button class="btn btn-soft" style="font-size:12px;" data-action="visit-friend" data-idx="${i}">놀러가기</button>
        </div>`).join("")}
    </div>
    <div class="card">
      <h3 class="jua" style="font-size:15px;">친구 추가</h3>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <input type="text" placeholder="친구의 닉네임으로 검색해요" style="flex:1;padding:10px 14px;border-radius:999px;border:1px solid var(--border);outline:none;font-size:13px;" />
        <button class="btn btn-primary">검색</button>
      </div>
      <p class="muted" style="margin-top:14px;font-size:12px;">내 초대 코드</p>
      <div class="currency-pill" style="justify-content:space-between;">NATURE-2024 <span style="font-weight:800;">공유하기</span></div>
    </div>
  </div>`;
}

/* ===================== CHAT (AI 말벗) ===================== */
function renderChat() {
  if (!state.chatVisited) {
    state.chatVisited = true;
    const q4 = state.daily.find(q => q.id === "q4");
    if (q4 && !q4.done) q4.progress = q4.max;
  }
  return `
  <div class="chat-wrap card">
    <div class="chat-hero">
      <h2 class="jua" style="color:white;">AI 말벗 🌿</h2>
      <p style="opacity:.9;font-size:13px;">궁금한 것이 있으면 무엇이든 물어봐~</p>
    </div>
    <div class="chip-row">${CHAT_STARTERS.map(c => `<button class="chip" data-action="chat-starter" data-msg="${c}">${c}</button>`).join("")}</div>
    <div class="chat-log" id="chatLog">
      ${state.chat.map(m => `
        <div class="msg-row ${m.from}">
          <div class="msg-bubble-avatar">${m.from === "bot" ? "🤖" : "🧑‍🌾"}</div>
          <div class="msg-bubble">${m.text}</div>
        </div>`).join("")}
      ${state.chatSending ? `<div class="msg-row bot"><div class="msg-bubble-avatar">🤖</div><div class="msg-bubble">...</div></div>` : ""}
    </div>
    <div class="chat-input-row">
      <input type="text" id="chatInput" placeholder="메시지를 입력하세요..." ${state.chatSending ? "disabled" : ""}/>
      <button class="btn btn-primary" data-action="chat-send" ${state.chatSending ? "disabled" : ""}>전송</button>
    </div>
  </div>`;
}

/* ===================== QUIZ ===================== */
function renderQuiz() {
  const qz = state.quiz;
  if (qz.finished) {
    return `
    <div class="card" style="max-width:520px;margin:0 auto;text-align:center;">
      <h2 class="jua">🎉 퀴즈 완료!</h2>
      <p style="font-size:15px;margin-top:8px;">${qz.list.length}문제 중 <b>${qz.correct}</b>개를 맞혔어요!</p>
      <p class="muted">획득 보상: 🍃 ${qz.correct * 10}</p>
      <button class="btn btn-primary btn-block" style="margin-top:16px;" data-action="restart-quiz">다시 풀기</button>
    </div>`;
  }
  const q = qz.list[qz.index];
  return `
  <div class="grid-2">
    <div class="card">
      <div class="ranch-header-row">
        <h2 class="jua">❓ 퀴즈</h2>
      </div>
      <p class="muted">AI 말벗과 대화하며 퀴즈를 풀어보세요!</p>
      <div style="background:var(--cream-2);border-radius:16px;padding:16px;margin-top:14px;">
        <p style="font-weight:800;font-size:14px;margin-bottom:10px;">문제 ${qz.index+1}. ${q.q}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${q.options.map((opt,i) => {
            let extra = "";
            if (qz.feedback !== null) {
              if (i === q.answer) extra = "background:#dff2df;border-color:var(--forest);";
              else if (i === qz.selected) extra = "background:#fbe0da;border-color:var(--coral);";
            }
            return `<button class="btn" style="background:white;border:1px solid var(--border);text-align:left;font-weight:600;font-size:13px;${extra}" data-action="quiz-answer" data-idx="${i}" ${qz.feedback !== null ? "disabled" : ""}>${i+1}. ${opt}</button>`;
          }).join("")}
        </div>
        ${qz.feedback !== null ? `
          <p style="margin-top:12px;font-weight:800;color:${qz.feedback ? 'var(--forest)' : 'var(--coral)'};">${qz.feedback ? "정답입니다! 🎉" : "아쉬워요!"}</p>
          <p class="muted" style="font-size:12.5px;">${q.explanation}</p>
          <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="quiz-next">다음 문제 →</button>
        ` : ""}
      </div>
    </div>
    <aside class="card">
      <h3 class="jua" style="font-size:15px;">📋 퀴즈 진행 현황</h3>
      <p class="muted" style="font-size:12px;margin-top:10px;">현재 문제</p>
      <p class="jua" style="font-size:22px;">${qz.index+1} / ${qz.list.length}</p>
      <div style="display:flex;gap:20px;margin-top:10px;">
        <div><p class="jua" style="font-size:18px;margin:0;">${qz.correct}</p><span class="muted" style="font-size:11px;">정답 수</span></div>
        <div><p class="jua" style="font-size:18px;margin:0;">${qz.streak}</p><span class="muted" style="font-size:11px;">연속 정답</span></div>
      </div>
      <p class="muted" style="font-size:12px;margin-top:14px;">보상</p>
      <p class="jua" style="font-size:18px;color:var(--sun);">🍃 ${qz.correct * 10}</p>
    </aside>
  </div>`;
}

/* ===================== SHOP ===================== */
function renderShop() {
  return `
  <div class="card">
    <h2 class="jua">🏪 상점</h2>
    <p class="muted">탐험과 성장을 도와줄 다양한 아이템을 만나보세요!</p>
    <div class="shop-tabs">${["추천","재화","아이템","꾸미기","패키지"].map((t,i) => `<button class="guide-tab ${i===0?'active':''}">${t}</button>`).join("")}</div>
    <div class="shop-grid">
      ${SHOP_ITEMS.map(item => `
        <div class="shop-item">
          <div class="simg">${item.icon}</div>
          <div class="sname">${item.name}</div>
          <div class="sdesc">${item.desc}</div>
          <button class="btn btn-primary btn-block" data-action="buy-item" data-name="${item.name}" data-icon="${item.icon}" data-cat="${item.category}" data-price="${item.price}">🍃 ${item.price}</button>
        </div>`).join("")}
    </div>
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid var(--border);">
      <h3 class="jua" style="font-size:15px;">🎁 인테리어 뽑기</h3>
      <p class="muted" style="font-size:12px;">200 나뭇잎을 사용해 무작위 인테리어를 획득해요!</p>
      <button class="btn btn-accent" style="margin-top:8px;" data-action="gacha">200🍃 뽑기</button>
    </div>
  </div>`;
}

/* ===================== CASH SHOP ===================== */
function renderCashShop() {
  return `
  <div class="card">
    <h2 class="jua">💎 캐시샵</h2>
    <p class="muted">다이아와 스페셜 패키지를 만나보세요. (프로토타입에서는 실제 결제가 이루어지지 않아요)</p>
    <div class="shop-grid" style="margin-top:14px;">
      ${CASH_PACKS.map(p => `
        <div class="shop-item">
          <div class="simg">${p.icon}</div>
          <div class="sname">${p.label}</div>
          <div class="sdesc">${p.bonus || ""}</div>
          <button class="btn btn-primary btn-block" data-action="cash-buy">₩${p.won.toLocaleString()}</button>
        </div>`).join("")}
    </div>
  </div>`;
}

/* ===================== PROFILE ===================== */
function renderProfile() {
  const foundCount = state.species.filter(s => s.rank).length;
  const pct = Math.round(foundCount / state.species.length * 100);
  const badges = ["🌱","📷","🎁","🦋","🔒"];
  return `
  <div class="card">
    <div class="profile-top">
      <div class="profile-avatar-lg">🦋</div>
      <div>
        <h2 class="jua">자연 탐험가</h2>
        <div class="exp-bar" style="width:180px;"><div style="width:${Math.round(state.player.exp/state.player.expMax*100)}%"></div></div>
        <p class="muted" style="font-size:12px;">Lv.${state.player.level} · ${state.player.exp}/${state.player.expMax}</p>
      </div>
    </div>
    <p style="margin-top:16px;background:var(--cream-2);padding:14px;border-radius:14px;font-size:13.5px;">🌿 자연을 사랑하고, 작은 생명도 소중히 여기는 자연 탐험가예요!</p>
    <div style="display:flex;justify-content:space-around;margin-top:20px;">
      <div class="stat-box"><b>${pct}%</b><span>도감 달성도 (${foundCount}/${state.species.length})</span></div>
      <div class="stat-box"><b>28%</b><span>업적 달성도</span></div>
      <div class="stat-box"><b>27일</b><span>총 접속 일수</span></div>
    </div>
    <h3 class="jua" style="font-size:15px;margin-top:22px;">대표 배지</h3>
    <div style="display:flex;gap:10px;margin-top:8px;">
      ${badges.map(b => `<div class="badge-circle ${b==='🔒'?'locked':''}">${b}</div>`).join("")}
    </div>
  </div>`;
}

/* ===================== SETTINGS ===================== */
function renderSettings() {
  return `
  <div class="card">
    <h2 class="jua">⚙️ 설정</h2>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:14px;">
      ${["효과음","배경음","알림 받기"].map(label => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
          <span style="font-weight:700;font-size:13.5px;">${label}</span>
          <label style="position:relative;display:inline-block;width:42px;height:24px;">
            <input type="checkbox" checked style="opacity:0;width:0;height:0;" />
            <span style="position:absolute;inset:0;background:var(--forest);border-radius:999px;"></span>
            <span style="position:absolute;top:3px;right:3px;width:18px;height:18px;background:white;border-radius:50%;"></span>
          </label>
        </div>`).join("")}
    </div>
    <button class="btn btn-soft btn-block" style="margin-top:20px;" data-action="logout">로그아웃</button>
  </div>`;
}

/* ===================== MODALS ===================== */
function renderModal() {
  if (!state.modal) return "";

  if (state.modal === "preprocessing" || state.modal === "analyzing") {
    const title = state.modal === "preprocessing" ? "이미지를 정리하고 있어요" : "AI 분석 중입니다";
    const sub = state.modal === "preprocessing"
      ? "배경을 지우고 필요한 부분만 잘라내고 있어요. (이미지 전처리 API)"
      : (state.recordMode === "photo" ? "사진 속 생물을 확인하고 있어요." : "그림 속 생물을 확인하고 있어요.") + " (AI 분석 엔진)";
    return `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="spinner"></div>
        <p class="jua" style="font-size:17px;">${title}</p>
        <p class="muted">${sub} 잠시만 기다려주세요!</p>
      </div>
    </div>`;
  }

  if (state.modal === "success" && state.pendingEntry) {
    const e = state.pendingEntry;
    return `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-emoji-circle">${e.emoji}</div>
        <p class="jua" style="font-size:17px;">곤충이 등록되었습니다!</p>
        <p style="font-weight:800;font-size:15px;">${e.name}</p>
        <p class="muted">${e.desc}</p>
        <button class="btn btn-accent btn-block" data-action="confirm-register">확인 · 도감에서 보기</button>
      </div>
    </div>`;
  }

  if (state.modal === "hidden-creature" && state.pendingEntry) {
    const e = state.pendingEntry;
    return `
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-emoji-circle">🔍</div>
        <p class="jua" style="font-size:17px;">숨은 곤충을 발견했어요!</p>
        <div style="font-size:40px;">${e.emoji}</div>
        <p style="font-weight:800;font-size:15px;">${e.name}</p>
        <p class="muted">${e.desc}</p>
        <button class="btn btn-accent btn-block" data-action="confirm-hidden-catch">🥉 동 랭크로 등록하기</button>
        <button class="btn btn-soft btn-block" data-action="close-modal">닫기</button>
      </div>
    </div>`;
  }

  if (state.modal === "friend" && state.activeFriend) {
    const f = state.activeFriend;
    return `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width:380px;">
        <div class="modal-emoji-circle">🧑‍🌾</div>
        <p class="jua" style="font-size:17px;">${f.name}님의 목장</p>
        <p class="muted">Lv.${f.level} · 도감 ${f.count}종 · 탐험 포인트 ${f.points}P</p>
        <div style="width:100%;text-align:left;margin-top:6px;">
          <label class="muted" style="font-size:12px;">방명록 남기기</label>
          <textarea rows="2" placeholder="놀러왔어요! 도감 구경 잘 하고 가요 :)" style="width:100%;margin-top:6px;padding:10px;border-radius:12px;border:1px solid var(--border);font-family:inherit;font-size:13px;resize:none;"></textarea>
        </div>
        <button class="btn btn-primary btn-block" data-action="leave-guestbook">방명록 남기기</button>
        <button class="btn btn-soft btn-block" data-action="close-modal">닫기</button>
      </div>
    </div>`;
  }

  if (state.modal === "help") {
    return `
    <div class="modal-overlay">
      <div class="modal-box" style="max-width:420px;text-align:left;">
        <p class="jua" style="font-size:17px;text-align:center;">🤖 알 (시스템 챗봇) · 도움말</p>
        <ul style="font-size:13px;line-height:1.9;padding-left:18px;">
          <li><b>탐험</b>에서 사진/그림으로 생물을 기록하면 <b>도감</b>에 등록돼요.</li>
          <li>사진으로 등록하면 🥇금, 그림으로 등록하면 🥈은, 목장에서 획득하면 🥉동 랭크예요.</li>
          <li><b>목장</b>에서 🔍돋보기 모드를 켜면 숨은 곤충을 찾을 수 있어요.</li>
          <li><b>퀘스트</b>를 완료하면 나뭇잎 · 코인 보상을 받을 수 있어요.</li>
          <li><b>AI 말벗</b>과 대화할수록 알이 애벌레 → 성체로 성장해요.</li>
        </ul>
        <button class="btn btn-primary btn-block" data-action="close-modal">확인했어요</button>
      </div>
    </div>`;
  }

  return "";
}

/* ===================== EVENTS ===================== */
function attachAppEvents() {
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.addEventListener("click", () => { state.screen = el.getAttribute("data-nav"); render(); window.scrollTo(0,0); });
  });

  document.querySelectorAll('[data-action="add-currency"]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const cur = el.getAttribute("data-cur");
      state.screen = "cashshop";
      render();
      showToast(cur === "leaf" ? "🍃 잎사귀는 상점에서 얻을 수 있어요" : "캐시샵으로 이동했어요");
    });
  });

  const helpBtn = document.querySelector('[data-action="open-help"]');
  if (helpBtn) helpBtn.addEventListener("click", () => { state.modal = "help"; render(); });
  document.querySelectorAll('[data-action="close-modal"]').forEach(el => {
    el.addEventListener("click", () => { state.modal = null; state.pendingEntry = null; state.activeFriend = null; render(); });
  });

  const magBtn = document.querySelector('[data-action="toggle-magnifier"]');
  if (magBtn) magBtn.addEventListener("click", () => { state.magnifierOn = !state.magnifierOn; render(); });

  document.querySelectorAll('[data-action="magnify-habitat"]').forEach(el => {
    el.addEventListener("click", () => {
      const pick = HIDDEN_CREATURE_POOL[Math.floor(Math.random() * HIDDEN_CREATURE_POOL.length)];
      state.pendingEntry = JSON.parse(JSON.stringify(pick));
      state.modal = "hidden-creature";
      render();
    });
  });
  const confirmHidden = document.querySelector('[data-action="confirm-hidden-catch"]');
  if (confirmHidden) confirmHidden.addEventListener("click", () => {
    const e = state.pendingEntry;
    const id = "hidden-" + Date.now();
    state.species.unshift({ id, ...e, rank: "bronze", when: "방금 전", place: "돋보기 발견" });
    state.justAddedId = id;
    state.modal = null;
    state.pendingEntry = null;
    showToast(`🥉 [${e.name}]을(를) 동 랭크로 등록했어요!`);
    render();
  });

  document.querySelectorAll('[data-action="visit-friend"]').forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.getAttribute("data-idx"), 10);
      state.activeFriend = FRIENDS[idx];
      state.modal = "friend";
      const q3 = state.daily.find(q => q.id === "q3");
      if (q3 && !q3.done) q3.progress = q3.max;
      render();
    });
  });
  const guestbookBtn = document.querySelector('[data-action="leave-guestbook"]');
  if (guestbookBtn) guestbookBtn.addEventListener("click", () => {
    state.modal = null; state.activeFriend = null;
    showToast("방명록을 남겼어요! 📝");
    render();
  });

  const catchBtns = document.querySelectorAll('[data-action="catch-wild"]');
  catchBtns.forEach(el => {
    el.addEventListener("click", () => {
      const pool = state.species.filter(s => !s.rank);
      if (pool.length === 0) { showToast("모든 생물을 이미 발견했어요!"); return; }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      picked.rank = "bronze";
      picked.when = "방금 전";
      picked.place = "목장";
      state.justAddedId = picked.id;
      el.remove();
      showToast(`🥉 [${picked.name}]을(를) 동 랭크로 등록했어요!`);
    });
  });

  const photoBtn = document.querySelector('[data-action="record-photo"]');
  if (photoBtn) photoBtn.addEventListener("click", () => { state.recordMode = "photo"; document.getElementById("hiddenFileInput").click(); });
  const drawBtn = document.querySelector('[data-action="record-drawing"]');
  if (drawBtn) drawBtn.addEventListener("click", () => { state.recordMode = "drawing"; document.getElementById("hiddenFileInput").click(); });

  document.querySelectorAll('[data-action="guide-filter"]').forEach(el => {
    el.addEventListener("click", () => { state.guideFilter = el.getAttribute("data-cat"); render(); });
  });
  const searchInput = document.querySelector('[data-action="guide-search"]');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.guideSearch = e.target.value;
      const grid = document.querySelector(".guide-grid");
      const list = state.species.filter(s => (state.guideFilter === "전체" || s.category === state.guideFilter) && s.name.includes(state.guideSearch.trim()));
      grid.innerHTML = list.map(s => {
        const isNew = s.id === state.justAddedId;
        const rank = s.rank ? RANK_INFO[s.rank] : null;
        return `
        <div class="guide-card ${s.rank ? '' : 'locked'} ${s.id===state.selectedSpeciesId?'selected':''}" data-action="guide-select" data-id="${s.id}">
          ${isNew ? `<div class="gnew">NEW</div>` : ""}
          ${rank ? `<div class="rank-badge">${rank.icon}</div>` : ""}
          <div class="thumb">${s.rank ? s.emoji : "❔"}</div>
          <div class="gname">${s.rank ? s.name : "미발견"}</div>
        </div>`;
      }).join("");
      attachGuideCardEvents();
    });
  }
  attachGuideCardEvents();

  const askBtn = document.querySelector('[data-action="ask-about"]');
  if (askBtn) askBtn.addEventListener("click", () => {
    const name = askBtn.getAttribute("data-name");
    state.screen = "chat";
    render();
    sendChat(`${name}는 어떤 곤충이야?`);
  });

  document.querySelectorAll('[data-action="claim-quest"]').forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id");
      const q = state.daily.find(x => x.id === id);
      if (!q || q.progress < q.max || q.done) return;
      q.done = true;
      state.player.leaf += q.leaf;
      state.player.coin += q.coin;
      showToast(`🎉 보상을 받았어요! 🍃${q.leaf} 🪙${q.coin}`);
      render();
    });
  });

  document.querySelectorAll('[data-action="buy-item"]').forEach(el => {
    el.addEventListener("click", async () => {
      const price = parseInt(el.getAttribute("data-price"), 10);
      const name = el.getAttribute("data-name");
      const icon = el.getAttribute("data-icon");
      const cat = el.getAttribute("data-cat");
      const res = await API.content.purchaseItem(price, state.player.leaf); // [컨텐츠 & 랭크 서버]
      if (!res.success) { showToast("🍃 잎사귀가 부족해요!"); return; }
      state.player.leaf -= price;
      const existing = state.bag.find(b => b.name === name);
      if (existing) existing.qty += 1; else state.bag.push({ name, icon, qty: 1, category: cat });
      showToast("아이템을 구매했어요! 가방에서 확인해보세요 🎒");
      render();
    });
  });

  const gachaBtn = document.querySelector('[data-action="gacha"]');
  if (gachaBtn) gachaBtn.addEventListener("click", async () => {
    if (state.player.leaf < 200) { showToast("🍃 잎사귀가 부족해요!"); return; }
    state.player.leaf -= 200;
    render();
    const res = await API.content.gacha(SHOP_ITEMS); // [컨텐츠 & 랭크 서버] 가챠 알고리즘
    const item = res.item;
    const existing = state.bag.find(b => b.name === item.name);
    if (existing) existing.qty += 1; else state.bag.push({ name: item.name, icon: item.icon, qty: 1, category: item.category });
    showToast(`🎁 [${item.name}]을(를) 획득했어요!`);
    render();
  });

  document.querySelectorAll('[data-action="cash-buy"]').forEach(el => {
    el.addEventListener("click", () => showToast("프로토타입에서는 실제 결제가 지원되지 않아요 💡"));
  });

  const chatSend = document.querySelector('[data-action="chat-send"]');
  if (chatSend) chatSend.addEventListener("click", () => sendChat());
  const chatInput = document.getElementById("chatInput");
  if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
  document.querySelectorAll('[data-action="chat-starter"]').forEach(el => {
    el.addEventListener("click", () => sendChat(el.getAttribute("data-msg")));
  });

  document.querySelectorAll('[data-action="quiz-answer"]').forEach(el => {
    el.addEventListener("click", async () => {
      const idx = parseInt(el.getAttribute("data-idx"), 10);
      const q = state.quiz.list[state.quiz.index];
      state.quiz.selected = idx;
      const res = await API.aiChat.submitQuizAnswer(q, idx); // [AI 대화/퀴즈 서버]
      state.quiz.feedback = res.correct;
      if (res.correct) { state.quiz.correct += 1; state.quiz.streak += 1; }
      else state.quiz.streak = 0;
      render();
    });
  });
  const quizNext = document.querySelector('[data-action="quiz-next"]');
  if (quizNext) quizNext.addEventListener("click", () => {
    const qz = state.quiz;
    if (qz.index + 1 >= qz.list.length) qz.finished = true;
    else qz.index += 1;
    qz.selected = null; qz.feedback = null;
    render();
  });
  const quizRestart = document.querySelector('[data-action="restart-quiz"]');
  if (quizRestart) quizRestart.addEventListener("click", () => {
    state.quiz = { list: QUIZ_QUESTIONS, index: 0, correct: 0, streak: 0, finished: false, selected: null, feedback: null };
    render();
  });

  const confirmBtn = document.querySelector('[data-action="confirm-register"]');
  if (confirmBtn) confirmBtn.addEventListener("click", confirmRegistration);

  const logoutBtn = document.querySelector('[data-action="logout"]');
  if (logoutBtn) logoutBtn.addEventListener("click", async () => {
    await API.account.logout();
    state.loggedIn = false; state.screen = "login"; render();
  });

  const chatLog = document.getElementById("chatLog");
  if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
}

function attachGuideCardEvents() {
  document.querySelectorAll('[data-action="guide-select"]').forEach(el => {
    el.addEventListener("click", () => { state.selectedSpeciesId = el.getAttribute("data-id"); render(); });
  });
}

async function sendChat(presetMsg) {
  const input = document.getElementById("chatInput");
  const text = presetMsg || (input ? input.value.trim() : "");
  if (!text || state.chatSending) return;
  state.chat.push({ from: "user", text });
  if (input) input.value = "";
  state.chatSending = true;
  render();
  const res = await API.aiChat.sendMessage(text, CHAT_RESPONSES); // [AI 대화/퀴즈 서버]
  state.chat.push({ from: "bot", text: res.reply });
  state.chatSending = false;
  render();
}

/* ===================== PHOTO/DRAWING UPLOAD FLOW ===================== */
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("hiddenFileInput");
  fileInput.addEventListener("change", async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    state.modal = "preprocessing";
    render();
    await API.image.preprocess(file); // [이미지 전처리 API] Meta SAM

    state.modal = "analyzing";
    render();
    const pool = state.recordMode === "photo" ? NEW_CANDIDATES_PHOTO : NEW_CANDIDATES_DRAWING;
    const res = await API.aiVision.analyze({ mode: state.recordMode, candidates: pool }); // [AI 분석 엔진]
    state.pendingEntry = JSON.parse(JSON.stringify(res.candidate));
    state.modal = "success";
    render();

    e.target.value = "";
  });

  // 목장 진입 시 날씨/동네 생태 지도 로딩 (외부 연동 API)
  loadWeatherAndNearby();
  render();
});

async function loadWeatherAndNearby() {
  const weather = await API.external.getWeather();
  state.weather = weather;
  if (state.loggedIn && (state.screen === "ranch" || state.screen === "explore")) render();

  const nearby = await API.external.getNearbySpecies(SPECIES_DB);
  state.nearbySpecies = nearby;
  if (state.loggedIn && state.screen === "explore") render();
}

function confirmRegistration() {
  const e = state.pendingEntry;
  const id = "new-" + Date.now();
  const rank = state.recordMode === "photo" ? "gold" : "silver";
  const newSpecies = { id, ...e, rank, when: "방금 전", place: state.recordMode === "photo" ? "사진 등록" : "그림 등록" };
  state.species.unshift(newSpecies);
  state.justAddedId = id;
  state.modal = null;
  state.pendingEntry = null;

  const q2 = state.daily.find(q => q.id === "q2");
  if (q2 && !q2.done) q2.progress = q2.max;

  state.screen = "guide";
  state.guideFilter = "전체";
  state.guideSearch = "";
  render();
}
