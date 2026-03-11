import { PassType } from './passes/BasePass'
import { PostProcessor } from './PostProcessor'

export class MultiPassRenderer {
  constructor({ device, resources }) {
    this.device = device
    this.resources = resources
    this.passes = []
    this.postProcessor = new PostProcessor({ device, resources })
  }

  getPostProcessor() {
    return this.postProcessor
  }

  setPasses(passes, layer) {
    const runtime = {
      layer,
      device: this.device,
      resources: this.resources,
    }

    this.passes.forEach((pass) => pass.destroy?.(runtime))
    this.passes = passes.filter((pass) => pass.getType?.() !== PassType.PostProcessing)
    this.passes.forEach((pass) => pass.init?.(runtime))
    this.postProcessor.setPasses(passes, runtime)
  }

  updatePasses(layer, updateParams) {
    this.passes.forEach((pass) => pass.update?.({
      layer,
      ...updateParams,
    }))
    this.postProcessor.updatePasses(layer, updateParams)
  }

  render(layer, renderContext) {
    const runtime = {
      layer,
      device: this.device,
      resources: this.resources,
      ...renderContext,
    }

    this.passes.forEach((pass) => pass.resize?.(runtime))
    this.postProcessor.resize(runtime)

    let input = null
    this.passes.forEach((pass) => {
      input = pass.render({
        ...runtime,
        input,
      })
    })

    this.postProcessor.render(runtime, input)
  }

  destroy(layer) {
    const runtime = {
      layer,
      device: this.device,
      resources: this.resources,
    }

    this.passes.forEach((pass) => pass.destroy?.(runtime))
    this.passes = []
    this.postProcessor.destroy(runtime)
  }
}
