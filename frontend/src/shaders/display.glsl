#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2    u_mouse;
uniform int      u_brush;
in  vec2         v_uv;
out vec4         outColor;
void main() {
  ivec2 p = ivec2(v_uv * float({{SIM_RES}}));
  int dx = p.x - u_mouse.x;
  int dy = p.y - u_mouse.y;
  int d2 = dx*dx + dy*dy;
  vec4 cell = texture(u_state, v_uv);
  vec3 color = cell.rgb;

  if (d2 > u_brush*u_brush && d2 <= (u_brush+1)*(u_brush+1)) {
    color = mix(color, vec3(1.0), 0.3);
  }
  outColor = vec4(color, 1.0);
}
