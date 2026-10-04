# CLAUDE.md

이 저장소에서 작업하는 AI 코딩 도우미(Claude Code 등)가 매번 먼저 읽는 프로젝트 안내입니다.
사람이 읽어도 프로젝트 규칙 요약으로 쓸 수 있어요.

## 프로젝트 한눈에 보기

- **리틀 바이올로지스트**: 동네 곤충을 사진·그림으로 기록하면 AI가 판별해 주고, 도감과 목장이 자라는 어린이 생태 탐구 게임. 자세한 소개는 [README.md](README.md).
- **웹**: React 18 + Vite 5 + Tailwind CSS (`src/`), Vercel에 배포.
- **서버**: Express (`server/`), Render에 배포.
  - DB: Supabase(PostgreSQL)
  - 외부 연동: iNaturalist(사진 판별), OpenAI(AI 말벗), CLIP(그림 판별)
- **앱**: Capacitor 8로 같은 웹 코드를 감싼 Android 앱 (`android/`).
- **배포·운영 메모**: [SETUP.md](SETUP.md).

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 웹(5173)과 API 서버(5174)를 함께 실행 |
| `npm run build` / `npm run lint` | 웹 빌드 / ESLint. 루트의 `app.js`·`api/mockApi.js`는 예전 프로토타입이라 원래 에러가 있음 |
| `npm run app:sync` | 웹 빌드 후 `android/`로 복사 (`cap sync`) |
| `npm run app:android` | 위 작업 후 Android Studio 열기 |

## 코드 규칙

- 사용자와의 대화, 문서, 코드 주석은 한국어로 쓴다.
- 서버 호출은 항상 `apiUrl()`(`src/api/base.js`)로 감싼다.
  - `fetch('/api/...')`처럼 상대 경로를 바로 쓰면 앱(Capacitor)에서는 서버에 닿지 않는다.
- 앱에서만 달라야 하는 동작은 `src/utils/platform.js`의 `isNativeApp` / `nativePlatform`으로 분기한다.
  - 기본 원칙은 **웹 동작을 바꾸지 않는 것**이다.
- 생성 파일은 커밋하지 않는다.
  - 예: `android/app/src/main/assets/public` (`cap sync`가 만든다)
  - `.env` 같은 비밀 값도 커밋하지 않는다.

## 개발 기록 규칙 (중요)

이 프로젝트는 포트폴리오로 정리하기 위해, 의미 있는 작업마다 **"왜 그렇게 했는지"** 를 `docs/devlog/`에 남긴다.

1. **언제 쓰나**
   - 사용자가 기능 추가·변경을 요청했거나, AI가 제안한 작업을 구현했을 때.
   - **그 작업과 같은 커밋 묶음 안에서** 기록을 1건 추가한다.
2. **어디에 쓰나**
   - `docs/devlog/NNN-영문-주제.md`에 쓴다. 번호는 이어서 매긴다.
   - [docs/devlog/README.md](docs/devlog/README.md)의 **기록 목록** 표에 한 줄을 추가한다.
3. **형식**: [docs/devlog/README.md](docs/devlog/README.md)의 템플릿을 따른다.
   - 순서: 배경 → 검토한 선택지와 결정 → 구현 → 검증 → 한계와 남은 일 → 포트폴리오 포인트
   - 메타 정보: 날짜, 분류, 계기, 관련 커밋
4. **내용 원칙**
   - "왜"를 가장 중요하게 쓴다. 어떤 문제를 봤는지, 어떤 대안을 비교했는지, 왜 이걸 골랐는지.
   - 검증 결과에는 **실제로 확인한 것만** 적는다. 확인하지 못한 것은 "한계와 남은 일"에 적는다.
   - 계기에는 누가 시작했는지(사용자 요청, AI 제안 등)를 적는다.
   - 관련 커밋 해시는 커밋한 뒤 채운다.
5. **이어지는 작업**
   - 이전 기록의 "남은 일"을 처리했다면 그 체크박스를 갱신하고, 새 기록에서 링크로 연결한다.
   - 기능이 크게 바뀌면 [README.md](README.md)의 주요 기능 표도 함께 갱신한다.
6. **예외**: 오타·문구 수정 같은 사소한 변경은 기록하지 않아도 된다.
