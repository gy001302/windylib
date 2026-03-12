import { MapLibreTriangleMap } from '../components/MapLibreTriangleMap'
// eslint-disable-next-line import/no-unresolved
import { TriangleMultiPassLayer } from '@windylib/layers'
import { cityTriangleVertices } from './constants'

const meta = {
  title: 'Maps/DeckGL Triangle MultiPass',
  component: MapLibreTriangleMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    vertices: cityTriangleVertices,
    zoom: 4.2,
    color: '#ff6f3c',
    alpha: 0.86,
    invertEnabled: false,
    vertexShader: TriangleMultiPassLayer.defaultVertexShader,
    fragmentShader: TriangleMultiPassLayer.defaultFragmentShader,
  },
  argTypes: {
    vertices: { control: 'object' },
    zoom: { control: { type: 'range', min: 1, max: 12, step: 0.1 } },
    color: { control: 'color' },
    alpha: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    invertEnabled: { control: 'boolean' },
    vertexShader: { control: false },
    fragmentShader: { control: false },
  },
}

export default meta

export const Default = {
  render: (args) => (
    <MapLibreTriangleMap
      vertices={args.vertices}
      zoom={args.zoom}
      color={args.color}
      alpha={args.alpha}
      invertEnabled={args.invertEnabled}
      vertexShader={args.vertexShader}
      fragmentShader={args.fragmentShader}
    />
  ),
}

export const Invert = {
  args: {
    invertEnabled: true,
  },
}
