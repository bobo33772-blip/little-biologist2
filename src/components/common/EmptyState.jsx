export default function EmptyState({ icon = '🌱', title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ivory-200 bg-white/60 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-700/80">{description}</p>}
      {action}
    </div>
  )
}
