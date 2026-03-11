export function interpolateTriangle(vertices, u, v) {
  const a = vertices[0]
  const b = vertices[1]
  const c = vertices[2]
  const w = 1 - u - v

  return [
    (Number(a[0] ?? 0) * w) + (Number(b[0] ?? 0) * u) + (Number(c[0] ?? 0) * v),
    (Number(a[1] ?? 0) * w) + (Number(b[1] ?? 0) * u) + (Number(c[1] ?? 0) * v),
    (Number(a[2] ?? 0) * w) + (Number(b[2] ?? 0) * u) + (Number(c[2] ?? 0) * v),
  ]
}

export function buildTriangleMesh(vertices, subdivisionSteps) {
  const safeVertices = Array.isArray(vertices) && vertices.length >= 3
    ? vertices.slice(0, 3)
    : [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const steps = Math.max(1, Math.floor(subdivisionSteps || 1))

  const values = []
  for (let row = 0; row < steps; row += 1) {
    for (let column = 0; column < steps - row; column += 1) {
      const u0 = row / steps
      const v0 = column / steps
      const u1 = (row + 1) / steps
      const v1 = (column + 1) / steps

      const p0 = interpolateTriangle(safeVertices, u0, v0)
      const p1 = interpolateTriangle(safeVertices, u1, v0)
      const p2 = interpolateTriangle(safeVertices, u0, v1)

      values.push(p0, p1, p2)

      if (row + column + 1 < steps) {
        const p3 = interpolateTriangle(safeVertices, u1, v1)
        values.push(p1, p3, p2)
      }
    }
  }

  return values
}

export function normalizeColor(color = []) {
  return color.map((channel, index) => {
    if (index < 3) {
      return Number(channel ?? 0) / 255
    }
    return Number(channel ?? 255) / 255
  })
}

export function invertColor(color = []) {
  return [
    255 - Number(color[0] ?? 0),
    255 - Number(color[1] ?? 0),
    255 - Number(color[2] ?? 0),
    Number(color[3] ?? 255),
  ]
}
