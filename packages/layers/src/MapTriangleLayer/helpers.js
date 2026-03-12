import { buildTriangleMesh } from '@windylib/core'

export const baseDefaultProps = {
  id: 'map-triangle-layer',
  vertices: {
    type: 'object',
    compare: true,
    value: [
      [118.3, 31.7, 0],
      [119.4, 32.2, 0],
      [118.6, 32.8, 0],
    ],
  },
  color: {
    type: 'color',
    value: [255, 120, 64, 220],
  },
  subdivisionSteps: {
    type: 'number',
    value: 24,
    compare: true,
  },
  vertexShader: {
    type: 'string',
    value: null,
    compare: true,
  },
  fragmentShader: {
    type: 'string',
    value: null,
    compare: true,
  },
  onShaderStateChange: {
    type: 'function',
    value: null,
    compare: false,
  },
  onLifecycleStateChange: {
    type: 'function',
    value: null,
    compare: false,
  },
  projectPosition: {
    type: 'function',
    value: null,
    compare: false,
  },
}

export function toProjectedPositions(vertices, subdivisionSteps, projectPosition = null) {
  const meshVertices = buildTriangleMesh(vertices, subdivisionSteps)
  const positions = new Float32Array(meshVertices.length * 2)

  meshVertices.forEach((vertex, index) => {
    const projected = typeof projectPosition === 'function'
      ? projectPosition(vertex)
      : { x: Number(vertex[0] ?? 0), y: Number(vertex[1] ?? 0) }
    const offset = index * 2
    positions[offset] = Number(projected?.x ?? projected?.[0] ?? 0)
    positions[offset + 1] = Number(projected?.y ?? projected?.[1] ?? 0)
  })

  return {
    positions,
    vertexCount: meshVertices.length,
  }
}

export function buildVertexShader(shaderDescription, vertexShader) {
  return `#version 300 es
${shaderDescription.vertexShaderPrelude}
${shaderDescription.define}

in vec2 a_pos;

${vertexShader}`
}

export function buildFragmentShader(fragmentShader) {
  return `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 fragColor;

${fragmentShader}`
}
