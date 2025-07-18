#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform ivec2     u_mouse;
uniform int       u_brush;

in  vec2 v_uv;
out vec4 outColor;

void main() {
  float RES_F = float({{SIM_RES}});
  ivec2 p = ivec2(clamp(v_uv * (RES_F - 1e-4), 0.0, RES_F - 1.0));
  int dx   = p.x - u_mouse.x;
  int dy   = p.y - u_mouse.y;
  int d2   = dx * dx + dy * dy;

  vec3 color = texture(u_state, v_uv).rgb;

  if (d2 >  u_brush * u_brush &&
      d2 <= (u_brush + 1) * (u_brush + 1))
  {
    color = mix(color, vec3(1.0), 0.3);
  }
  outColor = vec4(color, 1.0);
}
