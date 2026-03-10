import { useEffect, useRef } from 'react'
import { MapTriangleLayer } from '@windylib/core'
import { MapLibreLayerHost, toColorArray } from '@windylib/maps'

export function MapTriangleLayerMap(props) {
  const hostRef = useRef(null)
  const mapHostRef = useRef(null)

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
      },
      createLayer: (layerProps) => new MapTriangleLayer({
        id: 'map-triangle-layer',
        vertices: layerProps.vertices,
        color: layerProps.color,
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
    })
  }, [props.alpha, props.color, props.vertices, props.zoom])

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
