import { Buffer } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'

const vs = `#version 300 es
in vec2 a_pos;
uniform vec2 u_viewport_size;

void main() {
  vec2 normalized = (a_pos / u_viewport_size) * 2.0 - 1.0;
  gl_Position = vec4(normalized.x, -normalized.y, 0.0, 1.0);
}`

const fs = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}`

function interpolateTriangle(vertices, u, v) {
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

function buildTriangleMesh(vertices, subdivisionSteps) {
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

function normalizeColor(color = []) {
  return color.map((channel, index) => {
    if (index < 3) {
      return Number(channel ?? 0) / 255
    }
    return Number(channel ?? 255) / 255
  })
}

export class LeafletTriangleRenderer {
  constructor(props = {}) {
    this.props = {
      id: 'leaflet-triangle-renderer',
      vertices: [
        [116.38, 39.9, 0],
        [121.47, 31.23, 0],
        [113.26, 23.13, 0],
      ],
      color: [255, 120, 64, 220],
      subdivisionSteps: 24,
      ...props,
    }
    this.device = null
    this.model = null
    this.positionBuffer = null
    this.vertexCount = 0
  }

  setProps(nextProps = {}) {
    this.props = {
      ...this.props,
      ...nextProps,
    }
  }

  onAdd({ device }) {
    this.device = device
    this.positionBuffer = this.device.createBuffer({
      id: `${this.props.id}-positions`,
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: 8,
      data: new Float32Array([0, 0]),
    })
    this.model = new Model(device, {
      id: this.props.id,
      vs,
      fs,
      topology: 'triangle-list',
      isInstanced: false,
      vertexCount: 0,
      bufferLayout: [{ name: 'a_pos', format: 'float32x2' }],
      attributes: {
        a_pos: this.positionBuffer,
      },
    })
  }

  onRemove() {
    this.model?.destroy()
    this.model = null
    this.positionBuffer?.destroy()
    this.positionBuffer = null
    this.device = null
  }

  render(frame) {
    if (!this.model || !this.positionBuffer) {
      return
    }

    const meshVertices = buildTriangleMesh(this.props.vertices, this.props.subdivisionSteps)
    const positions = new Float32Array(meshVertices.length * 2)

    meshVertices.forEach((vertex, vertexIndex) => {
      const point = frame.project(vertex)
      const offset = vertexIndex * 2
      positions[offset] = point.x * frame.devicePixelRatio
      positions[offset + 1] = point.y * frame.devicePixelRatio
    })

    this.vertexCount = meshVertices.length
    this.positionBuffer.write(positions)
    this.model.setAttributes({ a_pos: this.positionBuffer })
    this.model.setVertexCount(this.vertexCount)
    this.model.pipeline.uniforms = {
      ...this.model.pipeline.uniforms,
      u_viewport_size: [
        Math.max(1, Math.floor(frame.size.width * frame.devicePixelRatio)),
        Math.max(1, Math.floor(frame.size.height * frame.devicePixelRatio)),
      ],
      u_color: normalizeColor(this.props.color),
    }

    const renderPass = frame.beginRenderPass({
      id: `${this.props.id}-leaflet-pass`,
      clearColor: [0, 0, 0, 0],
    })

    try {
      frame.gl.enable(frame.gl.BLEND)
      frame.gl.blendFunc(frame.gl.SRC_ALPHA, frame.gl.ONE_MINUS_SRC_ALPHA)
      this.model.draw(renderPass)
    } finally {
      frame.gl.disable(frame.gl.BLEND)
      renderPass.end()
    }
  }
}
