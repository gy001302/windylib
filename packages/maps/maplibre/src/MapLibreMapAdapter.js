function normalizeSize(map) {
  const container = map?.getContainer?.()

  return {
    width: Math.max(1, Number(container?.clientWidth ?? 1)),
    height: Math.max(1, Number(container?.clientHeight ?? 1)),
  }
}

function normalizeBounds(bounds) {
  if (!bounds) {
    return null
  }

  const southWest = bounds.getSouthWest?.()
  const northEast = bounds.getNorthEast?.()

  if (!southWest || !northEast) {
    return null
  }

  return {
    west: Number(southWest.lng),
    south: Number(southWest.lat),
    east: Number(northEast.lng),
    north: Number(northEast.lat),
  }
}

export class MapLibreMapAdapter {
  constructor(map, options = {}) {
    if (!map) {
      throw new Error('MapLibreMapAdapter: map is required.')
    }

    this.map = map
    this.eventNames = options.eventNames ?? ['load', 'move', 'zoom', 'rotate', 'pitch', 'resize']
  }

  on(eventName, handler) {
    this.map.on(eventName, handler)
  }

  off(eventName, handler) {
    this.map.off(eventName, handler)
  }

  getBounds() {
    return normalizeBounds(this.map.getBounds?.())
  }

  getViewState() {
    const center = this.map.getCenter?.()
    const size = normalizeSize(this.map)

    return {
      longitude: Number(center?.lng ?? 0),
      latitude: Number(center?.lat ?? 0),
      zoom: Number(this.map.getZoom?.() ?? 0),
      bearing: Number(this.map.getBearing?.() ?? 0),
      pitch: Number(this.map.getPitch?.() ?? 0),
      width: size.width,
      height: size.height,
    }
  }

  getSize() {
    return normalizeSize(this.map)
  }

  getProjectionType() {
    return 'mercator'
  }

  getHostKind() {
    return 'shared-webgl'
  }

  supportsSharedCanvas() {
    return true
  }
}
