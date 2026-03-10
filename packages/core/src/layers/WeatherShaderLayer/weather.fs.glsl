#version 300 es
#define SHADER_NAME weather-layer-fs
precision highp float;

in vec2 vUv;
in vec2 vLngLat;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main(void) {
  vec2 p = vec2(
    vLngLat.x * 0.08 + weather.time * 0.03,
    vLngLat.y * 0.08 - weather.time * 0.02
  );

  float n0 = noise(p * weather.intensity);
  float n1 = noise((p + vec2(8.3, 2.1)) * weather.intensity * 1.7);
  float density = smoothstep(weather.threshold, 1.0, n0 * 0.55 + n1 * 0.45);

  vec3 mixed = mix(weather.colorA, weather.colorB, density);
  vec4 color = vec4(mixed, density * weather.alpha);
  color = picking_filterColor(color);
  fragColor = color;
}
