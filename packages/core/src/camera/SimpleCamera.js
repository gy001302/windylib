import { mat4, vec3, vec4 } from 'gl-matrix'

function toVec3(value, fallback = [0, 0, 0]) {
  const source = value ?? fallback
  return vec3.fromValues(source[0], source[1], source[2] ?? 0)
}

export class SimpleCamera {
  constructor(options = {}) {
    this.position = toVec3(options.position, [0, 0, 1])
    this.target = toVec3(options.target, [0, 0, 0])
    this.up = toVec3(options.up, [0, 1, 0])

    this.fov = options.fov ?? Math.PI / 4
    this.near = options.near ?? 0.1
    this.far = options.far ?? 10000
    this.aspect = options.aspect ?? 1
    this.viewport = options.viewport ?? { width: 1, height: 1 }

    this.viewMatrix = mat4.create()
    this.projectionMatrix = mat4.create()
    this.viewProjectionMatrix = mat4.create()
    this.inverseViewProjectionMatrix = mat4.create()

    this.updateMatrices()
  }

  setViewport({ width, height }) {
    this.viewport = { width, height }
    this.aspect = height === 0 ? 1 : width / height
    this.updateMatrices()
    return this
  }

  setPerspective({ fov = this.fov, aspect = this.aspect, near = this.near, far = this.far }) {
    this.fov = fov
    this.aspect = aspect
    this.near = near
    this.far = far
    this.updateMatrices()
    return this
  }

  lookAt({ position = this.position, target = this.target, up = this.up }) {
    this.position = toVec3(position, this.position)
    this.target = toVec3(target, this.target)
    this.up = toVec3(up, this.up)
    this.updateMatrices()
    return this
  }

  updateMatrices() {
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up)
    mat4.perspective(
      this.projectionMatrix,
      this.fov,
      this.aspect,
      this.near,
      this.far,
    )
    mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix)
    mat4.invert(this.inverseViewProjectionMatrix, this.viewProjectionMatrix)
  }

  project(worldPosition) {
    const width = this.viewport.width || 1
    const height = this.viewport.height || 1
    const point = vec4.fromValues(
      worldPosition[0],
      worldPosition[1],
      worldPosition[2] ?? 0,
      1,
    )
    vec4.transformMat4(point, point, this.viewProjectionMatrix)

    if (point[3] === 0) {
      return [0, 0, 0]
    }

    const ndcX = point[0] / point[3]
    const ndcY = point[1] / point[3]
    const ndcZ = point[2] / point[3]

    return [
      ((ndcX + 1) * 0.5) * width,
      ((1 - ndcY) * 0.5) * height,
      ndcZ,
    ]
  }

  unproject(screenPosition) {
    const width = this.viewport.width || 1
    const height = this.viewport.height || 1
    const x = (screenPosition[0] / width) * 2 - 1
    const y = 1 - (screenPosition[1] / height) * 2
    const z = screenPosition[2] ?? 0
    const point = vec4.fromValues(x, y, z, 1)
    vec4.transformMat4(point, point, this.inverseViewProjectionMatrix)

    if (point[3] === 0) {
      return [0, 0, 0]
    }

    return [
      point[0] / point[3],
      point[1] / point[3],
      point[2] / point[3],
    ]
  }

  getState() {
    return {
      position: Array.from(this.position),
      target: Array.from(this.target),
      up: Array.from(this.up),
      viewMatrix: Array.from(this.viewMatrix),
      projectionMatrix: Array.from(this.projectionMatrix),
      viewProjectionMatrix: Array.from(this.viewProjectionMatrix),
    }
  }
}
