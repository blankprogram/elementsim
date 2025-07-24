#version 300 es
precision highp float;

uniform sampler2D u_state;
uniform vec2 u_res;
uniform ivec2 u_offset;
uniform int u_frame;

in vec2 v_uv;
out vec4 outColor;

const float EPS = 0.01;
const float EMPTY_A = 0.00;
const float STEAM_A = 0.35;
const float WATER_A = 0.50;
const float OIL_A = 0.55;
const float SAND_A = 0.75;
const float WOOD_A = 0.85;
const float FIRE_A = 0.90;
const float STONE_A = 1.00;

bool isType(float a, float t) { return abs(a - t) < EPS; }
bool isEmpty(float a) { return a < EPS; }
bool isSteam(float a) { return isType(a, STEAM_A); }
bool isWater(float a) { return isType(a, WATER_A); }
bool isOil(float a) { return isType(a, OIL_A); }
bool isSand(float a) { return isType(a, SAND_A); }
bool isWood(float a) { return isType(a, WOOD_A); }
bool isFire(float a) { return isType(a, FIRE_A); }
bool isStone(float a) { return isType(a, STONE_A); }
bool isLiquid(float a) { return a > (WATER_A - EPS) && a < (SAND_A - EPS); }

void swap(inout vec4 A, inout vec4 B) { vec4 tmp = A; A = B; B = tmp; }

vec4 safeFetch(ivec2 q) {
    if (q.x < 0 || q.y < 0 || q.x >= int(u_res.x) || q.y >= int(u_res.y))
        return vec4(0.0, 0.0, 0.0, STONE_A);
    return texelFetch(u_state, q, 0);
}

