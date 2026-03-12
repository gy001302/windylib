import { mat4 } from 'gl-matrix'
import { SimpleCamera } from './SimpleCamera.js'

export class SimpleCameraService {
  constructor(options = {}) {
    this.camera = new SimpleCamera(options)
    this.jitteredProjectionMatrix = null
    this.jitteredViewProjectionMatrix = null
  }

  getCamera() {
    return this.camera
  }

  setViewport(size) {
    this.camera.setViewport(size)
    return this
  }

  lookAt(config) {
    this.camera.lookAt(config)
    return this
  }

  setPerspective(config) {
    this.camera.setPerspective(config)
    return this
  }

  getProjectionMatrix() {
    return this.jitteredProjectionMatrix || Array.from(this.camera.projectionMatrix)
  }

  getViewMatrix() {
    return Array.from(this.camera.viewMatrix)
  }

  getViewProjectionMatrix() {
    return this.jitteredViewProjectionMatrix || Array.from(this.camera.viewProjectionMatrix)
  }

  getCameraPosition() {
    return Array.from(this.camera.position)
  }

  project(worldPosition) {
    return this.camera.project(worldPosition)
  }

  unproject(screenPosition) {
    return this.camera.unproject(screenPosition)
  }

  jitterProjectionMatrix(x, y) {
    const translation = mat4.fromTranslation(mat4.create(), [x, y, 0])
    const jitteredProjection = mat4.multiply(
      mat4.create(),
      translation,
      this.camera.projectionMatrix,
    )
    const jitteredViewProjection = mat4.multiply(
      mat4.create(),
      jitteredProjection,
      this.camera.viewMatrix,
    )

    this.jitteredProjectionMatrix = Array.from(jitteredProjection)
    this.jitteredViewProjectionMatrix = Array.from(jitteredViewProjection)
  }

  clearJitterProjectionMatrix() {
    this.jitteredProjectionMatrix = null
    this.jitteredViewProjectionMatrix = null
  }
}
