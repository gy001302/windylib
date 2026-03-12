import maplibregl from 'maplibre-gl'
import { MapHost } from '../../shared/MapHost'
import { getMapCenter } from './utils'

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json'

export class MapLibreLayerHost extends MapHost {
  constructor(options = {}) {
    super(options)
    const {
      container,
      createLayer,
      style = DEFAULT_STYLE,
      projection = 'globe',
      controls = true,
    } = options

    if (!container) {
      throw new Error('MapLibreLayerHost: container is required.')
    }
    this.container = container
    this.createLayer = typeof createLayer === 'function' ? createLayer : null
    this.style = style
    this.projection = projection
    this.controls = controls
    this.map = null
    this.layer = null
  }

  attach() {
    if (this.map) {
      return this
    }

    this.map = new maplibregl.Map({
      container: this.container,
      style: this.style,
      center: getMapCenter(this.props.vertices),
      zoom: this.props.zoom,
      canvasContextAttributes: { antialias: true },
      pitch: 0,
      bearing: 0,
    })

    if (this.controls) {
      this.map.addControl(new maplibregl.NavigationControl(), 'top-left')
      this.map.addControl(new maplibregl.GlobeControl(), 'top-left')
    }

    this.layer = this.createLayer?.(this.props) ?? null

    this.map.on('style.load', () => {
      this.map?.setProjection({ type: this.projection })
    })

    this.map.on('load', () => {
      if (this.layer) {
        this.map?.addLayer(this.layer)
      }
    })

    return this
  }

  detach() {
    this.map?.remove()
    this.map = null
    this.layer = null
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
    this.map?.triggerRepaint()
  }

  getMap() {
    return this.map
  }

  getMapAdapter() {
    return null
  }

  getHostKind() {
    return 'shared-webgl'
  }

  supportsSharedCanvas() {
    return true
  }
}
