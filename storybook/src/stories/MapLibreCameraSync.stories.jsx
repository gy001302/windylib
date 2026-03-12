import { MapLibreCameraSyncPreview } from '../components/MapLibreCameraSyncPreview'

const meta = {
  title: 'Foundations/MapLibreCameraSync',
  component: MapLibreCameraSyncPreview,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    centerLng: 116.38,
    centerLat: 39.9,
    zoom: 4.2,
    pitch: 0,
    bearing: 0,
    fovDeg: 45,
    near: 0.000001,
    far: 10,
  },
  argTypes: {
    centerLng: { control: { type: 'range', min: 73, max: 135, step: 0.01 } },
    centerLat: { control: { type: 'range', min: 18, max: 54, step: 0.01 } },
    zoom: { control: { type: 'range', min: 1, max: 18, step: 0.1 } },
    pitch: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    bearing: { control: { type: 'range', min: -180, max: 180, step: 1 } },
    fovDeg: { control: { type: 'range', min: 10, max: 80, step: 1 } },
    near: { control: { type: 'range', min: 0.000001, max: 1, step: 0.000001 } },
    far: { control: { type: 'range', min: 1, max: 50, step: 0.1 } },
  },
}

export default meta

export const Default = {}
