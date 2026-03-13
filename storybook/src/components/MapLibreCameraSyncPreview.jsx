import { useEffect, useState, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { SimpleCameraService } from '@windylib/core'
import { MapLibreCameraSync, MapLibreLayerHost } from '@windylib/maps-maplibre'

function formatJson(value) {
  return JSON.stringify(value, null, 2)
}

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json'

export function MapLibreCameraSyncPreview(props) {
  const hostRef = useRef(null)
  const mapHostRef = useRef(null)
  const cameraSyncRef = useRef(null)
  const [cameraState, setCameraState] = useState({})

  useEffect(() => {
    if (!hostRef.current) {
      return undefined
    }

    const cameraService = new SimpleCameraService()
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: DEFAULT_STYLE,
      center: [props.centerLng, props.centerLat],
      zoom: props.zoom,
      canvasContextAttributes: { antialias: true },
      pitch: props.pitch,
      bearing: props.bearing,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.GlobeControl(), 'top-left')

    const mapHost = new MapLibreLayerHost({
      map,
      initialProps: {
        vertices: [
          [props.centerLng, props.centerLat, 0],
        ],
        zoom: props.zoom,
      },
      createLayer: () => null,
    })

    mapHost.attach()
    mapHostRef.current = mapHost

    const sync = new MapLibreCameraSync({
      map: mapHost.map,
      cameraService,
      fovDeg: props.fovDeg,
      near: props.near,
      far: props.far,
      onUpdate(nextState) {
        setCameraState({
          map: {
            center: nextState.center,
            zoom: Number(nextState.zoom.toFixed(3)),
            pitch: Number(nextState.pitch.toFixed(3)),
            bearing: Number(nextState.bearing.toFixed(3)),
            viewport: nextState.viewport,
          },
          camera: {
            position: cameraService.getCameraPosition().map((value) => Number(value.toFixed(6))),
            target: nextState.camera.target.map((value) => Number(value.toFixed(6))),
            up: nextState.camera.up.map((value) => Number(value.toFixed(6))),
          },
        })
      },
    })

    sync.attach()
    cameraSyncRef.current = sync

    mapHost.map.jumpTo({
      center: [props.centerLng, props.centerLat],
      zoom: props.zoom,
      pitch: props.pitch,
      bearing: props.bearing,
    })

    return () => {
      sync.detach()
      mapHost.detach()
      map.remove()
    }
  }, [])

  useEffect(() => {
    if (!mapHostRef.current?.map) {
      return
    }

    mapHostRef.current.map.jumpTo({
      center: [props.centerLng, props.centerLat],
      zoom: props.zoom,
      pitch: props.pitch,
      bearing: props.bearing,
    })

    cameraSyncRef.current?.sync()
  }, [
    props.bearing,
    props.centerLat,
    props.centerLng,
    props.far,
    props.fovDeg,
    props.near,
    props.pitch,
    props.zoom,
  ])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(320px, 380px) 1fr',
      width: '100%',
      minHeight: '100vh',
    }}
    >
      <div style={{
        padding: '20px',
        boxSizing: 'border-box',
        background: '#101820',
        color: '#f5f7fa',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
      >
        <div style={{ marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>
          MapLibre Camera Sync
        </div>
        <pre style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {formatJson(cameraState)}
        </pre>
      </div>

      <div
        ref={hostRef}
        style={{
          width: '100%',
          height: '100vh',
        }}
      />
    </div>
  )
}
