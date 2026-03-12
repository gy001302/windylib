import { useMemo } from 'react'
// eslint-disable-next-line import/no-unresolved
import { SimpleCameraService } from '@windylib/core'

function formatMatrix(values) {
  const rows = []
  for (let i = 0; i < values.length; i += 4) {
    rows.push(values.slice(i, i + 4).map((value) => value.toFixed(3)).join('  '))
  }
  return rows.join('\n')
}

export function SimpleCameraPreview(props) {
  const state = useMemo(() => {
    const cameraService = new SimpleCameraService({
      viewport: { width: props.width, height: props.height },
      position: [props.positionX, props.positionY, props.positionZ],
      target: [props.targetX, props.targetY, props.targetZ],
      up: [0, 1, 0],
      fov: (props.fovDeg * Math.PI) / 180,
      near: props.near,
      far: props.far,
    })

    if (props.jitterX !== 0 || props.jitterY !== 0) {
      cameraService.jitterProjectionMatrix(props.jitterX, props.jitterY)
    }

    const projectedOrigin = cameraService.project([0, 0, 0])
    const projectedPoint = cameraService.project([
      props.pointX,
      props.pointY,
      props.pointZ,
    ])

    return {
      cameraPosition: cameraService.getCameraPosition(),
      projectionMatrix: cameraService.getProjectionMatrix(),
      viewMatrix: cameraService.getViewMatrix(),
      viewProjectionMatrix: cameraService.getViewProjectionMatrix(),
      projectedOrigin,
      projectedPoint,
    }
  }, [props])

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      background: 'linear-gradient(135deg, #f4efe4 0%, #d9e6f2 100%)',
      color: '#1d2430',
      fontFamily: '"IBM Plex Mono", "Fira Code", monospace',
      boxSizing: 'border-box',
    }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 360px) 1fr',
        gap: '24px',
        alignItems: 'start',
      }}
      >
        <div style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.78)',
          border: '1px solid rgba(29, 36, 48, 0.12)',
          backdropFilter: 'blur(12px)',
        }}
        >
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>
            Camera State
          </div>
          <pre style={{ margin: '16px 0 0', fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({
              cameraPosition: state.cameraPosition.map((value) => Number(value.toFixed(3))),
              projectedOrigin: state.projectedOrigin.map((value) => Number(value.toFixed(3))),
              projectedPoint: state.projectedPoint.map((value) => Number(value.toFixed(3))),
            }, null, 2)}
          </pre>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
          >
            <div style={{ padding: '20px', background: '#0f1720', color: '#f6f7f9' }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
                View Matrix
              </div>
              <pre style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>{formatMatrix(state.viewMatrix)}</pre>
            </div>
            <div style={{ padding: '20px', background: '#0f1720', color: '#f6f7f9' }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
                Projection Matrix
              </div>
              <pre style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>{formatMatrix(state.projectionMatrix)}</pre>
            </div>
          </div>

          <div style={{ padding: '20px', background: '#0f1720', color: '#f6f7f9' }}>
            <div style={{ marginBottom: '12px', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72 }}>
              View Projection Matrix
            </div>
            <pre style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>{formatMatrix(state.viewProjectionMatrix)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
