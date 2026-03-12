// core 包统一导出入口，负责暴露内核协议、renderer、pass 和 shader 资源。
export { SimpleCamera } from './viewports/SimpleCamera.js'
export { SimpleCameraService } from './viewports/SimpleCameraService.js'
// eslint-disable-next-line import/no-unresolved
export { default as commonShader } from './shaderlib/l7/shaders/common.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as decodeShader } from './shaderlib/l7/shaders/decode.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as light2Shader } from './shaderlib/l7/shaders/light2.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as lightingShader } from './shaderlib/l7/shaders/lighting.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as pickingFragShader } from './shaderlib/l7/shaders/picking.frag.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as pickingVertShader } from './shaderlib/l7/shaders/picking.vert.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as projectShader } from './shaderlib/l7/shaders/project.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as projectionShader } from './shaderlib/l7/shaders/projection.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as sdf2dShader } from './shaderlib/l7/shaders/sdf_2d.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as styleMappingShader } from './shaderlib/l7/shaders/styleMapping.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as styleMappingCalOpacityShader } from './shaderlib/l7/shaders/styleMappingCalOpacity.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as styleMappingCalStrokeOpacityShader } from './shaderlib/l7/shaders/styleMappingCalStrokeOpacity.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as styleMappingCalStrokeWidthShader } from './shaderlib/l7/shaders/styleMappingCalStrokeWidth.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as styleMappingCalThetaOffsetShader } from './shaderlib/l7/shaders/styleMappingCalThetaOffset.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingBlendShader } from './shaderlib/l7/shaders/post-processing/blend.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingBloomShader } from './shaderlib/l7/shaders/post-processing/bloom.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingBlurShader } from './shaderlib/l7/shaders/post-processing/blur.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingColorHalftoneShader } from './shaderlib/l7/shaders/post-processing/colorhalftone.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingCopyShader } from './shaderlib/l7/shaders/post-processing/copy.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingHexagonalPixelateShader } from './shaderlib/l7/shaders/post-processing/hexagonalpixelate.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingInkShader } from './shaderlib/l7/shaders/post-processing/ink.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingNoiseShader } from './shaderlib/l7/shaders/post-processing/noise.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingQuadShader } from './shaderlib/l7/shaders/post-processing/quad.glsl?raw'
// eslint-disable-next-line import/no-unresolved
export { default as postProcessingSepiaShader } from './shaderlib/l7/shaders/post-processing/sepia.glsl?raw'
export {
  buildTriangleMesh,
  interpolateTriangle,
  normalizeColor,
  invertColor,
} from './geometry/triangleMesh'
export { CanvasOverlayRendererHost } from './renderers/CanvasOverlayRendererHost'
export { ProjectedTriangleRenderer } from './renderers/ProjectedTriangleRenderer'
export { createChangeFlags, diffChangeFlags } from './lib/ChangeFlags'
export { LayerContext } from './lib/LayerContext'
export { LayerLifecycle } from './lib/LayerLifecycle'
export { LayerManager } from './lib/LayerManager'
export { BaseLayer } from './lib/BaseLayer'
export { BaseMultiPassLayer } from './lib/BaseMultiPassLayer'
export { MultiPassRenderer } from './lib/MultiPassRenderer'
export { PostProcessor } from './lib/PostProcessor'
export { ResourceManager } from './lib/ResourceManager'
export { BasePass, PassType } from './passes/BasePass'
export { BasePostProcessingPass } from './passes/BasePostProcessingPass'
export { FullscreenPostProcessingPass } from './passes/FullscreenPostProcessingPass'
export { RenderPass } from './passes/RenderPass'
export { InvertPass } from './passes/InvertPass'
export { DebugTrianglePass } from './passes/DebugTrianglePass'
