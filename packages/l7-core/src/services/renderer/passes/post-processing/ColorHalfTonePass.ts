import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingColorHalftoneShader,
  postProcessingQuadShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

export interface IColorHalftonePassConfig {
  center: [number, number];
  angle: number;
  size: number;
}

@injectable()
export default class ColorHalftonePass extends BasePostProcessingPass<IColorHalftonePassConfig> {
  protected setupShaders() {
    this.shaderModuleService.registerModule('colorhalftone-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingColorHalftoneShader,
    });

    const { vs, fs, uniforms } =
      this.shaderModuleService.getModule('colorhalftone-pass');
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
