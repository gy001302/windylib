import { LeafletTriangleMap } from '../components/LeafletTriangleMap'
import { cityTriangleVertices } from './constants'

const meta = {
  title: 'Maps/Leaflet Triangle',
  component: LeafletTriangleMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    vertices: cityTriangleVertices,
    zoom: 5,
    color: '#ff6f3c',
    alpha: 0.86,
    invertEnabled: false,
  },
  argTypes: {
    vertices: { control: 'object' },
    zoom: { control: { type: 'range', min: 1, max: 12, step: 0.1 } },
    color: { control: 'color' },
    alpha: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    invertEnabled: { control: 'boolean' },
  },
}

export default meta

export const Default = {
  render: (args) => (
    <LeafletTriangleMap
      vertices={args.vertices}
      zoom={args.zoom}
      color={args.color}
      alpha={args.alpha}
      invertEnabled={args.invertEnabled}
    />
  ),
}
