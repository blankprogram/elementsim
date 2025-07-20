#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform vec2      u_res;
uniform ivec2     u_offset;
uniform int       u_frame;

in  vec2 v_uv;
out vec4 outColor;

const float EPS     = 1e-4;
const float SAND_A  = 1.0;
const float STONE_A = 0.75;

bool isEmpty(float a) { return a < EPS; }
bool isSand(float a)  { return abs(a - SAND_A) < EPS; }

void swap(inout vec4 A, inout vec4 B) {
    vec4 tmp = A;
    A = B;
    B = tmp;
}

vec4 hash43(vec3 p) {
    vec4 h = fract(vec4(p, float(u_frame)) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    h += dot(h, h.wzxy + 33.33);
    return fract((h.xxyz + h.yzzw) * h.zywx);
}

vec4 safeFetch(ivec2 q) {
    if (q.x < 0 || q.y < 0 || q.x >= int(u_res.x) || q.y >= int(u_res.y)) {
        return vec4(0.0, 0.0, 0.0, STONE_A);
    }
    return texelFetch(u_state, q, 0);
}

void main() {
    ivec2 p = ivec2(clamp(v_uv * (u_res - 1e-4), vec2(0.0), u_res - 1.0));
    ivec2 base = p - ((p - u_offset) & ivec2(1, 1));

    vec4 t00 = safeFetch(base + ivec2(0, 0));
    vec4 t10 = safeFetch(base + ivec2(1, 0));
    vec4 t01 = safeFetch(base + ivec2(0, 1));
    vec4 t11 = safeFetch(base + ivec2(1, 1));

    if (t00.a == t10.a && t01.a == t11.a && t00.a == t01.a) {
        int idx = (p.x - base.x) + 2 * (p.y - base.y);
        outColor = (idx == 0 ? t00 : idx == 1 ? t10 : idx == 2 ? t01 : t11);
        return;
    }

    vec4 r = hash43(vec3(base, float(u_frame)));

    if (isSand(t01.a)) {
        if (isEmpty(t00.a)) {
            if (r.x < 0.9) swap(t01, t00);
        } else if (isEmpty(t10.a) && isEmpty(t11.a)) {
            if (r.y < 0.5) swap(t01, t10);
            else swap(t01, t11);
        }
    }

    if (isSand(t11.a)) {
        if (isEmpty(t10.a)) {
            if (r.z < 0.9) swap(t11, t10);
        } else if (isEmpty(t00.a) && isEmpty(t01.a)) {
            if (r.w < 0.5) swap(t11, t00);
            else swap(t11, t01);
        }
    }

    int idx = (p.x - base.x) + 2 * (p.y - base.y);
    outColor = (idx == 0 ? t00 : idx == 1 ? t10 : idx == 2 ? t01 : t11);
}
