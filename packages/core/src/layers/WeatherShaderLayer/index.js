import { Layer, picking, project32 } from 'deck.gl'
import { Model } from '@luma.gl/engine'
// eslint-disable-next-line import/no-unresolved
import vertexShader from './weather.vs.glsl?raw'
// eslint-disable-next-line import/no-unresolved
import fragmentShader from './weather.fs.glsl?raw'

const weatherUniformBlock = `
uniform weatherUniforms {
  float time;
  float intensity;
  float threshold;
  float alpha;
  vec3 colorA;
  vec3 colorB;
  vec4 bbox;
} weather;
`

const weatherUniforms = {
  name: 'weather',
  vs: weatherUniformBlock,
  fs: weatherUniformBlock,
  uniformTypes: {
    time: 'f32',
    intensity: 'f32',
    threshold: 'f32',
    alpha: 'f32',
    colorA: 'vec3<f32>',
    colorB: 'vec3<f32>',
    bbox: 'vec4<f32>',
  },
}

const defaultProps = {
  bounds: { type: 'object', value: { west: 0, south: 0, east: 0, north: 0 }, compare: true },
  uniforms: {
    type: 'object',
    compare: true,
    value: {
      time: 0,
      intensity: 1,
      threshold: 0.45,
      alpha: 0.8,
      colorA: [0.05, 0.35, 0.95],
      colorB: [0.95, 0.95, 0.2],
    },
  },
}

function createMesh(bounds) {
  const positions = new Float64Array([
    bounds.west, bounds.south, 0,
    bounds.west, bounds.north, 0,
    bounds.east, bounds.north, 0,
    bounds.east, bounds.south, 0,
  ])
  const texCoords = new Float32Array([
    0, 0,
    0, 1,
    1, 1,
    1, 0,
  ])
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3])

  return {
    positions,
    texCoords,
    indices,
    vertexCount: indices.length,
  }
}

export class WeatherShaderLayer extends Layer {
  getShaders() {
    return super.getShaders({
      vs: vertexShader,
      fs: fragmentShader,
      modules: [project32, picking, weatherUniforms],
    })
  }

  initializeState() {
    const mesh = createMesh(this.props.bounds)
    this.setState({ mesh, model: this._createModel() })

    const attributeManager = this.getAttributeManager()
    const noAlloc = true
    attributeManager.remove(['instancePickingColors'])
    attributeManager.add({
      indices: {
        size: 1,
        isIndexed: true,
        update: (attribute) => { attribute.value = this.state.mesh.indices },
        noAlloc,
      },
      positions: {
        size: 3,
        type: 'float64',
        fp64: this.use64bitPositions(),
        update: (attribute) => { attribute.value = this.state.mesh.positions },
        noAlloc,
      },
      texCoords: {
        size: 2,
        update: (attribute) => { attribute.value = this.state.mesh.texCoords },
        noAlloc,
      },
    })
  }

  updateState({ props, oldProps, changeFlags }) {
    const attributeManager = this.getAttributeManager()

    if (changeFlags.extensionsChanged) {
      this.state.model?.destroy()
      this.state.model = this._createModel()
      attributeManager.invalidateAll()
    }

    if (props.bounds !== oldProps.bounds) {
      this.state.mesh = createMesh(props.bounds)
      this.state.model?.setVertexCount(this.state.mesh.vertexCount)
      attributeManager.invalidateAll()
    }
  }

  draw() {
    const { bounds, uniforms } = this.props
    const { model } = this.state
    if (!model) {
      return
    }

    model.shaderInputs.setProps({
      weather: {
        time: uniforms.time,
        intensity: uniforms.intensity,
        threshold: uniforms.threshold,
        alpha: uniforms.alpha,
        colorA: uniforms.colorA,
        colorB: uniforms.colorB,
        bbox: [bounds.west, bounds.south, bounds.east, bounds.north],
      },
    })
    model.draw(this.context.renderPass)
  }

  finalizeState() {
    this.state.model?.destroy()
    super.finalizeState()
  }

  _createModel() {
    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout: this.getAttributeManager().getBufferLayouts(),
      topology: 'triangle-list',
      isInstanced: false,
    })
  }
}

WeatherShaderLayer.layerName = 'WeatherShaderLayer'
WeatherShaderLayer.defaultProps = defaultProps

export { vertexShader as defaultVertexShader, fragmentShader as defaultFragmentShader }
