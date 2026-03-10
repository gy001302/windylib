import { WebMercatorViewport } from 'deck.gl'
import { DEFAULT_EVENT_NAMES } from './mapAdapter'

function clampSize(size) {
  return {
    width: Math.max(1, Number(size?.width ?? 1)),
    height: Math.max(1, Number(size?.height ?? 1)),
  }
}

export class DeckViewAdapter {
  constructor(options = {}) {
    this.eventNames = options.eventNames ?? DEFAULT_EVENT_NAMES
    this._handlers = new Map()
    this._size = clampSize(options.size)
    this._viewState = {
      longitude: Number(options.viewState?.longitude ?? 0),
      latitude: Number(options.viewState?.latitude ?? 0),
      zoom: Number(options.viewState?.zoom ?? 0),
      bearing: Number(options.viewState?.bearing ?? 0),
      pitch: Number(options.viewState?.pitch ?? 0),
    }
  }

  on(eventName, handler) {
    const handlers = this._handlers.get(eventName) ?? new Set()
    handlers.add(handler)
    this._handlers.set(eventName, handlers)
  }

  off(eventName, handler) {
    this._handlers.get(eventName)?.delete(handler)
  }

  emit(eventName, payload = {}) {
    const event = { type: eventName, ...payload }
    this._handlers.get(eventName)?.forEach((handler) => handler(event))
  }

  update(viewState, size) {
    const prevViewState = this._viewState
    const prevSize = this._size

    this._viewState = {
      longitude: Number(viewState?.longitude ?? prevViewState.longitude),
      latitude: Number(viewState?.latitude ?? prevViewState.latitude),
      zoom: Number(viewState?.zoom ?? prevViewState.zoom),
      bearing: Number(viewState?.bearing ?? prevViewState.bearing),
      pitch: Number(viewState?.pitch ?? prevViewState.pitch),
    }
    this._size = clampSize(size ?? prevSize)

    const moved = (
      this._viewState.longitude !== prevViewState.longitude ||
      this._viewState.latitude !== prevViewState.latitude
    )
    const zoomed = this._viewState.zoom !== prevViewState.zoom
    const resized = (
      this._size.width !== prevSize.width ||
      this._size.height !== prevSize.height
    )

    if (moved) {
      this.emit('move')
      this.emit('moveend')
    }
    if (zoomed) {
      this.emit('zoom')
      this.emit('zoomend')
    }
    if (resized) {
      this.emit('resize')
    }
  }

  getViewState() {
    return {
      ...this._viewState,
      width: this._size.width,
      height: this._size.height,
    }
  }

  getSize() {
    return { ...this._size }
  }

  getBounds() {
    const viewport = new WebMercatorViewport({
      ...this._viewState,
      width: this._size.width,
      height: this._size.height,
    })
    const bounds = viewport.getBounds()
    let west
    let south
    let east
    let north

    // deck.gl versions may return either [[west, south], [east, north]]
    // or [west, south, east, north].
    if (
      Array.isArray(bounds) &&
      bounds.length === 2 &&
      Array.isArray(bounds[0]) &&
      Array.isArray(bounds[1])
    ) {
      west = Number(bounds[0][0])
      south = Number(bounds[0][1])
      east = Number(bounds[1][0])
      north = Number(bounds[1][1])
    } else if (Array.isArray(bounds) && bounds.length >= 4) {
      west = Number(bounds[0])
      south = Number(bounds[1])
      east = Number(bounds[2])
      north = Number(bounds[3])
    } else {
      throw new Error(`DeckViewAdapter.getBounds: unexpected bounds format: ${JSON.stringify(bounds)}`)
    }

    return { west, south, east, north }
  }
}
