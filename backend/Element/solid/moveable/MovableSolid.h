#ifndef MOVABLE_SOLID_H
#define MOVABLE_SOLID_H

#include "../Solid.h"           // Base type that now is derived from IElement.
#include "../../ElementVariant.h" // Defines: using ElementVariant = std::variant<EmptyCell, Sand, Stone, Water, Helium>;
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

    // Now an inline (non‑virtual) behavior.
    inline void behavior(int x, int y, Grid& grid, 
                         std::function<void(int, int, int, int)> move, int step);

protected:
    // Note: Instead of taking an Element pointer, we take a const reference to the variant.
    bool isSwappable(const ElementVariant &cell);
    void applyGravity();
    bool tryFall(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move);
    bool tryRandomDiagonalMovement(int x, int y, Grid& grid, std::function<void(int, int, int, int)> move, int step);
    bool tryMove(int x, int y, int targetX, int targetY, Grid& grid, std::function<void(int, int, int, int)> move);
};

#endif // MOVABLE_SOLID_H
