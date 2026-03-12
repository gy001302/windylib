import { TriangleMultiPassLayer } from '@windylib/layers'
import { MapLibreLayerHost } from './MapLibreLayerHost.js'
import {
  createMapLibreMercatorProjector,
  toColorArray,
} from './utils.js'

function normalizeColor(color, alpha) {
  if (Array.isArray(color)) {
    return color
  }

  return toColorArray(color, alpha)
}

function toInternalProps(userProps = {}) {
  return {
    vertices: userProps.vertices,
    zoom: userProps.zoom,
    color: normalizeColor(userProps.color, userProps.alpha),
    invertEnabled: Boolean(userProps.invertEnabled),
    vertexShader: userProps.vertexShader,
    fragmentShader: userProps.fragmentShader,
    onShaderStateChange: userProps.onShaderStateChange,
    onPassStateChange: userProps.onPassStateChange,
    onLifecycleStateChange: userProps.onLifecycleStateChange,
  }
}

export class MapLibreTriangleHost extends MapLibreLayerHost {
  constructor(options = {}) {
    const {
      id = 'maplibre-triangle-layer',
      projectPosition = createMapLibreMercatorProjector(),
      layerClass = TriangleMultiPassLayer,
      ...userProps
    } = options

    const internalProps = toInternalProps(userProps)

    super({
      container: userProps.container,
      style: userProps.style,
      projection: userProps.projection,
      controls: userProps.controls,
      initialProps: internalProps,
      createLayer: (layerProps) => new layerClass({
        id,
        vertices: layerProps.vertices,
        color: layerProps.color,
        projectPosition,
        invertEnabled: layerProps.invertEnabled,
        vertexShader: layerProps.vertexShader,
        fragmentShader: layerProps.fragmentShader,
        onShaderStateChange: layerProps.onShaderStateChange,
        onPassStateChange: layerProps.onPassStateChange,
        onLifecycleStateChange: layerProps.onLifecycleStateChange,
      }),
    })

    this.id = id
    this.projectPosition = projectPosition
    this.layerClass = layerClass
    this.userProps = {
      ...userProps,
      id,
    }
  }

  setProps(nextProps = {}) {
    this.userProps = {
      ...this.userProps,
      ...nextProps,
    }

    return super.setProps(toInternalProps(this.userProps))
  }
}

export function createMapLibreTriangleHost(options = {}) {
  return new MapLibreTriangleHost(options)
}
