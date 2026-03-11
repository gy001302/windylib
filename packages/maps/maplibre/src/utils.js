import maplibregl from 'maplibre-gl'

export function getMapCenter(vertices) {
  if (!Array.isArray(vertices) || !vertices.length) {
    return [0, 0]
  }

  const sums = vertices.reduce((result, vertex) => [
    result[0] + Number(vertex[0] ?? 0),
    result[1] + Number(vertex[1] ?? 0),
  ], [0, 0])

  return [
    sums[0] / vertices.length,
    sums[1] / vertices.length,
  ]
}

export function projectLngLatToMercator(position) {
  const coordinate = maplibregl.MercatorCoordinate.fromLngLat({
    lng: Number(position?.[0] ?? position?.lng ?? 0),
    lat: Number(position?.[1] ?? position?.lat ?? 0),
  })

  return {
    x: coordinate.x,
    y: coordinate.y,
  }
}

export function createMapLibreMercatorProjector() {
  return (position) => projectLngLatToMercator(position)
}

export function toColorArray(hex, alpha) {
  const raw = String(hex ?? '#000000').replace('#', '')
  const value = Number.parseInt(raw, 16)

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
    Math.round(Number(alpha ?? 1) * 255),
  ]
}
