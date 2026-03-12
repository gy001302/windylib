import { useEffect, useRef } from 'react'
import { TriangleMultiPassLayer } from '@windylib/layers'
import {
  createMapLibreMercatorProjector,
  MapLibreLayerHost,
  toColorArray,
} from '@windylib/maps-maplibre'

export function MapLibreTriangleMap(props) {
  const hostRef = useRef(null)
  const mapHostRef = useRef(null)
  const projectorRef = useRef(createMapLibreMercatorProjector())

  useEffect(() => {
    if (!hostRef.current) {
      return undefined
    }

    const mapHost = new MapLibreLayerHost({
      container: hostRef.current,
      initialProps: {
        vertices: props.vertices,
        zoom: props.zoom,
        color: toColorArray(props.color, props.alpha),
        invertEnabled: props.invertEnabled,
        vertexShader: props.vertexShader,
        fragmentShader: props.fragmentShader,
        onShaderStateChange: props.onShaderStateChange,
        onPassStateChange: props.onPassStateChange,
        onLifecycleStateChange: props.onLifecycleStateChange,
      },
      createLayer: (layerProps) => new TriangleMultiPassLayer({
        id: 'triangle-multipass-map-only',
        vertices: layerProps.vertices,
        color: layerProps.color,
        projectPosition: projectorRef.current,
        invertEnabled: layerProps.invertEnabled,
        vertexShader: layerProps.vertexShader,
        fragmentShader: layerProps.fragmentShader,
        onShaderStateChange: layerProps.onShaderStateChange,
        onPassStateChange: layerProps.onPassStateChange,
        onLifecycleStateChange: layerProps.onLifecycleStateChange,
      }),
    })
    mapHost.attach()
    mapHostRef.current = mapHost

    return () => {
      mapHost.detach()
    }
  }, [])

  useEffect(() => {
    mapHostRef.current?.setProps({
      vertices: props.vertices,
      zoom: props.zoom,
      color: toColorArray(props.color, props.alpha),
      invertEnabled: props.invertEnabled,
      vertexShader: props.vertexShader,
      fragmentShader: props.fragmentShader,
      onShaderStateChange: props.onShaderStateChange,
      onPassStateChange: props.onPassStateChange,
      onLifecycleStateChange: props.onLifecycleStateChange,
    })
  }, [
    props.alpha,
    props.color,
    props.fragmentShader,
    props.invertEnabled,
    props.onLifecycleStateChange,
    props.onPassStateChange,
    props.onShaderStateChange,
    props.vertexShader,
    props.vertices,
    props.zoom,
  ])

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        height: '100vh',
      }}
    />
  )
}
