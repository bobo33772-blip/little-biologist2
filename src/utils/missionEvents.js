export function reportMissionEvent(event) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('little-biologist:mission', { detail: event }))
}
