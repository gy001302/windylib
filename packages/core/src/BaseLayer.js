import { luma } from '@luma.gl/core'
import { webgl2Adapter } from '@luma.gl/webgl'

function resolveDefaultProps(defaultProps = {}) {
  return Object.fromEntries(
    Object.entries(defaultProps).map(([key, value]) => {
      if (value && typeof value === 'object' && 'value' in value) {
        return [key, value.value]
      }

      return [key, value]
    }),
  )
}

export class BaseLayer {
  static componentName = 'BaseLayer'

  static defaultProps = {}

  constructor(props = {}) {
    this.type = 'custom'
    this.renderingMode = '2d'
    this.map = null
    this.gl = null
    this.device = null
    this.devicePromise = null
    this.destroyed = false
    this.props = {
      ...resolveDefaultProps(this.constructor.defaultProps),
      ...props,
    }
    this.id = this.props.id
  }

  setProps(nextProps = {}) {
    const previousProps = this.props
    this.props = {
      ...this.props,
      ...nextProps,
    }
    this.id = this.props.id
    this.onPropsChange({
      props: this.props,
      oldProps: previousProps,
      nextProps,
    })
    this.requestRender()
    return this
  }

  async onAdd(map, gl) {
    this.map = map
    this.gl = gl

    this.devicePromise = luma.attachDevice(gl, {
      adapters: [webgl2Adapter],
      createCanvasContext: {
        canvas: gl.canvas,
        autoResize: false,
      },
    }).then((device) => {
      if (this.destroyed) {
        device.destroy()
        return null
      }

      this.device = device
      this.onDeviceReady(device)
      this.requestRender()
      return device
    }).catch((error) => {
      this.onDeviceError(error)
      throw error
    })
  }

  onRemove(map, gl) {
    this.destroyed = true
    this.onBeforeRemove({ map, gl })
    this.device?.destroy()
    this.device = null
    this.map = null
    this.gl = null
    this.devicePromise = null
  }

  requestRender() {
    this.map?.triggerRepaint?.()
  }

  onPropsChange() {}

  onDeviceReady() {}

  onDeviceError() {}

  onBeforeRemove() {}
}

export { resolveDefaultProps }
