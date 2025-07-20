#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform vec2      u_res;
uniform ivec2     u_offset;
uniform int       u_frame;

in  vec2 v_uv;
out vec4 outColor;

const float EPS     = 0.01;
const float EMPTY_A = 0.00;
const float WATER_A = 0.50;
const float SAND_A  = 0.75;
const float WOOD_A  = 0.85;
const float FIRE_A  = 0.90;
const float STONE_A = 1.00;

bool isEmpty(float a)    { return a < EPS; }
bool isWater(float a)    { return abs(a - WATER_A) < EPS; }
bool isStone(float a)    { return abs(a - STONE_A) < EPS; }
bool isSand(float a)     { return abs(a - SAND_A)  < EPS; }
bool isWood(float a)     { return abs(a - WOOD_A) < EPS; }
bool isFire(float a)     { return abs(a - FIRE_A) < EPS; }
bool isPassable(float a) { return isEmpty(a) || isWater(a); }

void swap(inout vec4 A, inout vec4 B) {
    vec4 tmp = A;
    A = B;
    B = tmp;
}

vec4 hash43(vec3 p) {
    vec4 h = fract(vec4(p, float(u_frame))
                * vec4(0.1031,0.1030,0.0973,0.1099));
    h += dot(h, h.wzxy + 33.33);
    return fract((h.xxyz + h.yzzw) * h.zywx);
}

vec4 safeFetch(ivec2 q) {
    if (q.x < 0 || q.y < 0
     || q.x >= int(u_res.x)
     || q.y >= int(u_res.y)) {
        return vec4(0.0,0.0,0.0, STONE_A);
    }
    return texelFetch(u_state, q, 0);
}

const float SPREAD_CHANCE   = 0.1;
const float BURNOUT_NEAR    = 0.0005;
const float BURNOUT_ALONE   = 0.025;
const int   SPREAD_INTERVAL = 3;

void processFire(inout vec4 cell, float rSpread, float rBurn, bool nearFire, bool nearWood) {
    if (isFire(cell.a)) {
        cell.rgb = mix(cell.rgb, vec3(1.0, 0.3 + 0.4 * rSpread, 0.0), 0.5);
        if (rBurn < (nearWood ? BURNOUT_NEAR : BURNOUT_ALONE))
            cell = vec4(0.0);
    } else if (isWood(cell.a) && nearFire) {
        if ((u_frame % SPREAD_INTERVAL) == 0 && rSpread < SPREAD_CHANCE)
            cell = vec4(1.0, 0.4, 0.0, FIRE_A);
    }
}

void main() {
    ivec2 p    = ivec2(clamp(v_uv * (u_res - 1e-4),
                             vec2(0.0), u_res - 1.0));
    ivec2 base = p - ((p - u_offset) & ivec2(1,1));

    vec4 t00 = safeFetch(base + ivec2(0,0));
    vec4 t10 = safeFetch(base + ivec2(1,0));
    vec4 t01 = safeFetch(base + ivec2(0,1));
    vec4 t11 = safeFetch(base + ivec2(1,1));

    if (t00.a == t10.a && t01.a == t11.a && t00.a == t01.a) {
        int idx = (p.y - base.y) * 2 + (p.x - base.x);
        outColor = (idx == 0) ? t00 :
                   (idx == 1) ? t10 :
                   (idx == 2) ? t01 : t11;
        return;
    }

    vec4 r = hash43(vec3(base, float(u_frame)));

    if (isSand(t01.a)) {
        if (isPassable(t00.a)) {
            if (r.x < 0.9) swap(t01, t00);
        }
        else if (isPassable(t10.a) && isPassable(t11.a)) {
            if (r.y < 0.5) swap(t01, t10);
            else           swap(t01, t11);
        }
    }
    if (isSand(t11.a)) {
        if (isPassable(t10.a)) {
            if (r.z < 0.9) swap(t11, t10);
        }
        else if (isPassable(t00.a) && isPassable(t01.a)) {
            if (r.w < 0.5) swap(t11, t00);
            else           swap(t11, t01);
        }
    }

    vec4 tn00 = safeFetch(base + ivec2(0,-1));
    vec4 tn10 = safeFetch(base + ivec2(1,-1));

    bool dropped = false;
    if (isWater(t01.a)) {
        if (t00.a < t01.a && r.y < 0.95) { swap(t01, t00); dropped = true; }
        else if (t10.a < t01.a && t11.a < t01.a && r.z < 0.3) {
            if (r.x < 0.5) swap(t01, t10);
            else           swap(t01, t11);
            dropped = true;
        }
    }
    if (isWater(t11.a)) {
        if (t10.a < t11.a && r.y < 0.95) { swap(t11, t10); dropped = true; }
        else if (t00.a < t11.a && t01.a < t11.a && r.z < 0.3) {
            if (r.x < 0.5) swap(t11, t00);
            else           swap(t11, t01);
            dropped = true;
        }
    }
    if (!dropped) {
        if ((isWater(t01.a) && t11.a < WATER_A ||
             t01.a < WATER_A && isWater(t11.a)) &&
            (tn00.a >= WATER_A && tn10.a >= WATER_A || r.w < 0.8)) {
            swap(t01, t11);
        }
        if ((isWater(t00.a) && t10.a < WATER_A ||
             t00.a < WATER_A && isWater(t10.a)) &&
            (tn00.a >= WATER_A && tn10.a >= WATER_A || r.w < 0.8)) {
            swap(t00, t10);
        }
    }

    vec4 neighbors[8];
    neighbors[0] = safeFetch(base + ivec2( 0, 1));
    neighbors[1] = safeFetch(base + ivec2( 1, 0));
    neighbors[2] = safeFetch(base + ivec2( 0,-1));
    neighbors[3] = safeFetch(base + ivec2(-1, 0));
    neighbors[4] = safeFetch(base + ivec2( 1, 1));
    neighbors[5] = safeFetch(base + ivec2( 1,-1));
    neighbors[6] = safeFetch(base + ivec2(-1, 1));
    neighbors[7] = safeFetch(base + ivec2(-1,-1));

    bool nearFire = false;
    bool nearWood = false;
    for (int i = 0; i < 8; i++) {
        if (isFire(neighbors[i].a)) nearFire = true;
        if (isWood(neighbors[i].a)) nearWood = true;
    }

    processFire(t00, r.x, r.y, nearFire, nearWood);
    processFire(t10, r.y, r.z, nearFire, nearWood);
    processFire(t01, r.z, r.w, nearFire, nearWood);
    processFire(t11, r.w, r.x, nearFire, nearWood);

    int idx = (p.y - base.y) * 2 + (p.x - base.x);
    outColor = (idx == 0) ? t00 :
               (idx == 1) ? t10 :
               (idx == 2) ? t01 : t11;
}
