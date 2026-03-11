export const PassType = {
  Normal: 'normal',
  PostProcessing: 'post-processing',
}

export class BasePass {
  constructor(props = {}) {
    this.id = props.id || 'base-pass'
  }

  getType() {
    return PassType.Normal
  }

  init() {}

  resize() {}

  update() {}

  render() {
    return null
  }

  destroy() {}
}
