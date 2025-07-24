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
const float OIL_A   = 0.55;
const float SAND_A  = 0.75;
const float WOOD_A  = 0.85;
const float FIRE_A  = 0.90;
const float STONE_A = 1.00;

bool isEmpty(float a)  { return a < EPS; }
bool isWater(float a)  { return abs(a - WATER_A) < EPS; }
bool isOil(float a)    { return abs(a - OIL_A)   < EPS; }
bool isSand(float a)   { return abs(a - SAND_A)  < EPS; }
bool isWood(float a)   { return abs(a - WOOD_A)  < EPS; }
bool isFire(float a)   { return abs(a - FIRE_A)  < EPS; }
bool isStone(float a)  { return abs(a - STONE_A) < EPS; }

bool isLiquid(float a) { return isWater(a) || isOil(a); }
bool isSolid(float a)  { return isSand(a) || isWood(a) || isStone(a); }

bool isPassableSolid(float a)       { return isEmpty(a) || isLiquid(a); }
bool isVerticallyPassable(float a)  { return isEmpty(a); }
bool isHorizontallyPassable(float a){ return isEmpty(a) || isLiquid(a); }

void swap(inout vec4 A, inout vec4 B) {
    vec4 tmp = A; A = B; B = tmp;
}

vec4 hash43(vec3 p) {
    vec4 h = fract(vec4(p, float(u_frame)) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    h += dot(h, h.wzxy + 33.33);
    return fract((h.xxyz + h.yzzw) * h.zywx);
}

vec4 safeFetch(ivec2 q) {
    return (q.x < 0 || q.y < 0 || q.x >= int(u_res.x) || q.y >= int(u_res.y))
        ? vec4(0.0, 0.0, 0.0, STONE_A)
        : texelFetch(u_state, q, 0);
}

const float SPREAD_CHANCE   = 0.15;
const float BURNOUT_NEAR    = 0.0001;
const float BURNOUT_ALONE   = 0.01;
const int   SPREAD_INTERVAL = 3;

void processFire(inout vec4 cell, float rSpread, float rBurn, bool nearFire, bool nearFuel) {
    if (isFire(cell.a)) {
        cell.rgb = mix(cell.rgb, vec3(1.0, 0.3 + 0.4 * rSpread, 0.0), 0.5);
        if (rBurn < (nearFuel ? BURNOUT_NEAR : BURNOUT_ALONE)) cell = vec4(0.0);
    } else if ((isWood(cell.a) || isOil(cell.a)) && nearFire) {
        if ((u_frame % SPREAD_INTERVAL) == 0 && rSpread < SPREAD_CHANCE)
            cell = vec4(1.0, 0.4, 0.0, FIRE_A);
    }
}

void main() {
    ivec2 p    = ivec2(clamp(v_uv * (u_res - 1e-4), vec2(0.0), u_res - 1.0));
    ivec2 base = p - ((p - u_offset) & ivec2(1, 1));

    vec4 t00 = safeFetch(base + ivec2(0, 0));
    vec4 t10 = safeFetch(base + ivec2(1, 0));
    vec4 t01 = safeFetch(base + ivec2(0, 1));
    vec4 t11 = safeFetch(base + ivec2(1, 1));

    if (t00.a == t10.a && t01.a == t11.a && t00.a == t01.a) {
        int idx = (p.y - base.y) * 2 + (p.x - base.x);
        outColor = (idx == 0) ? t00 : (idx == 1) ? t10 : (idx == 2) ? t01 : t11;
        return;
    }

    vec4 r = hash43(vec3(base, float(u_frame)));

    if (isSand(t01.a)) {
        if (isPassableSolid(t00.a)) {
            if (r.x < 0.9) swap(t01, t00);
        } else if (isPassableSolid(t10.a) && isPassableSolid(t11.a)) {
            if (r.y < 0.5) swap(t01, t10);
            else swap(t01, t11);
        }
    }
    if (isSand(t11.a)) {
        if (isPassableSolid(t10.a)) {
            if (r.z < 0.9) swap(t11, t10);
        } else if (isPassableSolid(t00.a) && isPassableSolid(t01.a)) {
            if (r.w < 0.5) swap(t11, t00);
            else swap(t11, t01);
        }
    }

    bool dropped = false;

    if (isLiquid(t01.a)) {
        if (isVerticallyPassable(t00.a) && r.y < 0.95) {
            swap(t01, t00); dropped = true;
        } else if (isVerticallyPassable(t10.a) && isVerticallyPassable(t11.a) && r.z < 0.3) {
            if (r.x < 0.5) swap(t01, t10);
            else swap(t01, t11);
            dropped = true;
        }
    }
    if (isLiquid(t11.a)) {
        if (isVerticallyPassable(t10.a) && r.y < 0.95) {
            swap(t11, t10); dropped = true;
        } else if (isVerticallyPassable(t00.a) && isVerticallyPassable(t01.a) && r.z < 0.3) {
            if (r.x < 0.5) swap(t11, t00);
            else swap(t11, t01);
            dropped = true;
        }
    }

    if (!dropped) {
        bool belowLeftLiquid  = isLiquid(safeFetch(base + ivec2(0, -1)).a);
        bool belowRightLiquid = isLiquid(safeFetch(base + ivec2(1, -1)).a);

        if (belowLeftLiquid || belowRightLiquid) {
            if ((isLiquid(t01.a) && isHorizontallyPassable(t11.a) ||
                 isHorizontallyPassable(t01.a) && isLiquid(t11.a)) && r.w < 0.8)
                swap(t01, t11);

            if ((isLiquid(t00.a) && isHorizontallyPassable(t10.a) ||
                 isHorizontallyPassable(t00.a) && isLiquid(t10.a)) && r.w < 0.8)
                swap(t00, t10);
        }
    }

    if (isWater(t00.a) && isOil(t01.a)) swap(t00, t01);
    if (isWater(t10.a) && isOil(t11.a)) swap(t10, t11);

    bool nearFire = false, nearFuel = false;
    ivec2 offsets[8] = ivec2[8](
        ivec2( 0, 1), ivec2( 1, 0), ivec2( 0,-1), ivec2(-1, 0),
        ivec2( 1, 1), ivec2( 1,-1), ivec2(-1, 1), ivec2(-1,-1)
    );

    for (int i = 0; i < 8; i++) {
        vec4 n = safeFetch(base + offsets[i]);
        if (isFire(n.a)) nearFire = true;
        if (isWood(n.a) || isOil(n.a)) nearFuel = true;
    }

    processFire(t00, r.x, r.y, nearFire, nearFuel);
    processFire(t10, r.y, r.z, nearFire, nearFuel);
    processFire(t01, r.z, r.w, nearFire, nearFuel);
    processFire(t11, r.w, r.x, nearFire, nearFuel);

    int idx = (p.y - base.y) * 2 + (p.x - base.x);
    outColor = (idx == 0) ? t00 : (idx == 1) ? t10 : (idx == 2) ? t01 : t11;
}
