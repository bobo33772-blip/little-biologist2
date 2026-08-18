import { MAP_INSECT_NAMES } from '../data/mapSpecies.js'
import { INATURALIST_TAXA } from '../data/inaturalistTaxa.js'

const API_BASE = 'https://api.inaturalist.org/v1'
const normalize = (value) => String(value || '').trim().toLocaleLowerCase('ko-KR')

function getObservationNames(observation) {
  const taxon = observation.taxon || {}
  return [observation.species_guess, taxon.preferred_common_name, taxon.name]
    .filter(Boolean)
    .map(normalize)
}

function getCoordinates(item) {
  if (item.geojson?.coordinates?.length >= 2) {
    return { latitude: Number(item.geojson.coordinates[1]), longitude: Number(item.geojson.coordinates[0]) }
  }
  if (item.latitude != null && item.longitude != null) {
    return { latitude: Number(item.latitude), longitude: Number(item.longitude) }
  }
  if (typeof item.location === 'string') {
    const [latitude, longitude] = item.location.split(',').map(Number)
    return { latitude, longitude }
  }
  return null
}

function toObservation(item) {
  const taxon = item.taxon || {}
  const coordinates = getCoordinates(item)
  return {
    id: item.id,
    name: taxon.preferred_common_name || item.species_guess || taxon.name || '이름을 확인 중인 곤충',
    date: item.observed_on || item.created_at?.slice(0, 10) || '',
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    photo: item.photos?.[0]?.url || null,
    taxonId: taxon.id || item.taxon_id || null,
  }
}

export async function getNearbyAllowedInsects({ latitude, longitude, radiusKm = 3, signal } = {}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('GPS 좌표가 올바르지 않습니다.')
  }

  const taxonEntries = Object.entries(INATURALIST_TAXA).map(([name, [id]]) => ({ name, id }))
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radius: String(radiusKm),
    d1: start.toISOString().slice(0, 10),
    d2: end.toISOString().slice(0, 10),
    'has[]': 'geo',
    per_page: '200',
    order_by: 'observed_on',
    order: 'desc',
    locale: 'ko',
  })
  if (taxonEntries.length) params.set('taxon_id', taxonEntries.map((entry) => entry.id).join(','))

  const response = await fetch(`${API_BASE}/observations?${params}`, { signal })
  if (!response.ok) throw new Error(`iNaturalist 요청 실패 (${response.status})`)
  const data = await response.json()
  const allowed = new Set(MAP_INSECT_NAMES.map(normalize))
  const taxonNameById = new Map(taxonEntries.map((entry) => [Number(entry.id), entry.name]))

  return (data.results || [])
    .map((item) => ({ item, coordinates: getCoordinates(item) }))
    .filter(({ coordinates }) => coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude))
    .map((item) => {
      const observation = item.item
      const taxon = observation.taxon || {}
      const ancestry = String(taxon.ancestry || '').split('/').map(Number)
      const matchedName = taxonNameById.get(Number(taxon.id))
        || [...taxonNameById.entries()].find(([id]) => ancestry.includes(id))?.[1]
        || getObservationNames(observation).find((name) => allowed.has(name))
        || taxon.preferred_common_name
        || taxon.name
        || '관찰 생물'
      return { ...toObservation(observation), name: matchedName }
    })
}
