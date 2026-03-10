import { injectable } from 'inversify';
import 'reflect-metadata';
import {
  postProcessingCopyShader,
  postProcessingQuadShader,
} from '@windylib/until';
import BasePostProcessingPass from '../BasePostProcessingPass';

@injectable()
export default class CopyPass extends BasePostProcessingPass {
  public setupShaders() {
    this.shaderModuleService.registerModule('copy-pass', {
      vs: postProcessingQuadShader,
      fs: postProcessingCopyShader,
    });

    return this.shaderModuleService.getModule('copy-pass');
  }
}
