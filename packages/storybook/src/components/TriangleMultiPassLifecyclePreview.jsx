import { useMemo, useState } from 'react'
import { MapLibreTriangleMap } from './MapLibreTriangleMap'

function formatState(state) {
  return JSON.stringify(state, null, 2)
}

export function TriangleMultiPassLifecyclePreview(props) {
  const [lifecycleEvents, setLifecycleEvents] = useState([])
  const [shaderState, setShaderState] = useState(null)
  const [passState, setPassState] = useState(null)

  const handlers = useMemo(() => ({
    onLifecycleStateChange: (event) => {
      setLifecycleEvents((current) => [event, ...current].slice(0, 8))
    },
    onShaderStateChange: (event) => {
      setShaderState(event)
    },
    onPassStateChange: (event) => {
      setPassState(event)
    },
  }), [])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 360px',
        minHeight: '100vh',
      }}
    >
      <MapLibreTriangleMap
        vertices={props.vertices}
        zoom={props.zoom}
        color={props.color}
        alpha={props.alpha}
        invertEnabled={props.invertEnabled}
        vertexShader={props.vertexShader}
        fragmentShader={props.fragmentShader}
        onLifecycleStateChange={handlers.onLifecycleStateChange}
        onShaderStateChange={handlers.onShaderStateChange}
        onPassStateChange={handlers.onPassStateChange}
      />
      <aside
        style={{
          borderLeft: '1px solid #d7d3c8',
          background: '#f5f1e8',
          color: '#1f1a14',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          padding: '16px',
          overflow: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '14px' }}>Lifecycle</h3>
        <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatState(lifecycleEvents)}
        </pre>
        <h3 style={{ margin: '20px 0 12px', fontSize: '14px' }}>Shader</h3>
        <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatState(shaderState)}
        </pre>
        <h3 style={{ margin: '20px 0 12px', fontSize: '14px' }}>Pass</h3>
        <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {formatState(passState)}
        </pre>
      </aside>
    </div>
  )
}
