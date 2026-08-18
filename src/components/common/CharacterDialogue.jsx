export default function CharacterDialogue({
  speakerEmoji = '🥚',
  speakerImage,
  speakerAlt = '',
  speakerSizeClassName = 'h-10 w-10',
  className = '',
  children,
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl bg-white p-4 shadow-card ${className}`.trim()}>
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-50 text-xl ${speakerSizeClassName}`}
        aria-hidden="true"
      >
        {speakerImage ? (
          <img src={speakerImage} alt={speakerAlt} className="h-full w-full object-contain" />
        ) : (
          speakerEmoji
        )}
      </div>
      <div className="text-sm leading-relaxed text-ink-900">{children}</div>
    </div>
  )
}
