import maplibregl from 'maplibre-gl'
import { getMapCenter } from './utils'

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json'

export class MapLibreLayerHost {
  constructor(options = {}) {
    const {
      container,
      createLayer,
      initialProps = {},
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
    this.props = { ...initialProps }
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

  setProps(nextProps = {}) {
    this.props = {
      ...this.props,
      ...nextProps,
    }

    this.layer?.setProps?.(this.props)

    if (!this.map) {
      return this
    }

    this.map.jumpTo({
      center: getMapCenter(this.props.vertices),
      zoom: this.props.zoom,
    })
    this.map.triggerRepaint()

    return this
  }
}
