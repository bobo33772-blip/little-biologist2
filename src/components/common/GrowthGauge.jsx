export default function GrowthGauge({ current, max, label, compact = false }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  return (
    <div className={compact ? 'w-24' : 'w-40'}>
      {label && <div className="mb-1 text-xs text-ink-700">{label}</div>}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-ivory-200"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className="h-full rounded-full bg-leaf-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-0.5 text-[11px] text-ink-700/70 tabular-nums">
        {current} / {max}
      </div>
    </div>
  )
}
