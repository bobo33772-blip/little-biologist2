let loaderPromise

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loaderPromise) return loaderPromise

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.'))

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=ko&region=KR`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return loaderPromise
}
