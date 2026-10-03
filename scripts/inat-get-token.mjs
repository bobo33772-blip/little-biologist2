// iNaturalist OAuth 앱으로 "만료되지 않는 액세스 토큰"을 한 번만 받아오는 도우미. 받은 값을 Render의
// INAT_OAUTH_ACCESS_TOKEN에 넣으면, 서버(server/inatAuth.js)가 24시간짜리 JWT를 알아서 갱신한다.
// 비밀번호는 이 PC에서만 쓰이고 서버에는 저장되지 않는다. 아무 파일에도 쓰지 않는다.
//
// 실행 (PowerShell):
//   $env:INAT_APP_ID='...'; $env:INAT_APP_SECRET='...'; $env:INAT_USERNAME='...'; $env:INAT_PASSWORD='...'
//   node scripts/inat-get-token.mjs
//   Remove-Item Env:INAT_PASSWORD, Env:INAT_APP_SECRET
const USER_AGENT = process.env.INAT_USER_AGENT || 'LittleBiologist/1.0'
const { INAT_APP_ID, INAT_APP_SECRET, INAT_USERNAME, INAT_PASSWORD } = process.env

const missing = ['INAT_APP_ID', 'INAT_APP_SECRET', 'INAT_USERNAME', 'INAT_PASSWORD'].filter((key) => !process.env[key])
if (missing.length) {
  console.error(`환경변수가 비어 있어요: ${missing.join(', ')}`)
  process.exit(1)
}

async function main() {
  const tokenResponse = await fetch('https://www.inaturalist.org/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': USER_AGENT },
    body: new URLSearchParams({ client_id: INAT_APP_ID, client_secret: INAT_APP_SECRET, grant_type: 'password', username: INAT_USERNAME, password: INAT_PASSWORD }),
  })
  if (!tokenResponse.ok) {
    throw new Error(`oauth/token HTTP ${tokenResponse.status} — 앱 ID/시크릿, 아이디/비밀번호를 확인하세요`)
  }
  const { access_token: accessToken } = await tokenResponse.json()

  // 받은 액세스 토큰으로 실제로 JWT가 발급되는지 확인한다.
  const jwtResponse = await fetch('https://www.inaturalist.org/users/api_token.json', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': USER_AGENT },
    redirect: 'manual',
  })
  if (!jwtResponse.ok) throw new Error(`api_token HTTP ${jwtResponse.status} — 액세스 토큰으로 JWT를 받지 못했어요`)
  const { api_token: jwt } = await jwtResponse.json()
  const { exp } = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'))

  console.log('\n확인 완료: 이 액세스 토큰으로 JWT가 발급돼요 (JWT 만료:', new Date(exp * 1000).toISOString(), ')')
  console.log('\n아래 값을 Render > Environment의 INAT_OAUTH_ACCESS_TOKEN에 넣으세요. 다른 곳에 공유하지 마세요.\n')
  console.log(accessToken)
}

main().catch((error) => {
  console.error('[inat-get-token] 실패:', error.message)
  process.exitCode = 1
})
