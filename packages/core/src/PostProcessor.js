import { PassType } from './passes/BasePass'

export class PostProcessor {
  constructor({ device, resources }) {
    this.device = device
    this.resources = resources
    this.passes = []
  }

  setPasses(passes, runtime) {
    this.passes.forEach((pass) => pass.destroy?.(runtime))
    this.passes = passes.filter((pass) => pass.getType?.() === PassType.PostProcessing)
    this.passes.forEach((pass) => pass.init?.(runtime))
  }

  updatePasses(layer, updateParams) {
    this.passes.forEach((pass) => pass.update?.({
      layer,
      ...updateParams,
    }))
  }

  resize(runtime) {
    this.passes.forEach((pass) => pass.resize?.(runtime))
  }

  render(runtime, initialInput = null) {
    const enabledPasses = this.passes.filter((pass) => pass.isEnabled?.() ?? true)
    let input = initialInput

    enabledPasses.forEach((pass, index) => {
      pass.setRenderToScreen?.(index === enabledPasses.length - 1)
      input = pass.render({
        ...runtime,
        input,
      })
    })

    return input
  }

  destroy(runtime) {
    this.passes.forEach((pass) => pass.destroy?.(runtime))
    this.passes = []
  }
}
