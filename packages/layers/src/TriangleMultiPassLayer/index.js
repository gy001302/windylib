import { Buffer, Texture } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import {
  BaseLayer,
  FullscreenPostProcessingPass,
  ResourceManager,
  normalizeColor,
  shaders,
} from '@windylib/core'
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
    value: shaders.mapTriangle.vertex,
  },
  fragmentShader: {
    ...baseDefaultProps.fragmentShader,
    value: shaders.mapTriangle.fragment,
  },
  onPassStateChange: {
    type: 'function',
    value: null,
    compare: false,
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

const INVERT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_Texture;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_Texture, v_uv);
  if (color.a <= 0.0) {
    discard;
  }
  fragColor = vec4(1.0 - color.rgb, color.a);
}`

class InvertPass extends FullscreenPostProcessingPass {
  getFragmentShader() {
    return INVERT_FRAGMENT_SHADER
  }
}

export class TriangleMultiPassLayer extends BaseLayer {
  static componentName = 'TriangleMultiPassLayer'

  static layerName = 'TriangleMultiPassLayer'

  static defaultProps = defaultProps

  static defaultVertexShader = shaders.mapTriangle.vertex

  static defaultFragmentShader = shaders.mapTriangle.fragment

  constructor(props = {}) {
    super(props)
    this.models = new Map()
    this.positionsBuffer = null
    this.positions = new Float32Array(0)
    this.vertexCount = 0
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
    this.resourceManager = null
    this.postProcessingPasses = []
    this._refreshMesh()
  }

  async onAdd(mapOrContext, gl) {
    if (arguments.length === 1 && mapOrContext?.device) {
      this.destroyed = false
      this.renderHost = mapOrContext.host ?? null
      this.map = mapOrContext.map ?? null
      this.gl = mapOrContext.gl ?? null
      this.device = mapOrContext.device ?? null
      this._initializeResources()
      this.requestRender()
      return this
    }

    this.renderHost = null
    return super.onAdd(mapOrContext, gl)
  }

  onRemove(mapOrContext, gl) {
    if (arguments.length === 1 && mapOrContext?.device) {
      this.destroyed = true
      this._cleanupResources()
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
    const passChanged = (
      nextProps.invertEnabled !== undefined
      && props.invertEnabled !== oldProps.invertEnabled
    )

    if (geometryChanged) {
      this._refreshMesh()
      this._syncGeometry()
    }

    if (shaderChanged) {
      this._destroyModels()
    }

    if (this.device && passChanged) {
      this._rebuildPasses()
    }
  }

  render(frameOrGl, args) {
    if (args === undefined && frameOrGl?.project) {
      if (this.postProcessingPasses.length) {
        const input = this.renderProjectedToTexture(frameOrGl)
        this.renderPostProcessingPasses(input, this.getProjectedRenderSize(frameOrGl))
        return
      }

      this.renderProjectedFrame(frameOrGl)
      return
    }

    if (!this.device || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    const renderContext = {
      shaderDescription: args.shaderData,
      projectionData: args.defaultProjectionData,
      size: this.getRenderSize(frameOrGl),
    }

    if (!this.postProcessingPasses.length) {
      this._emitPassState({
        passId: 'render-pass',
        stage: 'render',
        target: 'screen',
        size: renderContext.size,
      })
      this.renderLayer(frameOrGl, renderContext)
      return
    }

    const input = this.renderToTexture(renderContext)
    this.renderPostProcessingPasses(input, renderContext.size)
  }

  onDeviceReady() {
    this._initializeResources()
  }

  onDeviceError(error) {
    this._emitShaderState({
      ok: false,
      stage: 'compile',
      message: error.message,
    })
  }

  onBeforeRemove() {
    this._cleanupResources()
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

  renderToTexture(renderContext) {
    const textureId = `${this.id}-offscreen-texture`
    const framebufferId = `${this.id}-offscreen-framebuffer`
    const colorTexture = this.resourceManager.getTexture(textureId, {
      width: renderContext.size.width,
      height: renderContext.size.height,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
      },
    })
    const framebuffer = this.resourceManager.getFramebufferWithSize(framebufferId, {
      width: renderContext.size.width,
      height: renderContext.size.height,
      colorAttachments: [colorTexture],
    }, renderContext.size)

    const renderPass = this.device.beginRenderPass({
      id: `${this.id}-render-pass-offscreen`,
      framebuffer,
      clearColor: [0, 0, 0, 0],
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

    this._emitPassState({
      passId: 'render-pass',
      stage: 'render',
      target: 'framebuffer',
      size: renderContext.size,
    })

    return colorTexture
  }

  renderProjectedFrame(frame) {
    const renderPass = frame.beginRenderPass({
      id: `${this.id}-projected-pass`,
      clearColor: [0, 0, 0, 0],
    })

    try {
      this.drawProjectedToRenderPass({
        frame,
        renderPass,
        color: this.props.color,
      })
    } finally {
      renderPass.end()
    }
  }

  renderProjectedToTexture(frame) {
    const size = this.getProjectedRenderSize(frame)
    const textureId = `${this.id}-projected-offscreen-texture`
    const framebufferId = `${this.id}-projected-offscreen-framebuffer`
    const colorTexture = this.resourceManager.getTexture(textureId, {
      width: size.width,
      height: size.height,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
      },
    })
    const framebuffer = this.resourceManager.getFramebufferWithSize(framebufferId, {
      width: size.width,
      height: size.height,
      colorAttachments: [colorTexture],
    }, size)

    const renderPass = this.device.beginRenderPass({
      id: `${this.id}-projected-offscreen-pass`,
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false,
    })

    try {
      this.drawProjectedToRenderPass({
        frame,
        renderPass,
        color: this.props.color,
      })
    } finally {
      renderPass.end()
    }

    this._emitPassState({
      passId: 'render-pass',
      stage: 'render',
      target: 'framebuffer',
      size,
    })

    return colorTexture
  }

  renderPostProcessingPasses(initialInput, size) {
    let input = initialInput

    this.postProcessingPasses.forEach((pass, index) => {
      pass.setRenderToScreen(index === this.postProcessingPasses.length - 1)
      input = pass.render({
        layer: this,
        device: this.device,
        resources: this.resourceManager,
        size,
        input,
      })
    })
  }

  createPostProcessingPasses() {
    if (!this.props.invertEnabled) {
      return []
    }

    return [new InvertPass({ id: 'invert-pass' })]
  }

  getRenderSize(gl) {
    return {
      width: Math.max(1, Math.floor(gl.drawingBufferWidth || 1)),
      height: Math.max(1, Math.floor(gl.drawingBufferHeight || 1)),
    }
  }

  getProjectedRenderSize(frame) {
    return {
      width: Math.max(1, Math.floor(frame.size.width * frame.devicePixelRatio)),
      height: Math.max(1, Math.floor(frame.size.height * frame.devicePixelRatio)),
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

  drawProjectedToRenderPass({ frame, renderPass, color }) {
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
      u_color: normalizeColor(color),
    }

    frame.gl.enable(frame.gl.BLEND)
    frame.gl.blendFunc(frame.gl.SRC_ALPHA, frame.gl.ONE_MINUS_SRC_ALPHA)

    try {
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
    }
  }

  _initializeResources() {
    this._syncGeometry()

    if (!this.resourceManager) {
      this.resourceManager = new ResourceManager(this.device)
    }

    this._rebuildPasses()
  }

  _cleanupResources() {
    this._destroyPasses()
    this.resourceManager?.destroy()
    this.resourceManager = null
    this._destroyModels()
    this.positionsBuffer?.destroy()
    this.positionsBuffer = null
    this.projectedModel?.destroy()
    this.projectedModel = null
    this.projectedPositionBuffer?.destroy()
    this.projectedPositionBuffer = null
    this.projectedPositionBufferByteLength = 0
  }

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

  _rebuildPasses() {
    this._destroyPasses()
    this.postProcessingPasses = this.createPostProcessingPasses()
    this.postProcessingPasses.forEach((pass) => {
      pass.init({
        layer: this,
        device: this.device,
        resources: this.resourceManager,
      })
    })
  }

  _destroyPasses() {
    this.postProcessingPasses.forEach((pass) => {
      pass.destroy({
        layer: this,
        device: this.device,
        resources: this.resourceManager,
      })
    })
    this.postProcessingPasses = []
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

  _emitPassState(event) {
    this.props.onPassStateChange?.(event)
  }
}
