// 叠加式 canvas host，负责创建独立 WebGL2 上下文并驱动 renderer 重绘。
import { luma } from '@luma.gl/core'
import { webgl2Adapter } from '@luma.gl/webgl'

export class CanvasOverlayRendererHost {
  constructor(options = {}) {
    const {
      canvasHost,
      renderer = null,
    } = options

    if (!canvasHost) {
      throw new Error('CanvasOverlayRendererHost: canvasHost is required.')
    }

    this.canvasHost = canvasHost
    this.renderer = renderer
    this.device = null
    this.gl = null
    this.frameHandle = 0
    this.destroyed = false
    this._detachRenderListener = null
  }

  async attach() {
    if (this.device) {
      return this
    }

    await this.canvasHost.attach()
    const canvas = this.canvasHost.getCanvas()
    if (!canvas) {
      throw new Error('CanvasOverlayRendererHost: canvasHost did not provide a canvas.')
    }

    this.gl = canvas.getContext('webgl2', {
      antialias: this.canvasHost.antialias ?? true,
      alpha: true,
      preserveDrawingBuffer: this.canvasHost.preserveDrawingBuffer ?? false,
    })

    if (!this.gl) {
      throw new Error('CanvasOverlayRendererHost: failed to create WebGL2 context.')
    }

    this.device = await luma.attachDevice(this.gl, {
      adapters: [webgl2Adapter],
      createCanvasContext: {
        canvas,
        autoResize: false,
      },
    })

    this.renderer?.onAdd?.({
      host: this,
      canvasHost: this.canvasHost,
      map: this.canvasHost.getMap?.(),
      mapAdapter: this.canvasHost.getMapAdapter?.(),
      device: this.device,
      gl: this.gl,
      canvas,
    })

    this._detachRenderListener = this.canvasHost.onRenderRequest?.(() => this.invalidate()) ?? null
    this.invalidate()
    return this
  }

  detach() {
    this.destroyed = true
    if (this.frameHandle) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = 0
    }

    this._detachRenderListener?.()
    this._detachRenderListener = null

    this.renderer?.onRemove?.({
      host: this,
      canvasHost: this.canvasHost,
      map: this.canvasHost.getMap?.(),
      mapAdapter: this.canvasHost.getMapAdapter?.(),
      device: this.device,
      gl: this.gl,
      canvas: this.canvasHost.getCanvas?.(),
    })

    this.device?.destroy()
    this.device = null
    this.gl = null
    this.canvasHost.detach()
    return this
  }

  setRenderer(renderer) {
    if (this.renderer === renderer) {
      return this
    }

    this.renderer?.onRemove?.({
      host: this,
      canvasHost: this.canvasHost,
      map: this.canvasHost.getMap?.(),
      mapAdapter: this.canvasHost.getMapAdapter?.(),
      device: this.device,
      gl: this.gl,
      canvas: this.canvasHost.getCanvas?.(),
    })

    this.renderer = renderer

    if (this.device && this.renderer) {
      this.renderer.onAdd?.({
        host: this,
        canvasHost: this.canvasHost,
        map: this.canvasHost.getMap?.(),
        mapAdapter: this.canvasHost.getMapAdapter?.(),
        device: this.device,
        gl: this.gl,
        canvas: this.canvasHost.getCanvas?.(),
      })
      this.invalidate()
    }

    return this
  }

  invalidate() {
    if (this.destroyed || this.frameHandle) {
      return
    }

    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = 0
      this._draw()
    })
  }

  beginRenderPass(props = {}) {
    return this.device.beginRenderPass({
      id: props.id ?? 'canvas-overlay-renderer-pass',
      clearColor: props.clearColor ?? [0, 0, 0, 0],
      clearDepth: props.clearDepth ?? false,
      clearStencil: props.clearStencil ?? false,
      parameters: props.parameters,
    })
  }

  getFrame() {
    const mapAdapter = this.canvasHost.getMapAdapter?.()
    const size = mapAdapter?.getSize?.() ?? { width: 1, height: 1 }
    const devicePixelRatio = globalThis.devicePixelRatio || 1

    return {
      host: this,
      canvasHost: this.canvasHost,
      map: this.canvasHost.getMap?.(),
      mapAdapter,
      device: this.device,
      gl: this.gl,
      canvas: this.canvasHost.getCanvas?.(),
      viewState: mapAdapter?.getViewState?.(),
      size,
      devicePixelRatio,
      project: (position) => mapAdapter?.project?.(position),
      unproject: (point) => mapAdapter?.unproject?.(point),
      beginRenderPass: (props) => this.beginRenderPass(props),
    }
  }

  _draw() {
    if (this.destroyed || !this.device || !this.renderer) {
      return
    }

    this.canvasHost.syncCanvasSize?.()
    this.renderer.render?.(this.getFrame())
  }
}
