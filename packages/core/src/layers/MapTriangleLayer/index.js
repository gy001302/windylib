import maplibregl from 'maplibre-gl'
import { Buffer, luma } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import { webgl2Adapter } from '@luma.gl/webgl'
// eslint-disable-next-line import/no-unresolved
import defaultVertexShader from './triangle.vs.glsl?raw'
// eslint-disable-next-line import/no-unresolved
import defaultFragmentShader from './triangle.fs.glsl?raw'

const defaultProps = {
  id: 'map-triangle-layer',
  vertices: {
    type: 'object',
    compare: true,
    value: [
      [118.3, 31.7, 0],
      [119.4, 32.2, 0],
      [118.6, 32.8, 0],
    ],
  },
  color: {
    type: 'color',
    value: [255, 120, 64, 220],
  },
  subdivisionSteps: {
    type: 'number',
    value: 24,
    compare: true,
  },
  vertexShader: {
    type: 'string',
    value: defaultVertexShader,
    compare: true,
  },
  fragmentShader: {
    type: 'string',
    value: defaultFragmentShader,
    compare: true,
  },
  onShaderStateChange: {
    type: 'function',
    value: null,
    compare: false,
  },
}

const defaultValues = {
  id: defaultProps.id,
  vertices: defaultProps.vertices.value,
  color: defaultProps.color.value,
  subdivisionSteps: defaultProps.subdivisionSteps.value,
  vertexShader: defaultProps.vertexShader.value,
  fragmentShader: defaultProps.fragmentShader.value,
  onShaderStateChange: defaultProps.onShaderStateChange.value,
}

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

function toMercatorPositions(vertices, subdivisionSteps) {
  const meshVertices = buildTriangleMesh(vertices, subdivisionSteps)
  const mercatorPositions = new Float32Array(meshVertices.length * 2)

  meshVertices.forEach((vertex, vertexIndex) => {
    const coordinate = maplibregl.MercatorCoordinate.fromLngLat({
      lng: Number(vertex[0] ?? 0),
      lat: Number(vertex[1] ?? 0),
    })
    const offset = vertexIndex * 2
    mercatorPositions[offset] = coordinate.x
    mercatorPositions[offset + 1] = coordinate.y
  })

  return {
    positions: mercatorPositions,
    vertexCount: meshVertices.length,
  }
}

function buildVertexShader(shaderDescription, vertexShader) {
  return `#version 300 es
${shaderDescription.vertexShaderPrelude}
${shaderDescription.define}

in vec2 a_pos;

${vertexShader}`
}

function buildFragmentShader(fragmentShader) {
  return `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

${fragmentShader}`
}

function normalizeColor(color) {
  return color.map((channel, index) => {
    if (index < 3) {
      return Number(channel ?? 0) / 255
    }
    return Number(channel ?? 255) / 255
  })
}

export class MapTriangleLayer {
  static layerName = 'MapTriangleLayer'

  static defaultProps = defaultProps

  static defaultVertexShader = defaultVertexShader

  static defaultFragmentShader = defaultFragmentShader

  constructor(props = {}) {
    this.type = 'custom'
    this.renderingMode = '2d'
    this.map = null
    this.gl = null
    this.device = null
    this.devicePromise = null
    this.destroyed = false
    this.models = new Map()
    this.positionsBuffer = null
    this.vertexCount = 0
    this.positions = new Float32Array(0)
    this.shaderState = {
      ok: true,
      stage: 'init',
      message: '',
    }
    this.props = {
      ...defaultValues,
      ...props,
    }
    this.id = this.props.id
    this._refreshMesh()
  }

  setProps(nextProps = {}) {
    const previousProps = this.props
    this.props = {
      ...this.props,
      ...nextProps,
    }
    this.id = this.props.id

    const geometryChanged = (
      nextProps.vertices !== undefined
      || nextProps.subdivisionSteps !== undefined
    ) && (
      this.props.vertices !== previousProps.vertices
      || this.props.subdivisionSteps !== previousProps.subdivisionSteps
    )
    const shaderChanged = (
      nextProps.vertexShader !== undefined
      || nextProps.fragmentShader !== undefined
    ) && (
      this.props.vertexShader !== previousProps.vertexShader
      || this.props.fragmentShader !== previousProps.fragmentShader
    )

    if (geometryChanged) {
      this._refreshMesh()
      this._syncGeometry()
    }

    if (shaderChanged) {
      this._destroyModels()
    }

    this.map?.triggerRepaint()
  }

