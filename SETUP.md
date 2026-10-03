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
| `DATABASE_URL` | 계정/친구/진행도 저장용 Supabase(Postgres) 연결 문자열 (Session pooler 권장) | 서버는 뜨지만 로그인 등 DB 기능이 503 |
| `INATURALIST_JWT` | 탐험 사진 분석(iNaturalist Computer Vision API) | 사진 등록 시 서버 에러 |
| `PORT` | 프록시 서버 포트 (기본 5174) | 기본값 사용 |
| `VITE_GOOGLE_MAPS_API_KEY` | 탐험 화면 동네 생태 지도 | 지도가 로드되지 않음 |
| `OPENAI_API_KEY` | AI 말벗 챗봇(`/chat`) | 챗봇이 서버 응답 대신 로컬 대체 답변만 사용 |
| `OPENAI_MODEL` | 챗봇에 쓸 OpenAI 모델 (기본 `gpt-4o-mini`) | 기본값 사용 |
| `CLIP_ENABLED` | `false`면 그림 판별(CLIP) 기능을 끔 | 켜짐 |
| `CLIP_PRELOAD` | `true`면 서버 시작 시 CLIP 모델을 미리 불러옴 | 첫 그림 판별 요청 때 불러옴 |
| `CLIP_DTYPE` | CLIP 모델 정밀도 (`q8`/`fp32`) | `q8` (Render 무료 512MB용) |

## 3. 실행

```
npm run dev
```

vite(프론트, 5173)와 프록시 서버(API, 5174)가 동시에 뜹니다. 두 개 다 있어야 사진 인식·챗봇이 동작해요.

## 4. 배포 운영 메모 (Vercel + Render + Supabase 무료 플랜)

- **Supabase 무료 프로젝트는 일주일쯤 안 쓰면 자동으로 일시정지돼요.** 그러면 로그인이 안 됩니다.
  Supabase 대시보드에서 프로젝트를 Restore하면 돌아와요(새 프로젝트를 만들면 기존 계정이 사라지니 주의).
- **일시정지 예방**: cron-job.org, UptimeRobot 같은 외부 모니터링 서비스로
  `https://little-biologist2.onrender.com/api/health`를 하루 1~2번 호출하세요(이 주소는 DB까지 한 번 다녀와요).
  GitHub Actions 예약 실행은 저장소에 60일간 활동이 없으면 자동으로 꺼지니 이 용도로는 쓰지 마세요.
- **Render 무료 서버는 15분간 요청이 없으면 잠들어요.** 첫 요청은 1분 가까이 걸릴 수 있고,
  로그인 화면이 열릴 때 서버를 미리 깨우도록 해뒀어요.
- **상태 확인 주소**
  - `/healthz` — 서버 프로세스만 확인
  - `/api/health` — DB 연결까지 확인 (`{"ok":true,"db":"up"}`이면 정상, 503이면 DB 문제)
  - Render > Settings > Health Check Path는 **비워두세요**. 서버가 바로 포트를 열기 때문에 기본 검사로 충분하고,
    무료(0.1 CPU)에서 그림 판별(CLIP)이 계산하는 동안 HTTP 검사가 실패하면 Render가 서버를 재시작해버려요.
- **그림 판별(CLIP)**: Render 무료에서는 서버가 깰 때마다 모델(약 150MB)을 새로 받아 준비하느라 첫 판별에
  몇 분 걸리고, 그동안 서버 전체가 느려질 수 있어요. 로그인 등이 자꾸 느려지면 `CLIP_ENABLED=false`로 끄세요.
  `CLIP_PRELOAD=true`는 무료 플랜에서 쓰지 마세요(깨울 때마다 로그인이 느려져요).
- **로그인이 안 될 때**: Render > Logs에서 `[db] schema init failed`를 찾아 뒤에 붙은 에러를 보세요.
  `Tenant or user not found`면 Supabase 일시정지/잘못된 프로젝트, `28P01`/`password authentication failed`면
  `DATABASE_URL`의 비밀번호가 바뀐 것이에요.
