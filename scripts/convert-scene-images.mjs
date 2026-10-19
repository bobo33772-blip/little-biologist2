// 화면을 통째로 덮는 큰 그림(서식지 배경·목장 연못 대객체·기능 화면 배경·로그인 배경)을
// 같은 크기의 WebP로 바꿔 옆에 저장한다. PNG는 1~3MB라 느린 회선에서 위에서부터 줄 단위로
// 그려지거나 마지막에 툭 나타났다. 원본 PNG는 지우지 않고(비교·되돌리기용) 코드의 참조만
// .webp로 바꾼다. 변환 결과는 소스 자산이므로 커밋한다.
//
// 사용: node scripts/convert-scene-images.mjs
// 끝나면 원본/변환본 크기 표를 출력한다(개발 기록에 옮겨 적는 용도).
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')

async function featureBackgroundTargets() {
  const dir = path.join(ROOT, 'public/feature-backgrounds')
  const names = (await readdir(dir)).filter((name) => name.toLowerCase().endsWith('.png')).sort()
  return names.map((name) => ({
    from: `public/feature-backgrounds/${name}`,
    to: `public/feature-backgrounds/${name.replace(/\.png$/i, '.webp')}`,
    options: { quality: 78, effort: 5 },
  }))
}

// 서식지 배경은 화면 전체에 깔리는 그림이라 품질을 조금 높게 둔다.
const SCENE_TARGETS = ['forest', 'pond', 'soil', 'street', 'field_flower', 'field_tree'].map((name) => ({
  from: `IMAGE/${name}.png`,
  to: `IMAGE/${name}.webp`,
  options: { quality: 82, effort: 5 },
}))

const OTHER_TARGETS = [
  // 목장 연못 대객체(1536x1024 RGBA). 기존 public/ranch/pond.webp(900x515)는 비율이 다른
  // 다른 그림이라 쓰지 않고, 지금 쓰는 pond.png에서 알파를 그대로 살려 새로 만든다.
  // 화면에는 다른 대객체(가로 900px)와 같은 크기로만 그려지므로 같은 폭으로 줄인다(비율 3:2 유지).
  { from: 'public/ranch/pond.png', to: 'public/ranch/pond-object.webp', resize: { width: 900 }, options: { quality: 85, alphaQuality: 100, effort: 5 } },
  // 목장 길에 반복해서 깔리는 흙길 띠(534x208 RGBA). PNG가 366KB라 목장 첫 장면에서 회선을 많이 썼다.
  { from: 'public/ranch/path-strip.png', to: 'public/ranch/path-strip.webp', options: { quality: 85, alphaQuality: 100, effort: 5 } },
  { from: 'public/images/login/로그인.png', to: 'public/images/login/로그인.webp', options: { quality: 82, effort: 5 } },
]

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`
}

async function convert({ from, to, options, resize }) {
  const src = path.join(ROOT, from)
  const dest = path.join(ROOT, to)
  const meta = await sharp(src).metadata()
  const image = sharp(src)
  if (resize) image.resize(resize)
  await image.webp(options).toFile(dest)
  const outMeta = await sharp(dest).metadata()
  if (resize) {
    // 줄인 그림은 비율만 같으면 된다(화면 크기는 CSS가 정한다).
    if (Math.abs(outMeta.width / outMeta.height - meta.width / meta.height) > 0.01) {
      throw new Error(`${to}: 비율이 달라졌다(${meta.width}x${meta.height} → ${outMeta.width}x${outMeta.height})`)
    }
  } else if (outMeta.width !== meta.width || outMeta.height !== meta.height) {
    throw new Error(`${to}: 크기가 달라졌다(${meta.width}x${meta.height} → ${outMeta.width}x${outMeta.height})`)
  }
  const before = (await stat(src)).size
  const after = (await stat(dest)).size
  const size = resize ? `${meta.width}x${meta.height}→${outMeta.width}x${outMeta.height}` : `${meta.width}x${meta.height}`
  return { from, to, size, alpha: Boolean(outMeta.hasAlpha), before, after }
}

async function main() {
  const targets = [...SCENE_TARGETS, ...OTHER_TARGETS, ...(await featureBackgroundTargets())]
  const rows = []
  for (const target of targets) rows.push(await convert(target))

  let totalBefore = 0
  let totalAfter = 0
  console.log('| 원본 | 크기(px) | 원본 용량 | WebP | 비율 |')
  console.log('|---|---|---|---|---|')
  for (const row of rows) {
    totalBefore += row.before
    totalAfter += row.after
    const ratio = `${((row.after / row.before) * 100).toFixed(0)}%`
    console.log(`| ${row.from} → ${path.basename(row.to)} | ${row.size}${row.alpha ? ' (알파)' : ''} | ${kb(row.before)} | ${kb(row.after)} | ${ratio} |`)
  }
  console.log(`| 합계 (${rows.length}장) | | ${(totalBefore / 1024 / 1024).toFixed(2)}MB | ${(totalAfter / 1024 / 1024).toFixed(2)}MB | ${((totalAfter / totalBefore) * 100).toFixed(0)}% |`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
