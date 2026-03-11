import { Texture } from '@luma.gl/core'
import { BasePass } from '@windylib/core'

function samplePixels(device, source, size) {
  const sampleWidth = Math.max(1, Math.min(4, Math.floor(size.width || 1)))
  const sampleHeight = Math.max(1, Math.min(4, Math.floor(size.height || 1)))

  try {
    const pixels = device.readPixelsToArrayWebGL(source, {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: sampleWidth,
      sourceHeight: sampleHeight,
    })

    return {
      width: sampleWidth,
      height: sampleHeight,
      values: Array.from(pixels).slice(0, sampleWidth * sampleHeight * 4),
    }
  } catch (error) {
    return {
      width: sampleWidth,
      height: sampleHeight,
      error: error.message,
    }
  }
}

export class RenderPass extends BasePass {
  constructor(props = {}) {
    super(props)
    this.renderToScreen = props.renderToScreen ?? false
  }

  init({ layer }) {
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
    shaderDescription,
    projectionData,
  }) {
    if (!shaderDescription || !projectionData) {
      return null
    }

    if (this.renderToScreen) {
      const renderPass = device.beginRenderPass({
        id: `${layer.id}-render-pass-screen`,
        clearColor: false,
        clearDepth: false,
        clearStencil: false,
      })

      try {
        layer.drawToRenderPass({
          renderPass,
          shaderDescription,
          projectionData,
          color: layer.props.color,
        })
      } finally {
        renderPass.end()
      }

      layer.props.onPassStateChange?.({
        passId: this.id,
        stage: 'render',
        target: 'screen',
        size,
      })

      return null
    }

    const textureId = `${layer.id}-offscreen-texture`
    const colorTexture = resources.getTexture(textureId, {
      width: size.width,
      height: size.height,
      format: 'rgba8unorm',
      usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
      },
    })
    const framebuffer = resources.getFramebuffer(`${layer.id}-offscreen`, {
      width: size.width,
      height: size.height,
      colorAttachments: [colorTexture],
    })
    resources.resizeFramebuffer(`${layer.id}-offscreen`, size)

    const renderPass = device.beginRenderPass({
      id: `${layer.id}-render-pass-offscreen`,
      framebuffer,
      clearColor: [0, 0, 0, 0],
      clearDepth: false,
      clearStencil: false,
    })

    try {
      layer.drawToRenderPass({
        renderPass,
        shaderDescription,
        projectionData,
        color: layer.props.color,
      })
    } finally {
      renderPass.end()
    }

    layer.props.onPassStateChange?.({
      passId: this.id,
      stage: 'render',
      target: 'framebuffer',
      size,
      pixelSample: samplePixels(device, framebuffer, size),
    })

    return colorTexture
  }
}
