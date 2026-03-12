import { Buffer } from '@luma.gl/core'

export class AttributeManager {
  constructor(device) {
    this.device = device
    this.attributes = new Map()
  }

  add(options = {}) {
    const attribute = {
      id: options.id,
      size: options.size ?? 1,
      format: options.format ?? 'float32',
      usage: options.usage ?? (Buffer.VERTEX | Buffer.COPY_DST),
      updater: options.updater ?? (() => null),
      needsUpdate: true,
      buffer: null,
      value: null,
      metadata: null,
    }
    this.attributes.set(attribute.id, attribute)
    return attribute
  }

  invalidate(id) {
    if (id) {
      this.attributes.get(id).needsUpdate = true
      return
    }

    this.invalidateAll()
  }

  invalidateAll() {
    this.attributes.forEach((attribute) => {
      attribute.needsUpdate = true
    })
  }

  update(context = {}) {
    const updates = []

    this.attributes.forEach((attribute) => {
      if (!attribute.needsUpdate) {
        return
      }

      const result = attribute.updater(context)
      const value = result?.value ?? result ?? null
      const metadata = result?.metadata ?? null

      if (!value) {
        return
      }

      if (!attribute.buffer) {
        attribute.buffer = this.device.createBuffer({
          id: attribute.id,
          usage: attribute.usage,
          data: value,
        })
      } else {
        attribute.buffer.write(value)
      }

      attribute.value = value
      attribute.metadata = metadata
      attribute.needsUpdate = false

      updates.push({
        id: attribute.id,
        byteLength: value.byteLength,
        metadata,
      })
    })

    return updates
  }

  getBuffer(id) {
    return this.attributes.get(id)?.buffer ?? null
  }

  destroy() {
    this.attributes.forEach((attribute) => {
      attribute.buffer?.destroy()
      attribute.buffer = null
    })
    this.attributes.clear()
  }
}
