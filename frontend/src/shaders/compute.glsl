#version 300 es
precision highp float;

// --- Uniforms ---
uniform sampler2D u_state;
uniform vec2      u_res;
uniform ivec2     u_offset;
uniform int       u_frame;

in  vec2 v_uv;
out vec4 outColor;

// --- Material Constants ---
const float EPS        = 0.01;
const float EMPTY_A    = 0.00;
const float STEAM_A    = 0.35;
const float WATER_A    = 0.50;
const float OIL_A      = 0.55;
const float SAND_A     = 0.75;
const float WOOD_A     = 0.85;
const float FIRE_A     = 0.90;
const float LAVA_A     = 0.95;
const float STONE_A    = 1.00;
const float OBSIDIAN_A = 0.75;

const vec4 FIRE_COLOR  = vec4(1.0, 0.4, 0.0, FIRE_A);
const vec4 STEAM_COLOR = vec4(0.8, 0.8, 0.8, STEAM_A);

const float SPREAD_CHANCE   = 0.15;
const float BURNOUT_NEAR    = 0.0001;
const float BURNOUT_ALONE   = 0.01;
const int   SPREAD_INTERVAL = 3;

bool isType(float a, float t) { return abs(a - t) < EPS; }
bool isEmpty(float a)         { return a < EPS; }
bool isSteam(float a)         { return isType(a, STEAM_A); }
bool isWater(float a)         { return isType(a, WATER_A); }
bool isOil(float a)           { return isType(a, OIL_A); }
bool isSand(float a)          { return isType(a, SAND_A); }
bool isWood(float a)          { return isType(a, WOOD_A); }
bool isFire(float a)          { return isType(a, FIRE_A); }
bool isLava(float a)          { return isType(a, LAVA_A); }

bool isFluid(float a)         { return isWater(a) || isOil(a); }
bool canFallThrough(float a)  { return isEmpty(a) || isFluid(a) || isSteam(a); }
bool canRiseThrough(float a)  { return isEmpty(a) || isFluid(a) || isSand(a); }

void swap(inout vec4 A, inout vec4 B) { vec4 t = A; A = B; B = t; }

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

vec3 randomObsidianColor(float s) {
    vec3 shades[3] = vec3[3](
        vec3(20, 20, 30) / 255.0,
        vec3(30, 30, 40) / 255.0,
        vec3(40, 40, 50) / 255.0
    );
    return shades[int(floor(s * 3.0))];
}

void handleLavaWater(inout vec4 A, inout vec4 B, float s) {
    if (isLava(A.a) && isWater(B.a)) {
        A = vec4(randomObsidianColor(s), OBSIDIAN_A);
        B = STEAM_COLOR;
    }
}

void igniteIfLava(inout vec4 A, inout vec4 B) {
    if (isLava(A.a) && (isWood(B.a) || isOil(B.a))) B = FIRE_COLOR;
}

void processFire(inout vec4 c, float rS, float rB, bool nearFire, bool nearFuel) {
    if (isFire(c.a)) {
        c.rgb = mix(c.rgb, vec3(1.0, 0.3 + 0.4 * rS, 0.0), 0.5);
        if (rB < (nearFuel ? BURNOUT_NEAR : BURNOUT_ALONE)) c = vec4(0.0);
    } else if ((isWood(c.a) || isOil(c.a)) &&
               nearFire &&
               (u_frame % SPREAD_INTERVAL == 0) &&
               rS < SPREAD_CHANCE) {
        c = FIRE_COLOR;
    }
}

void moveHeavy(
    inout vec4 A0, inout vec4 A1,
    inout vec4 B0, inout vec4 B1,
    float downChance, float diagChance,
    vec4 r
) {
    if (isSand(A1.a) || isLava(A1.a)) {
        if (canFallThrough(A0.a) && r.y < downChance) {
            swap(A1, A0);
        } else if (r.z < diagChance) {
            if (canFallThrough(B0.a)) swap(A1, B0);
            else if (canFallThrough(A0.a)) swap(A1, A0);
        }
    }
    if (isSand(B1.a) || isLava(B1.a)) {
        if (canFallThrough(B0.a) && r.w < downChance) {
            swap(B1, B0);
        } else if (r.x < diagChance) {
            if (canFallThrough(A0.a)) swap(B1, A0);
            else if (canFallThrough(B0.a)) swap(B1, B0);
        }
    }
}

