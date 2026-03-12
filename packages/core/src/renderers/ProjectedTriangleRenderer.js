// 投影三角形 renderer，把经纬度三角形投到屏幕空间并直接完成绘制。
import { Buffer } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import {
  buildTriangleMesh,
  invertColor,
  normalizeColor,
} from '../geometry/triangleMesh'

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

export class ProjectedTriangleRenderer {
  constructor(props = {}) {
    this.props = {
      id: 'projected-triangle-renderer',
      vertices: [
        [116.38, 39.9, 0],
        [121.47, 31.23, 0],
        [113.26, 23.13, 0],
      ],
      color: [255, 120, 64, 220],
      invertEnabled: false,
      subdivisionSteps: 24,
      ...props,
    }
    this.device = null
    this.model = null
    this.positionBuffer = null
    this.positionBufferByteLength = 0
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
    this._ensurePositionBuffer(this._getPositionByteLength())
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
    this.positionBufferByteLength = 0
    this.device = null
  }

  render(frame) {
    if (!this.model || !this.positionBuffer) {
      return
    }

    const meshVertices = buildTriangleMesh(this.props.vertices, this.props.subdivisionSteps)
    const positions = new Float32Array(meshVertices.length * 2)

    this._ensurePositionBuffer(positions.byteLength)

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
      u_color: normalizeColor(
        this.props.invertEnabled ? invertColor(this.props.color) : this.props.color,
      ),
    }

    const renderPass = frame.beginRenderPass({
      id: `${this.props.id}-projected-pass`,
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

  _getPositionByteLength() {
    const meshVertices = buildTriangleMesh(this.props.vertices, this.props.subdivisionSteps)
    return Math.max(8, meshVertices.length * 2 * Float32Array.BYTES_PER_ELEMENT)
  }

  _ensurePositionBuffer(byteLength) {
    if (!this.device) {
      return
    }

    const requiredByteLength = Math.max(8, byteLength)
    if (this.positionBuffer && this.positionBufferByteLength === requiredByteLength) {
      return
    }

    this.positionBuffer?.destroy()
    this.positionBuffer = this.device.createBuffer({
      id: `${this.props.id}-positions`,
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: requiredByteLength,
      data: new Uint8Array(requiredByteLength),
    })
    this.positionBufferByteLength = requiredByteLength

    this.model?.setAttributes({ a_pos: this.positionBuffer })
  }
}
