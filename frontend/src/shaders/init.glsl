#version 300 es
precision lowp float;
out vec4 outColor;

float rand(vec2 c) {
    return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    bool border = p.x == 0 || p.y == 0 ||
                  p.x == {{SIM_RES}}-1 || p.y == {{SIM_RES}}-1;

    if (border) {
        float g = 0.3 + 0.3 * rand(vec2(p));
        outColor = vec4(vec3(g), 0.5);
    }
    else {
        outColor = vec4(0.0);
    }
}
