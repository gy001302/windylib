import { Texture } from '@luma.gl/core'
import {
  BaseLayer,
  FullscreenPostProcessingPass,
  ResourceManager,
} from '@windylib/core'
import { TriangleLayer } from '../TriangleLayer'

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

  static defaultProps = {
    ...TriangleLayer.defaultProps,
    onPassStateChange: {
      type: 'function',
      value: null,
      compare: false,
    },
  }

  static defaultVertexShader = TriangleLayer.defaultVertexShader

  static defaultFragmentShader = TriangleLayer.defaultFragmentShader

  constructor(props = {}) {
    super(props)
    this.triangleLayer = new TriangleLayer(this.props)
    this.resourceManager = null
    this.postProcessingPasses = []
  }

  onPropsChange({ oldProps, nextProps }) {
    this.triangleLayer.setProps(nextProps)

    if (
      this.device
      && nextProps.invertEnabled !== undefined
      && nextProps.invertEnabled !== oldProps.invertEnabled
    ) {
      this._rebuildPasses()
    }
  }

  onDeviceReady() {
    this.triangleLayer.onAdd({
      device: this.device,
      map: this.map,
      gl: this.gl,
      host: {
        invalidate: () => this.requestRender(),
      },
    })

    this.resourceManager = new ResourceManager(this.device)
    this._rebuildPasses()
  }

  onDeviceError(error) {
    this.triangleLayer.onDeviceError(error)
  }

  onBeforeRemove() {
    this._destroyPasses()
    this.resourceManager?.destroy()
    this.resourceManager = null
    this.triangleLayer.onRemove({
      device: this.device,
      map: this.map,
      gl: this.gl,
    })
  }

  render(frameOrGl, args) {
    if (args === undefined && frameOrGl?.project) {
      this.triangleLayer.render(frameOrGl)
      return
    }

    if (!this.device || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    const renderContext = {
      shaderDescription: args.shaderData,
      projectionData: args.defaultProjectionData,
      size: this.triangleLayer.getRenderSize(frameOrGl),
    }

    if (!this.postProcessingPasses.length) {
      this._emitPassState({
        passId: 'render-pass',
        stage: 'render',
        target: 'screen',
        size: renderContext.size,
      })
      this.triangleLayer.renderLayer(frameOrGl, renderContext)
      return
    }

    const input = this.renderToTexture(renderContext)
    this.renderPostProcessingPasses(input, renderContext.size)
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
    const framebuffer = this.resourceManager.getFramebuffer(framebufferId, {
      width: renderContext.size.width,
      height: renderContext.size.height,
      colorAttachments: [colorTexture],
    })

    this.resourceManager.resizeFramebuffer(framebufferId, renderContext.size)

    const renderPass = this.device.beginRenderPass({
      id: `${this.id}-render-pass-offscreen`,
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false,
    })

    try {
      this.triangleLayer.drawToRenderPass({
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

    return [
      new InvertPass({
        id: 'invert-pass',
      }),
    ]
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

  _emitPassState(event) {
    this.props.onPassStateChange?.(event)
  }
}
