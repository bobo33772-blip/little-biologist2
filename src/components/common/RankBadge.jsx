import { rankMeta } from '../../data/mockData'

// 별점 대신 금/은/동 3단계 등급을 사용한다 (decision-log.md D-003).
export default function RankBadge({ rank }) {
  if (!rank) return null
  const meta = rankMeta[rank]
  const colorClass = {
    gold: 'bg-rank-gold/15 text-rank-gold',
    silver: 'bg-rank-silver/20 text-ink-700',
    bronze: 'bg-rank-bronze/15 text-rank-bronze',
  }[rank]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colorClass}`}
      title={meta.desc}
    >
      {meta.label}
    </span>
  )
}
