import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingHexagonalPixelateShader,
  postProcessingQuadShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

export interface IHexagonalPixelatePassConfig {
  center: [number, number];
  scale: number;
}

@injectable()
export default class HexagonalPixelatePass extends BasePostProcessingPass<IHexagonalPixelatePassConfig> {
  protected setupShaders() {
    this.shaderModuleService.registerModule('hexagonalpixelate-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingHexagonalPixelateShader,
    });

    const { vs, fs, uniforms } = this.shaderModuleService.getModule(
      'hexagonalpixelate-pass',
    );
    const { width, height } = this.rendererService.getViewportSize();

    return {
      vs,
      fs,
      uniforms: {
        ...uniforms,
        u_ViewportSize: [width, height],
      },
    };
  }
}
