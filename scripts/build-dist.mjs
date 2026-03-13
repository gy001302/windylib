import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'

const rootDir = process.cwd()
const outputDir = path.resolve(rootDir, 'dist')
const docsPublicDir = path.resolve(rootDir, 'docs/public')
const docsExamplesDir = path.resolve(docsPublicDir, 'examples')
const docsSdkDir = path.resolve(docsPublicDir, 'sdk')

const packages = [
  {
    sourceDir: 'packages/core/dist',
    alias: 'wl-core',
    entryFile: 'index.js',
  },
  {
    sourceDir: 'packages/layers/dist',
    alias: 'wl-layers',
    entryFile: 'index.js',
  },
  {
    sourceDir: 'packages/maps/leaflet/dist',
    alias: 'wl-leaflet',
    entryFile: 'index.js',
  },
  {
    sourceDir: 'packages/maps/maplibre/dist',
    alias: 'wl-maplibre',
    entryFile: 'index.js',
  },
]

const umdEntryPath = path.resolve(outputDir, '.wl-all-entry.mjs')
const cityTriangleVertices = [
  [116.38, 39.9, 1],
  [121.47, 31.23, 1],
  [113.26, 23.13, 1],
]

function getJavaScriptFiles(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    return []
  }

  return fs.readdirSync(sourceDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .sort()
}

function stripHashSegment(baseName) {
  return baseName.replace(/-[A-Za-z0-9_-]{6,}$/, '')
}

function getOutputFileName(alias, fileName, entryFile) {
  if (fileName === entryFile) {
    return `${alias}.esm.js`
  }

  const baseName = fileName.slice(0, -3)

  if (baseName.startsWith('index-')) {
    return `${alias}.runtime.js`
  }

  return `${alias}.${stripHashSegment(baseName)}.js`
}

function rewriteLocalImports(code, fileNameMap) {
  return code.replace(/from\s+["']\.\/([^"']+)["']/g, (match, fileName) => {
    const rewrittenFileName = fileNameMap.get(fileName)
    if (!rewrittenFileName) {
      return match
    }

    return `from "./${rewrittenFileName}"`
  })
}

function toJson(value) {
  return JSON.stringify(value, null, 2)
}

function createExampleHtml({ title, head = '', body, script }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        min-height: 100%;
      }

      body {
        background: #f5f1e8;
        color: #1f1a14;
      }

      a {
        color: inherit;
      }

      .page {
        min-height: 100vh;
      }

      .nav {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(31, 26, 20, 0.12);
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(8px);
      }

      .split {
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
        min-height: calc(100vh - 61px);
      }

      .panel {
        padding: 20px;
        border-right: 1px solid rgba(31, 26, 20, 0.12);
        background: #f5f1e8;
      }

      .panel.dark {
        background: #101820;
        color: #f5f7fa;
      }

      .stage {
        min-height: calc(100vh - 61px);
      }

      .map {
        width: 100%;
        height: calc(100vh - 61px);
      }

      .map.fit {
        height: 100%;
        min-height: calc(100vh - 61px);
      }

      .field {
        display: grid;
        gap: 6px;
        margin-bottom: 14px;
      }

      .field label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.72;
      }

      .field input {
        width: 100%;
      }

      .field.checkbox {
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 10px;
      }

      .field.checkbox label {
        font-size: 14px;
        text-transform: none;
        letter-spacing: 0;
        opacity: 1;
      }

      pre {
        margin: 0;
        padding: 16px;
        background: rgba(15, 23, 32, 0.96);
        color: #f6f7f9;
        overflow: auto;
        white-space: pre-wrap;
        font: 12px/1.6 "IBM Plex Mono", "Fira Code", monospace;
      }

      .cards {
        display: grid;
        gap: 16px;
      }

      .grid {
        display: grid;
        gap: 20px;
      }

      .intro {
        max-width: 920px;
        margin: 0 auto;
        padding: 32px 20px 48px;
      }

      .intro h1 {
        margin: 0 0 12px;
        font-size: 32px;
      }

      .intro p {
        margin: 0 0 24px;
        opacity: 0.8;
      }

      .links {
        display: grid;
        gap: 14px;
      }

      .link-card {
        display: block;
        padding: 18px 20px;
        border: 1px solid rgba(31, 26, 20, 0.12);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.8);
        text-decoration: none;
      }

      .link-card strong {
        display: block;
        margin-bottom: 6px;
      }

      .small {
        font-size: 12px;
        opacity: 0.72;
      }
    </style>
    ${head}
  </head>
  <body>
    ${body}
    <script>
      (function suppressKnownLumaWarning() {
        const originalError = console.error;
        const ignoredFragment = 'This version of luma.gl has already been initialized';
        console.error = function patchedConsoleError(...args) {
          if (args.some((arg) => String(arg).includes(ignoredFragment))) {
            return;
          }
          return originalError.apply(this, args);
        };
      }());
    </script>
    <script src="../sdk/wl-all.umd.js"></script>
    <script>
