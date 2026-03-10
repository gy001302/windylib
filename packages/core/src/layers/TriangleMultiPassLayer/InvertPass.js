import { FullscreenPostProcessingPass } from '../../core/passes/FullscreenPostProcessingPass'

const INVERT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_Texture;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_Texture, v_uv);
  fragColor = vec4(1.0 - color.rgb, color.a);
}`

export class InvertPass extends FullscreenPostProcessingPass {
  getFragmentShader() {
    return INVERT_FRAGMENT_SHADER
  }
}
