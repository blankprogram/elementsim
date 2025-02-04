#ifndef LIQUID_H
#define LIQUID_H

#include "../IElement.h"
#include "../EmptyCell.h"
#include "../gas/Gas.h"
#include <cmath>
#include <random>
#include <functional>
#include <variant>

class Grid;  // Forward-declare

struct Velocity {
    int x;
    int y;
};

class Liquid : public IElement {
protected:
    Velocity vel;
    double gravity;
    int maxFallSpeed;
    double gravityAccumulator;
    int dispersionRate;
    std::mt19937 rng;
public:
    Liquid();
    // Inline non-virtual behavior.
    inline void behavior(int x, int y, Grid& grid, 
                         std::function<void(int, int, int, int)> move, int step);
protected:
    bool isSwappable(const ElementVariant &cell);
    void applyGravity();
    void capVelocity();
    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step);
    bool disperseHorizontally(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move);
};

#endif // LIQUID_H
