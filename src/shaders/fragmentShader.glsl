precision mediump float;

varying vec2 uv;

void main() {
  gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0); // Display UV as color
}
