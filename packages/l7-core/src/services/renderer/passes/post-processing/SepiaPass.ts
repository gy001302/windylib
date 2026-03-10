import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingQuadShader,
  postProcessingSepiaShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

export interface ISepiaPassConfig {
  amount: number;
}

@injectable()
export default class SepiaPass extends BasePostProcessingPass<ISepiaPassConfig> {
  public setupShaders() {
    this.shaderModuleService.registerModule('sepia-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingSepiaShader,
    });

    return this.shaderModuleService.getModule('sepia-pass');
  }
}
