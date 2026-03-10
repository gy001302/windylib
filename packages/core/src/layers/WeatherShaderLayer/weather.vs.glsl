#version 300 es
#define SHADER_NAME weather-layer-vs

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vUv;
out vec2 vLngLat;

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = vec3(1.0, 0.0, 0.0);

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vUv = texCoords;
  vLngLat = mix(weather.bbox.xy, weather.bbox.zw, texCoords);
}
