/* eslint-disable max-classes-per-file */
import { Texture } from '@luma.gl/core'
import { MapTriangleLayer } from '../MapTriangleLayer'
import {
  BasePass,
  BasePostProcessingPass,
  MultiPassRenderer,
  ResourceManager,
} from '@windylib/core'

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

class TriangleRenderPass extends BasePass {
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

class InvertPass extends BasePostProcessingPass {
  getFragmentShader() {
    return INVERT_FRAGMENT_SHADER
  }
}

export class TriangleMultiPassLayer extends MapTriangleLayer {
  static componentName = 'TriangleMultiPassLayer'

  static layerName = 'TriangleMultiPassLayer'

  static defaultProps = {
    ...MapTriangleLayer.defaultProps,
    invertEnabled: {
      type: 'boolean',
      value: false,
      compare: true,
    },
    onPassStateChange: {
      type: 'function',
      value: null,
      compare: false,
    },
  }

  static defaultVertexShader = MapTriangleLayer.defaultVertexShader

  static defaultFragmentShader = MapTriangleLayer.defaultFragmentShader

  constructor(props = {}) {
    super(props)
    this.resourceManager = null
    this.multiPassRenderer = null
  }

  _onDeviceReady() {
    this.resourceManager = new ResourceManager(this.device)
    this.multiPassRenderer = new MultiPassRenderer({
      device: this.device,
      resources: this.resourceManager,
    })
    this.configurePasses()
  }

  onLayerPropsChange({ props, oldProps, shaderChanged }) {
    if (!this.multiPassRenderer) {
      return
    }

    if (props.invertEnabled !== oldProps.invertEnabled || shaderChanged) {
      this.configurePasses()
    }

    this.multiPassRenderer.updatePasses(this, {
      props,
      oldProps,
      changeFlags: {},
    })
  }

  createPasses() {
    return [
      new TriangleRenderPass({
        id: 'render-pass',
        renderToScreen: !this.props.invertEnabled,
      }),
    ]
  }

  createPostProcessingPasses() {
    return this.props.invertEnabled ? [new InvertPass({ id: 'invert-pass' })] : []
  }

  configurePasses() {
    this.multiPassRenderer?.setPasses([
      ...this.createPasses(),
      ...this.createPostProcessingPasses(),
    ], this)
  }

  renderLayer(gl, renderContext) {
    if (!this.multiPassRenderer) {
      return
    }

    this.multiPassRenderer.render(this, renderContext)
  }

  _onBeforeRemove() {
    this.multiPassRenderer?.destroy(this)
    this.multiPassRenderer = null
    this.resourceManager?.destroy()
    this.resourceManager = null
  }
}
