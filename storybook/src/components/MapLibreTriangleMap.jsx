import { useEffect, useRef } from 'react'
import {
  MapLibreTriangleHost,
} from '@windylib/maps-maplibre'

export function MapLibreTriangleMap(props) {
  const hostRef = useRef(null)
  const mapHostRef = useRef(null)

  useEffect(() => {
    if (!hostRef.current) {
      return undefined
    }

    const mapHost = new MapLibreTriangleHost({
      container: hostRef.current,
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
