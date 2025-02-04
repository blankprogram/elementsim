#ifndef LIQUID_H
#define LIQUID_H

#include "../Element.h"
#include "../EmptyCell.h"
#include "../gas/Gas.h"
#include <cmath>
#include <random>
#include <functional>

// Forward-declare Grid.
class Grid;

struct Velocity {
    int x;
    int y;
};

class Liquid : public Element {
protected:
    Velocity vel;
    double gravity;
    int maxFallSpeed;
    double gravityAccumulator;
    int dispersionRate;
    std::mt19937 rng;
public:
    Liquid();
    virtual void behavior(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step) override;

    // Mark as liquid.
    virtual bool isLiquid() const override { return true; }
    
protected:
    bool isSwappable(Element* cell);
    void applyGravity();
    void capVelocity();
    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step);
    bool disperseHorizontally(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move);
};

#endif // LIQUID_H
