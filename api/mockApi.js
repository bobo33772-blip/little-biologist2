/* =========================================================================
 * Mock API Layer
 * -------------------------------------------------------------------------
 * Architecture_정의서.pdf 의 System & Software Architecture를 그대로 따라
 * 프론트엔드(app.js) ↔ 백엔드 서버군 사이의 경계를 흉내낸 레이어입니다.
 * 실제 서비스에서는 아래 각 모듈이 각각 독립된 서버(Flask/FastAPI 등)와
 * REST API(JSON)로 통신하지만, 이 프로토타입에서는 지연시간(setTimeout)만
 * 흉내내고 결과는 목(mock) 데이터로 반환합니다.
 *
 *  [계정 및 소셜 관리 서버]   → API.account
 *  [이미지 전처리 API]        → API.image     (Meta SAM)
 *  [AI 분석 엔진]              → API.aiVision  (GPT-4o-mini 멀티모달)
 *  [AI 대화/퀴즈 서버]         → API.aiChat    (GPT-4o-mini 페르소나 챗봇, 퀴즈)
 *  [컨텐츠 & 랭크 서버]        → API.content   (상점/가챠/인벤토리/랭크)
 *  외부 연동 (OpenWeatherMap,
 *   카카오맵, GBIF)            → API.external
 * ========================================================================= */

const API = (() => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  return {
    /* [계정 및 소셜 관리 서버] - OAuth2.0 / 로컬 암호화 토큰 저장 (F-5.1) */
    account: {
      async login(provider) {
        await delay(500);
        return { uid: "UID-" + Math.floor(Math.random() * 90000 + 10000), provider, nickname: "자연 탐험가" };
      },
      async logout() {
        await delay(200);
        return { success: true };
      },
    },

    /* [이미지 전처리 API] - Meta SAM 기반 배경 제거/투명화 (F-1.1) */
    image: {
      async preprocess(file) {
        await delay(500);
        return { cropped: true, transparentPng: true, fileName: file?.name || "capture.png" };
      },
    },

    /* [AI 분석 엔진] - GPT-4o-mini 멀티모달 융합 + GBIF 위치 필터 (F-1.2, F-1.3) */
    aiVision: {
      async analyze({ mode, candidates }) {
        await delay(1200);
        const pool = candidates || [];
        const picked = pool[Math.floor(Math.random() * pool.length)];
        return { candidate: picked, confidence: (0.8 + Math.random() * 0.19).toFixed(2), locationFiltered: true };
      },
    },

    /* [AI 대화/퀴즈 서버] - 생태 페르소나 매핑 & 퀴즈 생성/판정 (F-4.2, F-6.6) */
    aiChat: {
      async sendMessage(text, responses) {
        await delay(600);
        return { reply: responses[text] || responses.DEFAULT };
      },
      async submitQuizAnswer(question, selectedIndex) {
        await delay(400);
        return { correct: selectedIndex === question.answer, explanation: question.explanation };
      },
    },

    /* [컨텐츠 & 랭크 서버] - 재화/인벤토리/가챠/랭크 (F-2.4, F-5.4) */
    content: {
      async purchaseItem(price, currentBalance) {
        await delay(350);
        if (currentBalance < price) return { success: false, reason: "insufficient_funds" };
        return { success: true };
      },
      async gacha(pool) {
        await delay(500);
        return { item: pool[Math.floor(Math.random() * pool.length)] };
      },
    },

    /* 외부 연동 API - OpenWeatherMap / 카카오맵 / GBIF (F-3.5, F-5.3) */
    external: {
      async getWeather() {
        await delay(300);
        const options = [
          { icon: "☀️", label: "맑음", temp: 23 },
          { icon: "⛅", label: "구름 조금", temp: 20 },
          { icon: "🌧️", label: "비", temp: 17 },
        ];
        return options[Math.floor(Math.random() * options.length)];
      },
      async getNearbySpecies(pool) {
        await delay(500);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5).map((s, i) => ({ ...s, distanceM: 80 + i * 140 }));
      },
    },
  };
})();
