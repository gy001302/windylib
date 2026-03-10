import { MapTriangleLayer } from '../MapTriangleLayer'
import { MultiPassRenderer } from '../../core/MultiPassRenderer'
import { ResourceManager } from '../../core/ResourceManager'
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
    this.props = {
      invertEnabled: false,
      onPassStateChange: null,
      ...this.props,
      ...props,
    }
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

  setProps(nextProps = {}) {
    const previousProps = this.props
    super.setProps(nextProps)

    if (!this.multiPassRenderer) {
      return
    }

    if (
      this.props.invertEnabled !== previousProps.invertEnabled
      || this.props.vertexShader !== previousProps.vertexShader
      || this.props.fragmentShader !== previousProps.fragmentShader
    ) {
      this.configurePasses()
    }

    this.multiPassRenderer.updatePasses(this, {
      props: this.props,
      oldProps: previousProps,
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
    return this.props.invertEnabled ? [
      new InvertPass({
        id: 'invert-pass',
      }),
    ] : []
  }

  configurePasses() {
    this.multiPassRenderer?.setPasses([
      ...this.createPasses(),
      ...this.createPostProcessingPasses(),
    ], this)
  }

  render(gl, args) {
    if (!this.multiPassRenderer || !args?.shaderData || !args?.defaultProjectionData) {
      return
    }

    this.multiPassRenderer.render(this, {
      shaderDescription: args.shaderData,
      projectionData: args.defaultProjectionData,
      size: {
        width: Math.max(1, Math.floor(gl.drawingBufferWidth || 1)),
        height: Math.max(1, Math.floor(gl.drawingBufferHeight || 1)),
      },
    })
  }

  onRemove(map, gl) {
    this.multiPassRenderer?.destroy(this)
    this.multiPassRenderer = null
    this.resourceManager?.destroy()
    this.resourceManager = null
    super.onRemove(map, gl)
  }
}
