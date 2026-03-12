import * as maplibregl from 'maplibre-gl'

const DEFAULT_EVENTS = ['load', 'move', 'zoom', 'rotate', 'pitch', 'resize']

function toRadians(degrees) {
  return (Number(degrees ?? 0) * Math.PI) / 180
}

function getViewportSize(map) {
  const container = map?.getContainer?.()
  return {
    width: Math.max(1, Number(container?.clientWidth ?? 1)),
    height: Math.max(1, Number(container?.clientHeight ?? 1)),
  }
}

function getDistanceForZoom(zoom, options) {
  const baseDistance = Number(options.baseDistance ?? 2)
  return baseDistance / (2 ** Number(zoom ?? 0))
}

function rotateNorthUp(bearingRadians) {
  return [
    Math.sin(bearingRadians),
    -Math.cos(bearingRadians),
    0,
  ]
}

function createCameraState(map, options = {}) {
  const size = getViewportSize(map)
  const center = map.getCenter()
  const zoom = map.getZoom()
  const bearing = map.getBearing()
  const pitch = map.getPitch()
  const mercatorCenter = maplibregl.MercatorCoordinate.fromLngLat(center, 0)

  const bearingRadians = toRadians(bearing)
  const pitchRadians = toRadians(pitch)
  const distance = getDistanceForZoom(zoom, options)
  const horizontalDistance = distance * Math.sin(pitchRadians)
  const verticalDistance = Math.max(distance * Math.cos(pitchRadians), 1e-6)

  const target = [mercatorCenter.x, mercatorCenter.y, mercatorCenter.z]
  const position = [
    target[0] + (horizontalDistance * Math.sin(bearingRadians)),
    target[1] + (horizontalDistance * Math.cos(bearingRadians)),
    target[2] + verticalDistance,
  ]

  return {
    center: {
      lng: Number(center.lng),
      lat: Number(center.lat),
    },
    zoom: Number(zoom),
    bearing: Number(bearing),
    pitch: Number(pitch),
    viewport: size,
    mercatorCenter: target,
    camera: {
      position,
      target,
      up: rotateNorthUp(bearingRadians),
      fov: toRadians(options.fovDeg ?? 45),
      near: Number(options.near ?? 0.000001),
      far: Number(options.far ?? 10),
    },
  }
}

export class MapLibreCameraSync {
  constructor(options = {}) {
    const {
      map,
      cameraService,
      eventNames = DEFAULT_EVENTS,
      onUpdate = null,
      ...cameraOptions
    } = options

    if (!map) {
      throw new Error('MapLibreCameraSync: map is required.')
    }
    if (!cameraService) {
      throw new Error('MapLibreCameraSync: cameraService is required.')
    }

    this.map = map
    this.cameraService = cameraService
    this.eventNames = eventNames
    this.onUpdate = onUpdate
    this.cameraOptions = cameraOptions
    this.lastState = null
    this._boundSync = this.sync.bind(this)
  }

  attach() {
    this.eventNames.forEach((eventName) => {
      this.map.on(eventName, this._boundSync)
    })
    this.sync()
    return this
  }

  detach() {
    this.eventNames.forEach((eventName) => {
      this.map.off(eventName, this._boundSync)
    })
    return this
  }

  sync() {
    const state = createCameraState(this.map, this.cameraOptions)

    this.cameraService
      .setViewport(state.viewport)
      .setPerspective({
        fov: state.camera.fov,
        aspect: state.viewport.width / state.viewport.height,
        near: state.camera.near,
        far: state.camera.far,
      })
      .lookAt({
        position: state.camera.position,
        target: state.camera.target,
        up: state.camera.up,
      })

    this.lastState = state
    this.onUpdate?.(state)
    return state
  }

  getState() {
    return this.lastState
  }
}

export { createCameraState as createMapLibreCameraState }
