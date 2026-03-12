import { SimpleCameraPreview } from '../components/SimpleCameraPreview'

const meta = {
  title: 'Foundations/SimpleCamera',
  component: SimpleCameraPreview,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    width: 800,
    height: 600,
    fovDeg: 45,
    near: 0.1,
    far: 1000,
    positionX: 0,
    positionY: 0,
    positionZ: 5,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    pointX: 1,
    pointY: 1,
    pointZ: 0,
    jitterX: 0,
    jitterY: 0,
  },
  argTypes: {
    width: { control: { type: 'range', min: 200, max: 1600, step: 10 } },
    height: { control: { type: 'range', min: 200, max: 1200, step: 10 } },
    fovDeg: { control: { type: 'range', min: 10, max: 120, step: 1 } },
    near: { control: { type: 'range', min: 0.01, max: 10, step: 0.01 } },
    far: { control: { type: 'range', min: 10, max: 5000, step: 10 } },
    positionX: { control: { type: 'range', min: -20, max: 20, step: 0.1 } },
    positionY: { control: { type: 'range', min: -20, max: 20, step: 0.1 } },
    positionZ: { control: { type: 'range', min: 0.1, max: 20, step: 0.1 } },
    targetX: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    targetY: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    targetZ: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    pointX: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    pointY: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    pointZ: { control: { type: 'range', min: -10, max: 10, step: 0.1 } },
    jitterX: { control: { type: 'range', min: -0.1, max: 0.1, step: 0.001 } },
    jitterY: { control: { type: 'range', min: -0.1, max: 0.1, step: 0.001 } },
  },
}

export default meta

export const Default = {}
