import { Buffer, Texture } from '@luma.gl/core'
import { Model } from '@luma.gl/engine'
import { BasePostProcessingPass } from './BasePostProcessingPass'

const FULLSCREEN_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = 0.5 * (a_position + 1.0);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const FULLSCREEN_POSITIONS = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  1, 1,
])

export class FullscreenPostProcessingPass extends BasePostProcessingPass {
  constructor(props = {}) {
    super(props)
    this.model = null
    this.positionBuffer = null
  }

  init({ layer, device }) {
    this._ensureModel(device)
    layer.props.onPassStateChange?.({
      passId: this.id,
      stage: 'compile',
      target: this.renderToScreen ? 'screen' : 'framebuffer',
    })
  }

  render({
    layer,
    device,
    resources,
    size,
    input,
  }) {
    if (!input || !device || !resources) {
      return input
    }

    this._ensureModel(device)

    if (!this.model) {
      return input
    }

    const target = this.renderToScreen ? 'screen' : 'framebuffer'
    let outputTexture = null
    let framebuffer = null

    if (!this.renderToScreen) {
      outputTexture = resources.getTexture(`${layer.id}-${this.id}-texture`, {
        width: size.width,
        height: size.height,
        format: 'rgba8unorm',
        usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
        sampler: {
          minFilter: 'linear',
          magFilter: 'linear',
        },
      })
      framebuffer = resources.getFramebuffer(`${layer.id}-${this.id}-framebuffer`, {
        width: size.width,
        height: size.height,
        colorAttachments: [outputTexture],
      })
      resources.resizeFramebuffer(`${layer.id}-${this.id}-framebuffer`, size)
    }

    const renderPass = device.beginRenderPass({
      id: `${layer.id}-${this.id}-${target}`,
      framebuffer,
      clearColor: this.renderToScreen ? false : [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false,
    })

    try {
      this.model.setBindings({
        u_Texture: input,
      })
      this.model.pipeline.uniforms = {
        ...this.model.pipeline.uniforms,
        ...this.getUniforms({ size }),
      }
      this.model.draw(renderPass)
    } finally {
      renderPass.end()
    }

    layer.props.onPassStateChange?.({
      passId: this.id,
      stage: 'render',
      target,
      size,
    })

    return outputTexture
  }

  destroy() {
    this.model?.destroy()
    this.model = null
    this.positionBuffer?.destroy()
    this.positionBuffer = null
  }

  getUniforms() {
    return {}
  }

  getFragmentShader() {
    throw new Error('FullscreenPostProcessingPass.getFragmentShader() must be implemented.')
  }

  _ensureModel(device) {
    if (!device || this.model) {
      return
    }

    this.positionBuffer = device.createBuffer({
      id: `${this.id}-fullscreen-positions`,
      usage: Buffer.VERTEX,
      data: FULLSCREEN_POSITIONS,
    })

    this.model = new Model(device, {
      id: `${this.id}-fullscreen-model`,
      vs: FULLSCREEN_VERTEX_SHADER,
      fs: this.getFragmentShader(),
      topology: 'triangle-strip',
      isInstanced: false,
      vertexCount: 4,
      bufferLayout: [{ name: 'a_position', format: 'float32x2' }],
      attributes: {
        a_position: this.positionBuffer,
      },
    })
  }
}
