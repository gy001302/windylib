import './app.css'
import '../packages/maps/maplibre/node_modules/maplibre-gl/dist/maplibre-gl.css'

import { TriangleMultiPassLayer } from '../packages/layers/src/index.js'
import {
  MapLibreLayerHost,
  createMapLibreMercatorProjector,
  toColorArray,
} from '../packages/maps/maplibre/src/index.js'

const initialState = {
  vertices: [
    [116.38, 39.9, 1],
    [121.47, 31.23, 1],
    [113.26, 23.13, 1],
  ],
  zoom: 4.2,
  color: '#ff6f3c',
  alpha: 0.86,
  invertEnabled: false,
}

document.querySelector('#app').innerHTML = `
  <main class="demo-shell">
    <section class="demo-panel">
      <p class="eyebrow">windylib / esm test</p>
      <h1>MapLibre Triangle</h1>
      <p class="summary">
        Root Vite page using ESM imports from workspace source. The map below renders a triangle through
        \`MapLibreLayerHost + TriangleMultiPassLayer\`.
      </p>

      <label class="control">
        <span>Color</span>
        <input id="color-input" type="color" value="${initialState.color}" />
      </label>

      <label class="control">
        <span>Alpha</span>
        <input id="alpha-input" type="range" min="0" max="1" step="0.01" value="${initialState.alpha}" />
      </label>

      <label class="control checkbox">
        <input id="invert-input" type="checkbox" ${initialState.invertEnabled ? 'checked' : ''} />
        <span>Invert</span>
      </label>

      <pre class="code-block">window.wl build: pnpm run build:window
dev page: pnpm dev</pre>
    </section>

    <section class="map-frame">
      <div id="map-root" class="map-root"></div>
    </section>
  </main>
`

const mapContainer = document.querySelector('#map-root')
const colorInput = document.querySelector('#color-input')
const alphaInput = document.querySelector('#alpha-input')
const invertInput = document.querySelector('#invert-input')

const projector = createMapLibreMercatorProjector()

const mapHost = new MapLibreLayerHost({
  container: mapContainer,
  initialProps: {
    vertices: initialState.vertices,
    zoom: initialState.zoom,
    color: toColorArray(initialState.color, initialState.alpha),
    invertEnabled: initialState.invertEnabled,
    vertexShader: TriangleMultiPassLayer.defaultVertexShader,
    fragmentShader: TriangleMultiPassLayer.defaultFragmentShader,
  },
  createLayer: (layerProps) => new TriangleMultiPassLayer({
    id: 'root-esm-triangle',
    vertices: layerProps.vertices,
    color: layerProps.color,
    projectPosition: projector,
    invertEnabled: layerProps.invertEnabled,
    vertexShader: layerProps.vertexShader,
    fragmentShader: layerProps.fragmentShader,
  }),
})

mapHost.attach()

function syncProps() {
  mapHost.setProps({
    vertices: initialState.vertices,
    zoom: initialState.zoom,
    color: toColorArray(initialState.color, initialState.alpha),
    invertEnabled: initialState.invertEnabled,
    vertexShader: TriangleMultiPassLayer.defaultVertexShader,
    fragmentShader: TriangleMultiPassLayer.defaultFragmentShader,
  })
}

colorInput.addEventListener('input', (event) => {
  initialState.color = event.currentTarget.value
  syncProps()
})

alphaInput.addEventListener('input', (event) => {
  initialState.alpha = Number(event.currentTarget.value)
  syncProps()
})

invertInput.addEventListener('change', (event) => {
  initialState.invertEnabled = event.currentTarget.checked
  syncProps()
})