vec4 hash43(vec3 p) {
    vec4 h = fract(vec4(p, float(u_frame)) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    h += dot(h, h.wzxy + 33.33);
    return fract((h.xxyz + h.yzzw) * h.zywx);
}

const float SPREAD_CHANCE = 0.15;
const float BURNOUT_NEAR = 0.0001;
const float BURNOUT_ALONE = 0.01;
const int SPREAD_INTERVAL = 3;

void processFire(inout vec4 cell, float rSpread, float rBurn, bool nearFire, bool nearFuel) {
    if (isFire(cell.a)) {
        cell.rgb = mix(cell.rgb, vec3(1.0, 0.3 + 0.4 * rSpread, 0.0), 0.5);
        if (rBurn < (nearFuel ? BURNOUT_NEAR : BURNOUT_ALONE)) cell = vec4(0.0);
    } else if ((isWood(cell.a) || isOil(cell.a)) && nearFire &&
               (u_frame % SPREAD_INTERVAL == 0) && rSpread < SPREAD_CHANCE) {
        cell = vec4(1.0, 0.4, 0.0, FIRE_A);
    }
}

void main() {
    ivec2 p = ivec2(clamp(v_uv * (u_res - 1e-4), vec2(0.0), u_res - 1.0));
    ivec2 base = p - ((p - u_offset) & ivec2(1, 1));

    vec4 t00 = safeFetch(base + ivec2(0, 0));
    vec4 t10 = safeFetch(base + ivec2(1, 0));
    vec4 t01 = safeFetch(base + ivec2(0, 1));
    vec4 t11 = safeFetch(base + ivec2(1, 1));

    vec4 tn00 = safeFetch(base + ivec2(0, -1));
    vec4 tn10 = safeFetch(base + ivec2(1, -1));

    if (t00.a == t10.a && t01.a == t11.a && t00.a == t01.a) {
        outColor = (p.x == base.x)
            ? ((p.y == base.y) ? t00 : t01)
            : ((p.y == base.y) ? t10 : t11);
        return;
    }

    vec4 r = hash43(vec3(base, float(u_frame)));

    if (isSand(t01.a)) {
        if (isEmpty(t00.a) || isLiquid(t00.a)) {
            swap(t01, t00);
        } else {
            bool moved = false;
            if ((isEmpty(t10.a) || isLiquid(t10.a)) && r.y < 0.5) { 
                swap(t01, t10);
                moved = true;
            }
            if (!moved && (isEmpty(t00.a) || isLiquid(t00.a))) {
                swap(t01, t00);
            }
        }
    }

    if (isSand(t11.a)) {
        if (isEmpty(t10.a) || isLiquid(t10.a)) {
            swap(t11, t10);
        } else {
            bool moved = false;
            if ((isEmpty(t00.a) || isLiquid(t00.a)) && r.z < 0.5) { 
                swap(t11, t00);
                moved = true;
            }
            if (!moved && (isEmpty(t10.a) || isLiquid(t10.a))) {
                swap(t11, t10);
            }
        }
    }

    bool drop = false;
    if (isLiquid(t01.a)) {
        if (t00.a < t01.a && r.y < 0.95) { swap(t01, t00); drop = true; }
        else if (t11.a < t01.a && t10.a < t01.a && r.z < 0.3) { swap(t01, t10); drop = true; }
    }
    if (isLiquid(t11.a)) {
        if (t10.a < t11.a && r.y < 0.95) { swap(t11, t10); drop = true; }
        else if (t01.a < t11.a && t00.a < t11.a && r.z < 0.3) { swap(t11, t00); drop = true; }
    }
    if (!drop) {
        if ((isLiquid(t01.a) && t11.a < WATER_A) || (t01.a < WATER_A && isLiquid(t11.a))) {
            if (r.w < 0.8) swap(t01, t11);
        }
        if ((isLiquid(t00.a) && t10.a < WATER_A) || (t00.a < WATER_A && isLiquid(t10.a))) {
            if (tn00.a >= WATER_A && tn10.a >= WATER_A || r.w < 0.8) swap(t00, t10);
        }
    }

    bool topEdge = (base.y + 1 >= int(u_res.y));  
    bool leftEdge = (base.x <= 0);
    bool rightEdge = (base.x + 1 >= int(u_res.x));

    if (!leftEdge && !rightEdge) {
        if ((isSteam(t01.a) && !isSteam(t11.a)) || (!isSteam(t01.a) && isSteam(t11.a))) {
            if (r.x < 0.25) swap(t01, t11);
        }
    }

    if (isSteam(t00.a)) {
        if (!topEdge && !isSteam(t01.a) && r.y < 0.25) swap(t00, t01);
    }
    if (isSteam(t10.a)) {
        if (!topEdge && !isSteam(t11.a) && r.y < 0.25) swap(t10, t11);
    }

    if (isWater(t00.a) && isOil(t01.a)) swap(t00, t01);
    if (isWater(t10.a) && isOil(t11.a)) swap(t10, t11);

    if (isFire(t00.a) && isWater(t01.a)) t01 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t10.a) && isWater(t11.a)) t11 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t01.a) && isWater(t00.a)) t00 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t11.a) && isWater(t10.a)) t10 = vec4(0.8, 0.8, 0.8, STEAM_A);

    bool nearFire = isFire(t00.a) || isFire(t10.a) || isFire(t01.a) || isFire(t11.a);
    bool nearFuel = isWood(t00.a) || isOil(t00.a) ||
                    isWood(t10.a) || isOil(t10.a) ||
                    isWood(t01.a) || isOil(t01.a) ||
                    isWood(t11.a) || isOil(t11.a);

    processFire(t00, r.x, r.y, nearFire, nearFuel);
    processFire(t10, r.y, r.z, nearFire, nearFuel);
    processFire(t01, r.z, r.w, nearFire, nearFuel);
    processFire(t11, r.w, r.x, nearFire, nearFuel);

    outColor = (p.x == base.x)
             ? ((p.y == base.y) ? t00 : t01)
             : ((p.y == base.y) ? t10 : t11);
}
