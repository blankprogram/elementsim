#ifndef MOVABLE_SOLID_H
#define MOVABLE_SOLID_H

#include "../Solid.h"
#include "../../EmptyCell.h"
#include "../../gas/Gas.h"
#include "../../liquid/Liquid.h"
#include <cmath>
#include <random>
#include <functional>

// Forward declare Grid.
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
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override;
protected:
    bool isSwappable(Element* cell);
    void applyGravity();
    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step);
    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move);
};

#endif // MOVABLE_SOLID_H
