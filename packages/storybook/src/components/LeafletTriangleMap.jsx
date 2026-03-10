import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// eslint-disable-next-line import/no-unresolved
import { LeafletCanvasHost, LeafletMapAdapter, LeafletTriangleRenderer } from '@windylib/maps'

function getMapCenter(vertices) {
  if (!Array.isArray(vertices) || !vertices.length) {
    return [0, 0]
  }

  const sums = vertices.reduce((result, vertex) => [
    result[0] + Number(vertex[0] ?? 0),
    result[1] + Number(vertex[1] ?? 0),
  ], [0, 0])

  return [
    sums[1] / vertices.length,
    sums[0] / vertices.length,
  ]
}

function toColorArray(hex, alpha) {
  const raw = hex.replace('#', '')
  const value = Number.parseInt(raw, 16)
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
    Math.round(alpha * 255),
  ]
}

export function LeafletTriangleMap(props) {
  const hostRef = useRef(null)
  const mapRef = useRef(null)
  const canvasHostRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    if (!hostRef.current) {
      return undefined
    }

    const map = L.map(hostRef.current, {
      center: getMapCenter(props.vertices),
      zoom: props.zoom,
      zoomControl: true,
      preferCanvas: false,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const renderer = new LeafletTriangleRenderer({
      id: 'leaflet-triangle-renderer',
      vertices: props.vertices,
      color: toColorArray(props.color, props.alpha),
      subdivisionSteps: 24,
    })

    const canvasHost = new LeafletCanvasHost({
      map,
      mapAdapter: new LeafletMapAdapter(map),
      renderer,
    })

    mapRef.current = map
    rendererRef.current = renderer
    canvasHostRef.current = canvasHost

    let disposed = false

    const attachHost = async () => {
      await canvasHost.attach()
      if (disposed) {
        canvasHost.detach()
      }
    }

    attachHost()

    return () => {
      disposed = true
      canvasHost.detach()
      map.remove()
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setProps({
      vertices: props.vertices,
      color: toColorArray(props.color, props.alpha),
      subdivisionSteps: 24,
    })
    canvasHostRef.current?.invalidate()
  }, [props.alpha, props.color, props.vertices])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    mapRef.current.setView(getMapCenter(props.vertices), props.zoom, {
      animate: false,
    })
    canvasHostRef.current?.invalidate()
  }, [props.vertices, props.zoom])

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
