// ranch.md: 도움말 버튼으로 튜토리얼을 다시 볼 수 있다.
export default function HelpTutorial({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="튜토리얼 다시 보기"
      className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow-card hover:bg-ivory-100"
    >
      ❓
    </button>
  )
}
