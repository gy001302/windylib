import { RenderPass } from './RenderPass'

export class DebugTrianglePass extends RenderPass {
  constructor(props = {}) {
    super({
      ...props,
      renderToScreen: true,
    })
  }
}