void moveLiquid(
    inout vec4 A0, inout vec4 A1,
    inout vec4 B0, inout vec4 B1,
    float dC, float diagC, float hC,
    vec4 r
) {
    bool moved = false;
    if (isFluid(A1.a) && A0.a < A1.a && r.y < dC) { swap(A1, A0); moved = true; }
    if (isFluid(B1.a) && B0.a < B1.a && r.y < dC) { swap(B1, B0); moved = true; }

    if (!moved && isFluid(A1.a) && B0.a < A1.a && B1.a < A1.a && r.z < diagC) {
        swap(A1, B0); moved = true;
    }
    if (!moved && isFluid(B1.a) && A0.a < B1.a && A1.a < B1.a && r.z < diagC) {
        swap(B1, A0); moved = true;
    }
    if (!moved) {
        if ((isFluid(A0.a) && B0.a < A0.a) || (isFluid(B0.a) && A0.a < B0.a))
            if (r.w < hC) swap(A0, B0);
        if ((isFluid(A1.a) && B1.a < A1.a) || (isFluid(B1.a) && A1.a < B1.a))
            if (r.w < hC) swap(A1, B1);
    }
}

void moveGas(
    inout vec4 A0, inout vec4 A1,
    inout vec4 B0, inout vec4 B1,
    float riseC, float hC,
    vec4 r
) {
    bool moved = false;
    if (isSteam(A0.a) && canRiseThrough(A1.a) && r.y < riseC) { swap(A0, A1); moved = true; }
    if (!moved && isSteam(B0.a) && canRiseThrough(B1.a) && r.y < riseC) { swap(B0, B1); moved = true; }

    if (!moved) {
        if ((isSteam(A0.a) && isEmpty(B0.a)) || (isSteam(B0.a) && isEmpty(A0.a)))
            if (r.w < hC) swap(A0, B0);
        if ((isSteam(A1.a) && isEmpty(B1.a)) || (isSteam(B1.a) && isEmpty(A1.a)))
            if (r.w < hC) swap(A1, B1);
    }
}

void main() {
    ivec2 p    = ivec2(clamp(v_uv * (u_res - 1e-4), vec2(0.0), u_res - 1.0));
    ivec2 base = p - ((p - u_offset) & ivec2(1, 1));

    vec4 t00 = safeFetch(base + ivec2(0, 0));
    vec4 t10 = safeFetch(base + ivec2(1, 0));
    vec4 t01 = safeFetch(base + ivec2(0, 1));
    vec4 t11 = safeFetch(base + ivec2(1, 1));

    if (t00.a == t10.a && t00.a == t01.a && t00.a == t11.a) {
        outColor = (p.x == base.x ? (p.y == base.y ? t00 : t01)
                                  : (p.y == base.y ? t10 : t11));
        return;
    }

    vec4 r = hash43(vec3(base, float(u_frame)));

    moveHeavy(t00, t01, t10, t11, 0.9, 0.5, r);
    if (isWater(t01.a) || isWater(t11.a))
        moveLiquid(t00, t01, t10, t11, 0.95, 0.3, 0.8, r);
    if (isOil(t01.a) || isOil(t11.a))
        moveLiquid(t00, t01, t10, t11, 0.85, 0.25, 0.6, r);
    moveGas(t00, t01, t10, t11, 0.3, 0.5, r);

    igniteIfLava(t00, t01);
    igniteIfLava(t10, t11);
    igniteIfLava(t01, t00);
    igniteIfLava(t11, t10);

    handleLavaWater(t00, t01, r.x);
    handleLavaWater(t10, t11, r.y);
    handleLavaWater(t01, t00, r.z);
    handleLavaWater(t11, t10, r.w);

    if (isWater(t00.a) && isOil(t01.a)) swap(t00, t01);
    if (isWater(t10.a) && isOil(t11.a)) swap(t10, t11);

    if (isFire(t00.a) && isWater(t01.a)) t01 = STEAM_COLOR;
    if (isFire(t10.a) && isWater(t11.a)) t11 = STEAM_COLOR;
    if (isFire(t01.a) && isWater(t00.a)) t00 = STEAM_COLOR;
    if (isFire(t11.a) && isWater(t10.a)) t10 = STEAM_COLOR;

    bool nearFire = isFire(t00.a) || isFire(t10.a) || isFire(t01.a) || isFire(t11.a);
    bool nearFuel = isWood(t00.a) || isOil(t00.a) ||
                    isWood(t10.a) || isOil(t10.a) ||
                    isWood(t01.a) || isOil(t01.a) ||
                    isWood(t11.a) || isOil(t11.a);

    processFire(t00, r.x, r.y, nearFire, nearFuel);
    processFire(t10, r.y, r.z, nearFire, nearFuel);
    processFire(t01, r.z, r.w, nearFire, nearFuel);
    processFire(t11, r.w, r.x, nearFire, nearFuel);

    outColor = (p.x == base.x ? (p.y == base.y ? t00 : t01)
                              : (p.y == base.y ? t10 : t11));
}