${script}
    </script>
  </body>
</html>
`
}

function writeExampleFile(fileName, config) {
  fs.writeFileSync(path.resolve(docsExamplesDir, fileName), createExampleHtml(config))
}

function writeExamples() {
  fs.rmSync(docsExamplesDir, {
    recursive: true,
    force: true,
  })
  fs.mkdirSync(docsExamplesDir, {
    recursive: true,
  })

  const mapLibreSetup = `
      function createMap(container, options = {}) {
        const map = new maplibregl.Map({
          container,
          style: 'https://demotiles.maplibre.org/style.json',
          center: options.center ?? [117.03666666666668, 31.42],
          zoom: options.zoom ?? 4.2,
          canvasContextAttributes: { antialias: true },
          pitch: options.pitch ?? 0,
          bearing: options.bearing ?? 0,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-left');
        map.addControl(new maplibregl.GlobeControl(), 'top-left');
        return map;
      }
  `

  writeExampleFile('index.html', {
    title: 'WindyLib Examples',
    body: `
    <main class="page">
      <div class="intro">
        <h1>WindyLib Examples</h1>
        <p>Static HTML examples aligned with the current Storybook stories.</p>
        <div class="links">
          <a class="link-card" href="./leaflet-triangle.html">
            <strong>Maps / Leaflet Triangle</strong>
            <span class="small">TriangleMultiPassLayer on Leaflet with optional invert pass.</span>
          </a>
          <a class="link-card" href="./maplibre-triangle.html">
            <strong>Maps / MapLibre Triangle MultiPass</strong>
            <span class="small">MapLibre host with triangle rendering and invert toggle.</span>
          </a>
          <a class="link-card" href="./triangle-lifecycle.html">
            <strong>Foundations / Triangle Lifecycle</strong>
            <span class="small">Lifecycle, shader, and pass state callbacks.</span>
          </a>
          <a class="link-card" href="./simple-camera.html">
            <strong>Foundations / SimpleCamera</strong>
            <span class="small">Camera matrices and projected points.</span>
          </a>
          <a class="link-card" href="./maplibre-camera-sync.html">
            <strong>Foundations / MapLibreCameraSync</strong>
            <span class="small">Sync MapLibre view state into SimpleCameraService.</span>
          </a>
        </div>
      </div>
    </main>`,
    script: '',
  })

  writeExampleFile('leaflet-triangle.html', {
    title: 'WindyLib Example - Leaflet Triangle',
    head: `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>`,
    body: `
    <div class="page">
      <div class="nav"><a href="./index.html">Examples</a> / Maps / Leaflet Triangle</div>
      <div class="split">
        <aside class="panel">
          <div class="field">
            <label for="leaflet-zoom">Zoom</label>
            <input id="leaflet-zoom" type="range" min="1" max="12" step="0.1" value="5" />
          </div>
          <div class="field">
            <label for="leaflet-alpha">Alpha</label>
            <input id="leaflet-alpha" type="range" min="0" max="1" step="0.01" value="0.86" />
          </div>
          <div class="field">
            <label for="leaflet-color">Color</label>
            <input id="leaflet-color" type="color" value="#ff6f3c" />
          </div>
          <div class="field checkbox">
            <input id="leaflet-invert" type="checkbox" />
            <label for="leaflet-invert">Invert Pass</label>
          </div>
        </aside>
        <main class="stage">
          <div id="map" class="map"></div>
        </main>
      </div>
    </div>`,
    script: `
      const vertices = ${toJson(cityTriangleVertices)};
      const map = L.map(document.getElementById('map'), {
        center: [31.42, 117.03666666666668],
        zoom: 5,
        zoomControl: true,
        preferCanvas: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const canvasHost = new WindyLib.LeafletCanvasHost({
        map,
        mapAdapter: new WindyLib.LeafletMapAdapter(map),
      });

      function toColorArray(hex, alpha) {
        const value = Number.parseInt(String(hex).replace('#', ''), 16);
        return [
          (value >> 16) & 255,
          (value >> 8) & 255,
          value & 255,
          Math.round(Number(alpha) * 255),
        ];
      }

      const layer = new WindyLib.TriangleMultiPassLayer({
        id: 'leaflet-triangle-layer',
        vertices,
        color: toColorArray('#ff6f3c', 0.86),
        invertEnabled: false,
        subdivisionSteps: 24,
      });

      const rendererHost = new WindyLib.CanvasOverlayRendererHost({
        canvasHost,
        renderer: layer,
      });

      rendererHost.attach();

      const zoomInput = document.getElementById('leaflet-zoom');
      const alphaInput = document.getElementById('leaflet-alpha');
      const colorInput = document.getElementById('leaflet-color');
      const invertInput = document.getElementById('leaflet-invert');

      function syncLayer() {
        layer.setProps({
          vertices,
          color: toColorArray(colorInput.value, alphaInput.value),
          invertEnabled: invertInput.checked,
          subdivisionSteps: 24,
        });
        map.setView([31.42, 117.03666666666668], Number(zoomInput.value), {
          animate: false,
        });
        rendererHost.invalidate();
      }

      [zoomInput, alphaInput, colorInput, invertInput].forEach((input) => {
        input.addEventListener('input', syncLayer);
        input.addEventListener('change', syncLayer);
      });
    `,
  })

  writeExampleFile('maplibre-triangle.html', {
    title: 'WindyLib Example - MapLibre Triangle MultiPass',
    head: `
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.js"></script>`,
    body: `
    <div class="page">
      <div class="nav"><a href="./index.html">Examples</a> / Maps / MapLibre Triangle MultiPass</div>
      <div class="split">
        <aside class="panel">
          <div class="field">
            <label for="maplibre-zoom">Zoom</label>
            <input id="maplibre-zoom" type="range" min="1" max="12" step="0.1" value="4.2" />
          </div>
          <div class="field">
            <label for="maplibre-alpha">Alpha</label>
            <input id="maplibre-alpha" type="range" min="0" max="1" step="0.01" value="0.86" />
          </div>
          <div class="field">
            <label for="maplibre-color">Color</label>
            <input id="maplibre-color" type="color" value="#ff6f3c" />
          </div>
          <div class="field checkbox">
            <input id="maplibre-invert" type="checkbox" />
            <label for="maplibre-invert">Invert Pass</label>
          </div>
        </aside>
        <main class="stage">
          <div id="map" class="map"></div>
        </main>
      </div>
    </div>`,
    script: `
      ${mapLibreSetup}
      const map = createMap(document.getElementById('map'), {
        zoom: 4.2,
      });

      const host = new WindyLib.MapLibreTriangleHost({
        map,
        id: 'triangle-demo',
        vertices: ${toJson(cityTriangleVertices)},
        zoom: 4.2,
        color: '#ff6f3c',
        alpha: 0.86,
        invertEnabled: false,
      });

      host.attach();

      const zoomInput = document.getElementById('maplibre-zoom');
      const alphaInput = document.getElementById('maplibre-alpha');
      const colorInput = document.getElementById('maplibre-color');
      const invertInput = document.getElementById('maplibre-invert');

      function syncHost() {
        host.setProps({
          vertices: ${toJson(cityTriangleVertices)},
          zoom: Number(zoomInput.value),
          color: colorInput.value,
          alpha: Number(alphaInput.value),
          invertEnabled: invertInput.checked,
        });
      }

      [zoomInput, alphaInput, colorInput, invertInput].forEach((input) => {
        input.addEventListener('input', syncHost);
        input.addEventListener('change', syncHost);
      });
    `,
  })

  writeExampleFile('triangle-lifecycle.html', {
    title: 'WindyLib Example - Triangle Lifecycle',
    head: `
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.js"></script>`,
    body: `
    <div class="page">
      <div class="nav"><a href="./index.html">Examples</a> / Foundations / Triangle Lifecycle</div>
      <div class="split">
        <aside class="panel">
          <div class="field checkbox">
            <input id="lifecycle-invert" type="checkbox" checked />
            <label for="lifecycle-invert">Invert Pass</label>
          </div>
          <div class="cards">
            <div>
              <div class="small" style="margin-bottom:8px;">Lifecycle</div>
              <pre id="lifecycle-state"></pre>
            </div>
            <div>
              <div class="small" style="margin-bottom:8px;">Shader</div>
              <pre id="shader-state"></pre>
            </div>
            <div>
              <div class="small" style="margin-bottom:8px;">Pass</div>
              <pre id="pass-state"></pre>
            </div>
          </div>
        </aside>
        <main class="stage">
          <div id="map" class="map"></div>
        </main>
      </div>
    </div>`,
    script: `
      ${mapLibreSetup}
      const lifecycleEl = document.getElementById('lifecycle-state');
      const shaderEl = document.getElementById('shader-state');
      const passEl = document.getElementById('pass-state');
      const lifecycleEvents = [];

      function writeJson(element, value) {
        element.textContent = JSON.stringify(value, null, 2);
      }

      const map = createMap(document.getElementById('map'), {
        zoom: 4.2,
      });

      const host = new WindyLib.MapLibreTriangleHost({
        map,
        id: 'triangle-lifecycle-demo',
        vertices: ${toJson(cityTriangleVertices)},
        zoom: 4.2,
        color: '#ff6f3c',
        alpha: 0.86,
        invertEnabled: true,
        vertexShader: WindyLib.TriangleMultiPassLayer.defaultVertexShader,
        fragmentShader: WindyLib.TriangleMultiPassLayer.defaultFragmentShader,
        onLifecycleStateChange(event) {
          lifecycleEvents.unshift(event);
          lifecycleEvents.splice(8);
          writeJson(lifecycleEl, lifecycleEvents);
        },
        onShaderStateChange(event) {
          writeJson(shaderEl, event);
        },
        onPassStateChange(event) {
          writeJson(passEl, event);
        },
      });

      host.attach();
      writeJson(lifecycleEl, lifecycleEvents);
      writeJson(shaderEl, null);
      writeJson(passEl, null);

      document.getElementById('lifecycle-invert').addEventListener('change', (event) => {
        host.setProps({
          vertices: ${toJson(cityTriangleVertices)},
          zoom: 4.2,
          color: '#ff6f3c',
          alpha: 0.86,
          invertEnabled: event.target.checked,
          vertexShader: WindyLib.TriangleMultiPassLayer.defaultVertexShader,
          fragmentShader: WindyLib.TriangleMultiPassLayer.defaultFragmentShader,
        });
      });
    `,
  })

  writeExampleFile('simple-camera.html', {
    title: 'WindyLib Example - SimpleCamera',
    body: `
    <div class="page">
      <div class="nav"><a href="./index.html">Examples</a> / Foundations / SimpleCamera</div>
      <main style="padding:24px;">
        <div class="grid">
          <div class="cards">
            <div class="field">
              <label for="camera-z">Camera Z</label>
              <input id="camera-z" type="range" min="0.1" max="20" step="0.1" value="5" />
            </div>
            <div class="field">
              <label for="point-x">Point X</label>
              <input id="point-x" type="range" min="-10" max="10" step="0.1" value="1" />
            </div>
            <div class="field">
              <label for="point-y">Point Y</label>
              <input id="point-y" type="range" min="-10" max="10" step="0.1" value="1" />
            </div>
            <div class="field">
              <label for="jitter-x">Jitter X</label>
              <input id="jitter-x" type="range" min="-0.1" max="0.1" step="0.001" value="0" />
            </div>
            <div class="field">
              <label for="jitter-y">Jitter Y</label>
              <input id="jitter-y" type="range" min="-0.1" max="0.1" step="0.001" value="0" />
            </div>
          </div>
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
            <div>
              <div class="small" style="margin-bottom:8px;">Camera State</div>
              <pre id="camera-state"></pre>
            </div>
            <div>
              <div class="small" style="margin-bottom:8px;">View Matrix</div>
              <pre id="camera-view"></pre>
            </div>
            <div>
              <div class="small" style="margin-bottom:8px;">Projection Matrix</div>
              <pre id="camera-projection"></pre>
            </div>
            <div>
              <div class="small" style="margin-bottom:8px;">View Projection Matrix</div>
              <pre id="camera-view-projection"></pre>
            </div>
          </div>
        </div>
      </main>
    </div>`,
    script: `
      function formatMatrix(values) {
        const rows = [];
        for (let index = 0; index < values.length; index += 4) {
          rows.push(values.slice(index, index + 4).map((value) => Number(value).toFixed(3)).join('  '));
        }
        return rows.join('\\n');
      }

      const cameraStateEl = document.getElementById('camera-state');
      const cameraViewEl = document.getElementById('camera-view');
      const cameraProjectionEl = document.getElementById('camera-projection');
      const cameraViewProjectionEl = document.getElementById('camera-view-projection');

      function renderCamera() {
        const cameraService = new WindyLib.SimpleCameraService({
          viewport: { width: 800, height: 600 },
          position: [0, 0, Number(document.getElementById('camera-z').value)],
          target: [0, 0, 0],
          up: [0, 1, 0],
          fov: (45 * Math.PI) / 180,
          near: 0.1,
          far: 1000,
        });

        const jitterX = Number(document.getElementById('jitter-x').value);
        const jitterY = Number(document.getElementById('jitter-y').value);

        if (jitterX !== 0 || jitterY !== 0) {
          cameraService.jitterProjectionMatrix(jitterX, jitterY);
        }

        const projectedOrigin = cameraService.project([0, 0, 0]);
        const projectedPoint = cameraService.project([
          Number(document.getElementById('point-x').value),
          Number(document.getElementById('point-y').value),
          0,
        ]);

        cameraStateEl.textContent = JSON.stringify({
          cameraPosition: cameraService.getCameraPosition().map((value) => Number(value.toFixed(3))),
          projectedOrigin: projectedOrigin.map((value) => Number(value.toFixed(3))),
          projectedPoint: projectedPoint.map((value) => Number(value.toFixed(3))),
        }, null, 2);
        cameraViewEl.textContent = formatMatrix(cameraService.getViewMatrix());
        cameraProjectionEl.textContent = formatMatrix(cameraService.getProjectionMatrix());
        cameraViewProjectionEl.textContent = formatMatrix(cameraService.getViewProjectionMatrix());
      }

      ['camera-z', 'point-x', 'point-y', 'jitter-x', 'jitter-y'].forEach((id) => {
        document.getElementById(id).addEventListener('input', renderCamera);
      });

      renderCamera();
    `,
  })

  writeExampleFile('maplibre-camera-sync.html', {
    title: 'WindyLib Example - MapLibreCameraSync',
    head: `
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.js"></script>`,
    body: `
    <div class="page">
      <div class="nav"><a href="./index.html">Examples</a> / Foundations / MapLibreCameraSync</div>
      <div class="split">
        <aside class="panel dark">
          <div class="field">
            <label for="sync-zoom">Zoom</label>
            <input id="sync-zoom" type="range" min="1" max="18" step="0.1" value="4.2" />
          </div>
          <div class="field">
            <label for="sync-pitch">Pitch</label>
            <input id="sync-pitch" type="range" min="0" max="60" step="1" value="0" />
          </div>
          <div class="field">
            <label for="sync-bearing">Bearing</label>
            <input id="sync-bearing" type="range" min="-180" max="180" step="1" value="0" />
          </div>
          <div class="small" style="margin-bottom:8px;">Camera Sync State</div>
          <pre id="sync-state"></pre>
        </aside>
        <main class="stage">
          <div id="map" class="map"></div>
        </main>
      </div>
    </div>`,
    script: `
      ${mapLibreSetup}
      const syncStateEl = document.getElementById('sync-state');
      const cameraService = new WindyLib.SimpleCameraService();
      const map = createMap(document.getElementById('map'), {
        center: [116.38, 39.9],
        zoom: 4.2,
      });
      const mapHost = new WindyLib.MapLibreLayerHost({
        map,
        initialProps: {
          vertices: [[116.38, 39.9, 0]],
          zoom: 4.2,
        },
        createLayer: () => null,
      });

      mapHost.attach();

      const sync = new WindyLib.MapLibreCameraSync({
        map: mapHost.map,
        cameraService,
        fovDeg: 45,
        near: 0.000001,
        far: 10,
        onUpdate(nextState) {
          syncStateEl.textContent = JSON.stringify({
            map: {
              center: nextState.center,
              zoom: Number(nextState.zoom.toFixed(3)),
              pitch: Number(nextState.pitch.toFixed(3)),
              bearing: Number(nextState.bearing.toFixed(3)),
              viewport: nextState.viewport,
            },
            camera: {
              position: cameraService.getCameraPosition().map((value) => Number(value.toFixed(6))),
              target: nextState.camera.target.map((value) => Number(value.toFixed(6))),
              up: nextState.camera.up.map((value) => Number(value.toFixed(6))),
            },
          }, null, 2);
        },
      });

      sync.attach();
      mapHost.map.jumpTo({
        center: [116.38, 39.9],
        zoom: 4.2,
        pitch: 0,
        bearing: 0,
      });

      function syncMap() {
        mapHost.map.jumpTo({
          center: [116.38, 39.9],
          zoom: Number(document.getElementById('sync-zoom').value),
          pitch: Number(document.getElementById('sync-pitch').value),
          bearing: Number(document.getElementById('sync-bearing').value),
        });
        sync.sync();
      }

      ['sync-zoom', 'sync-pitch', 'sync-bearing'].forEach((id) => {
        document.getElementById(id).addEventListener('input', syncMap);
      });
    `,
  })
}

function writeDocsSdk() {
  fs.rmSync(docsSdkDir, {
    recursive: true,
    force: true,
  })
  fs.mkdirSync(docsSdkDir, {
    recursive: true,
  })

  fs.copyFileSync(
    path.resolve(outputDir, 'wl-all.umd.js'),
    path.resolve(docsSdkDir, 'wl-all.umd.js'),
  )
}

fs.rmSync(outputDir, {
  recursive: true,
  force: true,
})

fs.mkdirSync(outputDir, {
  recursive: true,
})

const allEntryFiles = []

packages.forEach(({ sourceDir, alias, entryFile }) => {
  const absoluteSourceDir = path.resolve(rootDir, sourceDir)
  const sourceFiles = getJavaScriptFiles(absoluteSourceDir)
  const fileNameMap = new Map(
    sourceFiles.map((fileName) => [fileName, getOutputFileName(alias, fileName, entryFile)]),
  )

  sourceFiles.forEach((fileName) => {
    const sourcePath = path.resolve(absoluteSourceDir, fileName)
    const outputFileName = fileNameMap.get(fileName)
    const outputPath = path.resolve(outputDir, outputFileName)
    const sourceCode = fs.readFileSync(sourcePath, 'utf8')
    const outputCode = rewriteLocalImports(sourceCode, fileNameMap)

    fs.writeFileSync(outputPath, outputCode)
  })

  const outputEntryFile = fileNameMap.get(entryFile)
  if (outputEntryFile) {
    allEntryFiles.push(outputEntryFile)
  }
})

const allEsmSource = allEntryFiles
  .map((fileName) => `export * from "./${fileName}";`)
  .join('\n')

fs.writeFileSync(
  path.resolve(outputDir, 'wl-all.esm.js'),
  `${allEsmSource}\n`,
)

fs.writeFileSync(
  umdEntryPath,
  [
    `export * from ${JSON.stringify(path.resolve(rootDir, 'packages/core/src/index.js'))};`,
    `export * from ${JSON.stringify(path.resolve(rootDir, 'packages/layers/src/index.js'))};`,
    `export * from ${JSON.stringify(path.resolve(rootDir, 'packages/maps/leaflet/src/index.js'))};`,
    `export * from ${JSON.stringify(path.resolve(rootDir, 'packages/maps/maplibre/src/index.js'))};`,
    '',
  ].join('\n'),
)

await build({
  logLevel: 'error',
  build: {
    emptyOutDir: false,
    lib: {
      entry: umdEntryPath,
      name: 'WindyLib',
      formats: ['umd'],
      fileName: () => 'wl-all.umd.js',
    },
    rollupOptions: {
      external: ['leaflet', 'maplibre-gl'],
      output: {
        globals: {
          leaflet: 'L',
          'maplibre-gl': 'maplibregl',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@windylib/core': path.resolve(rootDir, 'packages/core/src/index.js'),
      '@windylib/layers': path.resolve(rootDir, 'packages/layers/src/index.js'),
      '@windylib/maps-leaflet': path.resolve(rootDir, 'packages/maps/leaflet/src/index.js'),
      '@windylib/maps-maplibre': path.resolve(rootDir, 'packages/maps/maplibre/src/index.js'),
    },
  },
})

fs.rmSync(umdEntryPath, {
  force: true,
})

writeExamples()
writeDocsSdk()
