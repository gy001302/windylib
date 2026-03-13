import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import {
  MapLibreTriangleHost,
} from '@windylib/maps-maplibre'

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json'

function getMapCenter(vertices) {
  if (!Array.isArray(vertices) || !vertices.length) {
    return [0, 0]
  }

  const sums = vertices.reduce((result, vertex) => [
    result[0] + Number(vertex[0] ?? 0),
    result[1] + Number(vertex[1] ?? 0),
  ], [0, 0])

  return [
    sums[0] / vertices.length,
    sums[1] / vertices.length,
  ]
}

export function MapLibreTriangleMap(props) {
  const hostRef = useRef(null)
  const mapHostRef = useRef(null)

  useEffect(() => {
    if (!hostRef.current) {
      return undefined
    }

    const map = new maplibregl.Map({
      container: hostRef.current,
      style: DEFAULT_STYLE,
      center: getMapCenter(props.vertices),
      zoom: props.zoom,
      canvasContextAttributes: { antialias: true },
      pitch: 0,
      bearing: 0,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.GlobeControl(), 'top-left')

    const mapHost = new MapLibreTriangleHost({
      map,
      id: 'triangle-multipass-map-only',
      vertices: props.vertices,
      zoom: props.zoom,
      color: props.color,
      alpha: props.alpha,
      invertEnabled: props.invertEnabled,
      vertexShader: props.vertexShader,
      fragmentShader: props.fragmentShader,
      onShaderStateChange: props.onShaderStateChange,
      onPassStateChange: props.onPassStateChange,
      onLifecycleStateChange: props.onLifecycleStateChange,
    })
    mapHost.attach()
    mapHostRef.current = mapHost

    return () => {
      mapHost.detach()
      map.remove()
    }
  }, [])

  useEffect(() => {
    mapHostRef.current?.setProps({
      vertices: props.vertices,
      zoom: props.zoom,
      color: props.color,
      alpha: props.alpha,
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
