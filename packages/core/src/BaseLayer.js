import { luma } from '@luma.gl/core'
import { webgl2Adapter } from '@luma.gl/webgl'
import { diffLayerProps, resolveDefaultProps } from './lifecycle/props'

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
    this.stateInitialized = false
  }

  setProps(nextProps = {}) {
    const previousProps = this.props
    this.props = {
      ...this.props,
      ...nextProps,
    }
    this.id = this.props.id

    const updateParams = {
      props: this.props,
      oldProps: previousProps,
      nextProps,
      changeFlags: this.diffProps(previousProps, this.props, nextProps),
    }

    if (this.stateInitialized && this.shouldUpdateState(updateParams)) {
      this.updateState(updateParams)
    }

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
      const lifecycleParams = {
        device,
        map: this.map,
        gl: this.gl,
        props: this.props,
      }
      this.initializeState(lifecycleParams)
      this.stateInitialized = true
      this.updateState({
        props: this.props,
        oldProps: null,
        nextProps: this.props,
        changeFlags: this.diffProps({}, this.props, this.props),
      })
      this.requestRender()
      return device
    }).catch((error) => {
      this.onDeviceError(error)
      throw error
    })
  }

  onRemove(map, gl) {
    this.destroyed = true
    this.finalizeState({
      map,
      gl,
      device: this.device,
      props: this.props,
    })
    this.stateInitialized = false
    this.device?.destroy()
    this.device = null
    this.map = null
    this.gl = null
    this.devicePromise = null
  }

  render(gl, args) {
    if (!this.device || !this.stateInitialized) {
      return
    }

    this.draw({
      gl,
      ...args,
    })
  }

  requestRender() {
    this.map?.triggerRepaint?.()
  }

  diffProps(oldProps, props, nextProps = {}) {
    return diffLayerProps({
      defaultProps: this.constructor.defaultProps,
      oldProps,
      props,
      nextProps,
    })
  }

  initializeState({ device } = {}) {
    this.props.onLifecycleStateChange?.({
      id: this.id,
      stage: 'initialize',
    })
    this.onDeviceReady(device)
  }

  shouldUpdateState({ changeFlags }) {
    return Boolean(changeFlags?.propsChanged)
  }

  updateState(params) {
    this.props.onLifecycleStateChange?.({
      id: this.id,
      stage: 'update',
      changeFlags: params.changeFlags,
    })
    this.onPropsChange(params)
  }

  draw() {
    this.props.onLifecycleStateChange?.({
      id: this.id,
      stage: 'draw',
    })
  }

  finalizeState(params = {}) {
    this.props.onLifecycleStateChange?.({
      id: this.id,
      stage: 'finalize',
    })
    this.onBeforeRemove(params)
  }

  onPropsChange() {}

  onDeviceReady() {}

  onDeviceError() {}

  onBeforeRemove() {}
}

export { resolveDefaultProps }
