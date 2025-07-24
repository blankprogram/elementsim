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
const float STEAM_A = 0.35;
const float WATER_A = 0.50;
const float OIL_A   = 0.55;
const float SAND_A  = 0.75;
const float WOOD_A  = 0.85;
const float FIRE_A  = 0.90;
const float STONE_A = 1.00;

bool isType(float a, float t) { return abs(a - t) < EPS; }

bool isEmpty(float a)  { return a < EPS; }
bool isSteam(float a)  { return isType(a, STEAM_A); }
bool isWater(float a)  { return isType(a, WATER_A); }
bool isOil(float a)    { return isType(a, OIL_A); }
bool isSand(float a)   { return isType(a, SAND_A); }
bool isWood(float a)   { return isType(a, WOOD_A); }
bool isFire(float a)   { return isType(a, FIRE_A); }
bool isStone(float a)  { return isType(a, STONE_A); }

bool isLiquid(float a) { return a > (WATER_A - EPS) && a < (SAND_A - EPS); }

bool isPassableSolid(float a)        { return a < (OIL_A + EPS); }
bool isVerticallyPassable(float a)   { return isEmpty(a) || isSteam(a); }
bool isHorizontallyPassable(float a) { return a < (OIL_A + EPS); }

void swap(inout vec4 A, inout vec4 B) {
    vec4 tmp = A; A = B; B = tmp;
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

const float SPREAD_CHANCE   = 0.15;
const float BURNOUT_NEAR    = 0.0001;
const float BURNOUT_ALONE   = 0.01;
const int   SPREAD_INTERVAL = 3;

void processFire(inout vec4 cell, float rSpread, float rBurn, bool nearFire, bool nearFuel) {
    if (isFire(cell.a)) {
        cell.rgb = mix(cell.rgb, vec3(1.0, 0.3 + 0.4 * rSpread, 0.0), 0.5);
        if (rBurn < (nearFuel ? BURNOUT_NEAR : BURNOUT_ALONE)) {
            cell = vec4(0.0);
        }
    } else if ((isWood(cell.a) || isOil(cell.a)) && nearFire &&
               (u_frame % SPREAD_INTERVAL == 0) && rSpread < SPREAD_CHANCE) {
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
        outColor = (p.x == base.x)
                 ? ((p.y == base.y) ? t00 : t01)
                 : ((p.y == base.y) ? t10 : t11);
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
        if (isVerticallyPassable(t00.a) && r.y < 0.85) {
            swap(t01, t00); dropped = true;
        } else if (isVerticallyPassable(t10.a) && isVerticallyPassable(t11.a) && r.z < 0.3) {
            if (r.x < 0.5) swap(t01, t10);
            else swap(t01, t11);
            dropped = true;
        }
    }
    if (isLiquid(t11.a)) {
        if (isVerticallyPassable(t10.a) && r.y < 0.85) {
            swap(t11, t10); dropped = true;
        } else if (isVerticallyPassable(t00.a) && isVerticallyPassable(t01.a) && r.z < 0.3) {
            if (r.x < 0.5) swap(t11, t00);
            else swap(t11, t01);
            dropped = true;
        }
    }

    if (!dropped) {
        vec4 belowLeft  = safeFetch(base + ivec2(0, -1));
        vec4 belowRight = safeFetch(base + ivec2(1, -1));

        bool belowLeftLiquid  = isLiquid(belowLeft.a);
        bool belowRightLiquid = isLiquid(belowRight.a);

        if (belowLeftLiquid || belowRightLiquid) {
            if ((isLiquid(t01.a) && isHorizontallyPassable(t11.a)) ||
                (isHorizontallyPassable(t01.a) && isLiquid(t11.a))) {
                if (r.w < 0.8) swap(t01, t11);
            }

            if ((isLiquid(t00.a) && isHorizontallyPassable(t10.a)) ||
                (isHorizontallyPassable(t00.a) && isLiquid(t10.a))) {
                if (r.w < 0.8) swap(t00, t10);
            }
        }
    }

    if (isWater(t00.a) && isOil(t01.a)) swap(t00, t01);
    if (isWater(t10.a) && isOil(t11.a)) swap(t10, t11);

    if (isFire(t00.a) && isWater(t01.a)) t01 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t10.a) && isWater(t11.a)) t11 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t01.a) && isWater(t00.a)) t00 = vec4(0.8, 0.8, 0.8, STEAM_A);
    if (isFire(t11.a) && isWater(t10.a)) t10 = vec4(0.8, 0.8, 0.8, STEAM_A);

    bool lifted = false;
    if (isSteam(t00.a)) {
        if (isEmpty(t01.a) && r.x < 0.85) {
            swap(t00, t01); lifted = true;
        } else if (isEmpty(t11.a) && isEmpty(t10.a) && r.y < 0.3) {
            if (r.z < 0.5) swap(t00, t10);
            else swap(t00, t11);
            lifted = true;
        }
    }
    if (isSteam(t10.a)) {
        if (isEmpty(t11.a) && r.x < 0.85) {
            swap(t10, t11); lifted = true;
        } else if (isEmpty(t00.a) && isEmpty(t01.a) && r.y < 0.3) {
            if (r.z < 0.5) swap(t10, t00);
            else swap(t10, t01);
            lifted = true;
        }
    }

    if (!lifted) {
        vec4 above01 = safeFetch(base + ivec2(0, 1));
        vec4 above11 = safeFetch(base + ivec2(1, 1));

        if (r.z < 0.7) {
            if (isSteam(t01.a) && isSteam(above01.a) && isEmpty(t11.a) && isSteam(above11.a))
                swap(t01, t11);
            else if (isSteam(t11.a) && isSteam(above11.a) && isEmpty(t01.a) && isSteam(above01.a))
                swap(t11, t01);
        }

        vec4 above00 = safeFetch(base + ivec2(0, 2));
        vec4 above10 = safeFetch(base + ivec2(1, 2));

        if (r.w < 0.7) {
            if (isSteam(t00.a) && isSteam(above00.a) && isEmpty(t10.a) && isSteam(above10.a))
                swap(t00, t10);
            else if (isSteam(t10.a) && isSteam(above10.a) && isEmpty(t00.a) && isSteam(above00.a))
                swap(t10, t00);
        }
    }

    bool nearFire = false;
    bool nearFuel = false;
    ivec2 offsets[8] = ivec2[8](
        ivec2( 0, 1), ivec2( 1, 0), ivec2( 0,-1), ivec2(-1, 0),
        ivec2( 1, 1), ivec2( 1,-1), ivec2(-1, 1), ivec2(-1,-1)
    );

    for (int i = 0; i < 8; i++) {
        float a = safeFetch(base + offsets[i]).a;
        if (isFire(a)) nearFire = true;
        if (isWood(a) || isOil(a)) nearFuel = true;
    }

    processFire(t00, r.x, r.y, nearFire, nearFuel);
    processFire(t10, r.y, r.z, nearFire, nearFuel);
    processFire(t01, r.z, r.w, nearFire, nearFuel);
    processFire(t11, r.w, r.x, nearFire, nearFuel);

    outColor = (p.x == base.x)
             ? ((p.y == base.y) ? t00 : t01)
             : ((p.y == base.y) ? t10 : t11);
}
