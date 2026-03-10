import { createMapAdapter, DEFAULT_EVENT_NAMES } from '../mapAdapter'

const LEAFLET_EVENT_NAMES = [
  ...DEFAULT_EVENT_NAMES,
  'viewreset',
  'zoomanim',
]

function toLeafletLatLng(position) {
  return {
    lng: Number(position?.[0] ?? position?.lng ?? 0),
    lat: Number(position?.[1] ?? position?.lat ?? 0),
  }
}

function toLeafletPoint(point) {
  return {
    x: Number(point?.x ?? point?.[0] ?? 0),
    y: Number(point?.y ?? point?.[1] ?? 0),
  }
}

export class LeafletMapAdapter {
  constructor(map, options = {}) {
    this.map = map
    this.eventNames = options.eventNames ?? LEAFLET_EVENT_NAMES
    this._renderListeners = new Set()
    this._baseAdapter = createMapAdapter(map, {
      eventNames: this.eventNames,
    })
  }

  on(eventName, handler) {
    this._baseAdapter.on(eventName, handler)
  }

  off(eventName, handler) {
    this._baseAdapter.off(eventName, handler)
  }

  getBounds() {
    return this._baseAdapter.getBounds()
  }

  getViewState() {
    return this._baseAdapter.getViewState()
  }

  getSize() {
    return this._baseAdapter.getSize()
  }

  getProjectionType() {
    return 'mercator'
  }

  getHostKind() {
    return 'overlay-canvas'
  }

  supportsSharedCanvas() {
    return false
  }

  project(position) {
    const point = this.map.latLngToContainerPoint(toLeafletLatLng(position))
    return {
      x: Number(point?.x ?? 0),
      y: Number(point?.y ?? 0),
    }
  }

  unproject(point) {
    const latLng = this.map.containerPointToLatLng(toLeafletPoint(point))
    return {
      lng: Number(latLng?.lng ?? 0),
      lat: Number(latLng?.lat ?? 0),
    }
  }

  requestRender() {
    this._renderListeners.forEach((listener) => listener())
  }

  onRenderRequest(listener) {
    this._renderListeners.add(listener)
    return () => {
      this._renderListeners.delete(listener)
    }
  }
}

export { LEAFLET_EVENT_NAMES }
