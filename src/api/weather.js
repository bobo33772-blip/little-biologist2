const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
export const WEATHER_REFRESH_MS = 60 * 60 * 1000

const DEFAULT_WEATHER = {
  effect: 'clear',
  icon: '☀️',
  label: '맑음',
}

function buildWeatherProfile(weatherCode, temperature) {
  const code = Number(weatherCode)
  if (code === 0) return { effect: 'clear', icon: '☀️', label: '맑음' }
  if (code === 1) return { effect: 'cloudy', icon: '🌤️', label: '구름 조금' }
  if (code === 2) return { effect: 'cloudy', icon: '⛅', label: '구름 많음' }
  if (code === 3) return { effect: 'cloudy', icon: '☁️', label: '흐림' }
  if (code === 45 || code === 48) return { effect: 'fog', icon: '🌫️', label: '안개' }
  if (code >= 51 && code <= 67) return { effect: 'rain', icon: '🌧️', label: '이슬비' }
  if (code >= 71 && code <= 77) return { effect: 'snow', icon: '❄️', label: '눈' }
  if (code >= 80 && code <= 82) return { effect: 'rain', icon: '🌦️', label: '소나기' }
  if (code >= 85 && code <= 86) return { effect: 'snow', icon: '🌨️', label: '눈발' }
  if (code >= 95 && code <= 99) return { effect: 'storm', icon: '⛈️', label: '천둥번개' }
  return temperature != null && Number(temperature) >= 28
    ? { effect: 'clear', icon: '☀️', label: '더움' }
    : { effect: 'cloudy', icon: '☁️', label: '흐림' }
}

export function getWeatherParticleCount(effect, weather) {
  const precipitation = Number(weather?.precipitation ?? 0)
  const windSpeed = Number(weather?.windSpeed ?? 0)

  if (effect === 'storm') return 30
  if (effect === 'rain') return Math.max(14, Math.min(34, Math.round(14 + precipitation * 8 + windSpeed / 6)))
  if (effect === 'snow') return Math.max(12, Math.min(28, Math.round(12 + precipitation * 4)))
  if (effect === 'fog') return 3
  return 0
}

export async function fetchRanchWeather({ latitude, longitude, signal } = {}) {
  const lat = Number.isFinite(latitude) ? latitude : 37.5665
  const lon = Number.isFinite(longitude) ? longitude : 126.978
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,precipitation,rain,showers,snowfall,wind_speed_10m,is_day',
    timezone: 'auto',
  })

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`날씨 조회 실패 (${response.status})`)
  }

  const data = await response.json()
  const current = data.current || {}
  const profile = buildWeatherProfile(current.weather_code, current.temperature_2m)

  return {
    ...DEFAULT_WEATHER,
    ...profile,
    temperature: Number.isFinite(Number(current.temperature_2m)) ? Math.round(Number(current.temperature_2m)) : null,
    precipitation: Number.isFinite(Number(current.precipitation)) ? Number(current.precipitation) : 0,
    rain: Number.isFinite(Number(current.rain)) ? Number(current.rain) : 0,
    showers: Number.isFinite(Number(current.showers)) ? Number(current.showers) : 0,
    snowfall: Number.isFinite(Number(current.snowfall)) ? Number(current.snowfall) : 0,
    windSpeed: Number.isFinite(Number(current.wind_speed_10m)) ? Number(current.wind_speed_10m) : 0,
    isDay: current.is_day == null ? true : Number(current.is_day) === 1,
    updatedAt: current.time || new Date().toISOString(),
    latitude: data.latitude ?? lat,
    longitude: data.longitude ?? lon,
    timezone: data.timezone ?? 'auto',
  }
}