  async onAdd(map, gl) {
    this.map = map
    this.gl = gl

    this.devicePromise = luma.attachDevice(gl, {
      adapters: [webgl2Adapter],
      createCanvasContext: {
        canvas: gl.canvas,
        autoResize: false,
      },
    }).then((device) => {
      if (this.destroyed) {
        device.destroy()
        return null
      }

      this.device = device
      this._syncGeometry()
      this._onDeviceReady()
      this.map?.triggerRepaint()
      return device
    }).catch((error) => {
      this._emitShaderState({
        ok: false,
        stage: 'compile',
        message: error.message,
      })
      throw error
    })
  }

  render(gl, args) {
    if (!this.device || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    const renderPass = this.device.beginRenderPass({
      id: `${this.id}-screen-pass`,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
    })

    try {
      this.drawToRenderPass({
        renderPass,
        shaderDescription: args.shaderData,
        projectionData: args.defaultProjectionData,
        color: this.props.color,
      })
    } finally {
      renderPass.end()
    }
  }

  onRemove() {
    this.destroyed = true
    this._destroyModels()
    this.positionsBuffer?.destroy()
    this.positionsBuffer = null
    this.device?.destroy()
    this.device = null
    this.map = null
    this.gl = null
  }

  drawToRenderPass({ renderPass, shaderDescription, projectionData, color }) {
    const model = this._getModel(shaderDescription)
    if (!model) {
      return null
    }

    model.setVertexCount(this.vertexCount)
    model.pipeline.uniforms = {
      ...model.pipeline.uniforms,
      u_projection_fallback_matrix: projectionData.fallbackMatrix,
      u_projection_matrix: projectionData.mainMatrix,
      u_projection_tile_mercator_coords: projectionData.tileMercatorCoords,
      u_projection_clipping_plane: projectionData.clippingPlane,
      u_projection_transition: projectionData.projectionTransition,
      u_color: normalizeColor(color),
    }

    this.device.gl.enable(this.device.gl.BLEND)
    this.device.gl.blendFunc(this.device.gl.SRC_ALPHA, this.device.gl.ONE_MINUS_SRC_ALPHA)

    try {
      model.draw(renderPass)
      this._emitShaderState({
        ok: true,
        stage: 'draw',
        message: 'draw ok',
      })
    } catch (error) {
      this._emitShaderState({
        ok: false,
        stage: 'draw',
        message: error.message,
      })
      throw error
    } finally {
      this.device.gl.disable(this.device.gl.BLEND)
    }

    return model
  }

  _onDeviceReady() {}

  _refreshMesh() {
    const mesh = toMercatorPositions(this.props.vertices, this.props.subdivisionSteps)
    this.positions = mesh.positions
    this.vertexCount = mesh.vertexCount
  }

  _syncGeometry() {
    if (!this.device) {
      return
    }

    if (!this.positionsBuffer) {
      this.positionsBuffer = this.device.createBuffer({
        id: `${this.id}-positions`,
        usage: Buffer.VERTEX | Buffer.COPY_DST,
        data: this.positions,
      })
    } else {
      this.positionsBuffer.write(this.positions)
    }

    Array.from(this.models.values()).forEach((model) => {
      model.setAttributes({ a_pos: this.positionsBuffer })
      model.setVertexCount(this.vertexCount)
    })
  }

  _getModel(shaderDescription) {
    const variantName = shaderDescription.variantName || 'default'
    if (this.models.has(variantName)) {
      return this.models.get(variantName)
    }

    if (!this.device || !this.positionsBuffer) {
      return null
    }

    try {
      const model = new Model(this.device, {
        id: `${this.id}-${variantName}`,
        vs: buildVertexShader(shaderDescription, this.props.vertexShader),
        fs: buildFragmentShader(this.props.fragmentShader),
        topology: 'triangle-list',
        isInstanced: false,
        vertexCount: this.vertexCount,
        bufferLayout: [{ name: 'a_pos', format: 'float32x2' }],
        attributes: {
          a_pos: this.positionsBuffer,
        },
      })
      this.models.set(variantName, model)
      this._emitShaderState({
        ok: true,
        stage: 'compile',
        message: 'compile ok',
      })
      return model
    } catch (error) {
      this._emitShaderState({
        ok: false,
        stage: 'compile',
        message: error.message,
      })
      return null
    }
  }

  _destroyModels() {
    Array.from(this.models.values()).forEach((model) => model.destroy())
    this.models.clear()
  }

  _emitShaderState(partialState) {
    this.shaderState = {
      ok: true,
      stage: 'unknown',
      message: '',
      ...partialState,
    }

    this.props.onShaderStateChange?.({
      id: this.id,
      ...this.shaderState,
    })
  }
}

export { defaultVertexShader, defaultFragmentShader }
