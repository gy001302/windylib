import { MultiPassRenderer } from './MultiPassRenderer'
import { ResourceManager } from './ResourceManager'

function normalizeSize(size) {
  if (size && Number.isFinite(size.width) && Number.isFinite(size.height)) {
    return {
      width: Math.max(1, Math.floor(size.width || 1)),
      height: Math.max(1, Math.floor(size.height || 1)),
    }
  }

  return { width: 1, height: 1 }
}

export class BaseMultiPassLayer {
  static componentName = 'BaseMultiPassLayer'

  constructor(props = {}) {
    this.props = { ...props }
    this.device = null
    this.resources = null
    this.multiPassRenderer = null
    this.runtimeContext = {
      viewport: null,
      shaderModuleProps: {},
      uniforms: {},
      parameters: {},
      size: { width: 1, height: 1 },
    }
  }

  initialize({ device, resources } = {}) {
    if (!device) {
      throw new Error('BaseMultiPassLayer.initialize: device is required.')
    }

    this.device = device
    this.resources = resources ?? new ResourceManager(device)
    this.multiPassRenderer = new MultiPassRenderer({
      device: this.device,
      resources: this.resources,
    })
    this.configurePasses()
    return this
  }

  setProps(nextProps = {}) {
    this.props = {
      ...this.props,
      ...nextProps,
    }
    return this
  }

  createPasses() {
    return []
  }

  createPostProcessingPasses() {
    return []
  }

  setPasses(passes) {
    this.multiPassRenderer?.setPasses(passes, this)
  }

  configurePasses() {
    this.setPasses([
      ...this.createPasses(),
      ...this.createPostProcessingPasses(),
    ])
  }

  setRuntimeContext(runtimeContext = {}) {
    this.runtimeContext = {
      ...this.runtimeContext,
      ...runtimeContext,
      size: normalizeSize(runtimeContext.size ?? this.runtimeContext.size),
      uniforms: runtimeContext.uniforms ?? this.runtimeContext.uniforms,
      parameters: runtimeContext.parameters ?? this.runtimeContext.parameters,
      shaderModuleProps: runtimeContext.shaderModuleProps ?? this.runtimeContext.shaderModuleProps,
    }
    return this
  }

  render(runtimeContext = {}) {
    if (!this.multiPassRenderer) {
      throw new Error('BaseMultiPassLayer.render: layer must be initialized before rendering.')
    }

    this.setRuntimeContext(runtimeContext)
    this.multiPassRenderer.render(this, this.runtimeContext)
    return this
  }

  destroy() {
    this.multiPassRenderer?.destroy(this)
    this.multiPassRenderer = null
    this.resources?.destroy()
    this.resources = null
    this.device = null
  }
}
