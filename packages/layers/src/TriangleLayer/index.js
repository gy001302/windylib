import { Buffer } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import {
  BaseLayer,
  invertColor,
  normalizeColor,
} from '@windylib/core'
// eslint-disable-next-line import/no-unresolved
import defaultVertexShader from '../../../core/src/shaders/map-triangle/triangle.vs.glsl?raw'
// eslint-disable-next-line import/no-unresolved
import defaultFragmentShader from '../../../core/src/shaders/map-triangle/triangle.fs.glsl?raw'
import {
  baseDefaultProps,
  buildTriangleGeometry,
  buildFragmentShader,
  buildVertexShader,
} from '../shared/triangleLayerHelpers'

const defaultProps = {
  ...baseDefaultProps,
  vertexShader: {
    ...baseDefaultProps.vertexShader,
    value: defaultVertexShader,
  },
  fragmentShader: {
    ...baseDefaultProps.fragmentShader,
    value: defaultFragmentShader,
  },
}

const projectedVertexShader = `#version 300 es
in vec2 a_pos;
uniform vec2 u_viewport_size;

void main() {
  vec2 normalized = (a_pos / u_viewport_size) * 2.0 - 1.0;
  gl_Position = vec4(normalized.x, -normalized.y, 0.0, 1.0);
}`

const projectedFragmentShader = `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}`

export class TriangleLayer extends BaseLayer {
  static componentName = 'TriangleLayer'

  static layerName = 'TriangleLayer'

  static defaultProps = defaultProps

  static defaultVertexShader = defaultVertexShader

  static defaultFragmentShader = defaultFragmentShader

  constructor(props = {}) {
    super(props)
    this.models = new Map()
    this.positionsBuffer = null
    this.vertexCount = 0
    this.positions = new Float32Array(0)
    this.meshVertices = []
    this.shaderState = {
      ok: true,
      stage: 'init',
      message: '',
    }
    this.projectedModel = null
    this.projectedPositionBuffer = null
    this.projectedPositionBufferByteLength = 0
    this.renderHost = null
    this._refreshMesh()
  }

  async onAdd(mapOrContext, gl) {
    if (arguments.length === 1 && mapOrContext?.device) {
      this.destroyed = false
      this.renderHost = mapOrContext.host ?? null
      this.map = mapOrContext.map ?? null
      this.gl = mapOrContext.gl ?? null
      this.device = mapOrContext.device ?? null
      this._syncGeometry()
      this._onDeviceReady()
      this.requestRender()
      return this
    }

    this.renderHost = null
    return super.onAdd(mapOrContext, gl)
  }

  onRemove(mapOrContext, gl) {
    if (arguments.length === 1 && mapOrContext?.device) {
      this.destroyed = true
      this._onBeforeRemove({ map: this.map, gl: this.gl })
      this._destroyModels()
      this.positionsBuffer?.destroy()
      this.positionsBuffer = null
      this.projectedModel?.destroy()
      this.projectedModel = null
      this.projectedPositionBuffer?.destroy()
      this.projectedPositionBuffer = null
      this.projectedPositionBufferByteLength = 0
      this.device = null
      this.gl = null
      this.map = null
      this.renderHost = null
      return
    }

    super.onRemove(mapOrContext, gl)
    this.renderHost = null
  }

  requestRender() {
    this.renderHost?.invalidate?.()
    super.requestRender()
  }

  onPropsChange({ props, oldProps, nextProps }) {
    const geometryChanged = (
      nextProps.vertices !== undefined
      || nextProps.subdivisionSteps !== undefined
    ) && (
      props.vertices !== oldProps.vertices
      || props.subdivisionSteps !== oldProps.subdivisionSteps
    )
    const shaderChanged = (
      nextProps.vertexShader !== undefined
      || nextProps.fragmentShader !== undefined
    ) && (
      props.vertexShader !== oldProps.vertexShader
      || props.fragmentShader !== oldProps.fragmentShader
    )

    if (geometryChanged) {
      this._refreshMesh()
      this._syncGeometry()
    }

    if (shaderChanged) {
      this._destroyModels()
    }

    this.onLayerPropsChange({
      props,
      oldProps,
      nextProps,
      geometryChanged,
      shaderChanged,
    })
  }

