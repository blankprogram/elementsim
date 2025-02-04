#ifndef MOVABLE_SOLID_H
#define MOVABLE_SOLID_H

#include "../Solid.h"           // Make sure Solid.h now uses IElement!

#include <cmath>
#include <random>
#include <functional>
#include <variant>
#include <vector>

// Forward-declare Grid.
class Grid;

struct VelocityMS {
    int x;
    int y;
};

class MovableSolid : public Solid {
protected:
    VelocityMS vel;
    double gravity;
    int maxFallSpeed;
    double gravityAccumulator;
public:
    MovableSolid();

    // Inline non-virtual behavior.
    inline void behavior(int x, int y, Grid& grid,
                         std::function<void(int, int, int, int)> move, int step);

protected:
    bool isSwappable(const ElementVariant &cell);
    void applyGravity();
    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step);
    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move);
};

#endif // MOVABLE_SOLID_H
