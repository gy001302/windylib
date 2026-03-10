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
