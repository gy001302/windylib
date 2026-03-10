import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingNoiseShader,
  postProcessingQuadShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

export interface INoisePassConfig {
  amount: number;
}

@injectable()
export default class NoisePass extends BasePostProcessingPass<INoisePassConfig> {
  public setupShaders() {
    this.shaderModuleService.registerModule('noise-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingNoiseShader,
    });

    return this.shaderModuleService.getModule('noise-pass');
  }
}
