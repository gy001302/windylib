import { describe, expect, it } from 'vitest'
import { SimpleCamera } from '../SimpleCamera.js'
import { SimpleCameraService } from '../SimpleCameraService.js'

describe('SimpleCamera', () => {
  it('projects the focal target to the viewport center', () => {
    const camera = new SimpleCamera({
      viewport: { width: 800, height: 600 },
      position: [0, 0, 5],
      target: [0, 0, 0],
    })

    const [x, y] = camera.project([0, 0, 0])

    expect(x).toBeCloseTo(400, 5)
    expect(y).toBeCloseTo(300, 5)
  })

  it('applies and clears jittered projection matrices', () => {
    const service = new SimpleCameraService({
      viewport: { width: 800, height: 600 },
      position: [0, 0, 5],
      target: [0, 0, 0],
    })

    const original = service.getProjectionMatrix()
    service.jitterProjectionMatrix(0.01, -0.02)
    const jittered = service.getProjectionMatrix()

    expect(jittered).not.toEqual(original)
    expect(jittered).toHaveLength(16)

    service.clearJitterProjectionMatrix()

    expect(service.getProjectionMatrix()).toEqual(original)
  })
})
