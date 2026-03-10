import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingInkShader,
  postProcessingQuadShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

export interface IInkPassConfig {
  strength: number;
}

@injectable()
export default class InkPass extends BasePostProcessingPass<IInkPassConfig> {
  protected setupShaders() {
    this.shaderModuleService.registerModule('ink-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingInkShader,
    });

    const { vs, fs, uniforms } = this.shaderModuleService.getModule('ink-pass');
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
