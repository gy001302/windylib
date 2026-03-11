import { MapTriangleLayer } from '../MapTriangleLayer'
import { MultiPassRenderer, ResourceManager } from '@windylib/core'
import { RenderPass } from './RenderPass'
import { InvertPass } from './InvertPass'

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
      new RenderPass({
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
