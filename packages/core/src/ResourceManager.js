export class ResourceManager {
  constructor(device) {
    this.device = device
    this.framebuffers = new Map()
    this.textures = new Map()
  }

  getTexture(id, props) {
    const texture = this.textures.get(id)
    if (texture && this.shouldRecreateTexture(texture, props)) {
      texture.destroy()
      this.textures.delete(id)
    }

    if (!this.textures.has(id)) {
      this.textures.set(id, this.device.createTexture({ id, ...props }))
    }

    return this.textures.get(id)
  }

  getFramebuffer(id, props) {
    const framebuffer = this.framebuffers.get(id)
    if (framebuffer && this.shouldRecreateFramebuffer(framebuffer, props)) {
      framebuffer.destroy()
      this.framebuffers.delete(id)
    }

    if (!this.framebuffers.has(id)) {
      this.framebuffers.set(id, this.device.createFramebuffer({ id, ...props }))
    }

    return this.framebuffers.get(id)
  }

  getFramebufferWithSize(id, props, size) {
    const framebuffer = this.getFramebuffer(id, props)
    if (framebuffer && (framebuffer.width !== size.width || framebuffer.height !== size.height)) {
      framebuffer.resize(size)
    }

    return framebuffer
  }

  destroy() {
    this.framebuffers.forEach((framebuffer) => framebuffer.destroy())
    this.framebuffers.clear()
    this.textures.forEach((texture) => texture.destroy())
    this.textures.clear()
  }

  shouldRecreateTexture(texture, props = {}) {
    const widthChanged = Number.isFinite(props.width) && texture.width !== props.width
    const heightChanged = Number.isFinite(props.height) && texture.height !== props.height
    const formatChanged = props.format && texture.format !== props.format

    return widthChanged || heightChanged || formatChanged
  }

  shouldRecreateFramebuffer(framebuffer, props = {}) {
    const nextColorAttachments = props.colorAttachments || []

    return nextColorAttachments.some((attachment, index) => {
      const current = framebuffer.colorAttachments[index]?.texture
      return current && attachment && current !== attachment
    })
  }
}