  render(frameOrGl, args) {
    if (args === undefined && frameOrGl?.project) {
      this.renderProjectedFrame(frameOrGl)
      return
    }

    if (!this.device || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    this.renderLayer(frameOrGl, {
      shaderDescription: args.shaderData,
      projectionData: args.defaultProjectionData,
      size: this.getRenderSize(frameOrGl),
    })
  }

  onDeviceReady() {
    this._syncGeometry()
    this._onDeviceReady()
  }

  onDeviceError(error) {
    this._emitShaderState({
      ok: false,
      stage: 'compile',
      message: error.message,
    })
  }

  onBeforeRemove() {
    this._onBeforeRemove()
    this._destroyModels()
    this.positionsBuffer?.destroy()
    this.positionsBuffer = null
    this.projectedModel?.destroy()
    this.projectedModel = null
    this.projectedPositionBuffer?.destroy()
    this.projectedPositionBuffer = null
    this.projectedPositionBufferByteLength = 0
  }

  renderLayer(gl, renderContext) {
    const renderPass = this.device.beginRenderPass({
      id: `${this.id}-screen-pass`,
      clearColor: false,
      clearDepth: false,
      clearStencil: false,
    })

    try {
      this.drawToRenderPass({
        renderPass,
        ...renderContext,
        color: this.props.color,
      })
    } finally {
      renderPass.end()
    }
  }

  getRenderSize(gl) {
    return {
      width: Math.max(1, Math.floor(gl.drawingBufferWidth || 1)),
      height: Math.max(1, Math.floor(gl.drawingBufferHeight || 1)),
    }
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

  renderProjectedFrame(frame) {
    this._ensureProjectedModel()
    this._ensureProjectedPositionBuffer(this._getProjectedPositionByteLength())

    if (!this.projectedModel || !this.projectedPositionBuffer) {
      return
    }

    const positions = new Float32Array(this.meshVertices.length * 2)
    this.meshVertices.forEach((vertex, vertexIndex) => {
      const point = frame.project(vertex)
      const offset = vertexIndex * 2
      positions[offset] = Number(point?.x ?? 0) * frame.devicePixelRatio
      positions[offset + 1] = Number(point?.y ?? 0) * frame.devicePixelRatio
    })

    this.projectedPositionBuffer.write(positions)
    this.projectedModel.setAttributes({ a_pos: this.projectedPositionBuffer })
    this.projectedModel.setVertexCount(this.vertexCount)
    this.projectedModel.pipeline.uniforms = {
      ...this.projectedModel.pipeline.uniforms,
      u_viewport_size: [
        Math.max(1, Math.floor(frame.size.width * frame.devicePixelRatio)),
        Math.max(1, Math.floor(frame.size.height * frame.devicePixelRatio)),
      ],
      u_color: normalizeColor(
        this.props.invertEnabled ? invertColor(this.props.color) : this.props.color,
      ),
    }

    const renderPass = frame.beginRenderPass({
      id: `${this.id}-projected-pass`,
      clearColor: [0, 0, 0, 0],
    })

    try {
      frame.gl.enable(frame.gl.BLEND)
      frame.gl.blendFunc(frame.gl.SRC_ALPHA, frame.gl.ONE_MINUS_SRC_ALPHA)
      this.projectedModel.draw(renderPass)
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
      frame.gl.disable(frame.gl.BLEND)
      renderPass.end()
    }
  }

  _onDeviceReady() {}

  _onBeforeRemove() {}

  onLayerPropsChange() {}

  _refreshMesh() {
    const mesh = buildTriangleGeometry(
      this.props.vertices,
      this.props.subdivisionSteps,
      this.props.projectPosition,
    )
    this.meshVertices = mesh.meshVertices
    this.positions = mesh.positions
    this.vertexCount = mesh.vertexCount
  }

  _syncGeometry() {
    if (!this.device) {
      return
    }

    if (this.positionsBuffer) {
      this.positionsBuffer.write(this.positions)
    } else {
      this.positionsBuffer = this.device.createBuffer({
        id: `${this.id}-positions`,
        usage: Buffer.VERTEX | Buffer.COPY_DST,
        data: this.positions,
      })
    }

    Array.from(this.models.values()).forEach((model) => {
      model.setAttributes({
        a_pos: this.positionsBuffer,
      })
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

  _getProjectedPositionByteLength() {
    return Math.max(8, this.meshVertices.length * 2 * Float32Array.BYTES_PER_ELEMENT)
  }

  _ensureProjectedPositionBuffer(byteLength) {
    if (!this.device) {
      return
    }

    const requiredByteLength = Math.max(8, byteLength)
    if (
      this.projectedPositionBuffer
      && this.projectedPositionBufferByteLength === requiredByteLength
    ) {
      return
    }

    this.projectedPositionBuffer?.destroy()
    this.projectedPositionBuffer = this.device.createBuffer({
      id: `${this.id}-projected-positions`,
      usage: Buffer.VERTEX | Buffer.COPY_DST,
      byteLength: requiredByteLength,
      data: new Uint8Array(requiredByteLength),
    })
    this.projectedPositionBufferByteLength = requiredByteLength

    this.projectedModel?.setAttributes({ a_pos: this.projectedPositionBuffer })
  }

  _ensureProjectedModel() {
    if (!this.device || this.projectedModel) {
      return
    }

    this._ensureProjectedPositionBuffer(this._getProjectedPositionByteLength())
    this.projectedModel = new Model(this.device, {
      id: `${this.id}-projected`,
      vs: projectedVertexShader,
      fs: projectedFragmentShader,
      topology: 'triangle-list',
      isInstanced: false,
      vertexCount: this.vertexCount,
      bufferLayout: [{ name: 'a_pos', format: 'float32x2' }],
      attributes: {
        a_pos: this.projectedPositionBuffer,
      },
    })
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
