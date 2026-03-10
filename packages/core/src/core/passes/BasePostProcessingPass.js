import { BasePass, PassType } from './BasePass'

export class BasePostProcessingPass extends BasePass {
  constructor(props = {}) {
    super(props)
    this.enabled = props.enabled ?? true
    this.renderToScreen = false
  }

  getType() {
    return PassType.PostProcessing
  }

  setRenderToScreen(renderToScreen) {
    this.renderToScreen = renderToScreen
  }

  isEnabled() {
    return this.enabled
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }
}
