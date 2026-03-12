// pass 基类，定义 pass 分类、启停状态和统一接口约定。
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
