export class ResourceManager {
  constructor(device) {
    this.device = device
    this.framebuffers = new Map()
    this.textures = new Map()
  }

  getTexture(id, props) {
    const existing = this.textures.get(id)

    if (existing && props) {
      const widthChanged = Number.isFinite(props.width) && existing.width !== props.width
      const heightChanged = Number.isFinite(props.height) && existing.height !== props.height
      const formatChanged = props.format && existing.format !== props.format

      if (widthChanged || heightChanged || formatChanged) {
        existing.destroy()
        this.textures.delete(id)
      }
    }

    if (!this.textures.has(id)) {
      this.textures.set(id, this.device.createTexture({ id, ...props }))
    }

    return this.textures.get(id)
  }

  resizeTexture(id, size) {
    return this.getTexture(id, size)
  }

  getFramebuffer(id, props) {
    const existing = this.framebuffers.get(id)
    const nextColorAttachments = props?.colorAttachments || []

    if (existing) {
      const needsRecreate = nextColorAttachments.some((attachment, index) => {
        const current = existing.colorAttachments[index]?.texture
        return current && attachment && current !== attachment
      })

      if (needsRecreate) {
        existing.destroy()
        this.framebuffers.delete(id)
      }
    }

    if (!this.framebuffers.has(id)) {
      this.framebuffers.set(id, this.device.createFramebuffer({ id, ...props }))
    }
    return this.framebuffers.get(id)
  }

  resizeFramebuffer(id, size) {
    const framebuffer = this.framebuffers.get(id)
    if (!framebuffer) {
      return
    }

    if (framebuffer.width !== size.width || framebuffer.height !== size.height) {
      framebuffer.resize(size)
    }
  }

  destroy() {
    this.framebuffers.forEach((framebuffer) => framebuffer.destroy())
    this.framebuffers.clear()
    this.textures.forEach((texture) => texture.destroy())
    this.textures.clear()
  }
}
