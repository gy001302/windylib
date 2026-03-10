import { injectable } from 'inversify';
import { uniq } from 'lodash';
import 'reflect-metadata';
import {
  commonShader,
  decodeShader,
  light2Shader,
  lightingShader,
  pickingFragShader,
  pickingVertShader,
  projectShader,
  projectionShader,
  sdf2dShader,
  styleMappingCalOpacityShader,
  styleMappingCalStrokeOpacityShader,
  styleMappingCalStrokeWidthShader,
  styleMappingCalThetaOffsetShader,
  styleMappingShader,
} from '@windylib/until';
import { extractUniforms } from '../../utils/shader-module';
import { IModuleParams, IShaderModuleService } from './IShaderModuleService';

const precisionRegExp = /precision\s+(high|low|medium)p\s+float/;
const globalDefaultprecision =
  '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif\n';
const includeRegExp = /#pragma include (["^+"]?["[a-zA-Z_0-9](.*)"]*?)/g;

@injectable()
export default class ShaderModuleService implements IShaderModuleService {
  private moduleCache: { [key: string]: IModuleParams } = {};
  private rawContentCache: { [key: string]: IModuleParams } = {};

  public registerBuiltinModules() {
    this.destroy();
    this.registerModule('common', { vs: commonShader, fs: commonShader });
    this.registerModule('decode', { vs: decodeShader, fs: '' });
    this.registerModule('projection', { vs: projectionShader, fs: '' });
    this.registerModule('project', { vs: projectShader, fs: '' });
    this.registerModule('sdf_2d', { vs: '', fs: sdf2dShader });
    this.registerModule('lighting', { vs: lightingShader, fs: '' });
    this.registerModule('light', { vs: light2Shader, fs: '' });
    this.registerModule('picking', {
      vs: pickingVertShader,
      fs: pickingFragShader,
    });
    this.registerModule('styleMapping', { vs: styleMappingShader, fs: '' });
    this.registerModule('styleMappingCalThetaOffset', {
      vs: styleMappingCalThetaOffsetShader,
      fs: '',
    });
    this.registerModule('styleMappingCalOpacity', {
      vs: styleMappingCalOpacityShader,
      fs: '',
    });
    this.registerModule('styleMappingCalStrokeOpacity', {
      vs: styleMappingCalStrokeOpacityShader,
      fs: '',
    });
    this.registerModule('styleMappingCalStrokeWidth', {
      vs: styleMappingCalStrokeWidthShader,
      fs: '',
    });
  }

  public registerModule(moduleName: string, moduleParams: IModuleParams) {
    if (this.rawContentCache[moduleName]) {
      return;
    }

    const { vs, fs, uniforms: declaredUniforms } = moduleParams;
    const { content: extractedVS, uniforms: vsUniforms } = extractUniforms(vs);
    const { content: extractedFS, uniforms: fsUniforms } = extractUniforms(fs);

    this.rawContentCache[moduleName] = {
      fs: extractedFS,
      uniforms: {
        ...vsUniforms,
        ...fsUniforms,
        ...declaredUniforms,
      },
      vs: extractedVS,
    };
  }
  public destroy() {
    this.moduleCache = {};
    this.rawContentCache = {};
  }
  public getModule(moduleName: string): IModuleParams {
    if (this.moduleCache[moduleName]) {
      return this.moduleCache[moduleName];
    }

    const rawVS = this.rawContentCache[moduleName].vs;
    const rawFS = this.rawContentCache[moduleName].fs;

    const { content: vs, includeList: vsIncludeList } = this.processModule(
      rawVS,
      [],
      'vs',
    );
    const { content: fs, includeList: fsIncludeList } = this.processModule(
      rawFS,
      [],
      'fs',
    );
    let compiledFs = fs;
    const uniforms: { [key: string]: any } = uniq(
      vsIncludeList.concat(fsIncludeList).concat(moduleName),
    ).reduce((prev, cur: string) => {
      return {
        ...prev,
        ...this.rawContentCache[cur].uniforms,
      };
    }, {});

    if (!precisionRegExp.test(fs)) {
      compiledFs = globalDefaultprecision + fs;
    }

    this.moduleCache[moduleName] = {
      fs: compiledFs.trim(),
      uniforms,
      vs: vs.trim(),
    };
    return this.moduleCache[moduleName];
  }

  private processModule(
    rawContent: string,
    includeList: string[],
    type: 'vs' | 'fs',
  ): {
    content: string;
    includeList: string[];
  } {
    const compiled = rawContent.replace(includeRegExp, (_, strMatch) => {
      const includeOpt = strMatch.split(' ');
      const includeName = includeOpt[0].replace(/"/g, '');

      if (includeList.indexOf(includeName) > -1) {
        return '';
      }

      const txt = this.rawContentCache[includeName][type];
      includeList.push(includeName);

      const { content } = this.processModule(txt, includeList, type);
      return content;
    });

    return {
      content: compiled,
      includeList,
    };
  }
}
