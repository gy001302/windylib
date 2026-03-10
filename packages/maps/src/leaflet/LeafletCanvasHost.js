import { luma } from '@luma.gl/core'
import { webgl2Adapter } from '@luma.gl/webgl'
import { LeafletMapAdapter } from './LeafletMapAdapter'

const DEFAULT_CLASS_NAME = 'windylib-leaflet-overlay'
const DEFAULT_EVENTS = ['load', 'move', 'moveend', 'zoom', 'zoomend', 'resize', 'viewreset', 'zoomanim']

function createCanvas(className) {
  const canvas = document.createElement('canvas')
  canvas.className = className
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.pointerEvents = 'none'
  return canvas
}

export class LeafletCanvasHost {
  constructor(options = {}) {
    const {
      map,
      mapAdapter,
      renderer = null,
      pane = 'overlayPane',
      className = DEFAULT_CLASS_NAME,
      antialias = true,
      preserveDrawingBuffer = false,
      eventNames = DEFAULT_EVENTS,
    } = options

    if (!map) {
      throw new Error('LeafletCanvasHost: map is required.')
    }

    this.map = map
    this.mapAdapter = mapAdapter ?? new LeafletMapAdapter(map, { eventNames })
    this.renderer = renderer
    this.pane = pane
    this.className = className
    this.antialias = antialias
    this.preserveDrawingBuffer = preserveDrawingBuffer
    this.device = null
    this.gl = null
    this.canvas = null
    this.hostElement = null
    this.frameHandle = 0
    this.destroyed = false
    this._boundInvalidate = this.invalidate.bind(this)
    this._detachRenderListener = null
  }

  async attach() {
    if (this.canvas) {
      return this
    }

    this.hostElement = this.map.getPane?.(this.pane) ?? this.map.getPanes?.()?.overlayPane
    if (!this.hostElement) {
      throw new Error(`LeafletCanvasHost: pane "${this.pane}" not found.`)
    }

    this.canvas = createCanvas(this.className)
    this.hostElement.appendChild(this.canvas)
    this._syncCanvasSize()

    this.gl = this.canvas.getContext('webgl2', {
      antialias: this.antialias,
      alpha: true,
      preserveDrawingBuffer: this.preserveDrawingBuffer,
    })

    if (!this.gl) {
      throw new Error('LeafletCanvasHost: failed to create WebGL2 context.')
    }

    this.device = await luma.attachDevice(this.gl, {
      adapters: [webgl2Adapter],
      createCanvasContext: {
        canvas: this.canvas,
        autoResize: false,
      },
    })

    this.renderer?.onAdd?.({
      host: this,
      map: this.map,
      mapAdapter: this.mapAdapter,
      device: this.device,
      gl: this.gl,
      canvas: this.canvas,
    })

    this.mapAdapter.eventNames.forEach((eventName) => {
      this.map.on(eventName, this._boundInvalidate)
    })
    this._detachRenderListener = this.mapAdapter.onRenderRequest(() => this.invalidate())

    this.invalidate()
    return this
  }

  detach() {
    this.destroyed = true
    if (this.frameHandle) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = 0
    }

    this.mapAdapter.eventNames.forEach((eventName) => {
      this.map.off(eventName, this._boundInvalidate)
    })
    this._detachRenderListener?.()
    this._detachRenderListener = null

    this.renderer?.onRemove?.({
      host: this,
      map: this.map,
      mapAdapter: this.mapAdapter,
      device: this.device,
      gl: this.gl,
      canvas: this.canvas,
    })

    this.device?.destroy()
    this.device = null
    this.gl = null

    if (this.canvas?.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    this.canvas = null
    this.hostElement = null
    return this
  }

  setRenderer(renderer) {
    if (this.renderer === renderer) {
      return this
    }

    this.renderer?.onRemove?.({
      host: this,
      map: this.map,
      mapAdapter: this.mapAdapter,
      device: this.device,
      gl: this.gl,
      canvas: this.canvas,
    })

    this.renderer = renderer

    if (this.device && this.renderer) {
      this.renderer.onAdd?.({
        host: this,
        map: this.map,
        mapAdapter: this.mapAdapter,
        device: this.device,
        gl: this.gl,
        canvas: this.canvas,
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
      id: props.id ?? 'leaflet-canvas-host-pass',
      clearColor: props.clearColor ?? [0, 0, 0, 0],
      clearDepth: props.clearDepth ?? false,
      clearStencil: props.clearStencil ?? false,
      parameters: props.parameters,
    })
  }

  getFrame() {
    const size = this.mapAdapter.getSize()
    const devicePixelRatio = globalThis.devicePixelRatio || 1

    return {
      host: this,
      map: this.map,
      mapAdapter: this.mapAdapter,
      device: this.device,
      gl: this.gl,
      canvas: this.canvas,
      viewState: this.mapAdapter.getViewState(),
      size,
      devicePixelRatio,
      project: (position) => this.mapAdapter.project(position),
      unproject: (point) => this.mapAdapter.unproject(point),
      beginRenderPass: (props) => this.beginRenderPass(props),
    }
  }

  _syncCanvasSize() {
    if (!this.canvas) {
      return
    }

    const size = this.mapAdapter.getSize()
    const devicePixelRatio = globalThis.devicePixelRatio || 1
    const width = Math.max(1, Math.floor(size.width * devicePixelRatio))
    const height = Math.max(1, Math.floor(size.height * devicePixelRatio))

    this.canvas.width = width
    this.canvas.height = height
    this.canvas.style.width = `${size.width}px`
    this.canvas.style.height = `${size.height}px`
  }

  _draw() {
    if (this.destroyed || !this.device || !this.renderer) {
      return
    }

    this._syncCanvasSize()
    this.renderer.render?.(this.getFrame())
  }
}
