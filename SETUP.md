# 설치 안내

## 1. 패키지 설치

```
npm install
```

`package.json`에 있는 아래 패키지가 전부 설치돼요.

### 실행에 필요한 패키지 (dependencies)
- `react`, `react-dom` — 화면 UI
- `react-router-dom` — 페이지 라우팅
- `express` — 곤충 사진 분류(iNaturalist)·AI 챗봇(OpenAI) 프록시 서버(`server/index.js`)
- `cors` — 프록시 서버 CORS 허용
- `multer` — 사진 업로드(멀티파트) 처리
- `pg` — 계정/친구/진행도 저장용 Supabase(Postgres) 연결
- `dotenv` — `.env` 환경변수 로드
- `openai` — AI 말벗 챗봇(`/chat`)에서 OpenAI API 호출
- `framer-motion` — 목장 대객체 진입 시 존 배너 효과 애니메이션

### 개발용 패키지 (devDependencies)
- `vite`, `@vitejs/plugin-react` — 개발 서버·빌드
- `concurrently` — `npm run dev` 실행 시 vite(프론트)와 프록시 서버(API)를 동시에 실행
- `tailwindcss`, `postcss`, `autoprefixer` — 스타일
- `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks` — 코드 검사

## 2. 환경변수 설정

`.env`에 들어있는 키(`INATURALIST_JWT`, `VITE_GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY` 등)는 팀 공용 테스트 키예요.
**새로 발급받을 필요 없이, 프로젝트를 받을 때 `.env` 파일이 같이 왔는지만 확인하면 돼요.**

주의: `.env`는 `.gitignore`에 들어있어서 git으로는 자동으로 따라가지 않아요. zip으로 통째로 전달하면 같이 포함되지만,
나중에 git으로 옮기게 되면 `.env`는 별도 경로(사내 메신저, 시크릿 매니저 등)로 따로 전달해야 해요.

혹시 `.env` 파일이 없다면 `.env.example`을 복사해서 값을 채워주세요.

```
cp .env.example .env
```

| 변수 | 용도 | 없으면 |
|---|---|---|
| `DATABASE_URL` | 계정/친구/진행도 저장용 Supabase(Postgres) 연결 문자열 (Session pooler 권장) | 서버가 아예 시작되지 않음 |
| `INATURALIST_JWT` | 탐험 사진 분석(iNaturalist Computer Vision API) | 사진 등록 시 서버 에러 |
| `PORT` | 프록시 서버 포트 (기본 5174) | 기본값 사용 |
| `VITE_GOOGLE_MAPS_API_KEY` | 탐험 화면 동네 생태 지도 | 지도가 로드되지 않음 |
| `OPENAI_API_KEY` | AI 말벗 챗봇(`/chat`) | 챗봇이 서버 응답 대신 로컬 대체 답변만 사용 |
| `OPENAI_MODEL` | 챗봇에 쓸 OpenAI 모델 (기본 `gpt-4o-mini`) | 기본값 사용 |

## 3. 실행

```
npm run dev
```

vite(프론트, 5173)와 프록시 서버(API, 5174)가 동시에 뜹니다. 두 개 다 있어야 사진 인식·챗봇이 동작해요.
