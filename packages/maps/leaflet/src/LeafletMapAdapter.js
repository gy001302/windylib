const DEFAULT_EVENT_NAMES = [
  'load',
  'move',
  'moveend',
  'zoom',
  'zoomend',
  'rotate',
  'pitch',
  'resize',
]

function getValue(source, key, fallback) {
  const candidate = source?.[key]
  if (typeof candidate === 'function') {
    return candidate.call(source)
  }
  return candidate ?? fallback
}

function normalizeSize(size, map) {
  if (Array.isArray(size) && size.length >= 2) {
    return { width: Number(size[0]), height: Number(size[1]) }
  }

  if (size && typeof size === 'object') {
    const width = size.width ?? size.x
    const height = size.height ?? size.y
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width: Number(width), height: Number(height) }
    }
  }

  const container = map?.getContainer?.()
  return {
    width: container?.clientWidth ?? 0,
    height: container?.clientHeight ?? 0,
  }
}

function normalizeBounds(boundsLike) {
  if (!boundsLike) {
    return null
  }

  if (typeof boundsLike.toArray === 'function') {
    const raw = boundsLike.toArray()
    if (Array.isArray(raw) && raw.length === 2) {
      return {
        west: Number(raw[0][0]),
        south: Number(raw[0][1]),
        east: Number(raw[1][0]),
        north: Number(raw[1][1]),
      }
    }
  }

  const southWest = typeof boundsLike.getSouthWest === 'function'
    ? boundsLike.getSouthWest()
    : boundsLike._sw
  const northEast = typeof boundsLike.getNorthEast === 'function'
    ? boundsLike.getNorthEast()
    : boundsLike._ne

  if (southWest && northEast) {
    return {
      west: Number(southWest.lng ?? southWest.lon ?? southWest.x),
      south: Number(southWest.lat ?? southWest.y),
      east: Number(northEast.lng ?? northEast.lon ?? northEast.x),
      north: Number(northEast.lat ?? northEast.y),
    }
  }

  if (Array.isArray(boundsLike) && boundsLike.length === 4) {
    const [west, south, east, north] = boundsLike
    return { west: Number(west), south: Number(south), east: Number(east), north: Number(north) }
  }

  if (
    ['west', 'south', 'east', 'north'].every((key) => Number.isFinite(Number(boundsLike[key])))
  ) {
    return {
      west: Number(boundsLike.west),
      south: Number(boundsLike.south),
      east: Number(boundsLike.east),
      north: Number(boundsLike.north),
    }
  }

  return null
}

function createMapAdapter(map, options = {}) {
  const eventNames = options.eventNames ?? DEFAULT_EVENT_NAMES

  if (!map || typeof map.on !== 'function' || typeof map.off !== 'function') {
    throw new Error('createMapAdapter: map must provide on/off event methods.')
  }

  return {
    map,
    eventNames,
    on(eventName, handler) {
      map.on(eventName, handler)
    },
    off(eventName, handler) {
      map.off(eventName, handler)
    },
    getBounds() {
      return normalizeBounds(getValue(map, 'getBounds', null))
    },
    getViewState() {
      const center = getValue(map, 'getCenter', null)
      const size = normalizeSize(
        getValue(map, 'getContainer', null) ? null : getValue(map, 'getSize', null),
        map,
      )

      return {
        longitude: Number(center?.lng ?? center?.lon ?? center?.x ?? 0),
        latitude: Number(center?.lat ?? center?.y ?? 0),
        zoom: Number(getValue(map, 'getZoom', 0)),
        bearing: Number(getValue(map, 'getBearing', 0)),
        pitch: Number(getValue(map, 'getPitch', 0)),
        width: size.width,
        height: size.height,
      }
    },
    getSize() {
      return normalizeSize(getValue(map, 'getSize', null), map)
    },
  }
}

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
    const point = this.map.latLngToLayerPoint(toLeafletLatLng(position))
    return {
      x: Number(point?.x ?? 0),
      y: Number(point?.y ?? 0),
    }
  }

  unproject(point) {
    const latLng = this.map.layerPointToLatLng(toLeafletPoint(point))
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
