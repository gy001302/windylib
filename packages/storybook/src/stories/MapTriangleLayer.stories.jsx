import { MapTriangleLayerMap } from '../components/MapTriangleLayerMap'

const cityTriangleVertices = [
  [116.38, 39.9, 1],
  [121.47, 31.23, 1],
  [113.26, 23.13, 1],
]

const meta = {
  title: 'Maps/MapTriangleLayer',
  component: MapTriangleLayerMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    vertices: cityTriangleVertices,
    zoom: 4.2,
    color: '#ff6f3c',
    alpha: 0.86,
  },
  argTypes: {
    vertices: { control: 'object' },
    color: { control: 'color' },
    alpha: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    zoom: { control: { type: 'range', min: 1, max: 12, step: 0.1 } },
  },
}

export default meta

export const Default = {
  render: (args) => (
    <MapTriangleLayerMap
      vertices={args.vertices}
      zoom={args.zoom}
      color={args.color}
      alpha={args.alpha}
    />
  ),
}
