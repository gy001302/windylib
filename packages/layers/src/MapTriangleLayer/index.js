import { Buffer } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import { BaseLayer, normalizeColor } from '@windylib/core'
// eslint-disable-next-line import/no-unresolved
import defaultVertexShader from '../../../core/src/shaders/map-triangle/triangle.vs.glsl?raw'
// eslint-disable-next-line import/no-unresolved
import defaultFragmentShader from '../../../core/src/shaders/map-triangle/triangle.fs.glsl?raw'
import {
  baseDefaultProps,
  buildFragmentShader,
  buildVertexShader,
  toProjectedPositions,
} from './helpers'

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

export class MapTriangleLayer extends BaseLayer {
  static layerName = 'MapTriangleLayer'

  static defaultProps = defaultProps

  static defaultVertexShader = defaultVertexShader

  static defaultFragmentShader = defaultFragmentShader

  constructor(props = {}) {
    super(props)
    this.models = new Map()
    this.positionsBuffer = null
    this.vertexCount = 0
    this.positions = new Float32Array(0)
    this.shaderState = {
      ok: true,
      stage: 'init',
      message: '',
    }
    this._refreshMesh()
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

  render(gl, args) {
    if (!this.device || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    this.renderLayer(gl, {
      shaderDescription: args.shaderData,
      projectionData: args.defaultProjectionData,
      size: this.getRenderSize(gl),
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

  _onDeviceReady() {}

  _onBeforeRemove() {}

  onLayerPropsChange() {}

  _refreshMesh() {
    const mesh = toProjectedPositions(
      this.props.vertices,
      this.props.subdivisionSteps,
      this.props.projectPosition,
    )
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
