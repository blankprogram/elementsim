#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform ivec2     u_offset;

in  vec2  v_uv;
out vec4  outColor;

const float WALL_A = 0.5;
float rand(vec2 c) {
    return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
}
bool isWall(float a) { return abs(a - WALL_A) < 0.01; }

void main() {
    float RES_F = float({{SIM_RES}});
    ivec2 p = ivec2(clamp(v_uv * (RES_F - 1e-4), 0.0, RES_F - 1.0));

    if (p.x == 0 || p.y == 0 ||
        p.x == {{SIM_RES}}-1 || p.y == {{SIM_RES}}-1)
    {
        float g = 0.3 + 0.3 * rand(vec2(p));
        outColor = vec4(vec3(g), WALL_A);
        return;
    }

    ivec2 base = p - ((p - u_offset) & ivec2(1));

    vec4 c00 = texelFetch(u_state, base,               0);
    vec4 c10 = texelFetch(u_state, base + ivec2(1, 0), 0);
    vec4 c01 = texelFetch(u_state, base + ivec2(0, 1), 0);
    vec4 c11 = texelFetch(u_state, base + ivec2(1, 1), 0);

    if (isWall(c00.a) || isWall(c10.a) ||
        isWall(c01.a) || isWall(c11.a)) {
        outColor = texelFetch(u_state, p, 0);
        return;
    }

    int m = int(c00.a > 0.5)
          + int(c10.a > 0.5) * 2
          + int(c01.a > 0.5) * 4
          + int(c11.a > 0.5) * 8;

    vec4 B[4];
    B[0] = c00;  B[1] = c10;  B[2] = c01;  B[3] = c11;

         if (m == 4)   { B[0] = c01;                       B[2] = vec4(0);       }
    else if (m == 8)   { B[1] = c11;                       B[3] = vec4(0);       }
    else if (m == 12)  { B[0] = c01;  B[1] = c11;          B[2] = B[3] = vec4(0);}
    else if (m == 14)  { B[0] = c01;  B[1] = c10;  B[3] = c11;  B[2] = vec4(0);  }
    else if (m == 13)  { B[2] = c01;                       B[3] = vec4(0);       }
    else if (m == 9)   { B[1] = c11;                       B[2] = B[3] = vec4(0);}
    else if (m == 6)   { B[0] = c01;  B[1] = c10;          B[2] = B[3] = vec4(0);}
    else if (m == 10)  { B[0] = c11;  B[1] = c10;          B[2] = B[3] = vec4(0);}
    else if (m == 5)   { B[1] = c00;                       B[2] = B[3] = vec4(0);}

    int idx = (p.x - base.x) + 2 * (p.y - base.y);
    outColor = B[idx];
}
