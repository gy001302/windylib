import { MapHost } from '../../shared/MapHost'
import { MapLibreMapAdapter } from './MapLibreMapAdapter.js'
import { getMapCenter } from './utils'

export class MapLibreLayerHost extends MapHost {
  constructor(options = {}) {
    super(options)
    const {
      map,
      mapAdapter,
      createLayer,
      projection = 'globe',
    } = options

    if (!map) {
      throw new Error('MapLibreLayerHost: map is required.')
    }

    this.map = map
    this.mapAdapter = mapAdapter ?? new MapLibreMapAdapter(map)
    this.createLayer = typeof createLayer === 'function' ? createLayer : null
    this.projection = projection
    this.layer = null
    this.attached = false
    this._handleLoad = this._addLayerIfReady.bind(this)
    this._handleStyleLoad = this._syncProjectionAndLayer.bind(this)
  }

  attach() {
    if (this.attached) {
      return this
    }

    this.attached = true
    this.layer = this.createLayer?.(this.props) ?? null
    this.map.on('load', this._handleLoad)
    this.map.on('style.load', this._handleStyleLoad)

    if (this.map.isStyleLoaded?.()) {
      this._syncProjectionAndLayer()
    }

    return this
  }

  detach() {
    if (!this.attached) {
      return this
    }

    this.map.off('load', this._handleLoad)
    this.map.off('style.load', this._handleStyleLoad)
    this._removeLayer()
    this.layer = null
    this.attached = false
    return this
  }

  onPropsChange({ props, oldProps }) {
    if (!this.map) {
      return
    }

    this.layer?.setProps?.(props)

    const centerChanged = props.vertices !== oldProps.vertices
    const zoomChanged = props.zoom !== oldProps.zoom

    if (centerChanged || zoomChanged) {
      this.map.jumpTo({
        center: getMapCenter(props.vertices),
        zoom: props.zoom,
      })
    }

    this.requestRender()
  }

  requestRender() {
    this.map?.triggerRepaint?.()
  }

  getMap() {
    return this.map
  }

  getMapAdapter() {
    return this.mapAdapter
  }

  getHostKind() {
    return 'shared-webgl'
  }

  supportsSharedCanvas() {
    return true
  }

  _syncProjectionAndLayer() {
    if (!this.map) {
      return
    }

    if (this.projection && this.map.setProjection && this.map.isStyleLoaded?.()) {
      this.map.setProjection({ type: this.projection })
    }

    this._addLayerIfReady()
  }

  _addLayerIfReady() {
    if (!this.map || !this.layer || !this.map.isStyleLoaded?.()) {
      return
    }

    if (this.layer.id && this.map.getLayer?.(this.layer.id)) {
      return
    }

    this.map.addLayer(this.layer)
  }

  _removeLayer() {
    if (!this.map || !this.layer?.id || !this.map.getLayer?.(this.layer.id)) {
      return
    }

    this.map.removeLayer(this.layer.id)
  }
}
