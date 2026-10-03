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
| `INAT_OAUTH_ACCESS_TOKEN` | 탐험 사진 분석(iNaturalist) — 서버가 JWT를 자동 갱신 (6번 참고) | `INATURALIST_JWT`를 사용 |
| `INATURALIST_JWT` | 탐험 사진 분석(iNaturalist) — 매일 손으로 갱신하는 예전 방식. 위 값이 있으면 무시 | 둘 다 없으면 사진 등록 시 서버 에러 |
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

## 5. Supabase 프로젝트 연결/교체

1. Supabase 대시보드에서 프로젝트를 열고 상단 **Connect** → **Session pooler** 탭의 연결 문자열을 복사해요.
   (`postgresql://postgres.<프로젝트ref>:[YOUR-PASSWORD]@aws-?-<리전>.pooler.supabase.com:5432/postgres`)
   - Render는 IPv4만 되므로 **Direct connection(db.<ref>.supabase.co)은 쓰면 안 돼요.**
   - `[YOUR-PASSWORD]`는 프로젝트를 만들 때 정한 DB 비밀번호예요(대괄호도 지워요). 모르면 Project Settings >
     Database에서 재설정해요. 비밀번호에 `# / ? % @`가 있으면 URL 인코딩해야 하니, 영문+숫자로만 만드는 게 편해요.
   - `?sslmode=...`는 붙이지 마세요. 암호화(TLS)는 서버가 Supabase 인증서(`server/supabase-ca.crt`)로 직접 켜요.
2. **예전 프로젝트의 계정/진행도를 옮기려면 이 단계 전에** 해야 해요(새 DB가 완전히 비어 있을 때).
   예전 프로젝트를 Restore한 뒤 `pg_dump --schema=public --no-owner --no-privileges "<예전 URL>" | psql "<새 URL>"`.
   옮기지 않으면 새 프로젝트는 빈 DB라서 모두 새로 가입해야 해요.
3. Render > 서비스 > Environment의 `DATABASE_URL`을 이 값으로 바꾸고 저장해요(로컬은 `.env`).
4. 서버가 다시 뜨면 테이블, 기준 데이터(서식지 5 / 종 79 / 미션 82), 보안 설정(RLS)을 **자동으로** 만들어요.
   Render Logs에 `[seed] 빈 DB — ...`와 `[db] schema ready`가 찍히면 끝이에요. 따로 SQL을 실행할 필요 없어요.
   - 기준 데이터는 테이블이 완전히 비어 있을 때만 자동으로 채워요. 나중에 `src/data`의 미션/종을 고치면
     `node scripts/seed-supabase.js`로 직접 반영해요(서버 로그에 `[seed] 기준 데이터가 데이터 파일보다 적음`이 보이면 이걸 실행).

## 6. iNaturalist 토큰 자동 갱신

사진 분석에 쓰는 iNaturalist JWT는 24시간마다 만료돼요. OAuth 앱의 액세스 토큰(만료 없음)을 한 번 넣어두면
서버가 만료 1시간 전에 새 JWT를 알아서 받아와서, 매일 복사할 필요가 없어져요.

1. **앱 소유자 신청** — https://www.inaturalist.org/oauth/app_owner_application
   - 조건: 가입 2개월 이상 + 최근 한 달 동안 다른 사람 관찰에 "improving" 동정 10개 이상.
   - iNaturalist 직원이 직접 검토해서 승인까지 시간이 걸리고, 거절될 수도 있어요. 어린이 교육용 곤충 판별 앱이고
     서버에서 computervision/score_image를 부른다는 점, 하루 예상 호출 수를 솔직하게 적으세요.
   - 컴퓨터 비전 API는 공개 API가 아니라서, 사용 허락을 help@inaturalist.org에 따로 문의해두는 게 안전해요.
   - **승인 전까지는 지금처럼 `INATURALIST_JWT`를 매일 넣으면 그대로 동작해요.**
2. **앱 등록** — 승인되면 https://www.inaturalist.org/oauth/applications/new 에서
   Name `Little Biologist`, Redirect URI `https://little-biologist2.onrender.com/`, Confidential 체크 →
   Application ID와 Secret을 복사해요.
3. **액세스 토큰 받기 (내 PC에서 한 번만)**
   ```
   $env:INAT_APP_ID='앱ID'; $env:INAT_APP_SECRET='시크릿'; $env:INAT_USERNAME='아이디'; $env:INAT_PASSWORD='비밀번호'
   node scripts/inat-get-token.mjs
   Remove-Item Env:INAT_PASSWORD, Env:INAT_APP_SECRET
   ```
   구글/애플 로그인으로만 가입한 계정은 iNaturalist 설정에서 비밀번호를 먼저 만들어야 해요.
4. 출력된 값을 Render > Environment의 `INAT_OAUTH_ACCESS_TOKEN`에 넣고, 이제 필요 없는 `INATURALIST_JWT`는
   지우고 저장해요(비밀번호/시크릿은 넣지 마세요). 서버가 다시 뜨면 바로 JWT를 한 번 받아와요.
   `https://little-biologist2.onrender.com/api/health`에서 `inat`이 `"mode":"oauth"`, `"lastRefreshOk":true`이고
   `expiresAt`이 약 24시간 뒤면 성공이에요. `lastRefreshOk`가 `false`면 Render Logs의 `[inat-auth] JWT 갱신 실패`를 보세요.
5. 토큰이 유출되면 https://www.inaturalist.org/oauth/authorized_applications 에서 취소하고 3번을 다시 해요.
