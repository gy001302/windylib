import { MapHost } from '../../shared/MapHost'
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

export class LeafletCanvasHost extends MapHost {
  constructor(options = {}) {
    super(options)
    const {
      map,
      mapAdapter,
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
    this.pane = pane
    this.className = className
    this.antialias = antialias
    this.preserveDrawingBuffer = preserveDrawingBuffer
    this.canvas = null
    this.hostElement = null
    this.destroyed = false
    this._boundRenderRequest = this.requestRender.bind(this)
    this._renderListeners = new Set()
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
    this.syncCanvasSize()

    this.mapAdapter.eventNames.forEach((eventName) => {
      this.map.on(eventName, this._boundRenderRequest)
    })
    return this
  }

  detach() {
    this.destroyed = true

    this.mapAdapter.eventNames.forEach((eventName) => {
      this.map.off(eventName, this._boundRenderRequest)
    })

    if (this.canvas?.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    this.canvas = null
    this.hostElement = null
    return this
  }

  onPropsChange() {
    this.requestRender()
  }

  requestRender() {
    this._renderListeners.forEach((listener) => listener())
  }

  getMap() {
    return this.map
  }

  getMapAdapter() {
    return this.mapAdapter
  }

  getHostKind() {
    return 'overlay-canvas'
  }

  supportsSharedCanvas() {
    return false
  }

  getCanvas() {
    return this.canvas
  }

  onRenderRequest(listener) {
    this._renderListeners.add(listener)
    return () => {
      this._renderListeners.delete(listener)
    }
  }

  syncCanvasSize() {
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
}
