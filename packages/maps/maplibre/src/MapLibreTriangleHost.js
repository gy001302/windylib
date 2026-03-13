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

function assignIfDefined(target, key, value) {
  if (value !== undefined) {
    target[key] = value
  }
}

function createLayerProps(id, projectPosition, layerProps) {
  const props = {
    id,
    vertices: layerProps.vertices,
    color: layerProps.color,
    projectPosition,
    invertEnabled: layerProps.invertEnabled,
  }

  assignIfDefined(props, 'vertexShader', layerProps.vertexShader)
  assignIfDefined(props, 'fragmentShader', layerProps.fragmentShader)
  assignIfDefined(props, 'onShaderStateChange', layerProps.onShaderStateChange)
  assignIfDefined(props, 'onPassStateChange', layerProps.onPassStateChange)
  assignIfDefined(props, 'onLifecycleStateChange', layerProps.onLifecycleStateChange)

  return props
}

function toInternalProps(userProps = {}) {
  const internalProps = {
    vertices: userProps.vertices,
    zoom: userProps.zoom,
    color: normalizeColor(userProps.color, userProps.alpha),
    invertEnabled: Boolean(userProps.invertEnabled),
  }

  assignIfDefined(internalProps, 'vertexShader', userProps.vertexShader)
  assignIfDefined(internalProps, 'fragmentShader', userProps.fragmentShader)
  assignIfDefined(internalProps, 'onShaderStateChange', userProps.onShaderStateChange)
  assignIfDefined(internalProps, 'onPassStateChange', userProps.onPassStateChange)
  assignIfDefined(internalProps, 'onLifecycleStateChange', userProps.onLifecycleStateChange)

  return internalProps
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
      map: userProps.map,
      mapAdapter: userProps.mapAdapter,
      projection: userProps.projection,
      initialProps: internalProps,
      createLayer: (layerProps) => new layerClass(
        createLayerProps(id, projectPosition, layerProps),
      ),
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
